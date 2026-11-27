// 📌 Sabit mesaj (oda: yönetici, özel sohbet: iki taraf) ve 🔍 sohbet içinde arama
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let C = null, room = null, unsub = null, pin = null;
let pinBar = null, pinTxt = null, pinX = null;
let srBtn = null, srBar = null, srIn = null, srInfo = null, query = "";

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

function short(s, n) {
  s = String(s || "").replace(/\s+/g, " ").trim();
  const a = Array.from(s);
  return a.length > n ? a.slice(0, n - 1).join("") + "…" : s;
}

function canPin() {
  if (!room || !C.user()) return false;
  return room.dm ? true : !!C.isAdmin();
}

function pinRef() {
  return room.dm ? doc(C.db, "dms", room.pairId, "meta", "pin") : doc(C.db, "pins", room.id);
}

export function initPin(ctx) {
  C = ctx;
  if (document.getElementById("pin-bar")) return;
  const st = document.createElement("style");
  st.textContent =
    ".pin-bar{display:flex;align-items:center;gap:8px;margin:0;padding:8px 14px;background:linear-gradient(90deg,rgba(240,194,75,.22),rgba(240,194,75,.08));border-bottom:1px solid var(--lamp);cursor:pointer}" +
    ".pin-bar .pin-ic{flex:0 0 auto;font-size:18px}" +
    ".pin-bar .pin-t{flex:1;min-width:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".pin-bar .pin-t b{color:var(--lamp);margin-right:6px}" +
    ".pin-bar .pin-x{flex:0 0 auto;background:none;border:1px solid var(--line);color:var(--text);border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:13px}" +
    "#srb{flex:none;background:none;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:5px 10px;cursor:pointer;font-size:15px}" +
    "#srb[aria-pressed=true]{border-color:var(--lamp);background:rgba(240,194,75,.18)}" +
    ".sr-bar{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line);background:var(--panel)}" +
    ".sr-bar input{flex:1;min-width:0;background:var(--bg);color:var(--text);border:1px solid var(--lamp);border-radius:10px;padding:9px 12px;font-size:15px}" +
    ".sr-bar .sr-info{flex:0 0 auto;color:var(--mute);font-size:13px;min-width:62px;text-align:right}" +
    ".sr-bar button{flex:0 0 auto;background:none;border:1px solid var(--line);color:var(--text);border-radius:50%;width:32px;height:32px;cursor:pointer}" +
    ".row.sr-hit .msg{box-shadow:0 0 0 2px var(--lamp)}" +
    "body.chat-closed .pin-bar,body.chat-closed .sr-bar,body.chat-closed #srb{display:none!important}";
  document.head.appendChild(st);

  const log = document.getElementById("log");
  const main = log && log.parentNode;

  // Sabit mesaj şeridi
  pinBar = el("div", "pin-bar");
  pinBar.id = "pin-bar";
  pinBar.hidden = true;
  pinBar.appendChild(el("span", "pin-ic", "📌"));
  pinTxt = el("span", "pin-t", "");
  pinBar.appendChild(pinTxt);
  pinX = el("button", "pin-x", "✖");
  pinX.type = "button";
  pinX.title = "Sabitlemeyi kaldır";
  pinBar.appendChild(pinX);
  pinBar.onclick = (e) => { if (e.target === pinX) return; jump(); };
  pinX.onclick = async (e) => {
    e.stopPropagation();
    if (!confirm("Sabit mesaj kaldırılsın mı?")) return;
    try { await deleteDoc(pinRef()); C.toast("Sabit mesaj kaldırıldı."); }
    catch (x) { C.toast(x && x.code === "permission-denied" ? "İşlem reddedildi. Firestore kurallarını güncelledin mi?" : "Kaldırılamadı."); }
  };

  // Arama çubuğu
  srBar = el("div", "sr-bar");
  srBar.hidden = true;
  srIn = document.createElement("input");
  srIn.type = "search";
  srIn.placeholder = "🔍 Bu sohbette ara…";
  srIn.setAttribute("aria-label", "Bu sohbette ara");
  srInfo = el("span", "sr-info", "");
  const srX = el("button", "", "✖");
  srX.type = "button";
  srX.title = "Aramayı kapat";
  srBar.appendChild(srIn); srBar.appendChild(srInfo); srBar.appendChild(srX);
  srIn.oninput = () => { query = srIn.value.trim().toLocaleLowerCase("tr"); applySearch(); };
  srX.onclick = closeSearch;

  if (main) { main.insertBefore(pinBar, log); main.insertBefore(srBar, log); }

  // 🔍 düğmesi: oda başlığının yanında
  const rt = document.getElementById("rt");
  srBtn = el("button", "", "🔍");
  srBtn.id = "srb";
  srBtn.type = "button";
  srBtn.title = "Sohbette ara";
  srBtn.setAttribute("aria-pressed", "false");
  srBtn.onclick = () => { if (srBar.hidden) openSearch(); else closeSearch(); };
  if (rt && rt.parentNode) rt.parentNode.insertBefore(srBtn, rt.nextSibling);
}

function openSearch() {
  srBar.hidden = false;
  srBtn.setAttribute("aria-pressed", "true");
  setTimeout(() => { try { srIn.focus(); } catch (e) {} }, 30);
  applySearch();
}

function closeSearch() {
  srBar.hidden = true;
  srBtn.setAttribute("aria-pressed", "false");
  srIn.value = "";
  query = "";
  applySearch();
  const l = document.getElementById("log");
  if (l) l.scrollTop = l.scrollHeight;
}

// Sohbet her çizildiğinde app.js çağırır
export function applySearch() {
  const log = document.getElementById("log");
  if (!log) return;
  const rows = log.querySelectorAll(".row");
  const notes = log.querySelectorAll(".note");
  if (!query) {
    rows.forEach((r) => { r.style.display = ""; r.classList.remove("sr-hit"); });
    notes.forEach((n) => { n.style.display = ""; });
    if (srInfo) srInfo.textContent = "";
    return;
  }
  let n = 0;
  rows.forEach((r) => {
    const m = r.querySelector(".msg");
    let t = "";
    if (m) {
      const who = m.querySelector(".who"), p = m.querySelector(":scope > p"), q = m.querySelector(".rpl-q");
      t = [who && who.firstChild ? who.firstChild.textContent : "", p ? p.textContent : "", q ? q.textContent : ""].join(" ");
    }
    const hit = t.toLocaleLowerCase("tr").indexOf(query) >= 0;
    r.style.display = hit ? "" : "none";
    r.classList.toggle("sr-hit", hit);
    if (hit) n++;
  });
  notes.forEach((x) => { x.style.display = "none"; });
  if (srInfo) srInfo.textContent = n ? n + " sonuç" : "Sonuç yok";
}

/* ---------- Sabit mesaj ---------- */
function paintPin() {
  if (!pinBar) return;
  if (!pin) { pinBar.hidden = true; return; }
  pinTxt.textContent = "";
  pinTxt.appendChild(el("b", "", pin.nick || "Mesaj"));
  pinTxt.appendChild(document.createTextNode(pin.t || ""));
  pinX.hidden = !canPin();
  pinBar.hidden = false;
}

function jump() {
  if (!pin) return;
  if (query) closeSearch();
  const row = document.querySelector('.row[data-mid="' + String(pin.mid || "").replace(/[^A-Za-z0-9_-]/g, "") + '"]');
  if (!row) { C.toast("Sabit mesaj eski mesajların arasında, listede görünmüyor."); return; }
  row.scrollIntoView({ behavior: "smooth", block: "center" });
  const box = row.querySelector(".msg") || row;
  box.classList.remove("rpl-flash");
  void box.offsetWidth;
  box.classList.add("rpl-flash");
}

export function setPinRoom(r) {
  room = r;
  pin = null;
  if (unsub) { unsub(); unsub = null; }
  paintPin();
  if (srBar && !srBar.hidden) closeSearch();
  if (!r || !C.user()) return;
  unsub = onSnapshot(pinRef(), (s) => {
    pin = s.exists() ? s.data() : null;
    paintPin();
    if (C.refresh) C.refresh();
  }, () => { pin = null; paintPin(); });
}

function preview(msgEl, m) {
  if (m.aud) return "🎙️ Sesli mesaj";
  if (m.img) return "📷 Fotoğraf";
  const p = msgEl.querySelector(":scope > p");
  return short((p && p.textContent) || m.text || "", 190) || "Mesaj";
}

// Mesajın altına 📌 Sabitle (yetkisi olana)
export function addPinBtn(msgEl, m, r) {
  if (!C || !m || !m.id || !canPin()) return;
  let a = msgEl.querySelector(".acts");
  if (!a) { a = el("div", "acts"); msgEl.appendChild(a); }
  const b = el("button", "", pin && pin.mid === m.id ? "📌 Sabitli" : "📌 Sabitle");
  b.type = "button";
  b.onclick = async () => {
    if (pin && pin.mid === m.id) { C.toast("Bu mesaj zaten sabitli."); return; }
    try {
      await setDoc(pinRef(), { mid: String(m.id).slice(0, 40), nick: short(m.nick || "kullanıcı", 20), t: preview(msgEl, m), by: C.user().uid, at: serverTimestamp() });
      C.toast("📌 Mesaj sabitlendi.");
    } catch (x) {
      C.toast(x && x.code === "permission-denied" ? "İşlem reddedildi. Firestore kurallarını güncelledin mi?" : "Sabitlenemedi.");
    }
  };
  a.appendChild(b);
}
