// Zıpla Top 3D: engel ve top çizimi
const F = 300, R = 0.5;
export function obj(c, o, S, P, cx) {
  const x = o.k === "mover" ? o.x + o.amp * Math.sin(S.t * o.sp + o.ph) : o.x, w = o.w, d = 0.7, h = o.h;
  const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); };
  if (o.k === "spike") {
    poly([P(x - w, 0, o.z - d), P(x + w, 0, o.z - d), P(x, h, o.z)], "#e23b3b");
    const sx = x > cx ? -1 : 1;
    poly([P(x + sx * w, 0, o.z - d), P(x + sx * w, 0, o.z + d), P(x, h, o.z)], "#a82424");
    return;
  }
  const top = o.k === "mover" ? "#ffb84a" : "#6aa0ff", fr = o.k === "mover" ? "#e08a1a" : "#3f6fd6", sd = o.k === "mover" ? "#b86a10" : "#2a4ea0";
  const sx = x > cx ? -1 : 1;
  poly([P(x + sx * w, 0, o.z - d), P(x + sx * w, 0, o.z + d), P(x + sx * w, h, o.z + d), P(x + sx * w, h, o.z - d)], sd);
  poly([P(x - w, 0, o.z - d), P(x + w, 0, o.z - d), P(x + w, h, o.z - d), P(x - w, h, o.z - d)], fr);
  poly([P(x - w, h, o.z - d), P(x + w, h, o.z - d), P(x + w, h, o.z + d), P(x - w, h, o.z + d)], top);
}
export function ball(c, S, P) {
  const b = S.ball;
  if (S.inv > 0 && Math.floor(S.t * 12) % 2) return;
  const p = P(b.x, b.y + R, b.z), s = F / Math.max(0.3, b.z - (S.ball.z - 5.2)) * R;
  const gr = c.createRadialGradient(p[0] - s * 0.35, p[1] - s * 0.35, s * 0.1, p[0], p[1], s);
  gr.addColorStop(0, "#ffd0d0"); gr.addColorStop(0.35, "#ff4d4d"); gr.addColorStop(1, "#8c1010");
  c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], s, 0, 7); c.fill();
}
