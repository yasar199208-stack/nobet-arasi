// 📅 Tarih ayırıcı, 📊 Anket, 🏅 Rozetler
import { doc, getDoc, updateDoc, addDoc, deleteField, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { isBad } from "./filter.js?v=3";

let C = null, pollPanel = null;

// Rozet seviyeleri (mesaj sayısına göre)
const LEVELS = [
  [2000, "👑", "Efsane"],
  [500, "🥇", "Kıdemli"],
  [100, "🥈", "Tecrübeli"],
  [20, "🥉", "Çaylak"]
];
const stats = new Map(); // uid -> { n, t }

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

export function initEkstra(ctx) {
  C = ctx;
  if (document.getElementById("pl-panel")) return;
  const st = document.createElement("style");
  st.textContent =
    ".day-sep{align-self:center;margin:6px 0;padding:3px 14px;border-radius:999px;background:rgba(127,150,180,.16);border:1px solid var(--line);color:var(--text);font-size:12px;font-weight:600;letter-spacing:.3px}" +
    ".bdg{margin-left:5px;font-size:13px;cursor:pointer;filter:drop-shadow(0 0 3px rgba(240,194,75,.45))}" +
    ".plb{background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:0 12px;cursor:pointer;font-size:20px}" +
    ".pl-card{margin-top:6px;min-width:220px;max-width:320px;background:rgba(127,150,180,.10);border:1px solid var(--lamp);border-radius:12px;padding:10px}" +
    ".pl-card .pl-q{font-weight:700;margin-bottom:8px;overflow-wrap:anywhere}" +
    ".pl-card .pl-o{position:relative;display:block;width:100%;text-align:left;margin:0 0 6px;padding:8px 10px;border:1px solid var(--line);border-radius:9px;background:var(--bg);color:var(--text);cursor:pointer;overflow:hidden;font:inherit;font-size:14px}" +
    ".pl-card .pl-o.pl-me{border-color:var(--lamp)}" +
    ".pl-card .pl-f{position:absolute;left:0;top:0;bottom:0;background:rgba(240,194,75,.25);transition:width .4s ease}" +
    ".pl-card .pl-l{position:relative;display:flex;justify-content:space-between;gap:8px}" +
    ".pl-card .pl-l b{font-weight:700;color:var(--lamp)}" +
    ".pl-card .pl-s{color:var(--mute);font-size:12px}" +
    ".pl-panel{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.55);display:grid;place-items:center;padding:16px}" +
    ".pl-panel .pl-box{width:100%;max-width:420px;background:var(--panel);border:1px solid var(--line);border-top:3px solid var(--lamp);border-radius:12px;padding:16px}" +
    ".pl-panel h3{margin:0 0 10px;font:700 22px var(--head)}" +
    ".pl-panel input{display:block;width:100%;margin:0 0 8px;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:9px;padding:10px 12px;font-size:15px}" +
    ".pl-panel .pl-info{color:var(--mute);font-size:13px;min-height:18px}" +
    ".pl-panel .pl-btns{display:flex;gap:8px;margin-top:10px}" +
    ".pl-panel .pl-btns button{flex:1;border-radius:10px;padding:10px;cursor:pointer;font-weight:700;font-size:15px}" +
    ".pl-panel .pl-no{background:none;border:1px solid var(--line);color:var(--text)}" +
    ".pl-panel .pl-ok{background:var(--lamp);color:var(--lamp-ink);border:0}";
  document.head.appendChild(st);

  // 📊 düğmesi mesaj kutusunda
  const form = document.getElementById("sf");
  if (form) {
    const b = el("button", "plb", "📊");
    b.type = "button";
    b.title = "Anket oluştur";
    const send = form.querySelector("button:last-child");
    if (send) form.insertBefore(b, send); else form.appendChild(b);
    b.onclick = openPollPanel;
  }

  // Anket oluşturma penceresi
  pollPanel = el("div", "pl-panel");
  pollPanel.id = "pl-panel";
  pollPanel.hidden = true;
  const box = el("div", "pl-box");
  box.appendChild(el("h3", "", "📊 Anket oluştur"));
  const q = document.createElement("input");
  q.maxLength = 120; q.placeholder = "Soru (ör. Hangi vardiya daha zor?)";
  box.appendChild(q);
  const opts = [];
  for (let i = 0; i < 4; i++) {
    const o = document.createElement("input");
    o.maxLength = 40;
    o.placeholder = (i + 1) + ". seçenek" + (i < 2 ? "" : " (isteğe bağlı)");
    opts.push(o); box.appendChild(o);
  }
  const info = el("div", "pl-info", "");
  box.appendChild(info);
  const btns = el("div", "pl-btns");
  const no = el("button", "pl-no", "Vazgeç"); no.type = "button";
  const ok = el("button", "pl-ok", "Gönder"); ok.type = "button";
  btns.appendChild(no); btns.appendChild(ok); box.appendChild(btns);
  pollPanel.appendChild(box);
  document.body.appendChild(pollPanel);
  pollPanel._q = q; pollPanel._o = opts; pollPanel._i = info;
  no.onclick = () => { pollPanel.hidden = true; };
  pollPanel.onclick = (e) => { if (e.target === pollPanel) pollPanel.hidden = true; };
  let busy = false;
  ok.onclick = async () => {
    if (busy) return;
    const r = C.room(), u = C.user();
    if (!r || !u) return;
    const qt = q.value.trim();
    const os = opts.map((x) => x.value.trim()).filter(Boolean);
    if (!qt) { info.textContent = "Soru yaz."; return; }
    if (os.length < 2) { info.textContent = "En az 2 seçenek yaz."; return; }
    if (isBad(qt) || os.some(isBad)) { info.textContent = "Ankette uygunsuz ifade var."; return; }
    busy = true;
    try {
      await addDoc(C.msgCol(r), { uid: u.uid, nick: C.nick(), text: "", poll: { q: qt, o: os }, createdAt: serverTimestamp() });
      pollPanel.hidden = true;
      C.toast("📊 Anket gönderildi.");
      bumpStat();
    } catch (e) {
      info.textContent = e && e.code === "permission-denied" ? "İşlem reddedildi. Firestore kurallarını güncelledin mi?" : "Gönderilemedi, tekrar dene.";
    }
    busy = false;
  };
}

function openPollPanel() {
  if (!C.room() || !C.user()) { C.toast("Önce bir oda ya da sohbet aç."); return; }
  pollPanel._q.value = "";
  pollPanel._o.forEach((o) => { o.value = ""; });
  pollPanel._i.textContent = "";
  pollPanel.hidden = false;
  setTimeout(() => { try { pollPanel._q.focus(); } catch (e) {} }, 50);
}

/* ---------- 📅 Tarih ayırıcı ---------- */
function dayKey(d) { return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); }

export function daySep(prev, cur) {
  if (!cur || (prev && dayKey(prev) === dayKey(cur))) return null;
  const now = new Date();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  let t;
  if (dayKey(cur) === dayKey(now)) t = "Bugün";
  else if (dayKey(cur) === dayKey(y)) t = "Dün";
  else {
    const o = { weekday: "long", day: "numeric", month: "long" };
    if (cur.getFullYear() !== now.getFullYear()) o.year = "numeric";
    t = cur.toLocaleDateString("tr-TR", o);
  }
  return el("div", "note day-sep", t);
}

/* ---------- 📊 Anket ---------- */
async function vote(m, r, i) {
  const u = C.user();
  if (!u) return;
  const cur = m.pv && typeof m.pv[u.uid] === "number" ? m.pv[u.uid] : -1;
  const upd = {};
  upd["pv." + u.uid] = cur === i ? deleteField() : i;
  try { await updateDoc(doc(C.msgCol(r), m.id), upd); }
  catch (e) { C.toast(e && e.code === "permission-denied" ? "İşlem reddedildi. Firestore kurallarını güncelledin mi?" : "Oy verilemedi."); }
}

export function addPoll(msgEl, m, r) {
  const p = m.poll;
  if (!p || typeof p.q !== "string" || !Array.isArray(p.o)) return;
  const me = C.user() && C.user().uid;
  const pv = m.pv && typeof m.pv === "object" ? m.pv : {};
  const counts = p.o.map(() => 0);
  let total = 0;
  Object.keys(pv).forEach((k) => { const v = pv[k]; if (typeof v === "number" && v >= 0 && v < counts.length) { counts[v]++; total++; } });
  const mine = me && typeof pv[me] === "number" ? pv[me] : -1;
  const card = el("div", "pl-card");
  card.appendChild(el("div", "pl-q", "📊 " + p.q));
  p.o.forEach((txt, i) => {
    const pct = total ? Math.round(counts[i] * 100 / total) : 0;
    const b = el("button", "pl-o" + (mine === i ? " pl-me" : ""));
    b.type = "button";
    const f = el("span", "pl-f"); f.style.width = pct + "%";
    const l = el("span", "pl-l");
    l.appendChild(el("span", "", (mine === i ? "✅ " : "") + txt));
    l.appendChild(el("b", "", pct + "%"));
    b.appendChild(f); b.appendChild(l);
    b.onclick = () => vote(m, r, i);
    card.appendChild(b);
  });
  card.appendChild(el("div", "pl-s", total + " oy" + (mine >= 0 ? " · oyunu değiştirmek için başka seçeneğe dokun" : " · oy vermek için dokun")));
  const acts = msgEl.querySelector(".acts");
  if (acts) msgEl.insertBefore(card, acts); else msgEl.appendChild(card);
}

/* ---------- 🏅 Rozetler ---------- */
function level(n) {
  for (let i = 0; i < LEVELS.length; i++) if (n >= LEVELS[i][0]) return LEVELS[i];
  return null;
}

function paintBadge(span, uid) {
  const s = stats.get(uid);
  const lv = s ? level(s.n) : null;
  span.textContent = lv ? lv[1] : "";
  span.hidden = !lv;
  span.title = lv ? lv[2] : "";
}

async function loadStat(uid) {
  const s = stats.get(uid);
  if (s && Date.now() - s.t < 5 * 60 * 1000) return s;
  if (s && s.loading) return s.loading;
  const p = getDoc(doc(C.db, "stats", uid)).then((d) => {
    const v = { n: d.exists() && typeof d.data().n === "number" ? d.data().n : 0, t: Date.now() };
    stats.set(uid, v);
    return v;
  }).catch(() => { const v = { n: 0, t: Date.now() }; stats.set(uid, v); return v; });
  stats.set(uid, Object.assign({}, s || { n: 0, t: 0 }, { loading: p }));
  return p;
}

// İsmin yanına rozet
export function addBadge(whoEl, uid) {
  if (!uid || !whoEl) return;
  const span = el("span", "bdg");
  span.hidden = true;
  span.onclick = (e) => {
    e.stopPropagation();
    const s = stats.get(uid), lv = s ? level(s.n) : null;
    if (lv) C.toast(lv[1] + " " + lv[2] + " · " + s.n + " mesaj");
  };
  const first = whoEl.firstChild;
  if (first && first.nextSibling) whoEl.insertBefore(span, first.nextSibling); else whoEl.appendChild(span);
  const s = stats.get(uid);
  if (s && !s.loading) paintBadge(span, uid);
  loadStat(uid).then(() => { if (span.isConnected) paintBadge(span, uid); });
}

// Kendi mesaj sayacını 1 artır
let lastBump = 0;
export function bumpStat() {
  const u = C && C.user();
  if (!u) return;
  const now = Date.now();
  if (now - lastBump < 2500) return;
  lastBump = now;
  const ref = doc(C.db, "stats", u.uid);
  runTransaction(C.db, async (tx) => {
    const d = await tx.get(ref);
    const n = d.exists() && typeof d.data().n === "number" ? d.data().n : 0;
    if (d.exists()) tx.update(ref, { n: n + 1, at: serverTimestamp() });
    else tx.set(ref, { n: 1, at: serverTimestamp() });
    return n + 1;
  }).then((n) => {
    const before = level(n - 1), after = level(n);
    stats.set(u.uid, { n: n, t: Date.now() });
    if (after && (!before || before[0] !== after[0])) C.toast("🎉 Yeni rozet: " + after[1] + " " + after[2] + "!");
  }).catch(() => {});
}
