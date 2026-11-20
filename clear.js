import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, getDoc, getDocs, deleteDoc, doc, writeBatch, collection, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ROOMS } from "./rooms.js?v=2";

// Menü'ye iki düğme ekler:
// 1) Bu sohbeti bende temizle: mesajlar sadece bu telefonda gizlenir.
// 2) Tüm mesajlarımı sil: kendi yazdığın mesajlar sunucudan silinir.
// 3) Sadece yönetici: oda ya da özel mesajların hepsini siler.
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);
let busy = false;

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

function toast(m, ms) {
  const t = $("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, ms || 4500);
}

/* ---------- 1) Sadece bende temizle ---------- */
function chatKey() {
  const t = $("rt");
  const n = t ? t.textContent.trim() : "";
  return n ? "nb_clr:" + n : "";
}

function readSigs(k) {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; }
}

function writeSigs(k, a) {
  try { localStorage.setItem(k, JSON.stringify(a.slice(-400))); } catch (e) {}
}

function sig(row) {
  const w = row.querySelector(".who");
  const p = row.querySelector(".msg p");
  const im = row.querySelector(".msg img");
  const src = im ? (im.getAttribute("src") || "") : "";
  return (w ? w.textContent : "") + "|" + (p ? p.textContent : "") + "|" + src.length + ":" + src.slice(0, 48) + src.slice(-24);
}

function applyHide() {
  const k = chatKey();
  const log = $("log");
  if (!k || !log) return;
  const have = readSigs(k);
  if (!have.length) return;
  const set = new Set(have);
  log.querySelectorAll(".row").forEach((r) => {
    if (set.has(sig(r))) r.style.display = "none";
  });
}

function clearHere() {
  const k = chatKey();
  const log = $("log");
  if (!k || !log) { toast("Önce bir sohbet aç."); return; }
  if (!confirm("Bu sohbetteki mesajlar sadece bu telefonda gizlenecek. Karşı tarafta ve sunucuda kalır. Devam edilsin mi?")) return;
  const all = readSigs(k);
  log.querySelectorAll(".row").forEach((r) => { all.push(sig(r)); });
  writeSigs(k, all);
  applyHide();
  toast("Sohbet bu telefonda temizlendi.");
}

/* ---------- 2) Tüm mesajlarımı sil ---------- */
async function delDocs(docs) {
  let n = 0, denied = false;
  for (let i = 0; i < docs.length; i += 25) {
    const part = docs.slice(i, i + 25);
    const rs = await Promise.all(part.map((d) => deleteDoc(d.ref).then(() => 1, (e) => (e && e.code === "permission-denied" ? -1 : 0))));
    rs.forEach((x) => { if (x > 0) n++; else if (x < 0) denied = true; });
    if (denied) break;
  }
  return { n: n, denied: denied };
}

async function deleteMine() {
  const user = auth.currentUser;
  if (!user) { toast("Önce giriş yap."); return; }
  if (busy) return;
  if (!confirm("Özel sohbetlerde yazdığın TÜM mesajlar herkesten kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?")) return;
  if (!confirm("Son uyarı: silinen mesajlar geri getirilemez. Gerçekten silinsin mi?")) return;
  busy = true;
  toast("Mesajların siliniyor, bekle…", 60000);
  const uid = user.uid;
  let total = 0, roomsDenied = false, failed = false;
  try {
    const fr = await getDocs(query(collection(db, "friendships"), where("members", "array-contains", uid)));
    for (const f of fr.docs) {
      const ms = await getDocs(query(collection(db, "dms", f.id, "messages"), where("uid", "==", uid)));
      const r = await delDocs(ms.docs);
      total += r.n;
      if (r.denied) failed = true;
    }
  } catch (e) { failed = true; }
  // Herkese açık odalar: kuralların izin verdiği kadarını siler
  for (let i = 0; i < ROOMS.length && !roomsDenied; i += 12) {
    const part = ROOMS.slice(i, i + 12);
    const rs = await Promise.all(part.map(async (r) => {
      try {
        const s = await getDocs(query(collection(db, "rooms", r.id, "messages"), where("uid", "==", uid)));
        if (s.empty) return { n: 0, denied: false };
        return await delDocs(s.docs);
      } catch (e) { return { n: 0, denied: !!(e && e.code === "permission-denied") }; }
    }));
    rs.forEach((x) => { total += x.n; if (x.denied) roomsDenied = true; });
  }
  busy = false;
  let m = total ? total + " mesajın silindi." : "Silinecek mesajın yok.";
  if (roomsDenied) m += " Odalardaki mesajlar silinemedi, onları sadece yönetici silebilir.";
  if (failed) m += " Bazı özel mesajlar silinemedi, tekrar dene.";
  toast(m, 8000);
}

/* ---------- 3) Yönetici: toplu silme ---------- */
let adm = false;

function currentRoom() {
  const t = $("rt");
  const n = t ? t.textContent.trim() : "";
  return ROOMS.find((r) => (r.ic ? r.ic + " " : "") + r.n === n) || null;
}

async function wipeCol(ref) {
  const s = await getDocs(ref);
  for (let i = 0; i < s.docs.length; i += 400) {
    const b = writeBatch(db);
    s.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
    await b.commit();
  }
  return s.docs.length;
}

function sure(what) {
  if (!confirm(what + " kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?")) return false;
  const a = prompt("Onaylamak için SİL yaz:");
  return !!a && a.trim().toLocaleUpperCase("tr") === "SİL";
}

async function adminRun(label, job) {
  if (!adm || busy) return;
  busy = true;
  toast("Siliniyor, bekle…", 120000);
  let n = 0, err = false;
  try { n = await job(); } catch (e) { err = true; }
  busy = false;
  toast(err ? "Silme tamamlanamadı (" + n + " mesaj silindi). Tekrar dene." : label + ": " + n + " mesaj silindi.", 8000);
}

function adminRoom() {
  const r = currentRoom();
  if (!r) { toast("Önce bir oda aç."); return; }
  if (!sure("\"" + r.n + "\" odasındaki tüm mesajlar")) return;
  adminRun(r.n, () => wipeCol(collection(db, "rooms", r.id, "messages")));
}

function adminAllRooms() {
  if (!sure("TÜM odalardaki tüm mesajlar")) return;
  adminRun("Tüm odalar", async () => {
    let n = 0;
    for (let i = 0; i < ROOMS.length; i += 8) {
      const part = await Promise.all(ROOMS.slice(i, i + 8).map((r) => wipeCol(collection(db, "rooms", r.id, "messages"))));
      part.forEach((x) => { n += x; });
    }
    return n;
  });
}

function adminAllDms() {
  if (!sure("TÜM özel sohbetlerdeki tüm mesajlar")) return;
  adminRun("Özel mesajlar", async () => {
    let n = 0;
    const fr = await getDocs(collection(db, "friendships"));
    for (const f of fr.docs) n += await wipeCol(collection(db, "dms", f.id, "messages"));
    return n;
  });
}

/* ---------- Menü'ye ekle ---------- */
let head = null, b1 = null, b2 = null;
let ah = null, a1 = null, a2 = null, a3 = null;

function build() {
  head = el("div", "", "Temizle");
  head.style.cssText = "color:var(--mute);font-size:13px;padding:8px 6px 6px;border-top:1px solid var(--line);margin-top:4px";
  b1 = el("button", "", "🧹 Bu sohbeti bende temizle");
  b1.type = "button";
  b1.onclick = clearHere;
  b2 = el("button", "", "🗑️ Tüm mesajlarımı sil");
  b2.type = "button";
  b2.onclick = deleteMine;
  b2.style.setProperty("color", "var(--danger)", "important");

  ah = el("div", "", "Yönetici");
  ah.style.cssText = head.style.cssText;
  a1 = el("button", "", "🧨 Bu odadaki tüm mesajları sil");
  a1.type = "button";
  a1.onclick = adminRoom;
  a2 = el("button", "", "🧨 Tüm odalardaki mesajları sil");
  a2.type = "button";
  a2.onclick = adminAllRooms;
  a3 = el("button", "", "🧨 Tüm özel mesajları sil");
  a3.type = "button";
  a3.onclick = adminAllDms;
  [a1, a2, a3].forEach((b) => b.style.setProperty("color", "var(--danger)", "important"));
}

function attach() {
  const panel = document.querySelector(".mpanel");
  if (!panel) return;
  if (!head) build();
  const seq = adm ? [head, b1, b2, ah, a1, a2, a3] : [head, b1, b2];
  if (!adm) [ah, a1, a2, a3].forEach((n) => { if (n.parentNode) n.parentNode.removeChild(n); });
  if (panel.lastElementChild !== seq[seq.length - 1] || head.parentNode !== panel) {
    seq.forEach((n) => panel.appendChild(n));
  }
  if (adm) a1.hidden = !currentRoom();
}

onAuthStateChanged(auth, async (u) => {
  adm = false;
  if (u) {
    try {
      const s = await getDoc(doc(db, "config", "admin"));
      adm = s.exists() && s.data().uid === u.uid;
    } catch (e) {}
  }
  attach();
});

attach();
new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });

const log = $("log");
if (log) {
  new MutationObserver(applyHide).observe(log, { childList: true });
  applyHide();
}
