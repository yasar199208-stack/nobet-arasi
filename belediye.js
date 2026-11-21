import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ROOMS } from "./rooms.js?v=2";

// Belediye Güvenlik bölümü: yalnızca doğru kodu bilenler görür. Denetimi Firestore kuralları yapar.
// Odalar, diğer odalarla aynı sohbet koduyla çalışır (fotoğraf, GIF, video, şikayet, arkadaş ekleme hepsi var).
let auth, db;
const $ = (i) => document.getElementById(i);
const MUNI = [
  { id: "bel_genel", ic: "🏛️", n: "Belediye Genel", d: "Sadece belediye çalışanı güvenlikler" },
  { id: "bel_gece", ic: "🏛️", n: "Belediye Gece vardiyası", d: "Belediye güvenliği: gece nöbeti, uykusuzluk, soğuk" },
  { id: "bel_maas", ic: "🏛️", n: "Belediye Maaş ve haklar", d: "Belediye güvenliği: maaş, fazla mesai, izin, sözleşme" },
  { id: "bel_moral", ic: "🏛️", n: "Belediye Moral köşesi", d: "Belediye güvenliği: dertleş, rahatla, destek ol" }
];
let user = null, nick = "", isAdm = false, member = false, btn = null;

function toast(m) {
  const t = $("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 4000);
}
function rerender() { const q = $("q"); if (q) q.dispatchEvent(new Event("input")); }

// Üye olunca Belediye odaları ana oda listesine eklenir (genel odaların hemen arkasına)
function enable() {
  if (ROOMS.some((r) => r.id === MUNI[0].id)) return;
  ROOMS.splice(3, 0, ...MUNI);
  rerender();
}
function disable() {
  for (let i = ROOMS.length - 1; i >= 0; i--) if (/^bel_/.test(ROOMS[i].id)) ROOMS.splice(i, 1);
  rerender();
}
async function probe() {
  try { await getDocs(query(collection(db, "rooms", "bel_genel", "messages"), limit(1))); return true; }
  catch (e) { return false; }
}
async function join() {
  member = await probe();
  if (member) enable();
  return member;
}

function openRoom(r) {
  const want = r.ic + " " + r.n;
  const b = Array.from(document.querySelectorAll("#rooms .room b")).find((x) => x.textContent === want);
  if (b && b.parentNode) b.parentNode.click();
}

async function open() {
  try {
    const m = await import("./belediye-ui.js?v=1");
    m.openPanel({ db: db, rooms: MUNI, toast: toast, join: join, openRoom: openRoom,
      isAdm: () => isAdm, member: () => member, uid: () => user.uid, nick: () => nick });
  } catch (e) { toast("Bölüm açılamadı. Sayfayı yenile."); }
}

function mount() {
  const h = $("rooms");
  if (!h || !user) return;
  if (!btn) {
    btn = document.createElement("button");
    btn.className = "room muni"; btn.type = "button";
    const b = document.createElement("b"); b.textContent = "🏛️ Belediye Güvenlik";
    const s = document.createElement("span"); s.textContent = "Sadece belediye çalışanı güvenlikler";
    btn.appendChild(b); btn.appendChild(s);
    btn.onclick = open;
  }
  if (h.firstChild !== btn) h.insertBefore(btn, h.firstChild);
}

async function start(u) {
  user = u;
  try { const s = await getDoc(doc(db, "users", u.uid)); nick = s.exists() ? s.data().nick : ""; } catch (e) {}
  try { const s = await getDoc(doc(db, "config", "admin")); isAdm = s.exists() && s.data().uid === u.uid; } catch (e) { isAdm = false; }
  mount();
  if (!(await join())) disable();
}

function init() {
  const h = $("rooms");
  if (h) new MutationObserver(mount).observe(h, { childList: true });
  onAuthStateChanged(auth, (u) => {
    if (!u) { user = null; nick = ""; isAdm = false; member = false; disable(); if (btn) btn.remove(); return; }
    start(u);
  });
}

// Uygulama Firebase'i başlatana kadar bekle, sonra başla
function boot() {
  if (!getApps().length) { setTimeout(boot, 200); return; }
  auth = getAuth(); db = getFirestore();
  init();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
