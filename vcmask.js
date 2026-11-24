// Görüntülü odada kamera maskesi: yüzünün üstüne emoji koyar, karşıdakiler de emojiyi görür.
// Yüz takibi telefonda çalışır (görüntü hiçbir yere gönderilmez). Takip yüklenemezse maskeyi parmakla sürükleyip yerleştirirsin.
const FACE = ["😎", "🤡", "👽", "🐶", "🐱", "🦊", "🐵", "🦁", "🤖", "👻", "😈", "🎃", "🥸", "🦄", "🐸", "🐼", "🐯", "🐰", "🐷", "💀", "🥳", "🤓", "😷", "🤠",
  "🐮", "🐔", "🦉", "🐙", "🦖", "🐲", "🧙", "🧛", "🧟", "🎅", "👸", "🤪", "🥴", "🤯", "😵", "🥶"];
// Aksesuar: [kod, yüz merkezine göre dikey kayma, boyut oranı, düğme yazısı]. Kod emoji ise emoji çizilir, değilse özel çizim yapılır.
const ACC = [["👑", -0.62, 0.55], ["🎩", -0.65, 0.65], ["🧢", -0.5, 0.65], ["🎀", -0.55, 0.5], ["🕶️", -0.1, 0.8], ["🥽", -0.1, 0.8], ["🎧", -0.05, 1.05], ["👄", 0.28, 0.4],
  ["🔴", 0.06, 0.22], ["🌼", -0.58, 0.6], ["🎓", -0.58, 0.65], ["👒", -0.55, 0.8],
  ["mus", 0, 1, "Bıyık"], ["halo", 0, 1, "Halka"], ["horn", 0, 1, "Boynuz"]];
// Efekt: [kod, ad, canvas filtresi]
const FX = [
  ["mir", "🪞 Ayna", ""], ["pix", "🔲 Pikselli", ""], ["odk", "🎯 Arkası bulanık", ""], ["gri", "⚫ Siyah-beyaz", "grayscale(1)"], ["sep", "🟤 Eski foto", "sepia(1)"],
  ["neg", "🔄 Negatif", "invert(1)"], ["ren", "🎨 Renk kaydır", "hue-rotate(90deg) saturate(2)"], ["par", "☀️ Parlak", "brightness(1.25) contrast(1.1) saturate(1.3)"],
  ["bul", "🌫️ Bulanık", "blur(3px)"], ["can", "🖍️ Canlı", "contrast(1.5) saturate(2) brightness(1.05)"], ["gec", "🟢 Gece görüşü", "grayscale(1) sepia(1) hue-rotate(50deg) saturate(4) brightness(1.1)"],
  ["neo", "💜 Neon", "saturate(3) contrast(1.4) hue-rotate(-20deg)"], ["ruy", "✨ Rüya", "blur(1.5px) brightness(1.2) saturate(1.5)"], ["gok", "🌈 Gökkuşağı", "hue-rotate(0deg)"]
];
// Yağış: [emoji, yön] (1 aşağı düşer, -1 yukarı uçar)
const RAIN = [["❄️", 1], ["🌸", 1], ["🍂", 1], ["⭐", 1], ["🎉", 1], ["❤️", -1], ["🎈", -1]];
// Çerçeve: [kod, ad]
const FRAMES = [["kalp", "❤️ Kalp"], ["yildiz", "⭐ Yıldız"], ["cicek", "🌸 Çiçek"], ["ates", "🔥 Ateş"], ["neon", "🌈 Neon"], ["sinema", "🎬 Sinema"]];
// Alt yazı bandı: hazır yazılar
const CAPS = [["Nöbetteyim 🛡️", "Nöbetteyim 🛡️"], ["Mola vakti ☕", "Mola vakti ☕"], ["Gece vardiyası 🌙", "Gece vardiyası 🌙"], ["Yorgunum 😴", "Yorgunum 😴"], ["Selam! 👋", "Selam! 👋"], ["Günaydın ☀️", "Günaydın ☀️"], ["İyi nöbetler 🙏", "İyi nöbetler 🙏"]];
const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

const css = document.createElement("style");
css.textContent = ".vmkp{flex:none;max-height:40%;overflow:auto;display:flex;flex-direction:column;gap:6px;padding:8px;border-top:1px solid var(--line);background:var(--panel)}" +
  ".vmkp .r{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}" +
  ".vmkp button{background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;font-size:24px;padding:3px 8px;cursor:pointer;flex:none}" +
  ".vmkp button.t{font-size:14px;padding:8px 10px}.vmkp button.on{border-color:var(--lamp);box-shadow:0 0 0 2px var(--lamp)}" +
  ".vmkp small{text-align:left;color:var(--mute);font-size:12px;flex:none}" +
  ".vcp.mini .vmkp,.call.mini .vmkp{display:none!important}";
document.head.appendChild(css);

function el(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
function toast(m) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 4500);
}
// Özel görüntülü aramada (arkadaşla birebir) bağlantıyı yakalamak için RTCPeerConnection kayıt altına alınır
const PCS = [];
try {
  const RPC = window.RTCPeerConnection;
  if (RPC && !RPC.__vm) {
    const W = class extends RPC { constructor(...a) { super(...a); PCS.push(this); } };
    W.__vm = 1;
    window.RTCPeerConnection = W;
  }
} catch (e) {}
let dmS = null;
function dmSession() {
  const o = document.querySelector(".call");
  if (!o) { dmS = null; return null; }
  const lv = o.querySelector(".lv");
  if (!lv || !lv.srcObject) return null;
  for (let i = PCS.length - 1; i >= 0; i--) if (PCS[i].connectionState === "closed") PCS.splice(i, 1);
  const st = lv.srcObject;
  let pc = null;
  for (let i = PCS.length - 1; i >= 0 && !pc; i--) {
    try { if (PCS[i].getSenders().some((x) => x.track && st.getTracks().indexOf(x.track) >= 0)) pc = PCS[i]; } catch (e) {}
  }
  if (!pc) return null;
  if (!dmS || dmS.root !== o || dmS.pcs.dm !== pc) dmS = { dm: true, root: o, stream: st, pcs: { dm: pc }, tiles: { me: lv } };
  return dmS;
}
function getS() {
  try { const v = window.__vcS ? window.__vcS() : null; return v || dmSession(); } catch (e) { return null; }
}
function barOf(S) { return S.root && S.root.querySelector(".vcb, .cbar"); }

let M = null;      // etkin maske oturumu
let panel = null;  // seçim paneli

function vsender(S) {
  const r = [];
  Object.keys(S.pcs).forEach((id) => {
    const sd = S.pcs[id].getSenders().find((x) => x.track && x.track.kind === "video");
    if (sd) r.push(sd);
  });
  return r;
}
function swap(S, from, to) {
  try { S.stream.removeTrack(from); } catch (e) {}
  try { S.stream.addTrack(to); } catch (e) {}
  vsender(S).forEach((sd) => { try { sd.replaceTrack(to); } catch (e) {} });
}
function flipBtn(S) { const b = barOf(S); return b && b.children[2]; }

function start(S) {
  const raw = S.stream.getVideoTracks()[0];
  if (!raw) { toast("Kameran kapalı ya da yok, maske konamaz."); return false; }
  const rv = document.createElement("video");
  rv.muted = true; rv.playsInline = true; rv.autoplay = true;
  rv.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none";
  rv.srcObject = new MediaStream([raw]);
  document.body.appendChild(rv);
  rv.play().catch(() => {});
  const cv = document.createElement("canvas");
  const st = raw.getSettings ? raw.getSettings() : {};
  cv.width = st.width || 320; cv.height = st.height || 240;
  const out = cv.captureStream(15).getVideoTracks()[0];
  out.enabled = raw.enabled;
  M = { S: S, raw: raw, rv: rv, cv: cv, ctx: cv.getContext("2d"), out: out, face: null, acc: null, fx: null, rain: null, frame: null, cap: null, parts: [],
    x: 0.5, y: 0.45, sz: 0.5, tx: 0.5, ty: 0.45, tsz: 0.5, k: 1, seen: 0, det: null, busy: false, auto: false, drag: null, moved: 0, tm: 0, dt: 0 };
  swap(S, raw, out);
  const fb = flipBtn(S);
  if (fb) fb.disabled = true;
  M.tm = setInterval(draw, 66);
  M.dt = setInterval(detect, 130);
  initDet(M);
  hookTile(S);
  try { if (S.tiles.me) { const v = S.tiles.me.querySelector("video"); if (v) v.play().catch(() => {}); } } catch (e) {}
  return true;
}

async function initDet(m) {
  try {
    const mod = await import(MP + "/vision_bundle.mjs");
    const vis = await mod.FilesetResolver.forVisionTasks(MP + "/wasm");
    let d;
    try {
      d = await mod.FaceDetector.createFromOptions(vis, { baseOptions: { modelAssetPath: MODEL, delegate: "GPU" }, runningMode: "VIDEO", minDetectionConfidence: 0.5 });
    } catch (e) {
      d = await mod.FaceDetector.createFromOptions(vis, { baseOptions: { modelAssetPath: MODEL }, runningMode: "VIDEO", minDetectionConfidence: 0.5 });
    }
    if (M !== m) { try { d.close(); } catch (e) {} return; }
    m.det = d;
    toast("Yüz takibi hazır. Maske yüzünü takip eder.");
  } catch (e) {
    if (M === m) toast("Yüz takibi yüklenemedi. Maskeyi parmağınla sürükleyip yüzüne getir.");
  }
}

function detect() {
  const m = M;
  if (!m || !m.det || m.busy || m.rv.readyState < 2 || !m.rv.videoWidth) return;
  m.busy = true;
  try {
    const r = m.det.detectForVideo(m.rv, performance.now());
    const d = r && r.detections && r.detections[0];
    if (d && d.boundingBox) {
      const b = d.boundingBox, vw = m.rv.videoWidth, vh = m.rv.videoHeight;
      m.tx = (b.originX + b.width / 2) / vw;
      m.ty = (b.originY + b.height / 2) / vh;
      m.tsz = Math.max(b.width, b.height) * 1.4 / vh;
      m.seen = Date.now();
    }
  } catch (e) {}
  m.busy = false;
}

function fxFilter(code) {
  if (code === "gok") return "hue-rotate(" + Math.round((Date.now() / 20) % 360) + "deg) saturate(1.6)";
  for (let i = 0; i < FX.length; i++) if (FX[i][0] === code) return FX[i][2] || "none";
  return "none";
}
function draw() {
  const m = M;
  if (!m) return;
  if (getS() !== m.S) { cleanup(); return; }
  const v = m.rv, w = v.videoWidth, h = v.videoHeight;
  if (!w || !h || v.readyState < 2) return;
  if (m.cv.width !== w || m.cv.height !== h) { m.cv.width = w; m.cv.height = h; }
  const c = m.ctx, mir = m.fx === "mir";
  const live = !!m.det && Date.now() - m.seen < 1200;
  m.auto = live;
  if (live) { m.x += (m.tx - m.x) * 0.5; m.y += (m.ty - m.y) * 0.5; m.sz += (m.tsz - m.sz) * 0.5; }
  const lost = m.det && !live && m.seen && Date.now() - m.seen > 2500; // yüz kayboldu: maskeyi gizle
  const size = Math.max(24, Math.min(h * 0.9, m.sz * h * m.k));
  const cx = (mir ? 1 - m.x : m.x) * w, cy = m.y * h;
  c.save();
  c.filter = m.fx === "odk" ? "blur(6px)" : fxFilter(m.fx);
  if (mir) { c.translate(w, 0); c.scale(-1, 1); }
  if (m.fx === "pix") {
    const tw = Math.max(8, Math.round(w / 12)), th = Math.max(6, Math.round(h / 12));
    m.tc = m.tc || document.createElement("canvas");
    m.tc.width = tw; m.tc.height = th;
    m.tc.getContext("2d").drawImage(v, 0, 0, tw, th);
    c.imageSmoothingEnabled = false;
    c.drawImage(m.tc, 0, 0, w, h);
  } else c.drawImage(v, 0, 0, w, h);
  c.restore();
  if (m.fx === "odk" && !lost) {
    // Yüzün çevresi net, arka plan bulanık kalır
    m.t2 = m.t2 || document.createElement("canvas");
    if (m.t2.width !== w || m.t2.height !== h) { m.t2.width = w; m.t2.height = h; }
    const t = m.t2.getContext("2d");
    t.clearRect(0, 0, w, h);
    t.save();
    if (mir) { t.translate(w, 0); t.scale(-1, 1); }
    t.drawImage(v, 0, 0, w, h);
    t.restore();
    t.globalCompositeOperation = "destination-in";
    t.save();
    t.translate(cx, cy + size * 0.35); t.scale(0.8, 1.25);
    const rr = size * 0.95, g = t.createRadialGradient(0, 0, rr * 0.6, 0, 0, rr);
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
    t.fillStyle = g; t.fillRect(-rr, -rr, rr * 2, rr * 2);
    t.restore();
    t.globalCompositeOperation = "source-over";
    c.drawImage(m.t2, 0, 0);
  }
  if ((m.face || m.acc) && !lost) {
    c.textAlign = "center"; c.textBaseline = "middle";
    const put = (e, px, py, sz) => {
      c.font = Math.round(sz) + "px 'Apple Color Emoji','Noto Color Emoji','Segoe UI Emoji',sans-serif";
      c.fillText(e, px, py + sz * 0.06);
    };
    if (m.face) put(m.face, cx, cy, size);
    if (m.acc) {
      const id = m.acc[0];
      if (id === "mus") drawMus(c, cx, cy + size * 0.2, size);
      else if (id === "halo") drawHalo(c, cx, cy - size * 0.62, size);
      else if (id === "horn") drawHorn(c, cx, cy, size);
      else put(id, cx, cy + m.acc[1] * size, Math.max(18, size * m.acc[2]));
    }
  }
  if (m.rain) rain(m, c, w, h);
  if (m.frame) drawFrame(m, c, w, h);
  if (m.cap) drawCap(c, w, h, m.cap);
}
// Özel çizimler
function drawMus(c, x, y, s) {
  c.save();
  c.fillStyle = "#3b2412";
  [-1, 1].forEach((d) => {
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + d * s * 0.2, y - s * 0.12, x + d * s * 0.42, y + s * 0.02);
    c.quadraticCurveTo(x + d * s * 0.28, y + s * 0.14, x, y + s * 0.07);
    c.closePath(); c.fill();
  });
  c.restore();
}
function drawHalo(c, x, y, s) {
  c.save();
  c.strokeStyle = "#ffd84a"; c.lineWidth = Math.max(3, s * 0.06);
  c.shadowColor = "#ffd84a"; c.shadowBlur = s * 0.15;
  c.beginPath(); c.ellipse(x, y, s * 0.36, s * 0.09, 0, 0, Math.PI * 2); c.stroke();
  c.restore();
}
function drawHorn(c, x, y, s) {
  c.save();
  c.fillStyle = "#d62828";
  [-1, 1].forEach((d) => {
    c.beginPath();
    c.moveTo(x + d * s * 0.16, y - s * 0.4);
    c.lineTo(x + d * s * 0.42, y - s * 0.78);
    c.lineTo(x + d * s * 0.04, y - s * 0.5);
    c.closePath(); c.fill();
  });
  c.restore();
}
function drawFrame(m, c, w, h) {
  const k = m.frame, t = Date.now();
  if (k === "neon") {
    c.save();
    c.lineWidth = Math.max(4, h * 0.035);
    c.strokeStyle = "hsl(" + Math.round((t / 8) % 360) + ",100%,60%)";
    c.shadowColor = c.strokeStyle; c.shadowBlur = h * 0.04;
    c.strokeRect(c.lineWidth / 2, c.lineWidth / 2, w - c.lineWidth, h - c.lineWidth);
    c.restore();
    return;
  }
  if (k === "sinema") {
    c.fillStyle = "#000";
    c.fillRect(0, 0, w, h * 0.12); c.fillRect(0, h * 0.88, w, h * 0.12);
    return;
  }
  const em = { kalp: "❤️", yildiz: "⭐", cicek: "🌸", ates: "🔥" }[k];
  const s = Math.max(14, h * 0.1);
  c.textAlign = "center"; c.textBaseline = "middle";
  const pulse = 1 + Math.sin(t / 250) * 0.08;
  c.font = Math.round(s * pulse) + "px 'Apple Color Emoji','Noto Color Emoji','Segoe UI Emoji',sans-serif";
  const nx = Math.max(3, Math.round(w / s)), ny = Math.max(3, Math.round(h / s));
  if (k === "ates") {
    for (let i = 0; i < nx; i++) c.fillText(em, (i + 0.5) * w / nx, h - s * 0.45 + Math.sin(t / 120 + i) * s * 0.12);
    return;
  }
  for (let i = 0; i < nx; i++) { c.fillText(em, (i + 0.5) * w / nx, s * 0.5); c.fillText(em, (i + 0.5) * w / nx, h - s * 0.5); }
  for (let j = 1; j < ny - 1; j++) { c.fillText(em, s * 0.5, (j + 0.5) * h / ny); c.fillText(em, w - s * 0.5, (j + 0.5) * h / ny); }
}
function drawCap(c, w, h, text) {
  c.save();
  c.fillStyle = "rgba(0,0,0,0.6)";
  c.fillRect(0, h * 0.82, w, h * 0.14);
  c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
  c.font = "bold " + Math.round(h * 0.07) + "px sans-serif";
  c.fillText(text, w / 2, h * 0.89, w * 0.94);
  c.restore();
}
function rain(m, c, w, h) {
  const dir = m.rain[1], s = Math.max(14, h * 0.09);
  if (m.parts.length < 22 && Math.random() < 0.35) {
    m.parts.push({ x: Math.random() * w, y: dir > 0 ? -s : h + s, vy: dir * (h * (0.008 + Math.random() * 0.012)), ph: Math.random() * 6, sc: 0.6 + Math.random() * 0.7 });
  }
  c.textAlign = "center"; c.textBaseline = "middle";
  m.parts = m.parts.filter((p) => {
    p.y += p.vy; p.ph += 0.08; p.x += Math.sin(p.ph) * (w * 0.004);
    if (p.y < -s * 2 || p.y > h + s * 2) return false;
    const sz = Math.round(s * p.sc);
    c.font = sz + "px 'Apple Color Emoji','Noto Color Emoji','Segoe UI Emoji',sans-serif";
    c.fillText(m.rain[0], p.x, p.y);
    return true;
  });
}

// Takip çalışmıyorsa maskeyi parmakla sürükle
function hookTile(S) {
  const t = S.tiles && S.tiles.me;
  if (!t || t._vmk) return;
  t._vmk = 1;
  const pos = (e) => {
    const r = t.getBoundingClientRect(), v = M && M.rv;
    if (!v || !v.videoWidth) return null;
    const vw = v.videoWidth, vh = v.videoHeight, sc = Math.max(r.width / vw, r.height / vh);
    let px = (e.clientX - r.left - (r.width - vw * sc) / 2) / sc / vw;
    try { if (/^matrix\(-1/.test(getComputedStyle(t).transform)) px = 1 - px; } catch (x) {}
    return { x: px, y: (e.clientY - r.top - (r.height - vh * sc) / 2) / sc / vh };
  };
  t.addEventListener("pointerdown", (e) => {
    if (!M || !(M.face || M.acc) || M.auto || M.S.root.classList.contains("mini")) return;
    M.drag = { x: e.clientX, y: e.clientY }; M.moved = 0;
    try { t.setPointerCapture(e.pointerId); } catch (x) {}
  });
  t.addEventListener("pointermove", (e) => {
    if (!M || !M.drag) return;
    if (Math.abs(e.clientX - M.drag.x) + Math.abs(e.clientY - M.drag.y) > 6) M.moved = Date.now();
    const p = pos(e);
    if (p) { M.x = Math.max(0, Math.min(1, M.fx === "mir" ? 1 - p.x : p.x)); M.y = Math.max(0, Math.min(1, p.y)); M.tx = M.x; M.ty = M.y; }
  });
  const end = () => { if (M) M.drag = null; };
  t.addEventListener("pointerup", end); t.addEventListener("pointercancel", end);
  t.addEventListener("click", (e) => { if (M && M.moved && Date.now() - M.moved < 400) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
}

function stopTimers(m) {
  clearInterval(m.tm); clearInterval(m.dt);
  try { if (m.det) m.det.close(); } catch (e) {}
  try { m.rv.srcObject = null; m.rv.remove(); } catch (e) {}
}
// Maskeyi kaldır, kamerayı eski haline getir
function remove() {
  const m = M;
  if (!m) return;
  M = null;
  stopTimers(m);
  const S = m.S;
  if (getS() === S) {
    m.raw.enabled = m.out.enabled;
    swap(S, m.out, m.raw);
    const fb = flipBtn(S);
    if (fb) fb.disabled = false;
  }
  try { m.out.stop(); } catch (e) {}
  syncPanel();
}
// Oda kapandı: kamerayı tamamen bırak
function cleanup() {
  const m = M;
  if (!m) return;
  M = null;
  stopTimers(m);
  try { m.out.stop(); } catch (e) {}
  try { m.raw.stop(); } catch (e) {}
  closePanel();
}

function closePanel() { if (panel) { panel.remove(); panel = null; } }
function syncPanel() {
  if (!panel) return;
  panel.querySelectorAll("button[data-k]").forEach((b) => {
    const k = b.dataset.k, v = b.dataset.v;
    let on = false;
    if (M) {
      if (k === "face") on = M.face === v;
      else if (k === "acc") on = !!M.acc && M.acc[0] === v;
      else if (k === "fx") on = M.fx === v;
      else if (k === "rain") on = !!M.rain && M.rain[0] === v;
      else if (k === "frame") on = M.frame === v;
      else if (k === "cap") on = M.cap === v;
    }
    b.classList.toggle("on", on);
  });
}
function pick(S, k, v) {
  if (!M && !start(S)) return;
  if (k === "face") M.face = M.face === v ? null : v;
  else if (k === "acc") { const a = ACC.find((x) => x[0] === v); M.acc = M.acc && M.acc[0] === v ? null : a; }
  else if (k === "fx") M.fx = M.fx === v ? null : v;
  else if (k === "rain") { const r = RAIN.find((x) => x[0] === v); M.rain = M.rain && M.rain[0] === v ? null : r; M.parts = []; }
  else if (k === "frame") M.frame = M.frame === v ? null : v;
  else if (k === "cap") M.cap = M.cap === v ? null : v;
  if (!M.face && !M.acc && !M.fx && !M.rain && !M.frame && !M.cap) { remove(); return; }
  syncPanel();
}
function openPanel(S) {
  if (panel) { closePanel(); return; }
  panel = el("div", "vmkp");
  const sec = (title, k, items, txt) => {
    panel.appendChild(el("small", "", title));
    const r = el("div", "r");
    items.forEach((it) => {
      const v = Array.isArray(it) ? it[0] : it;
      const lab = txt ? it[1] : (Array.isArray(it) && it[3]) || v;
      const b = el("button", txt || lab.length > 3 ? "t" : "", lab); b.type = "button";
      b.dataset.k = k; b.dataset.v = v;
      b.onclick = () => pick(S, k, v);
      r.appendChild(b);
    });
    panel.appendChild(r);
  };
  sec("Yüz maskesi", "face", FACE, false);
  sec("Aksesuar", "acc", ACC, false);
  sec("Efekt", "fx", FX, true);
  sec("Yağış", "rain", RAIN, false);
  sec("Çerçeve", "frame", FRAMES, true);
  sec("Alt yazı", "cap", CAPS, true);
  const r2 = el("div", "r");
  const mk = (txt, fn) => { const b = el("button", "t", txt); b.type = "button"; b.onclick = fn; r2.appendChild(b); };
  mk("➖ Küçült", () => { if (M) M.k = Math.max(0.5, M.k / 1.15); });
  mk("➕ Büyüt", () => { if (M) M.k = Math.min(2.2, M.k * 1.15); });
  mk("❌ Hepsini kaldır", () => { remove(); closePanel(); });
  panel.appendChild(r2);
  panel.appendChild(el("small", "", "Seçileni tekrar seçersen kapanır. Yüz takibi hazırsa maske yüzünü izler, değilse kendi görüntüne dokunup sürükleyerek yerleştir."));
  const bar = barOf(S);
  S.root.insertBefore(panel, bar);
  syncPanel();
}

function ensureBtn(S) {
  const bar = S.root && barOf(S);
  if (!bar || bar.querySelector(".vmk")) return;
  const b = el("button", "vmk hm", "🎭"); b.type = "button";
  b.onclick = () => openPanel(S);
  const end = bar.querySelector("button.end");
  bar.insertBefore(b, end || null);
}

setInterval(() => {
  const S = getS();
  if (M && M.S !== S) cleanup();
  if (!S) { closePanel(); return; }
  if (S.root && S.stream) ensureBtn(S);
}, 500);
