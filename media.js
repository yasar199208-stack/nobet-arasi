import { doc, collection, addDoc, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const IMG_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;
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
  btnPhoto.type = "button"; btnPhoto.title = "Fotoğraf gönder"; btnPhoto.hidden = true;
  const sendBtn = document.querySelector("#sf button");
  sendBtn.parentNode.insertBefore(btnPhoto, sendBtn);
  btnPhoto.onclick = () => fileEl.click();

  btnCall = el("button", "", "Görüntülü ara");
  btnCall.id = "cb"; btnCall.hidden = true;
  const fb = document.getElementById("fb");
  fb.parentNode.insertBefore(btnCall, fb);
  btnCall.onclick = startCall;
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
    const data = await resize(f, 640, 85000);
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
