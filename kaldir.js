// Mesajlar sekmesinde bir özel sohbeti listeden kaldırma (konuşmayı silmez, sadece gizler).
// Her özel mesaj satırının sağında ✕ olur. Yeni mesaj gelirse ya da sohbet tekrar açılırsa satır geri gelir.
const KEY = "na_dm_gizli";
const get = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a.filter((x) => typeof x === "string").slice(0, 500) : []; } catch (e) { return []; } };
const set = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, 500))); } catch (e) {} };
const note = (t) => { try { const e = document.createElement("div"); e.style.cssText = "position:fixed;left:12px;right:12px;bottom:24px;z-index:99999;padding:12px 14px;border-radius:12px;background:rgba(20,24,36,.96);color:#fff;font-size:14px;text-align:center;border:1px solid rgba(255,255,255,.2)"; e.textContent = t; document.body.appendChild(e); setTimeout(() => { try { e.remove(); } catch (x) {} }, 5000); } catch (x) {} };
try {
  const st = document.createElement("style");
  st.textContent = ".room.dmhid{display:none!important}.room.dmk{position:relative!important;padding-right:52px!important}.dmx{position:absolute!important;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;line-height:30px;text-align:center;border-radius:50%;font-size:16px;cursor:pointer;opacity:.9;border:1px solid #666;background:rgba(0,0,0,.25);color:inherit;box-sizing:border-box;z-index:5}";
  document.head.appendChild(st);
} catch (e) {}
const HEART = "\u{1F48C}";
const keyOf = (el) => {
  const b = el.querySelector("b"); if (!b) return "";
  const c = b.cloneNode(true); c.querySelectorAll(".ud").forEach((x) => x.remove());
  const t = c.textContent.trim();
  if (t.indexOf(HEART) < 0) return "";
  return t.split(HEART).join("").split(String.fromCharCode(65039)).join("").trim();
};
const ign = {};
const closedNow = () => document.body.classList.contains("chat-closed");
function fixMore() {
  const m = document.getElementById("mmore"), rooms = document.getElementById("rooms"); if (!m || !rooms) return;
  if (m.textContent.indexOf("Tüm konuşmaları göster") !== 0) return;
  let c = 0, u = 0, h = 0;
  rooms.querySelectorAll(".room").forEach((el) => { if (!keyOf(el)) return; c++; if (el.querySelector(".ud")) u++; if (el.classList.contains("dmhid")) h++; });
  const n = c - u - h;
  if (n <= 0) { if (!m.hidden) m.hidden = true; } else { const t = "Tüm konuşmaları göster (" + n + ")"; if (m.textContent !== t) m.textContent = t; }
}
function hide(el, k) {
  const list = get(); if (list.indexOf(k) < 0) list.push(k); set(list); ign[k] = Date.now() + 1200;
  if (el.getAttribute("aria-current") === "true") { const cx = document.getElementById("cx"); if (cx && !cx.hidden) cx.click(); }
  process();
  note("Sohbet listeden kaldırıldı. Yeni mesaj gelirse ya da 👥 Arkadaşlar → Mesaj ile açarsan geri gelir.");
}
let dmCount = 0;
function process() {
  try {
    const rooms = document.getElementById("rooms"); if (!rooms) return;
    const list = get(); let ch = false; dmCount = 0;
    rooms.querySelectorAll(".room").forEach((el) => {
      const k = keyOf(el); if (!k) return;
      dmCount++;
      if (!el.querySelector(".dmx")) {
        const x = document.createElement("span"); x.className = "dmx"; x.setAttribute("role", "button"); x.setAttribute("aria-label", "Listeden kaldır"); x.textContent = "✕";
        const stop = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
        x.onclick = (ev) => { stop(ev); hide(el, k); };
        x.onpointerdown = stop; x.ontouchstart = (ev) => { ev.stopPropagation(); };
        el.classList.add("dmk"); el.appendChild(x);
      }
      const i = list.indexOf(k);
      if (i >= 0) {
        const back = el.querySelector(".ud") || (el.getAttribute("aria-current") === "true" && !closedNow() && !(ign[k] > Date.now()));
        if (back) { list.splice(i, 1); ch = true; }
      }
      el.classList.toggle("dmhid", list.indexOf(k) >= 0);
    });
    if (ch) set(list);
    fixMore();
  } catch (e) { note("Kaldır hatası: " + (e && e.message)); }
}
let busy = false;
const sched = () => { if (busy) return; busy = true; (window.requestAnimationFrame || setTimeout)(() => { busy = false; process(); }); };
let n = 0, r0 = false, m0 = false;
const iv = setInterval(() => {
  try {
    const r = document.getElementById("rooms");
    if (r && !r0) { r0 = true; new MutationObserver(sched).observe(r, { childList: true, subtree: true }); }
    const mm = document.getElementById("mmore");
    if (mm && !m0) { m0 = true; new MutationObserver(sched).observe(mm, { attributes: true, attributeFilter: ["hidden"], childList: true, characterData: true, subtree: true }); }
    process();
  } catch (e) { note("Kaldır hatası: " + (e && e.message)); }
  if (++n > 400) clearInterval(iv);
}, 500);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sched(); });
// Tanı: adresin sonuna #kaldir eklenirse ✕ düğmesinin durumunu gösterir (Mesajlar sekmesinde bekle)
try { if (location.hash.indexOf("kaldir") >= 0) setTimeout(() => { try { const ch = [...document.querySelectorAll("#rooms .room")].find((e) => keyOf(e)); if (!ch) { note("Kaldır tanı: DM satırı yok"); return; } const x = ch.querySelector(".dmx"); const cr = ch.getBoundingClientRect(), cs = getComputedStyle(ch); let m = "Tanı: chip " + Math.round(cr.width) + "x" + Math.round(cr.height) + " ov=" + cs.overflow + " disp=" + cs.display + " pos=" + cs.position + " | "; if (!x) m += "dmx YOK"; else { const r = x.getBoundingClientRect(), xs = getComputedStyle(x); m += "dmx " + Math.round(r.left) + "," + Math.round(r.top) + " " + Math.round(r.width) + "x" + Math.round(r.height) + " disp=" + xs.display + " vis=" + xs.visibility + " op=" + xs.opacity; } const e = document.createElement("div"); e.style.cssText = "position:fixed;left:8px;right:8px;top:80px;z-index:99999;padding:10px;border-radius:10px;background:#000;color:#0f0;font-size:13px"; e.textContent = m; document.body.appendChild(e); setTimeout(() => e.remove(), 30000); } catch (er) { note("Tanı hata: " + er.message); } }, 9000); } catch (e) {}
