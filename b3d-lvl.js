// Zıpla Top 3D: bölüm üretici (sonsuz bölüm, kolaydan zora)
const mul32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const THEMES = [
  { n: "Çimen Yolu", t: "#4aa8ff", b: "#d6efff", f1: "#7bd36a", f2: "#63bf5a", v: "#10361f", h: "#3d8f4a" },
  { n: "Gün Batımı", t: "#5a3d9a", b: "#ffb36b", f1: "#f2c58a", f2: "#e0ae72", v: "#2a1530", h: "#8a4a6a" },
  { n: "Buz Pisti", t: "#7fb0e8", b: "#eef6ff", f1: "#dff0ff", f2: "#c4def5", v: "#12243d", h: "#9fc0e6" },
  { n: "Gece", t: "#04060f", b: "#1d2a5e", f1: "#4a5a9a", f2: "#3d4c88", v: "#02030a", h: "#1a2350" },
  { n: "Çöl", t: "#58b0ff", b: "#ffe9b8", f1: "#e8c97e", f2: "#d9b86c", v: "#3a2410", h: "#c79a55" },
  { n: "Neon", t: "#05020f", b: "#3a1466", f1: "#3b2a78", f2: "#2f2064", v: "#08030f", h: "#5a2a9a" }
];
export function gen(lv) {
  const r = mul32(lv * 7919 + 13), d = Math.min(1, (lv - 1) / 11);
  const L = Math.min(900, 240 + 40 * lv), v = Math.min(17, 9 + 0.5 * lv), hw = Math.max(1.9, 2.5 - 0.06 * lv);
  const objs = [], coins = [], gaps = [], pads = [], cps = [L * 0.33, L * 0.66];
  const two = hw >= 1.8, lx = (i) => i * hw * 0.7, lane = () => Math.floor(r() * 3) - 1;
  let z = 30;
  while (z < L - 30) {
    if (cps.some((c) => z > c - 12 && z < c + 10)) { z += 8; continue; }
    const q = r();
    if (lv >= 3 && q < 0.12 + 0.08 * d) {
      const pl = Math.round(0.8 * v + 1);
      let gl = 3 + Math.floor(r() * (1 + d * 3));
      gl = Math.min(gl, Math.floor(0.66 * v - 1.5));
      pads.push({ z: z, len: pl });
      gaps.push([z + pl, z + pl + gl]);
      for (let i = 0; i < 4; i++) coins.push({ x: 0, y: 3.5, z: z + pl + 0.5 + i * (gl / 3), got: false });
      z += pl + gl + 9;
      continue;
    }
    if (q < 0.4) {
      const a = lane(); objs.push({ k: "spike", x: lx(a), z: z, w: 0.5, h: 0.9 });
      if (two && lv >= 4) { const b = (a + 1 + Math.floor(r() * 2) + 3) % 3 - 1; if (b !== a && r() < 0.4 + d * 0.4) objs.push({ k: "spike", x: lx(b), z: z, w: 0.5, h: 0.9 }); }
    } else if (q < 0.68) {
      const a = lane(); objs.push({ k: "block", x: lx(a), z: z, w: 0.6, h: 1.2 });
      if (two && lv >= 3 && r() < 0.3 + d * 0.5) { const b = (a + 2 + Math.floor(r() * 2) + 1) % 3 - 1; if (b !== a) objs.push({ k: "block", x: lx(b), z: z, w: 0.6, h: 1.2 }); }
    } else if (q < 0.8 && lv >= 5) {
      objs.push({ k: "mover", x: 0, z: z, w: 0.55, h: 1.1, amp: hw * 0.7, sp: 1 + d * 1.5, ph: r() * 6 });
    } else {
      const a = lane();
      for (let i = 0; i < 5; i++) coins.push({ x: lx(a), y: 1.3 + (i === 2 ? 0.5 : 0), z: z + i * 1.6, got: false });
    }
    z += Math.max(7, 12 + r() * 5 - 5 * d);
  }
  return { L: L, v: v, hw: hw, objs: objs, coins: coins, gaps: gaps, pads: pads, cps: cps, th: THEMES[(lv - 1) % THEMES.length] };
}
