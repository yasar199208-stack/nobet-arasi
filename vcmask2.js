// Özel çizim maskeler: kendi çizimimiz, hareketli. vcmask.js bu dosyayı yükler.
export const SP = [
  ["kedi", "🐱 Kedi"], ["tavsan", "🐰 Tavşan"], ["melek", "😇 Melek"], ["seytan", "😈 Şeytan"], ["kral", "👑 Kral tacı"], ["super", "🦸 Kahraman"],
  ["venedik", "🎭 Balo maskesi"], ["robot", "🤖 Robot"], ["alev", "🔥 Alev saç"], ["kelebek", "🦋 Kelebekler"], ["kalpler", "💖 Kalp çemberi"],
  ["yildiz", "✨ Yıldız tozu"], ["neon", "🕶️ Neon gözlük"], ["boya", "🌈 Yüz boyası"], ["uzayli", "👽 Uzaylı"], ["alevgoz", "👀 Alev gözler"],
  ["cicek", "🌸 Çiçek tacı"], ["korsan", "🏴 Korsan"]
];
const EF = "'Apple Color Emoji','Noto Color Emoji','Segoe UI Emoji',sans-serif";
const TAU = Math.PI * 2;

function emo(c, e, x, y, sz) {
  c.font = Math.round(sz) + "px " + EF;
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(e, x, y);
}
// Başın çevresinde dönen emojiler
function orbit(c, x, y, r, t, list, sz, speed) {
  for (let i = 0; i < list.length; i++) {
    const a = t / (speed || 900) + i * TAU / list.length;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.45;
    emo(c, list[i], px, py, sz * (0.85 + 0.15 * Math.sin(a)));
  }
}
function tri(c, ax, ay, bx, by, cx2, cy2, fill) {
  c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(cx2, cy2); c.closePath();
  c.fillStyle = fill; c.fill();
}
function glowCircle(c, x, y, r, col) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, "rgba(255,0,0,0)");
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
// Göz hizasında maske şekli (kahraman ve balo maskesi)
function eyeMaskPath(c, cx, ey, s) {
  c.beginPath();
  c.moveTo(cx - 0.38 * s, ey);
  c.quadraticCurveTo(cx - 0.22 * s, ey - 0.15 * s, cx, ey - 0.05 * s);
  c.quadraticCurveTo(cx + 0.22 * s, ey - 0.15 * s, cx + 0.38 * s, ey);
  c.quadraticCurveTo(cx + 0.27 * s, ey + 0.11 * s, cx + 0.12 * s, ey + 0.08 * s);
  c.quadraticCurveTo(cx, ey + 0.03 * s, cx - 0.12 * s, ey + 0.08 * s);
  c.quadraticCurveTo(cx - 0.27 * s, ey + 0.11 * s, cx - 0.38 * s, ey);
  c.closePath();
  [-1, 1].forEach((d) => { c.moveTo(cx + d * 0.15 * s + 0.07 * s, ey + 0.01 * s); c.ellipse(cx + d * 0.15 * s, ey + 0.01 * s, 0.07 * s, 0.047 * s, 0, 0, TAU); });
}
function flower(c, x, y, r, col) {
  c.fillStyle = col;
  for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x + Math.cos(k * TAU / 5) * r, y + Math.sin(k * TAU / 5) * r, r * 0.8, 0, TAU); c.fill(); }
  c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(x, y, r * 0.65, 0, TAU); c.fill();
}

export function drawSp(id, c, cx, cy, s, t) {
  const ey = cy - 0.07 * s, y0 = cy - 0.42 * s;
  c.save();
  if (id === "kedi") {
    [-1, 1].forEach((d) => {
      tri(c, cx + d * 0.1 * s, y0 + 0.06 * s, cx + d * 0.42 * s, y0 + 0.18 * s, cx + d * 0.4 * s, y0 - 0.28 * s, "#f2a23a");
      tri(c, cx + d * 0.17 * s, y0 + 0.06 * s, cx + d * 0.37 * s, y0 + 0.14 * s, cx + d * 0.36 * s, y0 - 0.14 * s, "#ff9bb5");
    });
    tri(c, cx - 0.045 * s, cy + 0.03 * s, cx + 0.045 * s, cy + 0.03 * s, cx, cy + 0.085 * s, "#ff6f91");
    c.strokeStyle = "#fff"; c.lineWidth = Math.max(1.5, s * 0.012); c.shadowColor = "#000"; c.shadowBlur = 2;
    [-1, 1].forEach((d) => {
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(cx + d * 0.1 * s, cy + 0.09 * s + k * 0.025 * s); c.lineTo(cx + d * 0.46 * s, cy + 0.09 * s + k * 0.07 * s); c.stroke(); }
    });
  } else if (id === "tavsan") {
    [-1, 1].forEach((d) => {
      const sw = d * (0.12 + Math.sin(t / 420 + d) * 0.07);
      c.save(); c.translate(cx + d * 0.17 * s, y0 + 0.05 * s); c.rotate(sw);
      c.fillStyle = "#f5f5f5"; c.beginPath(); c.ellipse(0, -0.3 * s, 0.1 * s, 0.32 * s, 0, 0, TAU); c.fill();
      c.fillStyle = "#ffb3c7"; c.beginPath(); c.ellipse(0, -0.28 * s, 0.05 * s, 0.24 * s, 0, 0, TAU); c.fill();
      c.restore();
    });
    tri(c, cx - 0.04 * s, cy + 0.03 * s, cx + 0.04 * s, cy + 0.03 * s, cx, cy + 0.08 * s, "#ff7da0");
  } else if (id === "melek") {
    const fl = Math.sin(t / 260) * 0.12;
    [-1, 1].forEach((d) => {
      for (let k = 0; k < 4; k++) {
        c.save(); c.translate(cx + d * (0.46 + k * 0.05) * s, cy - 0.12 * s + k * 0.1 * s);
        c.rotate(d * (-0.7 + k * 0.28 + fl));
        c.fillStyle = "rgba(255,255,255,0.93)"; c.strokeStyle = "#bfe3ff"; c.lineWidth = Math.max(1, s * 0.01);
        c.beginPath(); c.ellipse(0, 0, 0.26 * s, 0.065 * s, 0, 0, TAU); c.fill(); c.stroke();
        c.restore();
      }
    });
    c.strokeStyle = "#ffd84a"; c.lineWidth = Math.max(3, s * 0.05); c.shadowColor = "#ffd84a"; c.shadowBlur = s * 0.18;
    c.beginPath(); c.ellipse(cx, y0 - 0.12 * s + Math.sin(t / 500) * 0.015 * s, 0.3 * s, 0.075 * s, 0, 0, TAU); c.stroke();
  } else if (id === "seytan") {
    c.globalAlpha = 0.22 + 0.08 * Math.sin(t / 300); glowCircle(c, cx, cy, s * 0.7, "rgba(255,30,30,1)"); c.globalAlpha = 1;
    [-1, 1].forEach((d) => {
      c.beginPath(); c.moveTo(cx + d * 0.14 * s, y0 + 0.08 * s);
      c.quadraticCurveTo(cx + d * 0.3 * s, y0 - 0.1 * s, cx + d * 0.26 * s, y0 - 0.34 * s);
      c.quadraticCurveTo(cx + d * 0.4 * s, y0 - 0.1 * s, cx + d * 0.4 * s, y0 + 0.12 * s);
      c.closePath(); c.fillStyle = "#d1121b"; c.fill(); c.strokeStyle = "#7a0a10"; c.lineWidth = Math.max(1, s * 0.012); c.stroke();
    });
  } else if (id === "kral") {
    const g = c.createLinearGradient(0, y0 - 0.3 * s, 0, y0 + 0.1 * s);
    g.addColorStop(0, "#fff3a0"); g.addColorStop(0.5, "#ffc928"); g.addColorStop(1, "#c98a00");
    const P = [[-0.3, 0.1], [-0.32, -0.22], [-0.16, -0.08], [0, -0.32], [0.16, -0.08], [0.32, -0.22], [0.3, 0.1]];
    c.beginPath(); P.forEach((p, i) => { if (i) c.lineTo(cx + p[0] * s, y0 + p[1] * s); else c.moveTo(cx + p[0] * s, y0 + p[1] * s); });
    c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = "#a36d00"; c.lineWidth = Math.max(1.5, s * 0.015); c.stroke();
    [[-0.32, -0.22, "#ff3b5c"], [0, -0.32, "#3bb3ff"], [0.32, -0.22, "#ff3b5c"], [0, 0.0, "#3bff9a"]].forEach((p) => {
      c.fillStyle = p[2]; c.beginPath(); c.arc(cx + p[0] * s, y0 + p[1] * s, s * 0.035, 0, TAU); c.fill();
    });
    c.fillStyle = "rgba(255,255,255," + (0.5 + 0.5 * Math.sin(t / 200)) + ")";
    emo(c, "✨", cx + 0.12 * s, y0 - 0.12 * s, s * 0.14);
  } else if (id === "super") {
    eyeMaskPath(c, cx, ey, s);
    c.fillStyle = "#1741c4"; c.fill("evenodd"); c.strokeStyle = "#ffd84a"; c.lineWidth = Math.max(2, s * 0.02); c.stroke();
  } else if (id === "venedik") {
    eyeMaskPath(c, cx, ey, s * 1.05);
    const g = c.createLinearGradient(cx - 0.4 * s, 0, cx + 0.4 * s, 0);
    g.addColorStop(0, "#b8860b"); g.addColorStop(0.5, "#ffe27a"); g.addColorStop(1, "#b8860b");
    c.fillStyle = g; c.fill("evenodd"); c.strokeStyle = "#7a4d00"; c.lineWidth = Math.max(1.5, s * 0.014); c.stroke();
    c.fillStyle = "#7b2cbf"; c.beginPath(); c.ellipse(cx + 0.46 * s, ey - 0.2 * s, 0.07 * s, 0.26 * s, 0.6, 0, TAU); c.fill();
    c.fillStyle = "#00b8a9"; c.beginPath(); c.ellipse(cx + 0.4 * s, ey - 0.16 * s, 0.045 * s, 0.2 * s, 0.4, 0, TAU); c.fill();
    for (let k = 0; k < 4; k++) { c.fillStyle = "rgba(255,255,255," + (0.5 + 0.5 * Math.sin(t / 180 + k * 1.7)) + ")"; c.beginPath(); c.arc(cx + (k - 1.5) * 0.18 * s, ey - 0.06 * s + (k % 2) * 0.1 * s, s * 0.012, 0, TAU); c.fill(); }
  } else if (id === "robot") {
    c.shadowColor = "#19e6ff"; c.shadowBlur = s * 0.1;
    c.fillStyle = "#0b1220"; c.strokeStyle = "#19e6ff"; c.lineWidth = Math.max(2, s * 0.018);
    c.beginPath(); c.roundRect(cx - 0.36 * s, ey - 0.08 * s, 0.72 * s, 0.17 * s, 0.05 * s); c.fill(); c.stroke();
    const p = (Math.sin(t / 380) + 1) / 2, sx = cx - 0.33 * s + p * 0.66 * s;
    c.fillStyle = "#ff2d55"; c.shadowColor = "#ff2d55"; c.beginPath(); c.roundRect(sx - 0.02 * s, ey - 0.06 * s, 0.04 * s, 0.13 * s, 0.02 * s); c.fill();
    c.shadowBlur = 0; c.strokeStyle = "#9aa7b8"; c.lineWidth = Math.max(2, s * 0.02);
    c.beginPath(); c.moveTo(cx + 0.2 * s, y0 + 0.08 * s); c.lineTo(cx + 0.24 * s, y0 - 0.2 * s); c.stroke();
    c.fillStyle = Math.floor(t / 400) % 2 ? "#ff2d55" : "#ffb3c1"; c.beginPath(); c.arc(cx + 0.24 * s, y0 - 0.22 * s, s * 0.04, 0, TAU); c.fill();
  } else if (id === "alev") {
    for (let i = 0; i < 7; i++) {
      const x = cx + (i - 3) * 0.095 * s, base = y0 + 0.14 * s + Math.abs(i - 3) * 0.025 * s;
      const h = (0.34 - Math.abs(i - 3) * 0.04 + 0.1 * Math.sin(t / 130 + i * 1.9)) * s, w = 0.075 * s;
      [["#ff3d00", 1], ["#ff9800", 0.72], ["#ffe94d", 0.42]].forEach((q) => {
        c.beginPath(); c.moveTo(x - w * q[1], base);
        c.quadraticCurveTo(x - w * q[1], base - h * q[1] * 0.55, x + Math.sin(t / 170 + i) * w * 0.4, base - h * q[1]);
        c.quadraticCurveTo(x + w * q[1], base - h * q[1] * 0.55, x + w * q[1], base);
        c.closePath(); c.fillStyle = q[0]; c.fill();
      });
    }
  } else if (id === "kelebek") {
    orbit(c, cx, y0 + 0.05 * s, 0.6 * s, t, ["🦋", "🦋", "🦋", "🌸"], s * 0.26, 1100);
  } else if (id === "kalpler") {
    orbit(c, cx, y0 + 0.1 * s, 0.58 * s, t, ["❤️", "💖", "💗", "💘", "💕"], s * 0.2, 800);
  } else if (id === "yildiz") {
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4 + t / 2500, r = (0.42 + 0.14 * Math.sin(i * 1.7)) * s;
      const k = 0.5 + 0.5 * Math.sin(t / 220 + i * 1.3);
      c.globalAlpha = 0.35 + 0.65 * k;
      emo(c, i % 3 ? "✨" : "⭐", cx + Math.cos(a) * r, cy - 0.05 * s + Math.sin(a) * r * 0.9, s * (0.1 + 0.1 * k));
    }
  } else if (id === "neon") {
    const col = "hsl(" + Math.round((t / 6) % 360) + ",100%,60%)";
    c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = s * 0.12; c.lineWidth = Math.max(3, s * 0.03);
    [-1, 1].forEach((d) => {
      c.beginPath(); c.roundRect(cx + d * 0.17 * s - 0.14 * s, ey - 0.09 * s, 0.28 * s, 0.2 * s, 0.07 * s); c.stroke();
      c.beginPath(); c.moveTo(cx + d * 0.31 * s, ey); c.lineTo(cx + d * 0.46 * s, ey - 0.04 * s); c.stroke();
    });
    c.beginPath(); c.moveTo(cx - 0.03 * s, ey); c.lineTo(cx + 0.03 * s, ey); c.stroke();
  } else if (id === "boya") {
    c.globalAlpha = 0.78; c.lineCap = "round"; c.lineWidth = Math.max(3, s * 0.035);
    [-1, 1].forEach((d) => {
      ["#ff3b3b", "#ffb300", "#37d36a", "#2a9dff", "#9b5cff"].forEach((col, k) => {
        c.strokeStyle = col; c.beginPath();
        c.moveTo(cx + d * 0.1 * s, cy + (0.1 + k * 0.04) * s); c.lineTo(cx + d * 0.32 * s, cy + (0.04 + k * 0.04) * s); c.stroke();
      });
    });
    c.globalAlpha = 1;
    emo(c, "⭐", cx - 0.3 * s, ey - 0.1 * s, s * 0.12); emo(c, "⭐", cx + 0.3 * s, ey - 0.1 * s, s * 0.12);
  } else if (id === "uzayli") {
    c.globalAlpha = 0.38; c.fillStyle = "#5bff6e"; c.beginPath(); c.ellipse(cx, cy + 0.02 * s, 0.33 * s, 0.42 * s, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
    [-1, 1].forEach((d) => {
      c.fillStyle = "#050505"; c.beginPath(); c.ellipse(cx + d * 0.15 * s, ey + 0.02 * s, 0.11 * s, 0.06 * s, d * 0.45, 0, TAU); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(cx + d * 0.12 * s, ey, s * 0.012, 0, TAU); c.fill();
      const w = Math.sin(t / 300 + d) * 0.03 * s;
      c.strokeStyle = "#3fbf4f"; c.lineWidth = Math.max(2, s * 0.02);
      c.beginPath(); c.moveTo(cx + d * 0.12 * s, y0 + 0.1 * s); c.lineTo(cx + d * 0.22 * s + w, y0 - 0.18 * s); c.stroke();
      c.fillStyle = "#c8ff3b"; c.beginPath(); c.arc(cx + d * 0.22 * s + w, y0 - 0.2 * s, s * 0.04, 0, TAU); c.fill();
    });
  } else if (id === "alevgoz") {
    [-1, 1].forEach((d) => {
      const k = 0.8 + 0.2 * Math.sin(t / 150 + d);
      glowCircle(c, cx + d * 0.15 * s, ey + 0.01 * s, s * 0.22 * k, "rgba(255,70,0,0.95)");
      c.fillStyle = "#ffe9a8"; c.beginPath(); c.arc(cx + d * 0.15 * s, ey + 0.01 * s, s * 0.035, 0, TAU); c.fill();
    });
  } else if (id === "cicek") {
    const cols = ["#ff7eb6", "#ffffff", "#ffd23f", "#b388ff", "#ff7eb6", "#ffffff", "#ffd23f"];
    for (let i = 0; i < 7; i++) {
      const x = cx + (i - 3) * 0.1 * s + Math.sin(t / 600 + i) * 0.006 * s, y = y0 + 0.1 * s + Math.abs(i - 3) * 0.04 * s;
      flower(c, x, y, s * 0.032, cols[i]);
    }
  } else if (id === "korsan") {
    c.fillStyle = "#c1121f"; c.beginPath();
    c.moveTo(cx - 0.36 * s, y0 + 0.16 * s); c.quadraticCurveTo(cx, y0 - 0.12 * s, cx + 0.36 * s, y0 + 0.16 * s);
    c.lineTo(cx + 0.33 * s, y0 + 0.01 * s + 0.12 * s); c.quadraticCurveTo(cx, y0 + 0.02 * s, cx - 0.33 * s, y0 + 0.13 * s); c.closePath(); c.fill();
    c.fillStyle = "#fff"; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(cx + (k - 2) * 0.12 * s, y0 + 0.04 * s + Math.abs(k - 2) * 0.03 * s, s * 0.012, 0, TAU); c.fill(); }
    c.strokeStyle = "#111"; c.lineWidth = Math.max(2, s * 0.02);
    c.beginPath(); c.moveTo(cx - 0.4 * s, ey - 0.18 * s); c.lineTo(cx + 0.34 * s, ey + 0.08 * s); c.stroke();
    c.fillStyle = "#111"; c.beginPath(); c.ellipse(cx - 0.15 * s, ey + 0.01 * s, 0.1 * s, 0.085 * s, 0, 0, TAU); c.fill();
  }
  c.restore();
}
