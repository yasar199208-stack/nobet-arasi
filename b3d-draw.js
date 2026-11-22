// Zıpla Top 3D: çizim (canvas ile sahte 3B)
import { obj, ball } from "./b3d-obj.js?v=1";
const W = 360, H = 520, HY = 170, F = 300, R = 0.5;
const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
function mix(a, b, t) {
  const p = hx(a), q = hx(b);
  return "rgb(" + p.map((v, i) => Math.round(v + (q[i] - v) * t)) + ")";
}
export function draw(c, S) {
  const g = S.g, th = g.th, b = S.ball, cx = b.x * 0.55, cy = 3.3 + b.y * 0.3, cz = b.z - 5.2;
  const P = (x, y, z) => { const d = Math.max(0.3, z - cz); return [W / 2 + (x - cx) * F / d, HY + (cy - y) * F / d]; };
  const fog = (z) => Math.min(1, Math.max(0, (z - cz - 25) / 50));
  const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); };
  const gr = c.createLinearGradient(0, 0, 0, HY); gr.addColorStop(0, th.t); gr.addColorStop(1, th.b);
  c.fillStyle = gr; c.fillRect(0, 0, W, HY);
  c.fillStyle = th.h; c.beginPath(); c.moveTo(0, HY);
  for (let x = 0; x <= W; x += 20) c.lineTo(x, HY - 18 - 14 * Math.sin(x * 0.03 + cz * 0.01 + cx * 0.2));
  c.lineTo(W, HY); c.fill();
  c.fillStyle = th.v; c.fillRect(0, HY, W, H - HY);
  const z0 = Math.floor((cz + 0.6) / 2) * 2, zE = Math.min(g.L + 24, cz + 78);
  const inGap = (z) => g.gaps.some((a) => z > a[0] && z < a[1]);
  for (let z = Math.floor(zE / 2) * 2; z >= z0; z -= 2) {
    if (z < 0 || inGap(z + 1)) continue;
    const f = fog(z), i = z / 2, pad = g.pads.find((p) => z + 1 > p.z && z + 1 < p.z + p.len);
    [-1, 1].forEach((s, k) => {
      const xa = s < 0 ? -g.hw : 0, xb = s < 0 ? 0 : g.hw;
      const col = pad ? ((i + k) % 2 ? "#ffb020" : "#ffd84a") : ((i + k) % 2 ? th.f1 : th.f2);
      poly([P(xa, 0, z), P(xb, 0, z), P(xb, 0, z + 2), P(xa, 0, z + 2)], mix(col, th.b, f));
    });
    const sd = mix(th.f2, "#000000", 0.45);
    poly([P(-g.hw, 0, z), P(-g.hw, -0.9, z), P(-g.hw, -0.9, z + 2), P(-g.hw, 0, z + 2)], sd);
    poly([P(g.hw, 0, z), P(g.hw, -0.9, z), P(g.hw, -0.9, z + 2), P(g.hw, 0, z + 2)], sd);
  }
  g.cps.forEach((z) => { if (z > cz + 1 && z < cz + 60) poly([P(-g.hw, 0.02, z), P(g.hw, 0.02, z), P(g.hw, 0.02, z + 1), P(-g.hw, 0.02, z + 1)], "#3ad0ff"); });
  [g.L, g.L + 1].forEach((z, k) => { if (z > cz + 1) for (let i = 0; i < 8; i++) poly([P(-g.hw + i * g.hw / 4, 0.03, z), P(-g.hw + (i + 1) * g.hw / 4, 0.03, z), P(-g.hw + (i + 1) * g.hw / 4, 0.03, z + 1), P(-g.hw + i * g.hw / 4, 0.03, z + 1)], (i + k) % 2 ? "#fff" : "#111"); });
  if (!inGap(b.z)) { const sp = P(b.x, 0, b.z), sc = F / (b.z - cz); c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(sp[0], sp[1], R * sc * 0.9, R * sc * 0.3, 0, 0, 7); c.fill(); }
  const items = [];
  g.objs.forEach((o) => { if (o.z > cz + 0.8 && o.z < cz + 70) items.push({ z: o.z, o: o }); });
  g.coins.forEach((k) => { if (!k.got && k.z > cz + 0.8 && k.z < cz + 70) items.push({ z: k.z, k: k }); });
  items.push({ z: b.z, ball: 1 });
  items.sort((a, b2) => b2.z - a.z);
  items.forEach((it) => {
    c.globalAlpha = 1 - fog(it.z) * 0.85;
    if (it.ball) { ball(c, S, P); }
    else if (it.k) {
      const p = P(it.k.x, it.k.y, it.k.z), s = F / (it.k.z - cz) * 0.4, w = Math.max(0.15, Math.abs(Math.cos(S.t * 4 + it.k.z)));
      c.fillStyle = "#ffd23a"; c.strokeStyle = "#b8860b"; c.lineWidth = 2;
      c.beginPath(); c.ellipse(p[0], p[1], s * w, s, 0, 0, 7); c.fill(); c.stroke();
    } else obj(c, it.o, S, P, cx);
    c.globalAlpha = 1;
  });
}
