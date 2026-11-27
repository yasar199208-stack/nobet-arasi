// Bildirimler: uygulama kapalıyken telefona bildirim (Firebase FCM + Cloudflare Worker).
import { ROOMS } from "./rooms.js?v=2";
const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const VAPID = "BJ3Yel-JbXKW-dJA_SZYhjMmtC5hl-HgKKGtGxVex3-C-qearNfF03YsP6ZV9KxPTyd15hhMPYlYzv8puHRqHEI";
const WORKER = "";
const E = (t, s, x) => { const e = document.createElement(t); if (s) e.style.cssText = s; if (x != null) e.textContent = x; return e; };
const note = (t) => { const e = E("div", "position:fixed;left:12px;right:12px;bottom:24px;z-index:99999;padding:12px 14px;border-radius:12px;background:rgba(20,24,36,.96);color:#fff;font-size:14px;text-align:center;border:1px solid rgba(255,255,255,.2)", t); document.body.appendChild(e); setTimeout(() => { try { e.remove(); } catch (x) {} }, 5000); };
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; };
const fold = (s) => String(s).toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const MAXR = 10;
let A, Au, F, Msg, db, auth, app, me = null, nick = "";
let pref = { ann: true, dm: true, rooms: [] }, tokId = "", tok = "";

const supported = () => "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
const perm = () => (supported() ? Notification.permission : "denied");
const isOn = () => perm() === "granted" && !!tokId;

async function sha(s) {
  const b = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 24);
}
async function api(path, body) {
  if (!WORKER) throw new Error("Bildirim sunucusu henüz kurulmadı.");
  const idt = await auth.currentUser.getIdToken();
  const r = await fetch(WORKER + path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + idt }, body: JSON.stringify(body || {}), keepalive: true });
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error(j.error || "Sunucu hatası (" + r.status + ")");
  return j;
}
async function getTok() {
  const reg = await navigator.serviceWorker.ready;
  const m = Msg.getMessaging(app);
  return Msg.getToken(m, { vapidKey: VAPID, serviceWorkerRegistration: reg });
}
async function save() {
  if (!tok) return;
  tokId = await sha(tok);
  await F.setDoc(F.doc(db, "pushTokens", tokId), { uid: me, token: tok, ann: !!pref.ann, dm: !!pref.dm, rooms: pref.rooms.slice(0, MAXR), updatedAt: F.serverTimestamp() });
  ls("na_push_id", tokId);
  try { await api("/sub", { id: tokId, token: tok }); } catch (e) { note("Bildirim kaydı: " + e.message); }
}
async function enable() {
  if (!Msg) { note("Bildirim modülü yüklenemedi, sayfayı yenile."); return false; }
  if (!supported()) { note("Bu tarayıcı bildirimi desteklemiyor."); return false; }
  let p = Notification.permission;
  if (p === "default") p = await Notification.requestPermission();
  if (p !== "granted") { note("Bildirim izni verilmedi. Telefon ayarlarından uygulamanın bildirimlerini açabilirsin."); return false; }
  try { tok = await getTok(); } catch (e) { note("Bildirim adresi alınamadı: " + (e && e.message ? e.message : e)); return false; }
  if (!tok) { note("Bildirim adresi alınamadı."); return false; }
  await save();
  return true;
}
async function disable() {
  try { if (tok) await api("/unsub", { id: tokId, token: tok }); } catch (e) {}
  try { if (tokId) await F.deleteDoc(F.doc(db, "pushTokens", tokId)); } catch (e) {}
  try { await Msg.deleteToken(Msg.getMessaging(app)); } catch (e) {}
  tok = ""; tokId = ""; ls("na_push_id", null);
}
async function load() {
  const id = ls("na_push_id");
  if (!id || perm() !== "granted") return;
  try {
    const s = await F.getDoc(F.doc(db, "pushTokens", id));
    if (!s.exists() || s.data().uid !== me) { ls("na_push_id", null); return; }
    const d = s.data(); tokId = id; tok = d.token;
    pref = { ann: d.ann !== false, dm: d.dm !== false, rooms: Array.isArray(d.rooms) ? d.rooms.filter((x) => typeof x === "string").slice(0, MAXR) : [] };
    const cur = await getTok();
    if (cur && cur !== tok) { tok = cur; await save(); }
  } catch (e) {}
}

/* ---------- Ayar paneli ---------- */
function sheet(title) {
  const p = E("div"); p.className = "panel";
  const s = E("div"); s.className = "sheet";
  const h = E("div"); h.className = "sh";
  const x = E("button", "", "Kapat"); x.type = "button";
  const close = () => { try { p.remove(); } catch (e) {} };
  x.onclick = close; p.onclick = (ev) => { if (ev.target === p) close(); };
  h.appendChild(E("h2", "", title)); h.appendChild(x); s.appendChild(h); p.appendChild(s); document.body.appendChild(p);
  return { p: p, s: s, close: close };
}
const BTN = "width:100%;padding:12px;margin-top:8px;text-align:left;font-size:15px";
function openPanel() {
  if (!me) return;
  const w = sheet("\u{1F514} Bildirimler");
  const body = E("div"); w.s.appendChild(body);
  const draw = () => {
    body.textContent = "";
    if (!supported()) { body.appendChild(E("p", "color:var(--mute,#999);line-height:1.4", "Bu tarayıcı ya da uygulama bildirimi desteklemiyor.")); return; }
    const p = perm(), on = isOn();
    body.appendChild(E("p", "margin:0 0 6px;color:var(--mute,#999);font-size:14px;line-height:1.4", "Uygulama kapalıyken bile telefonuna bildirim gelir. Bildirimde mesajın içeriği görünmez, sadece kimin yazdığı görünür."));
    if (p === "denied") { body.appendChild(E("p", "color:var(--danger,#e0786a);line-height:1.4", "Bildirim izni kapalı. Telefon ayarlarından Nöbet Arası'nın bildirimlerini açman gerekiyor.")); return; }
    const main = E("button", BTN + ";background:" + (on ? "" : "var(--lamp,#f0c24b)") + ";color:" + (on ? "" : "var(--lamp-ink,#000)") + ";font-weight:700", on ? "\u{1F514} Bildirimler AÇIK (kapatmak için dokun)" : "\u{1F515} Bildirimleri aç"); main.type = "button";
    main.onclick = async () => { main.disabled = true; if (on) { await disable(); note("Bildirimler kapatıldı."); } else if (await enable()) note("Bildirimler açıldı."); draw(); };
    body.appendChild(main);
    if (!on) return;
    const tg = (label, key) => { const b = E("button", BTN, label + ": " + (pref[key] ? "AÇIK" : "KAPALI")); b.type = "button"; b.onclick = async () => { pref[key] = !pref[key]; await save().catch(() => {}); draw(); }; body.appendChild(b); };
    tg("\u{1F4E2} Duyurular", "ann"); tg("\u{1F48C} Özel mesajlar", "dm");
    body.appendChild(E("h3", "", "Odalar (en fazla " + MAXR + ")"));
    body.appendChild(E("p", "margin:0 0 6px;color:var(--mute,#999);font-size:13px", "Seçtiğin odalarda biri yazınca bildirim alırsın."));
    const chips = E("div", "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px");
    pref.rooms.forEach((id) => { const r = ROOMS.find((x) => x.id === id); if (!r) return; const c = E("button", "padding:6px 10px", r.ic + " " + r.n + " ✕"); c.type = "button"; c.onclick = async () => { pref.rooms = pref.rooms.filter((x) => x !== id); await save().catch(() => {}); draw(); }; chips.appendChild(c); });
    if (!pref.rooms.length) chips.appendChild(E("span", "color:var(--mute,#999);font-size:13px", "Henüz oda seçmedin."));
    body.appendChild(chips);
    const q = E("input", "box-sizing:border-box;width:100%;padding:10px;font-size:16px;border-radius:10px;border:1px solid var(--line,#333);background:var(--bg,#111);color:var(--text,inherit)"); q.type = "search"; q.placeholder = "Oda ara…";
    const list = E("div", "max-height:220px;overflow:auto;margin-top:6px");
    const fill = () => {
      list.textContent = ""; const k = fold(q.value);
      ROOMS.filter((r) => pref.rooms.indexOf(r.id) < 0 && (!k || fold(r.n).indexOf(k) >= 0)).slice(0, 40).forEach((r) => {
        const b = E("button", "display:block;width:100%;text-align:left;padding:10px;margin-top:4px", r.ic + " " + r.n); b.type = "button";
        b.onclick = async () => { if (pref.rooms.length >= MAXR) { note("En fazla " + MAXR + " oda seçebilirsin."); return; } pref.rooms.push(r.id); await save().catch(() => {}); draw(); };
        list.appendChild(b);
      });
    };
    q.oninput = fill; fill(); body.appendChild(q); body.appendChild(list);
    const t = E("button", BTN + ";margin-top:14px", "\u{1F9EA} Bana deneme bildirimi gönder"); t.type = "button";
    t.onclick = async () => { t.disabled = true; try { await api("/notify", { kind: "test" }); note("Deneme bildirimi gönderildi. Uygulamayı kapatıp bekle."); } catch (e) { note("Gönderilemedi: " + e.message); } t.disabled = false; };
    body.appendChild(t);
  };
  draw();
}

/* ---------- Bildirim tetikleri ---------- */
function notify(body) { if (!WORKER || !auth || !auth.currentUser) return; api("/notify", body).catch(() => {}); }
window.addEventListener("na-push", (ev) => { const k = ev.detail && ev.detail.kind; if (k === "ann" || k === "fb") notify({ kind: k }); });
document.addEventListener("submit", (ev) => {
  if (!ev.target || ev.target.id !== "sf") return;
  const t = (document.getElementById("rt") || {}).textContent || "";
  setTimeout(() => {
    if (t.indexOf("\u{1F48C}") === 0) { const nm = t.replace("\u{1F48C}", "").replace("@", "").trim(); if (nm) notify({ kind: "dm", toNick: nm }); return; }
    const r = ROOMS.find((x) => x.ic + " " + x.n === t.trim());
    if (r) notify({ kind: "room", room: r.id });
  }, 1200);
}, true);

/* ---------- Düğme ve başlangıç ---------- */
function mount() {
  const w = document.querySelector(".mtabs"); if (!w) return false;
  if (!w.querySelector(".pshtab")) { const b = E("button", "", "\u{1F514} Bildirim"); b.className = "pshtab"; b.type = "button"; b.onclick = openPanel; w.appendChild(b); }
  return true;
}
async function init() {
  let n = 0; while (!(A = await import(FB + "firebase-app.js")).getApps().length) { if (++n > 60) return; await new Promise((r) => setTimeout(r, 500)); }
  Au = await import(FB + "firebase-auth.js"); F = await import(FB + "firebase-firestore.js");
  app = A.getApps()[0]; auth = Au.getAuth(app); db = F.getFirestore(app);
  let k = 0; const iv = setInterval(() => { if (mount() || ++k > 80) clearInterval(iv); }, 500);
  try { Msg = await import(FB + "firebase-messaging.js"); } catch (e) { Msg = null; }
  Au.onAuthStateChanged(auth, async (u) => {
    if (!u) { me = null; nick = ""; tok = ""; tokId = ""; return; }
    me = u.uid;
    if (Msg && supported()) load().catch(() => {});
  });
}
init().catch(() => {});
