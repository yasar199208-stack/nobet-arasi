// Görüntülü odada kamera maskesi: yüzünün üstüne emoji koyar, karşıdakiler de emojiyi görür.
// Yüz takibi telefonda çalışır (görüntü hiçbir yere gönderilmez). Takip yüklenemezse maskeyi parmakla sürükleyip yerleştirirsin.
const FACE = ["😎", "🤡", "👽", "🐶", "🐱", "🦊", "🐵", "🦁", "🤖", "👻", "😈", "🎃", "🥸", "🦄", "🐸", "🐼", "🐯", "🐰", "🐷", "💀", "🥳", "🤓", "😷", "🤠"];
// Aksesuar: [emoji, yüz merkezine göre dikey kayma, boyut oranı]
const ACC = [["👑", -0.62, 0.55], ["🎩", -0.65, 0.65], ["🧢", -0.5, 0.65], ["🎀", -0.55, 0.5], ["🕶️", -0.1, 0.8], ["🥽", -0.1, 0.8], ["🎧", -0.05, 1.05], ["👄", 0.28, 0.4]];
// Efekt: [kod, ad, canvas filtresi]
const FX = [
  ["mir", "🪞 Ayna", ""], ["pix", "🔲 Pikselli", ""], ["gri", "⚫ Siyah-beyaz", "grayscale(1)"], ["sep", "🟤 Eski foto", "sepia(1)"],
  ["neg", "🔄 Negatif", "invert(1)"], ["ren", "🎨 Renk kaydır", "hue-rotate(90deg) saturate(2)"], ["par", "☀️ Parlak", "brightness(1.25) contrast(1.1) saturate(1.3)"],
  ["bul", "🌫️ Bulanık", "blur(3px)"], ["can", "🖍️ Canlı", "contrast(1.5) saturate(2) brightness(1.05)"], ["gec", "🟢 Gece görüşü", "grayscale(1) sepia(1) hue-rotate(50deg) saturate(4) brightness(1.1)"],
  ["neo", "💜 Neon", "saturate(3) contrast(1.4) hue-rotate(-20deg)"], ["ruy", "✨ Rüya", "blur(1.5px) brightness(1.2) saturate(1.5)"], ["gok", "🌈 Gökkuşağı", "hue-rotate(0deg)"]
];
// Yağış: [emoji, yön] (1 aşağı düşer, -1 yukarı uçar)
const RAIN = [["❄️", 1], ["🌸", 1], ["🍂", 1], ["⭐", 1], ["🎉", 1], ["❤️", -1], ["🎈", -1]];
const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

const css = document.createElement("style");
css.textContent = ".vmkp{flex:none;max-height:40%;overflow:auto;display:flex;flex-direction:column;gap:6px;padding:8px;border-top:1px solid var(--line);background:var(--panel)}" +
  ".vmkp .r{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}" +
  ".vmkp button{background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;font-size:24px;padding:3px 8px;cursor:pointer;flex:none}" +
  ".vmkp button.t{font-size:14px;padding:8px 10px}.vmkp button.on{border-color:var(--lamp);box-shadow:0 0 0 2px var(--lamp)}" +
  ".vmkp small{text-align:left;color:var(--mute);font-size:12px;flex:none}" +
  ".vcp.mini .vmkp{display:none!important}";
document.head.appendChild(css);

function el(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
function toast(m) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 4500);
}
function getS() { try { return window.__vcS ? window.__vcS() : null; } catch (e) { return null; } }

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
function flipBtn(S) { return S.root.querySelector(".vcb button:nth-child(3)"); }

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
  M = { S: S, raw: raw, rv: rv, cv: cv, ctx: cv.getContext("2d"), out: out, face: null, acc: null, fx: null, rain: null, parts: [],
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
  c.save();
  c.filter = fxFilter(m.fx);
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
  if (m.face || m.acc) {
    const live = !!m.det && Date.now() - m.seen < 1200;
    m.auto = live;
    const lost = m.det && !live && m.seen && Date.now() - m.seen > 2500; // yüz kayboldu: maskeyi gizle
    if (live) { m.x += (m.tx - m.x) * 0.5; m.y += (m.ty - m.y) * 0.5; m.sz += (m.tsz - m.sz) * 0.5; }
    if (!lost) {
      const size = Math.max(24, Math.min(h * 0.9, m.sz * h * m.k));
      const cx = (mir ? 1 - m.x : m.x) * w, cy = m.y * h;
      c.textAlign = "center"; c.textBaseline = "middle";
      const put = (e, px, py, sz) => {
        c.font = Math.round(sz) + "px 'Apple Color Emoji','Noto Color Emoji','Segoe UI Emoji',sans-serif";
        c.fillText(e, px, py + sz * 0.06);
      };
      if (m.face) put(m.face, cx, cy, size);
      if (m.acc) put(m.acc[0], cx, cy + m.acc[1] * size, Math.max(18, size * m.acc[2]));
    }
  }
  if (m.rain) rain(m, c, w, h);
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
    return { x: (e.clientX - r.left - (r.width - vw * sc) / 2) / sc / vw, y: (e.clientY - r.top - (r.height - vh * sc) / 2) / sc / vh };
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
  if (!M.face && !M.acc && !M.fx && !M.rain) { remove(); return; }
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
      const b = el("button", txt ? "t" : "", txt ? it[1] : v); b.type = "button";
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
  const r2 = el("div", "r");
  const mk = (txt, fn) => { const b = el("button", "t", txt); b.type = "button"; b.onclick = fn; r2.appendChild(b); };
  mk("➖ Küçült", () => { if (M) M.k = Math.max(0.5, M.k / 1.15); });
  mk("➕ Büyüt", () => { if (M) M.k = Math.min(2.2, M.k * 1.15); });
  mk("❌ Hepsini kaldır", () => { remove(); closePanel(); });
  panel.appendChild(r2);
  panel.appendChild(el("small", "", "Seçileni tekrar seçersen kapanır. Yüz takibi hazırsa maske yüzünü izler, değilse kendi görüntüne dokunup sürükleyerek yerleştir."));
  const bar = S.root.querySelector(".vcb");
  S.root.insertBefore(panel, bar);
  syncPanel();
}

function ensureBtn(S) {
  const bar = S.root && S.root.querySelector(".vcb");
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
}, 500);  back.onclick = () => { if (un) un(); ov.remove(); };
  head.appendChild(back); head.appendChild(el("h2", "", "🚩 Görüntülü şikayetler"));
  const body = el("div", "vcm");
  ov.appendChild(head); ov.appendChild(body);
  document.body.appendChild(ov);
  un = onSnapshot(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(50)), (s) => {
    body.textContent = "";
    const rows = s.docs.filter((d) => String(d.data().room || "").indexOf("video:") === 0);
    if (!rows.length) { body.appendChild(el("div", "vcd", "Görüntülü şikayet yok.")); return; }
    rows.forEach((d) => {
      const r = d.data();
      const w = el("div", "vcl");
      const when = r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toLocaleString("tr-TR") : "";
      w.appendChild(el("b", "", "Şikayet edilen: " + (r.msgId || "?")));
      w.appendChild(el("small", "", "Oda " + String(r.room).slice(6) + " · " + when));
      const row = el("div", "vcr");
      const ban = el("button", "", "🚫 Engelle"); ban.type = "button";
      ban.onclick = async () => {
        try {
          await setDoc(doc(db, "bans", r.msgUid), { nick: String(r.msgId || "").slice(0, 20), createdAt: serverTimestamp() });
          await deleteDoc(d.ref);
          toast("Kullanıcı engellendi.");
        } catch (e) { toast("Engellenemedi."); }
      };
      const cl = el("button", "", "Şikayeti kapat"); cl.type = "button";
      cl.onclick = () => deleteDoc(d.ref).catch(() => toast("Kapatılamadı."));
      row.appendChild(ban); row.appendChild(cl);
      w.appendChild(row);
      body.appendChild(w);
    });
  }, () => toast("Şikayetler okunamadı."));
}

// ---- Oda içi özellikler: yazışma, tepkiler, davet, kişiler, oyun ----
function broadcast(type, data) {
  if (!S) return;
  Object.keys(S.names).forEach((id) => sig(id, type, data));
}
function addChat(who, text, mine) {
  if (!S || !S.clog) return;
  const row = el("div");
  row.appendChild(el("b", "", who + ": "));
  row.appendChild(document.createTextNode(text));
  S.clog.appendChild(row);
  while (S.clog.childNodes.length > 80) S.clog.removeChild(S.clog.firstChild);
  S.clog.scrollTop = S.clog.scrollHeight;
  if (!mine && S.chat.style.display === "none") {
    S.unread++;
    if (S.chb) S.chb.textContent = "💬 " + S.unread;
    toast("💬 " + who + ": " + text.slice(0, 40));
  }
}
let lastChat = 0;
function sendChat(raw) {
  if (!S) return;
  const t = String(raw || "").trim().slice(0, 200);
  if (!t) return;
  if (bad(t)) { toast("Mesajında uygunsuz ifade var, gönderilmedi."); return; }
  if (Date.now() - lastChat < 700) return;
  lastChat = Date.now();
  addChat("Sen", t, true);
  broadcast("chat", t);
}
const RX = ["👍", "😂", "❤️", "👏", "😮"];
function showRx(id, emoji) {
  if (!S || !S.tiles[id]) return;
  const e = el("span", "rx", emoji);
  S.tiles[id].appendChild(e);
  setTimeout(() => { try { e.remove(); } catch (x) {} }, 2500);
}
function setHand(id, on) {
  if (!S || !S.tiles[id]) return;
  const t = S.tiles[id], h = t.querySelector(".hd");
  if (on && !h) t.appendChild(el("span", "hd", "✋"));
  if (!on && h) h.remove();
}
function onReact(pid, x) {
  if (x === "hand:1") { setHand(pid, true); toast("✋ " + (S.names[pid] || "Katılımcı") + " el kaldırdı."); }
  else if (x === "hand:0") setHand(pid, false);
  else if (RX.indexOf(x) >= 0) showRx(pid, x);
}
function myReact(x) {
  if (!S) return;
  if (x === "✋") {
    S.hand = !S.hand;
    setHand("me", S.hand);
    broadcast("react", S.hand ? "hand:1" : "hand:0");
  } else { showRx("me", x); broadcast("react", x); }
}
async function ensureGame() {
  if (!S) return null;
  if (S.game) return S.game;
  try {
    const m = await import("./vcgame.js?v=1");
    if (!S) return null;
    if (!S.game) {
      S.game = m.createGame({
        me: user.uid,
        nick: nick || "Katılımcı",
        name: (id) => (S && S.names[id]) || "Katılımcı",
        peers: () => (S ? Object.keys(S.names) : []),
        send: (to, d) => sig(to, "game", d),
        all: (d) => broadcast("game", d),
        toast: toast
      });
    }
    return S.game;
  } catch (e) { toast("Oyun yüklenemedi."); return null; }
}
async function openGame() { const g = await ensureGame(); if (g) g.open(); }
async function invite() {
  if (!S) return;
  const text = "Nöbet Arası görüntülü odası\nOda kodu: " + S.code + (S.topic ? "\nKonu: " + S.topic : "") + "\nhttps://yasar199208-stack.github.io/nobet-arasi/";
  if (navigator.share) {
    try { await navigator.share({ text: text }); return; }
    catch (e) { if (e && e.name === "AbortError") return; }
  }
  try { await navigator.clipboard.writeText(text); toast("Davet metni kopyalandı."); }
  catch (e) { toast("Oda kodu: " + S.code); }
}
function peopleMenu() {
  if (!S) return;
  const s = S;
  const isHost = s.hostUid === user.uid;
  const ov = el("div", "vcp");
  ov.style.zIndex = 37;
  const head = el("div", "vch");
  const back = el("button", "", "←"); back.type = "button"; back.onclick = () => ov.remove();
  head.appendChild(back); head.appendChild(el("h2", "", "👥 Odadakiler"));
  const body = el("div", "vcm");
  body.appendChild(el("div", "vcd", "Sen" + (isHost ? " 👑 (oda yöneticisi)" : "")));
  Object.keys(s.names).forEach((id) => {
    const w = el("div", "vcl");
    w.appendChild(el("b", "", (id === s.hostUid ? "👑 " : "") + s.names[id]));
    if (isHost) {
      const b = el("button", "", "🚪 Odadan çıkar"); b.type = "button";
      b.onclick = () => { sig(id, "kick", "1"); toast(s.names[id] + " odadan çıkarıldı."); ov.remove(); };
      w.appendChild(b);
    }
    body.appendChild(w);
  });
  if (isHost) {
    const lk = el("button", "vsm"); lk.type = "button";
    const lab = () => { lk.textContent = s.locked ? "🔓 Kilidi aç (yeni girişe izin ver)" : "🔒 Odayı kilitle (yeni giriş kapansın)"; };
    lab();
    lk.onclick = async () => {
      try {
        await updateDoc(doc(db, "vrooms", s.code), { locked: !s.locked });
        s.locked = !s.locked; lab();
        toast(s.locked ? "Oda kilitlendi." : "Oda tekrar açıldı.");
      } catch (e) { toast("Değiştirilemedi."); }
    };
    body.appendChild(lk);
    body.appendChild(el("div", "vcd", "Çıkardığın kişi kodu bilirse tekrar girebilir. Girişi tamamen kapatmak için odayı kilitle."));
  } else if (s.hostUid) {
    body.appendChild(el("div", "vcd", "Kişi çıkarma ve odayı kilitleme yetkisi yalnızca oda yöneticisindedir."));
  }
  ov.appendChild(head); ov.appendChild(body);
  document.body.appendChild(ov);
}

async function leave() {
  const s = S;
  if (!s) return;
  S = null;
  clearInterval(s.hb); clearInterval(s.sc); clearInterval(s.sp);
  if (s.game) { try { s.game.destroy(); } catch (e) {} }
  s.unsubs.forEach((u) => { try { u(); } catch (e) {} });
  Object.keys(s.pcs).forEach((id) => { try { s.pcs[id].close(); } catch (e) {} });
  s.stream.getTracks().forEach((t) => t.stop());
  s.root.remove();
  try {
    await deleteDoc(doc(db, "vrooms", s.code, "peers", user.uid));
    if (s.host) {
      const left = await getDocs(collection(db, "vrooms", s.code, "peers"));
      if (left.empty) await deleteDoc(doc(db, "vrooms", s.code));
    }
  } catch (e) {}
}

async function enter(code, host, info) {
  info = info || {};
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15, max: 20 }, facingMode: "user" }
    });
  } catch (e) {
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); toast("Kamera açılamadı, sadece sesle girdin."); }
    catch (e2) { toast("Kamera ve mikrofon izni gerekli. Tarayıcı ayarından izin ver."); return false; }
  }
  if (!host) {
    try {
      const pr = await getDocs(collection(db, "vrooms", code, "peers"));
      const now = Date.now();
      const n = pr.docs.filter((d) => d.id !== user.uid && now - (d.data().ts || 0) < 90000).length;
      if (n >= MAX) { stream.getTracks().forEach((t) => t.stop()); toast("Oda dolu (en fazla " + MAX + " kişi)."); return false; }
    } catch (e) { stream.getTracks().forEach((t) => t.stop()); toast("Odaya girilemedi."); return false; }
  }
  const root = el("div", "vcp");
  const head = el("div", "vch r");
  head.appendChild(el("h2", "", "📹 " + (info.topic ? info.topic + " · " : "") + "Oda: " + code));
  const cp = el("button", "", "Kodu kopyala"); cp.type = "button";
  cp.onclick = () => { try { navigator.clipboard.writeText(code); toast("Kod kopyalandı: " + code); } catch (e) { toast("Kod: " + code); } };
  head.appendChild(cp);
  const rp = el("button", "", "🚩 Bildir"); rp.type = "button"; rp.onclick = reportMenu;
  head.appendChild(rp);
  const ivb = el("button", "", "📨 Davet"); ivb.type = "button"; ivb.onclick = invite;
  const ppb = el("button", "", "👥 Kişiler"); ppb.type = "button"; ppb.onclick = peopleMenu;
  const gmb = el("button", "", "🎮 Oyun"); gmb.type = "button"; gmb.onclick = openGame;
  const mn = el("button", "", "⬇️ Küçült"); mn.type = "button";
  [ivb, ppb, gmb, mn].forEach((b) => head.appendChild(b));
  const grid = el("div", "vcg");
  const bar = el("div", "vcb");
  const chat = el("div", "vcc"); chat.style.display = "none";
  const clog = el("div", "lg");
  const cform = el("form");
  const cin = el("input"); cin.placeholder = "Yaz…"; cin.maxLength = 200; cin.autocomplete = "off";
  const csend = el("button", "", "Gönder"); csend.type = "submit";
  cform.appendChild(cin); cform.appendChild(csend);
  cform.onsubmit = (e) => { e.preventDefault(); sendChat(cin.value); cin.value = ""; };
  chat.appendChild(clog); chat.appendChild(cform);
  const pop = el("div", "vpop"); pop.style.display = "none";
  RX.concat(["✋"]).forEach((x) => {
    const b = el("button", "", x); b.type = "button";
    b.onclick = () => { myReact(x); pop.style.display = "none"; };
    pop.appendChild(b);
  });
  root.appendChild(head); root.appendChild(grid); root.appendChild(chat); root.appendChild(pop); root.appendChild(bar);
  document.body.appendChild(root);
  S = { code: code, host: host, stream: stream, pcs: {}, tiles: {}, names: {}, unsubs: [], root: root, grid: grid, hb: null,
    hostUid: info.hostUid || (host ? user.uid : ""), topic: info.topic || "", locked: !!info.locked,
    an: {}, unread: 0, hand: false, focus: null, game: null, sp: null, chat: chat, clog: clog, chb: null };
  const mic = el("button", "", "🎤"), cam = el("button", "hm", "📷"), flip = el("button", "hm", "🔄"), chb = el("button", "", "💬"), rxb = el("button", "", "😀"), sz = el("button", "", "⬇️"), end = el("button", "end", "Çık");
  [mic, cam, flip, chb, rxb, sz, end].forEach((b) => { b.type = "button"; bar.appendChild(b); });
  S.chb = chb;
  chb.onclick = () => {
    const open = chat.style.display === "none";
    chat.style.display = open ? "flex" : "none";
    if (open) { S.unread = 0; chb.textContent = "💬"; pop.style.display = "none"; clog.scrollTop = clog.scrollHeight; cin.focus(); }
  };
  rxb.onclick = () => { pop.style.display = pop.style.display === "none" ? "flex" : "none"; };
  const toggleMini = () => {
    const m = root.classList.toggle("mini");
    sz.textContent = m ? "⬆️" : "⬇️";
    ["left", "top", "right", "bottom"].forEach((k) => { root.style[k] = ""; });
  };
  mn.onclick = toggleMini; sz.onclick = toggleMini;
  // Küçük pencereyi parmakla sürükle
  let drag = null;
  grid.addEventListener("pointerdown", (e) => {
    if (!root.classList.contains("mini")) return;
    const r = root.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height };
    try { grid.setPointerCapture(e.pointerId); } catch (x) {}
  });
  grid.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const x = Math.max(0, Math.min(window.innerWidth - drag.w, e.clientX - drag.dx));
    const y = Math.max(0, Math.min(window.innerHeight - drag.h, e.clientY - drag.dy));
    root.style.left = x + "px"; root.style.top = y + "px"; root.style.right = "auto"; root.style.bottom = "auto";
  });
  const stop = () => { drag = null; };
  grid.addEventListener("pointerup", stop); grid.addEventListener("pointercancel", stop);
  mic.onclick = () => { const a = stream.getAudioTracks()[0]; if (a) { a.enabled = !a.enabled; mic.classList.toggle("off", !a.enabled); mic.textContent = a.enabled ? "🎤" : "🔇"; } };
  cam.onclick = () => { const v = stream.getVideoTracks()[0]; if (v) { v.enabled = !v.enabled; cam.classList.toggle("off", !v.enabled); } };
  flip.onclick = async () => {
    const v = stream.getVideoTracks()[0];
    if (!v) return;
    const face = v.getSettings().facingMode === "environment" ? "user" : "environment";
    try {
      const ns = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15, max: 20 }, facingMode: face } });
      const nt = ns.getVideoTracks()[0];
      Object.keys(S.pcs).forEach((id) => { const sd = S.pcs[id].getSenders().find((x) => x.track && x.track.kind === "video"); if (sd) sd.replaceTrack(nt); });
      stream.removeTrack(v); v.stop(); stream.addTrack(nt);
      tile("me", "Sen", stream, true);
    } catch (e) { toast("Kamera değiştirilemedi."); }
  };
  end.onclick = leave;
  tile("me", "Sen", stream, true);
  const mine = { nick: nick || "Katılımcı", ts: Date.now() };
  try { await setDoc(doc(db, "vrooms", code, "peers", user.uid), mine); }
  catch (e) { toast("Odaya girilemedi."); leave(); return false; }
  S.hb = setInterval(() => { updateDoc(doc(db, "vrooms", code, "peers", user.uid), { ts: Date.now() }).catch(() => {}); }, 20000);
  S.unsubs.push(onSnapshot(collection(db, "vrooms", code, "peers"), onPeers, () => {}));
  S.unsubs.push(onSnapshot(query(collection(db, "vrooms", code, "sig"), where("to", "==", user.uid)), (s) => {
    s.docChanges().forEach((c) => {
      if (c.type !== "added") return;
      const d = c.doc.data();
      deleteDoc(c.doc.ref).catch(() => {});
      onSig(d);
    });
  }, () => {}));
  S.sp = setInterval(speakLoop, 250);
  startScan(S);
  return true;
}

async function create(topic) {
  if (!user) { toast("Önce giriş yap."); return; }
  topic = String(topic || "").trim().slice(0, 30);
  if (topic && bad(topic)) { toast("Oda konusunda uygunsuz ifade var."); return; }
  const code = codeNew();
  const rec = { host: user.uid, at: serverTimestamp() };
  if (topic) rec.topic = topic;
  try { await setDoc(doc(db, "vrooms", code), rec); }
  catch (e) { toast("Oda açılamadı. Tekrar dene."); return; }
  closePanel();
  await enter(code, true, { hostUid: user.uid, topic: topic });
}
async function join(raw) {
  if (!user) { toast("Önce giriş yap."); return; }
  const code = String(raw || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 5) { toast("Kod 5 karakter olmalı."); return; }
  let rd = {};
  try {
    const s = await getDoc(doc(db, "vrooms", code));
    if (!s.exists()) { toast("Böyle bir oda yok."); return; }
    rd = s.data() || {};
  } catch (e) { toast("Oda kontrol edilemedi."); return; }
  if (rd.locked && rd.host !== user.uid) { toast("Oda kilitli, yeni girişe kapalı."); return; }
  closePanel();
  await enter(code, false, { hostUid: rd.host || "", topic: typeof rd.topic === "string" ? rd.topic : "", locked: !!rd.locked });
}

let panel = null;
function closePanel() { if (panel) { panel.remove(); panel = null; } }
function open() {
  if (S) return;
  closePanel();
  const tb = document.querySelector(".vctab");
  if (tb) tb.textContent = "📹 Görüntü";
  panel = el("div", "vcp");
  const head = el("div", "vch");
  const back = el("button", "", "←"); back.type = "button"; back.onclick = closePanel;
  head.appendChild(back); head.appendChild(el("h2", "", "📹 Görüntülü konuşma"));
  const body = el("div", "vcm");
  const info = el("div", "vcd");
  info.textContent = "En fazla " + MAX + " kişi katılabilir. Çıplak ya da uygunsuz görüntü otomatik denetlenir: şüpheli görüntüde kameran kapanır, kesin uygunsuzda hesabın engellenir. Oda aç, kodu arkadaşlarına mesajla gönder; onlar kodu yazıp katılır. Küfür, hakaret ve taciz yasak. Kimseyi izinsiz kaydetme. Kural dışı davranan birini odadaki 🚩 Bildir düğmesiyle yöneticiye bildirebilirsin.";
  const tin = el("input"); tin.placeholder = "Oda konusu (isteğe bağlı)"; tin.maxLength = 30;
  tin.style.cssText = "letter-spacing:0;text-transform:none;font-size:16px";
  const mk = el("button", "vgo", "➕ Yeni oda aç"); mk.type = "button"; mk.onclick = () => create(tin.value);
  const inp = el("input"); inp.placeholder = "ODA KODU"; inp.maxLength = 5;
  const jn = el("button", "vgo", "Odaya katıl"); jn.type = "button"; jn.onclick = () => join(inp.value);
  const wr = el("div", "vcd", "Not: Mobil internette bazı bağlantılar kurulamayabilir. Wi-Fi daha iyi çalışır.");
  [info, tin, mk, inp, jn, wr].forEach((x) => body.appendChild(x));
  getDoc(doc(db, "config", "admin")).then((a) => {
    if (a.exists() && a.data().uid === user.uid && panel) {
      const sb = el("button", "vsm"); sb.type = "button";
      const lab = () => { sb.textContent = repSnd ? "🔔 Şikayet sesi açık" : "🔕 Şikayet sesi kapalı"; };
      lab();
      sb.onclick = () => {
        repSnd = !repSnd;
        try { localStorage.setItem("repsnd", repSnd ? "1" : "0"); } catch (e) {}
        lab();
        if (repSnd) beep();
      };
      body.appendChild(sb);
      const tn = el("button", "vsm"); tn.type = "button";
      const tl = () => { tn.textContent = "🎵 Şikayet sesi: " + TONES[repTone].n; };
      tl();
      tn.onclick = () => {
        const ks = Object.keys(TONES);
        repTone = ks[(ks.indexOf(repTone) + 1) % ks.length];
        try { localStorage.setItem("reptone", repTone); } catch (e) {}
        tl();
        beep();
      };
      body.appendChild(tn);
      const ab = el("button", "vsm", "🚩 Görüntülü şikayetler (yönetici)"); ab.type = "button"; ab.onclick = adminList;
      body.appendChild(ab);
    }
  }).catch(() => {});
  panel.appendChild(head); panel.appendChild(body);
  document.body.appendChild(panel);
}
function mount() {
  const w = document.querySelector(".mtabs");
  if (!w) return false;
  if (!w.querySelector(".vctab")) {
    const b = el("button", "vctab", "📹 Görüntü");
    b.type = "button"; b.onclick = open;
    w.appendChild(b);
  }
  return true;
}
window.addEventListener("pagehide", () => { if (S) { try { deleteDoc(doc(db, "vrooms", S.code, "peers", user.uid)); } catch (e) {} } });
let n = 0;
const iv = setInterval(() => { if (mount() || ++n > 60) clearInterval(iv); }, 300);
window.__vcS = () => S;
