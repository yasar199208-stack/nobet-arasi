// Vardiya 12: maaş ve mesai hesaplayıcı (tahmini). Takvimindeki vardiya saatlerinden fazla mesaiyi hesaplar. Girdiğin tutarlar yalnızca bu telefonda kalır.
const E = (t, s, x) => { const e = document.createElement(t); if (s) e.style.cssText = s; if (x != null) e.textContent = x; return e; };
const BS = "border:1px solid var(--line,#333);background:transparent;color:inherit;border-radius:12px;padding:10px 14px;font-size:15px;cursor:pointer";
const IS = "box-sizing:border-box;padding:12px;font-size:16px;border-radius:12px;border:1px solid var(--line,#333);background:transparent;color:inherit;width:100%";
const p2 = (n) => String(n).padStart(2, "0");
const mins = (s) => { const a = String(s || "").split(":"); return (+a[0] || 0) * 60 + (+a[1] || 0); };
const MN = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const KEY = "na_vardiya_maas";
export function calc(D, y, m, c) {
  const T = {}; (D.types || []).forEach((t) => { T[t.id] = t; }); const pre = y + "-" + p2(m + 1) + "-"; let hours = 0, nightH = 0, days = 0;
  Object.keys(D.days || {}).forEach((k) => {
    if (k.indexOf(pre) !== 0) return; const v = D.days[k], t = T[v && v.t]; if (!t || t.off || t.cd || !t.s || !t.e) return;
    const sm = mins(t.s), d = (((mins(t.e) - sm) % 1440) + 1440) % 1440 || 1440; hours += d / 60; days++; if ((sm >= 1200 || sm < 300) && d < 1440) nightH += d / 60;
  });
  const norm = c.norm > 0 ? c.norm : 0, sal = c.sal > 0 ? c.sal : 0, rate = norm ? sal / norm : 0, ot = Math.max(0, hours - norm);
  const otPay = ot * rate * (c.mult > 0 ? c.mult : 1.5), nPay = nightH * rate * ((c.night > 0 ? c.night : 0) / 100);
  return { hours: hours, days: days, nightH: nightH, norm: norm, ot: ot, missing: Math.max(0, norm - hours), rate: rate, otPay: otPay, nPay: nPay, total: sal + otPay + nPay, sal: sal };
}
const tl = (n) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
const hr = (n) => (Math.round(n * 10) / 10).toLocaleString("tr-TR") + " saat";
function open() {
  const ov = E("div", "position:fixed;inset:0;z-index:99999;background:var(--bg,#0f1320);color:var(--text,#eee);overflow:auto;padding:14px;font-family:inherit");
  const top = E("div", "display:flex;align-items:center;gap:10px"); const bk = E("button", BS, "← Geri"); bk.type = "button"; top.appendChild(bk); top.appendChild(E("b", "font-size:17px", "💰 Maaş ve mesai hesabı")); ov.appendChild(top);
  const body = E("div"); ov.appendChild(body); document.body.appendChild(ov);
  const close = () => { try { ov.remove(); } catch (e) {} window.removeEventListener("popstate", close); };
  bk.onclick = () => { close(); try { if (history.state && history.state.ml) history.back(); } catch (e) {} };
  try { history.pushState({ ml: 1, vdb: 1 }, ""); window.addEventListener("popstate", close); } catch (e) {}
  let D; try { D = JSON.parse(localStorage.getItem("na_vardiya_v1")) || {}; } catch (e) { D = {}; }
  let c = { sal: 0, norm: D.target || 195, mult: 1.5, night: 0 }; try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) c = Object.assign(c, s); } catch (e) {}
  const now = new Date(); let y = now.getFullYear(), m = now.getMonth();
  body.appendChild(E("div", "margin-top:12px;font-size:13px;opacity:.85;line-height:1.5", "Takvimindeki vardiya saatlerinden tahmini maaşını ve fazla mesaini hesaplar. Bu bir tahmindir, gerçek bordro işverenin hesabına göre değişir. Girdiğin tutarlar sadece bu telefonda saklanır."));
  const nav = E("div", "display:flex;align-items:center;gap:8px;margin-top:14px"); const pv = E("button", BS, "◀"), nx = E("button", BS, "▶"), mt = E("b", "flex:1;text-align:center;font-size:16px"); pv.type = nx.type = "button"; nav.appendChild(pv); nav.appendChild(mt); nav.appendChild(nx); body.appendChild(nav);
  const fld = (lab, key, hint, step) => { body.appendChild(E("div", "margin-top:14px;font-size:14px", lab)); const i = E("input", IS + ";margin-top:6px"); i.type = "number"; i.inputMode = "decimal"; i.step = step || "any"; i.min = 0; i.value = c[key] || ""; i.placeholder = hint; i.oninput = () => { c[key] = parseFloat(String(i.value).replace(",", ".")) || 0; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} draw(); }; body.appendChild(i); };
  fld("Aylık maaşın (TL, elindeki ya da brüt, hangisini girersen sonuç da o)", "sal", "örn. 25000");
  fld("Aylık normal çalışma saati (bunun üstü fazla mesai sayılır)", "norm", "örn. 195");
  fld("Fazla mesai katsayısı (yasal en az 1,5)", "mult", "1,5");
  fld("Gece çalışma zammı % (yoksa 0 bırak)", "night", "0");
  const out = E("div", "margin-top:16px"); body.appendChild(out);
  const row = (a, b, bold) => { const r = E("div", "display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line,#333);font-size:15px;" + (bold ? "font-weight:700;font-size:17px" : "")); r.appendChild(E("span", "", a)); r.appendChild(E("span", "text-align:right", b)); return r; };
  const draw = () => {
    mt.textContent = MN[m] + " " + y; out.innerHTML = ""; const r = calc(D, y, m, c), card = E("div", "border:1px solid var(--line,#333);border-radius:14px;padding:6px 14px");
    card.appendChild(row("Çalışılan gün", r.days + " gün")); card.appendChild(row("Toplam çalışma", hr(r.hours))); card.appendChild(row("Normal saat", hr(r.norm)));
    card.appendChild(row("Fazla mesai", hr(r.ot))); if (r.missing > 0) card.appendChild(row("Normal saate kalan", hr(r.missing)));
    card.appendChild(row("Gece çalışma", hr(r.nightH))); card.appendChild(row("Saatlik ücret", r.norm && r.sal ? tl(r.rate) : "maaş ve saat gir"));
    card.appendChild(row("Maaş", tl(r.sal))); card.appendChild(row("Fazla mesai ücreti", tl(r.otPay))); if (c.night > 0) card.appendChild(row("Gece zammı", tl(r.nPay)));
    card.appendChild(row("Tahmini toplam", tl(r.total), true)); out.appendChild(card);
    if (!r.days) out.appendChild(E("div", "margin-top:10px;font-size:13px;opacity:.8", "Bu ayda saatli vardiya yok. Takvimine vardiya ekleyince hesap dolar."));
    out.appendChild(E("div", "margin-top:10px;margin-bottom:24px;font-size:12px;opacity:.7;line-height:1.5", "Resmi tatil, hafta tatili çalışması ve vergi/SGK kesintileri hesaba katılmaz. Saatlik ücret = maaş ÷ normal saat."));
  };
  pv.onclick = () => { m--; if (m < 0) { m = 11; y--; } draw(); }; nx.onclick = () => { m++; if (m > 11) { m = 0; y++; } draw(); }; draw();
}
let pend = false;
const scan = () => {
  pend = false;
  document.querySelectorAll(".vd-act").forEach((ac) => { if (ac.querySelector("[data-ml]")) return; const b = E("button", "", "💰 Maaş hesabı"); b.type = "button"; b.dataset.ml = "1"; b.onclick = (e) => { e.stopPropagation(); open(); }; ac.appendChild(b); });
};
try { new MutationObserver(() => { if (!pend) { pend = true; setTimeout(scan, 200); } }).observe(document.body, { childList: true, subtree: true }); scan(); } catch (e) {}
