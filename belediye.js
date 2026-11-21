import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Belediye Güvenlik bölümü: yalnızca doğru kodu bilenler girer. Denetimi Firestore kuralları yapar.
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);
let user = null, nick = "", isAdm = false, btn = null, panel = null, unsub = null, last = 0;

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
function hm(d) { return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }); }

const st = el("style");
st.textContent = ".room.muni{border-left-color:var(--lamp);flex:none}.mnp{position:fixed;left:0;right:0;top:0;height:100dvh;background:var(--bg);color:var(--text);z-index:35;display:flex;flex-direction:column}.mnh{display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;border-bottom:3px solid var(--lamp);background:var(--panel)}.mnh h2{flex:1;margin:0;font:700 20px var(--head);color:var(--lamp)}.mnh button{background:none;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:16px}.mnb{flex:1;min-height:0;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px}.mnm{max-width:min(560px,86%);align-self:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px 12px}.mnm.me{align-self:flex-end;background:var(--mine)}.mnm b{display:block;font-size:14px;color:var(--lamp)}.mnm p{margin:2px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}.mnm small{color:var(--mute);font-size:12px}.mnm button{background:none;border:0;color:var(--mute);cursor:pointer;margin-left:8px}.mnf{display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line);background:var(--panel)}.mnf input{flex:1;min-width:0;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:16px}.mnf button{background:var(--lamp);color:var(--lamp-ink);border:0;border-radius:10px;padding:0 16px;font:700 18px var(--head);cursor:pointer}.mng{margin:auto 0;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}.mng input{width:100%;max-width:320px;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:16px}.mng button{background:var(--lamp);color:var(--lamp-ink);border:0;border-radius:10px;padding:10px 22px;font:700 18px var(--head);cursor:pointer}.mng p{margin:0;color:var(--mute);max-width:320px}.mna{padding:10px 12px;background:var(--panel);border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:6px}.mna div{display:flex;gap:8px}.mna input{flex:1;min-width:0;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:8px 10px}.mna button{background:var(--lamp);color:var(--lamp-ink);border:0;border-radius:8px;padding:0 14px;font-weight:700;cursor:pointer}.mna span{color:var(--mute);font-size:13px}";
document.head.appendChild(st);

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

function stopL() { if (unsub) { unsub(); unsub = null; } }
function closePanel() { stopL(); if (panel) { panel.remove(); panel = null; } }

function openPanel() {
  closePanel();
  panel = el("div", "mnp");
  const head = el("div", "mnh");
  const back = el("button", "", "←"); back.type = "button"; back.onclick = closePanel;
  head.appendChild(back);
  head.appendChild(el("h2", "", "🏛️ Belediye Güvenlik"));
  const adm = el("div", "mna"); adm.hidden = true;
  if (isAdm) {
    const g = el("button", "", "⚙️"); g.type = "button";
    g.onclick = async () => {
      adm.hidden = !adm.hidden;
      if (!adm.hidden) { try { const s = await getDoc(doc(db, "config", "muni")); if (s.exists()) cin.value = s.data().code || ""; } catch (e) {} }
    };
    head.appendChild(g);
  }
  const cin = el("input"); cin.placeholder = "Giriş kodu (en az 4 karakter)"; cin.autocomplete = "off"; cin.maxLength = 40;
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
  const form = el("form", "mnf"); form.hidden = true;
  const inp = el("input"); inp.placeholder = "Mesaj yaz…"; inp.maxLength = 400; inp.autocomplete = "off";
  const send = el("button", "", "Gönder"); send.type = "submit";
  form.appendChild(inp); form.appendChild(send);
  panel.appendChild(head); panel.appendChild(adm); panel.appendChild(body); panel.appendChild(form);
  document.body.appendChild(panel);

  const col = collection(db, "muniRooms", "genel", "messages");

  function gate() {
    stopL();
    form.hidden = true;
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
        listen();
      } catch (e) { toast("Kod yanlış veya bu bölüm henüz açılmadı."); }
      go.disabled = false;
    };
    g.appendChild(ci); g.appendChild(go);
    body.appendChild(g);
  }

  function render(s) {
    body.innerHTML = "";
    form.hidden = false;
    const rows = s.docs.map((d) => Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" }))).reverse();
    if (!rows.length) body.appendChild(el("p", "", "Henüz mesaj yok. İlk mesajı sen yaz."));
    rows.forEach((x) => {
      const m = el("div", "mnm" + (x.uid === user.uid ? " me" : ""));
      m.appendChild(el("b", "", x.nick || "?"));
      m.appendChild(el("p", "", x.text || ""));
      const sm = el("small", "", x.createdAt && x.createdAt.toDate ? hm(x.createdAt.toDate()) : "");
      if (x.uid === user.uid || isAdm) {
        const del = el("button", "", "🗑"); del.type = "button";
        del.onclick = async () => {
          if (!confirm("Bu mesaj silinsin mi?")) return;
          try { await deleteDoc(doc(db, "muniRooms", "genel", "messages", x.id)); } catch (e) { toast("Silinemedi."); }
        };
        sm.appendChild(del);
      }
      m.appendChild(sm);
      body.appendChild(m);
    });
    body.scrollTop = body.scrollHeight;
  }

  function listen() {
    stopL();
    unsub = onSnapshot(query(col, orderBy("createdAt", "desc"), limit(100)), render, (e) => {
      if (e && e.code === "permission-denied") gate(); else toast("Bağlanılamadı.");
    });
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const t = inp.value.trim();
    if (!t) return;
    if (Date.now() - last < 1500) { toast("Biraz yavaş yaz."); return; }
    try { const f = await import("./filter.js?v=3"); if (f.isBad(t)) { toast("Mesajında uygunsuz ifade var, gönderilmedi."); return; } } catch (x) {}
    last = Date.now();
    inp.value = "";
    try { await addDoc(col, { uid: user.uid, nick: nick, text: t.slice(0, 400), createdAt: serverTimestamp() }); }
    catch (x) { inp.value = t; toast(x && x.code === "permission-denied" ? "Gönderilemedi. Engellenmiş olabilirsin veya kodu yeniden girmen gerekir." : "Gönderilemedi."); }
  };

  listen();
}

async function start(u) {
  user = u;
  try { const s = await getDoc(doc(db, "users", u.uid)); nick = s.exists() ? s.data().nick : ""; } catch (e) {}
  try { const s = await getDoc(doc(db, "config", "admin")); isAdm = s.exists() && s.data().uid === u.uid; } catch (e) { isAdm = false; }
  mount();
}

function init() {
  const h = $("rooms");
  if (h) new MutationObserver(mount).observe(h, { childList: true });
  onAuthStateChanged(auth, (u) => {
    closePanel();
    if (!u) { user = null; nick = ""; isAdm = false; if (btn) { btn.remove(); } return; }
    start(u);
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
