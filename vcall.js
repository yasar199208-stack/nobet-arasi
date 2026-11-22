import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, onSnapshot, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { verdict, thumb } from "./nsfw.js?v=1";

// Grup görüntülü konuşma: odada en fazla MAX kişi, herkes herkesle doğrudan bağlanır (WebRTC).
const MAX = 5;
const ICE = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }] };
for (let i = 0; i < 150 && !getApps().length; i++) await new Promise((r) => setTimeout(r, 200));
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);
let user = null, nick = "";
onAuthStateChanged(auth, (u) => { user = u; nick = ""; if (u) getDoc(doc(db, "users", u.uid)).then((s) => { nick = s.exists() ? (s.data().nick || "") : ""; }).catch(() => {}); });

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
    S.grid.appendChild(t);
    S.tiles[id] = t;
  }
  const v = t.querySelector("video");
  if (v.srcObject !== stream) { v.srcObject = stream; v.play().catch(() => {}); }
  layout();
}
function layout() {
  const n = Object.keys(S.tiles).length;
  S.grid.style.gridTemplateColumns = n <= 1 ? "1fr" : "1fr 1fr";
}
function dropTile(id) { if (S && S.tiles[id]) { S.tiles[id].remove(); delete S.tiles[id]; layout(); } }

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

async function leave() {
  const s = S;
  if (!s) return;
  S = null;
  clearInterval(s.hb); clearInterval(s.sc);
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

async function enter(code, host) {
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
  const head = el("div", "vch");
  head.appendChild(el("h2", "", "📹 Oda: " + code));
  const cp = el("button", "", "Kodu kopyala"); cp.type = "button";
  cp.onclick = () => { try { navigator.clipboard.writeText(code); toast("Kod kopyalandı: " + code); } catch (e) { toast("Kod: " + code); } };
  head.appendChild(cp);
  const rp = el("button", "", "🚩 Bildir"); rp.type = "button"; rp.onclick = reportMenu;
  head.appendChild(rp);
  const grid = el("div", "vcg");
  const bar = el("div", "vcb");
  root.appendChild(head); root.appendChild(grid); root.appendChild(bar);
  document.body.appendChild(root);
  S = { code: code, host: host, stream: stream, pcs: {}, tiles: {}, names: {}, unsubs: [], root: root, grid: grid, hb: null };
  const mic = el("button", "", "🎤"), cam = el("button", "", "📷"), flip = el("button", "", "🔄"), end = el("button", "end", "Çık");
  [mic, cam, flip, end].forEach((b) => { b.type = "button"; bar.appendChild(b); });
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
  startScan(S);
  return true;
}

async function create() {
  if (!user) { toast("Önce giriş yap."); return; }
  const code = codeNew();
  try { await setDoc(doc(db, "vrooms", code), { host: user.uid, at: serverTimestamp() }); }
  catch (e) { toast("Oda açılamadı. Tekrar dene."); return; }
  closePanel();
  await enter(code, true);
}
async function join(raw) {
  if (!user) { toast("Önce giriş yap."); return; }
  const code = String(raw || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 5) { toast("Kod 5 karakter olmalı."); return; }
  try {
    const s = await getDoc(doc(db, "vrooms", code));
    if (!s.exists()) { toast("Böyle bir oda yok."); return; }
  } catch (e) { toast("Oda kontrol edilemedi."); return; }
  closePanel();
  await enter(code, false);
}

let panel = null;
function closePanel() { if (panel) { panel.remove(); panel = null; } }
function open() {
  if (S) return;
  closePanel();
  panel = el("div", "vcp");
  const head = el("div", "vch");
  const back = el("button", "", "←"); back.type = "button"; back.onclick = closePanel;
  head.appendChild(back); head.appendChild(el("h2", "", "📹 Görüntülü konuşma"));
  const body = el("div", "vcm");
  const info = el("div", "vcd");
  info.textContent = "En fazla " + MAX + " kişi katılabilir. Çıplak ya da uygunsuz görüntü otomatik denetlenir: şüpheli görüntüde kameran kapanır, kesin uygunsuzda hesabın engellenir. Oda aç, kodu arkadaşlarına mesajla gönder; onlar kodu yazıp katılır. Küfür, hakaret ve taciz yasak. Kimseyi izinsiz kaydetme. Kural dışı davranan birini odadaki 🚩 Bildir düğmesiyle yöneticiye bildirebilirsin.";
  const mk = el("button", "vgo", "➕ Yeni oda aç"); mk.type = "button"; mk.onclick = create;
  const inp = el("input"); inp.placeholder = "ODA KODU"; inp.maxLength = 5;
  const jn = el("button", "vgo", "Odaya katıl"); jn.type = "button"; jn.onclick = () => join(inp.value);
  const wr = el("div", "vcd", "Not: Mobil internette bazı bağlantılar kurulamayabilir. Wi-Fi daha iyi çalışır.");
  [info, mk, inp, jn, wr].forEach((x) => body.appendChild(x));
  getDoc(doc(db, "config", "admin")).then((a) => {
    if (a.exists() && a.data().uid === user.uid && panel) {
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
