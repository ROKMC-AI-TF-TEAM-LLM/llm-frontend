import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCapModel } from '../three/createCapModel';
import './scene.css';

export interface MarineCapSceneProps {
  progress: number;
  interactive?: boolean;
  resetKey?: number;
  compact?: boolean;
  reducedMotion?: boolean;
  className?: string;
  onAvailabilityChange?: (available: boolean) => void;
}

interface SceneHandle {
  setProgress: (progress: number, reducedMotion: boolean) => void;
  setInteractive: (interactive: boolean) => void;
  resetCamera: () => void;
}

const clampProgress = (value: number) =>
  Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;

/** Soft studio contact shadow, avoiding a hard directional silhouette or extra shadow pass. */
function createContactShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(38, 31, 25, 0.28)');
  gradient.addColorStop(0.4, 'rgba(38, 31, 25, 0.15)');
  gradient.addColorStop(1, 'rgba(38, 31, 25, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0.65,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 3.4), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, -0.455, 0.3);
  return { mesh, texture, material };
}

function StaticCap({ progress }: { progress: number }) {
  const running = progress >= 0.5;
  return (
    <svg className="cap-scene__static-cap" viewBox="0 0 128 104" aria-hidden="true">
      <ellipse cx="65" cy="88" rx="43" ry="6" fill="currentColor" opacity="0.07" />
      <path
        d={running
          ? 'M24 34 36 21 88 21 104 34 98 67 28 67Z'
          : 'M23 64C23 4 101 4 103 64L99 72H27Z'}
        fill={running ? '#536047' : '#c91e32'}
      />
      {running ? (
        <g fill="#29352c" opacity="0.8">
          <path d="M30 35h14v7H33v9h-8ZM66 24h13v7h10v8H73v-7h-7ZM77 48h20v8H85v9H73v-9h4Z" />
          <path d="M45 52h15v8H43v-4H31v-7h14Z" fill="#9ca28c" />
        </g>
      ) : (
        <g fill="none" stroke="#f66a72" strokeWidth="1" opacity="0.55">
          <path d="M63 18C42 29 37 48 37 66M65 18C86 30 91 49 91 66M64 18v47" />
        </g>
      )}
      <path
        d="M28 63Q64 54 100 63L112 80Q99 94 64 80Q30 94 16 80Z"
        fill={running ? '#46513d' : '#ac142a'}
      />
      <path d="M24 78Q43 85 64 73Q85 85 104 78" stroke="white" fill="none" opacity="0.2" />
      {running ? <rect x="58" y="42" width="13" height="13" rx="2" fill="white" /> : (
        <path d="m56 49 8-8 8 8m-8-7v15" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/**
 * A demand-rendered Three.js viewport. Animation timing belongs to the caller;
 * a stationary cap schedules no frames, including while a request is running.
 */
export function MarineCapScene({
  progress,
  interactive = false,
  resetKey = 0,
  compact = false,
  reducedMotion = false,
  className = '',
  onAvailabilityChange,
}: MarineCapSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const availabilityCallback = useRef(onAvailabilityChange);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    availabilityCallback.current = onAvailabilityChange;
  }, [onAvailabilityChange]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let contextLost = false;
    let failed = false;
    let intersecting = true;
    let frame = 0;
    let lastAvailability: boolean | null = null;
    let renderer: THREE.WebGLRenderer | undefined;
    let controls: OrbitControls | undefined;
    let model: ReturnType<typeof createCapModel> | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let previousFitDistance = 0;
    let width = 0;
    let height = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    const cameraTarget = new THREE.Vector3(0, compact ? 0.52 : 0.25, 0.25);
    const viewDirection = new THREE.Vector3(0.42, 0.4, 0.82).normalize();
    const contact = compact ? null : createContactShadow();
    const keyLight = new THREE.DirectionalLight(0xfff3e6, 2.4);

    const reportAvailability = (next: boolean) => {
      if (next === lastAvailability || disposed) return;
      lastAvailability = next;
      // Setup errors and WebGL events can arrive during an effect commit.
      queueMicrotask(() => {
        if (disposed) return;
        setAvailable(next);
        availabilityCallback.current?.(next);
      });
    };

    const render = () => {
      frame = 0;
      if (disposed || failed || contextLost || !intersecting || document.hidden || !renderer || !width || !height) return;
      try {
        renderer.render(scene, camera);
        if (!failed && !contextLost) reportAvailability(true);
      } catch {
        failed = true;
        reportAvailability(false);
      }
    };

    const requestRender = () => {
      if (!frame && !disposed && !failed && !contextLost && intersecting && !document.hidden) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const fitDistance = () => Math.max(compact ? 5.1 : 6.1, (compact ? 5.1 : 5.4) / camera.aspect);

    const resetCamera = () => {
      previousFitDistance = fitDistance();
      camera.position.copy(cameraTarget).addScaledVector(viewDirection, previousFitDistance);
      camera.lookAt(cameraTarget);
      controls?.target.copy(cameraTarget);
      controls?.update();
      requestRender();
    };

    const resize = () => {
      if (!renderer || disposed) return;
      const bounds = mount.getBoundingClientRect();
      width = Math.round(bounds.width);
      height = Math.round(bounds.height);
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      const nextFitDistance = fitDistance();
      if (previousFitDistance) {
        camera.position.sub(cameraTarget).multiplyScalar(nextFitDistance / previousFitDistance).add(cameraTarget);
        previousFitDistance = nextFitDistance;
        controls?.update();
      } else {
        resetCamera();
      }
      requestRender();
    };

    const handleVisibility = () => {
      if (document.hidden && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      } else {
        requestRender();
      }
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      reportAvailability(false);
    };

    const handleContextRestored = () => {
      contextLost = false;
      failed = false;
      requestRender();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!controls?.enabled) return;
      if (event.key === 'Home') {
        event.preventDefault();
        resetCamera();
        return;
      }
      const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      switch (event.key) {
        case 'ArrowLeft': spherical.theta -= 0.12; break;
        case 'ArrowRight': spherical.theta += 0.12; break;
        case 'ArrowUp': spherical.phi -= 0.1; break;
        case 'ArrowDown': spherical.phi += 0.1; break;
        case '+':
        case '=': spherical.radius *= 0.92; break;
        case '-': spherical.radius *= 1.08; break;
        default: return;
      }
      event.preventDefault();
      spherical.phi = THREE.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
      spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
      camera.position.setFromSpherical(spherical).add(controls.target);
      controls.update();
      requestRender();
    };

    try {
      const mobile = window.matchMedia('(max-width: 640px), (pointer: coarse)').matches;
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.debug.onShaderError = () => {
        failed = true;
        reportAvailability(false);
      };

      renderer.domElement.className = 'cap-scene__canvas';
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);
      renderer.domElement.addEventListener('keydown', handleKeyDown);
      mount.appendChild(renderer.domElement);

      model = createCapModel({ detail: mobile || compact ? 'low' : 'high' });
      scene.add(model.group);
      scene.add(new THREE.HemisphereLight(0xfffaf2, 0x737a71, 1.4));
      keyLight.position.set(-3.5, 6, 4);
      scene.add(keyLight);
      const fill = new THREE.DirectionalLight(0xe4edff, 0.85);
      fill.position.set(4, 2.5, 2);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffffff, 1.1);
      rim.position.set(0, 4, -4);
      scene.add(rim);
      if (contact) scene.add(contact.mesh);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = false;
      controls.enablePan = false;
      controls.autoRotate = false;
      controls.minDistance = 3.1;
      controls.maxDistance = 11;
      controls.minPolarAngle = 0.15;
      controls.maxPolarAngle = Math.PI * 0.7;
      controls.rotateSpeed = 0.65;
      controls.zoomSpeed = 0.7;
      controls.addEventListener('change', requestRender);

      sceneRef.current = {
        setProgress: (nextProgress, reduceMotion) => {
          if (!model) return;
          const amount = clampProgress(nextProgress);
          const arc = Math.sin(amount * Math.PI);
          model.setMorph(amount);
          model.group.rotation.set(
            reduceMotion ? 0 : Math.sin(amount * Math.PI * 2) * 0.16,
            reduceMotion ? 0 : amount * Math.PI * 2,
            reduceMotion ? 0 : -arc * 0.12,
          );
          model.group.position.y = reduceMotion ? 0 : arc * 0.32;
          if (contact) {
            contact.material.opacity = 0.65 - (reduceMotion ? 0 : arc * 0.28);
            contact.mesh.scale.setScalar(1 + (reduceMotion ? 0 : arc * 0.12));
          }
          requestRender();
        },
        setInteractive: (nextInteractive) => {
          if (!controls || !renderer) return;
          controls.enabled = nextInteractive;
          renderer.domElement.tabIndex = nextInteractive ? 0 : -1;
          renderer.domElement.style.pointerEvents = nextInteractive ? 'auto' : 'none';
          renderer.domElement.style.touchAction = nextInteractive ? 'none' : 'auto';
          renderer.domElement.setAttribute('aria-hidden', nextInteractive ? 'false' : 'true');
          if (nextInteractive) {
            renderer.domElement.setAttribute('role', 'img');
            renderer.domElement.setAttribute('aria-label', '3D 모자 미리보기. 드래그 또는 방향키로 회전, 더하기·빼기로 확대·축소, Home 키로 시점 초기화.');
          }
        },
        resetCamera,
      };

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
      }
      if (typeof IntersectionObserver !== 'undefined') {
        intersecting = false;
        intersectionObserver = new IntersectionObserver(([entry]) => {
          intersecting = entry?.isIntersecting ?? false;
          if (!intersecting && frame) {
            window.cancelAnimationFrame(frame);
            frame = 0;
          }
          if (intersecting) requestRender();
        });
        intersectionObserver.observe(mount);
      }
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', handleVisibility);
      resize();
    } catch {
      failed = true;
      reportAvailability(false);
    }

    return () => {
      disposed = true;
      sceneRef.current = null;
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      controls?.removeEventListener('change', requestRender);
      controls?.dispose();
      renderer?.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer?.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      renderer?.domElement.removeEventListener('keydown', handleKeyDown);
      model?.dispose();
      contact?.mesh.geometry.dispose();
      contact?.material.dispose();
      contact?.texture.dispose();
      keyLight.shadow.dispose();
      scene.clear();
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
  }, [compact]);

  useEffect(() => {
    sceneRef.current?.setProgress(progress, reducedMotion);
  }, [progress, reducedMotion, compact]);

  useEffect(() => {
    sceneRef.current?.setInteractive(interactive);
  }, [interactive, compact]);

  useEffect(() => {
    sceneRef.current?.resetCamera();
  }, [resetKey, compact]);

  return (
    <div
      className={`cap-scene${compact ? ' cap-scene--compact' : ''}${interactive ? ' cap-scene--interactive' : ''} ${className}`}
      data-renderer={available === true ? 'webgl' : available === false ? 'fallback' : 'loading'}
    >
      <div ref={mountRef} className="cap-scene__mount" style={{ visibility: available === true ? 'visible' : 'hidden' }} />
      {available !== true && (
        <div className="cap-scene__fallback" role={compact ? undefined : 'img'} aria-label={compact ? undefined : available === false ? '3D를 사용할 수 없어 모자의 정적 미리보기를 표시합니다.' : '3D 모자 미리보기를 준비하고 있습니다.'} aria-hidden={compact || undefined}>
          <StaticCap progress={clampProgress(progress)} />
          {!compact && (
            <span className="cap-scene__fallback-label">
              {available === false ? '3D를 사용할 수 없어 정적 미리보기를 표시합니다.' : '3D 미리보기 준비 중'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default MarineCapScene;
