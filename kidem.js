// 🎂 Meslek yılı rozeti: Hakkımda'daki yıl bilgisine göre ismin yanında ⭐ 5+, 🎖️ 10+, 🏆 20+ yıl
import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

for (let i = 0; i < 150 && !getApps().length; i++) await new Promise((r) => setTimeout(r, 200));
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);

const TIERS = [
  [20, "🏆", "Usta"],
  [10, "🎖️", "Kıdemli"],
  [5, "⭐", "Deneyimli"]
];
const cache = new Map(); // uid -> { y: sayı | null, t, p }
let me = null;

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

function tier(y) {
  if (typeof y !== "number") return null;
  for (const x of TIERS) if (y >= x[0]) return x;
  return null;
}

function load(uid) {
  const c = cache.get(uid);
  const ttl = me && uid === me.uid ? 30 * 1000 : 5 * 60 * 1000;
  if (c && (c.p || Date.now() - c.t < ttl)) return c.p || Promise.resolve(c.y);
  const old = c ? c.y : null;
  const p = getDoc(doc(db, "about", uid)).then((s) => {
    const y = s.exists() && typeof s.data().yil === "number" ? s.data().yil : null;
    cache.set(uid, { y: y, t: Date.now() });
    return y;
  }).catch(() => {
    cache.set(uid, { y: old, t: Date.now() });
    return old;
  });
  cache.set(uid, { y: old, t: c ? c.t : 0, p: p });
  return p;
}

const st = document.createElement("style");
st.textContent = ".kd-b{margin-left:5px;font-size:13px;cursor:pointer;filter:drop-shadow(0 0 3px rgba(240,194,75,.5))}";
document.head.appendChild(st);

function paint(b) {
  const c = cache.get(b.dataset.u);
  const tr = c ? tier(c.y) : null;
  if (tr) { b.textContent = tr[1]; b.title = tr[2] + " · " + c.y + " yıllık"; b.hidden = false; }
  else { b.textContent = ""; b.hidden = true; }
}

function decorateRow(row) {
  if (!row.classList || !row.classList.contains("row") || row.querySelector(".kd-b")) return;
  const av = row.querySelector(".av"), who = row.querySelector(".who");
  if (!av || !who || !av.dataset.av) return;
  const uid = av.dataset.av;
  const b = el("span", "kd-b");
  b.dataset.u = uid;
  b.hidden = true;
  b.onclick = (e) => {
    e.stopPropagation();
    const c = cache.get(uid), tr = c ? tier(c.y) : null;
    if (tr) toast(tr[1] + " " + tr[2] + " · " + c.y + " yıllık güvenlikçi");
  };
  const first = who.firstChild;
  if (first && first.nextSibling) who.insertBefore(b, first.nextSibling); else who.appendChild(b);
  const c = cache.get(uid);
  if (c && !c.p) paint(b);
  load(uid).then(() => { if (b.isConnected) paint(b); });
}

function decorateLog() {
  const l = $("log");
  if (!l) return;
  l.querySelectorAll(".row").forEach(decorateRow);
}

let wired = false;
function wire() {
  if (wired) return;
  const l = $("log");
  if (!l) return;
  wired = true;
  let q = false;
  new MutationObserver(() => {
    if (q) return;
    q = true;
    requestAnimationFrame(() => { q = false; decorateLog(); });
  }).observe(l, { childList: true });
  decorateLog();
}

onAuthStateChanged(auth, (u) => {
  me = u;
  if (!u) cache.clear();
});

// Hakkımda kaydedilince kendi rozetin hemen güncellensin
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!me || !t || !t.classList || !(t.classList.contains("ab-ok") || t.classList.contains("ab-del"))) return;
  setTimeout(() => {
    cache.delete(me.uid);
    load(me.uid).then(() => document.querySelectorAll('.kd-b[data-u="' + me.uid + '"]').forEach(paint));
  }, 2000);
}, true);

setInterval(wire, 1500);
wire();
