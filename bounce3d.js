// Zıpla Top 3D: sonsuz bölüm, kolaydan zora
import { game } from "./b3d-eng.js?v=1";
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function put(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
function bounce(body, el, act) {
  let inst = null, level = 1, unlocked = Math.max(1, best("nb_zt3"));
  const info = el("p", ""); info.style.cssText = "margin:0 0 4px;font-size:15px"; body.appendChild(info);
  const sub = el("p", ""); sub.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)"; body.appendChild(sub);
  const box = el("div", ""); body.appendChild(box);
  const ctl = el("div", ""); ctl.style.cssText = "display:flex;gap:8px;max-width:360px;margin:0 auto 8px"; body.appendChild(ctl);
  function btn(label, v) {
    const b = el("button", "", label); b.type = "button";
    b.style.cssText = "flex:1;padding:22px 4px;font-weight:800;font-size:22px;touch-action:none;user-select:none;min-width:0";
    const on = (e) => { e.preventDefault(); if (inst) { inst.start(); inst.setDir(v); } };
    const off = () => { if (inst) inst.setDir(0); };
    b.onpointerdown = on; b.onpointerup = off; b.onpointerleave = off; b.onpointercancel = off;
    b.oncontextmenu = (e) => e.preventDefault();
    return b;
  }
  ctl.appendChild(btn("◀", -1)); ctl.appendChild(btn("▶", 1));
  const row = el("div", ""); row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap"; body.appendChild(row);
  const bS = (n) => best("nb_zt3_s" + n);
  function head() {
    const s = bS(level);
    info.textContent = "Bölüm " + level + " • " + inst.theme;
    sub.textContent = "Açık bölüm: " + unlocked + "   Yıldız: " + (s ? "★".repeat(s) + "☆".repeat(3 - s) : "-");
    nextB.style.display = unlocked > level ? "" : "none";
  }
  function load(n) {
    if (inst) inst.destroy();
    box.textContent = "";
    level = Math.max(1, Math.min(n, unlocked));
    inst = game({
      level: level,
      onFinish: (r) => {
        if (r.stars > bS(level)) put("nb_zt3_s" + level, r.stars);
        if (level + 1 > unlocked) { unlocked = level + 1; put("nb_zt3", unlocked); }
        head();
      }
    });
    box.appendChild(inst.root);
    head();
  }
  const bPrev = act("◀", () => load(level - 1)), bNext = act("▶", () => load(level + 1)), retry = act("Baştan", () => load(level)), nextB = act("Sonraki bölüm ▶", () => load(level + 1));
  [bPrev, bNext, retry, nextB].forEach((b) => { b.style.minWidth = "0"; row.appendChild(b); });
  const hint = el("p", "", "Top kendiliğinden zıplayarak ilerler. Parmağını ekranda kaydır ya da ◀ ▶ düğmelerine bas: topu sağa sola yönlendir. Kırmızı dikenlerden ve mavi sandıklardan kaç, turuncu hareketli sandıklara dikkat et. Sarı çizgili zıplatma zemini seni boşluğun üstünden uçurur. Altınları topla. 3 canın var; mavi çizgi kontrol noktasıdır. Bölümler bitmez, giderek zorlaşır. Bölümü ne kadar az can kaybederek bitirirsen o kadar çok yıldız alırsın.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px"; body.appendChild(hint);
  load(1);
  return () => { if (inst) inst.destroy(); };
}
export const SOLO = { bounce3d: { group: "Aksiyon", icon: "🔴", label: "Zıpla Top 3D", start: bounce } };
