import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, query, where, getDocs, onSnapshot, setDoc, updateDoc, deleteDoc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🎮 Oyunlar: tek başına oyunlar (solo, action, puzzle dosyaları) ve özel mesajda arkadaşla oyunlar (gpair.js ... gpair6.js).
// Arkadaşla oyunlar tek belgede tutulur: dms/<çift>/games/<oyun>
for (let i = 0; i < 150 && !getApps().length; i++) await new Promise((r) => setTimeout(r, 200));
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);
const KINDS = ["xox", "rps", "c4", "hang", "ships", "reversi", "mancala", "dama", "chess", "hex", "dots", "mill", "wduel", "gomoku", "speed", "dart", "draw"];
const MODS = ["solo.js?v=2", "action.js?v=1", "puzzle.js?v=1", "puzzle2.js?v=1", "puzzle3.js?v=1", "puzzle4.js?v=1", "action2.js?v=1", "action3.js?v=1", "action4.js?v=1", "action5.js?v=1", "puzzle5.js?v=1", "action6.js?v=1", "action7.js?v=1", "mix1.js?v=1", "action8.js?v=1", "match3.js?v=1"];
const PRIMARY = "background:var(--lamp)!important;color:var(--lamp-ink)!important;border:0!important";

let user = null, pair = null, unsub = null, games = {}, tok = 0;
let btn = null, panel = null, ui = null, view = { t: "hub" }, cleanup = null;
let P = null, S = null;
let allGames = {}, allUnsubs = [], watchAt = 0, firstLoad = {};

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
  toast.t = setTimeout(() => { t.hidden = true; }, 4500);
}

function ref(kind) { return doc(db, "dms", pair.id, "games", kind); }

function act(label, fn, css) {
  const b = el("button", "", label);
  b.type = "button";
  b.style.cssText = "flex:1;min-width:120px;padding:10px;font-weight:700" + (css ? ";" + css : "");
  b.onclick = fn;
  return b;
}

function pending() {
  const out = [];
  if (!user) return out;
  Object.keys(allGames).forEach((pid) => {
    const e = allGames[pid];
    Object.keys(e.games).forEach((k) => {
      const g = e.games[k], m = P && P[k];
      if (!m) return;
      if (g.status === "invite") { if (g.by !== user.uid) out.push({ pid: pid, other: e.other, name: e.name, kind: k, type: "invite" }); }
      else if (g.status === "play" && m.needs(g, user.uid)) out.push({ pid: pid, other: e.other, name: e.name, kind: k, type: "turn" });
    });
  });
  return out;
}

async function startWatch() {
  if (!user) return;
  watchAt = Date.now();
  allUnsubs.forEach((u) => { try { u(); } catch (e) {} });
  allUnsubs = []; allGames = {}; firstLoad = {};
  const me = user.uid;
  let snap;
  try { snap = await getDocs(query(collection(db, "friendships"), where("members", "array-contains", me))); } catch (e) { return; }
  if (!user || user.uid !== me) return;
  snap.forEach((d) => {
    const x = d.data(), o = (x.members || []).find((m) => m !== me);
    if (!o) return;
    const pid = d.id, name = (x.names && x.names[o]) || "Arkadaş";
    allGames[pid] = { other: o, name: name, games: {} };
    firstLoad[pid] = true;
    allUnsubs.push(onSnapshot(collection(db, "dms", pid, "games"), (s) => {
      const prev = allGames[pid] ? allGames[pid].games : {}, next = {};
      s.forEach((g) => { next[g.id] = g.data(); });
      allGames[pid] = { other: o, name: name, games: next };
      if (!firstLoad[pid] && !(pair && pair.id === pid)) {
        Object.keys(next).forEach((k) => {
          const g = next[k], was = prev[k], m = P && P[k];
          if (!m) return;
          const isNew = g.status === "invite" ? g.by !== me && !(was && was.status === "invite") : g.status === "play" && m.needs(g, me) && !(was && was.status === "play" && m.needs(was, me));
          if (isNew) toast(g.status === "invite" ? "🎮 " + name + " sana " + m.label + " daveti gönderdi." : "🎮 " + name + " · " + m.label + ": sıra sende.");
        });
      }
      firstLoad[pid] = false;
      render();
    }, () => {}));
  });
  render();
}

function needs(kind) {
  const g = games[kind];
  if (!g || !user) return false;
  if (g.status === "invite") return g.by !== user.uid;
  return !!(P && P[kind] && P[kind].needs(g, user.uid));
}

function anyNeeds() { return KINDS.some(needs) || pending().length > 0; }

function refreshBtn() {
  if (!btn) return;
  btn.hidden = !user;
  const n = pending().length;
  btn.textContent = anyNeeds() ? "🎮 🔴" + (n > 1 ? n : "") : "🎮";
}

function stop() { if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; } }

/* ---------- Arkadaşla oyun işlemleri ---------- */
async function invite(kind, extra) {
  const m = P[kind];
  const d = m.start(user.uid, pair.other, extra);
  try {
    await setDoc(ref(kind), Object.assign({ kind: kind, x: user.uid, o: pair.other, by: user.uid, status: "invite", winner: "", updatedAt: serverTimestamp() }, d));
  } catch (e) { toast("Davet gönderilemedi."); }
}
async function accept(kind) {
  try { await updateDoc(ref(kind), { status: "play", updatedAt: serverTimestamp() }); }
  catch (e) { toast("Kabul edilemedi."); }
}
async function remove(kind) {
  try { await deleteDoc(ref(kind)); } catch (e) { toast("Silinemedi."); }
}

function pairCtx(kind, g, area) {
  const stamp = () => ({ updatedAt: serverTimestamp() });
  return {
    me: user.uid, name: pair.name, g: g, body: area, toast: toast, el: el,
    upd: (d) => updateDoc(ref(kind), Object.assign(stamp(), d)).catch(() => toast("Hamle gönderilemedi.")),
    tx: (fn) => runTransaction(db, async (t) => {
      const s = await t.get(ref(kind));
      if (!s.exists()) return;
      const r = fn(s.data());
      if (r) t.update(ref(kind), Object.assign(stamp(), r));
    }).catch(() => toast("Hamle gönderilemedi."))
  };
}

/* ---------- Ekranlar ---------- */
function setHead(title, showBack) {
  ui.title.textContent = title;
  ui.back.hidden = !showBack;
  ui.body.textContent = "";
}

function section(text) {
  const h = el("h3", "", text);
  ui.body.appendChild(h);
}

function listBtn(label, sub, fn, hot) {
  const b = el("button", "", "");
  b.type = "button";
  b.style.cssText = "display:flex;width:100%;justify-content:space-between;align-items:center;gap:8px;text-align:left;padding:12px;margin-bottom:8px;font-size:16px";
  if (hot) b.style.borderColor = "#e5484d";
  b.appendChild(el("span", "", label));
  if (sub) { const s = el("span", "", sub); s.style.cssText = "color:" + (hot ? "#e5484d" : "var(--mute)") + ";font-size:13px;font-weight:600"; b.appendChild(s); }
  b.onclick = fn;
  ui.body.appendChild(b);
}

async function loadSolo() {
  if (S) return S;
  const rs = await Promise.all(MODS.map((f) => import("./" + f).then((m) => m.SOLO).catch(() => ({}))));
  S = {};
  rs.forEach((r) => Object.assign(S, r));
  return S;
}

function showHub() {
  stop();
  view = { t: "hub" };
  setHead("🎮 Oyunlar", false);
  if (!S) {
    ui.body.appendChild(el("p", "", "Oyunlar yükleniyor…"));
    loadSolo().then(() => { if (panel && !panel.hidden && view.t === "hub") showHub(); });
    return;
  }
  ["Aksiyon", "Zeka"].forEach((grp) => {
    const ids = Object.keys(S).filter((id) => S[id].group === grp);
    if (!ids.length) return;
    section(grp === "Aksiyon" ? "Aksiyon (tek başına)" : "Zeka (tek başına)");
    const gr = el("div", "");
    gr.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px";
    ids.forEach((id) => {
      const b = el("button", "", S[id].icon + " " + S[id].label);
      b.type = "button";
      b.style.cssText = "padding:12px 8px;font-size:15px;text-align:left";
      b.onclick = () => showSolo(id);
      gr.appendChild(b);
    });
    ui.body.appendChild(gr);
  });
  const pend = pending();
  if (pend.length) {
    section("📩 Bekleyen oyun istekleri");
    pend.forEach((p) => {
      const m = P[p.kind];
      listBtn(m.icon + " " + m.label + " · " + p.name, p.type === "invite" ? "davet var" : "sıra sende", () => {
        if (!pair || pair.id !== p.pid) enter({ id: p.pid, other: p.other, name: p.name });
        showPair(p.kind);
      }, true);
    });
  }
  section(pair ? "Arkadaşınla: " + pair.name : "Arkadaşınla");
  if (!pair) {
    const p = el("p", "", "Arkadaşınla oynamak için Mesajlar sekmesinden bir özel sohbet (💌) aç, sonra 🎮'ye bas.");
    p.style.cssText = "color:var(--mute);font-size:14px;margin:0";
    ui.body.appendChild(p);
    return;
  }
  KINDS.forEach((k) => {
    const m = P && P[k];
    if (!m) return;
    const g = games[k];
    let sub = "";
    if (g) sub = g.status === "invite" ? (g.by === user.uid ? "davet gönderildi" : "davet var") : g.status === "play" ? (needs(k) ? "sıra sende" : "sürüyor") : "bitti";
    listBtn(m.icon + " " + m.label, sub, () => showPair(k), needs(k));
  });
}

async function showSolo(id) {
  stop();
  view = { t: "solo", id: id };
  setHead("🎮 Oyunlar", true);
  await loadSolo();
  if (!S || !S[id]) { ui.body.appendChild(el("p", "", "Oyun yüklenemedi. Sayfayı yenile.")); return; }
  if (view.t !== "solo" || view.id !== id) return;
  ui.title.textContent = S[id].icon + " " + S[id].label;
  cleanup = S[id].start(ui.body, el, act) || null;
}

function showPair(kind) {
  stop();
  view = { t: "pair", kind: kind };
  const m = P && P[kind];
  if (!pair || !m) { showHub(); return; }
  setHead(m.icon + " " + m.label + " · " + pair.name, true);
  const g = games[kind] || null, me = user.uid;
  const msg = el("p", "", "");
  msg.style.cssText = "margin:0 0 12px;font-size:16px";
  const area = el("div", "");
  area.style.marginBottom = "12px";
  const acts = el("div", "");
  acts.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  ui.body.appendChild(msg); ui.body.appendChild(area); ui.body.appendChild(acts);
  if (!g) {
    msg.textContent = m.intro(pair.name);
    const get = m.extra ? m.extra(area, toast, el) : null;
    acts.appendChild(act("Davet gönder", () => {
      const v = get ? get() : null;
      if (get && !v) return;
      invite(kind, v);
    }, PRIMARY));
  } else if (g.status === "invite") {
    if (g.by === me) {
      msg.textContent = "Davet gönderildi. " + pair.name + " kabul edince oyun başlar.";
      acts.appendChild(act("Daveti iptal et", () => remove(kind)));
    } else {
      msg.textContent = pair.name + " seninle " + m.label + " oynamak istiyor.";
      acts.appendChild(act("Kabul et", () => accept(kind), PRIMARY));
      acts.appendChild(act("Reddet", () => remove(kind)));
    }
  } else {
    msg.textContent = m.render(pairCtx(kind, g, area)) || "";
    if (g.status === "play") {
      acts.appendChild(act("Oyunu bırak", () => { if (confirm("Oyun silinsin mi?")) remove(kind); }));
    } else {
      acts.appendChild(act("Yeniden oyna", async () => {
        try { await deleteDoc(ref(kind)); } catch (e) { toast("Yeni oyun başlatılamadı."); return; }
        if (!m.extra) invite(kind, null);
      }, PRIMARY));
      acts.appendChild(act("Oyunu kapat", () => remove(kind)));
    }
  }
}

function build() {
  panel = el("div", "panel");
  panel.hidden = true;
  const sheet = el("div", "sheet");
  const head = el("div", "sh");
  const title = el("h2", "", "🎮 Oyunlar");
  head.appendChild(title);
  const side = el("div", "");
  side.style.cssText = "display:flex;gap:6px";
  const back = el("button", "", "← Oyunlar");
  back.type = "button";
  back.hidden = true;
  back.onclick = showHub;
  const x = el("button", "", "Kapat");
  x.type = "button";
  x.onclick = closePanel;
  side.appendChild(back); side.appendChild(x);
  head.appendChild(side);
  sheet.appendChild(head);
  const body = el("div", "");
  sheet.appendChild(body);
  panel.appendChild(sheet);
  panel.onclick = (e) => { if (e.target === panel) closePanel(); };
  document.body.appendChild(panel);
  ui = { title: title, back: back, body: body };
}

function closePanel() { stop(); if (panel) panel.hidden = true; }

function openPanel() {
  if (Date.now() - watchAt > 60000) startWatch();
  if (!panel) build();
  panel.hidden = false;
  showHub();
}

function render() {
  refreshBtn();
  if (!panel || panel.hidden) return;
  if (view.t === "hub") showHub();
  else if (view.t === "pair") showPair(view.kind);
}

/* ---------- Sohbet ve arkadaş takibi ---------- */
function leave() {
  tok++;
  if (unsub) { unsub(); unsub = null; }
  pair = null; games = {};
  if (panel && !panel.hidden && view.t === "pair") showHub();
  refreshBtn();
}

function enter(p) {
  if (unsub) { unsub(); unsub = null; }
  pair = p; games = Object.assign({}, (allGames[p.id] || {}).games);
  unsub = onSnapshot(collection(db, "dms", p.id, "games"), (s) => {
    const prev = games, next = {};
    s.forEach((d) => { next[d.id] = d.data(); });
    games = next;
    KINDS.forEach((k) => {
      const m = P && P[k];
      if (!m || !next[k] || !user) return;
      const g = next[k], was = prev[k];
      const wasNeed = !!was && (was.status === "invite" ? was.by !== user.uid : m.needs(was, user.uid));
      if (needs(k) && !wasNeed) {
        toast(g.status === "invite" ? "🎮 " + p.name + " sana " + m.label + " daveti gönderdi." : "🎮 " + m.label + ": sıra sende.");
      }
    });
    render();
  }, () => {});
  render();
}

async function pick() {
  const t = $("rt");
  const txt = ((t && t.textContent) || "").trim();
  if (!user || txt.indexOf("💌") !== 0) { leave(); return; }
  const name = txt.replace("💌", "").trim().replace(/^@/, "");
  if (pair && pair.name.toLowerCase() === name.toLowerCase()) return;
  const my = ++tok;
  let found = null;
  try {
    const s = await getDocs(query(collection(db, "friendships"), where("members", "array-contains", user.uid)));
    s.forEach((d) => {
      const x = d.data();
      const o = (x.members || []).find((m) => m !== user.uid);
      const n = (x.names && x.names[o]) || "";
      if (o && n.toLowerCase() === name.toLowerCase()) found = { id: d.id, other: o, name: n };
    });
  } catch (e) {}
  if (my !== tok) return;
  if (!found) { leave(); return; }
  enter(found);
}

function init() {
  const sf = $("sf"), rt = $("rt");
  if (!sf || !rt) return;
  btn = el("button", "phb", "🎮");
  btn.type = "button";
  btn.title = "Oyunlar";
  btn.hidden = true;
  const bs = sf.querySelectorAll("button");
  const send = bs[bs.length - 1];
  send.parentNode.insertBefore(btn, send);
  btn.onclick = openPanel;
  Promise.all(["./gpair.js?v=1", "./gpair2.js?v=1", "./gpair3.js?v=1", "./gpair4.js?v=1", "./gpair5.js?v=1", "./gpair6.js?v=1"].map((f) => import(f).then((m) => m.PAIR).catch(() => ({})))).then((rs) => { P = Object.assign({}, rs[0], rs[1], rs[2], rs[3], rs[4], rs[5]); render(); });
  new MutationObserver(pick).observe(rt, { childList: true, characterData: true, subtree: true });
  onAuthStateChanged(auth, (u) => {
    user = u;
    if (u) { refreshBtn(); pick(); startWatch(); } else { allUnsubs.forEach((f) => { try { f(); } catch (e) {} }); allUnsubs = []; allGames = {}; leave(); closePanel(); refreshBtn(); }
  });
}

init();
