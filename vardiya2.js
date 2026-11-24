// Vardiya takibi 2. parça: döngü ile doldurma, paylaşma ve ayarlar. vardiya.js bu dosyayı yükler.
const PRESETS = [
  ["1 gündüz · 1 gece · 2 izin", ["gunduz", "gece", "izin", "izin"]],
  ["2 gündüz · 2 gece · 4 izin", ["gunduz", "gunduz", "gece", "gece", "izin", "izin", "izin", "izin"]],
  ["24 saat çalış · 24 saat izin", ["tam", "izin"]],
  ["24 saat çalış · 48 saat izin", ["tam", "izin", "izin"]],
  ["5 gündüz · 2 izin", ["gunduz", "gunduz", "gunduz", "gunduz", "gunduz", "izin", "izin"]],
  ["5 gece · 2 izin", ["gece", "gece", "gece", "gece", "gece", "izin", "izin"]],
  ["Sabah · Akşam · İzin", ["sabah", "aksam", "izin"]]
];

export function wizard(api) {
  const { el, toast, openSheet, closeSheet, tdef, dur, ymd, wd, MON, DS, DL, save, render } = api;
  let pi = 0, custom = [];
  openSheet((sh) => {
    sh.appendChild(el("h3", "", "🔁 Döngü ile doldur"));
    const pr = el("div", "vd-pr"), seqBox = el("div", "vd-seq"), cp = el("div", "vd-ch");
    const draw = () => {
      pr.querySelectorAll("button").forEach((b, i) => b.classList.toggle("on", i === pi));
      seqBox.textContent = custom.length ? custom.map((id) => (tdef(id) || {}).ic || "?").join(" ") : "Aşağıdan türlere dokunarak kendi döngünü kur";
      seqBox.style.display = cp.style.display = pi === PRESETS.length ? "" : "none";
    };
    PRESETS.concat([["✍️ Kendi döngüm", null]]).forEach((q, i) => {
      const b = el("button", "", q[0] + (q[1] ? "   " + q[1].map((id) => (tdef(id) || {}).ic || "").join("") : "")); b.type = "button";
      b.onclick = () => { pi = i; draw(); }; pr.appendChild(b);
    });
    sh.appendChild(pr); sh.appendChild(seqBox);
    api.D.types.forEach((t) => { const b = el("button", "", t.ic + " " + t.n); b.type = "button"; b.onclick = () => { custom.push(t.id); draw(); }; cp.appendChild(b); });
    const rm = el("button", "", "↩️ Sonuncuyu sil"); rm.type = "button"; rm.onclick = () => { custom.pop(); draw(); }; cp.appendChild(rm);
    sh.appendChild(cp);
    sh.appendChild(el("label", "", "Başlangıç tarihi"));
    const sd = el("input"); sd.type = "date"; sd.value = ymd(new Date()); sh.appendChild(sd);
    sh.appendChild(el("label", "", "Bu tarih döngünün kaçıncı günü?"));
    const pos = el("select"); for (let i = 1; i <= 14; i++) pos.appendChild(new Option(i + ". gün", i)); sh.appendChild(pos);
    sh.appendChild(el("label", "", "Kaç ay doldurulsun?"));
    const mo = el("select"); [1, 2, 3, 6, 12].forEach((n) => mo.appendChild(new Option(n + " ay", n))); mo.value = 3; sh.appendChild(mo);
    const ow = el("input"); ow.type = "checkbox"; ow.checked = true; ow.style.cssText = "width:auto;margin-right:8px";
    const ol = el("label"); ol.style.color = "var(--text)"; ol.appendChild(ow); ol.appendChild(document.createTextNode("Dolu günlerin üzerine yaz")); sh.appendChild(ol);
    const ap = el("button", "vd-btn p", "Uygula"); ap.type = "button"; ap.style.cssText = "width:100%;margin-top:14px";
    ap.onclick = () => {
      const seq = pi === PRESETS.length ? custom : PRESETS[pi][1];
      if (!seq.length) { toast("Önce bir döngü seç."); return; }
      const p = sd.value.split("-"); if (p.length < 3) { toast("Başlangıç tarihini seç."); return; }
      const a = new Date(+p[0], +p[1] - 1, +p[2]), z = new Date(a.getFullYear(), a.getMonth() + (+mo.value), a.getDate());
      let n = 0, i = 0;
      for (let d = new Date(a); d < z; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1), i++) {
        const k = ymd(d), id = seq[(((+pos.value - 1 + i) % seq.length) + seq.length) % seq.length];
        if (!ow.checked && api.D.days[k]) continue;
        api.D.days[k] = { t: id, n: (api.D.days[k] && api.D.days[k].n) || "" }; n++;
      }
      save(); closeSheet(); api.setView(new Date(a.getFullYear(), a.getMonth(), 1)); render(); toast(n + " gün dolduruldu.");
    };
    sh.appendChild(ap); draw();
  });
}

export function share(api) {
  const { el, toast, openSheet, closeSheet, tdef, dur, ymd, wd, MON, DS, DL, save, render } = api;
  const vw = api.getView(), y = vw.getFullYear(), m = vw.getMonth(), nd = new Date(y, m + 1, 0).getDate(), L = ["🗓️ " + MON[m] + " " + y + " vardiya"];
  let hours = 0;
  for (let i = 1; i <= nd; i++) {
    const d = new Date(y, m, i), e = api.D.days[ymd(d)], t = e && tdef(e.t); if (!t) continue;
    if (!t.off) hours += dur(t);
    L.push(i + " " + DS[wd(d)] + " " + t.ic + " " + t.n + (t.off ? "" : " " + t.s + "–" + t.e));
  }
  if (L.length === 1) { toast("Bu ay için kayıt yok."); return; }
  L.push("Toplam: " + Math.round(hours * 10) / 10 + " saat");
  const txt = L.join("\n");
  if (navigator.share) navigator.share({ text: txt }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast("Takvim kopyalandı."), () => toast("Kopyalanamadı."));
}

export function settings(api) {
  const { el, toast, openSheet, closeSheet, tdef, dur, ymd, wd, MON, DS, DL, save, render } = api;
  openSheet((sh) => {
    sh.appendChild(el("h3", "", "⚙️ Ayarlar"));
    sh.appendChild(el("label", "", "Aylık hedef saat (sözleşmene göre değiştir)"));
    const tg = el("input"); tg.type = "number"; tg.min = 0; tg.max = 744; tg.value = api.D.target; sh.appendChild(tg);
    sh.appendChild(el("label", "", "Vardiya türleri"));
    const rows = [];
    api.D.types.forEach((t) => {
      const r = el("div", "vd-r"), nm = el("input"), s = el("input"), e = el("input");
      nm.type = "text"; nm.value = t.ic + " " + t.n; nm.maxLength = 18; s.type = e.type = "time"; s.value = t.s || "08:00"; e.value = t.e || "20:00";
      r.appendChild(nm); if (!t.off) { r.appendChild(s); r.appendChild(e); }
      sh.appendChild(r); rows.push([t, nm, s, e]);
    });
    const sv = el("button", "vd-btn p", "Kaydet"); sv.type = "button"; sv.style.cssText = "width:100%;margin-top:6px";
    sv.onclick = () => {
      api.D.target = Math.max(0, +tg.value || 0);
      rows.forEach((q) => {
        const t = q[0], p = q[1].value.trim().split(" ");
        if (p.length > 1 && !/^[A-Za-zÇĞİÖŞÜçğıöşü0-9]/.test(p[0])) { t.ic = p[0]; t.n = p.slice(1).join(" ") || t.n; } else if (q[1].value.trim()) t.n = q[1].value.trim();
        if (!t.off) { t.s = q[2].value || t.s; t.e = q[3].value || t.e; }
      });
      save(); closeSheet(); render();
    };
    sh.appendChild(sv);
    sh.appendChild(el("label", "", "Yedek"));
    const ta = el("textarea"); ta.rows = 3; ta.placeholder = "Yedeği buraya yapıştırıp “Yedekten yükle”ye bas"; sh.appendChild(ta);
    const r2 = el("div", "vd-r"), cp = el("button", "vd-btn", "📋 Yedeği kopyala"), ld = el("button", "vd-btn", "📥 Yedekten yükle"); cp.type = ld.type = "button";
    cp.onclick = () => { const j = JSON.stringify(api.D); if (navigator.clipboard) navigator.clipboard.writeText(j).then(() => toast("Yedek kopyalandı."), () => { ta.value = j; ta.select(); }); else { ta.value = j; ta.select(); } };
    ld.onclick = () => { try { const x = JSON.parse(ta.value); if (!x || !Array.isArray(x.types) || !x.days) throw 0; api.D = x; save(); closeSheet(); render(); toast("Yedek yüklendi."); } catch (e) { toast("Yedek geçersiz."); } };
    r2.style.marginTop = "8px"; r2.appendChild(cp); r2.appendChild(ld); sh.appendChild(r2);
    const wp = el("button", "vd-btn", "🗑️ Tüm vardiya verilerini sil"); wp.type = "button"; wp.style.cssText = "width:100%;margin-top:10px;color:var(--danger)";
    let sure = 0;
    wp.onclick = () => { if (!sure) { sure = 1; wp.textContent = "Emin misin? Tekrar dokun"; return; } api.reset(); closeSheet(); render(); toast("Silindi."); };
    sh.appendChild(wp);
  });
}
