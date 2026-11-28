// 📍 Nöbet durumu: 🟢 Nöbette, 🌙 Gece nöbetinde, ☕ Molada, 🏖️ İzinde, 😴 Uyuyor
// Üstte "📍 Durum" düğmesi, mesajlarda ismin yanında simge, profil kartında durum yazısı.
// 16 saatten eski durum kendiliğinden görünmez olur.
import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

for (let i = 0; i < 150 && !getApps().length; i++) await new Promise((r) => setTimeout(r, 200));
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);

const LIST = [
  ["nobet", "🟢", "Nöbette"],
  ["gece", "🌙", "Gece nöbetinde"],
  ["mola", "☕", "Molada"],
  ["izin", "🏖️", "İzinde"],
  ["uyku", "😴", "Uyuyor"]
];
const MAX = 16 * 60 * 60 * 1000;
const cache = new Map(); // uid -> { d: {s, at} | null, t, p }
let me = null, chip = null, panel = null, prof = null, busy = false;

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

function info(s) { return LIST.find((x) => x[0] === s) || null; }
function live(d) { return d && info(d.s) && d.at && Date.now() - d.at.getTime() < MAX ? d : null; }
function ago(at) {
  const m = Math.max(0, Math.round((Date.now() - at.getTime()) / 60000));
  if (m < 1) return "az önce";
  if (m < 60) return m + " dakikadır";
  return Math.floor(m / 60) + " saattir";
}
function label(d) { const i = info(d.s); return i[1] + " " + i[2] + " · " + ago(d.at); }
function cur(uid) { const c = cache.get(uid); return c ? live(c.d) : null; }

function load(uid, force) {
  const c = cache.get(uid);
  if (!force && c && (c.p || Date.now() - c.t < 2 * 60 * 1000)) return c.p || Promise.resolve(c.d);
  const old = c ? c.d : null;
  const p = getDoc(doc(db, "duty", uid)).then((s) => {
    const x = s.exists() ? s.data() : null;
    const d = x && x.at && x.at.toDate ? { s: x.s, at: x.at.toDate() } : null;
    cache.set(uid, { d: d, t: Date.now() });
    return d;
  }).catch(() => {
    cache.set(uid, { d: old, t: Date.now() });
    return old;
  });
  cache.set(uid, { d: old, t: c ? c.t : 0, p: p });
  return p;
}

/* ---------- Görünüm ---------- */
const st = document.createElement("style");
st.textContent =
  ".dur-dot{margin-left:5px;font-size:13px;cursor:pointer}" +
  ".tools .dur-chip.on{border-color:var(--lamp);color:var(--lamp)}" +
  ".dur-p{margin:8px 0 0;text-align:center}" +
  ".dur-p .dur-st{display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(127,150,180,.14);border:1px solid var(--line);font-size:14px}" +
  ".dur-p .dur-st.on{border-color:var(--lamp)}" +
  ".dur-p button{display:block;width:100%;margin-top:8px}" +
  ".dur-panel{z-index:70}" +
  ".dur-list button{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 8px;padding:12px 14px;font-size:17px;text-align:left}" +
  ".dur-list button span{font-size:22px}" +
  ".dur-list button.on{border-color:var(--lamp);background:rgba(240,194,75,.12);font-weight:700}" +
  ".dur-list .dur-clear{justify-content:center;color:var(--danger);font-size:15px}" +
  ".dur-note{color:var(--mute);font-size:13px;margin:0 0 10px}";
document.head.appendChild(st);

// Üstteki "📍 Durum" düğmesi
function ensureChip() {
  if (chip && chip.isConnected) return;
  const tools = document.querySelector(".tools");
  if (!tools) return;
  chip = el("button", "dur-chip", "📍 Durum");
  chip.type = "button";
  chip.onclick = openPanel;
  const first = tools.firstElementChild;
  if (first && first.nextSibling) tools.insertBefore(chip, first.nextSibling); else tools.appendChild(chip);
  paintChip();
}

function paintChip() {
  if (!chip) return;
  const d = me ? cur(me.uid) : null;
  if (d) { const i = info(d.s); chip.textContent = i[1] + " " + i[2]; chip.classList.add("on"); }
  else { chip.textContent = "📍 Durum"; chip.classList.remove("on"); }
}

// Durum seçme penceresi
function openPanel() {
  if (!me) return;
  if (!panel) {
    panel = el("div", "panel dur-panel");
    panel.hidden = true;
    const sh = el("div", "sheet");
    const head = el("div", "sh");
    head.appendChild(el("h2", "", "📍 Durumum"));
    const x = el("button", "", "Kapat"); x.type = "button";
    x.onclick = () => { panel.hidden = true; };
    head.appendChild(x);
    sh.appendChild(head);
    sh.appendChild(el("p", "dur-note", "Arkadaşların ve odadakiler ismin yanında durumunu görür. 16 saat sonra kendiliğinden kalkar."));
    const list = el("div", "dur-list");
    sh.appendChild(list);
    panel.appendChild(sh);
    panel.onclick = (e) => { if (e.target === panel) panel.hidden = true; };
    document.body.appendChild(panel);
    panel._list = list;
  }
  const list = panel._list;
  list.textContent = "";
  const d = cur(me.uid);
  LIST.forEach((x) => {
    const b = el("button", d && d.s === x[0] ? "on" : "");
    b.type = "button";
    b.appendChild(el("span", "", x[1]));
    b.appendChild(document.createTextNode(x[2]));
    b.onclick = () => setStatus(x[0]);
    list.appendChild(b);
  });
  if (d) {
    const c = el("button", "dur-clear", "❌ Durumu kaldır");
    c.type = "button";
    c.onclick = () => setStatus(null);
    list.appendChild(c);
  }
  panel.hidden = false;
}

async function setStatus(s) {
  if (!me || busy) return;
  busy = true;
  const uid = me.uid;
  try {
    if (s) {
      await setDoc(doc(db, "duty", uid), { s: s, at: serverTimestamp() });
      cache.set(uid, { d: { s: s, at: new Date() }, t: Date.now() });
      const i = info(s);
      toast(i[1] + " Durumun: " + i[2]);
    } else {
      await deleteDoc(doc(db, "duty", uid));
      cache.set(uid, { d: null, t: Date.now() });
      toast("Durum kaldırıldı.");
    }
    if (panel) panel.hidden = true;
    repaintAll();
  } catch (e) {
    toast(e && e.code === "permission-denied" ? "İşlem reddedildi. Firestore kurallarını güncelledin mi?" : "Durum kaydedilemedi, tekrar dene.");
  }
  busy = false;
}

/* ---------- Mesajlarda ismin yanında simge ---------- */
function paintDot(dot) {
  const d = cur(dot.dataset.u);
  if (d) { dot.textContent = info(d.s)[1]; dot.title = label(d); dot.hidden = false; }
  else { dot.textContent = ""; dot.hidden = true; }
}

function decorateRow(row) {
  if (!row.classList || !row.classList.contains("row") || row.querySelector(".dur-dot")) return;
  const av = row.querySelector(".av"), who = row.querySelector(".who");
  if (!av || !who || !av.dataset.av) return;
  const uid = av.dataset.av;
  const dot = el("span", "dur-dot");
  dot.dataset.u = uid;
  dot.hidden = true;
  dot.onclick = (e) => {
    e.stopPropagation();
    const d = cur(uid);
    if (d) toast(label(d));
  };
  const first = who.firstChild;
  if (first && first.nextSibling) who.insertBefore(dot, first.nextSibling); else who.appendChild(dot);
  if (cache.has(uid) && !cache.get(uid).p) paintDot(dot);
  load(uid, false).then(() => { if (dot.isConnected) paintDot(dot); });
}

function decorateLog() {
  const l = $("log");
  if (!l) return;
  l.querySelectorAll(".row").forEach(decorateRow);
}

/* ---------- Profil kartında durum ---------- */
function paintProfile() {
  const pp = $("pp"), pav = $("pav"), pab = $("pab");
  if (!pp || !pav || !pab || pp.hidden || !me) return;
  if (!prof || !prof.isConnected) {
    prof = el("div", "dur-p");
    pab.parentNode.insertBefore(prof, pab);
  }
  const uid = pav.dataset.av;
  if (!uid) return;
  prof.dataset.u = uid;
  const draw = () => {
    if (prof.dataset.u !== uid) return;
    prof.textContent = "";
    const d = cur(uid), mine = uid === me.uid;
    if (d) prof.appendChild(el("span", "dur-st on", label(d)));
    else if (mine) prof.appendChild(el("span", "dur-st", "📍 Durum seçilmedi"));
    if (mine) {
      const b = el("button", "", "📍 Durumumu değiştir");
      b.type = "button";
      b.onclick = openPanel;
      prof.appendChild(b);
    }
  };
  draw();
  load(uid, false).then(draw);
}

function repaintAll() {
  paintChip();
  document.querySelectorAll(".dur-dot").forEach(paintDot);
  paintProfile();
}

/* ---------- Başlat ---------- */
let wired = false;
function wire() {
  if (wired) return;
  const l = $("log"), pp = $("pp");
  if (!l || !pp) return;
  wired = true;
  let q = false;
  new MutationObserver(() => {
    if (q) return;
    q = true;
    requestAnimationFrame(() => { q = false; decorateLog(); });
  }).observe(l, { childList: true });
  new MutationObserver(() => paintProfile()).observe(pp, { attributes: true, subtree: true, attributeFilter: ["hidden", "data-av"] });
  decorateLog();
}

onAuthStateChanged(auth, (u) => {
  me = u;
  if (u) {
    ensureChip();
    load(u.uid, true).then(paintChip);
  } else {
    cache.clear();
    paintChip();
    if (panel) panel.hidden = true;
  }
});

// Sayfa geç yüklenirse bağla; süre yazıları ("3 saattir") güncel kalsın
setInterval(() => { wire(); if (me) ensureChip(); }, 1500);
setInterval(() => { if (me) repaintAll(); }, 60 * 1000);
wire();
