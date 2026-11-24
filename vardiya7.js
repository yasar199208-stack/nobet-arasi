// Vardiya 7: görev kodları tablosu (saat/yer) ve "Koda göre ara" ekranı.
// Burtram T1 görev kodları (PDF'deki yazılışıyla). Vardiya türü olarak eklenir; takvimde saati ve toplam saat hesaplanır.
export const KT = [["T1A1", "1.Araç", "07:00", "15:00"], ["T1A2", "2.Araç", "07:00", "15:00"], ["T1A3", "3.Araç", "08:00", "16:00"], ["T1A4", "4.Araç", "11:00", "19:00"], ["T1B1", "1.Araç Akşam", "15:00", "23:00"], ["T1B2", "2.Araç Akşam", "15:00", "23:00"], ["T1B3", "3.Araç Akşam", "14:00", "22:00"], ["T1D1", "Değiştirici", "08:00", "16:00"], ["T1D2", "Değiştirici", "13:00", "21:00"], ["T1D3", "Değiştirici", "14:30", "22:30"], ["T1 - 1", "Bina Gündüz", "07:00", "15:00"], ["T1 - 2", "Bina Akşam", "15:00", "23:00"], ["T1 - 3", "Bina Gece", "23:00", "07:00"], ["T1 - 4", "Bina Gece (makas)", "23:00", "07:00"]];
export function seedTypes(api) {
  const D = api.D; let n = 0;
  KT.forEach((k) => {
    const id = "c:" + k[0], ex = D.types.find((t) => t.id === id); if (ex) { if (!ex.k) { ex.k = k[0].replace(/\s/g, ""); n++; } return; }
    const h = +k[2].slice(0, 2), g = h >= 22 || h <= 5, a = h >= 12 && !g;
    D.types.push({ id: id, n: k[0] + " · " + k[1], ic: g ? "🌙" : a ? "🌇" : "☀️", c: g ? "#7c93ff" : a ? "#e06fa8" : "#f0c24b", s: k[2], e: k[3], k: k[0].replace(/\s/g, "") }); n++;
  });
  if (n) { api.save(); api.render(); api.toast("Burtram T1 görev kodları saatleriyle vardiya türlerine eklendi."); }
}

export const kd = (c) => { const k = String(c || "").replace(/\s+/g, "").toUpperCase(); return KT.find((t) => t[0].replace(/\s/g, "") === k); };
export const info = (c) => { const x = kd(c); return x ? c + " · " + x[1] + " · " + x[2] + "–" + x[3] : c; };
export const offName = (c) => ({ "Hİ": "Haftalık izin", "YI": "Yıllık izin", "Yİ": "Yıllık izin", "R": "Rapor", "RT": "Resmi tatil", "Sİ": "Sendika izni" }[c] || "İzinli");


export function codeView(c) {
  const { el, body, D, setDay, setQ, DS, fold, norm, isOff, wbtn, onDuty, icon } = c; let day = c.day, q = c.q;
  const nd = new Date(D.y, D.m + 1, 0).getDate(), key = (x) => fold(x).replace(/ /g, "");
  const ds = el("select"); for (let i = 1; i <= nd; i++) ds.appendChild(new Option(i + ". gün · " + DS[(new Date(D.y, D.m, i).getDay() + 6) % 7], i));
  ds.value = day; ds.style.marginTop = "6px"; body.appendChild(ds);
  const qi = el("input"); qi.placeholder = "Kod yaz (örn. T1A1, T1 - 2, T1)"; qi.value = q; qi.autocapitalize = "characters"; qi.style.marginTop = "6px"; body.appendChild(qi);
  const lw = el("div"); body.appendChild(lw);
  const list = () => {
    lw.innerHTML = ""; const by = {}; let off = 0;
    D.people.forEach((p) => { const x = norm(p.out[day]); if (!x) return; if (isOff(x)) { off++; return; } (by[x] = by[x] || []).push(p); });
    const ks = Object.keys(by).sort(), w = key(q);
    const cp = el("div", ""); cp.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-top:10px";
    ks.forEach((k) => { const b = el("button", w && key(k) === w ? "vd-btn p" : "vd-btn", k + " · " + by[k].length); b.type = "button"; b.style.cssText = "padding:6px 10px;font-size:13px"; b.onclick = () => { q = k; qi.value = k; setQ(k); list(); }; cp.appendChild(b); });
    lw.appendChild(el("div", "vd-tg", "Bu gün " + ks.length + " farklı kod var. Birine dokun veya yukarı yaz:")); lw.lastChild.style.marginTop = "8px"; lw.appendChild(cp);
    if (off) { const o = el("div", "vd-tg", "İzinli / raporlu: " + off + " kişi"); o.style.marginTop = "8px"; lw.appendChild(o); }
    if (!w) return;
    const hit = ks.filter((k) => key(k).indexOf(w) >= 0);
    if (!hit.length) { const z = el("div", "vd-tg", "Bu gün bu kodda kimse yok."); z.style.marginTop = "8px"; lw.appendChild(z); return; }
    hit.forEach((k) => {
      const hd = el("div", "", "📍 " + info(k) + " · " + by[k].length + " kişi"); hd.style.cssText = "margin-top:14px;font-weight:700;color:var(--lamp);font-size:14px"; lw.appendChild(hd);
      by[k].forEach((p) => {
        const r = el("div", ""); r.style.cssText = "display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line);font-size:14px";
        const n = el("span", "", p.name + (onDuty(p) ? " 🟢" : "")); n.style.flex = "1"; r.appendChild(n);
        const g = el("span", "", D.groups[p.g] ? icon(D.groups[p.g].n) : ""); r.appendChild(g); r.appendChild(wbtn(p)); lw.appendChild(r);
      });
    });
  };
  ds.onchange = () => { day = +ds.value; setDay(day); list(); };
  qi.oninput = () => { q = qi.value; setQ(q); list(); };
  list();
}
