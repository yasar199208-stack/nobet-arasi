// Amiral gemisi maske: "Efsane Kral". Altın taç, mücevherler, ışık huzmeleri, süzülen ışıklar, süslü altın maske ve parlayan gözler.
import { SP5, drawSp5 } from "./vcmask5.js?v=1";
export const SP4 = [["efsane", "🌟 EFSANE KRAL"]].concat(SP5);
const TAU = Math.PI * 2;
function rnd(n) { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); }
function glow(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
  c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalAlpha = 1;
}
function spark(c, x, y, r) {
  c.beginPath();
  c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath();
}
function gem(c, x, y, r, hue, t, ph) {
  const k = 0.75 + 0.25 * Math.sin(t / 260 + ph);
  c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y, r * 3.2, "hsl(" + hue + ",100%,60%)", 0.55 * k); c.restore();
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, "#fff"); g.addColorStop(0.35, "hsl(" + hue + ",100%,68%)"); g.addColorStop(1, "hsl(" + hue + ",90%,32%)");
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = g; c.fill();
  c.lineWidth = Math.max(1, r * 0.18); c.strokeStyle = "#8a5a00"; c.stroke();
}

export function drawSp4(id, c, cx, cy, s, t) {
  if (id !== "efsane") return drawSp5(id, c, cx, cy, s, t);
  const ey = cy - 0.07 * s, y0 = cy - 0.42 * s, pulse = 0.5 + 0.5 * Math.sin(t / 700);
  c.save();
  // 1) Altın aura
  c.globalCompositeOperation = "lighter";
  glow(c, cx, cy - 0.05 * s, s * 0.9, "rgba(255,190,70,0.9)", 0.22 + 0.1 * pulse);
  // 2) Taç arkasında ışık huzmeleri
  const rx = cx, ry = y0 - 0.12 * s;
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.2 + Math.sin(t / 1500 + i) * 0.04, L = s * (0.55 + 0.12 * Math.sin(t / 400 + i * 1.7));
    const g = c.createLinearGradient(rx, ry, rx + Math.cos(a) * L, ry + Math.sin(a) * L);
    g.addColorStop(0, "rgba(255,230,140,0.55)"); g.addColorStop(1, "rgba(255,200,60,0)");
    c.beginPath(); c.moveTo(rx, ry);
    c.lineTo(rx + Math.cos(a - 0.045) * L, ry + Math.sin(a - 0.045) * L); c.lineTo(rx + Math.cos(a + 0.045) * L, ry + Math.sin(a + 0.045) * L);
    c.closePath(); c.fillStyle = g; c.fill();
  }
  c.globalCompositeOperation = "source-over";
  // 3) Şakaklarda altın kanatçıklar
  [-1, 1].forEach((d) => {
    const g = c.createLinearGradient(cx + d * 0.3 * s, ey, cx + d * 0.7 * s, ey - 0.3 * s);
    g.addColorStop(0, "#c98a00"); g.addColorStop(0.5, "#ffd54a"); g.addColorStop(1, "#fff6b0");
    for (let k = 0; k < 3; k++) {
      const o = k * 0.075 * s, fl = Math.sin(t / 500 + k) * 0.015 * s;
      c.beginPath();
      c.moveTo(cx + d * 0.33 * s, ey + 0.05 * s - o * 0.4);
      c.quadraticCurveTo(cx + d * (0.5 + k * 0.05) * s, ey - 0.02 * s - o, cx + d * (0.66 - k * 0.06) * s, ey - (0.26 - k * 0.02) * s - o * 0.3 + fl);
      c.quadraticCurveTo(cx + d * (0.5 + k * 0.03) * s, ey - 0.1 * s - o * 0.5, cx + d * 0.33 * s, ey + 0.0 * s - o * 0.4);
      c.closePath(); c.fillStyle = g; c.fill(); c.lineWidth = Math.max(1, s * 0.008); c.strokeStyle = "#8a5a00"; c.stroke();
    }
  });
  // 4) Süslü altın maske
  const P = [[-0.4, -0.02], [-0.3, -0.14], [-0.1, -0.1], [0, -0.15], [0.1, -0.1], [0.3, -0.14], [0.4, -0.02], [0.3, 0.06], [0.14, 0.1], [0.07, 0.04], [0, 0.07], [-0.07, 0.04], [-0.14, 0.1], [-0.3, 0.06]];
  c.beginPath(); P.forEach((p, i) => { const x = cx + p[0] * s, y = ey + p[1] * s; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath();
  [-1, 1].forEach((d) => { c.moveTo(cx + d * 0.17 * s + 0.085 * s, ey + 0.005 * s); c.ellipse(cx + d * 0.17 * s, ey + 0.005 * s, 0.085 * s, 0.05 * s, d * -0.18, 0, TAU); });
  const mg = c.createLinearGradient(cx - 0.4 * s, 0, cx + 0.4 * s, 0);
  mg.addColorStop(0, "#a8740a"); mg.addColorStop(0.3, "#ffe27a"); mg.addColorStop(0.5, "#fff6c0"); mg.addColorStop(0.7, "#ffe27a"); mg.addColorStop(1, "#a8740a");
  c.fillStyle = mg; c.fill("evenodd"); c.lineWidth = Math.max(1.5, s * 0.014); c.strokeStyle = "#7a4d00"; c.lineJoin = "round"; c.stroke();
  // maske üstünde ince süs çizgisi
  c.strokeStyle = "rgba(122,77,0,0.55)"; c.lineWidth = Math.max(1, s * 0.007);
  c.beginPath(); c.moveTo(cx - 0.36 * s, ey - 0.03 * s); c.lineTo(cx - 0.27 * s, ey - 0.1 * s); c.lineTo(cx - 0.1 * s, ey - 0.07 * s); c.lineTo(cx, ey - 0.11 * s); c.lineTo(cx + 0.1 * s, ey - 0.07 * s); c.lineTo(cx + 0.27 * s, ey - 0.1 * s); c.lineTo(cx + 0.36 * s, ey - 0.03 * s); c.stroke();
  // 5) Parlayan gözler
  c.save(); c.globalCompositeOperation = "lighter";
  [-1, 1].forEach((d) => {
    const ex = cx + d * 0.17 * s, k = 0.8 + 0.2 * Math.sin(t / 240 + d);
    glow(c, ex, ey + 0.005 * s, s * 0.17 * k, "rgba(70,220,255,0.95)", 0.9);
    glow(c, ex, ey + 0.005 * s, s * 0.06, "rgba(255,255,255,1)", 0.95);
  });
  c.restore();
  gem(c, cx, ey - 0.115 * s, s * 0.026, 350, t, 0);
  // 6) Mücevherli taç
  const C = [[-0.32, 0.1], [-0.3, -0.18], [-0.22, -0.05], [-0.15, -0.3], [-0.07, -0.1], [0, -0.46], [0.07, -0.1], [0.15, -0.3], [0.22, -0.05], [0.3, -0.18], [0.32, 0.1]];
  const cg = c.createLinearGradient(0, y0 - 0.46 * s, 0, y0 + 0.1 * s);
  cg.addColorStop(0, "#fff8c4"); cg.addColorStop(0.35, "#ffd54a"); cg.addColorStop(0.75, "#e0a010"); cg.addColorStop(1, "#9a6700");
  c.beginPath(); C.forEach((p, i) => { const x = cx + p[0] * s, y = y0 + p[1] * s; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath();
  c.fillStyle = cg; c.fill(); c.lineWidth = Math.max(1.5, s * 0.016); c.strokeStyle = "#7a4d00"; c.stroke();
  // taç bandı
  c.fillStyle = "rgba(122,77,0,0.35)"; c.fillRect(cx - 0.32 * s, y0 + 0.02 * s, 0.64 * s, 0.08 * s);
  for (let k = 0; k < 9; k++) { c.fillStyle = "rgba(255,255,255," + (0.55 + 0.45 * Math.sin(t / 200 + k)) + ")"; c.beginPath(); c.arc(cx + (k - 4) * 0.075 * s, y0 + 0.06 * s, s * 0.011, 0, TAU); c.fill(); }
  gem(c, cx - 0.3 * s, y0 - 0.18 * s, s * 0.03, 350, t, 1);
  gem(c, cx - 0.15 * s, y0 - 0.3 * s, s * 0.032, 215, t, 2);
  gem(c, cx + 0.15 * s, y0 - 0.3 * s, s * 0.032, 140, t, 3);
  gem(c, cx + 0.3 * s, y0 - 0.18 * s, s * 0.03, 350, t, 4);
  gem(c, cx, y0 - 0.16 * s, s * 0.04, 190, t, 5);
  // büyük elmas ışıltısı
  const rr = s * (0.075 + 0.04 * Math.sin(t / 180)), dx = cx, dy = y0 - 0.46 * s - s * 0.015;
  c.save(); c.globalCompositeOperation = "lighter";
  glow(c, dx, dy, s * 0.12, "rgba(255,255,255,1)", 0.6);
  c.translate(dx, dy); c.rotate(t / 1200); c.fillStyle = "rgba(255,255,255,0.95)"; spark(c, 0, 0, rr * 1.4);
  c.rotate(Math.PI / 4); c.fillStyle = "rgba(190,240,255,0.8)"; spark(c, 0, 0, rr);
  c.restore();
  // 7) Kafanın çevresinde dönen ışıklar
  c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 14; i++) {
    for (let tr = 0; tr < 4; tr++) {
      const a = t / 1300 + i * TAU / 14 - tr * 0.07;
      const x = cx + Math.cos(a) * 0.68 * s, y = cy - 0.02 * s + Math.sin(a) * 0.24 * s, behind = Math.sin(a) < -0.2;
      const al = (1 - tr * 0.27) * (behind ? 0.45 : 1) * (0.55 + 0.45 * Math.sin(t / 150 + i * 2));
      c.fillStyle = i % 3 === 0 ? "rgba(120,230,255," + al + ")" : "rgba(255,226,120," + al + ")";
      spark(c, x, y, s * (0.045 - tr * 0.008));
      c.fill();
    }
  }
  // 8) Yukarı süzülen ışık parçacıkları
  for (let i = 0; i < 12; i++) {
    const p = (t / 2400 + i / 12) % 1, x = cx + (rnd(i * 3.1) - 0.5) * 0.7 * s + Math.sin(t / 500 + i) * 0.02 * s, y = y0 - 0.15 * s - p * 0.75 * s;
    c.fillStyle = "rgba(255,220,110," + (1 - p) * 0.85 + ")"; c.beginPath(); c.arc(x, y, s * (0.012 + 0.012 * (1 - p)), 0, TAU); c.fill();
  }
  c.restore();
  c.restore();
  return true;
}
