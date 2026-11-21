import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, deleteDoc, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Yönetici için: uygunsuz resim nedeniyle otomatik banlanan kullanıcıları gösterir ve banı kaldırma imkânı verir.
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);
const KEY = "nb_oto_seen";
let chip = null, panel = null, unsub = null, list = [], first = true;

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
  toast.t = setTimeout(() => { t.hidden = true; }, 5000);
}
function seen() { try { return Number(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; } }
function markSeen() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} refresh(); }
function fmt(ms) { return ms ? new Date(ms).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""; }

function ensure() {
  if (chip) return;
  const st = el("style");
  st.textContent = ".otochip{position:fixed;right:8px;top:calc(8px + env(safe-area-inset-top,0px));z-index:20;background:#d9534f;color:#fff;border:0;border-radius:999px;padding:7px 12px;font:700 14px var(--head,sans-serif);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4)}.otot{width:56px;height:56px;object-fit:cover;border-radius:8px;filter:blur(7px);cursor:pointer;flex:none}.otot.on{filter:none}.otoi{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}.otoi b{display:block}.otoi span{color:var(--mute);font-size:13px}.otoi button{margin-left:auto}";
  document.head.appendChild(st);
  chip = el("button", "otochip");
  chip.type = "button"; chip.hidden = true;
  chip.onclick = open;
  document.body.appendChild(chip);
}

function refresh() {
  if (!chip) return;
  const n = list.filter((x) => x.at > seen()).length;
  chip.hidden = n === 0;
  chip.textContent = "🤖 Otomatik ban: " + n + " yeni";
}

function open() {
  if (panel) panel.remove();
  panel = el("div", "panel");
  const sh = el("div", "sheet");
  const head = el("div", "sh");
  head.appendChild(el("h2", "", "🤖 Otomatik banlar"));
  const x = el("button", "", "Kapat"); x.type = "button";
  x.onclick = () => { panel.remove(); panel = null; markSeen(); };
  head.appendChild(x);
  sh.appendChild(head);
  sh.appendChild(el("p", "empty", "Yapay zekâ uygunsuz resim algılayınca kullanıcıyı otomatik banladı. Hata olduğunu düşünürsen banı kaldır."));
  if (!list.length) sh.appendChild(el("div", "empty", "Henüz otomatik ban yok."));
  list.slice().sort((a, b) => b.at - a.at).forEach((it) => {
    const row = el("div", "otoi");
    if (it.thumb) {
      const im = el("img", "otot"); im.src = it.thumb; im.alt = "Önizleme";
      im.onclick = () => im.classList.toggle("on");
      row.appendChild(im);
    }
    const t = el("div");
    t.appendChild(el("b", "", it.nick || "kullanıcı"));
    t.appendChild(el("span", "", fmt(it.at)));
    row.appendChild(t);
    const b = el("button", "", "Banı kaldır"); b.type = "button";
    b.onclick = async () => {
      if (!confirm((it.nick || "Kullanıcı") + " kullanıcısının banı kaldırılsın mı?")) return;
      try { await deleteDoc(doc(db, "bans", it.id)); toast("Ban kaldırıldı."); }
      catch (e) { toast("Ban kaldırılamadı."); }
    };
    row.appendChild(b);
    sh.appendChild(row);
  });
  panel.appendChild(sh);
  document.body.appendChild(panel);
  markSeen();
}

function stop() { if (unsub) { unsub(); unsub = null; } list = []; first = true; if (chip) chip.hidden = true; }

async function start(user) {
  let ok = false;
  try { const s = await getDoc(doc(db, "config", "admin")); ok = s.exists() && s.data().uid === user.uid; } catch (e) {}
  if (!ok) return;
  ensure();
  unsub = onSnapshot(query(collection(db, "bans"), where("reason", "==", "nsfw")), (s) => {
    list = s.docs.map((d) => {
      const x = d.data();
      return { id: d.id, nick: x.nick, thumb: x.thumb || "", at: x.createdAt && x.createdAt.toMillis ? x.createdAt.toMillis() : Date.now() };
    });
    if (!first) {
      s.docChanges().forEach((c) => { if (c.type === "added") toast("🤖 Uygunsuz resim: " + (c.doc.data().nick || "kullanıcı") + " otomatik banlandı."); });
    }
    first = false;
    refresh();
  }, () => {});
}

onAuthStateChanged(auth, (u) => { stop(); if (u) start(u); });
