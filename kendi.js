// ✏️ Kendi mesajın: herkes kendi gönderdiği mesajı silebilir (yazı, foto, ses) ve yazıyı düzeltebilir.
import { doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { isBad } from "./filter.js?v=3";

let C = null, panel = null, ta = null, info = null, target = null, saving = false;

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

export function initOwn(ctx) {
  C = ctx;
  if (document.getElementById("own-edit")) return;
  const st = document.createElement("style");
  st.textContent =
    ".own-ed{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.55);display:grid;place-items:center;padding:16px}" +
    ".own-ed .own-box{width:100%;max-width:440px;background:var(--panel);border:1px solid var(--line);border-top:3px solid var(--lamp);border-radius:12px;padding:16px}" +
    ".own-ed h3{margin:0 0 10px;font:700 22px var(--head)}" +
    ".own-ed textarea{width:100%;min-height:110px;resize:vertical;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font:16px/1.4 var(--body)}" +
    ".own-ed .own-info{color:var(--mute);font-size:13px;margin-top:4px;min-height:18px}" +
    ".own-ed .own-btns{display:flex;gap:8px;margin-top:12px}" +
    ".own-ed .own-btns button{flex:1;border-radius:10px;padding:10px;cursor:pointer;font-weight:700;font-size:15px}" +
    ".own-ed .own-no{background:none;border:1px solid var(--line);color:var(--text)}" +
    ".own-ed .own-ok{background:var(--lamp);color:var(--lamp-ink);border:0}" +
    ".own-tag{color:var(--mute);font-size:11px;margin-left:6px;font-weight:400;font-style:italic}";
  document.head.appendChild(st);

  panel = el("div", "own-ed");
  panel.id = "own-edit";
  panel.hidden = true;
  const box = el("div", "own-box");
  const h = el("h3", "", "✏️ Mesajı düzelt");
  ta = document.createElement("textarea");
  ta.maxLength = 400;
  ta.setAttribute("aria-label", "Mesajın yeni hali");
  info = el("div", "own-info", "");
  const btns = el("div", "own-btns");
  const no = el("button", "own-no", "Vazgeç"); no.type = "button";
  const ok = el("button", "own-ok", "Kaydet"); ok.type = "button";
  btns.appendChild(no); btns.appendChild(ok);
  box.appendChild(h); box.appendChild(ta); box.appendChild(info); box.appendChild(btns);
  panel.appendChild(box);
  document.body.appendChild(panel);

  ta.oninput = () => { info.textContent = ta.value.length + " / 400"; };
  no.onclick = closeEdit;
  panel.onclick = (e) => { if (e.target === panel) closeEdit(); };
  ok.onclick = saveEdit;
}

function closeEdit() {
  if (!panel) return;
  panel.hidden = true;
  target = null;
}

function openEdit(m, room) {
  target = { id: m.id, room: room, old: m.text || "" };
  ta.value = m.text || "";
  info.textContent = ta.value.length + " / 400";
  panel.hidden = false;
  setTimeout(() => { try { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {} }, 50);
}

async function saveEdit() {
  if (!target || saving) return;
  const t = ta.value.trim();
  if (!t) { info.textContent = "Mesaj boş olamaz. Silmek istiyorsan 🗑️ Sil'i kullan."; return; }
  if (t === target.old) { closeEdit(); return; }
  if (isBad(t)) { info.textContent = "Mesajında uygunsuz ifade var, kaydedilmedi."; return; }
  saving = true;
  try {
    await updateDoc(doc(C.msgCol(target.room), target.id), { text: t, edited: true });
    C.toast("Mesaj düzeltildi ✅");
    closeEdit();
  } catch (e) {
    info.textContent = e && e.code === "permission-denied" ? "İşlem reddedildi. Firestore kurallarını güncelledin mi?" : "Kaydedilemedi, tekrar dene.";
  }
  saving = false;
}

// Kendi mesajının altına ✏️ Düzelt (sadece yazılı mesajlarda) ve 🗑️ Sil ekler
export function addOwnActs(msgEl, m, room) {
  if (!C || !m || !m.id) return;
  let a = msgEl.querySelector(".acts");
  if (!a) { a = el("div", "acts"); msgEl.appendChild(a); }
  if (m.text && !m.img && !m.aud) {
    const e = el("button", "", "✏️ Düzelt");
    e.type = "button";
    e.onclick = () => openEdit(m, room);
    a.appendChild(e);
  }
  const x = el("button", "", "🗑️ Sil");
  x.type = "button";
  x.onclick = async () => {
    const what = m.aud ? "Bu sesli mesaj" : m.img ? "Bu fotoğraf" : "Bu mesaj";
    if (!confirm(what + " herkes için silinsin mi?")) return;
    x.disabled = true;
    try {
      await deleteDoc(doc(C.msgCol(room), m.id));
      C.toast("Silindi.");
    } catch (e) {
      x.disabled = false;
      C.toast(e && e.code === "permission-denied" ? "İşlem reddedildi. Firestore kurallarını güncelledin mi?" : "Silinemedi.");
    }
  };
  a.appendChild(x);
}

// Zamanın yanına "düzenlendi" yazısı
export function editedTag() {
  return el("span", "own-tag", "düzenlendi");
}
