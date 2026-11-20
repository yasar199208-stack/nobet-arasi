import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, getDocs, deleteDoc, collection, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ROOMS } from "./rooms.js?v=2";

// Menü'ye iki düğme ekler:
// 1) Bu sohbeti bende temizle: mesajlar sadece bu telefonda gizlenir.
// 2) Tüm mesajlarımı sil: kendi yazdığın mesajlar sunucudan silinir.
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

/* ---------- Menü'ye ekle ---------- */
let head = null, b1 = null, b2 = null;

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
}

function attach() {
  const panel = document.querySelector(".mpanel");
  if (!panel) return;
  if (!head) build();
  const last = panel.lastElementChild;
  if (last !== b2 || head.parentNode !== panel) {
    panel.appendChild(head);
    panel.appendChild(b1);
    panel.appendChild(b2);
  }
}

attach();
new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });

const log = $("log");
if (log) {
  new MutationObserver(applyHide).observe(log, { childList: true });
  applyHide();
}
