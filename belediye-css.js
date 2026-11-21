import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { CSS } from "./belediye-css.js?v=1";

// Belediye Güvenlik paneli: kod girişi, oda listesi, yönetici kod ayarı
const st = document.createElement("style");
st.textContent = CSS;
document.head.appendChild(st);

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

let panel = null;
export function closePanel() { if (panel) { panel.remove(); panel = null; } }

export function openPanel(X) {
  closePanel();
  panel = el("div", "mnp");
  const head = el("div", "mnh");
  const back = el("button", "", "←"); back.type = "button"; back.onclick = closePanel;
  head.appendChild(back);
  head.appendChild(el("h2", "", "🏛️ Belediye Güvenlik"));
  const adm = el("div", "mna"); adm.hidden = true;
  const cin = el("input"); cin.placeholder = "Giriş kodu (en az 4 karakter)"; cin.autocomplete = "off"; cin.maxLength = 40;
  if (X.isAdm()) {
    const g = el("button", "", "⚙️"); g.type = "button";
    g.onclick = async () => {
      adm.hidden = !adm.hidden;
      if (!adm.hidden) { try { const s = await getDoc(doc(X.db, "config", "muni")); if (s.exists()) cin.value = s.data().code || ""; } catch (e) {} }
    };
    head.appendChild(g);
  }
  const crow = el("div"); const csv = el("button", "", "Kaydet"); csv.type = "button";
  csv.onclick = async () => {
    const v = cin.value.trim();
    if (v.length < 4) { X.toast("Kod en az 4 karakter olmalı."); return; }
    try { await setDoc(doc(X.db, "config", "muni"), { code: v }); X.toast("Kod kaydedildi."); }
    catch (e) { X.toast("Kod kaydedilemedi. Kuralları yayınladın mı?"); }
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
    X.rooms.forEach((r) => {
      const b = el("button", "mnr"); b.type = "button";
      b.appendChild(el("b", "", r.ic + " " + r.n));
      b.appendChild(el("span", "", r.d));
      b.onclick = () => { closePanel(); X.openRoom(r); };
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
        await setDoc(doc(X.db, "muniMembers", X.uid()), { nick: X.nick(), code: v, createdAt: serverTimestamp() });
        if (await X.join()) list(); else X.toast("Giriş yapılamadı. Biraz sonra tekrar dene.");
      } catch (e) { X.toast("Kod yanlış veya bu bölüm henüz açılmadı."); }
      go.disabled = false;
    };
    g.appendChild(ci); g.appendChild(go);
    body.appendChild(g);
  }

  if (X.member()) list(); else gate();
}
