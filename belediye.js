import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ROOMS } from "./rooms.js?v=2";

// Belediye Güvenlik bölümü: yalnızca doğru kodu bilenler görür. Denetimi Firestore kuralları yapar.
// Odalar, diğer odalarla aynı sohbet koduyla çalışır (fotoğraf, GIF, video, şikayet, arkadaş ekleme hepsi var).
let auth, db;
const $ = (i) => document.getElementById(i);
const MUNI = [
  { id: "bel_genel", ic: "🏛️", n: "Belediye Genel", d: "Sadece belediye çalışanı güvenlikler" },
  { id: "bel_gece", ic: "🏛️", n: "Belediye Gece vardiyası", d: "Belediye güvenliği: gece nöbeti, uykusuzluk, soğuk" },
  { id: "bel_maas", ic: "🏛️", n: "Belediye Maaş ve haklar", d: "Belediye güvenliği: maaş, fazla mesai, izin, sözleşme" },
  { id: "bel_moral", ic: "🏛️", n: "Belediye Moral köşesi", d: "Belediye güvenliği: dertleş, rahatla, destek ol" }
];
let user = null, nick = "", isAdm = false, member = false, btn = null, panel = null;

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
  toast.t = setTimeout(() => { t.hidden = true; }, 4000);
}

const st = el("style");
st.textContent = ".room.muni{border-left-color:var(--lamp);flex:none}.mnp{position:fixed;left:0;right:0;top:0;height:100dvh;background:var(--bg);color:var(--text);z-index:35;display:flex;flex-direction:column}.mnh{display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;border-bottom:3px solid var(--lamp);background:var(--panel)}.mnh h2{flex:1;margin:0;font:700 20px var(--head);color:var(--lamp)}.mnh button{background:none;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:16px}.mnb{flex:1;min-height:0;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}.mnb p{margin:0;color:var(--mute)}.mnr{display:block;width:100%;text-align:left;background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--lamp);color:var(--text);border-radius:10px;padding:12px;cursor:pointer;font-size:16px}.mnr b{display:block}.mnr span{color:var(--mute);font-size:14px}.mng{margin:auto 0;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}.mng input{width:100%;max-width:320px;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:16px}.mng button{background:var(--lamp);color:var(--lamp-ink);border:0;border-radius:10px;padding:10px 22px;font:700 18px var(--head);cursor:pointer}.mng p{max-width:320px}.mna{padding:10px 12px;background:var(--panel);border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:6px}.mna div{display:flex;gap:8px}.mna input{flex:1;min-width:0;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:8px 10px}.mna button{background:var(--lamp);color:var(--lamp-ink);border:0;border-radius:8px;padding:0 14px;font-weight:700;cursor:pointer}.mna span{color:var(--mute);font-size:13px}";
document.head.appendChild(st);

function rerender() { const q = $("q"); if (q) q.dispatchEvent(new Event("input")); }

// Üye olunca Belediye odaları ana oda listesine eklenir (genel odaların hemen arkasına)
function enable() {
  if (ROOMS.some((r) => r.id === MUNI[0].id)) return;
  ROOMS.splice(3, 0, ...MUNI);
  rerender();
}
function disable() {
  for (let i = ROOMS.length - 1; i >= 0; i--) if (/^bel_/.test(ROOMS[i].id)) ROOMS.splice(i, 1);
  rerender();
}

async function probe() {
  try { await getDocs(query(collection(db, "rooms", "bel_genel", "messages"), limit(1))); return true; }
  catch (e) { return false; }
}

function mount() {
  const h = $("rooms");
  if (!h || !user) return;
  if (!btn) {
    btn = el("button", "room muni");
    btn.type = "button";
    btn.appendChild(el("b", "", "🏛️ Belediye Güvenlik"));
    btn.appendChild(el("span", "", "Sadece belediye çalışanı güvenlikler"));
    btn.onclick = openPanel;
  }
  if (h.firstChild !== btn) h.insertBefore(btn, h.firstChild);
}

function closePanel() { if (panel) { panel.remove(); panel = null; } }

function openRoomById(r) {
  closePanel();
  const want = r.ic + " " + r.n;
  const b = Array.from(document.querySelectorAll("#rooms .room b")).find((x) => x.textContent === want);
  if (b && b.parentNode) b.parentNode.click();
}

function openPanel() {
  closePanel();
  panel = el("div", "mnp");
  const head = el("div", "mnh");
  const back = el("button", "", "←"); back.type = "button"; back.onclick = closePanel;
  head.appendChild(back);
  head.appendChild(el("h2", "", "🏛️ Belediye Güvenlik"));
  const adm = el("div", "mna"); adm.hidden = true;
  const cin = el("input"); cin.placeholder = "Giriş kodu (en az 4 karakter)"; cin.autocomplete = "off"; cin.maxLength = 40;
  if (isAdm) {
    const g = el("button", "", "⚙️"); g.type = "button";
    g.onclick = async () => {
      adm.hidden = !adm.hidden;
      if (!adm.hidden) { try { const s = await getDoc(doc(db, "config", "muni")); if (s.exists()) cin.value = s.data().code || ""; } catch (e) {} }
    };
    head.appendChild(g);
  }
  const crow = el("div"); const csv = el("button", "", "Kaydet"); csv.type = "button";
  csv.onclick = async () => {
    const v = cin.value.trim();
    if (v.length < 4) { toast("Kod en az 4 karakter olmalı."); return; }
    try { await setDoc(doc(db, "config", "muni"), { code: v }); toast("Kod kaydedildi."); }
    catch (e) { toast("Kod kaydedilemedi. Kuralları yayınladın mı?"); }
  };
  crow.appendChild(cin); crow.appendChild(csv);
  adm.appendChild(el("span", "", "Giriş kodu. Değiştirince herkes yeni kodu yeniden girmek zorunda kalır."));
  adm.appendChild(crow);
  const body = el("div", "mnb");
  panel.appendChild(head); panel.appendChild(adm); panel.appendChild(body);
  document.body.appendChild(panel);

  function list() {
    body.innerHTML = "";
    body.appendChild(el("p", "", "Odalara gir:"));
    MUNI.forEach((r) => {
      const b = el("button", "mnr"); b.type = "button";
      b.appendChild(el("b", "", r.ic + " " + r.n));
      b.appendChild(el("span", "", r.d));
      b.onclick = () => openRoomById(r);
      body.appendChild(b);
    });
  }

  function gate() {
    body.innerHTML = "";
    const g = el("div", "mng");
    g.appendChild(el("p", "", "Bu bölüm yalnızca belediyede çalışan özel güvenlik görevlilerine açıktır. Giriş kodunu bilen arkadaşından iste."));
    const ci = el("input"); ci.placeholder = "Giriş kodu"; ci.autocomplete = "off"; ci.maxLength = 40;
    const go = el("button", "", "Gir"); go.type = "button";
    go.onclick = async () => {
      const v = ci.value.trim();
      if (!v) return;
      go.disabled = true;
      try {
        await setDoc(doc(db, "muniMembers", user.uid), { nick: nick, code: v, createdAt: serverTimestamp() });
        member = await probe();
        if (member) { enable(); list(); } else toast("Giriş yapılamadı. Biraz sonra tekrar dene.");
      } catch (e) { toast("Kod yanlış veya bu bölüm henüz açılmadı."); }
      go.disabled = false;
    };
    g.appendChild(ci); g.appendChild(go);
    body.appendChild(g);
  }

  if (member) list(); else gate();
}

async function start(u) {
  user = u;
  try { const s = await getDoc(doc(db, "users", u.uid)); nick = s.exists() ? s.data().nick : ""; } catch (e) {}
  try { const s = await getDoc(doc(db, "config", "admin")); isAdm = s.exists() && s.data().uid === u.uid; } catch (e) { isAdm = false; }
  mount();
  member = await probe();
  if (member) enable(); else disable();
}

function init() {
  const h = $("rooms");
  if (h) new MutationObserver(mount).observe(h, {
