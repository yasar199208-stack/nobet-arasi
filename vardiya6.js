// Vardiya takibi 6. parça: Vardiya odalarında geri tuşu ve görüntülü konuşma.
import { ROOMS } from "./rooms.js?v=2";
import("./vardiya8.js?v=1").catch(() => {});
import("./vardiya9.js?v=1").catch(() => {});
import("./vardiya10.js?v=1").catch(() => {});
const AL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const hb = async (s) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("nobetarasi-vd|" + s)));
// Görüntülü konuşma: Vardiya odasındaki herkes aynı görüntülü odaya düşer (kod oda kimliğinden üretilir). Mevcut "📹 Görüntü" sistemini kullanır.
const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const tip = (m) => { const t = document.getElementById("toast"); if (!t) return; t.textContent = m; t.hidden = false; clearTimeout(tip.t); tip.t = setTimeout(() => { t.hidden = true; }, 4000); };
async function vcStart(room) {
  try {
    if (window.__vcS && window.__vcS()) { tip("Zaten bir görüntülü görüşmedesin."); return; }
    const tab = document.querySelector(".vctab"); if (!tab) { tip("Görüntülü konuşma henüz yüklenmedi, biraz sonra tekrar dene."); return; }
    const A = await import(FB + "firebase-app.js"), Au = await import(FB + "firebase-auth.js"), F = await import(FB + "firebase-firestore.js");
    const app = A.getApps()[0], u = Au.getAuth(app).currentUser; if (!u) { tip("Önce giriş yap."); return; }
    const db = F.getFirestore(app), code = Array.from((await hb("vc|" + room.id)).slice(0, 5)).map((x) => AL[x % 32]).join(""), ref = F.doc(db, "vrooms", code);
    if (!(await F.getDoc(ref)).exists()) await F.setDoc(ref, { host: u.uid, at: F.serverTimestamp(), topic: room.n.replace(/ 🔒.*$/, "").slice(0, 30) });
    tab.click();
    setTimeout(() => { const i = document.querySelector('.vcp input[placeholder="ODA KODU"]'), j = Array.from(document.querySelectorAll(".vcp .vgo")).find((x) => /katıl/i.test(x.textContent)); if (i && j) { i.value = code; j.click(); } else tip("Görüntü paneli açılamadı."); }, 150);
  } catch (e) { tip("Görüntülü oda açılamadı. Tekrar dene."); }
}
// Geri tuşu: her odada üstte. Vardiya odasında "← Vardiya", diğerlerinde "← Geri" (önceki odaya). Özel mesajda uygulamanın kendi "← Odalar" tuşu var.
(function () {
  let b = null, vb = null, n = 0, cur = "", hist = [], going = false;
  const isVd = (t) => ROOMS.some((r) => r.v && r.ic + " " + r.n === t);
  const find = (t) => Array.from(document.querySelectorAll("#rooms .room")).find((x) => { const y = x.querySelector("b"); return y && y.textContent === t; });
  const upd = () => {
    const rt = document.getElementById("rt"); if (!b || !rt) return; const t = rt.textContent;
    if (t !== cur) { if (!going && cur) { hist.push(cur); if (hist.length > 20) hist.shift(); } going = false; cur = t; }
    const vd = isVd(t); if (vb) vb.hidden = !vd; b.hidden = t.indexOf("💌") === 0; b.textContent = vd ? "← Vardiya" : hist.length ? "← Geri" : "← Odalar";
  };
  const back = () => {
    if (isVd(cur)) { const v = document.querySelector(".vdtab"); if (v) v.click(); return; }
    while (hist.length) {
      const t = hist.pop(); let x = find(t);
      if (!x) { const q = document.getElementById("q"); if (q && q.value) { q.value = ""; q.dispatchEvent(new Event("input")); x = find(t); } }
      if (x) { going = true; x.click(); return; }
    }
    const r = document.getElementById("rooms"); if (r && r.scrollIntoView) r.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  const push = () => { try { history.pushState({ vdb: 1 }, ""); } catch (e) {} };
  let armed = false;
  window.addEventListener("popstate", (ev) => {
    if (ev.state && ev.state.vdb) return;
    const ov = document.querySelector(".vd .vd-h .vd-ib"); if (ov) { ov.click(); push(); return; }
    if (isVd(cur) || hist.length) { push(); back(); return; }
    if (!armed) {
      armed = true; push(); const d = document.createElement("div"); d.textContent = "Çıkmak için tekrar geri bas";
      d.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#222;color:#fff;padding:10px 16px;border-radius:20px;font-size:14px;z-index:99999"; document.body.appendChild(d);
      setTimeout(() => { armed = false; d.remove(); }, 2500);
    }
  });
  const init = () => {
    const top = document.querySelector(".top"), t = document.getElementById("rt"); if (!top || !t) return false;
    b = document.createElement("button"); b.type = "button"; b.hidden = true;
    b.style.cssText = "flex:none;background:none;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:5px 10px;cursor:pointer;font-size:14px";
    b.onclick = back; top.insertBefore(b, top.firstChild);
    vb = document.createElement("button"); vb.type = "button"; vb.hidden = true; vb.textContent = "📹 Görüntülü"; vb.style.cssText = b.style.cssText;
    vb.onclick = () => { const r = ROOMS.find((x) => x.v && x.ic + " " + x.n === cur); if (r) vcStart(r); }; top.insertBefore(vb, b.nextSibling);
    new MutationObserver(upd).observe(t, { childList: true, subtree: true, characterData: true }); upd(); push(); return true;
  };
  const iv = setInterval(() => { if (init() || ++n > 60) clearInterval(iv); }, 300);
})();
