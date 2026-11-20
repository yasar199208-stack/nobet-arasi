import { doc, collection, addDoc, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
  st.textContent = ".phb{background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:0 12px;cursor:pointer;font-size:20px}.mimg{display:block;max-width:100%;max-height:260px;border-radius:8px;margin-top:4px;cursor:zoom-in}.view{position:fixed;inset:0;background:rgba(0,0,0,.92);display:grid;place-items:center;z-index:30}.view img{max-width:96vw;max-height:90vh;border-radius:8px}.call{position:fixed;inset:0;background:#05090f;z-index:40;display:flex;flex-direction:column}.call video{background:#000}.rv{flex:1;min-height:0;width:100%;object-fit:cover}.lv{position:absolute;right:12px;top:calc(12px + env(safe-area-inset-top,0px));width:96px;height:128px;object-fit:cover;border-radius:10px;border:2px solid var(--lamp);transform:scaleX(-1)}.ctitle{position:absolute;left:0;right:0;top:calc(14px + env(safe-area-inset-top,0px));text-align:center;color:#fff;font:600 18px var(--body);text-shadow:0 1px 3px #000;pointer-events:none}.cbar{display:flex;justify-content:center;gap:14px;padding:14px 14px calc(14px + env(safe-area-inset-bottom,0px))}.cbar button{border:0;border-radius:999px;width:56px;height:56px;font-size:22px;cursor:pointer;background:#2a3d57;color:#fff}.cbar .end{background:#d9534f}.ring{position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top,0px));z-index:50;background:var(--panel);color:var(--text);border:1px solid var(--lamp);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px}.ring div{display:flex;gap:8px}.ring button{border:0;border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:600;color:#fff}.ring .ok{background:#3fb06a}.ring .no{background:#d9534f}";
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
  import("./gifsearch.js?v=1").catch(() => {});
}

export function setDmUi(r) {
  if (!btnPhoto) return;
  btnPhoto.hidden = !r.dm;
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
  if (!f || !r.dm) return;
  if (!/^image\//.test(f.type)) { C.toast("Lütfen bir resim seç."); return; }
  try {
    let data = null;
    if (f.type === "image/gif") {
      try { data = await shrinkGif(f, 85000); } catch (e) { data = null; }
      if (data === "big") { C.toast("Bu GIF çok büyük, küçültülemedi. Daha kısa bir GIF dene."); return; }
      if (data) C.toast("GIF küçültüldü ve gönderiliyor…");
      else C.toast("GIF hareketli gönderilemedi, resim olarak gönderiliyor.");
    }
    if (!data) data = await resize(f, 640, 85000);
    await addDoc(C.msgCol(r), { uid: C.user().uid, nick: C.nick(), text: "", img: data, createdAt: serverTimestamp() });
  } catch (e) {
    C.toast(e && e.code === "permission-denied" ? "İşlem reddedildi. Güvenlik kurallarını güncelledin mi?" : "Fotoğraf gönderilemedi.");
  }
}

export function addPhoto(parent, src) {
  if (!IMG_RE.test(src)) return;
  const i = el("img", "mimg");
  i.src = src; i.alt = "Fotoğraf";
  i.onclick = () => {
    const v = el("div", "view");
    const big = el("img"); big.src = src;
    v.appendChild(big);
    v.onclick = () => v.remove();
    document.body.appendChild(v);
  };
  parent.appendChild(i);
}

/* ---------- GIF: küçültüp hareketli olarak gönder ---------- */
// Palet: 6x6x6 renk küpü (216 renk), 255 = saydam
function gifPalette() {
  const p = new Uint8Array(768);
  for (let r = 0; r < 6; r++) for (let g = 0; g < 6; g++) for (let b = 0; b < 6; b++) {
    const i = (36 * r + 6 * g + b) * 3;
    p[i] = r * 51; p[i + 1] = g * 51; p[i + 2] = b * 51;
  }
  return p;
}

function lzwEncode(px) {
  const out = [];
  let cur = 0, bits = 0, size = 9, next = 258;
  const dict = new Map();
  function emit(c) {
    cur |= c << bits; bits += size;
    while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; }
  }
  emit(256);
  let prefix = px[0];
  for (let i = 1; i < px.length; i++) {
    const k = px[i], key = prefix * 256 + k, code = dict.get(key);
    if (code !== undefined) { prefix = code; continue; }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      if (next - 1 > (1 << size) - 1 + 0 && size < 12) size++;
    } else {
      emit(256); dict.clear(); next = 258; size = 9;
    }
    prefix = k;
  }
  emit(prefix);
  emit(257);
  if (bits > 0) out.push(cur & 255);
  return out;
}

function gifBytes(frames, w, h) {
  const o = [];
  const w16 = (n) => { o.push(n & 255, (n >> 8) & 255); };
  "GIF89a".split("").forEach((c) => o.push(c.charCodeAt(0)));
  w16(w); w16(h); o.push(0xf7, 0, 0);
  const pal = gifPalette();
  for (let i = 0; i < 768; i++) o.push(pal[i]);
  o.push(0x21, 0xff, 0x0b);
  "NETSCAPE2.0".split("").forEach((c) => o.push(c.charCodeAt(0)));
  o.push(3, 1, 0, 0, 0);
  frames.forEach((f) => {
    o.push(0x21, 0xf9, 4, 0x09); w16(f.delay); o.push(255, 0);
    o.push(0x2c); w16(0); w16(0); w16(w); w16(h); o.push(0);
    o.push(8);
    const d = lzwEncode(f.px);
    for (let i = 0; i < d.length; i += 255) {
      const n = Math.min(255, d.length - i);
      o.push(n);
      for (let j = 0; j < n; j++) o.push(d[i + j]);
    }
    o.push(0);
  });
  o.push(0x3b);
  return new Uint8Array(o);
}

function toB64(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
  return btoa(s);
}

async function gifFrames(file) {
  const dec = new ImageDecoder({ data: await file.arrayBuffer(), type: "image/gif" });
  await dec.tracks.ready;
  const n = dec.tracks.selectedTrack.frameCount;
  if (n < 2) return null;
  const take = Math.min(n, 30), list = [];
  for (let j = 0; j < take; j++) {
    const idx = Math.floor((j * n) / take);
    const r = await dec.decode({ frameIndex: idx });
    const im = r.image;
    const k = Math.min(1, 200 / Math.max(im.displayWidth, im.displayHeight));
    const w = Math.max(1, Math.round(im.displayWidth * k)), h = Math.max(1, Math.round(im.displayHeight * k));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(im, 0, 0, w, h);
    const dur = im.duration ? im.duration / 10000 : 10; // 1/100 sn
    im.close();
    list.push({ c: c, w: w, h: h, d: Math.max(2, Math.round(dur * (n / take))) });
  }
  try { dec.close(); } catch (e) {}
  return list;
}

function gifBuild(list, dim, count) {
  const base = list[0];
  const k = Math.min(1, dim / Math.max(base.w, base.h));
  const w = Math.max(1, Math.round(base.w * k)), h = Math.max(1, Math.round(base.h * k));
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d", { willReadFrequently: true });
  const frames = [];
  for (let j = 0; j < count; j++) {
    const a = Math.floor((j * list.length) / count);
    const b = Math.floor(((j + 1) * list.length) / count);
    let delay = 0;
    for (let i = a; i < Math.max(b, a + 1); i++) delay += list[i].d;
    g.clearRect(0, 0, w, h);
    g.drawImage(list[a].c, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    const px = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < px.length; i++, p += 4) {
      if (d[p + 3] < 128) px[i] = 255;
      else px[i] = 36 * Math.round(d[p] / 51) + 6 * Math.round(d[p + 1] / 51) + Math.round(d[p + 2] / 51);
    }
    frames.push({ px: px, delay: Math.min(500, Math.max(2, delay)) });
  }
  return gifBytes(frames, w, h);
}

// Hareketli GIF'i Firestore sınırına sığacak kadar küçültür; sığmazsa null
async function shrinkGif(file, limitChars) {
  if (typeof ImageDecoder === "undefined") return null;
  const list = await gifFrames(file);
  if (!list) return null;
  const tries = [[200, 30], [160, 24], [140, 18], [120, 14], [100, 10], [90, 8], [80, 6]];
  for (let i = 0; i < tries.length; i++) {
    const cnt = Math.min(tries[i][1], list.length);
    const d = "data:image/gif;base64," + toB64(gifBuild(list, tries[i][0], cnt));
    if (d.length <= limitChars) return d;
  }
  return "big";
}

/* ---------- Görüntülü konuşma (WebRTC, sinyal Firestore üzerinden) ---------- */
function openCallUi(c, title) {
  const o = el("div", "call");
  const rv = el("video", "rv"); rv.autoplay = true; rv.playsInline = true;
  const lv = el("video", "lv"); lv.autoplay = true; lv.playsInline = true; lv.muted = true; lv.srcObject = c.stream;
  const t = el("div", "ctitle", title);
  const bar = el("div", "cbar");
  const mic = el("button", "", "🎤"), cam = el("button", "", "📷"), end = el("button", "end", "📞");
  mic.type = "button"; cam.type = "button"; end.type = "button";
  mic.onclick = () => {
    const tr = c.stream.getAudioTracks(); if (!tr.length) return;
    const on = !tr[0].enabled; tr.forEach((x) => { x.enabled = on; }); mic.textContent = on ? "🎤" : "🔇";
  };
  cam.onclick = () => {
    const tr = c.stream.getVideoTracks(); if (!tr.length) return;
    const on = !tr[0].enabled; tr.forEach((x) => { x.enabled = on; }); cam.textContent = on ? "📷" : "🚫";
  };
  end.onclick = () => hangup("");
  bar.appendChild(mic); bar.appendChild(cam); bar.appendChild(end);
  o.appendChild(rv); o.appendChild(lv); o.appendChild(t); o.appendChild(bar);
  document.body.appendChild(o);
  c.ui = { o: o, rv: rv, t: t };
}

function setTitle(t) { if (call && call.ui) call.ui.t.textContent = t; }

function teardown(msg) {
  const c = call;
  if (!c) return;
  call = null;
  clearTimeout(c.timer);
  c.unsubs.forEach((f) => f());
  try { c.pc.close(); } catch (e) {}
  c.stream.getTracks().forEach((t) => t.stop());
  if (c.ui) c.ui.o.remove();
  if (msg) C.toast(msg);
}

async function hangup(msg) {
  const c = call;
  if (!c) return;
  try { await updateDoc(doc(C.db, "calls", c.pairId), { status: "ended" }); } catch (e) {}
  teardown(msg);
}

function addCand(c, cand) {
  if (c.pc.remoteDescription) c.pc.addIceCandidate(cand).catch(() => {});
  else c.pending.push(cand);
}
function flush(c) { c.pending.splice(0).forEach((cand) => c.pc.addIceCandidate(cand).catch(() => {})); }

function wirePc(c) {
  c.stream.getTracks().forEach((t) => c.pc.addTrack(t, c.stream));
  c.pc.ontrack = (e) => { c.ui.rv.srcObject = e.streams[0]; };
  c.pc.onicecandidate = (e) => {
    if (!e.candidate) return;
    addDoc(collection(C.db, "calls", c.pairId, "cands"), { cid: c.cid, by: C.user().uid, c: JSON.stringify(e.candidate.toJSON()), createdAt: serverTimestamp() }).catch(() => {});
  };
  c.pc.onconnectionstatechange = () => {
    const s = c.pc.connectionState;
    if (s === "connected") { c.connected = true; clearTimeout(c.timer); setTitle(c.otherNick); }
    else if (s === "disconnected") setTitle("Bağlantı zayıf…");
    else if (s === "failed") hangup("Bağlantı kurulamadı. Farklı ağlarda olabilirsiniz.");
  };
  c.unsubs.push(onSnapshot(collection(C.db, "calls", c.pairId, "cands"), (s) => {
    s.docChanges().forEach((ch) => {
      if (ch.type !== "added") return;
      const x = ch.doc.data();
      if (x.cid !== c.cid || x.by === C.user().uid) return;
      try { addCand(c, JSON.parse(x.c)); } catch (e) {}
    });
  }));
}

async function getMedia() {
  if (!navigator.mediaDevices || !window.RTCPeerConnection) { C.toast("Bu tarayıcı görüntülü konuşmayı desteklemiyor."); return null; }
  try { return await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true }); }
  catch (e) { C.toast("Kamera ve mikrofon izni gerekli."); return null; }
}

async function startCall() {
  const r = C.room(), u = C.user();
  if (!r.dm || call) { if (call) C.toast("Zaten bir görüşmedesin."); return; }
  const stream = await getMedia();
  if (!stream) return;
  const cid = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const c = { pairId: r.pairId, cid: cid, stream: stream, pc: new RTCPeerConnection(ICE), unsubs: [], pending: [], otherNick: r.n.slice(1) };
  call = c;
  openCallUi(c, c.otherNick + " aranıyor…");
  try {
    const old = await getDocs(collection(C.db, "calls", r.pairId, "cands"));
    await Promise.all(old.docs.map((d) => deleteDoc(d.ref)));
  } catch (e) {}
  try {
    wirePc(c);
    const offer = await c.pc.createOffer();
    await c.pc.setLocalDescription(offer);
    const ref = doc(C.db, "calls", r.pairId);
    await setDoc(ref, { members: r.pairId.split("_"), from: u.uid, fromNick: C.nick(), cid: cid, offer: { type: offer.type, sdp: offer.sdp }, status: "ringing", createdAt: serverTimestamp() });
    c.unsubs.push(onSnapshot(ref, (s) => {
      const x = s.data();
      if (!x || x.cid !== cid) return;
      if (x.answer && !c.gotAnswer) {
        c.gotAnswer = true;
        setTitle("Bağlanıyor…");
        c.pc.setRemoteDescription(x.answer).then(() => flush(c)).catch(() => {});
      }
      if (x.status === "ended") teardown("Görüşme sona erdi.");
    }));
    c.timer = setTimeout(() => { if (call === c && !c.connected) hangup("Cevap vermedi."); }, 45000);
  } catch (e) {
    teardown(e && e.code === "permission-denied" ? "İşlem reddedildi. Güvenlik kurallarını güncelledin mi?" : "Arama başlatılamadı.");
  }
}

async function answer(pairId, x) {
  if (call) return;
  const stream = await getMedia();
  if (!stream) { try { await updateDoc(doc(C.db, "calls", pairId), { status: "ended" }); } catch (e) {} return; }
  const c = { pairId: pairId, cid: x.cid, stream: stream, pc: new RTCPeerConnection(ICE), unsubs: [], pending: [], otherNick: x.fromNick };
  call = c;
  openCallUi(c, "Bağlanıyor…");
  try {
    wirePc(c);
    await c.pc.setRemoteDescription(x.offer);
    flush(c);
    const ans = await c.pc.createAnswer();
    await c.pc.setLocalDescription(ans);
    const ref = doc(C.db, "calls", pairId);
    await updateDoc(ref, { answer: { type: ans.type, sdp: ans.sdp }, status: "active" });
    c.unsubs.push(onSnapshot(ref, (s) => {
      const y = s.data();
      if (y && y.cid === c.cid && y.status === "ended") teardown("Görüşme sona erdi.");
    }));
    c.timer = setTimeout(() => { if (call === c && !c.connected) hangup("Bağlantı kurulamadı."); }, 30000);
  } catch (e) {
    hangup("Bağlantı kurulamadı.");
  }
}

function hideRing() {
  if (!ring) return;
  clearTimeout(ring.timer);
  ring.node.remove();
  ring = null;
}

function showRing(pairId, x) {
  hideRing();
  const node = el("div", "ring");
  node.appendChild(el("span", "", x.fromNick + " seni görüntülü arıyor"));
  const b = el("div");
  const ok = el("button", "ok", "Cevapla"), no = el("button", "no", "Reddet");
  b.appendChild(ok); b.appendChild(no); node.appendChild(b);
  document.body.appendChild(node);
  ring = { pairId: pairId, cid: x.cid, node: node, timer: setTimeout(hideRing, 45000) };
  if (navigator.vibrate) navigator.vibrate([300, 200, 300]);
  ok.onclick = () => { hideRing(); answer(pairId, x); };
  no.onclick = async () => { hideRing(); try { await updateDoc(doc(C.db, "calls", pairId), { status: "ended" }); } catch (e) {} };
}

export function startCalls() {
  stopCalls();
  const u = C.user();
  unsubCalls = onSnapshot(query(collection(C.db, "calls"), where("members", "array-contains", u.uid)), (s) => {
    s.docs.forEach((d) => {
      const x = d.data();
      if (call && call.pairId === d.id && call.cid === x.cid && x.status === "ended") teardown("Görüşme sona erdi.");
      if (ring && ring.pairId === d.id && ring.cid === x.cid && x.status !== "ringing") hideRing();
      const t = x.createdAt && x.createdAt.toMillis ? x.createdAt.toMillis() : 0;
      if (x.status === "ringing" && x.from !== u.uid && !call && Date.now() - t < 60000) {
        if (!ring || ring.cid !== x.cid) showRing(d.id, x);
      }
    });
  }, () => {});
}

export function stopCalls() {
  if (unsubCalls) { unsubCalls(); unsubCalls = null; }
  hideRing();
  if (call) hangup("");
       }
