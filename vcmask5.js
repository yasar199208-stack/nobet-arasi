// Güvenlik temalı maskeler: kendi çizimimiz. vcmask4.js bu dosyayı yükler.
export const SP5 = [
  ["gvkep", "🛡️ Güvenlik şapkası"], ["baret", "👷 Baret"], ["telsiz", "📻 Telsiz kulaklık"], ["koruma", "🕶️ Koruma gözlüğü"], ["fener", "🔦 Nöbet feneri"],
  ["kalkan", "🛡️ Koruyucu kalkan"], ["gece", "🟢 Gece görüş dürbünü"], ["cctv", "📹 Güvenlik kamerası"], ["cakar", "🚨 Sarı çakar"]
];
const TAU = Math.PI * 2;
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
// Telsiz kulaklığı: sağ kulakta, yanaktan ağza uzanan mikrofon ve spiral kablo
function earpiece(c, cx, cy, s, t) {
  c.save(); c.lineCap = "round";
  c.strokeStyle = "#111"; c.lineWidth = Math.max(2, s * 0.02);
  c.beginPath(); c.moveTo(cx + 0.4 * s, cy + 0.06 * s); c.quadraticCurveTo(cx + 0.4 * s, cy + 0.3 * s, cx + 0.13 * s, cy + 0.25 * s); c.stroke();
  c.fillStyle = "#222"; c.beginPath(); c.arc(cx + 0.12 * s, cy + 0.25 * s, s * 0.03, 0, TAU); c.fill();
  c.strokeStyle = "#222"; c.lineWidth = Math.max(1.5, s * 0.014);
  c.beginPath();
  for (let i = 0; i <= 40; i++) { const u = i / 40, x = cx + 0.43 * s + Math.sin(u * 40) * 0.025 * s + u * 0.04 * s, y = cy + 0.1 * s + u * 0.7 * s; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
  c.stroke();
  c.fillStyle = "#1c1c1c"; c.beginPath(); c.ellipse(cx + 0.41 * s, cy + 0.02 * s, 0.035 * s, 0.07 * s, 0, 0, TAU); c.fill();
  c.fillStyle = Math.floor(t / 450) % 2 ? "#ff2d2d" : "#661111"; c.beginPath(); c.arc(cx + 0.41 * s, cy - 0.01 * s, s * 0.011, 0, TAU); c.fill();
  c.restore();
}

export function drawSp5(id, c, cx, cy, s, t) {
  const ey = cy - 0.07 * s, y0 = cy - 0.42 * s;
  const W = c.canvas ? c.canvas.width : 0, H = c.canvas ? c.canvas.height : 0;
  c.save();
  if (id === "gvkep") {
    const g = c.createLinearGradient(0, y0 - 0.2 * s, 0, y0 + 0.1 * s);
    g.addColorStop(0, "#2b3f6b"); g.addColorStop(1, "#14213d");
    c.beginPath(); c.ellipse(cx, y0 + 0.07 * s, 0.37 * s, 0.3 * s, 0, Math.PI, 0); c.closePath(); c.fillStyle = g; c.fill();
    c.fillStyle = "rgba(255,255,255,0.12)"; c.beginPath(); c.ellipse(cx - 0.12 * s, y0 - 0.1 * s, 0.1 * s, 0.05 * s, -0.5, 0, TAU); c.fill();
    c.fillStyle = "#0a0f1f"; c.fillRect(cx - 0.37 * s, y0 + 0.0 * s, 0.74 * s, 0.1 * s);
    c.fillStyle = "#fff"; c.font = "bold " + Math.round(s * 0.058) + "px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("GÜVENLİK", cx, y0 + 0.05 * s, 0.6 * s);
    c.beginPath(); c.ellipse(cx, y0 + 0.13 * s, 0.31 * s, 0.05 * s, 0, 0, Math.PI); c.fillStyle = "#050810"; c.fill();
    shield(c, cx, y0 - 0.1 * s, 0.07 * s, 0.14 * s); c.fillStyle = "#f2c230"; c.fill(); c.lineWidth = Math.max(1, s * 0.008); c.strokeStyle = "#8a5a00"; c.stroke();
    star(c, cx, y0 - 0.11 * s, s * 0.04, s * 0.017); c.fillStyle = "#14213d"; c.fill();
  } else if (id === "baret") {
    const g = c.createLinearGradient(0, y0 - 0.25 * s, 0, y0 + 0.1 * s);
    g.addColorStop(0, "#ffe14d"); g.addColorStop(1, "#f0a800");
    c.beginPath(); c.ellipse(cx, y0 + 0.1 * s, 0.35 * s, 0.32 * s, 0, Math.PI, 0); c.closePath(); c.fillStyle = g; c.fill(); c.lineWidth = Math.max(1.5, s * 0.012); c.strokeStyle = "#a36d00"; c.stroke();
    c.fillStyle = "#ffef8a"; c.beginPath(); c.roundRect(cx - 0.045 * s, y0 - 0.22 * s, 0.09 * s, 0.31 * s, 0.03 * s); c.fill(); c.stroke();
    c.fillStyle = "#c98a00"; c.beginPath(); c.ellipse(cx, y0 + 0.11 * s, 0.43 * s, 0.06 * s, 0, 0, TAU); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = Math.max(2, s * 0.02);
    c.beginPath(); c.ellipse(cx, y0 + 0.1 * s, 0.3 * s, 0.24 * s, 0, Math.PI * 1.1, Math.PI * 1.35); c.stroke();
  } else if (id === "telsiz") {
    earpiece(c, cx, cy, s, t);
  } else if (id === "koruma") {
    [-1, 1].forEach((d) => {
      const x = cx + d * 0.17 * s - 0.14 * s, y = ey - 0.08 * s;
      const g = c.createLinearGradient(x, y, x + 0.28 * s, y + 0.2 * s); g.addColorStop(0, "#2a2a30"); g.addColorStop(1, "#050507");
      c.beginPath(); c.roundRect(x, y, 0.28 * s, 0.2 * s, 0.06 * s); c.fillStyle = g; c.fill(); c.lineWidth = Math.max(2, s * 0.016); c.strokeStyle = "#000"; c.stroke();
      c.save(); c.beginPath(); c.roundRect(x, y, 0.28 * s, 0.2 * s, 0.06 * s); c.clip();
      const p = ((t / 2200) + (d > 0 ? 0.15 : 0)) % 1, gx = x - 0.1 * s + p * 0.5 * s;
      c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = Math.max(2, s * 0.025);
      c.beginPath(); c.moveTo(gx, y + 0.22 * s); c.lineTo(gx + 0.1 * s, y - 0.02 * s); c.stroke();
      c.restore();
    });
    c.strokeStyle = "#000"; c.lineWidth = Math.max(2.5, s * 0.022);
    c.beginPath(); c.moveTo(cx - 0.03 * s, ey - 0.02 * s); c.lineTo(cx + 0.03 * s, ey - 0.02 * s); c.stroke();
    c.beginPath(); c.moveTo(cx - 0.31 * s, ey); c.lineTo(cx - 0.42 * s, ey - 0.02 * s); c.moveTo(cx + 0.31 * s, ey); c.lineTo(cx + 0.42 * s, ey - 0.02 * s); c.stroke();
    earpiece(c, cx, cy, s, t);
  } else if (id === "fener") {
    c.strokeStyle = "#1b1b1f"; c.lineWidth = Math.max(3, s * 0.035); c.lineCap = "round";
    c.beginPath(); c.arc(cx, y0 + 0.4 * s, 0.4 * s, Math.PI * 1.12, Math.PI * 1.88); c.stroke();
    const lx = cx, ly = y0 + 0.205 * s;
    const ang = -Math.PI / 2 + Math.sin(t / 900) * 0.75, L = s * 1.1;
    c.save(); c.globalCompositeOperation = "lighter";
    const g = c.createLinearGradient(lx, ly, lx + Math.cos(ang) * L, ly + Math.sin(ang) * L);
    g.addColorStop(0, "rgba(255,250,200,0.75)"); g.addColorStop(1, "rgba(255,240,160,0)");
    c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + Math.cos(ang - 0.17) * L, ly + Math.sin(ang - 0.17) * L); c.lineTo(lx + Math.cos(ang + 0.17) * L, ly + Math.sin(ang + 0.17) * L); c.closePath();
    c.fillStyle = g; c.fill();
    glow(c, lx, ly, s * 0.2, "rgba(255,255,220,1)", 0.9);
    c.restore();
    c.fillStyle = "#1b1b1f"; c.beginPath(); c.roundRect(lx - 0.07 * s, ly - 0.05 * s, 0.14 * s, 0.1 * s, 0.025 * s); c.fill();
    c.fillStyle = "#fffbe0"; c.beginPath(); c.arc(lx, ly, s * 0.034, 0, TAU); c.fill();
  } else if (id === "kalkan") {
    const bob = Math.sin(t / 500) * 0.02 * s, x = cx, y = y0 - 0.3 * s + bob, w = 0.19 * s, h = 0.48 * s;
    c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y, s * 0.42, "rgba(80,160,255,0.9)", 0.4 + 0.15 * Math.sin(t / 300)); c.restore();
    const g = c.createLinearGradient(x - w, y - h / 2, x + w, y + h / 2); g.addColorStop(0, "#4f8dff"); g.addColorStop(1, "#14307a");
    shield(c, x, y, w, h); c.fillStyle = g; c.fill(); c.lineWidth = Math.max(2.5, s * 0.025); c.strokeStyle = "#f2c230"; c.stroke();
    shield(c, x, y + 0.01 * s, w * 0.72, h * 0.78); c.lineWidth = Math.max(1, s * 0.008); c.strokeStyle = "rgba(255,255,255,0.55)"; c.stroke();
    star(c, x, y - 0.015 * s, s * 0.1, s * 0.042); c.fillStyle = "#ffd84a"; c.fill(); c.lineWidth = Math.max(1, s * 0.007); c.strokeStyle = "#8a5a00"; c.stroke();
    c.save(); shield(c, x, y, w, h); c.clip();
    const p = (t / 2200) % 1.6 - 0.3, sx = x - w + p * w * 2.4;
    c.fillStyle = "rgba(255,255,255,0.28)"; c.beginPath(); c.moveTo(sx, y - h / 2); c.lineTo(sx + 0.07 * s, y - h / 2); c.lineTo(sx - 0.05 * s, y + h / 2); c.lineTo(sx - 0.12 * s, y + h / 2); c.closePath(); c.fill();
    c.restore();
    c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i++) { const a = t / 1000 + i * TAU / 6; c.fillStyle = "rgba(255,230,140," + (0.5 + 0.5 * Math.sin(t / 160 + i)) + ")"; spark(c, x + Math.cos(a) * 0.3 * s, y + Math.sin(a) * 0.3 * s * 0.8, s * 0.035); c.fill(); }
    c.restore();
  } else if (id === "gece" && W) {
    c.globalCompositeOperation = "color"; c.fillStyle = "rgb(30,255,80)"; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = "source-over";
    const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
    vg.addColorStop(0, "rgba(0,30,0,0)"); vg.addColorStop(1, "rgba(0,25,0,0.75)"); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(0,40,0,0.18)"; for (let y = (Math.floor(t / 60) % 4); y < H; y += 4) c.fillRect(0, y, W, 1.5);
    [-1, 1].forEach((d) => {
      const x = cx + d * 0.2 * s, y = ey + 0.01 * s;
      c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y, s * 0.2, "rgba(80,255,120,0.9)", 0.45); c.restore();
      c.fillStyle = "#101410"; c.beginPath(); c.arc(x, y, s * 0.15, 0, TAU); c.arc(x, y, s * 0.105, 0, TAU, true); c.fill("evenodd");
      c.strokeStyle = "#3b4a3b"; c.lineWidth = Math.max(1.5, s * 0.012); c.beginPath(); c.arc(x, y, s * 0.15, 0, TAU); c.stroke();
    });
    c.fillStyle = "#101410"; c.fillRect(cx - 0.06 * s, ey - 0.02 * s, 0.12 * s, 0.045 * s);
    c.strokeStyle = "#101410"; c.lineWidth = Math.max(3, s * 0.03);
    c.beginPath(); c.moveTo(cx - 0.35 * s, ey); c.lineTo(cx - 0.45 * s, ey - 0.02 * s); c.moveTo(cx + 0.35 * s, ey); c.lineTo(cx + 0.45 * s, ey - 0.02 * s); c.stroke();
  } else if (id === "cctv" && W) {
    const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.55)"); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(255,255,255,0.05)"; for (let y = (Math.floor(t / 40) % 6); y < H; y += 6) c.fillRect(0, y, W, 1);
    const m = Math.round(H * 0.05), L = Math.round(H * 0.07);
    c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = Math.max(2, H * 0.006); c.lineCap = "square";
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach((q) => { c.beginPath(); c.moveTo(q[0] + q[2] * L, q[1]); c.lineTo(q[0], q[1]); c.lineTo(q[0], q[1] + q[3] * L); c.stroke(); });
    const fs = Math.max(11, Math.round(H * 0.045));
    c.font = "bold " + fs + "px monospace"; c.textBaseline = "top"; c.shadowColor = "#000"; c.shadowBlur = 3;
    c.textAlign = "left"; c.fillStyle = Math.floor(t / 600) % 2 ? "#ff3030" : "rgba(255,48,48,0.25)"; c.fillText("● REC", m + 6, m + 6);
    c.fillStyle = "#fff"; c.textAlign = "right"; c.fillText("KAM 01 · NÖBET", W - m - 6, m + 6);
    const d = new Date(), z = (n) => (n < 10 ? "0" : "") + n;
    c.textAlign = "left"; c.textBaseline = "bottom";
    c.fillText(z(d.getDate()) + "." + z(d.getMonth() + 1) + "." + d.getFullYear() + "  " + z(d.getHours()) + ":" + z(d.getMinutes()) + ":" + z(d.getSeconds()), m + 6, H - m - 6);
  } else if (id === "cakar") {
    const lx = cx, ly = y0 + 0.0 * s, a = t / 260;
    c.save(); c.globalCompositeOperation = "lighter";
    [0, Math.PI].forEach((o) => {
      const an = a + o, L = s * 0.9;
      const g = c.createLinearGradient(lx, ly, lx + Math.cos(an) * L, ly + Math.sin(an) * L * 0.35);
      g.addColorStop(0, "rgba(255,170,20,0.7)"); g.addColorStop(1, "rgba(255,150,0,0)");
      c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + Math.cos(an - 0.22) * L, ly + Math.sin(an - 0.22) * L * 0.35); c.lineTo(lx + Math.cos(an + 0.22) * L, ly + Math.sin(an + 0.22) * L * 0.35); c.closePath();
      c.fillStyle = g; c.fill();
    });
    glow(c, lx, ly - 0.02 * s, s * 0.3, "rgba(255,170,30,1)", 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(a * 2)));
    c.restore();
    c.fillStyle = "#16161a"; c.beginPath(); c.roundRect(lx - 0.12 * s, ly + 0.0 * s, 0.24 * s, 0.07 * s, 0.015 * s); c.fill();
    const g2 = c.createLinearGradient(0, ly - 0.14 * s, 0, ly); g2.addColorStop(0, "#ffd36b"); g2.addColorStop(1, "#ff8a00");
    c.beginPath(); c.ellipse(lx, ly, 0.095 * s, 0.13 * s, 0, Math.PI, 0); c.closePath(); c.fillStyle = g2; c.fill(); c.lineWidth = Math.max(1, s * 0.008); c.strokeStyle = "#a35500"; c.stroke();
    c.fillStyle = "rgba(255,255,255,0.55)"; c.beginPath(); c.ellipse(lx - 0.03 * s, ly - 0.07 * s, 0.02 * s, 0.045 * s, -0.4, 0, TAU); c.fill();
  } else { c.restore(); return false; }
  c.restore();
  return true;
}
