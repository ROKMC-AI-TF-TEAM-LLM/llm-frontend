import * as THREE from 'three';

type FabricMaps = {
  red: THREE.CanvasTexture;
  camouflage: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  ao: THREE.CanvasTexture;
};

type CachedMaps = { maps: FabricMaps; references: number };
const mapCache = new Map<number, CachedMaps>();

function canvas(size: number) {
  const surface = document.createElement('canvas');
  surface.width = surface.height = size;
  const context = surface.getContext('2d');
  if (!context) throw new Error('A 2D canvas is required to prepare the cap fabrics.');
  return { surface, context };
}

function randomGenerator(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

function texture(surface: HTMLCanvasElement, color = false) {
  const result = new THREE.CanvasTexture(surface);
  result.wrapS = result.wrapT = THREE.RepeatWrapping;
  result.anisotropy = 4;
  if (color) result.colorSpace = THREE.SRGBColorSpace;
  return result;
}

/** Original, reference-inspired pixel clusters; this is not an official camouflage asset. */
function createFabricMaps(size: number): FabricMaps {
  const red = canvas(size);
  const camouflage = canvas(size);
  const normal = canvas(size);
  const roughness = canvas(size);
  const ao = canvas(size);
  const random = randomGenerator(19730415);
  const grid = 72;
  const cell = size / grid;
  const palette = ['#444b40', '#606b50', '#7d8669', '#969987', '#aaa99b', '#303b33'];
  camouflage.context.fillStyle = palette[1];
  camouflage.context.fillRect(0, 0, size, size);

  // Three scales of connected, axis-aligned pixel clusters create a cloth print,
  // not independent random green pixels. Wrap cluster edges to keep it tileable.
  for (let layer = 0; layer < 3; layer++) {
    const count = [110, 200, 250][layer];
    for (let cluster = 0; cluster < count; cluster++) {
      const x = Math.floor(random() * grid);
      const y = Math.floor(random() * grid);
      const colorIndex = Math.floor(random() * palette.length);
      camouflage.context.fillStyle = palette[colorIndex];
      const span = [7, 4, 2][layer];
      for (let step = 0; step < 3 + Math.floor(random() * 5); step++) {
        const bx = x + Math.floor(random() * span) - span / 2;
        const by = y + Math.floor(random() * span) - span / 2;
        const width = 1 + Math.floor(random() * span);
        const height = 1 + Math.floor(random() * Math.max(2, span / 2));
        for (const dx of [-grid, 0, grid]) {
          for (const dy of [-grid, 0, grid]) {
            camouflage.context.fillRect(Math.floor((bx + dx) * cell), Math.floor((by + dy) * cell), Math.ceil(width * cell), Math.ceil(height * cell));
          }
        }
      }
    }
  }

  const redPixels = red.context.createImageData(size, size);
  const camouflagePixels = camouflage.context.getImageData(0, 0, size, size);
  const normalPixels = normal.context.createImageData(size, size);
  const roughnessPixels = roughness.context.createImageData(size, size);
  const aoPixels = ao.context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      // Twill diagonal ridges with a finer alternating warp and weft.
      const phase = (x + y * 0.72) * Math.PI * 0.53;
      const twill = Math.sin(phase);
      const warp = Math.sin(x * Math.PI * 0.8) * Math.cos(y * Math.PI * 0.8);
      const fiber = (random() - 0.5) * 0.035;
      const light = 0.95 + twill * 0.034 + warp * 0.016 + fiber;
      redPixels.data[index] = Math.round(211 * light);
      redPixels.data[index + 1] = Math.round(15 * light);
      redPixels.data[index + 2] = Math.round(34 * light);
      redPixels.data[index + 3] = 255;
      for (let c = 0; c < 3; c++) camouflagePixels.data[index + c] *= light;
      normalPixels.data[index] = 128 + Math.round(Math.cos(phase) * 30 + warp * 7);
      normalPixels.data[index + 1] = 128 + Math.round(Math.cos(phase) * 21 + warp * 7);
      normalPixels.data[index + 2] = 249;
      normalPixels.data[index + 3] = 255;
      const rough = 225 + Math.round(twill * 8 + random() * 12);
      const occlusion = 245 + Math.round(twill * 7);
      for (let c = 0; c < 3; c++) {
        roughnessPixels.data[index + c] = rough;
        aoPixels.data[index + c] = occlusion;
      }
      roughnessPixels.data[index + 3] = aoPixels.data[index + 3] = 255;
    }
  }
  red.context.putImageData(redPixels, 0, 0);
  camouflage.context.putImageData(camouflagePixels, 0, 0);
  normal.context.putImageData(normalPixels, 0, 0);
  roughness.context.putImageData(roughnessPixels, 0, 0);
  ao.context.putImageData(aoPixels, 0, 0);
  return {
    red: texture(red.surface, true), camouflage: texture(camouflage.surface, true),
    normal: texture(normal.surface), roughness: texture(roughness.surface), ao: texture(ao.surface),
  };
}

export function acquireFabricMaps(detail: 'low' | 'high') {
  const size = detail === 'high' ? 1024 : 512;
  let cached = mapCache.get(size);
  if (!cached) {
    cached = { maps: createFabricMaps(size), references: 0 };
    mapCache.set(size, cached);
  }
  cached.references++;
  const maps = cached.maps;
  return {
    maps,
    release() {
      const entry = mapCache.get(size);
      if (entry && --entry.references === 0) {
        Object.values(entry.maps).forEach((item) => item.dispose());
        mapCache.delete(size);
      }
    },
  };
}

export function createMorphMaterial(
  maps: FabricMaps,
  morph: { value: number },
  options: { red?: THREE.Texture; camouflage?: THREE.Texture; tint?: THREE.ColorRepresentation; transparent?: boolean } = {},
) {
  const material = new THREE.MeshStandardMaterial({
    color: options.tint ?? '#ffffff',
    map: options.red ?? maps.red,
    normalMap: maps.normal,
    normalScale: new THREE.Vector2(0.36, 0.36),
    roughnessMap: maps.roughness,
    roughness: 1,
    aoMap: maps.ao,
    aoMapIntensity: 0.32,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: options.transparent ?? false,
    alphaTest: options.transparent ? 0.03 : 0,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.capMorph = morph;
    shader.uniforms.capCamouflage = { value: options.camouflage ?? maps.camouflage };
    shader.vertexShader = 'varying vec3 vCapSurface;\nvarying vec3 vCapSurfaceNormal;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <morphnormal_vertex>', '#include <morphnormal_vertex>\nvCapSurfaceNormal = objectNormal;');
    shader.vertexShader = shader.vertexShader.replace(
      '#include <morphtarget_vertex>',
      '#include <morphtarget_vertex>\nvCapSurface = transformed;',
    );
    shader.fragmentShader = `
      uniform float capMorph;
      uniform sampler2D capCamouflage;
      varying vec3 vCapSurface;
      varying vec3 vCapSurfaceNormal;
      vec4 capProjected(sampler2D clothMap) {
        vec3 weights = pow(abs(vCapSurfaceNormal), vec3(6.0));
        weights /= max(weights.x + weights.y + weights.z, 0.0001);
        vec3 cloth = vCapSurface * 0.48;
        return texture2D(clothMap, cloth.zy) * weights.x
          + texture2D(clothMap, cloth.xz) * weights.y
          + texture2D(clothMap, cloth.xy) * weights.z;
      }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec4 trainingFabric = ${options.transparent ? 'texture2D(map, vMapUv)' : 'capProjected(map)'};
        vec4 fieldFabric = ${options.transparent ? 'texture2D(capCamouflage, vMapUv)' : 'capProjected(capCamouflage)'};
        float clothPosition = clamp((vCapSurface.y + 0.3) * 0.34 + (vCapSurface.x + 1.1) * 0.16 + sin(vCapSurface.x * 8.0 + vCapSurface.y * 11.0) * 0.025, 0.0, 1.0);
        float clothTransition = smoothstep(clothPosition - 0.12, clothPosition + 0.12, capMorph * 1.5 - 0.23);
        diffuseColor *= mix(trainingFabric, fieldFabric, clothTransition);
      #endif
    `);
    if (!options.transparent) {
      // Project every fabric channel consistently; no radial texture singularity
      // remains on the flat top, including the micro-normal/roughness weave.
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <normal_fragment_maps>', THREE.ShaderChunk.normal_fragment_maps.replaceAll('texture2D( normalMap, vNormalMapUv )', 'capProjected(normalMap)'))
        .replace('#include <roughnessmap_fragment>', THREE.ShaderChunk.roughnessmap_fragment.replaceAll('texture2D( roughnessMap, vRoughnessMapUv )', 'capProjected(roughnessMap)'))
        .replace('#include <aomap_fragment>', THREE.ShaderChunk.aomap_fragment.replaceAll('texture2D( aoMap, vAoMapUv )', 'capProjected(aoMap)'));
    }
  };
  material.customProgramCacheKey = () => options.transparent ? 'cap-embroidery-mask-v2' : 'cap-triplanar-fabric-mask-v2';
  return material;
}

/** Drawn from scratch: a stylized eagle, anchor and star, not the official insignia. */
export function createInsigniaTextures() {
  const size = 512;
  const training = canvas(size);
  const field = canvas(size);

  const drawEmblem = (ctx: CanvasRenderingContext2D, subdued: boolean) => {
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = subdued ? '#404a37' : '#252c2e';
    ctx.lineWidth = 8;

    // Anchor, shank and curled flukes, behind the eagle and star.
    ctx.save();
    ctx.translate(0, 47);
    ctx.rotate(-0.32);
    ctx.strokeStyle = subdued ? '#414a38' : '#ddad34';
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.moveTo(0, -95); ctx.lineTo(0, 102);
    ctx.moveTo(-72, -55); ctx.lineTo(72, -55);
    ctx.moveTo(-94, 32); ctx.bezierCurveTo(-90, 149, 90, 149, 94, 32);
    ctx.stroke();
    ctx.lineWidth = 13;
    ctx.beginPath(); ctx.arc(0, -116, 21, 0, Math.PI * 2); ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * 94, 24); ctx.lineTo(side * 121, 61); ctx.lineTo(side * 70, 52); ctx.closePath();
      ctx.fillStyle = subdued ? '#414a38' : '#e6b63c'; ctx.fill();
    }
    ctx.restore();

    // Individually stitched feathers form two swept wings.
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1);
      for (let feather = 7; feather >= 0; feather--) {
        const tipX = 70 + feather * 16;
        const tipY = -50 - feather * 8;
        ctx.beginPath(); ctx.moveTo(12, -95); ctx.quadraticCurveTo(tipX * 0.66, -64, tipX + 26, tipY - 23);
        ctx.quadraticCurveTo(tipX + 33, tipY + 1, tipX - 10, tipY + 24);
        ctx.quadraticCurveTo(60, -11, 13, -39); ctx.closePath();
        ctx.fillStyle = subdued ? '#414b39' : feather % 2 ? '#d3d7ce' : '#eef0df';
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = subdued ? '#394234' : '#929e99'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(35, -73); ctx.lineTo(tipX + 8, tipY - 3); ctx.stroke();
        ctx.strokeStyle = subdued ? '#35402f' : '#252c2e'; ctx.lineWidth = 8;
      }
      ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(-23, -114); ctx.quadraticCurveTo(-41, -154, -11, -160);
    ctx.lineTo(27, -155); ctx.lineTo(44, -143); ctx.lineTo(18, -131);
    ctx.quadraticCurveTo(35, -76, 17, -29); ctx.lineTo(38, 15); ctx.lineTo(0, 0);
    ctx.lineTo(-39, 15); ctx.lineTo(-18, -29); ctx.quadraticCurveTo(-37, -70, -23, -114);
    ctx.fillStyle = subdued ? '#374131' : '#e8eade'; ctx.fill(); ctx.stroke();
    if (!subdued) {
      ctx.fillStyle = '#d7a721'; ctx.beginPath(); ctx.moveTo(25, -153); ctx.lineTo(48, -142); ctx.lineTo(26, -135); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#181e1a'; ctx.beginPath(); ctx.arc(12, -146, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Nautical five-point star. Alternating facets retain legibility at button size.
    ctx.save(); ctx.translate(0, 52);
    const points: [number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const radius = i % 2 ? 40 : 94;
      points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
    }
    for (let i = 0; i < 10; i++) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(...points[i]); ctx.lineTo(...points[(i + 1) % 10]); ctx.closePath();
      ctx.fillStyle = subdued ? '#374230' : i % 2 ? '#26302e' : '#f2f1dc'; ctx.fill();
    }
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke();
    ctx.restore();
    ctx.restore();
  };

  drawEmblem(training.context, false);
  field.context.fillStyle = '#6a7257';
  field.context.fillRect(22, 22, 468, 468);
  field.context.strokeStyle = '#424b37'; field.context.lineWidth = 20;
  field.context.strokeRect(31, 31, 450, 450);
  field.context.strokeStyle = '#899074'; field.context.lineWidth = 6;
  field.context.strokeRect(43, 43, 426, 426);
  field.context.save(); field.context.translate(256, 273); field.context.scale(0.8, 0.9); field.context.translate(-256, -256);
  drawEmblem(field.context, true); field.context.restore();

  // A fine alternating thread overlay catches studio lighting without metalness.
  for (const { context } of [training, field]) {
    context.globalCompositeOperation = 'source-atop';
    context.strokeStyle = 'rgba(255,255,235,0.13)'; context.lineWidth = 1;
    for (let y = 0; y < size; y += 4) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(size, y + 32); context.stroke();
    }
    context.globalCompositeOperation = 'source-over';
  }
  return { red: texture(training.surface, true), camouflage: texture(field.surface, true) };
}
