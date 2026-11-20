import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, query, where, getDocs, onSnapshot, setDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Özel mesajda arkadaşla XOX. Oyun tek belgede tutulur: dms/<çift>/games/xox
// Firebase uygulaması başlatılana kadar bekle
for (let i = 0; i < 150 && !getApps().length; i++) await new Promise((r) => setTimeout(r, 200));
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

let user = null, pair = null, ref = null, unsub = null, game = null, tok = 0;
let btn = null, panel = null, ui = null;

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

// "X", "O", "draw" ya da "" (oyun sürüyor)
function result(b) {
  for (const l of LINES) {
    if (b[l[0]] !== "-" && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return b[l[0]];
  }
  return b.indexOf("-") < 0 ? "draw" : "";
}

async function invite() {
  if (!pair || !user) return;
  try {
    await setDoc(ref, { board: "---------", x: user.uid, o: pair.other, turn: user.uid, status: "invite", winner: "", by: user.uid, updatedAt: serverTimestamp() });
  } catch (e) { toast("Davet gönderilemedi."); }
}

async function accept() {
  if (!game) return;
  try { await updateDoc(ref, { status: "play", turn: game.x, updatedAt: serverTimestamp() }); }
  catch (e) { toast("Kabul edilemedi."); }
}

async function remove() {
  try { await deleteDoc(ref); } catch (e) { toast("Silinemedi."); }
}

async function rematch() {
  try { await deleteDoc(ref); } catch (e) { toast("Yeni oyun başlatılamadı."); return; }
  invite();
}

async function move(i) {
  const g = game;
  if (!g || !user || g.status !== "play" || g.turn !== user.uid || g.board[i] !== "-") return;
  const mark = g.x === user.uid ? "X" : "O";
  const b = g.board.slice(0, i) + mark + g.board.slice(i + 1);
  const r = result(b);
  const data = { board: b, updatedAt: serverTimestamp() };
  if (r) { data.status = "done"; data.turn = ""; data.winner = r === "draw" ? "draw" : user.uid; }
  else data.turn = g.x === user.uid ? g.o : g.x;
  try { await updateDoc(ref, data); } catch (e) { toast("Hamle gönderilemedi."); }
}

function needsMe() {
  return !!game && !!user && ((game.status === "invite" && game.by !== user.uid) || (game.status === "play" && game.turn === user.uid));
}

function act(label, fn, cls) {
  const b = el("button", "", label);
  b.type = "button";
  b.style.cssText = "flex:1;min-width:120px;padding:10px;font-weight:700";
  if (cls) b.style.cssText += ";" + cls;
  b.onclick = fn;
  return b;
}

function render() {
  if (!btn) return;
  btn.textContent = needsMe() ? "🎮 🔴" : "🎮";
  if (!panel || panel.hidden || !pair || !user) return;
  const g = game, me = user.uid;
  ui.title.textContent = "🎮 XOX · " + pair.name;
  ui.acts.textContent = "";
  let msg = "";
  if (!g) {
    msg = "Henüz oyun yok. " + pair.name + " ile XOX oynamak için davet gönder.";
    ui.acts.appendChild(act("Davet gönder", invite, "background:var(--lamp)!important;color:var(--lamp-ink)!important;border:0!important"));
  } else if (g.status === "invite") {
    if (g.by === me) {
      msg = "Davet gönderildi. " + pair.name + " kabul edince oyun başlar.";
      ui.acts.appendChild(act("Daveti iptal et", remove));
    } else {
      msg = pair.name + " seninle XOX oynamak istiyor.";
      ui.acts.appendChild(act("Kabul et", accept, "background:var(--lamp)!important;color:var(--lamp-ink)!important;border:0!important"));
      ui.acts.appendChild(act("Reddet", remove));
    }
  } else if (g.status === "play") {
    const mark = g.x === me ? "✕" : "◯";
    msg = g.turn === me ? "Sıra sende. Sen: " + mark : "Sıra " + pair.name + " oyuncusunda. Sen: " + mark;
    ui.acts.appendChild(act("Oyunu bırak", () => { if (confirm("Oyun silinsin mi?")) remove(); }));
  } else {
    msg = g.winner === me ? "Kazandın! 🎉" : g.winner === "draw" ? "Berabere." : "Kaybettin. " + pair.name + " kazandı.";
    ui.acts.appendChild(act("Yeniden oyna", rematch, "background:var(--lamp)!important;color:var(--lamp-ink)!important;border:0!important"));
    ui.acts.appendChild(act("Oyunu kapat", remove));
  }
  ui.msg.textContent = msg;
  ui.grid.hidden = !g || g.status === "invite";
  const can = !!g && g.status === "play" && g.turn === me;
  for (let i = 0; i < 9; i++) {
    const c = ui.cells[i], ch = g ? g.board[i] : "-";
    c.textContent = ch === "X" ? "✕" : ch === "O" ? "◯" : "";
    c.disabled = !can || ch !== "-";
  }
}

function build() {
  panel = el("div", "panel");
  panel.hidden = true;
  const sheet = el("div", "sheet");
  const head = el("div", "sh");
  const title = el("h2", "", "🎮 XOX");
  head.appendChild(title);
  const x = el("button", "", "Kapat");
  x.type = "button";
  x.onclick = () => { panel.hidden = true; };
  head.appendChild(x);
  sheet.appendChild(head);
  const msg = el("p", "", "");
  msg.style.cssText = "margin:0 0 12px;font-size:16px";
  sheet.appendChild(msg);
  const grid = el("div", "");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px";
  const cells = [];
  for (let i = 0; i < 9; i++) {
    const c = el("button", "", "");
    c.type = "button";
    c.style.cssText = "height:88px;font-size:44px;font-weight:700;line-height:1;padding:0;color:var(--lamp)";
    c.onclick = () => move(i);
    grid.appendChild(c);
    cells.push(c);
  }
  sheet.appendChild(grid);
  const acts = el("div", "");
  acts.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  sheet.appendChild(acts);
  panel.appendChild(sheet);
  panel.onclick = (e) => { if (e.target === panel) panel.hidden = true; };
  document.body.appendChild(panel);
  ui = { title: title, msg: msg, grid: grid, cells: cells, acts: acts };
}

function openPanel() {
  if (!panel) build();
  panel.hidden = false;
  render();
}

function leave() {
  tok++;
  if (unsub) { unsub(); unsub = null; }
  pair = null; game = null; ref = null;
  if (btn) btn.hidden = true;
  if (panel) panel.hidden = true;
}

function enter(p) {
  if (unsub) { unsub(); unsub = null; }
  pair = p; game = null;
  ref = doc(db, "dms", p.id, "games", "xox");
  btn.hidden = false;
  unsub = onSnapshot(ref, (s) => {
    const prev = game;
    game = s.exists() ? s.data() : null;
    if (game && user && game.status === "invite" && game.by !== user.uid && (!prev || prev.status !== "invite")) {
      toast("🎮 " + p.name + " sana XOX daveti gönderdi.");
    }
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
  btn.title = "Arkadaşınla XOX oyna";
  btn.hidden = true;
  const bs = sf.querySelectorAll("button");
  const send = bs[bs.length - 1];
  send.parentNode.insertBefore(btn, send);
  btn.onclick = openPanel;
  new MutationObserver(pick).observe(rt, { childList: true, characterData: true, subtree: true });
  onAuthStateChanged(auth, (u) => {
    user = u;
    if (u) pick(); else leave();
  });
}

init();
