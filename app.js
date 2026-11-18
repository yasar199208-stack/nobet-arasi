import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ROOMS } from "./rooms.js?v=1";
import { initMedia, setDmUi, addPhoto, startCalls, stopCalls } from "./media.js?v=1";
import { initAvatars, paintAv, loadAv, hasAv, pickPhoto, removePhoto } from "./avatar.js?v=1";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, runTransaction, collection, addDoc, getDocs, query, orderBy, limit, onSnapshot, serverTimestamp, where, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBaIbceZ4EIsUEd4IhNcHH4NnJjnixjzFc",
  authDomain: "nobet-arasi.firebaseapp.com",
  projectId: "nobet-arasi",
  storageBucket: "nobet-arasi.firebasestorage.app",
  messagingSenderId: "525115130558",
  appId: "1:525115130558:web:7147ce142a12b173d494ef"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
initAvatars(db, colorOf, toast, () => renderProfile());
initMedia({ db: db, user: () => user, nick: () => nick, room: () => room, msgCol: msgCol, toast: toast });

const $ = (i) => document.getElementById(i);

let mode = "in", registering = false;
const NICK_RE = /^[\p{L}0-9_]{3,20}$/u;

function setMode(m) {
  mode = m;
  $("tIn").setAttribute("aria-pressed", m === "in");
  $("tUp").setAttribute("aria-pressed", m === "up");
  $("nickBox").hidden = m !== "up";
  $("go").textContent = m === "in" ? "Giriş yap" : "Kayıt ol";
  $("pw").autocomplete = m === "in" ? "current-password" : "new-password";
  $("err").textContent = "";
}
$("tIn").onclick = () => setMode("in");
$("tUp").onclick = () => setMode("up");

function errText(e) {
  const c = e && (e.code || e.message);
  const map = {
    "auth/invalid-email": "E-posta adresi geçerli görünmüyor.",
    "auth/email-already-in-use": "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.",
    "auth/weak-password": "Şifre en az 6 karakter olmalı.",
    "auth/invalid-credential": "E-posta ya da şifre hatalı.",
    "auth/user-not-found": "E-posta ya da şifre hatalı.",
    "auth/wrong-password": "E-posta ya da şifre hatalı.",
    "auth/too-many-requests": "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.",
    "auth/network-request-failed": "İnternet bağlantısı yok gibi görünüyor.",
    "nick-taken": "Bu takma ad alınmış. Başka bir tane dene.",
    "bad-invite": "Davet kodu geçersiz. Kodu kontrol et.",
    "permission-denied": "İşlem reddedildi. Güvenlik kurallarının yayınlandığından emin ol."
  };
  return map[c] || "Bir sorun oluştu. Tekrar dene.";
}

async function signUp(email, pw, nick, inv) {
  const key = nick.toLocaleLowerCase("tr");
  const cred = await createUserWithEmailAndPassword(auth, email, pw);
  try {
    await runTransaction(db, async (tx) => {
      const nr = doc(db, "nicks", key);
      if ((await tx.get(nr)).exists()) throw new Error("nick-taken");
      tx.set(nr, { uid: cred.user.uid });
      tx.set(doc(db, "users", cred.user.uid), { nick: nick, invite: inv, createdAt: serverTimestamp() });
    });
  } catch (e) {
    await cred.user.delete().catch(() => {});
    if (e && e.code === "permission-denied") throw new Error("bad-invite");
    throw e;
  }
  return cred.user;
}

$("af").onsubmit = async (e) => {
  e.preventDefault();
  const email = $("em").value.trim(), pw = $("pw").value, nick = $("nick").value.trim(), inv = $("inv").value.trim();
  $("err").textContent = "";
  if (!email || !pw) { $("err").textContent = "E-posta ve şifre gerekli."; return; }
  if (mode === "up" && !NICK_RE.test(nick)) { $("err").textContent = "Takma ad 3-20 karakter olmalı; yalnızca harf, rakam ve alt çizgi."; return; }
  if (mode === "up" && !inv) { $("err").textContent = "Davet kodu gerekli."; return; }
  $("go").disabled = true;
  try {
    if (mode === "up") {
      registering = true;
      const u = await signUp(email, pw, nick, inv);
      registering = false;
      await enter(u);
    } else {
      await signInWithEmailAndPassword(auth, email, pw);
    }
  } catch (err) {
    registering = false;
    $("err").textContent = errText(err);
  }
  $("go").disabled = false;
};

onAuthStateChanged(auth, (u) => { if (!registering) enter(u); });
$("out").onclick = () => signOut(auth);

let user = null, nick = "", room = ROOMS[0], msgs = [], blocked = new Set();
let unsubMsgs = null, unsubBlocks = null, lastSend = 0;
let friendRooms = [], incoming = [], outgoing = [], unsubF = null, unsubIn = null, unsubOut = null;
let profile = null;

async function enter(u) {
  if (unsubMsgs) { unsubMsgs(); unsubMsgs = null; }
  if (unsubBlocks) { unsubBlocks(); unsubBlocks = null; }
  if (unsubF) { unsubF(); unsubF = null; }
  if (unsubIn) { unsubIn(); unsubIn = null; }
  if (unsubOut) { unsubOut(); unsubOut = null; }
  if (!u) {
    user = null; msgs = []; blocked = new Set();
    friendRooms = []; incoming = []; outgoing = []; room = ROOMS[0];
    $("fp").hidden = true;
    profile = null; if ($("pp")) $("pp").hidden = true;
    stopCalls();
    $("app").hidden = true; $("auth").hidden = false;
    return;
  }
  try {
    const snap = await getDoc(doc(db, "users", u.uid));
    if (!snap.exists()) {
      await signOut(auth);
      $("err").textContent = "Profil bulunamadı. Lütfen yeniden kayıt ol.";
      return;
    }
    user = u; nick = snap.data().nick;
  } catch (e) {
    $("err").textContent = errText(e);
    return;
  }
  $("auth").hidden = true; $("app").hidden = false;
  $("me").textContent = nick;
  loadAv(user.uid);
  startCalls();
  unsubBlocks = onSnapshot(collection(db, "users", user.uid, "blocks"), (s) => {
    blocked = new Set(s.docs.map((d) => d.id));
    $("unb").hidden = blocked.size === 0;
    renderChat();
  });
  unsubF = onSnapshot(query(collection(db, "friendships"), where("members", "array-contains", user.uid)), (s) => {
    friendRooms = s.docs.map((d) => {
      const x = d.data();
      const other = x.members[0] === user.uid ? x.members[1] : x.members[0];
      return { id: "dm_" + d.id, dm: true, pairId: d.id, other: other, n: "@" + ((x.names && x.names[other]) || "arkadaş"), d: "Özel sohbet: sadece ikiniz görürsünüz" };
    });
    if (room.dm && !friendRooms.some((f) => f.id === room.id)) openRoom(ROOMS[0]);
    renderRooms(); renderFriends();
  }, (e) => toast(errText(e)));
  unsubIn = onSnapshot(query(collection(db, "friendRequests"), where("to", "==", user.uid)), (s) => {
    incoming = s.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    renderFriends();
  }, (e) => toast(errText(e)));
  unsubOut = onSnapshot(query(collection(db, "friendRequests"), where("from", "==", user.uid)), (s) => {
    outgoing = s.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    renderFriends();
  }, (e) => toast(errText(e)));
  renderRooms();
  openRoom(room);
}

function renderRooms() {
  const h = $("rooms"); h.innerHTML = "";
  const q = $("q").value.toLocaleLowerCase("tr");
  friendRooms.concat(ROOMS).forEach((r) => {
    if (q && r.n.toLocaleLowerCase("tr").indexOf(q) < 0) return;
    const b = document.createElement("button");
    b.className = "room";
    b.setAttribute("aria-current", r.id === room.id);
    const t = document.createElement("b"); t.textContent = r.n;
    const s = document.createElement("span"); s.textContent = r.d;
    b.appendChild(t); b.appendChild(s);
    b.onclick = () => { openRoom(r); renderRooms(); };
    h.appendChild(b);
  });
}
$("q").oninput = renderRooms;

function openRoom(r) {
  room = r;
  setDmUi(r);
  if (unsubMsgs) unsubMsgs();
  msgs = [];
  $("rt").textContent = r.n;
  $("rd").textContent = r.d;
  renderChat(true);
  const qy = query(msgCol(r), orderBy("createdAt", "desc"), limit(r.dm ? 40 : 100));
  unsubMsgs = onSnapshot(qy, (s) => {
    msgs = s.docs.map((d) => {
      const x = d.data({ serverTimestamps: "estimate" });
      return { id: d.id, uid: x.uid, nick: x.nick, text: x.text, img: x.img, at: x.createdAt ? x.createdAt.toDate() : new Date() };
    }).reverse();
    renderChat(true);
  }, (e) => toast(errText(e)));
}

function msgCol(r) {
  return r.dm ? collection(db, "dms", r.pairId, "messages") : collection(db, "rooms", r.id, "messages");
}

async function act(fn) { try { await fn(); } catch (e) { toast(errText(e)); } }

function li(text, buttons) {
  const d = document.createElement("div"); d.className = "li";
  const s = document.createElement("span"); s.textContent = text;
  const b = document.createElement("div");
  buttons.forEach((x) => { const bt = document.createElement("button"); bt.type = "button"; bt.textContent = x[0]; bt.onclick = x[1]; b.appendChild(bt); });
  d.appendChild(s); d.appendChild(b);
  return d;
}

function fill(id, items, emptyText) {
  const c = $(id); c.innerHTML = "";
  if (!items.length) { const e = document.createElement("div"); e.className = "empty"; e.textContent = emptyText; c.appendChild(e); return; }
  items.forEach((i) => c.appendChild(i));
}

function renderFriends() {
  $("fb").textContent = incoming.length ? "Arkadaşlar (" + incoming.length + ")" : "Arkadaşlar";
  fill("fin", incoming.map((r) => li(r.fromNick, [
    ["Kabul et", () => act(() => acceptRequest(r))],
    ["Reddet", () => act(() => deleteDoc(doc(db, "friendRequests", r.id)))]
  ])), "Gelen istek yok.");
  fill("fout", outgoing.map((r) => li(r.toNick || "kullanıcı", [
    ["İptal", () => act(() => deleteDoc(doc(db, "friendRequests", r.id)))]
  ])), "Gönderilen istek yok.");
  fill("fl", friendRooms.map((f) => li(f.n.slice(1), [
    ["Mesaj", () => { openRoom(f); renderRooms(); closeFriends(); }],
    ["Çıkar", () => { if (confirm("Arkadaşlıktan çıkarılsın mı?")) act(() => deleteDoc(doc(db, "friendships", f.pairId))); }]
  ])), "Henüz arkadaşın yok. Yukarıdan takma adla istek gönderebilirsin.");
  renderProfile();
}

async function acceptRequest(r) {
  const sorted = [r.from, user.uid].sort();
  const names = {}; names[r.from] = r.fromNick; names[user.uid] = nick;
  const batch = writeBatch(db);
  batch.set(doc(db, "friendships", sorted[0] + "_" + sorted[1]), { members: sorted, names: names, createdAt: serverTimestamp() });
  batch.delete(doc(db, "friendRequests", r.id));
  await batch.commit();
  toast(r.fromNick + " ile arkadaş oldunuz.");
}

async function sendRequest(text) {
  const t = text.trim();
  if (!NICK_RE.test(t)) { toast("Geçerli bir takma ad yaz."); return; }
  const snap = await getDoc(doc(db, "nicks", t.toLocaleLowerCase("tr")));
  if (!snap.exists()) { toast("Bu takma adla bir kullanıcı bulunamadı."); return; }
  const other = snap.data().uid;
  if (other === user.uid) { toast("Kendini ekleyemezsin."); return; }
  if (friendRooms.some((f) => f.other === other)) { toast("Zaten arkadaşsınız."); return; }
  if (outgoing.some((r) => r.to === other)) { toast("İstek zaten gönderilmiş."); return; }
  const inc = incoming.find((r) => r.from === other);
  if (inc) { await acceptRequest(inc); return; }
  await requestUser(other, t);
}

async function requestUser(uid, nm) {
  if (uid === user.uid) return;
  await setDoc(doc(db, "friendRequests", user.uid + "_" + uid), { from: user.uid, to: uid, fromNick: nick, toNick: nm, createdAt: serverTimestamp() });
  toast("İstek gönderildi.");
}

/* ---------- Profil kartı: avatara ya da ada dokununca ---------- */
const styleEl = document.createElement("style");
styleEl.textContent = ".pcard{max-width:340px;text-align:center}.pcard .av{width:64px;height:64px;font-size:30px;margin:0 auto 8px}.pcard h2{margin:0;font:700 26px/1 var(--head)}.pbtns{display:flex;gap:8px;margin-top:14px}.pbtns button{flex:1}.sheet .pbtns #pa{background:var(--lamp);color:var(--lamp-ink);border:0;font-weight:600}.row .av,.row:not(.mine) .who{cursor:pointer}";
document.head.appendChild(styleEl);
const ppEl = document.createElement("div");
ppEl.className = "panel"; ppEl.id = "pp"; ppEl.hidden = true;
ppEl.innerHTML = '<div class="sheet pcard"><div class="av" id="pav"></div><h2 id="pn"></h2><p class="empty" id="ps"></p><div class="pbtns"><button id="pa" type="button"></button><button id="px" type="button">Kapat</button></div><div class="pbtns"><button id="pr" type="button" hidden>Resmi kaldır</button></div></div>';
document.body.appendChild(ppEl);

const pbEl = document.createElement("button");
pbEl.id = "pb"; pbEl.textContent = "Profil resmim";
$("fb").parentNode.insertBefore(pbEl, $("fb"));
pbEl.onclick = () => openProfile(user.uid, nick);

function openProfile(uid, nm) {
  profile = { uid: uid, nm: nm };
  $("pp").hidden = false;
  renderProfile();
}
function closeProfile() { $("pp").hidden = true; profile = null; }
$("px").onclick = closeProfile;
$("pp").onclick = (e) => { if (e.target === $("pp")) closeProfile(); };

function renderProfile() {
  if (!profile || $("pp").hidden) return;
  const uid = profile.uid, nm = profile.nm;
  $("pav").dataset.av = uid; $("pav").dataset.nm = nm;
  paintAv($("pav"), uid, nm);
  loadAv(uid);
  $("pn").textContent = nm;
  const fr = friendRooms.find((f) => f.other === uid);
  const inc = incoming.find((r) => r.from === uid);
  const out = outgoing.find((r) => r.to === uid);
  const b = $("pa");
  $("pr").hidden = true;
  if (uid === user.uid) {
    $("ps").textContent = hasAv(uid) ? "Bu sensin" : "Bu sensin. Henüz profil resmin yok.";
    b.textContent = "Profil resmi seç";
    b.onclick = () => pickPhoto(uid);
    $("pr").hidden = !hasAv(uid);
    $("pr").onclick = () => removePhoto(uid);
  } else if (fr) {
    $("ps").textContent = "Arkadaşınız";
    b.textContent = "Özel mesaj gönder";
    b.onclick = () => { openRoom(fr); renderRooms(); closeProfile(); };
  } else if (inc) {
    $("ps").textContent = "Sana arkadaşlık isteği gönderdi";
    b.textContent = "İsteği kabul et";
    b.onclick = () => act(() => acceptRequest(inc));
  } else if (out) {
    $("ps").textContent = "İstek gönderildi, kabul etmesi bekleniyor";
    b.textContent = "İsteği iptal et";
    b.onclick = () => act(() => deleteDoc(doc(db, "friendRequests", out.id)));
  } else {
    $("ps").textContent = "Özel mesaj için önce arkadaş olmanız gerekir";
    b.textContent = "Arkadaş ekle";
    b.onclick = () => act(() => requestUser(uid, nm));
  }
}

function closeFriends() { $("fp").hidden = true; }
$("fb").onclick = () => { $("fp").hidden = false; };
$("fx").onclick = closeFriends;
$("fp").onclick = (e) => { if (e.target === $("fp")) closeFriends(); };
$("ff").onsubmit = (e) => {
  e.preventDefault();
  const v = $("fn").value;
  $("fn").value = "";
  act(() => sendRequest(v));
};

function colorOf(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return "hsl(" + h + ",55%,68%)"; }

function renderChat(forceBottom) {
  const l = $("log");
  l.innerHTML = "";
  const n = document.createElement("div");
  n.className = "note";
  n.textContent = "Sohbet kurallarına uy: hakaret ve kişisel bilgi paylaşımı yok. Bir mesajın altından şikayet edebilir ya da kişiyi engelleyebilirsin.";
  l.appendChild(n);
  if (!msgs.length) {
    const e = document.createElement("div");
    e.className = "note"; e.textContent = "Bu odada henüz mesaj yok. İlk mesajı sen yaz.";
    l.appendChild(e);
  }
  msgs.forEach((m) => {
    if (blocked.has(m.uid)) return;
    const mine = user && m.uid === user.uid;
    const row = document.createElement("div"); row.className = "row" + (mine ? " mine" : "");
    const av = document.createElement("div"); av.className = "av";
    av.dataset.av = m.uid; av.dataset.nm = m.nick || "";
    paintAv(av, m.uid, m.nick); loadAv(m.uid);
    const d = document.createElement("div"); d.className = "msg";
    const w = document.createElement("div"); w.className = "who"; w.textContent = m.nick;
    const t = document.createElement("span"); t.textContent = m.at.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    w.appendChild(t);
    const p = document.createElement("p"); p.textContent = m.text;
    d.appendChild(w); if (m.text) d.appendChild(p); if (m.img) addPhoto(d, m.img);
    if (mine) av.onclick = () => openProfile(user.uid, nick);
    if (!mine) {
      av.onclick = () => openProfile(m.uid, m.nick);
      w.onclick = () => openProfile(m.uid, m.nick);
      const a = document.createElement("div"); a.className = "acts";
      const r = document.createElement("button"); r.textContent = "Şikayet et";
      r.onclick = async () => {
        r.disabled = true;
        try {
          await addDoc(collection(db, "reports"), { reporter: user.uid, room: room.id, msgId: m.id, msgUid: m.uid, createdAt: serverTimestamp() });
          r.textContent = "Şikayet edildi";
        } catch (e) { r.disabled = false; toast(errText(e)); }
      };
      const b = document.createElement("button"); b.textContent = "Engelle";
      b.onclick = async () => {
        try { await setDoc(doc(db, "users", user.uid, "blocks", m.uid), { createdAt: serverTimestamp() }); toast(m.nick + " engellendi."); }
        catch (e) { toast(errText(e)); }
      };
      a.appendChild(r); a.appendChild(b); d.appendChild(a);
    }
    row.appendChild(av); row.appendChild(d); l.appendChild(row);
  });
  if (forceBottom) l.scrollTop = l.scrollHeight;
}

$("sf").onsubmit = async (e) => {
  e.preventDefault();
  const t = $("in").value.trim();
  if (!t || !user) return;
  if (Date.now() - lastSend < 1000) { toast("Biraz yavaş yaz."); return; }
  lastSend = Date.now();
  $("in").value = "";
  try {
    await addDoc(msgCol(room), { uid: user.uid, nick: nick, text: t, createdAt: serverTimestamp() });
  } catch (err) {
    $("in").value = t;
    toast("Mesaj gönderilemedi. " + errText(err));
  }
};

$("unb").onclick = async () => {
  try {
    const s = await getDocs(collection(db, "users", user.uid, "blocks"));
    await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
    toast("Engeller kaldırıldı.");
  } catch (e) { toast(errText(e)); }
};

let tt;
function toast(m) {
  const t = $("toast"); t.textContent = m; t.hidden = false;
  clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 3200);
}
