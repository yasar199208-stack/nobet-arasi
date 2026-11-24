// Vardiya 9: fotoğraftan vardiya okuma. Fotoğraf telefonda okunur (yazı tanıma), kendi satırını bulur, kontrol edip takvime eklersin.
const E = (t, s, x) => { const e = document.createElement(t); if (s) e.style.cssText = s; if (x != null) e.textContent = x; return e; };
const BS = "border:1px solid var(--line,#333);background:transparent;color:inherit;border-radius:12px;padding:10px 14px;font-size:15px;cursor:pointer";
const IS = "box-sizing:border-box;padding:12px;font-size:16px;border-radius:12px;border:1px solid var(--line,#333);background:transparent;color:inherit;width:100%";
const TJ = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js";
const OFFS = /^(H[Iİ1Ll!|]|Y[Iİ1Ll!|]|R|RT|S[Iİ1Ll!|]|A|B|C|G|N|S|X|İZİN|IZIN)$/;
// Satırı parçala: "T1", "-", "2" gibi bölünmüş kodları birleştir.
export function toks(line) {
  const t = String(line).replace(/[|_]/g, " ").split(/\s+/).filter(Boolean), o = [];
  for (let i = 0; i < t.length; i++) {
    if (/^T\d$/i.test(t[i]) && t[i + 1] === "-" && /^\d$/.test(t[i + 2] || "")) { o.push(t[i] + " - " + t[i + 2]); i += 2; continue; }
    if (/^T\d-\d$/i.test(t[i])) { o.push(t[i].replace("-", " - ")); continue; }
    o.push(t[i]);
  }
  return o;
}
const isCode = (x) => /\d/.test(x) || OFFS.test(x.toLocaleUpperCase("tr"));
// Satırdaki ad ve sicil kısmını at, kodları döndür.
export function codes(line) {
  const t = toks(line); let i = 0;
  while (i < t.length && /^\d{1,6}$/.test(t[i])) i++;
  while (i < t.length && !isCode(t[i])) i++;
  return t.slice(i).map((x) => x.toLocaleUpperCase("tr").replace(/^H[1Ll!|]$/, "Hİ").replace(/^Y[1Ll!|]$/, "Yİ"));
}
export function nameOf(line) {
  const t = toks(line); let i = 0;
  while (i < t.length && /^\d{1,6}$/.test(t[i])) i++;
  const a = i; while (i < t.length && !isCode(t[i])) i++;
  return t.slice(a, i).join(" ");
}
const fold = (s) => String(s).toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
export function findLines(lines, q) {
  const w = fold(q).split(" ").filter(Boolean); if (!w.length) return [];
  return lines.filter((l) => { const fw = fold(l).split(/[^a-z0-9]+/); return w.every((x) => fw.some((y) => y.indexOf(x) === 0)); });
}
async function ocr(file, prog) {
  if (window.__ocrTest) return window.__ocrTest;
  const bm = await createImageBitmap(file), sc = Math.min(1, 2400 / Math.max(bm.width, bm.height)), cv = document.createElement("canvas");
  cv.width = Math.round(bm.width * sc); cv.height = Math.round(bm.height * sc); const cx = cv.getContext("2d"); try { cx.filter = "grayscale(1) contrast(1.5)"; } catch (e) {}
  cx.drawImage(bm, 0, 0, cv.width, cv.height);
  const m = await import(TJ), cw = m.createWorker || (m.default && m.default.createWorker);
  const w = await cw("tur", 1, { logger: (x) => { if (x.status === "recognizing text") prog("Okunuyor… %" + Math.round(x.progress * 100)); else prog("Hazırlanıyor… (ilk seferde dil dosyası iner)"); } });
  const r = await w.recognize(cv); try { await w.terminate(); } catch (e) {}
  return r.data.lines ? r.data.lines.map((l) => l.text) : String(r.data.text).split("\n");
}
async function save(cs, y, mo, fname) {
  const V = await import("./vardiya3.js?v=4"), K = await import("./vardiya7.js?v=1"); let D;
  try { D = JSON.parse(localStorage.getItem("na_vardiya_v1")) || {}; } catch (e) { D = {}; }
  D.types = D.types || []; D.days = D.days || {}; D.fr = D.fr || []; D.target = D.target || 195;
  K.KT.forEach((k) => {
    const id = "c:" + k[0]; if (D.types.some((t) => t.id === id)) return; const h = +k[2].slice(0, 2), g = h >= 22 || h <= 5, a = h >= 12 && !g;
    D.types.push({ id: id, n: k[0] + " · " + k[1], ic: g ? "🌙" : a ? "🌇" : "☀️", c: g ? "#7c93ff" : a ? "#e06fa8" : "#f0c24b", s: k[2], e: k[3], k: k[0].replace(/\s/g, "") });
  });
  let n = 0, tgt = D.days, fo2 = null;
  if (fname) { fo2 = D.fr.find((x) => fold(x.n) === fold(fname)); if (!fo2) { fo2 = { id: "f" + Date.now().toString(36), n: fname, days: {} }; D.fr.push(fo2); } fo2.days = fo2.days || {}; tgt = fo2.days; }
  cs.forEach((c, i) => {
    c = String(c || "").trim(); if (!c) return; const d = new Date(y, mo, i + 1); if (d.getMonth() !== mo) return;
    const key = d.getFullYear() + "-" + String(mo + 1).padStart(2, "0") + "-" + String(i + 1).padStart(2, "0");
    tgt[key] = { t: V.guess(c, D.types) || "c:" + c, n: "" }; n++;
  });
  localStorage.setItem("na_vardiya_v1", JSON.stringify(D)); return n;
}
const MN = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
function open() {
  const ov = E("div", "position:fixed;inset:0;z-index:99999;background:var(--bg,#0f1320);color:var(--text,#eee);overflow:auto;padding:14px;font-family:inherit");
  const top = E("div", "display:flex;align-items:center;gap:10px"); const bk = E("button", BS, "← Geri"); bk.type = "button"; top.appendChild(bk); top.appendChild(E("b", "font-size:17px", "📷 Fotoğraftan vardiya")); ov.appendChild(top);
  const body = E("div"); ov.appendChild(body); document.body.appendChild(ov);
  const close = () => { try { ov.remove(); } catch (e) {} window.removeEventListener("popstate", close); };
  bk.onclick = () => { close(); try { if (history.state && history.state.ph) history.back(); } catch (e) {} };
  try { history.pushState({ ph: 1, vdb: 1 }, ""); window.addEventListener("popstate", close); } catch (e) {}
  const now = new Date(); let lines = null, mo = now.getMonth(), yr = now.getFullYear(), nm = ""; try { nm = localStorage.getItem("na_vardiya_ad") || ""; } catch (e) {}
  let st = "", ps = null, rows = [], lq = "";
  const draw1 = () => {
    body.innerHTML = "";
    body.appendChild(E("div", "margin-top:12px;font-size:14px;opacity:.85;line-height:1.5", "1) Vardiya listesinin fotoğrafını seç (tablo net, düz ve aydınlık olsun). 2) Adını yaz. 3) Okunanı kontrol edip takvime ekle. Fotoğraf telefonunda okunur, hiçbir yere gönderilmez."));
    const fi = E("input", "margin-top:12px"); fi.type = "file"; fi.accept = "image/*"; body.appendChild(fi);
    const ni = E("input", IS + ";margin-top:12px"); ni.placeholder = "Aranacak ad (boş bırakırsan tüm liste gelir)"; ni.value = nm; body.appendChild(ni);
    const row = E("div", "display:flex;gap:8px;margin-top:12px"); const ms = E("select", IS + ";flex:1"); MN.forEach((m, i) => ms.appendChild(new Option(m, i))); ms.value = mo; const ys = E("select", IS + ";width:110px"); [yr - 1, yr, yr + 1].forEach((y) => ys.appendChild(new Option(y, y))); ys.value = yr; row.appendChild(ms); row.appendChild(ys); body.appendChild(row);
    const go = E("button", BS + ";width:100%;margin-top:14px;background:var(--lamp,#f0c24b);color:#000;font-weight:700", "📖 Fotoğrafı oku"); go.type = "button"; body.appendChild(go);
    const sm = E("div", "margin-top:12px;font-size:14px", st); body.appendChild(sm);
    go.onclick = async () => {
      const f = fi.files && fi.files[0]; nm = ni.value.trim(); mo = +ms.value; yr = +ys.value;
      if (!window.__ocrTest && !f) { sm.textContent = "Önce fotoğrafı seç."; return; }       try { localStorage.setItem("na_vardiya_ad", nm); } catch (e) {} go.disabled = true;
      try { lines = await ocr(f, (x) => { sm.textContent = x; }); } catch (e) { st = "Fotoğraf okunamadı. İnternet bağlantını kontrol edip tekrar dene (okuyucu ilk seferde internetten yüklenir)."; draw1(); return; }
      rows = lines.filter((l) => codes(l).length >= 3 && nameOf(l).length >= 2);
      if (!rows.length) { st = "Fotoğraftan vardiya satırı okuyamadım. Daha net, düz ve yakın bir fotoğraf dene."; draw1(); return; }
      lq = nm; drawL();
    };
  };
  const drawL = () => {
    body.innerHTML = "";
    const top2 = E("div", "display:flex;gap:8px;margin-top:12px;align-items:center"); const bb = E("button", BS, "↩ Başa dön"); bb.type = "button"; bb.onclick = draw1; top2.appendChild(bb); top2.appendChild(E("span", "font-size:13px;opacity:.8", rows.length + " satır okundu")); body.appendChild(top2);
    const qi = E("input", IS + ";margin-top:12px"); qi.placeholder = "İsimle ara"; qi.value = lq; body.appendChild(qi);
    body.appendChild(E("div", "margin-top:8px;font-size:13px;opacity:.8", "Bir satıra dokun: kodları kontrol edip takvime eklersin."));
    const lw = E("div"); body.appendChild(lw);
    const list = () => {
      lw.innerHTML = ""; const w = fold(lq).split(" ").filter(Boolean); let n = 0;
      rows.forEach((l) => {
        const nmx = nameOf(l), fw = fold(nmx).split(/[^a-z0-9]+/); if (w.length && !w.every((x) => fw.some((y) => y.indexOf(x) === 0))) return; n++;
        const cs = codes(l), b = E("button", BS + ";width:100%;margin-top:8px;text-align:left;display:block", ""); b.type = "button";
        b.appendChild(E("div", "font-weight:700;font-size:15px", nmx)); b.appendChild(E("div", "margin-top:4px;font-size:12px;opacity:.75;word-break:break-word", cs.slice(0, 8).join(" ") + (cs.length > 8 ? " … (" + cs.length + " kod)" : "")));
        b.onclick = () => { ps = { l: l, c: cs, n: nmx }; draw3(); }; lw.appendChild(b);
      });
      if (!n) lw.appendChild(E("div", "margin-top:14px;opacity:.8", "Bu isimde satır yok. Adı kısaltıp dene."));
    };
    qi.oninput = () => { lq = qi.value; list(); }; list();
  };
  const draw3 = () => {
    body.innerHTML = ""; const nd = new Date(yr, mo + 1, 0).getDate();
    body.appendChild(E("div", "margin-top:12px;font-weight:700", MN[mo] + " " + yr + " · okunan satır"));
    body.appendChild(E("div", "margin-top:6px;padding:10px;border-radius:12px;background:rgba(255,255,255,.07);font-size:13px;word-break:break-word", ps.l));
    body.appendChild(E("div", "margin-top:10px;font-size:14px;opacity:.85;line-height:1.5", "Okunan kodlar günlere dizildi. Yanlış olanı düzelt, boş bırakırsan o gün eklenmez. Hepsi bir gün kaymışsa aşağıdaki ◀ ▶ ile kaydır."));
    const sh = E("div", "display:flex;gap:8px;margin-top:10px"); const l1 = E("button", BS + ";flex:1", "◀ Bir gün geri"), r1 = E("button", BS + ";flex:1", "Bir gün ileri ▶"); l1.type = r1.type = "button";
    l1.onclick = () => { read(); ps.c.shift(); draw3(); }; r1.onclick = () => { read(); ps.c.unshift(""); draw3(); }; sh.appendChild(l1); sh.appendChild(r1); body.appendChild(sh);
    const g = E("div", "display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"); const ins = [];
    for (let i = 0; i < nd; i++) { const w = E("div", "display:flex;align-items:center;gap:6px"); w.appendChild(E("span", "width:24px;font-size:13px;opacity:.7;text-align:right", String(i + 1))); const x = E("input", IS + ";padding:8px;font-size:15px"); x.value = ps.c[i] || ""; ins.push(x); w.appendChild(x); g.appendChild(w); }
    body.appendChild(g);
    const read = () => { ps.c = ins.map((x) => x.value.trim()).concat(ps.c.slice(nd)); };
    const ex = ps.c.length - nd; if (ex > 0) body.appendChild(E("div", "margin-top:8px;font-size:13px;opacity:.8", "Not: satırda " + ex + " fazla kod var, ay sonundan sonrası eklenmez."));
    const ad = E("button", BS + ";width:100%;margin-top:16px;background:var(--lamp,#f0c24b);color:#000;font-weight:700", "＋ Takvimime ekle"); ad.type = "button";
    ad.onclick = async () => { read(); try { const n = await save(ps.c.slice(0, nd), yr, mo); body.innerHTML = ""; body.appendChild(E("div", "margin-top:20px;font-size:17px;font-weight:700", "✓ " + n + " gün takvime eklendi.")); body.appendChild(E("div", "margin-top:8px;opacity:.85", "Vardiya ekranı yenilenecek.")); setTimeout(() => location.reload(), 1200); } catch (e) { body.appendChild(E("div", "margin-top:12px;color:#ff8a8a", "Kaydedilemedi, tekrar dene.")); } };
    body.appendChild(ad);
    const fr = E("button", BS + ";width:100%;margin-top:8px", "👥 Arkadaş olarak ekle (" + (ps.n || "isimsiz") + ")"); fr.type = "button";
    fr.onclick = async () => { read(); try { const n = await save(ps.c.slice(0, nd), yr, mo, ps.n || "Arkadaş"); body.innerHTML = ""; body.appendChild(E("div", "margin-top:20px;font-size:17px;font-weight:700", "✓ " + n + " gün arkadaş olarak eklendi.")); body.appendChild(E("div", "margin-top:8px;opacity:.85", "Vardiya ekranı yenilenecek, arkadaşlar listesinden gör.")); setTimeout(() => location.reload(), 1200); } catch (e) { body.appendChild(E("div", "margin-top:12px;color:#ff8a8a", "Kaydedilemedi, tekrar dene.")); } };
    body.appendChild(fr);
    const bk2 = E("button", BS + ";width:100%;margin-top:8px;margin-bottom:24px", "↩ Listeye dön"); bk2.type = "button"; bk2.onclick = () => { read(); if (rows.length) drawL(); else draw1(); }; body.appendChild(bk2);
  };
  draw1();
}
let pend = false;
const scan = () => {
  pend = false;
  document.querySelectorAll("button").forEach((b) => { if (!b.dataset.ph && /^📄 PDF/.test(b.textContent) && !(b.nextElementSibling && b.nextElementSibling.dataset.ph)) { const n = b.cloneNode(false); n.dataset.ph = "1"; n.textContent = "📷 Fotoğraftan yükle"; n.onclick = (e) => { e.stopPropagation(); open(); }; b.insertAdjacentElement("afterend", n); } });
};
try { new MutationObserver(() => { if (!pend) { pend = true; setTimeout(scan, 150); } }).observe(document.body, { childList: true, subtree: true }); scan(); } catch (e) {}
