// Vardiya 13: yedekleme. Vardiya takvimini, arkadaşlarını, telsiz kodlarını ve ayarlarını tek dosyaya yedekler, istediğinde geri yükler.
// Her şey telefonda yapılır, dosya hiçbir yere gönderilmez.
const E = (t, s, x) => { const e = document.createElement(t); if (s) e.style.cssText = s; if (x != null) e.textContent = x; return e; };
const BS = "border:1px solid var(--line,#333);background:transparent;color:inherit;border-radius:12px;padding:10px 14px;font-size:15px;cursor:pointer";
const KEYS = ["na_vardiya_v1", "na_telsiz_v1", "na_vardiya_tel", "na_vardiya_odalar", "na_vardiya_ad", "na_vardiya_maas"], BIG = "na_vardiya_grup_v1";
const p2 = (n) => String(n).padStart(2, "0");
const J = (s) => { try { const o = JSON.parse(s); return o && typeof o === "object" ? o : null; } catch (e) { return null; } };
export function makeBackup(get, withGroups) {
  const data = {}; KEYS.concat(withGroups ? [BIG] : []).forEach((k) => { const v = get(k); if (typeof v === "string" && v) data[k] = v; });
  return { app: "nobet-arasi", v: 1, at: new Date().toISOString(), data: data };
}
export function check(b) {
  if (!b || b.app !== "nobet-arasi" || !b.data || typeof b.data !== "object") return null;
  const d = {}; Object.keys(b.data).forEach((k) => { if ((KEYS.indexOf(k) >= 0 || k === BIG) && typeof b.data[k] === "string" && b.data[k].length < 4000000) d[k] = b.data[k]; });
  const v = J(d.na_vardiya_v1 || ""); return { data: d, days: v && v.days ? Object.keys(v.days).length : 0, friends: v && Array.isArray(v.fr) ? v.fr.length : 0, tel: !!d.na_telsiz_v1, big: !!d[BIG] };
}
export function restore(get, set, d, merge) {
  Object.keys(d).forEach((k) => {
    if (!merge) { set(k, d[k]); return; }
    const cur = get(k); if (!cur) { set(k, d[k]); return; }
    if (k === "na_vardiya_v1") {
      const a = J(cur) || {}, b = J(d[k]) || {}; a.types = a.types || []; a.days = a.days || {}; a.fr = a.fr || [];
      (b.types || []).forEach((t) => { if (!a.types.some((x) => x.id === t.id)) a.types.push(t); });
      Object.keys(b.days || {}).forEach((x) => { if (!a.days[x]) a.days[x] = b.days[x]; });
      (b.fr || []).forEach((f) => { const g = a.fr.find((x) => x.id === f.id); if (!g) a.fr.push(f); else { g.days = g.days || {}; Object.keys(f.days || {}).forEach((x) => { if (!g.days[x]) g.days[x] = f.days[x]; }); } });
      if (!a.target) a.target = b.target; set(k, JSON.stringify(a));
    } else if (k === "na_telsiz_v1") {
      const a = J(cur) || {}, b = J(d[k]) || {}; if (!a.my && b.my) a.my = b.my; a.ad = (a.ad || []).concat((b.ad || []).filter((r) => !(a.ad || []).some((x) => x[0] === r[0] && x[1] === r[1]))); a.ov = Object.assign({}, b.ov || {}, a.ov || {}); a.dl = Object.assign({}, b.dl || {}, a.dl || {}); set(k, JSON.stringify(a));
    }
  });
}
const lget = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lset = (k, v) => { localStorage.setItem(k, v); };
function open() {
  const ov = E("div", "position:fixed;inset:0;z-index:99999;background:var(--bg,#0f1320);color:var(--text,#eee);overflow:auto;padding:14px;font-family:inherit");
  const top = E("div", "display:flex;align-items:center;gap:10px"); const bk = E("button", BS, "← Geri"); bk.type = "button"; top.appendChild(bk); top.appendChild(E("b", "font-size:17px", "💾 Yedekle / Geri yükle")); ov.appendChild(top);
  const body = E("div"); ov.appendChild(body); document.body.appendChild(ov);
  const close = () => { try { ov.remove(); } catch (e) {} window.removeEventListener("popstate", close); };
  bk.onclick = () => { close(); try { if (history.state && history.state.bk) history.back(); } catch (e) {} };
  try { history.pushState({ bk: 1, vdb: 1 }, ""); window.addEventListener("popstate", close); } catch (e) {}
  body.appendChild(E("div", "margin-top:12px;font-size:14px;opacity:.9;line-height:1.55", "Vardiya bilgilerin sadece bu telefonda duruyor. Telefonu değiştirirsen ya da uygulamayı silersen kaybolur. Yedek dosyasını indirip WhatsApp'ta kendine gönder ya da Drive'a kaydet. Yeni telefonda buradan geri yüklersin."));
  const info = E("div", "margin-top:12px;font-size:14px"); body.appendChild(info);
  const v = J(lget("na_vardiya_v1") || "") || {}; info.textContent = "Şu an kayıtlı: " + Object.keys(v.days || {}).length + " vardiya günü, " + (v.fr || []).length + " arkadaş.";
  body.appendChild(E("div", "margin-top:18px;font-weight:700;font-size:16px", "📤 Yedek al"));
  const lab = E("label", "display:flex;gap:10px;align-items:center;margin-top:10px;font-size:14px"); const cb = E("input"); cb.type = "checkbox"; lab.appendChild(cb); lab.appendChild(E("span", "", "Gruplar listesini de ekle (PDF'ten okunan, dosya büyür)")); body.appendChild(lab);
  const dl = E("button", BS + ";width:100%;margin-top:10px;background:var(--lamp,#f0c24b);color:#000;font-weight:700", "📥 Yedek dosyasını indir"); dl.type = "button"; body.appendChild(dl);
  const m1 = E("div", "margin-top:10px;font-size:14px;line-height:1.5;min-height:18px"); body.appendChild(m1);
  dl.onclick = () => {
    try {
      const b = makeBackup(lget, cb.checked), n = Object.keys(b.data).length; if (!n) { m1.textContent = "Yedeklenecek bir şey yok."; return; }
      const d = new Date(), a = E("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(b)], { type: "application/json" })); a.download = "nobet-arasi-yedek-" + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + ".json"; document.body.appendChild(a); a.click(); setTimeout(() => { try { a.remove(); URL.revokeObjectURL(a.href); } catch (e) {} }, 4000);
      m1.textContent = "İndirildi. Dosyayı kaybetmemek için WhatsApp'ta kendine gönder ya da Drive'a kaydet.";
    } catch (e) { m1.textContent = "Yedek hazırlanamadı, tekrar dene."; }
  };
  body.appendChild(E("div", "margin-top:24px;font-weight:700;font-size:16px", "📥 Yedekten geri yükle"));
  const fi = E("input", "margin-top:10px"); fi.type = "file"; fi.accept = ".json,application/json"; body.appendChild(fi);
  const rs = E("div", "margin-top:10px"); body.appendChild(rs);
  fi.onchange = async () => {
    rs.innerHTML = ""; const f = fi.files && fi.files[0]; if (!f) return; let c = null;
    try { if (f.size < 6000000) c = check(J(await f.text())); } catch (e) {}
    if (!c) { rs.appendChild(E("div", "color:#ff8a8a;font-size:14px", "Bu dosya bir Nöbet Arası yedeği değil ya da bozuk.")); return; }
    rs.appendChild(E("div", "font-size:14px;line-height:1.5", "Yedekte: " + c.days + " vardiya günü, " + c.friends + " arkadaş" + (c.tel ? ", telsiz kodları" : "") + (c.big ? ", gruplar listesi" : "") + "."));
    const done = E("div", "margin-top:10px;font-size:14px;line-height:1.5");
    const go = (merge) => { try { restore(lget, lset, c.data, merge); done.textContent = "✓ Geri yüklendi. Uygulama yenileniyor…"; setTimeout(() => location.reload(), 1200); } catch (e) { done.textContent = "Geri yüklenemedi, tekrar dene."; } };
    const mg = E("button", BS + ";width:100%;margin-top:10px;font-weight:700", "🔀 Birleştir (şimdikiler korunur, eksikler eklenir)"); mg.type = "button"; mg.onclick = () => go(true); rs.appendChild(mg);
    let armed = false; const rp = E("button", BS + ";width:100%;margin-top:10px;color:#ff8a8a", "♻️ Değiştir (yedekteki her şeyi yaz)"); rp.type = "button";
    rp.onclick = () => { if (!armed) { armed = true; rp.textContent = "Emin misin? Şimdiki veriler değişir. Onaylamak için tekrar dokun"; return; } go(false); }; rs.appendChild(rp); rs.appendChild(done);
  };
  body.appendChild(E("div", "margin-top:20px;margin-bottom:24px;font-size:12px;opacity:.7;line-height:1.5", "Not: Giriş bilgilerin, sohbet mesajların ve hesap arkadaşlıkların (özel mesaj) bu yedeğe dahil değil, onlar hesabına bağlı ve internette saklanıyor. Yedek sadece bu telefondaki vardiya verilerini içerir."));
}
let pend = false;
const scan = () => {
  pend = false;
  document.querySelectorAll(".vd-act").forEach((ac) => { if (ac.querySelector("[data-bk]")) return; const b = E("button", "", "💾 Yedekle"); b.type = "button"; b.dataset.bk = "1"; b.onclick = (e) => { e.stopPropagation(); open(); }; ac.appendChild(b); });
};
try { new MutationObserver(() => { if (!pend) { pend = true; setTimeout(scan, 200); } }).observe(document.body, { childList: true, subtree: true }); scan(); } catch (e) {}
