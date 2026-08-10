/**
 * Minimal Three helpers for the green-wall site only.
 * Standalone — not shared with stacys-model / venue code.
 */
import * as THREE from "three";

export const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    flatShading: opts.flatShading ?? true,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });

export function box(w, h, d, color, opts = {}) {
  const { castShadow = true, receiveShadow = true, ...matOpts } = opts;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, matOpts));
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  return mesh;
}

export function cyl(rTop, rBot, h, color, opts = {}, segs = 6) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, segs),
    mat(color, opts)
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function neonBox(w, h, d, color, intensity = 0.45) {
  return box(w, h, d, color, {
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.4,
  });
}

export function trackNightMat(
  nightMats,
  material,
  nightIntensity,
  dayIntensity = 0.018,
  opts = {}
) {
  if (!material || !nightMats) return material;
  material.emissiveIntensity = dayIntensity;
  nightMats.push({
    mat: material,
    day: dayIntensity,
    night: nightIntensity,
    glimmer: !!opts.glimmer,
    glimmerSpeed: opts.glimmerSpeed ?? 3.2,
    phase: opts.phase ?? Math.random() * 10,
  });
  return material;
}

export function trackNightMesh(nightMats, mesh, nightIntensity, dayIntensity = 0.018, opts = {}) {
  if (mesh?.material)
    trackNightMat(nightMats, mesh.material, nightIntensity, dayIntensity, opts);
  return mesh;
}

export function canvasTexture(canvas, anisotropy = 8) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}
