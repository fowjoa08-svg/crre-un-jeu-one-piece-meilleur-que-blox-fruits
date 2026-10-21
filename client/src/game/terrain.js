// Procedural island height field shared by the terrain mesh, the player and the
// camera so everything agrees on where the ground is.

export const ISLAND_RADIUS = 62;

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    sum += amp * valueNoise(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

export function coastRadius(angle) {
  return ISLAND_RADIUS + Math.sin(angle * 3) * 7 + Math.cos(angle * 5 + 1.3) * 4;
}

export function terrainHeight(x, z) {
  const r = Math.hypot(x, z);
  const coast = coastRadius(Math.atan2(z, x));
  const inside = smoothstep(coast + 14, coast - 14, r);
  const base =
    7 +
    (fbm(x * 0.014, z * 0.014) - 0.5) * 12 +
    (fbm(x * 0.05 + 9, z * 0.05 + 3) - 0.5) * 2.4;
  const hillTop = Math.max(0, 1 - r / ISLAND_RADIUS);
  const mountain = Math.pow(hillTop, 2.2) * 17 * (0.7 + 0.6 * fbm(x * 0.02 + 4, z * 0.02 + 4));
  return (base + mountain) * inside - 12 * (1 - inside);
}

export function isWalkable(x, z) {
  return terrainHeight(x, z) > -0.9;
}

// Small seeded PRNG so palms/rocks keep their layout between reloads.
export function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
