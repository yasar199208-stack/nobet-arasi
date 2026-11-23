import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, onSnapshot, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { verdict, thumb } from "./nsfw.js?v=1";
import { EXTRA } from "./tones.js?v=1";

// Grup görüntülü konuşma: odada en fazla MAX kişi, herkes herkesle doğrudan bağlanır (WebRTC).
const MAX = 5;
const ICE = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }] };
for (let i = 0; i < 150 && !getApps().length; i++) await new Promise((r) => setTimeout(r, 200));
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);
let user = null, nick = "";
// Oda içi yazışma için küçük küfür filtresi
const BE = ["am", "amk", "aq", "amq", "sik", "sikim", "siktir", "got", "gotun", "gotu", "pic", "picler", "oc", "ibne", "ibneler", "gt", "gtu", "gtun", "gtn", "mk", "mq", "sg", "sktr", "skm", "skim", "skik", "sikm", "yrk", "yrrk", "orspu", "oruspu"];
const BP = ["orospu", "yarrak", "yarak", "pezevenk", "siktir", "sikeyim", "sikerim", "sikik", "amcik", "amina", "aminako", "gotveren", "ibne", "anani", "kahpe", "pust", "gavat", "surtuk", "gtveren", "sktir", "skerim", "skeyim"];
function nrm(s) {
  let t = String(s).normalize("NFKC").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("tr");
  const map = { "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u", "â": "a", "î": "i", "û": "u", "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };
  t = t.replace(/[çğıöşüâîû013457@$]/g, (c) => map[c] || c);
  t = t.replace(/[^a-z]+/g, " ");
  t = t.replace(/([a-z])\1+/g, "$1");
  return t.trim();
}
function bad(text) {
  const words = nrm(text).split(" ").filter(Boolean);
  const singles = words.filter((w) => w.length === 1);
  const glued = singles.length >= 3 ? singles.join("") : "";
  const all = glued ? words.concat([glued]) : words;
  return all.some((w) => BE.indexOf(w) >= 0 || BP.some((p) => w.indexOf(p) === 0));
}
let actx = null, repUn = null;
let repSnd = true;
try { repSnd = localStorage.getItem("repsnd") !== "0"; } catch (e) {}
const TONES = {
  alarm0: { n: "Şikayet (varsayılan)", w: "square", v: 0.4, d: 0.15, s: [[880, 0], [660, 0.18], [880, 0.36], [660, 0.54]] },
  bip: { n: "Bip", w: "square", v: 0.45, d: 0.16, s: [[880, 0], [1175, 0.16]] },
  zil: { n: "Zil", w: "square", v: 0.4, d: 0.11, s: [[1319, 0], [1568, 0.13], [1319, 0.26], [1568, 0.39], [1319, 0.52], [1568, 0.65]] },
  melodi: { n: "Melodi", w: "triangle", v: 0.9, d: 0.22, s: [[523, 0], [659, 0.2], [784, 0.4], [1047, 0.6], [784, 0.9], [1047, 1.1]] }
};
Object.assign(TONES, EXTRA);
let repTone = "alarm0";
try { const k = localStorage.getItem("reptone"); if (k && TONES[k]) repTone = k; } catch (e) {}
function beep() {
  const T = TONES[repTone] || TONES.alarm0;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    const t0 = actx.currentTime + 0.02;
    T.s.forEach((x) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = t0 + x[1];
      o.type = T.w; o.frequency.setValueAtTime(x[0], t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(T.v, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + T.d);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + T.d + 0.05);
    });
  } catch (e) {}
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
}
document.addEventListener("pointerdown", () => { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch (e) {} }, { once: true });

// Yönetici: yeni şikayet gelince ses + uyarı (uygulama açıkken)
function watchReports(u) {
  if (repUn) { repUn(); repUn = null; }
  getDoc(doc(db, "config", "admin")).then((a) => {
    if (!(a.exists() && a.data().uid === u.uid) || !user || user.uid !== u.uid) return;
    let ready = false;
    repUn = onSnapshot(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(20)), (s) => {
      if (ready) {
        const fresh = s.docChanges().filter((c) => c.type === "added" && !(c.doc.metadata && c.doc.metadata.hasPendingWrites));
        if (fresh.length) {
          if (repSnd) beep();
          toast("🚩 Yeni şikayet var.");
          const tb = document.querySelector(".vctab");
          if (tb && tb.textContent.indexOf("🔴") < 0) tb.textContent += " 🔴";
        }
      }
      ready = true;
    }, () => {});
  }).catch(() => {});
}
onAuthStateChanged(auth, (u) => {
  user = u; nick = "";
  if (repUn) { repUn(); repUn = null; }
  if (u) {
    getDoc(doc(db, "users", u.uid)).then((s) => { nick = s.exists() ? (s.data().nick || "") : ""; }).catch(() => {});
    watchReports(u);
  }
});

const st = document.createElement("style");
st.textContent = ".vcp{position:fixed;left:0;right:0;top:0;height:100dvh;background:var(--bg);color:var(--text);z-index:36;display:flex;flex-direction:column}" +
  ".vch{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line)}.vch h2{margin:0;font-size:18px;flex:1}" +
  ".vch button,.vcb button{background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:9px 12px;font-size:15px;cursor:pointer}" +
  ".vcm{padding:12px;display:flex;flex-direction:column;gap:10px;overflow:auto}" +
  ".vcm .vcd{border:1px solid var(--line);border-left:3px solid var(--lamp);border-radius:10px;padding:10px 12px;background:var(--panel);font-size:15px;line-height:1.45}" +
  ".vcm input{width:100%;box-sizing:border-box;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:12px;font-size:18px;letter-spacing:3px;text-transform:uppercase;text-align:center}" +
  ".vcm button.vgo{background:var(--lamp);color:#111;border:0;border-radius:10px;padding:13px;font-size:17px;font-weight:700;cursor:pointer}" +
  ".vcg{flex:1;display:grid;gap:6px;padding:6px;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;min-height:0}" +
  ".vct{position:relative;background:#000;border-radius:10px;overflow:hidden;min-height:0}.vct video{width:100%;height:100%;object-fit:cover}" +
  ".vct b{position:absolute;left:6px;bottom:6px;background:rgba(0,0,0,.55);color:#fff;border-radius:6px;padding:2px 7px;font-size:12px}" +
  ".vcw{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;background:#222;color:#fff;font-size:13px;text-align:center;padding:8px}" +
  ".vcl{display:flex;flex-direction:column;gap:6px;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--panel);font-size:14px}.vcl small{color:var(--mute)}.vcl .vcr{display:flex;gap:6px;flex-wrap:wrap}.vcl button,.vcm button.vsm{background:none;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:8px 10px;font-size:14px;cursor:pointer}.vcb{display:flex;gap:8px;justify-content:center;padding:10px;border-top:1px solid var(--line)}.vcb button.off{background:#e5484d;border-color:#e5484d;color:#fff}.vcb button.end{background:#e5484d;border-color:#e5484d;color:#fff}";
st.textContent += ".vcp.mini{left:auto;top:auto;right:8px;bottom:150px;width:176px;height:auto;border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.45)}" +
  ".vcp.mini .vch{display:none}.vcp.mini .vcg{flex:none;height:112px;padding:3px;gap:3px;touch-action:none}" +
  ".vcp.mini .vcb{padding:4px;gap:4px;border-top:0}.vcp.mini .vcb button{padding:6px 8px;font-size:13px}.vcp.mini .vcb .hm{display:none}";
st.textContent += ".vch{flex-wrap:wrap}.vch.r h2{flex:1 1 100%;font-size:16px;overflow-wrap:anywhere}.vch.r button{padding:7px 9px;font-size:14px}" +
  ".vcp .vcb{flex-wrap:wrap;gap:6px}.vcp .vcb button{padding:8px 9px}" +
  ".vct{cursor:pointer}.vct.spk{outline:3px solid var(--lamp);outline-offset:-3px}" +
  ".vcg.f{grid-template-columns:repeat(4,1fr);grid-template-rows:1fr;grid-auto-rows:72px}.vct.big{grid-column:1/-1;grid-row:1}" +
  ".vct .rx{position:absolute;left:50%;top:38%;font-size:44px;pointer-events:none;animation:vcrx 2.4s ease-out forwards}" +
  "@keyframes vcrx{0%{opacity:0;transform:translate(-50%,20px) scale(.6)}15%{opacity:1;transform:translate(-50%,0) scale(1.1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-60px)}}" +
  ".vct .hd{position:absolute;right:6px;top:4px;font-size:22px}" +
  ".vcc{flex:none;height:42%;display:flex;flex-direction:column;border-top:1px solid var(--line);background:var(--bg)}" +
  ".vcc .lg{flex:1;overflow:auto;padding:8px 10px;display:flex;flex-direction:column;gap:5px;font-size:14px}.vcc .lg div{overflow-wrap:anywhere}.vcc .lg b{color:var(--lamp)}" +
  ".vcc form{display:flex;gap:6px;padding:6px;border-top:1px solid var(--line)}.vcc input{flex:1;min-width:0;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:10px;font-size:16px}.vcc button{background:var(--lamp);color:var(--lamp-ink);border:0;border-radius:10px;padding:0 14px;font-weight:700}" +
  ".vpop{display:flex;gap:6px;justify-content:center;padding:8px;border-top:1px solid var(--line);background:var(--panel)}.vpop button{background:none;border:1px solid var(--line);border-radius:10px;font-size:24px;padding:4px 8px;cursor:pointer}" +
  ".vcp.mini .vcc,.vcp.mini .vpop{display:none!important}.vcp.mini.n3{width:204px}.vcp.mini.n3 .vcg{height:132px}.vcp.mini.n5 .vcg{height:168px}" +
  ".vcp.mini .vcg.f{grid-template-columns:1fr 1fr;grid-template-rows:none;grid-auto-rows:1fr}.vcp.mini .vct.big{grid-column:auto;grid-row:auto}";
document.head.appendChild(st);

function el(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
function toast(m) {
  const t = $("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 4500);
}

let S = null; // etkin oturum
function codeNew() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 5; i++) c += A[Math.floor(Math.random() * A.length)];
  return c;
}

function tile(id, label, stream, mute) {
  let t = S.tiles[id];
  if (!t) {
    t = el("div", "vct");
    const v = document.createElement("video");
    v.autoplay = true; v.playsInline = true; v.muted = !!mute;
    t.appendChild(v); t.appendChild(el("b", "", label));
    t.onclick = () => { if (!S || S.root.classList.contains("mini")) return; S.focus = S.focus === id ? null : id; layout(); };
    S.grid.appendChild(t);
    S.tiles[id] = t;
  }
  const v = t.querySelector("video");
  if (v.srcObject !== stream) { v.srcObject = stream; v.play().catch(() => {}); }
  // Ses çözümleyicisi, görüntü oynamaya başladıktan sonra kurulur (uzak yayınlarda daha önce kurulursa sessiz kalıyor)
  v.onplaying = () => watchAudio(id, stream);
  setTimeout(() => watchAudio(id, stream), 1500);
  layout();
}
function layout() {
  const n = Object.keys(S.tiles).length;
  if (S.focus && !S.tiles[S.focus]) S.focus = null;
  S.grid.classList.toggle("f", !!S.focus);
  S.grid.style.gridTemplateColumns = S.focus ? "" : (n <= 1 ? "1fr" : "1fr 1fr");
  Object.keys(S.tiles).forEach((k) => S.tiles[k].classList.toggle("big", S.focus === k));
  S.root.classList.toggle("n3", n >= 3);
  S.root.classList.toggle("n5", n >= 5);
}
function dropTile(id) {
  if (S && S.tiles[id]) {
    S.tiles[id].remove(); delete S.tiles[id];
    if (S.an[id]) { try { S.an[id].src.disconnect(); } catch (e) {} delete S.an[id]; }
    layout();
  }
}
// Konuşan kişinin görüntüsünü çerçeveyle vurgula
function watchAudio(id, stream) {
  if (!S || S.an[id] || !stream.getAudioTracks().length) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const src = actx.createMediaStreamSource(stream), an = actx.createAnalyser();
    an.fftSize = 1024; src.connect(an);
    S.an[id] = { an: an, src: src, buf: new Uint8Array(an.fftSize), last: 0 };
  } catch (e) {}
}
function speakLoop() {
  if (!S || document.hidden) return;
  try { if (actx && actx.state === "suspended") actx.resume(); } catch (e) {}
  Object.keys(S.an).forEach((id) => {
    const a = S.an[id], t = S.tiles[id];
    if (!t) return;
    a.an.getByteTimeDomainData(a.buf);
    let m = 0;
    for (let k = 0; k < a.buf.length; k++) { const d = Math.abs(a.buf[k] - 128); if (d > m) m = d; }
    if (m > 12) a.last = Date.now();
    t.classList.toggle("spk", Date.now() - a.last < 500);
  });
}

function sig(to, type, data) {
  return addDoc(collection(db, "vrooms", S.code, "sig"), { from: user.uid, to: to, type: type, data: data, createdAt: serverTimestamp() }).catch(() => {});
}

function mkPc(pid, label) {
  if (S.pcs[pid]) return S.pcs[pid];
  const pc = new RTCPeerConnection(ICE);
  pc._q = []; pc._label = label;
  S.stream.getTracks().forEach((t) => pc.addTrack(t, S.stream));
  pc.onicecandidate = (e) => { if (e.candidate) sig(pid, "cand", JSON.stringify(e.candidate.toJSON())); };
  pc.ontrack = (e) => { if (e.streams[0]) tile(pid, pc._label, e.streams[0], false); };
  pc.onconnectionstatechange = () => { if (pc.connectionState === "failed") { try { pc.restartIce(); } catch (x) {} } };
  S.pcs[pid] = pc;
  return pc;
}
async function flush(pc) { while (pc._q.length) { try { await pc.addIceCandidate(pc._q.shift()); } catch (e) {} } }

async function onSig(d) {
  if (!S || d.to !== user.uid) return;
  const pid = d.from, x = d.data;
  try {
    if (d.type === "offer") {
      const pc = mkPc(pid, S.names[pid] || "Katılımcı");
      await pc.setRemoteDescription(JSON.parse(x));
      await flush(pc);
      const a = await pc.createAnswer();
      await pc.setLocalDescription(a);
      sig(pid, "answer", JSON.stringify(pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription));
    } else if (d.type === "answer") {
      const pc = S.pcs[pid];
      if (pc && pc.signalingState === "have-local-offer") { await pc.setRemoteDescription(JSON.parse(x)); await flush(pc); }
    } else if (d.type === "cand") {
      const pc = mkPc(pid, S.names[pid] || "Katılımcı");
      const c = JSON.parse(x);
      if (pc.remoteDescription) { try { await pc.addIceCandidate(c); } catch (e) {} } else pc._q.push(c);
    } else if (d.type === "chat") {
      let t = String(x).slice(0, 200);
      if (bad(t)) t = "***";
      addChat(S.names[pid] || "Katılımcı", t, false);
    } else if (d.type === "react") {
      onReact(pid, String(x));
    } else if (d.type === "kick") {
      if (pid === S.hostUid) { toast("Oda yöneticisi seni odadan çıkardı."); leave(); }
    } else if (d.type === "game") {
      const g = await ensureGame();
      if (g) g.onMsg(pid, String(x));
    }
  } catch (e) {}
}

async function callPeer(pid) {
  const pc = mkPc(pid, S.names[pid] || "Katılımcı");
  const o = await pc.createOffer();
  await pc.setLocalDescription(o);
  sig(pid, "offer", JSON.stringify(pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription));
}

function onPeers(s) {
  if (!S) return;
  const now = Date.now(), live = {};
  s.docs.forEach((d) => {
    const x = d.data();
    if (d.id === user.uid) return;
    if (now - (x.ts || 0) > 90000) return;
    live[d.id] = x.nick || "Katılımcı";
  });
  Object.keys(live).forEach((id) => {
    S.names[id] = live[id];
    const t = S.tiles[id];
    if (t) t.querySelector("b").textContent = live[id];
    // Sırayı uid karşılaştırması belirler: büyük olan arar
    if (!S.pcs[id] && user.uid > id) callPeer(id);
  });
  Object.keys(S.pcs).forEach((id) => {
    if (!live[id]) { try { S.pcs[id].close(); } catch (e) {} delete S.pcs[id]; dropTile(id); }
  });
}

// Uygunsuz görüntü denetimi (telefonda çalışır, görüntü hiçbir yere gönderilmez)
function frame(v) {
  if (!v || v.readyState < 2 || !v.videoWidth) return null;
  const k = 224 / Math.max(v.videoWidth, v.videoHeight);
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(v.videoWidth * k)); c.height = Math.max(1, Math.round(v.videoHeight * k));
  try { c.getContext("2d").drawImage(v, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", 0.7); } catch (e) { return null; }
}
async function selfBan(src) {
  try {
    const rec = { nick: nick || "", createdAt: serverTimestamp(), reason: "nsfw" };
    const t = await thumb(src);
    if (t) rec.thumb = t;
    await setDoc(doc(db, "bans", user.uid), rec);
  } catch (e) {}
}
async function scanOwn(s) {
  const v = s.tiles.me && s.tiles.me.querySelector("video");
  const tr = s.stream.getVideoTracks()[0];
  if (!v || !tr || !tr.enabled) return;
  const f = frame(v);
  if (!f) return;
  const r = await verdict(f);
  if (S !== s) return;
  if (r.level === "hard") {
    tr.enabled = false;
    toast("Uygunsuz görüntü algılandı. Hesabın engellendi.");
    await selfBan(f);
    leave();
  } else if (r.level === "soft") {
    s.strikes = (s.strikes || 0) + 1;
    if (s.strikes >= 2) {
      tr.enabled = false; s.strikes = 0;
      const cb = s.root.querySelector(".vcb button:nth-child(2)");
      if (cb) cb.classList.add("off");
      toast("Uygunsuz görüntü algılandı, kameran kapatıldı.");
    }
  } else if (r.level === "ok") s.strikes = 0;
}
async function scanPeer(s, id) {
  const t = s.tiles[id];
  const v = t && t.querySelector("video");
  const f = frame(v);
  if (!f) return;
  const r = await verdict(f);
  if (S !== s || !s.tiles[id]) return;
  const bad = r.level === "hard" || r.level === "soft";
  s.flag = s.flag || {};
  s.flag[id] = bad ? (s.flag[id] || 0) + 1 : 0;
  const hide = s.flag[id] >= (r.level === "hard" ? 1 : 2);
  v.style.visibility = hide ? "hidden" : "visible";
  let w = t.querySelector(".vcw");
  if (hide && !w) { w = el("div", "vcw", "Uygunsuz görüntü gizlendi"); t.appendChild(w); }
  if (!hide && w) w.remove();
}
function startScan(s) {
  let k = 0;
  s.sc = setInterval(() => {
    if (S !== s || document.hidden) return;
    k++;
    scanOwn(s);
    const ids = Object.keys(s.tiles).filter((x) => x !== "me");
    if (ids.length) scanPeer(s, ids[k % ids.length]);
  }, 3000);
}
