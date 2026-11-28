// 📍 Nöbet durumu + ⏰ Nöbet sayacı
// 🟢 Nöbette, 🌙 Gece nöbetinde, ☕ Molada, 🏖️ İzinde, 😴 Uyuyor
// Nöbette ya da gece nöbetinde seçince vardiya süresi sorulur; kalan süre görünür,
// süre dolunca durum kendiliğinden 😴 olur. Süresiz durum 16 saat sonra kalkar.
import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const TIMED = ["nobet", "gece"];
const HOURS = [8, 12, 16, 24];
const H = 60 * 60 * 1000;
const MAX = 16 * H;          // süresiz durum ne kadar görünsün
const REST = 8 * H;          // nöbet bitince 😴 ne kadar görünsün
const cache = new Map();     // uid -> { d: {s, at, end} | null, t, p }
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
  toast.t = setTimeout(() => { t.hidden = true; }, 3500);
}

function info(s) { return LIST.find((x) => x[0] === s) || null; }

function ago(at) {
  const m = Math.max(0, Math.round((Date.now() - at.getTime()) / 60000));
  if (m < 1) return "az önce";
  if (m < 60) return m + " dakikadır";
  return Math.floor(m / 60) + " saattir";
}

function left(ms) {
  const m = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(m / 60), r = m % 60;
  if (!h) return r + " dk";
  return r ? h + " sa " + r + " dk" : h + " sa";
}

// Ekranda gösterilecek durum (süresi dolanı 😴 yapar, eskileri gizler)
function view(d) {
  if (!d || !info(d.s) || !d.at) return null;
  const now = Date.now();
  if (d.end) {
    const e = d.end.getTime();
    if (now < e) return { s: d.s, at: d.at, end: d.end, rem: e - now, total: e - d.at.getTime() };
    if (now < e + REST) return { s: "uyku", at: d.end, done: true };
    return null;
  }
  return now - d.at.getTime() < MAX ? { s: d.s, at: d.at } : null;
}

function label(v) {
  const i = info(v.s);
  if (v.done) return i[1] + " Nöbeti bitti · dinleniyor";
  if (v.rem) return i[1] + " " + i[2] + " · bitmesine " + left(v.rem);
  return i[1] + " " + i[2] + " · " + ago(v.at);
}

function cur(uid) { const c = cache.get(uid); return c ? view(c.d) : null; }

function load(uid, force) {
  const c = cache.get(uid);
  if (!force && c && (c.p || Date.now() - c.t < 2 * 60 * 1000)) return c.p || Promise.resolve(c.d);
  const old = c ? c.d : null;
  const p = getDoc(doc(db, "duty", uid)).then((s) => {
    const x = s.exists() ? s.data() : null;
    const d = x && x.at && x.at.toDate
      ? { s: x.s, at: x.at.toDate(), end: x.end && x.end.toDate ? x.end.toDate() : null }
      : null;
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
  ".dur-bar{height:8px;margin:8px auto 0;max-width:260px;border-radius:99px;background:rgba(127,150,180,.18);overflow:hidden}" +
  ".dur-bar i{display:block;height:100%;background:var(--lamp);border-radius:99px;transition:width .6s}" +
  ".dur-panel{z-index:70}" +
  ".dur-list button{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 8px;padding:12px 14px;font-size:17px;text-align:left}" +
  ".dur-list button span{font-size:22px}" +
  ".dur-list button.on{border-color:var(--lamp);background:rgba(240,194,75,.12);font-weight:700}" +
  ".dur-list .dur-clear{justify-content:center;color:var(--danger);font-size:15px}" +
  ".dur-hrs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}" +
  ".dur-hrs button{padding:16px 8px;font-size:20px;font-weight:700;text-align:center;justify-content:center}" +
  ".dur-list .dur-back{justify-content:center;color:var(--mute);font-size:15px}" +
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
  const v = me ? cur(me.uid) : null;
  if (v) {
    const i = info(v.s);
    chip.textContent = v.rem ? i[1] + " " + left(v.rem) + " kaldı" : v.done ? i[1] + " Nöbet bitti" : i[1] + " " + i[2];
    chip.classList.add("on");
  } else { chip.textContent = "📍 Durum"; chip.classList.remove("on"); }
}

// Durum seçme penceresi
function buildPanel() {
  panel = el("div", "panel dur-panel");
  panel.hidden = true;
  const sh = el("div", "sheet");
  const head = el("div", "sh");
  const h2 = el("h2", "", "📍 Durumum");
  head.appendChild(h2);
  const x = el("button", "", "Kapat"); x.type = "button";
  x.onclick = () => { panel.hidden = true; };
  head.appendChild(x);
  sh.appendChild(head);
  const note = el("p", "dur-note", "");
  sh.appendChild(note);
  const list = el("div", "dur-list");
  sh.appendChild(list);
  panel.appendChild(sh);
  panel.onclick = (e) => { if (e.target === panel) panel.hidden = true; };
  document.body.appendChild(panel);
  panel._list = list; panel._note = note; panel._h = h2;
}

function openPanel() {
  if (!me) return;
  if (!panel) buildPanel();
  const list = panel._list;
  panel._h.textContent = "📍 Durumum";
  panel._note.textContent = "Arkadaşların ve odadakiler ismin yanında durumunu görür. Nöbette seçersen vardiyanın kaç saat olduğunu sorarım, kalan süre görünür.";
  list.textContent = "";
  const v = cur(me.uid);
  LIST.forEach((x) => {
    const b = el("button", v && !v.done && v.s === x[0] ? "on" : "");
    b.type = "button";
    b.appendChild(el("span", "", x[1]));
    b.appendChild(document.createTextNode(x[2]));
    b.onclick = () => { if (TIMED.indexOf(x[0]) >= 0) askHours(x[0]); else setStatus(x[0], 0); };
    list.appendChild(b);
  });
  if (v) {
    const c = el("button", "dur-clear", "❌ Durumu kaldır");
    c.type = "button";
    c.onclick = () => setStatus(null, 0);
    list.appendChild(c);
  }
  panel.hidden = false;
}

// ⏰ Vardiya kaç saat?
function askHours(s) {
  const i = info(s), list = panel._list;
  panel._h.textContent = "⏰ Vardiyan kaç saat?";
  panel._note.textContent = i[1] + " " + i[2] + " · Süre dolunca durumun kendiliğinden 😴 olur.";
  list.textContent = "";
  const g = el("div", "dur-hrs");
  HOURS.forEach((h) => {
    const b = el("button", "", h + " saat");
    b.type = "button";
    b.onclick = () => setStatus(s, h);
    g.appendChild(b);
  });
  list.appendChild(g);
  const n = el("button", "", "");
  n.type = "button";
  n.appendChild(el("span", "", "♾️"));
  n.appendChild(document.createTextNode("Süre girmeden"));
  n.onclick = () => setStatus(s, 0);
  list.appendChild(n);
  const back = el("button", "dur-back", "← Geri");
  back.type = "button";
  back.onclick = openPanel;
  list.appendChild(back);
}

async function setStatus(s, hours) {
  if (!me || busy) return;
  busy = true;
  const uid = me.uid;
  try {
    if (s) {
      const data = { s: s, at: serverTimestamp() };
      let end = null;
      if (hours) {
        end = new Date(Date.now() + hours * H);
        data.end = Timestamp.fromDate(end);
      }
      await setDoc(doc(db, "duty", uid), data);
      cache.set(uid, { d: { s: s, at: new Date(), end: end }, t: Date.now() });
      const i = info(s);
      toast(i[1] + " Durumun: " + i[2] + (hours ? " · " + hours + " saat" : ""));
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
  const v = cur(dot.dataset.u);
  if (v) { dot.textContent = info(v.s)[1]; dot.title = label(v); dot.hidden = false; }
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
    const v = cur(uid);
    if (v) toast(label(v));
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
    const v = cur(uid), mine = uid === me.uid;
    if (v) {
      prof.appendChild(el("span", "dur-st on", label(v)));
      if (v.rem && v.total > 0) {
        const bar = el("div", "dur-bar"), fill = el("i");
        fill.style.width = Math.min(100, Math.max(2, Math.round((1 - v.rem / v.total) * 100))) + "%";
        bar.appendChild(fill);
        prof.appendChild(bar);
      }
    } else if (mine) prof.appendChild(el("span", "dur-st", "📍 Durum seçilmedi"));
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

// Kendi nöbetin bitince bir kez haber ver
function checkEnd() {
  if (!me) return;
  const c = cache.get(me.uid), d = c && c.d;
  if (!d || !d.end) return;
  const e = d.end.getTime(), now = Date.now();
  if (now < e || now > e + REST) return;
  const key = "na_dur_end_" + me.uid;
  let seen = "";
  try { seen = localStorage.getItem(key) || ""; } catch (x) {}
  if (seen === String(e)) return;
  try { localStorage.setItem(key, String(e)); } catch (x) {}
  toast("⏰ Nöbetin bitti! İyi dinlenmeler 😴");
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (x) {}
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
    load(u.uid, true).then(() => { paintChip(); checkEnd(); });
  } else {
    cache.clear();
    paintChip();
    if (panel) panel.hidden = true;
  }
});

// Sayfa geç yüklenirse bağla; kalan süre yazıları her dakika güncellensin
setInterval(() => { wire(); if (me) ensureChip(); }, 1500);
setInterval(() => { if (me) { repaintAll(); checkEnd(); } }, 60 * 1000);
document.addEventListener("visibilitychange", () => { if (!document.hidden && me) { repaintAll(); checkEnd(); } });
wire();
