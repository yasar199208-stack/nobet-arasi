// 👍 Tepki (oda + özel), ✍️ Yazıyor… ve ✔✔ Görüldü (sadece özel sohbet)
import { doc, collection, updateDoc, setDoc, onSnapshot, deleteField, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Kural dosyasıyla aynı anahtarlar
const RX = [
  ["like", "👍"], ["love", "❤️"], ["haha", "😂"], ["rofl", "🤣"], ["inlove", "😍"], ["hug", "🤗"],
  ["wow", "😮"], ["shock", "😱"], ["mind", "🤯"], ["think", "🤔"], ["eyes", "👀"], ["roll", "🙄"],
  ["sad", "😢"], ["cry", "😭"], ["broken", "💔"], ["angry", "😡"], ["huff", "😤"], ["sleep", "😴"],
  ["fire", "🔥"], ["clap", "👏"], ["party", "🎉"], ["celeb", "🥳"], ["hundred", "💯"], ["star", "⭐"],
  ["pray", "🙏"], ["strong", "💪"], ["ok", "👌"], ["deal", "🤝"], ["raise", "🙌"], ["dislike", "👎"],
  ["cool", "😎"], ["angel", "😇"], ["crown", "👑"], ["police", "👮"], ["siren", "🚨"], ["tea", "☕"]
];
const RXMAP = Object.fromEntries(RX);

let C = null, room = null;
let picker = null, pickTarget = null;
let typingEl = null, typingTimer = 0, lastTypingSent = 0;
let unsubState = null, firstState = true, prevTyping = 0, otherSeen = 0, otherId = "";
let lastSeenMsg = "", lastMsgs = [];
const shown = new Set(); // zıplama sadece yeni tepkide olsun
let firstRender = true;

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

export function initEtk(ctx) {
  C = ctx;
  if (document.getElementById("etk-pick")) return;
  const st = document.createElement("style");
  st.textContent =
    ".etk-rx{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}" +
    ".etk-chip{display:inline-flex;align-items:center;gap:4px;background:rgba(127,150,180,.14);border:1px solid var(--line);color:var(--text);border-radius:999px;padding:2px 9px;font-size:14px;cursor:pointer;line-height:1.5}" +
    ".etk-chip.etk-me{border-color:var(--lamp);background:rgba(240,194,75,.18)}" +
    ".etk-chip b{font-size:12px;font-weight:700;color:var(--mute)}" +
    ".etk-pick{position:fixed;left:50%;bottom:calc(130px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:70;background:linear-gradient(160deg,#1f3350,#14213a);border:2px solid var(--lamp);border-radius:22px;padding:10px;display:grid;grid-template-columns:repeat(6,1fr);gap:4px;width:min(348px,94vw);box-shadow:0 0 0 4px rgba(240,194,75,.15),0 14px 34px rgba(0,0,0,.6);animation:etkpop .28s cubic-bezier(.2,1.6,.4,1)}" +
    "@keyframes etkpop{from{opacity:0;transform:translateX(-50%) translateY(24px) scale(.7)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}" +
    ".etk-pick button{background:none;border:0;font-size:30px;line-height:1;padding:7px 0;border-radius:14px;cursor:pointer;transition:transform .12s ease,background .12s ease}" +
    ".etk-pick button:active{transform:scale(1.45)}" +
    ".etk-pick button.etk-me{background:rgba(240,194,75,.3);box-shadow:inset 0 0 0 2px var(--lamp)}" +
    ".etk-boom{position:fixed;left:50%;top:45%;z-index:80;font-size:96px;line-height:1;pointer-events:none;transform:translate(-50%,-50%);animation:etkboom .9s ease-out forwards;filter:drop-shadow(0 6px 18px rgba(0,0,0,.5))}" +
    "@keyframes etkboom{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.25)}60%{opacity:1;transform:translate(-50%,-60%) scale(1)}100%{opacity:0;transform:translate(-50%,-120%) scale(.8)}}" +
    ".etk-chip.etk-new{animation:etkchip .35s cubic-bezier(.2,1.6,.4,1)}" +
    "@keyframes etkchip{from{transform:scale(.4)}to{transform:scale(1)}}" +
    ".etk-back{position:fixed;inset:0;z-index:69}" +
    ".etk-typing{padding:4px 20px;color:var(--lamp);font-size:13px;font-style:italic;min-height:0}" +
    ".etk-typing i{display:inline-block;animation:etkdot 1.2s infinite}" +
    ".etk-typing i:nth-child(2){animation-delay:.2s}.etk-typing i:nth-child(3){animation-delay:.4s}" +
    "@keyframes etkdot{0%,60%,100%{opacity:.2}30%{opacity:1}}" +
    ".etk-tick{margin-left:5px;font-size:12px;letter-spacing:-3px;color:var(--mute)}" +
    ".etk-tick.etk-read{color:#4fc3f7}" +
    ".msg{-webkit-touch-callout:none}";
  document.head.appendChild(st);

  // Tepki seçici
  picker = el("div", "etk-pick");
  picker.id = "etk-pick";
  picker.hidden = true;
  const back = el("div", "etk-back");
  back.hidden = true;
  back.onclick = closePicker;
  RX.forEach(([k, e]) => {
    const b = el("button", "", e);
    b.type = "button";
    b.dataset.k = k;
    b.onclick = () => { const t = pickTarget; closePicker(); if (t) toggle(t.m, t.room, k); };
    picker.appendChild(b);
  });
  document.body.appendChild(back);
  document.body.appendChild(picker);
  picker._back = back;

  // Yazıyor… satırı
  typingEl = el("div", "etk-typing");
  typingEl.hidden = true;
  const log = document.getElementById("log");
  if (log && log.parentNode) log.parentNode.insertBefore(typingEl, log.nextSibling);

  const inp = document.getElementById("in");
  if (inp) inp.addEventListener("input", onInput);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") markSeen(lastMsgs); });
}

/* ---------- Tepki ---------- */
function openPicker(m, r) {
  pickTarget = { m: m, room: r };
  const me = C.user() && C.user().uid;
  const mine = m.rx && me ? m.rx[me] : "";
  picker.querySelectorAll("button").forEach((b) => b.classList.toggle("etk-me", b.dataset.k === mine));
  picker.hidden = false;
  picker._back.hidden = false;
  if (navigator.vibrate) navigator.vibrate(25);
}

function closePicker() {
  if (!picker) return;
  picker.hidden = true;
  picker._back.hidden = true;
  pickTarget = null;
}

async function toggle(m, r, k) {
  const u = C.user();
  if (!u || !m || !m.id || !RXMAP[k]) return;
  const cur = m.rx && m.rx[u.uid];
  const upd = {};
  upd["rx." + u.uid] = cur === k ? deleteField() : k;
  if (cur !== k) boom(RXMAP[k]);
  try {
    await updateDoc(doc(C.msgCol(r), m.id), upd);
  } catch (e) {
    C.toast(e && e.code === "permission-denied" ? "İşlem reddedildi. Firestore kurallarını güncelledin mi?" : "Tepki gönderilemedi.");
  }
}

// Ekranın ortasında büyük emoji patlaması
function boom(e) {
  const b = el("div", "etk-boom", e);
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 950);
  if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
}

// Mesajın altına tepkiler + uzun basınca seçici + "😊 Tepki" düğmesi
export function addReactions(msgEl, m, r) {
  if (!C || !m || !m.id) return;
  const me = C.user() && C.user().uid;
  const rx = m.rx && typeof m.rx === "object" ? m.rx : {};
  const count = {};
  Object.keys(rx).forEach((uid) => { const k = rx[uid]; if (RXMAP[k]) count[k] = (count[k] || 0) + 1; });
  const keys = RX.map((x) => x[0]).filter((k) => count[k]);
  if (keys.length) {
    const box = el("div", "etk-rx");
    keys.forEach((k) => {
      const sig = m.id + ":" + k + ":" + count[k];
      const fresh = !firstRender && !shown.has(sig);
      shown.add(sig);
      const c = el("button", "etk-chip" + (me && rx[me] === k ? " etk-me" : "") + (fresh ? " etk-new" : ""));
      c.type = "button";
      c.appendChild(document.createTextNode(RXMAP[k]));
      c.appendChild(el("b", "", String(count[k])));
      c.onclick = () => toggle(m, r, k);
      box.appendChild(c);
    });
    const acts = msgEl.querySelector(".acts");
    if (acts) msgEl.insertBefore(box, acts); else msgEl.appendChild(box);
  }

  let a = msgEl.querySelector(".acts");
  if (!a) { a = el("div", "acts"); msgEl.appendChild(a); }
  const b = el("button", "", "😊 Tepki");
  b.type = "button";
  b.onclick = () => openPicker(m, r);
  a.insertBefore(b, a.children[1] || null);

  // Uzun basma
  let tm = 0, sx = 0, sy = 0, fired = false;
  const cancel = () => { clearTimeout(tm); tm = 0; };
  msgEl.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, a, input, textarea, video, iframe, .smx-track")) return;
    fired = false; sx = e.clientX; sy = e.clientY;
    cancel();
    tm = setTimeout(() => { fired = true; openPicker(m, r); }, 480);
  });
  msgEl.addEventListener("pointermove", (e) => { if (tm && Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 12) cancel(); });
  msgEl.addEventListener("pointerup", cancel);
  msgEl.addEventListener("pointercancel", cancel);
  msgEl.addEventListener("contextmenu", (e) => {
    if (e.target.closest("a, img, video")) return;
    e.preventDefault();
    if (!fired) { cancel(); fired = true; openPicker(m, r); }
  });
}

/* ---------- Yazıyor… ve Görüldü (özel sohbet) ---------- */
function stateRef(uid) {
  return doc(C.db, "dms", room.pairId, "state", uid);
}

function hideTyping() {
  clearTimeout(typingTimer);
  if (typingEl) typingEl.hidden = true;
}

function showTyping() {
  if (!typingEl || !room || !room.dm) return;
  typingEl.textContent = "";
  typingEl.appendChild(document.createTextNode("✍️ " + (room.n ? room.n.slice(1) : "Arkadaşın") + " yazıyor"));
  ["i", "i", "i"].forEach(() => typingEl.appendChild(el("i", "", ".")));
  typingEl.hidden = false;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(hideTyping, 6000);
}

function onInput() {
  if (!room || !room.dm || !C.user()) return;
  const v = document.getElementById("in").value;
  if (!v.trim()) return;
  const now = Date.now();
  if (now - lastTypingSent < 3000) return;
  lastTypingSent = now;
  setDoc(stateRef(C.user().uid), { typing: serverTimestamp() }, { merge: true }).catch(() => {});
}

export function setEtkRoom(r) {
  room = r;
  closePicker();
  hideTyping();
  if (unsubState) { unsubState(); unsubState = null; }
  firstState = true; prevTyping = 0; otherSeen = 0; lastSeenMsg = ""; lastMsgs = [];
  firstRender = true;
  otherId = r && r.dm ? r.other : "";
  if (!r || !r.dm || !C.user()) return;
  unsubState = onSnapshot(collection(C.db, "dms", r.pairId, "state"), (s) => {
    let seenChanged = false;
    s.docs.forEach((d) => {
      if (d.id !== otherId) return;
      const x = d.data({ serverTimestamps: "estimate" });
      const ty = x.typing && x.typing.toMillis ? x.typing.toMillis() : 0;
      const se = x.seen && x.seen.toMillis ? x.seen.toMillis() : 0;
      if (ty > prevTyping) { if (!firstState) showTyping(); prevTyping = ty; }
      if (se !== otherSeen) { otherSeen = se; seenChanged = true; }
    });
    firstState = false;
    if (seenChanged && C.refresh) C.refresh();
  }, () => {});
}

// Mesaj listesi her değiştiğinde app.js çağırır
export function onMsgs(list) {
  lastMsgs = list || [];
  setTimeout(() => { firstRender = false; }, 0);
  if (!room || !room.dm) return;
  const last = lastMsgs[lastMsgs.length - 1];
  if (last && last.uid === otherId) hideTyping();
  markSeen(lastMsgs);
}

function markSeen(list) {
  if (!room || !room.dm || !C.user() || document.visibilityState !== "visible") return;
  let newest = null;
  for (let i = list.length - 1; i >= 0; i--) { if (list[i].uid !== C.user().uid) { newest = list[i]; break; } }
  if (!newest || newest.id === lastSeenMsg) return;
  lastSeenMsg = newest.id;
  setDoc(stateRef(C.user().uid), { seen: serverTimestamp() }, { merge: true }).catch(() => { lastSeenMsg = ""; });
}

// Kendi mesajının saatinin yanına ✔ ya da ✔✔
export function seenMark(m) {
  if (!room || !room.dm) return null;
  const read = otherSeen && m.at && m.at.getTime() <= otherSeen;
  const s = el("span", "etk-tick" + (read ? " etk-read" : ""), read ? "✔✔" : "✔");
  s.title = read ? "Görüldü" : "Gönderildi";
  return s;
}
