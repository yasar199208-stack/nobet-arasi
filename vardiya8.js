// Vardiya 8: istasyon telsiz kodları (aranabilir liste). Vardiya ekranına ve Gruplar ekranına "📻 Telsiz kodları" tuşu ekler.
const T = [
  ["Yönetici", [["Genel Müdür", 1610], ["Güvenlik Şefi", 1611], ["OMC Amirlik", 1612], ["Merinos Amirlik", 1613], ["Terminal Amirlik", 1614], ["Nizamiye Giriş", 1615], ["Danışma", 1616]]],
  ["T2 istasyonları ve İpekböceği", [["Kent Meydanı", 2017], ["Genç Osman", 2027], ["Beşyol", 2037], ["Fatih/Altınova", 2047], ["Bölge Adliye", 2057], ["Otokoop", 2067], ["Buttim", 2077], ["Panayır", 2087], ["Yeniceabat", 2097], ["MYO", 2107], ["Terminal", 2117], ["T1 Depo", 1185], ["T2 Depo", 2516], ["T3 Depo", 1180], ["T1 İpek Böceği", 1186], ["TRE 1 Devriye", 1187]]],
  ["Kuzey hattı", [["Karaman", 3105], ["İhsaniye", 3205], ["Esentepe", 3305], ["Hamitler", 3405], ["O. Sanayi", 3505], ["Korupark Doğu", 3605], ["Korupark Batı", 3606], ["Emek", 3705], ["Balat", 3805]]],
  ["Batı hattı", [["Odunluk Doğu", 4005], ["Odunluk Batı", 4006], ["Nilüfer", 4105], ["FSM", 4205], ["Beşevler", 4305], ["Ataevler", 4405], ["K. Sanayi", 4505], ["Altınşehir", 4605], ["Ertuğrul", 4705], ["Özlüce", 4805], ["Yüzüncü Yıl Doğu", 4905], ["Yüzüncü Yıl Batı", 4906], ["Batıkent", 5005], ["Üniversite", 5105]]],
  ["Doğu hattı", [["Acemler", 6105], ["Paşa Çiftliği", 6205], ["Sirameşeler", 6305], ["Kültürpark", 6405], ["Merinos", 6505], ["Osmangazi Doğu", 6605], ["Osmangazi Batı", 6604], ["Şehreküstü", 6705], ["Demirtaşpaşa", 6805], ["Gökdere", 6905], ["Davutdede", 7005], ["Duaçınarı", 7105], ["152 Evler", 7205], ["Arabayatağı", 7305], ["Mimar Sinan", 7405], ["Hacıvat", 7505], ["Şirinevler", 7605], ["Otosansit", 7705], ["Cumalıkızık", 7805], ["Gürsu", 7905], ["Kestel", 8005]]]
];
const fo = (s) => String(s).toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const E = (t, s, x) => { const e = document.createElement(t); if (s) e.style.cssText = s; if (x != null) e.textContent = x; return e; };
const SK = "na_telsiz_v1";
const ld = () => { try { const x = JSON.parse(localStorage.getItem(SK)) || {}; return { my: x.my || "", ad: x.ad || [], ov: x.ov || {}, dl: x.dl || {} }; } catch (e) { return { my: "", ad: [], ov: {}, dl: {} }; } };
const sv = (x) => { try { localStorage.setItem(SK, JSON.stringify(x)); return true; } catch (e) { return false; } };
const BS = "border:1px solid var(--line,#333);background:transparent;color:inherit;border-radius:12px;padding:10px 14px;font-size:15px;cursor:pointer";
const IS = "box-sizing:border-box;padding:12px;font-size:16px;border-radius:12px;border:1px solid var(--line,#333);background:transparent;color:inherit";
function open() {
  const ov = E("div", "position:fixed;inset:0;z-index:99999;background:var(--bg,#0f1320);color:var(--text,#eee);overflow:auto;padding:14px;font-family:inherit");
  const top = E("div", "display:flex;align-items:center;gap:10px"); const bk = E("button", BS, "← Geri");
  bk.type = "button"; top.appendChild(bk); top.appendChild(E("b", "font-size:17px", "📻 Telsiz kodları")); ov.appendChild(top);
  document.body.appendChild(ov);
  const close = () => { try { ov.remove(); } catch (e) {} window.removeEventListener("popstate", close); };
  bk.onclick = () => { close(); try { if (history.state && history.state.tz) history.back(); } catch (e) {} };
  try { history.pushState({ tz: 1, vdb: 1 }, ""); window.addEventListener("popstate", close); } catch (e) {}
  const body = E("div"); ov.appendChild(body);
  let S = ld(), q = "", ed = "", msg = "", fileEl = null;
  const clean = (c) => String(c).replace(/\D/g, "").slice(0, 8);
  const draw = () => {
    body.innerHTML = ""; const keep = q;
    // Benim telsiz kodum (yalnızca bu telefonda)
    const my = E("div", "margin-top:12px;padding:12px;border:1px solid var(--lamp,#f0c24b);border-radius:14px");
    my.appendChild(E("div", "font-size:13px;opacity:.8", "⭐ Benim telsiz kodum (sadece bu telefonda kalır)"));
    if (S.my && ed !== "my") { const r = E("div", "display:flex;align-items:center;gap:10px;margin-top:6px"); r.appendChild(E("b", "font-size:26px;letter-spacing:2px;flex:1", S.my)); const e1 = E("button", BS, "✏️"); e1.type = "button"; e1.onclick = () => { ed = "my"; draw(); }; r.appendChild(e1); my.appendChild(r); }
    else { const r = E("div", "display:flex;gap:8px;margin-top:6px"); const i = E("input", IS + ";flex:1;min-width:0"); i.placeholder = "Kendi kodun (örn. 2017)"; i.inputMode = "numeric"; i.value = S.my; const k = E("button", BS, "Kaydet"); k.type = "button"; k.onclick = () => { S.my = clean(i.value); sv(S); ed = ""; draw(); }; r.appendChild(i); r.appendChild(k); my.appendChild(r); }
    body.appendChild(my);
    const qi = E("input", IS + ";width:100%;margin-top:12px"); qi.placeholder = "İstasyon veya numara ara (örn. Üniversite, 5105)"; qi.value = q; body.appendChild(qi);
    const lw = E("div"); body.appendChild(lw);
    const list = () => {
      lw.innerHTML = ""; const w = fo(q).split(" ").filter(Boolean); let n = 0;
      const gs = T.map((g) => ({ n: g[0], r: g[1].filter((r) => !S.dl[g[0] + "|" + r[0]]).map((r) => { const o = S.ov[g[0] + "|" + r[0]]; return { k: g[0] + "|" + r[0], n: o ? o[0] : r[0], c: o ? o[1] : String(r[1]), b: 1 }; }) }));
      S.ad.forEach((a, i) => { let g = gs.find((x) => x.n === a[0]); if (!g) { g = { n: a[0], r: [] }; gs.push(g); } g.r.push({ i: i, n: a[1], c: a[2] }); });
      gs.forEach((g) => {
        const rows = g.r.filter((r) => !w.length || w.every((x) => fo(r.n).indexOf(x) >= 0 || r.c.indexOf(x) >= 0)); if (!rows.length) return;
        lw.appendChild(E("div", "margin-top:16px;font-weight:700;color:var(--lamp,#f0c24b);font-size:14px", g.n + " (" + rows.length + ")"));
        rows.forEach((r) => {
          n++; const id = r.b ? r.k : "a" + r.i, l = E("div", "display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--line,#2a3045);font-size:16px;flex-wrap:wrap");
          if (ed === id) {
            const a = E("input", IS + ";flex:1;min-width:120px"); a.value = r.n; const c = E("input", IS + ";width:100px"); c.value = r.c; c.inputMode = "numeric";
            const k = E("button", BS, "Kaydet"); k.type = "button"; k.onclick = () => { const nn = a.value.trim() || r.n, cc = clean(c.value) || r.c; if (r.b) S.ov[r.k] = [nn, cc]; else S.ad[r.i] = [S.ad[r.i][0], nn, cc]; sv(S); ed = ""; draw(); };
            const d = E("button", BS, "🗑️"); d.type = "button"; d.onclick = () => { if (r.b) S.dl[r.k] = 1; else S.ad.splice(r.i, 1); sv(S); ed = ""; draw(); };
            l.appendChild(a); l.appendChild(c); l.appendChild(k); l.appendChild(d);
          } else {
            l.appendChild(E("span", "flex:1", r.n)); l.appendChild(E("b", "font-size:18px;letter-spacing:1px", r.c));
            const e1 = E("button", BS + ";padding:6px 10px", "✏️"); e1.type = "button"; e1.onclick = () => { ed = id; draw(); }; l.appendChild(e1);
          }
          lw.appendChild(l);
        });
      });
      if (!n) lw.appendChild(E("div", "margin-top:16px;opacity:.7", "Bulunamadı. Adı kısaltıp dene."));
    };
    qi.oninput = () => { q = qi.value; list(); }; list();
    // Elle ekle
    const ad = E("div", "margin-top:22px;padding:12px;border:1px solid var(--line,#333);border-radius:14px");
    ad.appendChild(E("div", "font-weight:700", "＋ Kod ekle (kendi listen)"));
    const na = E("input", IS + ";width:100%;margin-top:8px"); na.placeholder = "İstasyon / kişi adı"; const nc = E("input", IS + ";width:100%;margin-top:8px"); nc.placeholder = "Telsiz kodu"; nc.inputMode = "numeric";
    const ab = E("button", BS + ";width:100%;margin-top:8px", "Ekle"); ab.type = "button";
    ab.onclick = () => { const a = na.value.trim(), c = clean(nc.value); if (!a || !c) { msg = "Ad ve kod yaz."; draw(); return; } S.ad.push(["Benim eklediklerim", a, c]); sv(S); msg = a + " eklendi."; draw(); };
    ad.appendChild(na); ad.appendChild(nc); ad.appendChild(ab); body.appendChild(ad);
    // PDF'den al
    const pd = E("div", "margin-top:14px;padding:12px;border:1px solid var(--line,#333);border-radius:14px");
    pd.appendChild(E("div", "font-weight:700", "📄 PDF'den telsiz kodlarını al"));
    pd.appendChild(E("div", "font-size:13px;opacity:.8;margin-top:4px", "PDF telefonunda okunur, hiçbir yere gönderilmez. Ad + 4 haneli kod satırlarını bulur."));
    const fi = E("input", "margin-top:8px"); fi.type = "file"; fi.accept = ".pdf,application/pdf"; pd.appendChild(fi);
    const pb = E("button", BS + ";width:100%;margin-top:8px", "📂 Kodları oku"); pb.type = "button";
    pb.onclick = async () => {
      const f = fi.files && fi.files[0]; if (!f) { msg = "Önce PDF dosyasını seç."; draw(); return; }
      pb.textContent = "Okunuyor…";
      try {
        const V = await import("./vardiya3.js?v=4"), L = await V.getLib(), doc = await L.getDocument({ data: await f.arrayBuffer() }).promise; let add = 0;
        for (let p = 1; p <= Math.min(doc.numPages, 30); p++) {
          const rows = V.rowsOf((await (await doc.getPage(p)).getTextContent()).items);
          rows.forEach((r) => {
            const t = r.t.map((x) => x.s.trim()).filter(Boolean); if (t.length < 2) return;
            const ix = t.map((x, i) => (/^\d{4}$/.test(x) ? i : -1)).filter((i) => i >= 0); if (!ix.length) return;
            const ci = ix[ix.length - 1], c = t[ci], nm = t.slice(0, ci).filter((x) => !/^\d{1,2}$/.test(x)).join(" ").trim();
            if (nm.length < 2 || /KOD NO|S\.?NO/i.test(nm)) return;
            const ex = T.some((g) => g[1].some((x) => fo(x[0]) === fo(nm) && String(x[1]) === c)) || S.ad.some((x) => fo(x[1]) === fo(nm) && x[2] === c);
            if (!ex) { S.ad.push(["PDF'den alınanlar", nm, c]); add++; }
          });
        }
        sv(S); msg = add ? add + " yeni kod eklendi. Listede 'PDF'den alınanlar' başlığında. Yanlış olanı ✏️ ile düzelt." : "Yeni kod bulunamadı (hepsi zaten listede ya da PDF taranmış fotoğraf olabilir).";
      } catch (e) { msg = "PDF okunamadı. İnternet bağlantını kontrol edip tekrar dene."; }
      draw();
    };
    pd.appendChild(pb); body.appendChild(pd);
    if (msg) { const m = E("div", "margin-top:12px;padding:10px;border-radius:12px;background:rgba(240,194,75,.15)", msg); body.appendChild(m); msg = ""; }
    const rs = E("button", BS + ";width:100%;margin-top:14px", "↺ Değiştirdiklerimi ilk haline döndür"); rs.type = "button"; rs.onclick = () => { S.ov = {}; S.dl = {}; sv(S); draw(); }; body.appendChild(rs);
    const ra = E("button", BS + ";width:100%;margin-top:8px;margin-bottom:20px", "🗑️ Eklediğim / PDF'den aldığım kodları sil"); ra.type = "button"; ra.onclick = () => { S.ad = []; sv(S); draw(); }; body.appendChild(ra);
    qi.value = keep;
  };
  draw();
}
const mkBtn = (ref) => { const b = document.createElement("button"); b.type = "button"; b.className = ref.className || "vd-btn"; b.dataset.tz = "1"; b.textContent = "📻 Telsiz kodları"; if (ref.tagName === "H3") b.style.cssText = "width:100%;margin-top:10px"; b.onclick = (e) => { e.stopPropagation(); open(); }; return b; };
let pend = false;
const scan = () => {
  pend = false;
  document.querySelectorAll("button").forEach((b) => { if (!b.dataset.tz && /^🗂️ Gruplar/.test(b.textContent) && !(b.nextElementSibling && b.nextElementSibling.dataset.tz)) b.insertAdjacentElement("afterend", mkBtn(b)); });
  document.querySelectorAll("h3").forEach((h) => { if (/^🗂️ Gruplar/.test(h.textContent) && !(h.nextElementSibling && h.nextElementSibling.dataset.tz)) { const nb = mkBtn({ className: "vd-btn", tagName: "H3" }); h.insertAdjacentElement("afterend", nb); } });
};
try { new MutationObserver(() => { if (!pend) { pend = true; setTimeout(scan, 120); } }).observe(document.body, { childList: true, subtree: true }); scan(); } catch (e) {}
