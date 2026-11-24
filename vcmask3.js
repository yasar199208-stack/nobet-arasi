// Ek özel maskeler (2. paket): kendi çizimimiz. vcmask2.js bu dosyayı yükler.
import { SP4, drawSp4 } from "./vcmask4.js?v=1";
const SP3A = [
  ["panda", "🐼 Panda"], ["ayi", "🐻 Ayı"], ["tilki", "🦊 Tilki"], ["unicorn", "🦄 Tek boynuz"], ["kovboy", "🤠 Kovboy şapkası"], ["sef", "🧑‍🍳 Aşçı şapkası"],
  ["guvenlik", "🛡️ Güvenlik kepi"], ["inek", "🤓 İnek gözlük"], ["yildizgoz", "🌟 Yıldız gözlük"], ["kalpgoz", "😍 Kalp gözlük"], ["gozyasi", "😭 Gözyaşı"],
  ["noel", "🎅 Noel şapkası"], ["elektrik", "⚡ Elektrik"], ["vampir", "🧛 Vampir"], ["kafatasi", "💀 Kafatası boyası"], ["sasgin", "👀 Şaşkın gözler"], ["yanak", "☺️ Pembe yanak"]
];
export const SP3 = SP4.concat(SP3A);
const EF = "'Apple Color Emoji','Noto Color Emoji','Segoe UI Emoji',sans-serif";
const TAU = Math.PI * 2;

function emo(c, e, x, y, sz) { c.font = Math.round(sz) + "px " + EF; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(e, x, y); }
function circ(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = fill; c.fill(); }
function ell(c, x, y, rx, ry, rot, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fillStyle = fill; c.fill(); }
function tri(c, ax, ay, bx, by, cx2, cy2, fill) { c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(cx2, cy2); c.closePath(); c.fillStyle = fill; c.fill(); }
function star(c, x, y, r, r2) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r2 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
  c.closePath();
}
function heart(c, x, y, r) {
  c.beginPath(); c.moveTo(x, y + r * 0.9);
  c.bezierCurveTo(x - r * 1.3, y + r * 0.1, x - r * 0.9, y - r * 0.9, x, y - r * 0.35);
  c.bezierCurveTo(x + r * 0.9, y - r * 0.9, x + r * 1.3, y + r * 0.1, x, y + r * 0.9);
  c.closePath();
}
function rnd(n) { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); }

// Çizdiyse true döner
export function drawSp3(id, c, cx, cy, s, t) {
  if (drawSp4(id, c, cx, cy, s, t)) return true;
  const ey = cy - 0.07 * s, y0 = cy - 0.42 * s;
  let ok = true;
  c.save();
  if (id === "panda") {
    [-1, 1].forEach((d) => {
      circ(c, cx + d * 0.29 * s, y0 + 0.08 * s, 0.1 * s, "#111");
      ell(c, cx + d * 0.15 * s, ey + 0.02 * s, 0.085 * s, 0.1 * s, d * 0.35, "#111");
      circ(c, cx + d * 0.15 * s - d * 0.012 * s, ey - 0.005 * s, s * 0.02, "#fff");
    });
    ell(c, cx, cy + 0.04 * s, 0.04 * s, 0.028 * s, 0, "#111");
  } else if (id === "ayi") {
    [-1, 1].forEach((d) => { circ(c, cx + d * 0.3 * s, y0 + 0.1 * s, 0.1 * s, "#8b5a2b"); circ(c, cx + d * 0.3 * s, y0 + 0.1 * s, 0.055 * s, "#d9a066"); });
    ell(c, cx, cy + 0.13 * s, 0.14 * s, 0.1 * s, 0, "#e8c08a");
    ell(c, cx, cy + 0.07 * s, 0.045 * s, 0.03 * s, 0, "#3b2412");
  } else if (id === "tilki") {
    [-1, 1].forEach((d) => {
      tri(c, cx + d * 0.08 * s, y0 + 0.1 * s, cx + d * 0.4 * s, y0 + 0.12 * s, cx + d * 0.36 * s, y0 - 0.36 * s, "#ee7d1f");
      tri(c, cx + d * 0.16 * s, y0 + 0.08 * s, cx + d * 0.35 * s, y0 + 0.1 * s, cx + d * 0.34 * s, y0 - 0.2 * s, "#fff1dc");
      tri(c, cx + d * 0.3 * s, cy + 0.02 * s, cx + d * 0.43 * s, cy + 0.12 * s, cx + d * 0.28 * s, cy + 0.2 * s, "#fff");
    });
    ell(c, cx, cy + 0.04 * s, 0.04 * s, 0.028 * s, 0, "#111");
  } else if (id === "unicorn") {
    const g = c.createLinearGradient(cx, y0 + 0.08 * s, cx, y0 - 0.34 * s);
    g.addColorStop(0, "#ff9bd2"); g.addColorStop(0.5, "#ffe27a"); g.addColorStop(1, "#9be7ff");
    tri(c, cx - 0.06 * s, y0 + 0.08 * s, cx + 0.06 * s, y0 + 0.08 * s, cx, y0 - 0.36 * s, g);
    c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = Math.max(1.5, s * 0.012);
    for (let k = 0; k < 4; k++) { const yy = y0 + 0.04 * s - k * 0.09 * s, w = 0.05 * s * (1 - k * 0.2); c.beginPath(); c.moveTo(cx - w, yy + 0.02 * s); c.lineTo(cx + w, yy - 0.02 * s); c.stroke(); }
    [-1, 1].forEach((d) => tri(c, cx + d * 0.2 * s, y0 + 0.08 * s, cx + d * 0.34 * s, y0 + 0.12 * s, cx + d * 0.3 * s, y0 - 0.1 * s, "#ffb3d9"));
    c.globalAlpha = 0.5 + 0.5 * Math.sin(t / 220); emo(c, "✨", cx + 0.2 * s, y0 - 0.2 * s, s * 0.14);
    c.globalAlpha = 0.5 + 0.5 * Math.sin(t / 220 + 2); emo(c, "✨", cx - 0.22 * s, y0 - 0.08 * s, s * 0.11);
  } else if (id === "kovboy") {
    ell(c, cx, y0 + 0.1 * s, 0.52 * s, 0.09 * s, 0, "#7a4a1d");
    c.beginPath(); c.moveTo(cx - 0.26 * s, y0 + 0.09 * s); c.quadraticCurveTo(cx - 0.3 * s, y0 - 0.2 * s, cx - 0.18 * s, y0 - 0.2 * s);
    c.quadraticCurveTo(cx, y0 - 0.06 * s, cx + 0.18 * s, y0 - 0.2 * s); c.quadraticCurveTo(cx + 0.3 * s, y0 - 0.2 * s, cx + 0.26 * s, y0 + 0.09 * s); c.closePath();
    c.fillStyle = "#a0692f"; c.fill();
    c.fillStyle = "#4a2a0c"; c.fillRect(cx - 0.265 * s, y0 - 0.01 * s, 0.53 * s, 0.07 * s);
    ell(c, cx, y0 + 0.1 * s, 0.52 * s, 0.09 * s, 0, "rgba(0,0,0,0)");
  } else if (id === "sef") {
    c.fillStyle = "#fff"; c.strokeStyle = "#cfd4da"; c.lineWidth = Math.max(1.5, s * 0.012);
    [[-0.2, -0.04, 0.14], [0.2, -0.04, 0.14], [0, -0.14, 0.17]].forEach((q) => { c.beginPath(); c.arc(cx + q[0] * s, y0 + q[1] * s, q[2] * s, 0, TAU); c.fill(); c.stroke(); });
    c.beginPath(); c.roundRect(cx - 0.26 * s, y0 - 0.02 * s, 0.52 * s, 0.15 * s, 0.03 * s); c.fill(); c.stroke();
  } else if (id === "guvenlik") {
    c.beginPath(); c.ellipse(cx, y0 + 0.08 * s, 0.34 * s, 0.28 * s, 0, Math.PI, 0); c.closePath(); c.fillStyle = "#14213d"; c.fill();
    c.fillStyle = "#0b132b"; c.fillRect(cx - 0.34 * s, y0 + 0.02 * s, 0.68 * s, 0.07 * s);
    ell(c, cx, y0 + 0.12 * s, 0.3 * s, 0.045 * s, 0, "#050a18");
    circ(c, cx, y0 - 0.06 * s, 0.062 * s, "#f2c230");
    star(c, cx, y0 - 0.06 * s, s * 0.05, s * 0.022); c.fillStyle = "#14213d"; c.fill();
  } else if (id === "inek") {
    c.strokeStyle = "#111"; c.lineWidth = Math.max(2.5, s * 0.025);
    [-1, 1].forEach((d) => { c.beginPath(); c.arc(cx + d * 0.16 * s, ey, 0.125 * s, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(cx + d * 0.285 * s, ey); c.lineTo(cx + d * 0.42 * s, ey - 0.03 * s); c.stroke(); });
    c.beginPath(); c.moveTo(cx - 0.035 * s, ey - 0.01 * s); c.lineTo(cx + 0.035 * s, ey - 0.01 * s); c.stroke();
    c.fillStyle = "#f5f5f5"; c.fillRect(cx - 0.03 * s, ey - 0.04 * s, 0.06 * s, 0.05 * s);
  } else if (id === "yildizgoz") {
    [-1, 1].forEach((d) => {
      const g = c.createLinearGradient(0, ey - 0.15 * s, 0, ey + 0.15 * s); g.addColorStop(0, "#ffe94d"); g.addColorStop(1, "#ff5fa2");
      star(c, cx + d * 0.17 * s, ey + 0.01 * s, 0.2 * s, 0.09 * s); c.globalAlpha = 0.9; c.fillStyle = g; c.fill();
      c.globalAlpha = 1; c.strokeStyle = "#fff"; c.lineWidth = Math.max(1.5, s * 0.012); c.stroke();
    });
    c.strokeStyle = "#fff"; c.lineWidth = Math.max(2, s * 0.018); c.beginPath(); c.moveTo(cx - 0.03 * s, ey); c.lineTo(cx + 0.03 * s, ey); c.stroke();
  } else if (id === "kalpgoz") {
    const k = 1 + 0.06 * Math.sin(t / 180);
    [-1, 1].forEach((d) => {
      heart(c, cx + d * 0.16 * s, ey, 0.15 * s * k); c.globalAlpha = 0.9; c.fillStyle = "#ff2d55"; c.fill();
      c.globalAlpha = 1; c.strokeStyle = "#fff"; c.lineWidth = Math.max(1.5, s * 0.012); c.stroke();
      circ(c, cx + d * 0.16 * s - 0.05 * s, ey - 0.05 * s, s * 0.02, "rgba(255,255,255,0.8)");
    });
  } else if (id === "gozyasi") {
    [-1, 1].forEach((d) => {
      c.strokeStyle = "rgba(120,200,255,0.5)"; c.lineWidth = Math.max(2, s * 0.025); c.lineCap = "round";
      c.beginPath(); c.moveTo(cx + d * 0.17 * s, ey + 0.06 * s); c.lineTo(cx + d * 0.2 * s, ey + 0.3 * s); c.stroke();
      for (let k = 0; k < 3; k++) {
        const p = ((t / 900) + k / 3 + (d > 0 ? 0.17 : 0)) % 1;
        c.globalAlpha = 1 - p * 0.7;
        ell(c, cx + d * (0.17 + p * 0.03) * s, ey + 0.08 * s + p * 0.4 * s, 0.025 * s, 0.04 * s, 0, "#5ec8ff");
      }
      c.globalAlpha = 1;
    });
  } else if (id === "noel") {
    const sw = Math.sin(t / 500) * 0.04 * s;
    c.beginPath(); c.moveTo(cx - 0.34 * s, y0 + 0.12 * s); c.quadraticCurveTo(cx - 0.3 * s, y0 - 0.25 * s, cx + 0.26 * s + sw, y0 - 0.26 * s);
    c.quadraticCurveTo(cx + 0.3 * s, y0 - 0.02 * s, cx + 0.34 * s, y0 + 0.12 * s); c.closePath(); c.fillStyle = "#d62828"; c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.roundRect(cx - 0.38 * s, y0 + 0.05 * s, 0.76 * s, 0.13 * s, 0.06 * s); c.fill();
    circ(c, cx + 0.26 * s + sw, y0 - 0.27 * s, 0.07 * s, "#fff");
  } else if (id === "elektrik") {
    c.lineCap = "round"; c.lineJoin = "round"; c.shadowColor = "#4dd2ff"; c.shadowBlur = s * 0.08;
    c.strokeStyle = "#e9fbff"; c.lineWidth = Math.max(2, s * 0.018);
    const f = Math.floor(t / 90);
    for (let i = 0; i < 6; i++) {
      if (rnd(f * 7 + i) < 0.35) continue;
      const a = rnd(f + i * 3) * TAU, r0 = 0.38 * s;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      for (let k = 1; k <= 4; k++) { const rr = r0 + k * 0.08 * s, aa = a + (rnd(f * 5 + i * 11 + k) - 0.5) * 0.5; c.lineTo(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr); }
      c.stroke();
    }
  } else if (id === "vampir") {
    [-1, 1].forEach((d) => tri(c, cx + d * 0.1 * s - 0.03 * s, cy + 0.2 * s, cx + d * 0.1 * s + 0.03 * s, cy + 0.2 * s, cx + d * 0.1 * s, cy + 0.285 * s, "#fff"));
    const a1 = t / 700, a2 = a1 + Math.PI;
    emo(c, "🦇", cx + Math.cos(a1) * 0.6 * s, y0 - 0.05 * s + Math.sin(a1) * 0.1 * s, s * 0.22);
    emo(c, "🦇", cx + Math.cos(a2) * 0.6 * s, y0 - 0.05 * s + Math.sin(a2) * 0.1 * s, s * 0.18);
  } else if (id === "kafatasi") {
    c.globalAlpha = 0.78; ell(c, cx, cy + 0.02 * s, 0.33 * s, 0.42 * s, 0, "#f4f4ee"); c.globalAlpha = 1;
    [-1, 1].forEach((d) => ell(c, cx + d * 0.15 * s, ey + 0.02 * s, 0.09 * s, 0.1 * s, 0, "#111"));
    tri(c, cx - 0.035 * s, cy + 0.08 * s, cx + 0.035 * s, cy + 0.08 * s, cx, cy + 0.015 * s, "#111");
    c.strokeStyle = "#111"; c.lineWidth = Math.max(2, s * 0.018);
    c.beginPath(); c.moveTo(cx - 0.14 * s, cy + 0.2 * s); c.lineTo(cx + 0.14 * s, cy + 0.2 * s); c.stroke();
    for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(cx + k * 0.04 * s, cy + 0.17 * s); c.lineTo(cx + k * 0.04 * s, cy + 0.24 * s); c.stroke(); }
  } else if (id === "sasgin") {
    [-1, 1].forEach((d) => {
      circ(c, cx + d * 0.16 * s, ey, 0.13 * s, "#fff"); c.strokeStyle = "#111"; c.lineWidth = Math.max(2, s * 0.015); c.stroke();
      circ(c, cx + d * 0.16 * s + Math.cos(t / 300 + d * 2) * 0.05 * s, ey + Math.sin(t / 370 + d) * 0.05 * s, 0.05 * s, "#111");
    });
  } else if (id === "yanak") {
    [-1, 1].forEach((d) => {
      const x = cx + d * 0.24 * s, y = cy + 0.1 * s, g = c.createRadialGradient(x, y, 0, x, y, 0.12 * s);
      g.addColorStop(0, "rgba(255,90,140,0.6)"); g.addColorStop(1, "rgba(255,90,140,0)");
      c.fillStyle = g; c.fillRect(x - 0.12 * s, y - 0.12 * s, 0.24 * s, 0.24 * s);
    });
    for (let k = 0; k < 6; k++) circ(c, cx + (k % 3 - 1) * 0.05 * s * (k < 3 ? -1 : 1) + (k < 3 ? -0.14 : 0.14) * s, cy + 0.03 * s + Math.floor(k % 3) * 0.025 * s, s * 0.01, "#a0522d");
    c.globalAlpha = 0.5 + 0.5 * Math.sin(t / 250); emo(c, "✨", cx + 0.34 * s, ey - 0.1 * s, s * 0.12);
  } else ok = false;
  c.restore();
  return ok;
}
