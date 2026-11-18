import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Okunmamış özel mesaj rozeti: listede 🔴, sekme başlığında (sayı)
const auth = getAuth(), db = getFirestore();
const TITLE = "Nöbet Arası";
let uid = null, rooms = {}, last = {}, seen = {}, subs = {}, unF = null, fresh = false;
const $ = (i) => document.getElementById(i);

function key() { return "seen_" + uid; }
function load() {
  try {
    const v = localStorage.getItem(key());
    fresh = v === null;
    seen = v ? JSON.parse(v) : {};
  } catch (e) { fresh = false; seen = {}; }
}
function save() { try { localStorage.setItem(key(), JSON.stringify(seen)); } catch (e) {} }

function unread(id) {
  const l = last[id];
  return !!l && l.uid !== uid && l.at > (seen[id] || 0);
}

function roomTitle(id) { return "💌 " + rooms[id].n; }

function openId() {
  const t = $("rt") ? $("rt").textContent.trim() : "";
  return Object.keys(rooms).find((id) => roomTitle(id) === t) || null;
}

function markOpen() {
  const id = openId();
  if (!id || document.hidden || !last[id]) return;
  if (seen[id] !== last[id].at) { seen[id] = last[id].at; save(); }
}

function decorate() {
  const box = $("rooms");
  if (!box) return;
  box.querySelectorAll(".ud").forEach((e) => e.remove());
  box.querySelectorAll("button.room").forEach((b) => {
    const el = b.querySelector("b");
    if (!el) return;
    const id = Object.keys(rooms).find((k) => roomTitle(k) === el.textContent);
    if (id && unread(id)) {
      const d = document.createElement("span");
      d.className = "ud";
      d.textContent = " 🔴";
      el.appendChild(d);
    }
  });
}

function paint() {
  const n = Object.keys(rooms).filter(unread).length;
  document.title = n ? "(" + n + ") " + TITLE : TITLE;
  decorate();
}

// Yeni özel mesaj sesi + titreşim (uygulama açıkken)
let ac = null;
function audio() {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
  } catch (e) {}
}
document.addEventListener("pointerdown", audio, { once: true });
function ding() {
  try { if (navigator.vibrate) navigator.vibrate([120, 60, 120]); } catch (e) {}
  try {
    audio();
    if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, t);
    o.frequency.setValueAtTime(1175, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + 0.4);
  } catch (e) {}
}

function watch(id, pairId) {
  let ready = false;
  subs[id] = onSnapshot(query(collection(db, "dms", pairId, "messages"), orderBy("createdAt", "desc"), limit(1)), (s) => {
    const d = s.docs[0];
    if (!d) { delete last[id]; paint(); return; }
    const x = d.data({ serverTimestamps: "estimate" });
    const prev = last[id];
    last[id] = { uid: x.uid, at: x.createdAt ? x.createdAt.toMillis() : Date.now() };
    if (ready && !s.metadata.fromCache && !s.metadata.hasPendingWrites && x.uid !== uid && (!prev || last[id].at > prev.at)) ding();
    ready = true;
    if (fresh && seen[id] === undefined) { seen[id] = last[id].at; save(); }
    markOpen();
    paint();
  }, () => {});
}

function stop() {
  if (unF) unF();
  unF = null;
  Object.keys(subs).forEach((id) => subs[id]());
  subs = {}; rooms = {}; last = {}; seen = {}; uid = null;
  document.title = TITLE;
}

function start(u, tries) {
  uid = u.uid;
  if (!tries) load();
  unF = onSnapshot(query(collection(db, "friendships"), where("members", "array-contains", uid)), (s) => {
    const next = {};
    s.docs.forEach((d) => {
      const x = d.data();
      const other = x.members[0] === uid ? x.members[1] : x.members[0];
      next["dm_" + d.id] = { pairId: d.id, n: "@" + ((x.names && x.names[other]) || "arkadaş") };
    });
    Object.keys(subs).forEach((id) => {
      if (!next[id]) { subs[id](); delete subs[id]; delete last[id]; }
    });
    rooms = next;
    Object.keys(next).forEach((id) => { if (!subs[id]) watch(id, next[id].pairId); });
    markOpen();
    paint();
  }, () => {
    // Yeni kayıtta profil henüz yokken izin hatası olabilir; kısa süre sonra tekrar dene.
    unF = null;
    const n = (tries || 0) + 1;
    if (n <= 5) setTimeout(() => { if (uid === u.uid && !unF) start(u, n); }, 3000);
  });
}

onAuthStateChanged(auth, (u) => { stop(); if (u) start(u, 0); });

if ($("rooms")) new MutationObserver(decorate).observe($("rooms"), { childList: true });
if ($("rt")) new MutationObserver(() => { markOpen(); paint(); }).observe($("rt"), { childList: true, characterData: true, subtree: true });
document.addEventListener("visibilitychange", () => { markOpen(); paint(); });
