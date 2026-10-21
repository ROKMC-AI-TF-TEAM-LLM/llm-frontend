import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { acquireFabricMaps, createInsigniaTextures, createMorphMaterial } from './fabricMaterials';

type Variant = 0 | 1;
type Surface = (u: number, v: number, variant: Variant) => THREE.Vector3;
type Path = (t: number, variant: Variant) => THREE.Vector3;
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;

// Two initially closed sectors unfold into the seventh/eighth field-cap panels.
// This mapping also keeps each seam attached to its own crown vertices mid-morph.
function trainingAngle(u: number) {
  const angles = [0, 1 / 6, 2 / 6, 0.5, 0.5, 2 / 3, 5 / 6, 1];
  const sector = u * 8 - 0.5;
  const index = Math.floor(sector);
  const fraction = sector - index;
  const a = index < 0 ? 0 : angles[index];
  const b = index >= 7 ? 1 : angles[index + 1];
  return THREE.MathUtils.lerp(a, b, fraction) * TAU;
}

/** A shared parameterization makes every intermediate silhouette a real mesh. */
function crownPoint(u: number, v: number, variant: Variant) {
  const theta = variant ? u * TAU : trainingAngle(u);
  let radius: number;
  let y: number;
  if (variant === 0) {
    radius = 1.02 * Math.pow(Math.max(0, Math.cos(v * Math.PI / 2)), 0.8);
    y = 1.29 * Math.sin(v * Math.PI / 2);
    const panel = Math.pow(Math.abs(Math.sin(theta * 3)), 0.7);
    radius += (panel - 0.42) * 0.014 * Math.sin(v * Math.PI);
    // Restrained fabric puckering at the lower sewn edge.
    radius += Math.sin(theta * 31 + v * 12) * 0.005 * Math.exp(-v * 11);
  } else {
    const shoulder = 0.76;
    const sideProgress = Math.min(v / shoulder, 1);
    radius = 0.91 + sideProgress * 0.09;
    y = sideProgress * 0.7;
    if (v > shoulder) {
      const top = (v - shoulder) / (1 - shoulder);
      radius *= 1 - top;
      y += Math.sin(top * Math.PI) * 0.014;
    }
    // Flat front/back and six more planar facets. Corners occur at 22.5°.
    const octant = ((theta + Math.PI / 8) % (Math.PI / 4) + Math.PI / 4) % (Math.PI / 4) - Math.PI / 8;
    radius /= Math.cos(octant);
    radius += Math.sin(theta * 27 + v * 6) * 0.0025 * Math.sin(sideProgress * Math.PI);
  }
  return new THREE.Vector3(Math.sin(theta) * radius, y, Math.cos(theta) * radius * 0.95);
}

function brimPoint(u: number, v: number, variant: Variant) {
  const angle = (u - 0.5) * Math.PI;
  const across = Math.sin(angle);
  const width = 0.9 + v * 0.11;
  const x = across * width;
  const rootX = Math.abs(across * 0.9);
  const fieldCorner = 0.91 * Math.tan(Math.PI / 8);
  const back = variant
    ? (rootX <= fieldCorner ? 0.91 : 0.91 * Math.SQRT2 - rootX) * 0.95 - 0.008
    : Math.sqrt(Math.max(0, 1.02 * 1.02 - rootX * rootX)) * 0.95 - 0.008;
  const front = 0.43 + Math.cos(angle) * (variant ? 1.43 : 1.51);
  // Sew the visor root into the exact lower crown perimeter. The bill bends
  // only beyond that attachment; lateral curvature must also vanish at v=0.
  const y = 0.005 - v * (variant ? 0.13 : 0.23) - across * across * (variant ? 0.08 : 0.145) * v + Math.sin(v * Math.PI) * 0.04;
  return new THREE.Vector3(x, y, THREE.MathUtils.lerp(back, front, v));
}

function morphGeometry(surface: Surface, columns: number, rows: number, uvScale: [number, number] = [1, 1]) {
  const positions: number[][] = [[], []];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      const u = column / columns;
      const v = row / rows;
      for (const variant of [0, 1] as const) {
        const point = surface(u, v, variant);
        positions[variant].push(point.x, point.y, point.z);
      }
      uvs.push(u * uvScale[0], v * uvScale[1]);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column;
        const b = a + 1;
        const c = a + columns + 1;
        const d = c + 1;
        indices.push(a, b, d, a, d, c);
      }
    }
  }
  return buildMorphGeometry(positions, uvs, indices);
}

function buildMorphGeometry(positions: number[][], uvs: number[], indices: number[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions[0], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('uv1', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const target = new THREE.BufferGeometry();
  target.setAttribute('position', new THREE.Float32BufferAttribute(positions[1], 3));
  target.setIndex(indices);
  target.computeVertexNormals();
  geometry.morphAttributes.position = [target.getAttribute('position')];
  geometry.morphAttributes.normal = [target.getAttribute('normal')];
  geometry.computeBoundingSphere();
  target.dispose();
  return geometry;
}

/** Tube frames and both endpoint geometries are allocated once, before animation. */
function morphTube(path: Path, segments: number, radius: number, radialSegments = 5, endRadius = radius) {
  return morphGeometry((u, v, variant) => {
    const center = path(v, variant);
    const tangent = path(Math.min(1, v + 0.001), variant).sub(path(Math.max(0, v - 0.001), variant)).normalize();
    const reference = Math.abs(tangent.y) > 0.94 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(tangent, reference).normalize();
    const normal = new THREE.Vector3().crossVectors(side, tangent).normalize();
    const r = variant ? endRadius : radius;
    return center.addScaledVector(side, Math.cos(u * TAU) * r).addScaledVector(normal, Math.sin(u * TAU) * r);
  }, radialSegments, segments, [0.1, 1]);
}

/** All tiny stitch dashes share one draw call and one morph target. */
function stitchGeometry(paths: Path[], stitches: number, thickness: number) {
  const positions: number[][] = [[], []];
  const uvs: number[] = [];
  const indices: number[] = [];
  let offset = 0;
  for (const path of paths) {
    for (let stitch = 0; stitch < stitches; stitch++) {
      for (const variant of [0, 1] as const) {
        const a = path((stitch + 0.13) / stitches, variant);
        const b = path((stitch + 0.7) / stitches, variant);
        const tangent = b.clone().sub(a).normalize();
        const reference = Math.abs(tangent.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(tangent, reference).normalize().multiplyScalar(thickness);
        const normal = new THREE.Vector3().crossVectors(side, tangent).normalize().multiplyScalar(thickness);
        for (const point of [a, b]) {
          for (let corner = 0; corner < 4; corner++) {
            const vertex = point.clone().addScaledVector(side, Math.cos(corner * Math.PI / 2)).addScaledVector(normal, Math.sin(corner * Math.PI / 2));
            positions[variant].push(vertex.x, vertex.y, vertex.z);
          }
        }
      }
      for (let corner = 0; corner < 8; corner++) uvs.push((corner % 4) / 4, corner < 4 ? 0 : 0.03);
      for (let corner = 0; corner < 4; corner++) {
        const next = (corner + 1) % 4;
        indices.push(offset + corner, offset + next, offset + 4 + next, offset + corner, offset + 4 + next, offset + 4 + corner);
      }
      offset += 8;
    }
  }
  return buildMorphGeometry(positions, uvs, indices);
}

function offsetCrown(u: number, v: number, variant: Variant, amount = 0.009) {
  const point = crownPoint(u, v, variant);
  const normal = new THREE.Vector3(point.x, variant && v < 0.76 ? 0.05 : point.y * 0.8, point.z).normalize();
  return point.addScaledVector(normal, amount);
}

export type CapModel = {
  group: THREE.Group;
  setMorph: (progress: number) => void;
  dispose: () => void;
};

/**
 * Original procedural model inspired by the supplied front-view photographs.
 * No downloaded model, scanned fabric or official emblem is used.
 * Front: +Z. Crown base: Y=0. Both modes share topology and morph normals.
 */
export function createCapModel({ detail = 'high' }: { detail?: 'low' | 'high' } = {}): CapModel {
  const high = detail === 'high';
  const group = new THREE.Group();
  group.name = 'ROKMC reference-inspired continuous cap morph';
  const fabric = acquireFabricMaps(detail);
  const insignia = createInsigniaTextures();
  const morph = { value: 0 };
  const cloth = createMorphMaterial(fabric.maps, morph);
  const seam = createMorphMaterial(fabric.maps, morph, { tint: '#d9d3c9' });
  const thread = createMorphMaterial(fabric.maps, morph, { tint: '#f2e1c7' });
  const underside = createMorphMaterial(fabric.maps, morph, { tint: '#8f918a' });
  const badge = createMorphMaterial(fabric.maps, morph, { ...insignia, transparent: true });
  badge.normalScale.set(0.6, 0.6);
  badge.depthWrite = false;
  badge.polygonOffset = true;
  badge.polygonOffsetFactor = -1;
  const materials = [cloth, seam, thread, underside, badge];
  const meshes: THREE.Mesh[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  function add(geometry: THREE.BufferGeometry, material: THREE.Material, name: string) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = material !== badge;
    mesh.receiveShadow = true;
    group.add(mesh);
    meshes.push(mesh);
    geometries.push(geometry);
    return mesh;
  }

  // Include the exact shoulder row so the military crown has a crisp octagonal lip.
  const crown = morphGeometry((u, v, variant) => crownPoint(u, v <= 0.75 ? v / 0.75 * 0.76 : 0.76 + (v - 0.75) / 0.25 * 0.24, variant), high ? 128 : 64, high ? 64 : 32, [2, 1]);
  add(crown, cloth, 'Continuous six-panel dome to eight-sided crown');
  add(morphGeometry(brimPoint, high ? 56 : 32, high ? 26 : 16, [1, 0.8]), cloth, 'Curved visor upper cloth');
  add(morphGeometry((u, v, variant) => brimPoint(1 - u, v, variant).add(new THREE.Vector3(0, -0.042, 0)), high ? 56 : 32, high ? 26 : 16, [1, 0.8]), underside, 'Visor lower cloth');

  const brimEdge: Path = (t, variant) => brimPoint(t, 1, variant).add(new THREE.Vector3(0, -0.02, 0));
  add(morphTube(brimEdge, high ? 96 : 48, 0.024, 6), seam, 'Visor layered rolled edge');
  for (const side of [0, 1]) {
    add(morphTube((t, variant) => brimPoint(side, t, variant).add(new THREE.Vector3(0, -0.02, 0)), 24, 0.023, 5), seam, 'Visor side binding');
  }

  // A sewn band closes the lower edge and gives the rotating cap an actual interior.
  add(morphGeometry((u, v, variant) => {
    const point = crownPoint(u, v * (variant ? 0.115 : 0.065), variant);
    point.x *= 1.007; point.z *= 1.007;
    return point;
  }, high ? 128 : 64, 5, [2, 0.14]), seam, 'Lower crown sewn band');
  add(morphGeometry((u, v, variant) => {
    const point = crownPoint(1 - u, v * 0.12, variant);
    point.x *= 0.975; point.z *= 0.975; point.y -= 0.006;
    return point;
  }, high ? 96 : 48, 6, [2, 0.2]), underside, 'Interior cotton sweatband');
  add(morphTube((t, variant) => offsetCrown(t, 0.012, variant), high ? 128 : 64, 0.011, 5), seam, 'Lower crown piping');

  const stitchPaths: Path[] = [];
  for (let row = 0; row < (high ? 7 : 5); row++) {
    const v = 0.33 + row * (high ? 0.091 : 0.137);
    stitchPaths.push((t, variant) => brimPoint(0.025 + t * 0.95, v, variant).add(new THREE.Vector3(0, 0.004, 0)));
  }
  for (const v of [0.025, 0.065]) stitchPaths.push((t, variant) => offsetCrown(t, variant ? v * 1.55 : v, variant, 0.015));

  // Six red panel seams redistribute to the eight military corner seams.
  // The last two coincide with existing red seams until the crown opens out.
  for (let index = 0; index < 8; index++) {
    const path: Path = (t, variant) => {
      return offsetCrown((index + 0.5) / 8, 0.055 + t * 0.705, variant, 0.008);
    };
    add(morphTube(path, high ? 44 : 24, 0.0075, 4, 0.009), seam, 'Morphing panel welt');
    add(morphTube((t, variant) => offsetCrown((index + 0.5) / 8, 0.76 + t * 0.22, variant, 0.004), 18, 0.007, 4, 0.00003), seam, 'Closing top panel seam');
    if (high) {
      for (const direction of [-1, 1]) stitchPaths.push((t, variant) => {
        const u = (index + 0.5) / 8 + direction * 0.0035;
        return offsetCrown(u, 0.065 + t * 0.68, variant, 0.012);
      });
    }
  }

  // The top panel's welt migrates from a subtle dome latitude to the field cap lip.
  add(morphTube((t, variant) => offsetCrown(t, 0.76, variant, 0.006), high ? 128 : 64, 0.00015, 5, 0.013), seam, 'Octagonal top panel piping');
  add(stitchGeometry(stitchPaths, high ? 74 : 40, high ? 0.0027 : 0.0035), thread, 'Individual sewn thread stitches');

  // The covered crown button physically contracts into the field cap top.
  add(morphGeometry((u, v, variant) => {
    const scale = variant ? 0.006 : 1;
    const phi = v * Math.PI;
    return new THREE.Vector3(Math.sin(phi) * Math.cos(u * TAU) * 0.104 * scale, (variant ? 0.7 : 1.295) + Math.cos(phi) * 0.048 * scale, Math.sin(phi) * Math.sin(u * TAU) * 0.104 * scale);
  }, high ? 32 : 20, 16, [0.35, 0.35]), cloth, 'Collapsing covered crown button');

  // Four sewn vent eyelets are actual toroidal rings on the dome.
  for (const u of [0.135, 0.365, 0.635, 0.865]) {
    const centerRed = crownPoint(u, 0.54, 0);
    const centerField = crownPoint(u, 0.62, 1);
    const eyeletPath: Path = (t, variant) => {
      const center = (variant ? centerField : centerRed).clone();
      const horizontal = new THREE.Vector3(Math.cos(u * TAU), 0, -Math.sin(u * TAU));
      const vertical = new THREE.Vector3(-Math.sin(u * TAU) * 0.55, 0.8, -Math.cos(u * TAU) * 0.55);
      const radius = variant ? 0.018 : 0.031;
      return center.addScaledVector(horizontal, Math.cos(t * TAU) * radius).addScaledVector(vertical, Math.sin(t * TAU) * radius).addScaledVector(new THREE.Vector3(Math.sin(u * TAU), 0.5, Math.cos(u * TAU)), 0.007);
    };
    add(morphTube(eyeletPath, 20, 0.009, 5, 0.005), seam, 'Embroidered ventilation eyelet');
  }

  add(morphGeometry((u, v, variant) => {
    const x = (u - 0.5) * (variant ? 0.53 : 0.72);
    const y = (variant ? 0.13 : 0.24) + v * (variant ? 0.44 : 0.64);
    let z: number;
    if (variant) {
      z = (0.91 + y / 0.7 * 0.09) * 0.95;
    } else {
      const angle = Math.asin(y / 1.29);
      const radius = 1.02 * Math.pow(Math.cos(angle), 0.8);
      z = Math.sqrt(Math.max(0, radius * radius - x * x)) * 0.95;
    }
    return new THREE.Vector3(x, y, z + 0.024);
  }, high ? 28 : 16, high ? 24 : 16), badge, 'Reference-inspired embroidered insignia / field patch');

  // Preserve the detailed endpoint geometry, but batch by material so even the
  // individual stitches cost one draw call. Both position/normal targets survive.
  const batched: THREE.Mesh[] = [];
  const batchedGeometry: THREE.BufferGeometry[] = [];
  for (const material of materials) {
    const source = meshes.filter((mesh) => mesh.material === material);
    const merged = mergeGeometries(source.map((mesh) => mesh.geometry));
    if (!merged) continue;
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = source.map((entry) => entry.name).join(' / ');
    mesh.castShadow = material !== badge;
    mesh.receiveShadow = true;
    batched.push(mesh);
    batchedGeometry.push(merged);
  }
  if (batched.length === materials.length) {
    group.clear();
    geometries.forEach((geometry) => geometry.dispose());
    meshes.splice(0, meshes.length, ...batched);
    geometries.splice(0, geometries.length, ...batchedGeometry);
    group.add(...batched);
  } else {
    batchedGeometry.forEach((geometry) => geometry.dispose());
  }

  let disposed = false;
  return {
    group,
    setMorph(progress) {
      const value = clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
      morph.value = value;
      for (const mesh of meshes) {
        if (mesh.morphTargetInfluences) mesh.morphTargetInfluences[0] = value;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      insignia.red.dispose();
      insignia.camouflage.dispose();
      fabric.release();
      group.clear();
    },
  };
}
