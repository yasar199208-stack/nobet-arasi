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
// Şikayet: odadaki birini yöneticiye bildir
function reportMenu() {
  if (!S) return;
  const s = S;
  const ids = Object.keys(s.names);
  const ov = el("div", "vcp");
  ov.style.zIndex = 37;
  const head = el("div", "vch");
  const back = el("button", "", "←"); back.type = "button"; back.onclick = () => ov.remove();
  head.appendChild(back); head.appendChild(el("h2", "", "🚩 Kimi bildiriyorsun?"));
  const body = el("div", "vcm");
  if (!ids.length) body.appendChild(el("div", "vcd", "Odada başka kimse yok."));
  ids.forEach((id) => {
    const b = el("button", "vgo", "🚩 " + s.names[id]); b.type = "button";
    b.onclick = async () => {
      b.disabled = true;
      s.rep = s.rep || {};
      if (s.rep[id]) { toast("Bu kişiyi zaten bildirdin."); return; }
      try {
        await addDoc(collection(db, "reports"), { reporter: user.uid, room: "video:" + s.code, msgId: s.names[id], msgUid: id, createdAt: serverTimestamp() });
        s.rep[id] = 1;
        toast("Şikayet yöneticiye iletildi.");
        ov.remove();
      } catch (e) { b.disabled = false; toast("Şikayet gönderilemedi."); }
    };
    body.appendChild(b);
  });
  ov.appendChild(head); ov.appendChild(body);
  document.body.appendChild(ov);
}

// Yönetici: görüntülü konuşma şikayetleri
function adminList() {
  const ov = el("div", "vcp");
  ov.style.zIndex = 37;
  const head = el("div", "vch");
  const back = el("button", "", "←"); back.type = "button";
  let un = null;
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
// Şikayet: odadaki birini yöneticiye bildir
function reportMenu() {
  if (!S) return;
  const s = S;
  const ids = Object.keys(s.names);
  const ov = el("div", "vcp");
  ov.style.zIndex = 37;
  const head = el("div", "vch");
  const back = el("button", "", "←"); back.type = "button"; back.onclick = () => ov.remove();
  head.appendChild(back); head.appendChild(el("h2", "", "🚩 Kimi bildiriyorsun?"));
  const body = el("div", "vcm");
  if (!ids.length) body.appendChild(el("div", "vcd", "Odada başka kimse yok."));
  ids.forEach((id) => {
    const b = el("button", "vgo", "🚩 " + s.names[id]); b.type = "button";
    b.onclick = async () => {
      b.disabled = true;
      s.rep = s.rep || {};
      if (s.rep[id]) { toast("Bu kişiyi zaten bildirdin."); return; }
      try {
        await addDoc(collection(db, "reports"), { reporter: user.uid, room: "video:" + s.code, msgId: s.names[id], msgUid: id, createdAt: serverTimestamp() });
        s.rep[id] = 1;
        toast("Şikayet yöneticiye iletildi.");
        ov.remove();
      } catch (e) { b.disabled = false; toast("Şikayet gönderilemedi."); }
    };
    body.appendChild(b);
  });
  ov.appendChild(head); ov.appendChild(body);
  document.body.appendChild(ov);
}

// Yönetici: görüntülü konuşma şikayetleri
function adminList() {
  const ov = el("div", "vcp");
  ov.style.zIndex = 37;
  const head = el("div", "vch");
  const back = el("button", "", "←"); back.type = "button";
  let un = null;
    back.onclick = () => { if (un) un(); ov.remove(); };
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
