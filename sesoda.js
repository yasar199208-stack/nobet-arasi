// 🎧 Canlı sesli sohbet odaları: telefon görüşmesi gibi, herkes aynı anda konuşur ve duyar.
// 18 oda, her odada en fazla 8 kişi. Ses doğrudan telefonlar arasında gider (WebRTC), hiçbir yere kaydedilmez.
// Firestore sadece bağlantı kurmak için kullanılır: sesoda/{oda}/peers ve sesoda/{oda}/sig
import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

for (let i = 0; i < 150 && !getApps().length; i++) await new Promise((r) => setTimeout(r, 200));
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);

const MAX = 8;
const STALE = 150 * 1000;   // bu kadar süre sinyal gelmeyen kişi odadan düşer
const BEAT = 60 * 1000;     // "odadayım" sinyali (az veri harcasın diye dakikada bir)
const ICE = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }] };
// [id, simge, ad, açıklama, grup]
const LIST = [
  ["genel", "☕", "Genel sohbet", "Herkese açık muhabbet", "💬 Sohbet"],
  ["genel2", "☕", "Genel sohbet 2", "Birinci doluysa buraya gel", "💬 Sohbet"],
  ["gece", "🌙", "Gece nöbeti", "Uyumayanlar burada", "💬 Sohbet"],
  ["sabah", "🌅", "Sabah vardiyası", "Günaydın, çay demlendi", "💬 Sohbet"],
  ["dert", "💬", "Dertleşme", "İçini dök, dinleyen var", "💬 Sohbet"],
  ["girgir", "😂", "Gırgır şamata", "Fıkra, şaka, kahkaha", "💬 Sohbet"],
  ["meslek", "🛡️", "Meslek sohbeti", "İş, mevzuat, tecrübe", "🛡️ Meslek"],
  ["maas", "💰", "Maaş ve haklar", "Mesai, izin, sözleşme", "🛡️ Meslek"],
  ["sinav", "📚", "Sınav hazırlık", "Kimlik yenileme, sertifika", "🛡️ Meslek"],
  ["yeni", "🆕", "Yeni başlayanlar", "Sor, tecrübeliler anlatsın", "🛡️ Meslek"],
  ["avm", "🏬", "AVM güvenlikçileri", "Mağaza, otopark, giriş", "🏢 Çalışılan yer"],
  ["hastane", "🏥", "Hastane güvenlikçileri", "Acil, poliklinik, ziyaretçi", "🏢 Çalışılan yer"],
  ["fabrika", "🏭", "Fabrika ve şantiye", "Vardiya, devriye, kantar", "🏢 Çalışılan yer"],
  ["site", "🏘️", "Site ve konut", "Kapı, ziyaretçi, kargo", "🏢 Çalışılan yer"],
  ["mac", "⚽", "Maç sohbeti", "Maç izlerken muhabbet", "🎉 Eğlence"],
  ["muzik", "🎵", "Müzik ve muhabbet", "Sakin sohbet", "🎉 Eğlence"],
  ["oyun", "🎮", "Oyun sohbeti", "Telefon oyunları, okey, tavla", "🎉 Eğlence"],
  ["yol", "🚗", "Yol arkadaşı", "İşe giderken, dönerken", "🎉 Eğlence"]
];

let me = null, myNick = "", btn = null, lobby = null, lobbyBox = null, lobbyT = null, counts = {};
let S = null, actx = null;

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

function toast(m) {
  const t = $("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 3200);
}

function color(s) { let h = 0; s = String(s || ""); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return "hsl(" + h + ",55%,68%)"; }
function room(id) { return LIST.find((x) => x[0] === id) || LIST[0]; }
function alive(x) { return x && typeof x.ts === "number" && Date.now() - x.ts < STALE; }

function ctx() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
  if (actx && actx.state === "suspended") actx.resume().catch(() => {});
  return actx;
}
function tick(up) {
  const a = ctx();
  if (!a) return;
  try {
    const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(up ? 660 : 880, t);
    o.frequency.linearRampToValueAtTime(up ? 990 : 550, t + 0.15);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + 0.22);
  } catch (e) {}
}

/* ---------- Görünüm ---------- */
const st = document.createElement("style");
st.textContent =
  ".so-lobby{z-index:72}" +
  ".so-note{color:var(--mute);font-size:13px;margin:0 0 12px}" +
  ".so-g{margin:14px 0 6px;font:700 16px var(--head);color:var(--lamp)}" +
  ".so-g:first-child{margin-top:0}" +
  ".so-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 10px;color:var(--mute);font-size:13px}" +
  ".so-r{display:flex!important;align-items:center;gap:12px;width:100%;margin:0 0 8px;padding:12px!important;text-align:left;border-radius:12px!important}" +
  ".so-r .so-ic{font-size:28px}" +
  ".so-r .so-t{flex:1;min-width:0}" +
  ".so-r .so-t b{display:block;font-size:16px}" +
  ".so-r .so-t small{display:block;color:var(--mute);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".so-r .so-c{flex:none;font-size:13px;padding:3px 9px;border-radius:999px;border:1px solid var(--line)}" +
  ".so-r .so-c.on{border-color:#4caf50;color:#7ddc82}" +
  ".so-r .so-c.full{border-color:var(--danger);color:var(--danger)}" +
  ".so-room{position:fixed;inset:0;z-index:75;background:var(--bg);display:flex;flex-direction:column;padding:calc(10px + env(safe-area-inset-top,0px)) 14px calc(14px + env(safe-area-inset-bottom,0px))}" +
  ".so-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px}" +
  ".so-head h2{margin:0;font:700 24px/1.1 var(--head)}" +
  ".so-head span{color:var(--mute);font-size:13px}" +
  ".so-sub{color:var(--mute);font-size:12px;margin:0 0 12px}" +
  ".so-grid{flex:1;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:14px;align-content:start;padding:6px 2px}" +
  ".so-tile{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}" +
  ".so-av{position:relative;width:72px;height:72px;border-radius:50%;display:grid;place-items:center;font:700 30px var(--head);color:#10151d;box-shadow:0 0 0 3px var(--line);transition:box-shadow .15s}" +
  ".so-tile.spk .so-av{box-shadow:0 0 0 4px #4caf50,0 0 18px 4px rgba(76,175,80,.55)}" +
  ".so-av i{position:absolute;right:-4px;bottom:-4px;font-style:normal;font-size:16px;background:var(--panel);border:1px solid var(--line);border-radius:50%;width:26px;height:26px;display:grid;place-items:center}" +
  ".so-tile b{font-size:14px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
  ".so-tile small{font-size:11px;color:var(--mute);min-height:14px}" +
  ".so-tile small.bad{color:var(--danger)}" +
  ".so-bar{display:flex;gap:10px;justify-content:center;padding-top:10px;border-top:1px solid var(--line)}" +
  ".so-bar button{flex:1;max-width:150px;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:14px;padding:12px 6px;font-size:15px;font-weight:700;cursor:pointer}" +
  ".so-bar button.off{background:#5a1c18;border-color:var(--danger)}" +
  ".so-bar .so-end{background:var(--danger);border-color:var(--danger);color:#fff}" +
  ".so-rep{position:fixed;inset:0;z-index:78;background:rgba(0,0,0,.6);display:grid;place-items:center;padding:16px}" +
  ".so-rep .sheet button{display:block;width:100%;margin:0 0 8px;text-align:left;padding:10px 12px}";
document.head.appendChild(st);

/* ---------- Lobi: oda listesi ---------- */
function buildLobby() {
  lobby = el("div", "panel so-lobby");
  lobby.hidden = true;
  const sh = el("div", "sheet");
  const head = el("div", "sh");
  head.appendChild(el("h2", "", "🎧 Sesli sohbet"));
  const x = el("button", "", "Kapat"); x.type = "button";
  x.onclick = closeLobby;
  head.appendChild(x);
  sh.appendChild(head);
  sh.appendChild(el("p", "so-note", "Canlı sesli oda: herkes aynı anda konuşur, telefon görüşmesi gibi. Her odada en fazla " + MAX + " kişi olabilir. Ses kaydedilmez. Bazı mobil ağlarda bağlantı kurulamayabilir; olmazsa Wi-Fi ile dene."));
  lobbyBox = el("div", "");
  sh.appendChild(lobbyBox);
  lobby.appendChild(sh);
  lobby.onclick = (e) => { if (e.target === lobby) closeLobby(); };
  document.body.appendChild(lobby);
}

function paintLobby() {
  if (!lobbyBox) return;
  lobbyBox.textContent = "";
  const total = Object.keys(counts).reduce((a, k) => a + counts[k].n, 0);
  const top = el("div", "so-top");
  top.appendChild(el("span", "", total ? "🟢 Şu an " + total + " kişi sesli odalarda" : "Şu an kimse yok, ilk sen gir!"));
  const rf = el("button", "", "🔄 Yenile"); rf.type = "button";
  rf.onclick = refreshLobby;
  top.appendChild(rf);
  lobbyBox.appendChild(top);
  let grp = "";
  LIST.forEach((r) => {
    if (r[4] !== grp) { grp = r[4]; lobbyBox.appendChild(el("div", "so-g", grp)); }
    const c = counts[r[0]] || { n: 0, names: [] };
    const b = el("button", "so-r");
    b.type = "button";
    b.appendChild(el("span", "so-ic", r[1]));
    const t = el("span", "so-t");
    t.appendChild(el("b", "", r[2]));
    t.appendChild(el("small", "", c.n ? c.names.slice(0, 3).join(", ") + (c.n > 3 ? " +" + (c.n - 3) : "") : r[3]));
    b.appendChild(t);
    b.appendChild(el("span", "so-c" + (c.n >= MAX ? " full" : c.n ? " on" : ""), c.n >= MAX ? "Dolu" : "👥 " + c.n + "/" + MAX));
    b.onclick = () => enter(r[0]);
    lobbyBox.appendChild(b);
  });
}

// Oda listesi: canlı dinlemek yerine açılışta ve 45 saniyede bir okunur (az veri harcar)
let denied = false;
async function refreshLobby() {
  denied = false;
  await Promise.all(LIST.map(async (r) => {
    try {
      const s = await getDocs(collection(db, "sesoda", r[0], "peers"));
      const live = s.docs.map((d) => d.data()).filter(alive);
      counts[r[0]] = { n: live.length, names: live.map((x) => x.nick || "?") };
      // 10 dakikadan eski kalıntıları temizle
      s.docs.forEach((d) => { const x = d.data(); if (typeof x.ts === "number" && Date.now() - x.ts > 10 * 60 * 1000) deleteDoc(d.ref).catch(() => {}); });
    } catch (e) { if (e && e.code === "permission-denied") denied = true; }
  }));
  if (denied) toast("Sesli sohbet reddedildi. Firestore kurallarını güncelledin mi?");
  paintLobby();
}
function watchLobby() {
  stopLobby();
  refreshLobby();
  lobbyT = setInterval(() => { if (lobby && !lobby.hidden && !document.hidden) refreshLobby(); }, 45 * 1000);
}
function stopLobby() { clearInterval(lobbyT); lobbyT = null; }

async function openLobby() {
  if (!me) return;
  if (S) { S.root.hidden = false; return; }
  if (!lobby) buildLobby();
  ctx();
  if (!myNick) {
    try { const s = await getDoc(doc(db, "users", me.uid)); myNick = s.exists() ? s.data().nick || "" : ""; } catch (e) {}
  }
  paintLobby();
  lobby.hidden = false;
  watchLobby();
}
function closeLobby() { if (lobby) lobby.hidden = true; stopLobby(); }

/* ---------- Oda içi ---------- */
function sig(to, type, data) {
  if (!S) return Promise.resolve();
  return addDoc(collection(db, "sesoda", S.rid, "sig"), { from: me.uid, to: to, type: type, data: data, createdAt: serverTimestamp() }).catch(() => {});
}

function tile(id, name) {
  let t = S.tiles[id];
  if (!t) {
    t = el("div", "so-tile");
    const av = el("div", "so-av", (name || "?").slice(0, 1).toLocaleUpperCase("tr"));
    av.style.background = color(name);
    av.appendChild(el("i", "", ""));
    t.appendChild(av);
    t.appendChild(el("b", "", name || "?"));
    t.appendChild(el("small", "", ""));
    S.grid.appendChild(t);
    S.tiles[id] = t;
  }
  return t;
}
function setState(id, txt, bad) {
  const t = S && S.tiles[id];
  if (!t) return;
  const s = t.querySelector("small");
  s.textContent = txt; s.classList.toggle("bad", !!bad);
}
function setMuteIcon(id, m) {
  const t = S && S.tiles[id];
  if (!t) return;
  const i = t.querySelector(".so-av i");
  i.textContent = m ? "🔇" : "";
  i.style.display = m ? "grid" : "none";
}
function dropPeer(id) {
  if (!S) return;
  if (S.pcs[id]) { try { S.pcs[id].close(); } catch (e) {} delete S.pcs[id]; }
  if (S.audios[id]) { try { S.audios[id].srcObject = null; S.audios[id].remove(); } catch (e) {} delete S.audios[id]; }
  if (S.an[id]) { try { S.an[id].src.disconnect(); } catch (e) {} delete S.an[id]; }
  if (S.tiles[id]) { S.tiles[id].remove(); delete S.tiles[id]; }
}

function analyse(id, stream) {
  const a = ctx();
  if (!a) return;
  try {
    const src = a.createMediaStreamSource(stream), an = a.createAnalyser();
    an.fftSize = 512; src.connect(an);
    S.an[id] = { an: an, src: src, buf: new Uint8Array(an.fftSize), last: 0 };
  } catch (e) {}
}
function speakLoop() {
  if (!S) return;
  const now = Date.now();
  Object.keys(S.an).forEach((id) => {
    const a = S.an[id], t = S.tiles[id];
    if (!t) return;
    a.an.getByteTimeDomainData(a.buf);
    let m = 0;
    for (let k = 0; k < a.buf.length; k++) { const d = Math.abs(a.buf[k] - 128); if (d > m) m = d; }
    if (m > 14 && !(id === "me" && S.muted)) a.last = now;
    t.classList.toggle("spk", now - a.last < 450);
  });
}

function mkPc(pid) {
  if (S.pcs[pid]) return S.pcs[pid];
  const pc = new RTCPeerConnection(ICE);
  pc._q = []; pc._t = Date.now();
  S.stream.getTracks().forEach((t) => pc.addTrack(t, S.stream));
  pc.onicecandidate = (e) => { if (e.candidate) sig(pid, "cand", JSON.stringify(e.candidate.toJSON())); };
  pc.ontrack = (e) => {
    const stream = e.streams[0];
    if (!stream || !S) return;
    let a = S.audios[pid];
    if (!a) { a = el("audio"); a.autoplay = true; a.setAttribute("playsinline", ""); S.root.appendChild(a); S.audios[pid] = a; }
    if (a.srcObject !== stream) {
      a.srcObject = stream;
      a.play().catch(() => setState(pid, "🔈 Sesi açmak için dokun", true));
      if (S.an[pid]) { try { S.an[pid].src.disconnect(); } catch (x) {} }
      analyse(pid, stream);
    }
  };
  pc.onconnectionstatechange = () => {
    if (!S || S.pcs[pid] !== pc) return;
    const s = pc.connectionState;
    if (s === "connected") setState(pid, "");
    else if (s === "connecting" || s === "new") setState(pid, "Bağlanıyor…");
    else if (s === "disconnected") setState(pid, "Bağlantı zayıf…", true);
    else if (s === "failed") {
      setState(pid, "Bağlanamadı, yeniden deneniyor", true);
      try { pc.close(); } catch (x) {}
      delete S.pcs[pid];
      if (me.uid > pid) setTimeout(() => { if (S && S.names[pid] && !S.pcs[pid]) callPeer(pid); }, 3000);
    }
  };
  S.pcs[pid] = pc;
  setState(pid, "Bağlanıyor…");
  return pc;
}
async function flush(pc) { while (pc._q.length) { try { await pc.addIceCandidate(pc._q.shift()); } catch (e) {} } }

async function callPeer(pid) {
  if (!S) return;
  const pc = mkPc(pid);
  try {
    const o = await pc.createOffer();
    await pc.setLocalDescription(o);
    sig(pid, "offer", JSON.stringify(pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription));
  } catch (e) {}
}

async function onSig(d) {
  if (!S || d.to !== me.uid || !d.from || d.from === me.uid) return;
  const pid = d.from, x = d.data;
  try {
    if (d.type === "offer") {
      // Yeni teklif gelirse eski bağlantıyı kapatıp baştan kur
      if (S.pcs[pid]) { try { S.pcs[pid].close(); } catch (e) {} delete S.pcs[pid]; }
      const pc = mkPc(pid);
      await pc.setRemoteDescription(JSON.parse(x));
      await flush(pc);
      const a = await pc.createAnswer();
      await pc.setLocalDescription(a);
      sig(pid, "answer", JSON.stringify(pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription));
    } else if (d.type === "answer") {
      const pc = S.pcs[pid];
      if (pc && pc.signalingState === "have-local-offer") { await pc.setRemoteDescription(JSON.parse(x)); await flush(pc); }
    } else if (d.type === "cand") {
      const pc = S.pcs[pid];
      if (!pc) return;
      const c = JSON.parse(x);
      if (pc.remoteDescription) { try { await pc.addIceCandidate(c); } catch (e) {} } else pc._q.push(c);
    } else if (d.type === "bye") {
      dropPeer(pid);
      delete S.names[pid];
      count();
    }
  } catch (e) {}
}

function count() {
  if (!S) return;
  S.cnt.textContent = "👥 " + (Object.keys(S.names).length + 1) + "/" + MAX;
}

function onPeers(s) {
  if (!S) return;
  const live = {};
  s.docs.forEach((d) => {
    if (d.id === me.uid) return;
    const x = d.data();
    if (!alive(x)) return;
    live[d.id] = x;
  });
  Object.keys(live).forEach((id) => {
    const isNew = !S.names[id];
    S.names[id] = live[id].nick || "?";
    tile(id, S.names[id]);
    setMuteIcon(id, live[id].mute === true);
    if (isNew && S.ready) tick(true);
    // Bağlantıyı uid'si büyük olan başlatır
    if (!S.pcs[id] && me.uid > id) callPeer(id);
    else if (!S.pcs[id]) setState(id, "Bağlanıyor…");
  });
  Object.keys(S.names).forEach((id) => {
    if (!live[id]) { dropPeer(id); delete S.names[id]; if (S.ready) tick(false); }
  });
  S.ready = true;
  count();
}

async function wake(on) {
  try {
    if (on && navigator.wakeLock && !S.wl) S.wl = await navigator.wakeLock.request("screen");
    if (!on && S && S.wl) { S.wl.release(); S.wl = null; }
  } catch (e) {}
}

async function enter(rid) {
  if (S || !me) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.RTCPeerConnection) { toast("Bu cihaz canlı sesli sohbeti desteklemiyor."); return; }
  if ((counts[rid] && counts[rid].n >= MAX)) { toast("Oda dolu (en fazla " + MAX + " kişi)."); return; }
  let stream = null;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); }
  catch (e) { toast("Mikrofon izni gerekli."); return; }
  try {
    const pr = await getDocs(collection(db, "sesoda", rid, "peers"));
    const n = pr.docs.filter((d) => d.id !== me.uid && alive(d.data())).length;
    if (n >= MAX) { stream.getTracks().forEach((t) => t.stop()); toast("Oda dolu (en fazla " + MAX + " kişi)."); return; }
  } catch (e) { stream.getTracks().forEach((t) => t.stop()); toast(e && e.code === "permission-denied" ? "Reddedildi. Firestore kurallarını güncelledin mi?" : "Odaya girilemedi."); return; }

  closeLobby();
  const r = room(rid);
  const root = el("div", "so-room");
  const head = el("div", "so-head");
  head.appendChild(el("h2", "", r[1] + " " + r[2]));
  const cnt = el("span", "", "👥 1/" + MAX);
  head.appendChild(cnt);
  root.appendChild(head);
  root.appendChild(el("p", "so-sub", "🔴 Canlı · Ses doğrudan telefonlar arasında gider, kaydedilmez. Uygulamayı açık tut."));
  const grid = el("div", "so-grid");
  root.appendChild(grid);
  const bar = el("div", "so-bar");
  const mic = el("button", "", "🎤 Sustur"); mic.type = "button";
  const rep = el("button", "", "🚩 Bildir"); rep.type = "button";
  const end = el("button", "so-end", "📴 Ayrıl"); end.type = "button";
  bar.appendChild(mic); bar.appendChild(rep); bar.appendChild(end);
  root.appendChild(bar);
  document.body.appendChild(root);

  S = { rid: rid, stream: stream, pcs: {}, names: {}, tiles: {}, audios: {}, an: {}, unsubs: [], root: root, grid: grid, cnt: cnt, muted: false, ready: false, joinedAt: Date.now(), wl: null };
  tile("me", (myNick || "Sen") + " (sen)");
  setMuteIcon("me", false);
  analyse("me", stream);

  mic.onclick = () => {
    if (!S) return;
    S.muted = !S.muted;
    S.stream.getAudioTracks().forEach((t) => { t.enabled = !S.muted; });
    mic.textContent = S.muted ? "🔇 Aç" : "🎤 Sustur";
    mic.classList.toggle("off", S.muted);
    setMuteIcon("me", S.muted);
    updateDoc(doc(db, "sesoda", S.rid, "peers", me.uid), { mute: S.muted, ts: Date.now() }).catch(() => {});
  };
  rep.onclick = reportMenu;
  end.onclick = () => leave(true);
  root.addEventListener("click", () => {
    if (!S) return;
    ctx();
    Object.keys(S.audios).forEach((id) => { const a = S.audios[id]; if (a.paused) a.play().then(() => setState(id, "")).catch(() => {}); });
  });

  try { await setDoc(doc(db, "sesoda", rid, "peers", me.uid), { nick: myNick, ts: Date.now(), mute: false }); }
  catch (e) { toast(e && e.code === "permission-denied" ? "Reddedildi. Firestore kurallarını güncelledin mi?" : "Odaya girilemedi."); leave(false); return; }

  S.hb = setInterval(() => { if (S) updateDoc(doc(db, "sesoda", S.rid, "peers", me.uid), { ts: Date.now() }).catch(() => {}); }, BEAT);
  S.unsubs.push(onSnapshot(collection(db, "sesoda", rid, "peers"), onPeers, () => {}));
  S.unsubs.push(onSnapshot(query(collection(db, "sesoda", rid, "sig"), where("to", "==", me.uid)), (s) => {
    s.docChanges().forEach((c) => {
      if (c.type !== "added") return;
      const d = c.doc.data();
      deleteDoc(c.doc.ref).catch(() => {});
      const at = d.createdAt && d.createdAt.toMillis ? d.createdAt.toMillis() : Date.now();
      if (S && at < S.joinedAt - 10000) return; // eski kalıntı
      onSig(d);
    });
  }, () => {}));
  S.sp = setInterval(speakLoop, 200);
  wake(true);
  tick(true);
}

async function leave(backToLobby) {
  const s = S;
  if (!s) return;
  Object.keys(s.names).forEach((id) => sig(id, "bye", ""));
  S = null;
  clearInterval(s.hb); clearInterval(s.sp);
  s.unsubs.forEach((u) => { try { u(); } catch (e) {} });
  Object.keys(s.pcs).forEach((id) => { try { s.pcs[id].close(); } catch (e) {} });
  Object.keys(s.an).forEach((id) => { try { s.an[id].src.disconnect(); } catch (e) {} });
  s.stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} });
  try { if (s.wl) s.wl.release(); } catch (e) {}
  s.root.remove();
  tick(false);
  try { await deleteDoc(doc(db, "sesoda", s.rid, "peers", me.uid)); } catch (e) {}
  if (backToLobby) openLobby();
}

function reportMenu() {
  if (!S) return;
  const s = S;
  const ids = Object.keys(s.names);
  const ov = el("div", "so-rep");
  const sh = el("div", "sheet");
  const head = el("div", "sh");
  head.appendChild(el("h2", "", "🚩 Kimi bildiriyorsun?"));
  const x = el("button", "", "Vazgeç"); x.type = "button"; x.onclick = () => ov.remove();
  head.appendChild(x);
  sh.appendChild(head);
  if (!ids.length) sh.appendChild(el("p", "so-note", "Odada başka kimse yok."));
  ids.forEach((id) => {
    const b = el("button", "", "🚩 " + s.names[id]); b.type = "button";
    b.onclick = async () => {
      b.disabled = true;
      s.rep = s.rep || {};
      if (s.rep[id]) { toast("Bu kişiyi zaten bildirdin."); ov.remove(); return; }
      try {
        await addDoc(collection(db, "reports"), { reporter: me.uid, room: "ses:" + s.rid, msgId: String(s.names[id]).slice(0, 40), msgUid: id, createdAt: serverTimestamp() });
        s.rep[id] = 1;
        toast("Şikayet yöneticiye iletildi.");
        ov.remove();
      } catch (e) { b.disabled = false; toast("Şikayet gönderilemedi."); }
    };
    sh.appendChild(b);
  });
  ov.appendChild(sh);
  ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
  document.body.appendChild(ov);
}

/* ---------- Üstteki düğme ---------- */
function ensureBtn() {
  if (btn && btn.isConnected) return;
  const tools = document.querySelector(".tools");
  if (!tools) return;
  btn = el("button", "", "🎧 Sesli oda");
  btn.type = "button";
  btn.onclick = openLobby;
  const out = $("out");
  if (out && out.parentNode === tools) tools.insertBefore(btn, out); else tools.appendChild(btn);
}

onAuthStateChanged(auth, (u) => {
  if (!u) { if (S) leave(false); closeLobby(); }
  me = u;
  myNick = "";
  if (u) ensureBtn();
});

document.addEventListener("visibilitychange", () => { if (S && !document.hidden) wake(true); });
window.addEventListener("pagehide", () => { if (S && me) { try { deleteDoc(doc(db, "sesoda", S.rid, "peers", me.uid)); } catch (e) {} } });

setInterval(() => { if (me) ensureBtn(); }, 1500);
