// 🎙️ Sesli mesaj: kaydet, dinle, gönder. Ses, fotoğraflar gibi mesajın içinde (Firestore) saklanır.
import { addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getRep, clearRep } from "./yanit.js?v=1";

const MAX_SN = 60;          // en uzun kayıt (saniye)
const BITRATE = 16000;      // konuşma için yeterli, dosya küçük kalır
const MAX_CHARS = 200000;   // Firestore kuralıyla aynı sınır
const AUD_RE = /^data:audio\/(?:webm|ogg|mp4|mpeg|aac);base64,[A-Za-z0-9+\/=]+$/;

let C = null, btn = null, bar = null, timeEl = null;
let rec = null, stream = null, chunks = [], startAt = 0, tick = 0, cancelled = false, busy = false, pending = false;
let playing = null;

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

function fmt(s) {
  s = Math.max(0, Math.round(s || 0));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

function pickMime() {
  if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return "";
  const list = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/aac"];
  for (let i = 0; i < list.length; i++) if (MediaRecorder.isTypeSupported(list[i])) return list[i];
  return "";
}

export function initVoiceMsg(ctx) {
  C = ctx;
  if (document.getElementById("smx-vmb")) return;

  const st = document.createElement("style");
  st.textContent =
    ".smx-btn{background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:0 12px;cursor:pointer;font-size:20px}" +
    ".smx-btn.smx-on{border-color:#d9534f;background:rgba(217,83,79,.18)}" +
    ".smx-rec{position:fixed;left:10px;right:10px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:25;background:var(--panel);color:var(--text);border:1px solid #d9534f;border-radius:14px;padding:10px 12px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,.45)}" +
    ".smx-rec .smx-dot{width:12px;height:12px;border-radius:50%;background:#d9534f;animation:smxblink 1s infinite}" +
    ".smx-rec .smx-tm{font:600 18px var(--body);min-width:52px}" +
    ".smx-rec .smx-hint{flex:1;color:var(--mute);font-size:13px}" +
    ".smx-rec button{border:0;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;color:#fff}" +
    ".smx-rec .smx-no{background:#55606e}.smx-rec .smx-ok{background:#3fb06a}" +
    "@keyframes smxblink{50%{opacity:.25}}" +
    ".smx-msg{display:flex;align-items:center;gap:10px;margin-top:4px;min-width:200px;max-width:280px;background:rgba(127,150,180,.12);border:1px solid var(--line);border-radius:22px;padding:6px 12px 6px 6px}" +
    ".smx-msg .smx-play{flex:0 0 auto;width:38px;height:38px;border-radius:50%;border:0;background:var(--lamp);color:var(--lamp-ink,#000);font-size:16px;cursor:pointer;display:grid;place-items:center}" +
    ".smx-msg .smx-track{flex:1;height:6px;border-radius:3px;background:var(--line);position:relative;cursor:pointer}" +
    ".smx-msg .smx-fill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:3px;background:var(--lamp)}" +
    ".smx-msg .smx-time{flex:0 0 auto;font-size:12px;color:var(--mute);min-width:34px;text-align:right}";
  document.head.appendChild(st);

  btn = el("button", "smx-btn", "🎙️");
  btn.id = "smx-vmb";
  btn.type = "button";
  btn.title = "Sesli mesaj";
  btn.setAttribute("aria-label", "Sesli mesaj kaydet");
  const form = document.getElementById("sf");
  const send = form && form.querySelector("button[type=submit], button:last-child");
  if (form && send) form.insertBefore(btn, send);
  else if (form) form.appendChild(btn);
  btn.onclick = () => { if (rec) finish(false); else start(); };
}

async function start() {
  if (busy || pending) return;
  const r = C.room(), u = C.user();
  if (!r || !u) { C.toast("Önce bir oda ya da sohbet aç."); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    C.toast("Bu telefon sesli mesaj kaydını desteklemiyor.");
    return;
  }
  busy = true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch (e) {
    busy = false;
    C.toast("Mikrofon izni gerekli. Ayarlardan mikrofona izin ver.");
    return;
  }
  const mime = pickMime();
  try {
    rec = mime ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: BITRATE }) : new MediaRecorder(stream);
  } catch (e) {
    try { rec = new MediaRecorder(stream); } catch (x) { stopStream(); busy = false; C.toast("Kayıt başlatılamadı."); return; }
  }
  chunks = [];
  cancelled = false;
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const me = rec;
  rec.onstop = () => onStopped(me);
  rec.start(250);
  startAt = Date.now();
  busy = false;
  if (playing) { try { playing.pause(); } catch (e) {} }
  showBar();
  btn.classList.add("smx-on");
  btn.textContent = "⏹️";
  if (navigator.vibrate) navigator.vibrate(40);
}

function showBar() {
  hideBar();
  bar = el("div", "smx-rec");
  const dot = el("span", "smx-dot");
  timeEl = el("span", "smx-tm", "0:00");
  const hint = el("span", "smx-hint", "Kaydediliyor… (en fazla " + MAX_SN + " sn)");
  const x = el("button", "smx-no", "✖ İptal"); x.type = "button";
  const ok = el("button", "smx-ok", "➤ Gönder"); ok.type = "button";
  x.onclick = () => finish(true);
  ok.onclick = () => finish(false);
  bar.appendChild(dot); bar.appendChild(timeEl); bar.appendChild(hint); bar.appendChild(x); bar.appendChild(ok);
  document.body.appendChild(bar);
  tick = setInterval(() => {
    const s = (Date.now() - startAt) / 1000;
    if (timeEl) timeEl.textContent = fmt(s);
    if (s >= MAX_SN) { C.toast("En fazla " + MAX_SN + " saniye. Gönderiliyor…"); finish(false); }
  }, 250);
}

function hideBar() {
  clearInterval(tick);
  if (bar) { bar.remove(); bar = null; timeEl = null; }
}

function stopStream() {
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
}

function resetBtn() {
  if (!btn) return;
  btn.classList.remove("smx-on");
  btn.textContent = "🎙️";
}

function finish(cancel) {
  const r0 = rec;
  if (!r0) return;
  rec = null;
  pending = true;
  cancelled = cancel;
  hideBar();
  resetBtn();
  try { if (r0.state !== "inactive") r0.stop(); else onStopped(r0); } catch (e) { onStopped(r0); }
}

function toDataUrl(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = () => rej(new Error("read"));
    fr.readAsDataURL(blob);
  });
}

async function onStopped(r0) {
  if (!r0 || r0.done) return;
  r0.done = true;
  stopStream();
  try { await process(r0); } finally { pending = false; }
}

async function process(r0) {
  const dur = Math.round((Date.now() - startAt) / 100) / 10;
  if (cancelled) { chunks = []; C.toast("Sesli mesaj iptal edildi."); return; }
  if (dur < 1) { chunks = []; C.toast("Çok kısa. Konuşurken biraz bekle."); return; }
  const type = String(r0.mimeType || (chunks[0] && chunks[0].type) || "audio/webm").split(";")[0];
  const blob = new Blob(chunks, { type: type });
  chunks = [];
  const r = C.room(), u = C.user();
  if (!r || !u) return;
  try {
    const data = await toDataUrl(blob);
    if (!AUD_RE.test(data)) { C.toast("Bu ses biçimi desteklenmiyor."); return; }
    if (data.length > MAX_CHARS) { C.toast("Ses çok uzun oldu. Daha kısa konuş."); return; }
    C.toast("Sesli mesaj gönderiliyor…");
    const rp = getRep();
    const msg = { uid: u.uid, nick: C.nick(), text: "", aud: data, dur: Math.min(MAX_SN, dur), createdAt: serverTimestamp() };
    if (rp) msg.rep = rp;
    await addDoc(C.msgCol(r), msg);
    if (rp) clearRep();
    C.toast("Sesli mesaj gönderildi ✅");
  } catch (e) {
    C.toast(e && e.code === "permission-denied" ? "İşlem reddedildi. Firestore kurallarını güncelledin mi?" : "Sesli mesaj gönderilemedi.");
  }
}

// Mesajın içine oynatıcı ekler. Sohbet yenilense de çalan ses kesilmez (id ile hatırlanır).
const players = new Map();

export function addVoice(parent, src, dur, id) {
  if (!AUD_RE.test(String(src || ""))) return;
  const total = Number(dur) > 0 ? Number(dur) : 0;
  const box = el("div", "smx-msg");
  const p = el("button", "smx-play", "▶"); p.type = "button"; p.setAttribute("aria-label", "Sesli mesajı oynat");
  const track = el("div", "smx-track");
  const fill = el("div", "smx-fill");
  const d = el("span", "smx-time", total ? fmt(total) : "🎙️");
  track.appendChild(fill);
  box.appendChild(p); box.appendChild(track); box.appendChild(d);
  parent.appendChild(box);

  const key = id || src.slice(-64);
  let a = players.get(key) || null;

  function len() {
    if (a && isFinite(a.duration) && a.duration > 0) return a.duration;
    return total || 1;
  }
  function paint() {
    if (!a || !box.isConnected) return;
    const at = a.currentTime || 0;
    fill.style.width = (Math.min(1, at / len()) * 100) + "%";
    d.textContent = (a.paused && at === 0) ? (total ? fmt(total) : "🎙️") : fmt(at);
    p.textContent = a.paused ? "▶" : "⏸";
  }
  function bind() {
    a.ontimeupdate = paint;
    a.onplay = paint;
    a.onpause = paint;
    a.onended = () => {
      try { a.currentTime = 0; } catch (e) {}
      if (playing === a) playing = null;
      paint();
    };
    a.onerror = () => { if (C) C.toast("Bu sesli mesaj bu telefonda çalınamadı."); paint(); };
  }
  function make() {
    a = new Audio(src);
    a.preload = "auto";
    players.set(key, a);
    if (players.size > 30) {
      for (const [k, v] of players) { if (v !== playing && v !== a) { players.delete(k); break; } }
    }
  }
  if (a) { bind(); paint(); }

  p.onclick = () => {
    if (!a) make();
    bind();
    if (a.paused) {
      if (playing && playing !== a) { try { playing.pause(); } catch (e) {} }
      playing = a;
      a.play().catch(() => { if (C) C.toast("Ses oynatılamadı."); });
    } else {
      a.pause();
    }
  };
  track.onclick = (e) => {
    if (!a) make();
    bind();
    const rc = track.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (e.clientX - rc.left) / rc.width));
    try { a.currentTime = k * len(); } catch (x) {}
    paint();
  };
}
