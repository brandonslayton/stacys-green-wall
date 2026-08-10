/**
 * greenWall.js — believable poly activation wall
 *   dense small LEAVES (ivy / heart-leaf silhouettes, natural palette)
 *   + subtle Stacy's diamond neon (Primary Full-Color brand face)
 *
 * Refs: refs/green-wall/ · brand: images/stacys-diamond-logo.png
 * Workbench: green-wall.html
 *
 * LOOP HISTORY (critic-driven believability passes):
 *   L1 density + size + logo PNG + dial glow down
 *   L2 natural palette, less plastic emissive, soft edge tube only
 *   L3 curl/layers/occlusion, smaller overlap fringe, dim wash lights
 *   L4 micro size variance, shadow pockets, brand face scale/letterbox
 */
import * as THREE from "three";
import {
  box,
  cyl,
  neonBox,
  canvasTexture,
  trackNightMesh,
} from "./kit.js";
import { STACYS_DISPLAY, STACYS_UI } from "./brand.js";

// ─── Brand palette (Primary Full-Color) ────────────────────────────────────
export const NEON = {
  purple: 0x9b6dff,
  purpleHot: 0xb48cff,
  cyan: 0x4de0ff,
  teal: 0x2dffc8,
  white: 0xffffff,
  pink: 0xff4fa8,
  navy: 0x0a0820,
  navyLite: 0x14102e,
};

/** Natural living-wall greens (desaturated — not cartoon lime). */
const LEAF_COLORS = [
  0x1f5c32, 0x2a6b3a, 0x245a30, 0x3a7a48, 0x1a4a28, 0x2d6640,
  0x3d8050, 0x164020, 0x4a8a58, 0x286038, 0x357848, 0x1e5030,
  0x457a50, 0x2f6a3c, 0x1c4826, 0x50885a, 0x234e2e, 0x3c7250,
  0x2b5e38, 0x486e42, 0x1a3d24, 0x5a9060, 0x2e5840, 0x3f7848,
];

/** Subtle yellow-green new growth + deep shade accents */
const LEAF_TINTS_NEW = [0x6a9a58, 0x5a8c50, 0x7aaa60];
const LEAF_TINTS_DEEP = [0x0e2818, 0x122c1a, 0x0a2014];

/**
 * Critic-loop presets — each loop is a response to the previous review board.
 * Loop 4 is the ship target (smaller denser leaves, logo face, subtle glow).
 */
export const CRITIC_LOOPS = {
  1: {
    loop: 1,
    title: "L1 · Density + size",
    brief: "Shrink leaves, raise count. First pass brand canvas. Dial club-neon down.",
    density: 1.75,
    leafScale: 0.72,
    heroScale: 0.88,
    neonEdgeDay: 0.55,
    neonEdgeNight: 1.05,
    neonFaceDay: 0.55,
    neonFaceNight: 0.95,
    washDay: 0.55,
    washNight: 1.1,
    bounceDay: 0.2,
    bounceNight: 0.4,
    tealDay: 0.12,
    tealNight: 0.28,
    useBrandPng: false,
    seed: 99,
  },
  2: {
    loop: 2,
    title: "L2 · Natural palette",
    brief: "Critics: lime cartoon, plastic glow. Mute greens, softer edge, PNG logo.",
    density: 1.95,
    leafScale: 0.66,
    heroScale: 0.82,
    neonEdgeDay: 0.42,
    neonEdgeNight: 0.85,
    neonFaceDay: 0.38,
    neonFaceNight: 0.72,
    washDay: 0.4,
    washNight: 0.78,
    bounceDay: 0.12,
    bounceNight: 0.28,
    tealDay: 0.08,
    tealNight: 0.18,
    useBrandPng: true,
    seed: 101,
  },
  3: {
    loop: 3,
    title: "L3 · Depth + living sign",
    brief: "Dense layered leaves. Soft fun Stacy's diamond close on the wall. Leaves grow over the sign — swipe them clear.",
    density: 2.1,
    leafScale: 0.63,
    heroScale: 0.8,
    neonEdgeDay: 0.38,
    neonEdgeNight: 0.76,
    neonFaceDay: 0.34,
    neonFaceNight: 0.62,
    washDay: 0.32,
    washNight: 0.62,
    bounceDay: 0.1,
    bounceNight: 0.22,
    tealDay: 0.06,
    tealNight: 0.14,
    useBrandPng: false, // soft fun sign (not pixel-perfect PNG)
    seed: 107,
  },
  4: {
    loop: 4,
    title: "L4 · Fun soft sign + lush leaves",
    brief: "Dense natural leaves. Soft simplified Stacy's diamond (fun brand nod, not pixel-perfect logo).",
    density: 2.2,
    leafScale: 0.6,
    heroScale: 0.76,
    neonEdgeDay: 0.28,
    neonEdgeNight: 0.58,
    neonFaceDay: 0.32,
    neonFaceNight: 0.58,
    washDay: 0.22,
    washNight: 0.45,
    bounceDay: 0.07,
    bounceNight: 0.15,
    tealDay: 0.04,
    tealNight: 0.1,
    useBrandPng: false, // soft fun canvas — not official PNG lockup
    seed: 113,
  },
};

/** Active preset (mutated by applyCriticLoop). Default ship = L3. */
export const GREEN_WALL_PRESET = { ...CRITIC_LOOPS[3] };

/** Apply critic loop 1–4 onto GREEN_WALL_PRESET (in place). */
export function applyCriticLoop(n = 4) {
  const src = CRITIC_LOOPS[n] || CRITIC_LOOPS[4];
  Object.assign(GREEN_WALL_PRESET, src);
  return GREEN_WALL_PRESET;
}

function makeRnd(seed = 99) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LEAF SHAPES — realistic ivy / boston-ivy family silhouettes
// ═══════════════════════════════════════════════════════════════════════════

function makeLeafShape(kind, s) {
  const sh = new THREE.Shape();
  if (kind === 0) {
    // Classic pointed ivy (3-lobed suggestion via shoulders)
    sh.moveTo(0, s * 0.98);
    sh.bezierCurveTo(s * 0.48, s * 0.62, s * 0.58, s * 0.12, s * 0.42, -s * 0.28);
    sh.bezierCurveTo(s * 0.28, -s * 0.52, s * 0.1, -s * 0.78, 0, -s);
    sh.bezierCurveTo(-s * 0.1, -s * 0.78, -s * 0.28, -s * 0.52, -s * 0.42, -s * 0.28);
    sh.bezierCurveTo(-s * 0.58, s * 0.12, -s * 0.48, s * 0.62, 0, s * 0.98);
  } else if (kind === 1) {
    // Elongated lance — common understory leaf
    sh.moveTo(0, s);
    sh.bezierCurveTo(s * 0.36, s * 0.55, s * 0.32, -s * 0.1, s * 0.16, -s * 0.62);
    sh.bezierCurveTo(s * 0.06, -s * 0.88, s * 0.02, -s * 0.98, 0, -s);
    sh.bezierCurveTo(-s * 0.02, -s * 0.98, -s * 0.06, -s * 0.88, -s * 0.16, -s * 0.62);
    sh.bezierCurveTo(-s * 0.32, -s * 0.1, -s * 0.36, s * 0.55, 0, s);
  } else if (kind === 2) {
    // Broad cordate (heart) leaf
    sh.moveTo(0, s * 0.55);
    sh.bezierCurveTo(s * 0.55, s * 0.95, s * 0.85, s * 0.25, s * 0.45, -s * 0.35);
    sh.bezierCurveTo(s * 0.2, -s * 0.7, s * 0.05, -s * 0.92, 0, -s);
    sh.bezierCurveTo(-s * 0.05, -s * 0.92, -s * 0.2, -s * 0.7, -s * 0.45, -s * 0.35);
    sh.bezierCurveTo(-s * 0.85, s * 0.25, -s * 0.55, s * 0.95, 0, s * 0.55);
  } else {
    // Slightly asymmetric lobed leaf
    sh.moveTo(0, s * 0.92);
    sh.bezierCurveTo(s * 0.35, s * 0.7, s * 0.55, s * 0.2, s * 0.48, -s * 0.15);
    sh.bezierCurveTo(s * 0.55, -s * 0.4, s * 0.25, -s * 0.65, s * 0.12, -s * 0.85);
    sh.bezierCurveTo(s * 0.04, -s * 0.95, 0, -s, 0, -s);
    sh.bezierCurveTo(0, -s, -s * 0.06, -s * 0.92, -s * 0.2, -s * 0.72);
    sh.bezierCurveTo(-s * 0.4, -s * 0.45, -s * 0.5, -s * 0.05, -s * 0.38, s * 0.25);
    sh.bezierCurveTo(-s * 0.42, s * 0.55, -s * 0.28, s * 0.8, 0, s * 0.92);
  }
  return sh;
}

const _leafGeoCache = new Map();

function getLeafGeometry(kind, s) {
  const q = Math.round(s * 80);
  const key = `${kind}_${q}`;
  if (_leafGeoCache.has(key)) return _leafGeoCache.get(key);
  const shape = makeLeafShape(kind, s);
  const depth = Math.max(0.006, s * 0.045);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: Math.max(0.002, s * 0.008),
    bevelSize: Math.max(0.0015, s * 0.006),
    bevelSegments: 1,
    curveSegments: 10,
  });
  geo.center();
  _leafGeoCache.set(key, geo);
  return geo;
}

/**
 * Realistic single leaf: thin extruded blade, muted midrib, soft curl, no plastic glow.
 */
export function makeDetailedLeaf(s, col, kind, rnd, opts = {}) {
  const leaf = new THREE.Group();
  leaf.name = "leaf";

  const bladeGeo = getLeafGeometry(kind, s);
  // Slight vertex-free material variation via roughness/emissive almost off
  const shade = 0.88 + rnd() * 0.22;
  const c = new THREE.Color(col).multiplyScalar(shade);
  const bladeMat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.72 + rnd() * 0.2,
    metalness: 0.0,
    emissive: c,
    emissiveIntensity: 0.012 + rnd() * 0.018, // living chlorophyll whisper only
    flatShading: false,
    side: THREE.DoubleSide,
  });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.castShadow = false;
  blade.receiveShadow = true;
  leaf.add(blade);

  // Thin midrib (darker green, not neon lime)
  const ribCol = new THREE.Color(col).offsetHSL(0, -0.05, 0.08);
  const rib = box(s * 0.032, s * 1.55, s * 0.022, ribCol.getHex(), {
    roughness: 0.65,
    castShadow: false,
    receiveShadow: false,
    emissive: 0x1a4020,
    emissiveIntensity: 0.04,
  });
  rib.position.z = s * 0.028;
  leaf.add(rib);

  // 2–3 subtle side veins only (avoid busy cartoony nubs)
  const veinN = 2 + (rnd() > 0.5 ? 1 : 0);
  for (let v = 0; v < veinN; v++) {
    const t = (v + 1) / (veinN + 1);
    const y = -s * 0.55 + t * s * 1.1;
    const len = s * (0.14 + (1 - Math.abs(t - 0.5)) * 0.12);
    for (const side of [-1, 1]) {
      if (rnd() < 0.15) continue; // natural incomplete veins
      const vein = box(len, s * 0.018, s * 0.01, ribCol.getHex(), {
        roughness: 0.7,
        castShadow: false,
        receiveShadow: false,
        emissive: 0x102818,
        emissiveIntensity: 0.03,
      });
      vein.position.set(side * len * 0.38, y, s * 0.025);
      vein.rotation.z = side * (0.38 + t * 0.12);
      leaf.add(vein);
    }
  }

  // Short petiole
  const stem = box(s * 0.04, s * 0.2, s * 0.025, 0x1a3a20, {
    roughness: 0.88,
    castShadow: false,
    receiveShadow: false,
  });
  stem.position.set(0, -s * 0.9, s * 0.005);
  leaf.add(stem);

  // Soft curl (believable plant physics)
  if (opts.curl !== false) {
    leaf.rotation.x += (rnd() - 0.5) * 0.35;
    leaf.rotation.y += (rnd() - 0.5) * 0.45;
    leaf.rotation.z += (rnd() - 0.5) * 0.9;
  }

  return leaf;
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKING — dense photo-ish underlayer so gaps never read empty
// ═══════════════════════════════════════════════════════════════════════════

export function makeFoliageBackingTexture() {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const rnd = makeRnd(42);

  const bg = ctx.createLinearGradient(0, 0, 0, S);
  bg.addColorStop(0, "#0a2414");
  bg.addColorStop(0.5, "#0e3018");
  bg.addColorStop(1, "#081c10");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);

  // Deep occlusion pockets
  for (let i = 0; i < 55; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 25 + rnd() * 100;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(2,12,6,0.7)");
    g.addColorStop(1, "rgba(2,12,6,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Twining stems
  ctx.lineCap = "round";
  for (let i = 0; i < 36; i++) {
    ctx.strokeStyle = i % 2 ? "rgba(18,55,28,0.9)" : "rgba(30,70,40,0.55)";
    ctx.lineWidth = 2.5 + rnd() * 5;
    ctx.beginPath();
    let x = rnd() * S;
    let y = rnd() * S * 0.1;
    ctx.moveTo(x, y);
    for (let k = 0; k < 20; k++) {
      x += (rnd() - 0.5) * 48;
      y += S / 20 + rnd() * 8;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const greens = [
    "#1f5c32", "#2a6b3a", "#245a30", "#3a7a48", "#1a4a28", "#2d6640",
    "#3d8050", "#164020", "#4a8a58", "#286038", "#1e5030", "#457a50",
    "#0e2818", "#50885a", "#2f6a3c", "#3c7250",
  ];

  // Many small painted leaves (backing density)
  for (let i = 0; i < 420; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 8 + rnd() * 28;
    const rot = rnd() * Math.PI * 2;
    const kind = i % 3;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = greens[i % greens.length];
    ctx.beginPath();
    if (kind === 0) {
      ctx.moveTo(0, r);
      ctx.bezierCurveTo(r * 0.5, r * 0.35, r * 0.45, -r * 0.25, 0, -r);
      ctx.bezierCurveTo(-r * 0.45, -r * 0.25, -r * 0.5, r * 0.35, 0, r);
    } else if (kind === 1) {
      ctx.ellipse(0, 0, r * 0.28, r, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(0, r * 0.5);
      ctx.bezierCurveTo(r * 0.55, r * 0.9, r * 0.7, 0, r * 0.35, -r * 0.5);
      ctx.bezierCurveTo(0, -r, -r * 0.35, -r * 0.5, -r * 0.7, 0);
      ctx.bezierCurveTo(-r * 0.55, r * 0.9, 0, r * 0.5, 0, r * 0.5);
    }
    ctx.fill();
    ctx.strokeStyle = "rgba(40,90,50,0.35)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.75);
    ctx.lineTo(0, -r * 0.75);
    ctx.stroke();
    ctx.restore();
  }

  // Soft specular flecks (morning light on cuticle)
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(180,220,160,${0.04 + rnd() * 0.06})`;
    ctx.beginPath();
    ctx.ellipse(rnd() * S, rnd() * S, 2 + rnd() * 6, 1 + rnd() * 3, rnd(), 0, Math.PI * 2);
    ctx.fill();
  }

  return canvasTexture(c, 2);
}

// ═══════════════════════════════════════════════════════════════════════════
// FOLIAGE WALL
// ═══════════════════════════════════════════════════════════════════════════

export function buildGreenFoliageWall(w = 2.4, h = 2.45, opts = {}) {
  const g = new THREE.Group();
  g.name = "greenFoliageWall";
  const density = opts.density ?? GREEN_WALL_PRESET.density;
  const leafScale = opts.leafScale ?? GREEN_WALL_PRESET.leafScale;
  const heroScale = opts.heroScale ?? GREEN_WALL_PRESET.heroScale;
  const rnd = makeRnd(opts.seed ?? 99);

  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 1.02, h * 1.02),
    new THREE.MeshStandardMaterial({
      map: makeFoliageBackingTexture(),
      roughness: 0.92,
      metalness: 0.0,
      flatShading: false,
    })
  );
  back.position.z = -0.02;
  back.receiveShadow = true;
  g.add(back);

  // Shadow underlayer (depth)
  const under = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.98, h * 0.98),
    new THREE.MeshStandardMaterial({
      color: 0x06140c,
      roughness: 0.96,
      emissive: 0x030a06,
      emissiveIntensity: 0.08,
    })
  );
  under.position.z = 0.008;
  g.add(under);

  // Fine vines
  const vineCount = Math.round(22 * density);
  for (let i = 0; i < vineCount; i++) {
    const segs = 10 + (i % 6);
    let x = (rnd() - 0.5) * w * 0.9;
    let y = (rnd() - 0.5) * h * 0.9;
    let z = 0.03 + rnd() * 0.05;
    for (let k = 0; k < segs; k++) {
      const thick = 0.018 + rnd() * 0.022;
      const vine = box(thick, 0.08 + rnd() * 0.1, thick, rnd() > 0.5 ? 0x1a4024 : 0x143820, {
        roughness: 0.93,
        castShadow: false,
        receiveShadow: false,
      });
      vine.position.set(x, y, z);
      vine.rotation.z = (rnd() - 0.5) * 1.2;
      vine.rotation.x = (rnd() - 0.5) * 0.4;
      g.add(vine);
      x += (rnd() - 0.5) * 0.12;
      y += 0.05 + rnd() * 0.08;
      z += (rnd() - 0.5) * 0.015;
    }
  }

  const pickCol = () => {
    const u = rnd();
    if (u < 0.12) return LEAF_TINTS_NEW[Math.floor(rnd() * LEAF_TINTS_NEW.length)];
    if (u < 0.22) return LEAF_TINTS_DEEP[Math.floor(rnd() * LEAF_TINTS_DEEP.length)];
    return LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)];
  };

  // Layer A — tiny dense field
  const backN = Math.round(220 * density);
  for (let i = 0; i < backN; i++) {
    const s = (0.055 + rnd() * 0.085) * leafScale;
    const leaf = makeDetailedLeaf(s, pickCol(), i % 4, rnd);
    leaf.position.set(
      (rnd() - 0.5) * w * 0.95,
      (rnd() - 0.5) * h * 0.95,
      0.03 + rnd() * 0.07
    );
    g.add(leaf);
  }

  // Layer B — mid clusters
  const clusters = Math.round(22 * density);
  for (let c = 0; c < clusters; c++) {
    const cx = (rnd() - 0.5) * w * 0.78;
    const cy = (rnd() - 0.5) * h * 0.78;
    const cz = 0.08 + rnd() * 0.05;
    const bunch = 8 + Math.floor(rnd() * 7);
    for (let j = 0; j < bunch; j++) {
      const s = (0.06 + rnd() * 0.1) * leafScale;
      const leaf = makeDetailedLeaf(s, pickCol(), j % 4, rnd);
      leaf.position.set(
        cx + (rnd() - 0.5) * 0.26,
        cy + (rnd() - 0.5) * 0.26,
        cz + rnd() * 0.06
      );
      g.add(leaf);
    }
  }

  // Layer C — medium “readable” leaves (still smaller than old heroes)
  const heroes = Math.round(28 * density);
  for (let i = 0; i < heroes; i++) {
    const s = (0.11 + rnd() * 0.1) * heroScale;
    const leaf = makeDetailedLeaf(s, pickCol(), i % 4, rnd);
    leaf.position.set(
      (rnd() - 0.5) * w * 0.82,
      (rnd() - 0.5) * h * 0.82,
      0.12 + rnd() * 0.08
    );
    g.add(leaf);
  }

  // Layer D — edge fringe (overflow past panel)
  const fringe = Math.round(36 * density);
  for (let i = 0; i < fringe; i++) {
    const s = (0.07 + rnd() * 0.09) * leafScale;
    const leaf = makeDetailedLeaf(s, pickCol(), i % 3, rnd);
    const edge = i % 4;
    if (edge === 0) leaf.position.set(w * 0.49 + rnd() * 0.06, (rnd() - 0.5) * h * 0.92, 0.08 + rnd() * 0.06);
    else if (edge === 1) leaf.position.set(-w * 0.49 - rnd() * 0.06, (rnd() - 0.5) * h * 0.92, 0.08 + rnd() * 0.06);
    else if (edge === 2) leaf.position.set((rnd() - 0.5) * w * 0.92, h * 0.49 + rnd() * 0.06, 0.08 + rnd() * 0.06);
    else leaf.position.set((rnd() - 0.5) * w * 0.92, -h * 0.49 - rnd() * 0.06, 0.08 + rnd() * 0.06);
    g.add(leaf);
  }

  // Layer E — sparse frame around sign (doesn’t obscure wordmark)
  const overlap = new THREE.Group();
  overlap.name = "overlapLeaves";
  for (let i = 0; i < 14; i++) {
    const s = (0.06 + rnd() * 0.08) * leafScale;
    const leaf = makeDetailedLeaf(s, pickCol(), i % 3, rnd);
    const ang = (i / 14) * Math.PI * 2 + rnd() * 0.25;
    const rad = 0.52 + rnd() * 0.14;
    leaf.position.set(
      Math.cos(ang) * rad * (w / 2.15),
      Math.sin(ang) * rad * (h / 2.15),
      0.26 + rnd() * 0.05
    );
    g.add(leaf);
    overlap.add(leaf);
  }
  g.userData.overlapLeaves = overlap;

  return g;
}

// ═══════════════════════════════════════════════════════════════════════════
// BRAND LOGO FACE — Primary Full-Color PNG preferred
// ═══════════════════════════════════════════════════════════════════════════

let _brandTexPromise = null;
let _brandTex = null;

/**
 * Load official logo PNG (with transparent corners). Safe to call many times.
 */
export function loadBrandLogoTexture() {
  if (_brandTex) return Promise.resolve(_brandTex);
  if (_brandTexPromise) return _brandTexPromise;
  _brandTexPromise = new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      "images/stacys-diamond-logo.png",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        _brandTex = tex;
        resolve(tex);
      },
      undefined,
      () => resolve(null)
    );
  });
  return _brandTexPromise;
}

/**
 * Fun, soft Stacy's diamond — simplified brand nod for the living wall.
 * Reads as the logo (diamond · script Stacy's · @MELROSE · purple/teal)
 * without being a pixel-perfect lockup. Soft glow, fewer rays, rounded feel.
 */
export function makeStacysNeonDiamondFaceTexture() {
  const w = 1200;
  const h = 900;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const halfX = w * 0.42;
  const halfY = h * 0.4;

  // Soft rounded diamond (quadratic tips → friendlier than sharp brand vector)
  const softDiamond = (sx = 1, sy = 1, round = 0.12) => {
    const t = Math.max(0.04, Math.min(0.28, round));
    const top = { x: cx, y: cy - halfY * sy };
    const right = { x: cx + halfX * sx, y: cy };
    const bot = { x: cx, y: cy + halfY * sy };
    const left = { x: cx - halfX * sx, y: cy };
    const mid = (a, b, k) => ({
      x: a.x + (b.x - a.x) * k,
      y: a.y + (b.y - a.y) * k,
    });
    ctx.beginPath();
    let p = mid(top, left, t);
    ctx.moveTo(p.x, p.y);
    // top → right
    ctx.quadraticCurveTo(top.x, top.y, mid(top, right, t).x, mid(top, right, t).y);
    ctx.lineTo(mid(top, right, 1 - t).x, mid(top, right, 1 - t).y);
    ctx.quadraticCurveTo(right.x, right.y, mid(right, bot, t).x, mid(right, bot, t).y);
    ctx.lineTo(mid(right, bot, 1 - t).x, mid(right, bot, 1 - t).y);
    ctx.quadraticCurveTo(bot.x, bot.y, mid(bot, left, t).x, mid(bot, left, t).y);
    ctx.lineTo(mid(bot, left, 1 - t).x, mid(bot, left, 1 - t).y);
    ctx.quadraticCurveTo(left.x, left.y, mid(left, top, t).x, mid(left, top, t).y);
    ctx.closePath();
  };

  // Soft outer glow (ambient purple haze)
  ctx.save();
  softDiamond(1.06, 1.06, 0.14);
  ctx.fillStyle = "rgba(140, 100, 220, 0.14)";
  ctx.shadowColor = "rgba(150, 110, 255, 0.45)";
  ctx.shadowBlur = 48;
  ctx.fill();
  ctx.restore();

  // Face fill — deep navy, slightly lifted (friendlier than pure black)
  const face = ctx.createRadialGradient(cx, cy - halfY * 0.15, 20, cx, cy, halfX * 0.95);
  face.addColorStop(0, "#1c1648");
  face.addColorStop(0.55, "#12102e");
  face.addColorStop(1, "#0c0a22");
  softDiamond(1, 1, 0.13);
  ctx.fillStyle = face;
  ctx.fill();

  // Soft purple rim (one stroke — no hard double hairline)
  softDiamond(0.985, 0.98, 0.13);
  ctx.strokeStyle = "rgba(170, 140, 255, 0.85)";
  ctx.lineWidth = 11;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(160, 120, 255, 0.55)";
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // A few soft rays (half of brand count — playful sparkle, not starburst grid)
  ctx.save();
  ctx.translate(cx, cy);
  const rayAngles = [-70, -45, -25, 25, 45, 70, 155, 180, 205]; // deg from up-ish, skip word band
  for (let i = 0; i < rayAngles.length; i++) {
    const a = ((rayAngles[i] - 90) * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const r0 = 88;
    const r1 = 88 + (i % 2 === 0 ? 48 : 34);
    ctx.strokeStyle = i % 2 === 0 ? "rgba(180, 150, 255, 0.55)" : "rgba(150, 130, 230, 0.32)";
    ctx.lineWidth = i % 2 === 0 ? 5 : 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cos * r0, sin * r0);
    ctx.lineTo(cos * r1, sin * r1);
    ctx.stroke();
  }
  ctx.restore();

  // Soft teal side dots (simple, no inner hot core)
  for (const side of [-1, 1]) {
    const dx = side * halfX * 0.72;
    ctx.beginPath();
    ctx.arc(cx + dx, cy + 4, 12, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(45, 220, 180, 0.9)";
    ctx.shadowColor = "rgba(45, 255, 200, 0.5)";
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Wordmark — soft script, gentle cyan halo (not hard brand outline)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const scriptStack = `"Pacifico", "Segoe Script", "Brush Script MT", ${STACYS_DISPLAY}`;
  let mainSize = 268;
  let font = `400 ${mainSize}px ${scriptStack}`;
  ctx.font = font;
  const main = "Stacy's";
  const maxW = halfX * 1.42;
  let tw = ctx.measureText(main).width;
  if (tw > maxW) {
    mainSize = Math.floor(mainSize * (maxW / tw));
    font = `400 ${mainSize}px ${scriptStack}`;
    ctx.font = font;
  }
  const mainY = cy - mainSize * 0.02;

  // Soft cyan/lavender bloom behind letters
  ctx.shadowColor = "rgba(120, 220, 255, 0.55)";
  ctx.shadowBlur = 28;
  ctx.fillStyle = "rgba(200, 245, 255, 0.35)";
  ctx.font = font;
  ctx.fillText(main, cx, mainY);

  // Warm white body
  ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#f4f8ff";
  ctx.fillText(main, cx, mainY);
  ctx.shadowBlur = 0;
  // Soft fill (slightly creamy, not pure vector white)
  ctx.fillStyle = "#eef4ff";
  ctx.fillText(main, cx, mainY);

  // @MELROSE — smaller, softer teal, friendly tracking
  ctx.shadowColor = "rgba(45, 255, 200, 0.4)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "rgba(80, 240, 200, 0.95)";
  ctx.font = `600 44px ${STACYS_UI}`;
  ctx.letterSpacing = "0.16em";
  ctx.fillText("@ MELROSE", cx, mainY + mainSize * 0.48);
  ctx.letterSpacing = "0px";
  ctx.shadowBlur = 0;

  return canvasTexture(canvas, 8);
}

/**
 * Soft fun diamond sign — simplified Stacy's brand nod for the living wall.
 * Default: painted soft canvas face (rounded diamond, gentle glow, few rays).
 * Optional useBrandPng for official lockup (legacy critic loops).
 */
export function buildStacysNeonDiamond(nightMats, opts = {}) {
  const g = new THREE.Group();
  g.name = "stacysNeonDiamond";
  const P = GREEN_WALL_PRESET;

  const faceW = opts.faceW ?? 1.02;
  const faceH = opts.faceH ?? 0.74;
  const usePng = opts.useBrandPng !== false && P.useBrandPng;
  const baseDiag = Math.min(faceW, faceH);
  const side = baseDiag / Math.SQRT2;
  const stretchX = faceW / baseDiag;
  const stretchY = faceH / baseDiag;

  // Soft fun canvas (not pixel-perfect logo) — always drawn first
  const logoMap = makeStacysNeonDiamondFaceTexture();

  // Slim dark backer — sits behind the painted face only
  const body = new THREE.Group();
  body.name = "diamondBody";
  const cabinet = box(side * 0.82, side * 0.82, 0.035, NEON.navy, {
    roughness: 0.6,
    metalness: 0.04,
    emissive: NEON.navyLite,
    emissiveIntensity: 0.06,
  });
  cabinet.rotation.z = Math.PI / 4;
  body.add(cabinet);
  body.scale.set(stretchX, stretchY, 1);
  g.add(body);

  // Soft purple diamond halo (very light spill — no hard tube geometry)
  {
    const haloShape = new THREE.Shape();
    const hx = faceW * 0.48;
    const hy = faceH * 0.48;
    haloShape.moveTo(0, hy);
    haloShape.lineTo(hx, 0);
    haloShape.lineTo(0, -hy);
    haloShape.lineTo(-hx, 0);
    haloShape.closePath();
    const halo = new THREE.Mesh(
      new THREE.ShapeGeometry(haloShape),
      new THREE.MeshBasicMaterial({
        color: NEON.purple,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    halo.position.z = 0.016;
    g.add(halo);
  }

  const faceMat = new THREE.MeshStandardMaterial({
    map: logoMap,
    transparent: true,
    roughness: 0.48,
    metalness: 0.0,
    emissive: 0xffffff,
    emissiveIntensity: P.neonFaceDay,
    emissiveMap: logoMap,
    flatShading: false,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(faceW * 1.02, faceH * 1.02),
    faceMat
  );
  face.position.z = 0.036;
  face.name = "stacysDiamondFace";
  trackNightMesh(nightMats, face, P.neonFaceNight, P.neonFaceDay, {
    glimmer: true,
    glimmerSpeed: 1.6, // slow soft pulse
  });
  g.add(face);
  g.userData.faceMat = faceMat;
  g.userData.edgeMat = null;

  // Optional official PNG (L2/L3 critic modes only)
  if (usePng) {
    loadBrandLogoTexture().then((tex) => {
      if (!tex || !faceMat) return;
      faceMat.map = tex;
      faceMat.emissiveMap = tex;
      faceMat.needsUpdate = true;
      faceMat.emissiveIntensity = P.neonFaceDay * 0.85;
      const entry = nightMats.find((e) => e.mat === faceMat);
      if (entry) {
        entry.day = P.neonFaceDay * 0.8;
        entry.night = P.neonFaceNight * 0.85;
      }
    });
  }

  // Tiny mount pegs into foliage
  for (const [ox, oy] of [
    [-0.09, -0.05],
    [0.09, -0.05],
  ]) {
    const peg = box(0.024, 0.024, 0.06, 0x222228, { roughness: 0.8, metalness: 0.2 });
    peg.position.set(ox, oy, -0.01);
    g.add(peg);
  }

  return g;
}

/**
 * Overgrowth leaves: full-diamond cover (edges + tips), finger brush → fall,
 * recycled leaves keep growing back. Camera-independent sim.
 *
 * Cover targets are stratified across the diamond so corners/edges aren't bare.
 * state: growing | covered | falling
 */
export function createSignOvergrowth(opts = {}) {
  const group = new THREE.Group();
  group.name = "signOvergrowth";

  const count = opts.count ?? 64;
  const faceW = opts.faceW ?? 1.02;
  const faceH = opts.faceH ?? 0.74;
  const leafScale = opts.leafScale ?? 0.7;
  const rnd = makeRnd(opts.seed ?? 404);
  const growSeconds = opts.growSeconds ?? 36;
  const signY = opts.signY ?? 0.1;
  const halfW = faceW * 0.5;
  const halfH = faceH * 0.5;
  // Slightly larger than face so rims/tips stay covered
  const coverPad = 1.12;

  const pickCol = () => {
    const u = rnd();
    if (u < 0.12) return LEAF_TINTS_NEW[Math.floor(rnd() * LEAF_TINTS_NEW.length)];
    if (u < 0.22) return LEAF_TINTS_DEEP[Math.floor(rnd() * LEAF_TINTS_DEEP.length)];
    return LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)];
  };

  /** Diamond metric: 0 center → 1 edge (axis-aligned diamond). */
  function diamondT(lx, ly) {
    return Math.abs(lx) / (halfW * coverPad) + Math.abs(ly - signY) / (halfH * coverPad);
  }

  /** Stratified cover slots — fill diamond including tips & side lobes. */
  function makeCoverSlots(n) {
    const slots = [];
    // Explicit tip + edge anchors first (were going bare)
    const anchors = [
      [0, signY + halfH * 1.05],
      [0, signY - halfH * 1.05],
      [halfW * 1.05, signY],
      [-halfW * 1.05, signY],
      [halfW * 0.72, signY + halfH * 0.72],
      [-halfW * 0.72, signY + halfH * 0.72],
      [halfW * 0.72, signY - halfH * 0.72],
      [-halfW * 0.72, signY - halfH * 0.72],
      [halfW * 0.45, signY + halfH * 0.9],
      [-halfW * 0.45, signY + halfH * 0.9],
      [halfW * 0.45, signY - halfH * 0.9],
      [-halfW * 0.45, signY - halfH * 0.9],
      [halfW * 0.9, signY + halfH * 0.4],
      [-halfW * 0.9, signY + halfH * 0.4],
      [halfW * 0.9, signY - halfH * 0.4],
      [-halfW * 0.9, signY - halfH * 0.4],
    ];
    for (const [x, y] of anchors) {
      slots.push(new THREE.Vector3(x, y, 0.12 + rnd() * 0.05));
    }
    // Grid fill inside diamond (biased toward edges: reject too-center)
    const cols = 9;
    const rows = 8;
    let guard = 0;
    while (slots.length < n && guard < n * 20) {
      guard++;
      const gx = (rnd() - 0.5) * 2;
      const gy = (rnd() - 0.5) * 2;
      const lx = gx * halfW * coverPad;
      const ly = signY + gy * halfH * coverPad;
      const t = diamondT(lx, ly);
      if (t > 1.05) continue; // outside diamond
      // Prefer mid/edge: soft reject pure center so tips get more leaves
      if (t < 0.18 && rnd() > 0.25) continue;
      slots.push(
        new THREE.Vector3(lx + (rnd() - 0.5) * 0.04, ly + (rnd() - 0.5) * 0.03, 0.11 + rnd() * 0.07)
      );
    }
    // Pad if short
    while (slots.length < n) {
      const a = rnd() * Math.PI * 2;
      const r = 0.55 + rnd() * 0.5;
      slots.push(
        new THREE.Vector3(
          Math.cos(a) * r * halfW * coverPad,
          signY + Math.sin(a) * r * halfH * coverPad,
          0.12 + rnd() * 0.05
        )
      );
    }
    return slots.slice(0, n);
  }

  function makeEdgeFromCover(cover) {
    // Spawn outside, along ray from sign center through cover
    const cx = cover.x;
    const cy = cover.y - signY;
    const len = Math.hypot(cx, cy) || 0.01;
    const scale = 1.55 + rnd() * 0.45;
    return new THREE.Vector3(
      (cx / len) * halfW * coverPad * scale,
      signY + (cy / len) * halfH * coverPad * scale,
      0.08 + rnd() * 0.04
    );
  }

  const coverSlots = makeCoverSlots(count);
  /** @type {object[]} */
  const leaves = [];

  function tagLeaf(mesh, index) {
    mesh.name = "overgrowthLeaf";
    mesh.userData.leafIndex = index;
    mesh.userData.overgrowth = true;
    mesh.traverse((o) => {
      if (o.isMesh) {
        o.userData.overgrowth = true;
        o.userData.leafIndex = index;
      }
    });
  }

  function spawnLeaf(index, cover, startProgress) {
    const s = (0.1 + rnd() * 0.13) * leafScale;
    const mesh = makeDetailedLeaf(s, pickCol(), index % 4, rnd, { curl: false });
    tagLeaf(mesh, index);
    const edge = makeEdgeFromCover(cover);
    const progress = startProgress ?? 0; // 0 = at edge, 1 = on cover
    mesh.position.copy(edge).lerp(cover, progress);
    const ang = Math.atan2(cover.y - signY, cover.x);
    mesh.rotation.z = ang + Math.PI / 2 + (rnd() - 0.5) * 0.9;
    mesh.rotation.x = (rnd() - 0.5) * 0.45;
    mesh.rotation.y = (rnd() - 0.5) * 0.35;
    mesh.scale.setScalar(0.8 + rnd() * 0.4);
    group.add(mesh);
    return {
      mesh,
      cover: cover.clone(),
      edge: edge.clone(),
      progress, // grow onto cover
      growSpeed: 0.35 + rnd() * 0.55, // progress units / sec at full global growth
      weight: 0.55 + rnd() * 0.9,
      phase: rnd() * Math.PI * 2,
      baseRotZ: mesh.rotation.z,
      state: "growing", // growing | covered | falling
      vx: 0,
      vy: 0,
      vz: 0,
      spinX: 0,
      spinZ: 0,
      fallT: 0,
    };
  }

  for (let i = 0; i < count; i++) {
    // Start partially grown so edges already have some cover
    const p0 = 0.15 + rnd() * 0.55;
    leaves.push(spawnLeaf(i, coverSlots[i], p0));
  }

  let growth = 0.35; // global creep 0..1
  const _tmp = new THREE.Vector3();
  const GRAVITY = -4.2;
  const FALL_Y = signY - 1.6;

  function applyGrowingPose(L) {
    // progress 0 = off edge, 1 = locked on cover slot (full diamond, including tips)
    const t = Math.min(1, Math.max(0, L.progress));
    _tmp.copy(L.edge).lerp(L.cover, t);
    L.mesh.position.copy(_tmp);
    L.mesh.rotation.z =
      L.baseRotZ + Math.sin(performance.now() * 0.0015 + L.phase) * 0.05;
    L.mesh.visible = true;
    L.state = t >= 0.92 ? "covered" : "growing";
  }

  function getCoverage() {
    let sum = 0;
    let wsum = 0;
    for (const L of leaves) {
      wsum += L.weight;
      if (L.state === "falling") continue;
      const t = Math.min(1, L.progress);
      // Extra weight if slot is on diamond edge (edge coverage matters more)
      const edgeBoost = diamondT(L.cover.x, L.cover.y) > 0.55 ? 1.25 : 1;
      sum += t * L.weight * edgeBoost;
    }
    return wsum > 0 ? Math.min(1, sum / (wsum * 1.05)) : 0;
  }

  function releaseLeaf(L, swipeVx = 0, swipeVy = 0) {
    if (L.state === "falling") return;
    L.state = "falling";
    L.fallT = 0;
    // Kick from finger motion + slight outward push from center
    const ox = L.mesh.position.x;
    const oy = L.mesh.position.y - signY;
    const olen = Math.hypot(ox, oy) || 1;
    L.vx = swipeVx * 8 + (ox / olen) * (0.6 + rnd() * 0.8) + (rnd() - 0.5) * 0.4;
    L.vy = swipeVy * 8 + 0.3 + rnd() * 0.8;
    L.vz = 0.4 + rnd() * 0.9;
    L.spinX = (rnd() - 0.5) * 10;
    L.spinZ = (rnd() - 0.5) * 14;
  }

  function recycleLeaf(L, index) {
    // New cover slot: prefer edges that look sparse
    let best = null;
    let bestScore = -1;
    for (let k = 0; k < 12; k++) {
      const slot = coverSlots[Math.floor(rnd() * coverSlots.length)].clone();
      slot.x += (rnd() - 0.5) * 0.06;
      slot.y += (rnd() - 0.5) * 0.05;
      // Score: want high diamondT (edge) and few nearby covered leaves
      let near = 0;
      for (const O of leaves) {
        if (O === L || O.state === "falling") continue;
        if (O.mesh.position.distanceTo(slot) < 0.18) near++;
      }
      const score = diamondT(slot.x, slot.y) * 2 - near + rnd() * 0.3;
      if (score > bestScore) {
        bestScore = score;
        best = slot;
      }
    }
    L.cover.copy(best || coverSlots[index % coverSlots.length]);
    L.edge.copy(makeEdgeFromCover(L.cover));
    L.progress = 0;
    L.growSpeed = 0.4 + rnd() * 0.7;
    L.state = "growing";
    L.vx = L.vy = L.vz = 0;
    L.fallT = 0;
    L.phase = rnd() * Math.PI * 2;
    const ang = Math.atan2(L.cover.y - signY, L.cover.x);
    L.baseRotZ = ang + Math.PI / 2 + (rnd() - 0.5) * 0.9;
    L.mesh.position.copy(L.edge);
    L.mesh.rotation.set((rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.3, L.baseRotZ);
    L.mesh.scale.setScalar(0.75 + rnd() * 0.45);
    L.mesh.visible = true;
    // Fresh leaf color variety
    L.mesh.traverse((o) => {
      if (o.isMesh && o.material?.color) {
        o.material.color.setHex(pickCol());
      }
    });
  }

  function tick(dt) {
    growth = Math.min(1, growth + dt / growSeconds);

    for (let i = 0; i < leaves.length; i++) {
      const L = leaves[i];
      if (L.state === "falling") {
        L.fallT += dt;
        L.vy += GRAVITY * dt;
        L.mesh.position.x += L.vx * dt;
        L.mesh.position.y += L.vy * dt;
        L.mesh.position.z += L.vz * dt;
        L.mesh.rotation.x += L.spinX * dt;
        L.mesh.rotation.z += L.spinZ * dt;
        // Slight air drag
        L.vx *= Math.exp(-0.6 * dt);
        L.vz *= Math.exp(-0.4 * dt);
        if (L.mesh.position.y < FALL_Y || L.fallT > 2.8) {
          recycleLeaf(L, i);
        }
        continue;
      }

      // Grow onto cover
      const rate = L.growSpeed * (0.35 + 0.9 * growth) * dt;
      L.progress = Math.min(1, L.progress + rate);
      applyGrowingPose(L);
    }
    return getCoverage();
  }

  /**
   * Brush at local plane point (x,y). Knocks off nearby covering leaves.
   * swipeVx/Vy in local units/sec-ish (frame deltas work).
   */
  function brushAt(lx, ly, swipeVx = 0, swipeVy = 0, radius = 0.22) {
    let hit = 0;
    const speed = Math.hypot(swipeVx, swipeVy);
    const r = radius + Math.min(0.12, speed * 0.8);
    for (const L of leaves) {
      if (L.state === "falling") continue;
      if (L.progress < 0.12) continue; // still off-edge, ignore
      const dx = L.mesh.position.x - lx;
      const dy = L.mesh.position.y - ly;
      if (dx * dx + dy * dy <= r * r) {
        releaseLeaf(L, swipeVx, swipeVy);
        hit++;
      }
    }
    return hit;
  }

  function pickLeaf(raycaster) {
    const hits = raycaster.intersectObjects(group.children, true);
    for (const h of hits) {
      let p = h.object;
      while (p) {
        if (p.userData?.leafIndex !== undefined) {
          return { index: p.userData.leafIndex, point: h.point.clone() };
        }
        p = p.parent;
      }
    }
    return null;
  }

  function clearAll() {
    for (const L of leaves) {
      if (L.state !== "falling") {
        releaseLeaf(L, (rnd() - 0.5) * 0.4, 0.2 + rnd() * 0.3);
      }
    }
  }

  function reset() {
    growth = 0.3;
    for (let i = 0; i < leaves.length; i++) {
      const L = leaves[i];
      L.state = "growing";
      L.progress = 0.2 + rnd() * 0.5;
      L.vx = L.vy = L.vz = 0;
      applyGrowingPose(L);
    }
  }

  return {
    group,
    leaves,
    tick,
    getCoverage,
    pickLeaf,
    brushAt,
    releaseLeaf,
    clearAll,
    reset,
    getGrowth: () => growth,
    // legacy no-ops so old HTML doesn't break mid-deploy
    beginDrag() {},
    dragLeaf() {},
    endDrag() {},
  };
}

/**
 * Full set: dense small-leaf wall + subtle brand diamond (+ optional overgrowth).
 */
export function buildGreenWallWithNeon(nightMats = [], opts = {}) {
  const root = new THREE.Group();
  root.name = "greenWallWithNeon";
  const P = GREEN_WALL_PRESET;

  const w = opts.w ?? 2.15;
  const h = opts.h ?? 2.45;
  const density = opts.density ?? P.density;
  // Sign sits tight against foliage (was 0.3 — felt floating)
  const signZ = opts.signZ ?? 0.12;
  const signY = opts.signY ?? 0.1;
  const faceW = opts.faceW ?? 1.02;
  const faceH = opts.faceH ?? 0.74;

  const foliage = buildGreenFoliageWall(w, h, {
    density,
    leafScale: opts.leafScale ?? P.leafScale,
    heroScale: opts.heroScale ?? P.heroScale,
    seed: opts.seed,
  });
  root.add(foliage);

  const diamond = buildStacysNeonDiamond(nightMats, {
    faceW,
    faceH,
    useBrandPng: opts.useBrandPng,
  });
  diamond.position.set(0, signY, signZ);
  root.add(diamond);

  // Interactive leaves that grow over the sign (opt-in — playable workbench)
  let overgrowth = null;
  if (opts.overgrowth === true) {
    overgrowth = createSignOvergrowth({
      count: opts.overgrowthCount ?? 68,
      faceW,
      faceH,
      leafScale: (opts.leafScale ?? P.leafScale) * 1.05,
      signY,
      growSeconds: opts.growSeconds ?? 32,
      seed: (opts.seed ?? 107) + 50,
    });
    // Place slightly in front of sign face
    overgrowth.group.position.z = signZ + 0.02;
    root.add(overgrowth.group);
  }

  // Soft, believable neon spill on nearby leaves (not a rave wash)
  const wash = new THREE.PointLight(NEON.purple, P.washDay, 4.2, 2.2);
  wash.position.set(0, signY + 0.02, signZ + 0.45);
  root.add(wash);
  const bounce = new THREE.PointLight(0xc080e0, P.bounceDay, 3.2, 2.2);
  bounce.position.set(0, signY - 0.5, signZ + 0.35);
  root.add(bounce);
  const tealKick = new THREE.PointLight(NEON.teal, P.tealDay, 2.4, 2.2);
  tealKick.position.set(0.28, signY - 0.05, signZ + 0.4);
  root.add(tealKick);

  root.userData.foliage = foliage;
  root.userData.diamond = diamond;
  root.userData.overgrowth = overgrowth;
  root.userData.wash = wash;
  root.userData.bounce = bounce;
  root.userData.tealKick = tealKick;
  root.userData.nightLights = [
    { light: wash, day: P.washDay, night: P.washNight },
    { light: bounce, day: P.bounceDay, night: P.bounceNight },
    { light: tealKick, day: P.tealDay, night: P.tealNight },
  ];
  root.userData.preset = { ...P, density };

  return root;
}
