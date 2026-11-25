// Vardiya 11: vardiya hatırlatıcısı. Vardiyalarını telefonun Takvim uygulamasına aktarır (her vardiyadan önce alarmla).
// Alarmı Takvim uygulaması çalar, bu yüzden uygulama kapalıyken de çalışır. Her şey telefonda hazırlanır, hiçbir yere gönderilmez.
const E = (t, s, x) => { const e = document.createElement(t); if (s) e.style.cssText = s; if (x != null) e.textContent = x; return e; };
const BS = "border:1px solid var(--line,#333);background:transparent;color:inherit;border-radius:12px;padding:10px 14px;font-size:15px;cursor:pointer";
const IS = "box-sizing:border-box;padding:12px;font-size:16px;border-radius:12px;border:1px solid var(--line,#333);background:transparent;color:inherit;width:100%";
const p2 = (n) => String(n).padStart(2, "0");
const mins = (s) => { const a = String(s || "").split(":"); return (+a[0] || 0) * 60 + (+a[1] || 0); };
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (l) => { let o = "", b = new TextEncoder(); while (b.encode(l).length > 70) { let k = 70; while (b.encode(l.slice(0, k)).length > 70) k--; o += l.slice(0, k) + "\r\n "; l = l.slice(k); } return o + l; };
const stamp = (d) => d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + "T" + p2(d.getHours()) + p2(d.getMinutes()) + "00";
export function events(D, from) {
  const T = {}; (D.types || []).forEach((t) => { T[t.id] = t; }); const out = [];
  Object.keys(D.days || {}).sort().forEach((k) => {
    const v = D.days[k], t = T[v && v.t]; if (!t || t.off || t.cd || !t.s || !t.e) return;
    const m = k.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return;
    const sm = mins(t.s), em = mins(t.e), dur = ((em - sm) % 1440 + 1440) % 1440 || 1440;
    const st = new Date(+m[1], +m[2] - 1, +m[3], Math.floor(sm / 60), sm % 60), en = new Date(st.getTime() + dur * 60000);
    if (en < from) return; out.push({ k: k, t: t, st: st, en: en, n: v.n || "" });
  });
  return out;
}
export function makeIcs(evs, lead, tz) {
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nobet Arasi//Vardiya//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Nöbet Arası vardiyalarım"], now = new Date(), seq = Math.floor(now.getTime() / 1000);
  const z = tz ? ";TZID=" + tz : "";
  evs.forEach((e) => {
    L.push("BEGIN:VEVENT", "UID:na-" + e.k.replace(/-/g, "") + "-" + e.t.id.replace(/[^A-Za-z0-9]/g, "") + "@nobetarasi", "DTSTAMP:" + now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "SEQUENCE:" + seq,
      "DTSTART" + z + ":" + stamp(e.st), "DTEND" + z + ":" + stamp(e.en), "SUMMARY:" + esc((e.t.ic || "🛡️") + " Vardiya: " + e.t.n), "DESCRIPTION:" + esc("Nöbet Arası\n" + e.t.s + " – " + e.t.e + (e.n ? "\n" + e.n : "")),
      "BEGIN:VALARM", "TRIGGER:-PT" + lead + "M", "ACTION:DISPLAY", "DESCRIPTION:Vardiyana " + (lead >= 60 ? lead / 60 + " saat" : lead + " dakika") + " kaldı", "END:VALARM", "END:VEVENT");
  });
  L.push("END:VCALENDAR"); return L.map(fold).join("\r\n") + "\r\n";
}
function open() {
  const ov = E("div", "position:fixed;inset:0;z-index:99999;background:var(--bg,#0f1320);color:var(--text,#eee);overflow:auto;padding:14px;font-family:inherit");
  const top = E("div", "display:flex;align-items:center;gap:10px"); const bk = E("button", BS, "← Geri"); bk.type = "button"; top.appendChild(bk); top.appendChild(E("b", "font-size:17px", "🔔 Vardiya hatırlatıcısı")); ov.appendChild(top);
  const body = E("div"); ov.appendChild(body); document.body.appendChild(ov);
  const close = () => { try { ov.remove(); } catch (e) {} window.removeEventListener("popstate", close); };
  bk.onclick = () => { close(); try { if (history.state && history.state.rm) history.back(); } catch (e) {} };
  try { history.pushState({ rm: 1, vdb: 1 }, ""); window.addEventListener("popstate", close); } catch (e) {}
  let D; try { D = JSON.parse(localStorage.getItem("na_vardiya_v1")) || {}; } catch (e) { D = {}; }
  const now = new Date(), evs = events(D, now); let lead = 60;
  body.appendChild(E("div", "margin-top:12px;font-size:14px;opacity:.9;line-height:1.55", "Vardiyalarını telefonundaki Takvim uygulamasına (Google Takvim vb.) alarmlı olarak ekler. Alarmı Takvim çalar, bu yüzden Nöbet Arası kapalıyken de çalışır."));
  const sm = E("div", "margin-top:14px;font-weight:700;font-size:16px"); body.appendChild(sm);
  body.appendChild(E("div", "margin-top:14px;font-size:14px", "Vardiyadan ne kadar önce hatırlatsın?"));
  const sl = E("select", IS + ";margin-top:6px"); [[30, "30 dakika önce"], [60, "1 saat önce"], [90, "1,5 saat önce"], [120, "2 saat önce"], [180, "3 saat önce"]].forEach((x) => sl.appendChild(new Option(x[1], x[0]))); sl.value = 60; sl.onchange = () => { lead = +sl.value; }; body.appendChild(sl);
  const go = E("button", BS + ";width:100%;margin-top:16px;background:var(--lamp,#f0c24b);color:#000;font-weight:700", "📥 Takvim dosyasını indir"); go.type = "button"; body.appendChild(go);
  const msg = E("div", "margin-top:12px;font-size:14px;line-height:1.55;min-height:20px"); body.appendChild(msg);
  if (!evs.length) { sm.textContent = "Bugünden sonra saatli vardiyan yok."; go.disabled = true; msg.textContent = "Önce Vardiya takvimine vardiya ekle (PDF, fotoğraf ya da elle). İzin ve rapor günleri hatırlatılmaz."; }
  else sm.textContent = evs.length + " vardiya hatırlatılacak (" + evs[0].k.split("-").reverse().join(".") + " – " + evs[evs.length - 1].k.split("-").reverse().join(".") + ")";
  go.onclick = () => {
    let tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    try {
      const ics = makeIcs(evs, lead, tz), a = E("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" })); a.download = "vardiyalarim.ics"; document.body.appendChild(a); a.click(); setTimeout(() => { try { a.remove(); URL.revokeObjectURL(a.href); } catch (e) {} }, 4000);
      msg.textContent = "İndirildi. Şimdi: bildirimlerden ya da Dosyalar/İndirilenler'den \"vardiyalarim.ics\" dosyasına dokun, Takvim uygulamasında \"Ekle\" de. Vardiyalarını değiştirirsen dosyayı yeniden indirip aynı şekilde aç, eski kayıtlar güncellenir. Silinen günler Takvim'den kendiliğinden silinmez.";
    } catch (e) { msg.textContent = "Dosya hazırlanamadı, tekrar dene."; }
  };
}
let pend = false;
const scan = () => {
  pend = false;
  document.querySelectorAll(".vd-act").forEach((ac) => { if (ac.querySelector("[data-rm]")) return; const b = E("button", "", "🔔 Hatırlatıcı"); b.type = "button"; b.dataset.rm = "1"; b.onclick = (e) => { e.stopPropagation(); open(); }; ac.appendChild(b); });
};
try { new MutationObserver(() => { if (!pend) { pend = true; setTimeout(scan, 200); } }).observe(document.body, { childList: true, subtree: true }); scan(); } catch (e) {}
