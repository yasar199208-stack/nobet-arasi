// Özel güvenlik görevlisi için EFSANE maskeler: kendi çizimimiz. vcmask4.js bu dosyayı yükler.
export const SP6 = [
  ["amir", "🎖️ EFSANE Amir"], ["siber", "🤖 EFSANE Siber Muhafız"], ["gecenb", "🌙 EFSANE Gece Nöbetçisi"], ["sovalye", "⚔️ EFSANE Şövalye"], ["nisan", "🏅 EFSANE Altın Nişan"]
];
const TAU = Math.PI * 2;
const EF = "'Apple Color Emoji','Noto Color Emoji','Segoe UI Emoji',sans-serif";
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
function star(c, x, y, r, r2) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r2 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
  c.closePath();
}
function shield(c, x, y, w, h) {
  c.beginPath(); c.moveTo(x - w, y - h * 0.5); c.lineTo(x + w, y - h * 0.5);
  c.bezierCurveTo(x + w, y + h * 0.1, x + w * 0.5, y + h * 0.4, x, y + h * 0.5);
  c.bezierCurveTo(x - w * 0.5, y + h * 0.4, x - w, y + h * 0.1, x - w, y - h * 0.5); c.closePath();
}
function goldG(c, x0, y0, x1, y1) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#fff3a0"); g.addColorStop(0.45, "#ffc928"); g.addColorStop(1, "#b97f00"); return g;
}
function laurel(c, bx, by, R, s, t) {
  [-1, 1].forEach((d) => {
    for (let k = 0; k < 7; k++) {
      const f = 0.15 + k * 0.36, px = bx + d * Math.sin(f) * R, py = by + Math.cos(f) * R, ang = Math.atan2(-Math.sin(f), d * Math.cos(f));
      c.save(); c.translate(px, py); c.rotate(ang + d * 0.5);
      c.fillStyle = k % 2 ? "#ffd54a" : "#e8aa10"; c.beginPath(); c.ellipse(0, 0, s * 0.032, s * 0.013, 0, 0, TAU); c.fill();
      c.restore();
    }
  });
}

export function drawSp6(id, c, cx, cy, s, t) {
  if (SP6.every((q) => q[0] !== id)) return false;
  const ey = cy - 0.07 * s, y0 = cy - 0.42 * s;
  c.save();
  if (id === "amir") {
    c.save(); c.globalCompositeOperation = "lighter"; glow(c, cx, y0, s * 0.65, "rgba(255,210,90,0.9)", 0.15 + 0.08 * Math.sin(t / 600)); c.restore();
    const g = c.createLinearGradient(0, y0 - 0.22 * s, 0, y0 + 0.1 * s); g.addColorStop(0, "#34497f"); g.addColorStop(1, "#0f1a34");
    c.beginPath(); c.ellipse(cx, y0 + 0.07 * s, 0.39 * s, 0.28 * s, 0, Math.PI, 0); c.closePath(); c.fillStyle = g; c.fill();
    c.lineWidth = Math.max(1.5, s * 0.012); c.strokeStyle = "#070c1a"; c.stroke();
    c.fillStyle = "rgba(255,255,255,0.13)"; c.beginPath(); c.ellipse(cx - 0.17 * s, y0 - 0.12 * s, 0.12 * s, 0.045 * s, -0.55, 0, TAU); c.fill();
    c.fillStyle = "#070c1a"; c.fillRect(cx - 0.39 * s, y0 + 0.01 * s, 0.78 * s, 0.11 * s);
    c.strokeStyle = "#ffd54a"; c.lineWidth = Math.max(1.5, s * 0.012);
    [0.04, 0.09].forEach((o) => { c.beginPath(); for (let i = 0; i <= 26; i++) { const x = cx - 0.38 * s + i * 0.76 * s / 26, y = y0 + o * s + (i % 2 ? 0.01 : -0.01) * s; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); });
    c.beginPath(); c.ellipse(cx, y0 + 0.13 * s, 0.33 * s, 0.055 * s, 0, 0, Math.PI); c.fillStyle = "#04070f"; c.fill();
    c.strokeStyle = "#ffd54a"; c.lineWidth = Math.max(1.5, s * 0.01); c.beginPath(); c.ellipse(cx, y0 + 0.13 * s, 0.33 * s, 0.055 * s, 0, 0.12, Math.PI - 0.12); c.stroke();
    const bx = cx, by = y0 - 0.08 * s;
    laurel(c, bx, by + 0.01 * s, 0.125 * s, s, t);
    shield(c, bx, by, 0.07 * s, 0.14 * s); c.fillStyle = goldG(c, bx - 0.07 * s, by - 0.07 * s, bx + 0.07 * s, by + 0.07 * s); c.fill(); c.lineWidth = Math.max(1, s * 0.008); c.strokeStyle = "#7a4d00"; c.stroke();
    shield(c, bx, by + 0.004 * s, 0.05 * s, 0.1 * s); c.fillStyle = "#14213d"; c.fill();
    star(c, bx, by - 0.006 * s, s * 0.04, s * 0.017); c.fillStyle = goldG(c, bx - 0.04 * s, by - 0.04 * s, bx + 0.04 * s, by + 0.04 * s); c.fill();
    c.save(); shield(c, bx, by, 0.07 * s, 0.14 * s); c.clip();
    const p = (t / 2600) % 1.7 - 0.35, sx = bx - 0.1 * s + p * 0.25 * s;
    c.fillStyle = "rgba(255,255,255,0.55)"; c.beginPath(); c.moveTo(sx, by - 0.08 * s); c.lineTo(sx + 0.035 * s, by - 0.08 * s); c.lineTo(sx - 0.03 * s, by + 0.08 * s); c.lineTo(sx - 0.065 * s, by + 0.08 * s); c.closePath(); c.fill(); c.restore();
    c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.6, k = 0.5 + 0.5 * Math.sin(t / 220 + i * 1.9); c.fillStyle = "rgba(255,240,170," + k + ")"; spark(c, bx + Math.cos(a) * 0.19 * s, by + Math.sin(a) * 0.15 * s, s * (0.012 + 0.025 * k)); c.fill(); }
    c.restore();
  } else if (id === "siber") {
    c.save(); c.globalCompositeOperation = "lighter";
    [[0.7, 0.0, 0.28, 1], [0.5, -0.5, 0.2, -1]].forEach((q) => {
      const rot = (t / 2500) * q[3];
      c.strokeStyle = "rgba(70,230,255,0.5)"; c.lineWidth = Math.max(1.5, s * 0.01); c.beginPath();
      const pts = [];
      for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; pts.push([cx + Math.cos(a) * q[0] * s, cy + q[1] * s + Math.sin(a) * q[0] * s * q[2]]); }
      pts.forEach((p, i) => { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.stroke();
      pts.forEach((p, i) => { glow(c, p[0], p[1], s * 0.05, "rgba(120,240,255,1)", 0.5 + 0.5 * Math.sin(t / 200 + i)); });
    });
    c.restore();
    const vx = cx - 0.4 * s, vy = ey - 0.1 * s, vw = 0.8 * s, vh = 0.21 * s;
    const vg = c.createLinearGradient(vx, vy, vx + vw, vy + vh); vg.addColorStop(0, "rgba(0,210,255,0.32)"); vg.addColorStop(1, "rgba(30,110,255,0.2)");
    c.beginPath(); c.roundRect(vx, vy, vw, vh, 0.08 * s); c.fillStyle = vg; c.fill();
    c.shadowColor = "#19e6ff"; c.shadowBlur = s * 0.06; c.strokeStyle = "#5df0ff"; c.lineWidth = Math.max(2, s * 0.015); c.stroke(); c.shadowBlur = 0;
    c.save(); c.beginPath(); c.roundRect(vx, vy, vw, vh, 0.08 * s); c.clip();
    const sp = ((t / 1400) % 1) * vw; c.fillStyle = "rgba(160,250,255,0.5)"; c.fillRect(vx + sp, vy, s * 0.012, vh);
    c.restore();
    c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(120,245,255,0.9)"; c.lineWidth = Math.max(1.5, s * 0.01);
    [-1, 1].forEach((d) => { const x = cx + d * 0.17 * s; c.setLineDash([s * 0.03, s * 0.025]); c.lineDashOffset = -t / 40 * d; c.beginPath(); c.arc(x, ey + 0.005 * s, 0.085 * s, 0, TAU); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.moveTo(x - 0.11 * s, ey); c.lineTo(x - 0.06 * s, ey); c.moveTo(x + 0.06 * s, ey); c.lineTo(x + 0.11 * s, ey); c.stroke(); });
    c.restore();
    [-1, 1].forEach((d) => { c.fillStyle = "#0b1220"; c.beginPath(); c.roundRect(cx + d * 0.43 * s - 0.03 * s, cy - 0.07 * s, 0.06 * s, 0.14 * s, 0.02 * s); c.fill();
      c.fillStyle = Math.floor(t / 350 + d) % 2 ? "#19e6ff" : "#0a4d5a"; c.beginPath(); c.arc(cx + d * 0.43 * s, cy - 0.03 * s, s * 0.012, 0, TAU); c.fill(); });
    c.strokeStyle = "#7d8ea3"; c.lineWidth = Math.max(2, s * 0.014); c.beginPath(); c.moveTo(cx + 0.44 * s, cy - 0.07 * s); c.lineTo(cx + 0.47 * s, y0 + 0.02 * s); c.stroke();
    c.save(); c.globalCompositeOperation = "lighter";
    for (let k = 0; k < 2; k++) { const p = ((t / 1200) + k / 2) % 1; c.strokeStyle = "rgba(90,235,255," + (1 - p) + ")"; c.lineWidth = Math.max(1, s * 0.008); c.beginPath(); c.arc(cx + 0.47 * s, y0 + 0.02 * s, s * (0.02 + p * 0.09), 0, TAU); c.stroke(); }
    c.restore();
    const fl = rnd(Math.floor(t / 110)) > 0.92 ? 0.35 : 1;
    c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = fl; c.shadowColor = "#19e6ff"; c.shadowBlur = s * 0.05;
    c.fillStyle = "#8ff6ff"; c.font = "bold " + Math.round(s * 0.062) + "px monospace"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("GÜVENLİK AKTİF", cx, y0 - 0.2 * s + Math.sin(t / 600) * 0.01 * s);
    c.strokeStyle = "rgba(140,246,255,0.8)"; c.lineWidth = Math.max(1.5, s * 0.01);
    [-1, 1].forEach((d) => { c.beginPath(); c.moveTo(cx + d * 0.42 * s, y0 - 0.25 * s); c.lineTo(cx + d * 0.46 * s, y0 - 0.25 * s); c.lineTo(cx + d * 0.46 * s, y0 - 0.15 * s); c.lineTo(cx + d * 0.42 * s, y0 - 0.15 * s); c.stroke(); });
    c.restore();
  } else if (id === "gecenb") {
    const mx = cx + 0.4 * s, my = y0 - 0.14 * s;
    c.save(); c.globalCompositeOperation = "lighter"; glow(c, mx, my, s * 0.5, "rgba(255,230,150,0.9)", 0.3 + 0.1 * Math.sin(t / 500)); c.restore();
    const mg = c.createLinearGradient(mx - 0.2 * s, my - 0.2 * s, mx + 0.2 * s, my + 0.2 * s); mg.addColorStop(0, "#fffbe0"); mg.addColorStop(1, "#ffd978");
    c.beginPath(); c.arc(mx, my, 0.22 * s, 0, TAU); c.moveTo(mx + 0.09 * s + 0.19 * s, my - 0.04 * s); c.arc(mx + 0.09 * s, my - 0.04 * s, 0.19 * s, 0, TAU);
    c.fillStyle = mg; c.fill("evenodd");
    c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 11; i++) {
      const a = rnd(i * 5.3) * TAU, r = (0.38 + rnd(i * 2.1) * 0.3) * s, x = cx + Math.cos(a) * r * 1.05, y = cy - 0.1 * s + Math.sin(a) * r * 0.9;
      const k = 0.5 + 0.5 * Math.sin(t / (200 + i * 30) + i * 2);
      c.fillStyle = "rgba(255,244,200," + (0.3 + 0.7 * k) + ")"; spark(c, x, y, s * (0.012 + 0.03 * k)); c.fill();
    }
    for (let i = 0; i < 8; i++) {
      const x = cx + Math.sin(t / (900 + i * 130) + i) * 0.55 * s, y = cy - 0.1 * s + Math.cos(t / (1100 + i * 90) + i * 1.3) * 0.38 * s, k = 0.5 + 0.5 * Math.sin(t / 250 + i * 3);
      glow(c, x, y, s * 0.045, "rgba(200,255,90,1)", 0.35 + 0.65 * k);
    }
    c.restore();
    const bg = c.createLinearGradient(0, y0 - 0.2 * s, 0, y0 + 0.1 * s); bg.addColorStop(0, "#26334f"); bg.addColorStop(1, "#111a2e");
    c.beginPath(); c.ellipse(cx, y0 + 0.09 * s, 0.36 * s, 0.27 * s, 0, Math.PI, 0); c.closePath(); c.fillStyle = bg; c.fill();
    c.fillStyle = "#0c1322"; c.beginPath(); c.roundRect(cx - 0.38 * s, y0 + 0.0 * s, 0.76 * s, 0.13 * s, 0.04 * s); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.1)"; c.lineWidth = Math.max(1, s * 0.006); for (let k = -8; k <= 8; k++) { c.beginPath(); c.moveTo(cx + k * 0.045 * s, y0 + 0.01 * s); c.lineTo(cx + k * 0.045 * s, y0 + 0.12 * s); c.stroke(); }
    c.strokeStyle = "#cfe3ff"; c.lineWidth = Math.max(2, s * 0.012); c.beginPath(); c.moveTo(cx - 0.37 * s, y0 + 0.095 * s); c.lineTo(cx + 0.37 * s, y0 + 0.095 * s); c.stroke();
    star(c, cx, y0 - 0.06 * s, s * 0.05, s * 0.022); c.fillStyle = "#ffe27a"; c.fill();
    c.font = Math.round(s * 0.2) + "px " + EF; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("🦉", mx - 0.05 * s, my - 0.2 * s + Math.sin(t / 600) * 0.012 * s);
  } else if (id === "sovalye") {
    const sw = Math.sin(t / 420) * 0.04 * s;
    const pg = c.createLinearGradient(cx, y0 - 0.5 * s, cx + 0.4 * s, y0 - 0.2 * s); pg.addColorStop(0, "#ff5a4d"); pg.addColorStop(1, "#8b0f0f");
    c.beginPath(); c.moveTo(cx - 0.05 * s, y0 - 0.17 * s); c.quadraticCurveTo(cx + 0.02 * s, y0 - 0.58 * s + sw, cx + 0.46 * s, y0 - 0.46 * s + sw * 1.6);
    c.quadraticCurveTo(cx + 0.2 * s, y0 - 0.34 * s + sw * 0.6, cx + 0.07 * s, y0 - 0.16 * s); c.closePath(); c.fillStyle = pg; c.fill();
    c.strokeStyle = "rgba(255,200,190,0.5)"; c.lineWidth = Math.max(1, s * 0.007);
    for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(cx + k * 0.012 * s, y0 - 0.2 * s); c.quadraticCurveTo(cx + (0.04 + k * 0.03) * s, y0 - (0.5 - k * 0.03) * s + sw, cx + (0.4 - k * 0.04) * s, y0 - (0.44 - k * 0.02) * s + sw * 1.5); c.stroke(); }
    const hg = c.createLinearGradient(cx - 0.38 * s, 0, cx + 0.38 * s, 0);
    hg.addColorStop(0, "#5c6675"); hg.addColorStop(0.3, "#d5dce6"); hg.addColorStop(0.5, "#ffffff"); hg.addColorStop(0.7, "#c3ccd8"); hg.addColorStop(1, "#4f5967");
    c.beginPath(); c.moveTo(cx - 0.36 * s, ey + 0.13 * s); c.lineTo(cx - 0.38 * s, y0 + 0.05 * s); c.quadraticCurveTo(cx - 0.3 * s, y0 - 0.22 * s, cx, y0 - 0.24 * s);
    c.quadraticCurveTo(cx + 0.3 * s, y0 - 0.22 * s, cx + 0.38 * s, y0 + 0.05 * s); c.lineTo(cx + 0.36 * s, ey + 0.13 * s); c.closePath();
    c.fillStyle = hg; c.fill(); c.lineWidth = Math.max(1.5, s * 0.013); c.strokeStyle = "#2c3440"; c.stroke();
    c.fillStyle = "#06090f"; c.beginPath(); c.roundRect(cx - 0.3 * s, ey - 0.04 * s, 0.6 * s, 0.075 * s, 0.03 * s); c.fill();
    c.save(); c.globalCompositeOperation = "lighter";
    [-1, 1].forEach((d) => { glow(c, cx + d * 0.14 * s, ey, s * 0.1, "rgba(120,200,255,1)", 0.9); glow(c, cx + d * 0.14 * s, ey, s * 0.035, "rgba(255,255,255,1)", 1); });
    c.restore();
    c.strokeStyle = "#2c3440"; c.lineWidth = Math.max(2, s * 0.015); c.beginPath(); c.moveTo(cx, y0 - 0.23 * s); c.lineTo(cx, ey - 0.04 * s); c.stroke();
    c.beginPath(); c.moveTo(cx - 0.35 * s, y0 + 0.1 * s); c.quadraticCurveTo(cx, y0 + 0.03 * s, cx + 0.35 * s, y0 + 0.1 * s); c.stroke();
    shield(c, cx, y0 + 0.0 * s, 0.045 * s, 0.09 * s); c.fillStyle = goldG(c, cx - 0.04 * s, y0 - 0.04 * s, cx + 0.04 * s, y0 + 0.05 * s); c.fill(); c.lineWidth = Math.max(1, s * 0.007); c.strokeStyle = "#7a4d00"; c.stroke();
    c.fillStyle = "#6b7685"; [-1, 1].forEach((d) => { for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(cx + d * (0.31 - k * 0.01) * s, y0 + (0.0 + k * 0.07) * s, s * 0.01, 0, TAU); c.fill(); } });
    c.save(); c.beginPath(); c.moveTo(cx - 0.36 * s, ey + 0.13 * s); c.lineTo(cx - 0.38 * s, y0 + 0.05 * s); c.quadraticCurveTo(cx - 0.3 * s, y0 - 0.22 * s, cx, y0 - 0.24 * s);
    c.quadraticCurveTo(cx + 0.3 * s, y0 - 0.22 * s, cx + 0.38 * s, y0 + 0.05 * s); c.lineTo(cx + 0.36 * s, ey + 0.13 * s); c.closePath(); c.clip();
    const p = (t / 2400) % 1.8 - 0.4, sx = cx - 0.45 * s + p * 0.9 * s;
    c.fillStyle = "rgba(255,255,255,0.45)"; c.beginPath(); c.moveTo(sx, y0 - 0.3 * s); c.lineTo(sx + 0.06 * s, y0 - 0.3 * s); c.lineTo(sx - 0.06 * s, ey + 0.15 * s); c.lineTo(sx - 0.12 * s, ey + 0.15 * s); c.closePath(); c.fill(); c.restore();
  } else if (id === "nisan") {
    const bob = Math.sin(t / 550) * 0.02 * s, mx = cx, my = y0 - 0.3 * s + bob, R = 0.17 * s;
    const sc = 0.3 + 0.7 * Math.abs(Math.cos(t / 1100));
    c.save(); c.globalCompositeOperation = "lighter"; glow(c, mx, my, s * 0.45, "rgba(255,210,90,1)", 0.35 + 0.12 * Math.sin(t / 300)); c.restore();
    [-1, 1].forEach((d) => {
      const w = Math.sin(t / 500 + d) * 0.02 * s;
      c.beginPath(); c.moveTo(mx + d * 0.03 * s, my + R * 0.7); c.lineTo(mx + d * 0.14 * s + w, my + R + 0.2 * s); c.lineTo(mx + d * 0.1 * s + w, my + R + 0.17 * s); c.lineTo(mx + d * 0.0 * s, my + R + 0.22 * s); c.lineTo(mx - d * 0.01 * s, my + R * 0.7); c.closePath();
      c.fillStyle = d < 0 ? "#d62828" : "#1f4fd8"; c.fill(); c.lineWidth = Math.max(1, s * 0.007); c.strokeStyle = "#ffd54a"; c.stroke();
    });
    c.save(); c.translate(mx, my); c.scale(sc, 1);
    c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fillStyle = goldG(c, -R, -R, R, R); c.fill(); c.lineWidth = Math.max(1.5, s * 0.012); c.strokeStyle = "#7a4d00"; c.stroke();
    c.fillStyle = "#fff3a0"; for (let i = 0; i < 20; i++) { const a = i * TAU / 20; c.beginPath(); c.arc(Math.cos(a) * R * 0.88, Math.sin(a) * R * 0.88, s * 0.009, 0, TAU); c.fill(); }
    c.beginPath(); c.arc(0, 0, R * 0.7, 0, TAU); c.fillStyle = "#14213d"; c.fill(); c.lineWidth = Math.max(1, s * 0.008); c.strokeStyle = "#ffd54a"; c.stroke();
    star(c, 0, 0, R * 0.55, R * 0.23); c.fillStyle = goldG(c, -R * 0.5, -R * 0.5, R * 0.5, R * 0.5); c.fill();
    c.restore();
    c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i++) { const a = t / 900 + i * TAU / 6, k = 0.5 + 0.5 * Math.sin(t / 170 + i * 2); c.fillStyle = "rgba(255,240,170," + (0.35 + 0.65 * k) + ")"; spark(c, mx + Math.cos(a) * R * 1.45, my + Math.sin(a) * R * 1.1, s * (0.012 + 0.03 * k)); c.fill(); }
    c.restore();
  }
  c.restore();
  return true;
}
