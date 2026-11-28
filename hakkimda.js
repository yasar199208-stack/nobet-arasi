// 📝 Hakkımda: profil kartında il, çalıştığı yer, kaç yıllık ve kısa yazı
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ILLER } from "./rooms.js?v=2";
import { isBad } from "./filter.js?v=3";

const YERLER = ["AVM", "Hastane", "Site / Konut", "Fabrika", "Okul / Üniversite", "Banka", "Otel", "Havalimanı", "Belediye", "Kamu kurumu", "Ofis / Plaza", "Şantiye", "Etkinlik / Konser", "Liman", "Diğer"];
const cache = new Map(); // uid -> { d, t }
let C = null, panel = null, fIl = null, fYer = null, fYil = null, fTxt = null, fInfo = null, onSaved = null;

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

function opt(sel, v, label) {
  const o = document.createElement("option");
  o.value = v; o.textContent = label || v;
  sel.appendChild(o);
}

export function initAbout(ctx) {
  C = ctx;
  if (document.getElementById("ab-panel")) return;
  const st = document.createElement("style");
  st.textContent =
    ".ab-box{margin:10px 0 0;text-align:left;background:rgba(127,150,180,.10);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:14px}" +
    ".ab-box .ab-row{display:flex;flex-wrap:wrap;gap:6px 12px;color:var(--text)}" +
    ".ab-box .ab-txt{margin-top:6px;color:var(--text);white-space:pre-wrap;overflow-wrap:anywhere}" +
    ".ab-box .ab-none{color:var(--mute)}" +
    ".ab-edit{display:block;width:100%;margin-top:8px}" +
    ".ab-panel{position:fixed;inset:0;z-index:65;background:rgba(0,0,0,.6);display:grid;place-items:center;padding:16px}" +
    ".ab-panel .ab-sheet{width:100%;max-width:420px;max-height:90vh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-top:3px solid var(--lamp);border-radius:12px;padding:16px}" +
    ".ab-panel h3{margin:0 0 10px;font:700 22px var(--head)}" +
    ".ab-panel label{display:block;margin:8px 0 4px;color:var(--mute);font-size:13px}" +
    ".ab-panel select,.ab-panel input,.ab-panel textarea{display:block;width:100%;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:9px;padding:9px 11px;font:15px var(--body)}" +
    ".ab-panel textarea{min-height:80px;resize:vertical}" +
    ".ab-panel .ab-info{color:var(--mute);font-size:13px;min-height:18px;margin-top:6px}" +
    ".ab-panel .ab-btns{display:flex;gap:8px;margin-top:10px}" +
    ".ab-panel .ab-btns button{flex:1;border-radius:10px;padding:10px;cursor:pointer;font-weight:700;font-size:15px}" +
    ".ab-panel .ab-no{background:none;border:1px solid var(--line);color:var(--text)}" +
    ".ab-panel .ab-ok{background:var(--lamp);color:var(--lamp-ink);border:0}" +
    ".ab-panel .ab-del{display:block;width:100%;margin-top:8px;background:none;border:0;color:var(--danger);text-decoration:underline;cursor:pointer;font-size:13px}";
  document.head.appendChild(st);

  panel = el("div", "ab-panel");
  panel.id = "ab-panel";
  panel.hidden = true;
  const sh = el("div", "ab-sheet");
  sh.appendChild(el("h3", "", "📝 Hakkımda"));

  sh.appendChild(el("label", "", "📍 İl"));
  fIl = document.createElement("select");
  opt(fIl, "", "Seçilmedi");
  ILLER.forEach((x) => opt(fIl, x));
  sh.appendChild(fIl);

  sh.appendChild(el("label", "", "🏢 Çalıştığın yer"));
  fYer = document.createElement("select");
  opt(fYer, "", "Seçilmedi");
  YERLER.forEach((x) => opt(fYer, x));
  sh.appendChild(fYer);

  sh.appendChild(el("label", "", "⏳ Kaç yıldır güvenlikçisin?"));
  fYil = document.createElement("input");
  fYil.type = "number"; fYil.min = "0"; fYil.max = "60"; fYil.inputMode = "numeric"; fYil.placeholder = "Ör. 5";
  sh.appendChild(fYil);

  sh.appendChild(el("label", "", "💬 Kısa yazı (en fazla 150 harf)"));
  fTxt = document.createElement("textarea");
  fTxt.maxLength = 150; fTxt.placeholder = "Ör. Gece vardiyası, çay seven, futbol meraklısı ☕⚽";
  sh.appendChild(fTxt);

  fInfo = el("div", "ab-info", "");
  sh.appendChild(fInfo);
  const btns = el("div", "ab-btns");
  const no = el("button", "ab-no", "Vazgeç"); no.type = "button";
  const ok = el("button", "ab-ok", "Kaydet"); ok.type = "button";
  btns.appendChild(no); btns.appendChild(ok); sh.appendChild(btns);
  const del = el("button", "ab-del", "Hakkımda bilgilerini sil"); del.type = "button";
  sh.appendChild(del);
  panel.appendChild(sh);
  document.body.appendChild(panel);

  no.onclick = () => { panel.hidden = true; };
  panel.onclick = (e) => { if (e.target === panel) panel.hidden = true; };
  ok.onclick = save;
  del.onclick = async () => {
    const u = C.user(); if (!u) return;
    if (!confirm("Hakkımda bilgilerin silinsin mi?")) return;
    try { await deleteDoc(doc(C.db, "about", u.uid)); cache.set(u.uid, { d: null, t: Date.now() }); panel.hidden = true; C.toast("Silindi."); if (onSaved) onSaved(); }
    catch (e) { fInfo.textContent = "Silinemedi."; }
  };
}

async function load(uid, force) {
  const c = cache.get(uid);
  if (!force && c && Date.now() - c.t < 3 * 60 * 1000) return c.d;
  try {
    const s = await getDoc(doc(C.db, "about", uid));
    const d = s.exists() ? s.data() : null;
    cache.set(uid, { d: d, t: Date.now() });
    return d;
  } catch (e) { return c ? c.d : null; }
}

function openEdit(d, after) {
  onSaved = after;
  fIl.value = d && d.il ? d.il : "";
  fYer.value = d && d.yer ? d.yer : "";
  fYil.value = d && typeof d.yil === "number" ? String(d.yil) : "";
  fTxt.value = d && d.txt ? d.txt : "";
  fInfo.textContent = "";
  panel.hidden = false;
}

async function save() {
  const u = C.user();
  if (!u) return;
  const txt = fTxt.value.trim();
  if (txt && isBad(txt)) { fInfo.textContent = "Yazında uygunsuz ifade var."; return; }
  const data = { il: fIl.value, yer: fYer.value, txt: txt, at: serverTimestamp() };
  const y = fYil.value.trim();
  if (y !== "") {
    const n = parseInt(y, 10);
    if (isNaN(n) || n < 0 || n > 60) { fInfo.textContent = "Yıl 0 ile 60 arasında olmalı."; return; }
    data.yil = n;
  }
  try {
    await setDoc(doc(C.db, "about", u.uid), data);
    cache.set(u.uid, { d: Object.assign({}, data, { at: null }), t: Date.now() });
    panel.hidden = true;
    C.toast("📝 Hakkımda kaydedildi.");
    if (onSaved) onSaved();
  } catch (e) {
    fInfo.textContent = e && e.code === "permission-denied" ? "İşlem reddedildi. Firestore kurallarını güncelledin mi?" : "Kaydedilemedi, tekrar dene.";
  }
}

function paint(box, d, uid, isMe) {
  box.textContent = "";
  const card = el("div", "ab-box");
  const has = d && (d.il || d.yer || typeof d.yil === "number" || d.txt);
  if (has) {
    const row = el("div", "ab-row");
    if (d.il) row.appendChild(el("span", "", "📍 " + d.il));
    if (d.yer) row.appendChild(el("span", "", "🏢 " + d.yer));
    if (typeof d.yil === "number") row.appendChild(el("span", "", "⏳ " + (d.yil === 0 ? "Yeni başladı" : d.yil + " yıllık")));
    if (row.childNodes.length) card.appendChild(row);
    if (d.txt) card.appendChild(el("div", "ab-txt", "💬 " + d.txt));
  } else {
    card.appendChild(el("div", "ab-none", isMe ? "Henüz kendini tanıtmadın." : "Henüz bilgi eklememiş."));
  }
  box.appendChild(card);
  if (isMe) {
    const b = el("button", "ab-edit", has ? "📝 Hakkımda düzenle" : "📝 Hakkımda ekle");
    b.type = "button";
    b.onclick = () => openEdit(d, () => renderAbout(box, uid, isMe));
    box.appendChild(b);
  }
}

// Profil kartında göster (app.js çağırır)
export function renderAbout(box, uid, isMe) {
  if (!box || !uid || !C) return;
  box.dataset.uid = uid;
  const c = cache.get(uid);
  if (c) paint(box, c.d, uid, isMe); else box.textContent = "";
  load(uid, false).then((d) => { if (box.dataset.uid === uid) paint(box, d, uid, isMe); });
}
