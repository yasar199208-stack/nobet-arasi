import { doc, getDoc, deleteDoc, collection, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Yönetici: config/admin belgesindeki uid ile giriş yapan hesap.
let C = null, on = false, btn = null, panel = null, listEl = null, unsub = null;

export function isAdmin() { return on; }

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

export function initAdmin(ctx) {
  C = ctx;
  const st = document.createElement("style");
  st.textContent = ".rep{padding:10px 0;border-bottom:1px solid var(--line)}.rep small{color:var(--mute)}.rep p{margin:4px 0 8px;overflow-wrap:anywhere}.rep div{display:flex;gap:8px;flex-wrap:wrap}";
  document.head.appendChild(st);
  btn = el("button", "", "🛡️ Şikayetler");
  btn.hidden = true;
  const fb = document.getElementById("fb");
  fb.parentNode.insertBefore(btn, fb);
  btn.onclick = openPanel;
}

function stopPanel() {
  if (unsub) { unsub(); unsub = null; }
  if (panel) panel.hidden = true;
}

export function resetAdmin() {
  on = false;
  if (btn) btn.hidden = true;
  stopPanel();
}

export async function loadAdmin() {
  on = false;
  try {
    const s = await getDoc(doc(C.db, "config", "admin"));
    on = s.exists() && s.data().uid === C.user().uid;
  } catch (e) { on = false; }
  btn.hidden = !on;
  if (!on) stopPanel();
  C.refresh();
}

export function addAdminDelete(msgEl, m, room) {
  let a = msgEl.querySelector(".acts");
  if (!a) { a = el("div", "acts"); msgEl.appendChild(a); }
  const x = el("button", "", "🗑️ Sil");
  x.onclick = async () => {
    if (!confirm("Bu mesaj herkes için silinsin mi?")) return;
    try {
      await deleteDoc(doc(C.db, "rooms", room.id, "messages", m.id));
      C.toast("Mesaj silindi.");
    } catch (e) { C.toast("Silinemedi."); }
  };
  a.appendChild(x);
}

function openPanel() {
  if (!panel) {
    panel = el("div", "panel");
    panel.hidden = true;
    const sheet = el("div", "sheet");
    const head = el("div", "sh");
    head.appendChild(el("h2", "", "Şikayetler"));
    const x = el("button", "", "Kapat");
    x.type = "button";
    x.onclick = stopPanel;
    head.appendChild(x);
    listEl = el("div");
    sheet.appendChild(head); sheet.appendChild(listEl);
    panel.appendChild(sheet);
    panel.onclick = (e) => { if (e.target === panel) stopPanel(); };
    document.body.appendChild(panel);
  }
  panel.hidden = false;
  if (unsub) unsub();
  unsub = onSnapshot(query(collection(C.db, "reports"), orderBy("createdAt", "desc"), limit(30)), (s) => {
    listEl.innerHTML = "";
    if (s.empty) { listEl.appendChild(el("div", "empty", "Şikayet yok.")); return; }
    s.docs.forEach((d) => renderReport(d));
  }, () => C.toast("Şikayetler okunamadı. Kuralları güncelledin mi?"));
}

function renderReport(d) {
  const r = d.data();
  const rm = C.rooms.find((x) => x.id === r.room);
  const item = el("div", "rep");
  const when = r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toLocaleString("tr-TR") : "";
  item.appendChild(el("small", "", (rm ? rm.ic + " " + rm.n : "Özel sohbet") + " · " + when));
  const p = el("p", "", rm ? "Yükleniyor…" : "Özel mesaj şikayeti (içerik gizlidir).");
  item.appendChild(p);
  const row = el("div");
  const close = el("button", "", "Şikayeti kapat");
  close.type = "button";
  close.onclick = () => deleteDoc(d.ref).catch(() => C.toast("Kapatılamadı."));
  if (rm) {
    const ref = doc(C.db, "rooms", r.room, "messages", r.msgId);
    getDoc(ref).then((m) => {
      if (!m.exists()) { p.textContent = "(mesaj zaten silinmiş)"; return; }
      const x = m.data();
      p.textContent = x.nick + ": " + (x.text || "[fotoğraf]");
      const del = el("button", "", "🗑️ Mesajı sil");
      del.type = "button";
      del.onclick = async () => {
        try { await deleteDoc(ref); await deleteDoc(d.ref); C.toast("Mesaj silindi."); }
        catch (e) { C.toast("Silinemedi."); }
      };
      row.insertBefore(del, close);
    }).catch(() => { p.textContent = "(mesaj okunamadı)"; });
  }
  row.appendChild(close);
  item.appendChild(row);
  listEl.appendChild(item);
}
