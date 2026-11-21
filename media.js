import { doc, collection, addDoc, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { shrinkGif } from "./gifenc.js?v=1";
import { verdict, thumb } from "./nsfw.js?v=1";

const IMG_RE = /^data:image\/(?:jpeg|gif);base64,[A-Za-z0-9+\/=]+$/;
// Görüntülü konuşma için STUN sunucuları. Bazı mobil ağlarda TURN de gerekir:
// o zaman listeye { urls: "turn:adres", username: "...", credential: "..." } ekle.
const ICE = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }] };

let C = null, btnPhoto = null, btnCall = null, fileEl = null;
let call = null, ring = null, unsubCalls = null;

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

export function initMedia(ctx) {
  C = ctx;
  const st = document.createElement("style");
  st.textContent = ".phb{background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:0 12px;cursor:pointer;font-size:20px}.mimg{display:block;max-width:100%;max-height:260px;border-radius:8px;margin-top:4px;cursor:zoom-in}.mimg.chk{filter:blur(22px);pointer-events:none}.chkb{display:block;margin-top:6px;background:none;border:1px solid var(--lamp);color:var(--lamp);border-radius:8px;padding:6px 10px;font-size:13px;cursor:pointer}.view{position:fixed;inset:0;background:rgba(0,0,0,.92);display:grid;place-items:center;z-index:30}.view img{max-width:96vw;max-height:90vh;border-radius:8px}.call{position:fixed;inset:0;background:#05090f;z-index:40;display:flex;flex-direction:column}.call video{background:#000}.rv{flex:1;min-height:0;width:100%;object-fit:cover}.lv{position:absolute;right:12px;top:calc(12px + env(safe-area-inset-top,0px));width:96px;height:128px;object-fit:cover;border-radius:10px;border:2px solid var(--lamp);transform:scaleX(-1)}.ctitle{position:absolute;left:0;right:0;top:calc(14px + env(safe-area-inset-top,0px));text-align:center;color:#fff;font:600 18px var(--body);text-shadow:0 1px 3px #000;pointer-events:none}.cbar{display:flex;justify-content:center;gap:10px;padding:14px 14px calc(14px + env(safe-area-inset-bottom,0px))}.cbar button{border:0;border-radius:999px;width:48px;height:48px;font-size:20px;cursor:pointer;background:#2a3d57;color:#fff}.cbar .end{background:#d9534f}.call .cmin{position:absolute;left:12px;top:calc(12px + env(safe-area-inset-top,0px));z-index:2;width:44px;height:44px;border:0;border-radius:50%;background:rgba(0,0,0,.45);color:#fff;font-size:20px;cursor:pointer}.call .mend{display:none}.call.mini{inset:auto;top:calc(80px + env(safe-area-inset-top,0px));right:10px;width:112px;height:150px;border-radius:14px;border:2px solid var(--lamp);overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.5);touch-action:none}.call.mini .lv,.call.mini .ctitle,.call.mini .cbar,.call.mini .cmin{display:none}.call.mini .mend{display:grid;place-items:center;position:absolute;right:4px;bottom:4px;width:34px;height:34px;border:0;border-radius:50%;background:#d9534f;color:#fff;font-size:16px;cursor:pointer}.ring{position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top,0px));z-index:50;background:var(--panel);color:var(--text);border:1px solid var(--lamp);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px}.ring div{display:flex;gap:8px}.ring button{border:0;border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:600;color:#fff}.ring .ok{background:#3fb06a}.ring .no{background:#d9534f}";
  document.head.appendChild(st);

  fileEl = document.createElement("input");
  fileEl.type = "file"; fileEl.accept = "image/*"; fileEl.hidden = true;
  document.body.appendChild(fileEl);
  fileEl.onchange = onPhoto;

  btnPhoto = el("button", "phb", "📷");
  btnPhoto.type = "button"; btnPhoto.title = "Fotoğraf veya GIF gönder"; btnPhoto.hidden = true;
  const sendBtn = document.querySelector("#sf button");
  sendBtn.parentNode.insertBefore(btnPhoto, sendBtn);
  btnPhoto.onclick = () => fileEl.click();

  btnCall = el("button", "", "Görüntülü ara");
  btnCall.id = "cb"; btnCall.hidden = true;
  const fb = document.getElementById("fb");
  fb.parentNode.insertBefore(btnCall, fb);
  btnCall.onclick = startCall;
  import("./gifsearch.js?v=2").catch(() => {});
}

export function setDmUi(r) {
  if (!btnPhoto) return;
  btnPhoto.hidden = !r;
  btnCall.hidden = !r.dm;
}

/* ---------- Fotoğraf ---------- */
function resize(file, max, limitChars) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height));
      const w = Math.round(im.width * k), h = Math.round(im.height * k);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(im, 0, 0, w, h);
      URL.revokeObjectURL(url);
      let q = 0.75, d = c.toDataURL("image/jpeg", q);
      while (d.length > limitChars && q > 0.3) { q -= 0.1; d = c.toDataURL("image/jpeg", q); }
      if (d.length > limitChars) rej(new Error("big")); else res(d);
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("bad")); };
    im.src = url;
  });
}

async function onPhoto() {
  const f = fileEl.files && fileEl.files[0];
  fileEl.value = "";
  const r = C.room();
  if (!f || !r) return;
  if (!/^image\//.test(f.type)) { C.toast("Lütfen bir resim seç."); return; }
  try {
    let data = null;
    if (f.type === "image/gif") {
      try { data = await shrinkGif(f, r.dm ? 200000 : 120000); } catch (e) { data = null; }
      if (data === "big") { C.toast("Bu GIF çok büyük, küçültülemedi. Daha kısa bir GIF dene."); return; }
      if (data) C.toast("GIF küçültüldü ve gönderiliyor…");
      else C.toast("GIF hareketli gönderilemedi, resim olarak gönderiliyor.");
    }
    if (!data) data = r.dm ? await resize(f, 640, 85000) : await resize(f, 480, 60000);
    C.toast("Resim denetleniyor…");
    const v = await verdict(data);
    if (v.level === "hard") { await autoBan(data); return; }
    if (v.level === "soft") { C.toast("Bu resim uygunsuz görünüyor, gönderilmedi."); return; }
    if (v.level === "error" && !r.dm) { C.toast("Resim denetimi şu an yapılamıyor. İnternetini kontrol edip biraz sonra tekrar dene."); return; }
    await addDoc(C.msgCol(r), { uid: C.user().uid, nick: C.nick(), text: "", img: data, createdAt: serverTimestamp() });
  } catch (e) {
    C.toast(e && e.code === "permission-denied" ? "İşlem reddedildi. Güvenlik kurallarını güncelledin mi?" : "Fotoğraf gönderilemedi.");
  }
}

async function autoBan(data) {
  C.toast("Uygunsuz içerik algılandı. Hesabın engellendi.");
  try {
    const t = await thumb(data);
    const rec = { nick: C.nick(), createdAt: serverTimestamp(), reason: "nsfw" };
    if (t) rec.thumb = t;
    await setDoc(doc(C.db, "bans", C.user().uid), rec);
  } catch (e) { C.toast("Uygunsuz içerik algılandı, resim gönderilmedi."); }
}

export function addPhoto(parent, src) {
  if (!IMG_RE.test(src)) return;
  const i = el("img", "mimg chk");
  i.src = src; i.alt = "Fotoğraf";
  let blocked = false;
  i.onclick = () => {
    if (blocked) return;
    const v = el("div", "view");
    const big = el("img"); big.src = src;
    v.appendChild(big);
    v.onclick = () => v.remove();
    document.body.appendChild(v);
  };
  parent.appendChild(i);
  verdict(src).then((v) => {
    if (v.level === "ok" || v.level === "error") { i.classList.remove("chk"); return; }
    blocked = true;
    const b = el("button", "chkb", "⚠️ Uygunsuz olabilir. Yine de göster");
    b.type = "button";
    b.onclick = () => { blocked = false; i.classList.remove("chk"); b.remove(); };
    i.after(b);
  });
}

/* ---------- Görüntülü konuşma (WebRTC, sinyal Firestore üzerinden) ---------- */
function openCallUi(c, title) {
  const o = el("div", "call");
  const rv = el("video", "rv"); rv.autoplay = true; rv.playsInline = true;
  const lv = el("video", "lv"); lv.autoplay = true; lv.playsInline = true; lv.muted = true; lv.srcObject = c.stream;
  const t = el("div", "ctitle", title);
  const bar = el("div", "cbar");
  const mic = el("button", "", "🎤"), cam = el("button", "", "📷"), flip = el("button", "", "🔄"), end = el("button", "end", "📞");
  mic.type = "button"; cam.type = "button"; flip.type = "button"; end.type = "button";
  flip.title = "Ön / arka kamera";
  mic.onclick = () => {
    const tr = c.stream.getAudioTracks(); if (!tr.length) return;
    const on = !tr[0].enabled; tr.forEach((x) => { x.enabled = on; }); mic.textContent = on ? "🎤" : "🔇";
  };
  cam.onclick = () => {
    const tr = c.stream.getVideoTracks(); if (!tr.length) return;
    const on = !tr[0].enabled; tr.forEach((x) => { x.enabled = on; }); cam.textContent = on ? "📷" : "🚫";
  };
  flip.onclick = async () => {
    if (c.flipping) return;
    c.flipping = true;
    try {
      const want = c.facing === "environment" ? "user" : "environment";
      let ns = null;
      try { ns = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: want } }, audio: false }); }
      catch (e) { ns = await navigator.mediaDevices.getUserMedia({ video: { facingMode: want }, audio: false }); }
      const nt = ns.getVideoTracks()[0];
      const old = c.stream.getVideoTracks()[0];
      nt.enabled = old ? old.enabled : true;
      const sender = c.pc.getSenders().find((x) => x.track && x.track.kind === "video");
      if (sender) await sender.replaceTrack(nt);
      if (old) { c.stream.removeTrack(old); old.stop(); }
      c.stream.addTrack(nt);
      c.facing = want;
      lv.srcObject = c.stream;
      lv.style.transform = want === "user" ? "scaleX(-1)" : "none";
    } catch (e) { C.toast("Kamera değiştirilemedi."); }
    c.flipping = false;
  };
  end.onclick = () => hangup("");
  const dn = el("button", "", "⬇️"); dn.type = "button"; dn.title =
