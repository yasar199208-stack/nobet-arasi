import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { ROOMS } from "./rooms.js?v=2";

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

// Yeni mesaj sesi + titreşim + konuşma (uygulama açıkken)
let ac = null;
function audio() {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
  } catch (e) {}
}
document.addEventListener("pointerdown", audio, { once: true });

// Yedek konuşma: mesaj.mp3 çalmazsa telefonun Türkçe sesi
let voices = [];
function loadVoices() {
  try { voices = speechSynthesis.getVoices() || []; } catch (e) {}
}
if ("speechSynthesis" in window) {
  loadVoices();
  try { speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
  document.addEventListener("pointerdown", () => { loadVoices(); try { speechSynthesis.resume(); } catch (e) {} }, { once: true });
}
function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    loadVoices();
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find((x) => /^tr/i.test(x.lang));
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = "tr-TR"; }
    u.volume = 1; u.rate = 1; u.pitch = 1;
    speechSynthesis.resume();
    speechSynthesis.speak(u);
  } catch (e) {}
}

// Asıl ses: siteye yüklenen mesaj.mp3 (herkeste aynı). Çalmazsa yedek konuşma.
function say(text) {
  try {
    const a = new Audio("mesaj.mp3?v=1");
    a.volume = 1;
    a.onerror = () => speak(text);
    const p = a.play();
    if (p && p.catch) p.catch(() => speak(text));
  } catch (e) { speak(text); }
}

let snd = true;
try { snd = localStorage.getItem("snd") !== "0"; } catch (e) {}
const TONES = {
  bip: { n: "Bip", w: "square", v: 0.45, d: 0.16, s: [[880, 0], [1175, 0.16]] },
  zil: { n: "Zil", w: "square", v: 0.4, d: 0.11, s: [[1319, 0], [1568, 0.13], [1319, 0.26], [1568, 0.39], [1319, 0.52], [1568, 0.65]] },
  melodi: { n: "Melodi", w: "triangle", v: 0.9, d: 0.22, s: [[523, 0], [659, 0.2], [784, 0.4], [1047, 0.6], [784, 0.9], [1047, 1.1]] },
  sesli: { n: "Sesli", w: "square", v: 0.4, d: 0.12, s: [[1175, 0], [1568, 0.13]], say: "Mesaj geldi, baksana" }
};
let tone = "sesli";
try { const k = localStorage.getItem("tone"); if (k && TONES[k]) tone = k; } catch (e) {}
let lastDing = 0;
function ding(force) {
  if (!snd && !force) return;
  // Aynı anda birçok odadan mesaj gelirse üst üste çalmasın
  const now = Date.now();
  if (!force && now - lastDing < 2500) return;
  lastDing = now;
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]); } catch (e) {}
  const T = TONES[tone] || TONES.sesli;
  try {
    audio();
    if (ac) {
      const t0 = ac.currentTime + 0.02;
      T.s.forEach((nt) => {
        const o = ac.createOscillator(), g = ac.createGain(), t = t0 + nt[1];
        o.type = T.w;
        o.frequency.setValueAtTime(nt[0], t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(T.v, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + T.d);
        o.connect(g); g.connect(ac.destination);
        o.start(t); o.stop(t + T.d + 0.05);
      });
    }
  } catch (e) {}
  if (T.say) setTimeout(() => say(T.say), 300);
}

// Tüm herkese açık odalardaki yeni mesaj sesi
let pubSubs = [];
function watchAll() {
  pubSubs.forEach((u) => u());
  pubSubs = [];
  ROOMS.forEach((r) => {
    let ready = false, prev = 0;
    const un = onSnapshot(query(collection(db, "rooms", r.id, "messages"), orderBy("createdAt", "desc"), limit(1)), (s) => {
      const d = s.docs[0];
      if (!d) { ready = true; return; }
      const x = d.data({ serverTimestamps: "estimate" });
      const at = x.createdAt ? x.createdAt.toMillis() : Date.now();
      if (ready && !s.metadata.fromCache && !s.metadata.hasPendingWrites && x.uid !== uid && at > prev) ding();
      prev = at; ready = true;
    }, () => {});
    pubSubs.push(un);
  });
}

// 🔔 Ses düğmesi: dokununca ses çalar, ikinci dokunuşta açıp kapatır
function sndBtn() {
  const out = $("out");
  if (!out || $("snd")) return;
  const b = document.createElement("button");
  b.id = "snd"; b.type = "button";
  const label = () => { b.textContent = snd ? "🔔 Ses açık" : "🔕 Ses kapalı"; };
  label();
  b.onclick = () => {
    snd = !snd;
    try { localStorage.setItem("snd", snd ? "1" : "0"); } catch (e) {}
    label();
    if (snd) ding(true);
  };
  out.parentNode.insertBefore(b, out);
  const tb = document.createElement("button");
  tb.id = "tone"; tb.type = "button";
  const tl = () => { tb.textContent = "🎵 " + TONES[tone].n; };
  tl();
  tb.onclick = () => {
    const ks = Object.keys(TONES);
    tone = ks[(ks.indexOf(tone) + 1) % ks.length];
    try { localStorage.setItem("tone", tone); } catch (e) {}
    tl();
    ding(true);
  };
  out.parentNode.insertBefore(tb, out);
}
sndBtn();

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
  pubSubs.forEach((u) => u());
  pubSubs = [];
  subs = {}; rooms = {}; last = {}; seen = {}; uid = null;
  document.title = TITLE;
}

function start(u, tries) {
  uid = u.uid;
  if (!tries) { load(); watchAll(); }
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
