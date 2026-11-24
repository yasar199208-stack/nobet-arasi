// Vardiya 10: günlük çizelge fotoğrafı (satırlar görev yeri, sütunlar vardiya saati). Fotoğraf telefonda okunur, hiçbir yere gönderilmez.
const E = (t, s, x) => { const e = document.createElement(t); if (s) e.style.cssText = s; if (x != null) e.textContent = x; return e; };
const BS = "border:1px solid var(--line,#333);background:transparent;color:inherit;border-radius:12px;padding:10px 14px;font-size:15px;cursor:pointer";
const IS = "box-sizing:border-box;padding:12px;font-size:16px;border-radius:12px;border:1px solid var(--line,#333);background:transparent;color:inherit;width:100%";
const TJ = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js";
const fold = (s) => String(s).toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const TM = /(\d{1,2})\s*[:.;]\s*([0-5]\d)/g;
export function parse(words) {
  const W = words.map((w) => ({ t: String(w.t).trim(), x0: w.x0, y0: w.y0, x1: w.x1, y1: w.y1 })).filter((w) => w.t && w.x1 > w.x0);
  W.forEach((w) => { w.cx = (w.x0 + w.x1) / 2; w.cy = (w.y0 + w.y1) / 2; w.h = w.y1 - w.y0; });
  const hs = W.map((w) => w.h).sort((a, b) => a - b), mh = hs[Math.floor(hs.length / 2)] || 20;
  // 1) saat başlıkları: "08:00-16:00"
  const tw = W.filter((w) => /^\d{1,2}[:.]\d{2}/.test(w.t) || /\d{2}[:.]\d{2}\s*[-–]\s*\d{2}[:.]\d{2}/.test(w.t) || /^[-–]\d{2}[:.]\d{2}$/.test(w.t));
  const rowsT = []; tw.sort((a, b) => a.cy - b.cy).forEach((w) => { const r = rowsT.find((r) => Math.abs(r.y - w.cy) < mh * 2.2); if (r) { r.w.push(w); r.y = r.w.reduce((s, x) => s + x.cy, 0) / r.w.length; } else rowsT.push({ y: w.cy, w: [w] }); });
  rowsT.sort((a, b) => b.w.length - a.w.length); const hr = rowsT[0]; if (!hr || hr.w.length < 2) return null;
  const hw = hr.w.sort((a, b) => a.cx - b.cx), hd = [];
  hw.forEach((w) => { const last = hd[hd.length - 1]; if (last && w.x0 - last.x1 < mh * 2.5 && !(last.n >= 2)) { last.txt += w.t; last.x1 = w.x1; last.n = (last.txt.match(TM) || []).length; } else hd.push({ txt: w.t, x0: w.x0, x1: w.x1, n: (w.t.match(TM) || []).length }); });
  const cols = hd.map((h) => { const m = h.txt.replace(/[;]/g, ":").match(/\d{1,2}[:.]\d{2}/g) || []; const f = (s) => { const p = s.replace(".", ":").split(":"); return String(p[0]).padStart(2, "0") + ":" + p[1]; }; return { s: m[0] ? f(m[0]) : "", e: m[1] ? f(m[1]) : "", cx: (h.x0 + h.x1) / 2, names: [] }; }).filter((c) => c.s);
  if (cols.length < 2) return null;
  const hy = hr.y, last = cols[cols.length - 1], gap = cols.length > 1 ? cols[cols.length - 1].cx - cols[cols.length - 2].cx : 250;
  // izinli/raporlu sütunu
  const iz = W.find((w) => /[İI]Z[İI]NL[İI]|RAPORLU/i.test(w.t) && w.cy > hy - mh * 2 && w.cy < hy + mh * 2 && w.cx > last.cx + gap * 0.4);
  if (iz) cols.push({ s: "", e: "", lab: "İzinli / Raporlu", cx: iz.cx, names: [] });
  cols.forEach((c) => { if (!c.lab) c.lab = c.s + " – " + c.e; });
  // 2) tarih
  let date = ""; W.forEach((w) => { const m = w.t.match(/(\d{2})[.\/](\d{2})[.\/](20\d{2})/); if (m && !date && w.cy < hy) date = m[3] + "-" + m[2] + "-" + m[1]; });
  // 3) gövde: satırlara ve öbeklere ayır
  const body = W.filter((w) => w.cy > hy + mh * 1.2 && !/^[\d:.\-–|_]+$/.test(w.t) || (w.cy > hy + mh * 1.2 && /[A-Za-zÇĞİÖŞÜçğıöşü]{2}/.test(w.t))).filter((w) => w.cy > hy + mh * 1.2);
  body.sort((a, b) => a.cy - b.cy); const ln = [];
  body.forEach((w) => { const l = ln.find((l) => Math.abs(l.y - w.cy) < mh * 0.7); if (l) { l.w.push(w); l.y = l.w.reduce((s, x) => s + x.cy, 0) / l.w.length; } else ln.push({ y: w.cy, w: [w] }); });
  const ph = [];
  ln.forEach((l) => { l.w.sort((a, b) => a.x0 - b.x0); let cur = null; l.w.forEach((w) => { if (cur && w.x0 - cur.x1 < mh * 2.4) { cur.t += " " + w.t; cur.x1 = w.x1; cur.y1 = Math.max(cur.y1, w.y1); cur.y0 = Math.min(cur.y0, w.y0); } else { cur = { t: w.t, x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; ph.push(cur); } }); });
  ph.forEach((p) => { p.cx = (p.x0 + p.x1) / 2; p.cy = (p.y0 + p.y1) / 2; });
  const firstC = cols[0].cx, lim = firstC - gap * 0.75;
  const HDR = /PERSONEL|\bADI\b|[İI]MZA|G[ÖO]REV|B[ÖO]LGES|GELMEYEN|NET\s*[ÇC]ALI|TAR[İI]H|VARD[İI]YA|[İI]Z[İI]NL[İI]|RAPORLU|KONTROL|ONAYLAYAN|G[ÜU]V\.?\s*M[ÜU]D|[İI][ŞS]LETME|ULUKARDE|FİRMA|F[İI]RMA|HİZMET|H[İI]ZMET|GÜVENLİK PERSONEL/i;
  const lab = [], nm = [];
  ph.forEach((p) => { const letters = (p.t.match(/[A-Za-zÇĞİÖŞÜçğıöşü]/g) || []).length; if (letters < 3) return;
    if (p.x0 < lim || /^\d{1,2}(\s|\/|-)/.test(p.t) && p.x0 < firstC - gap * 0.3) { lab.push(p); return; }
    if (HDR.test(p.t) || /[İI]Z[İI]N\s*$/i.test(p.t)) return; nm.push(p); });
  for (let i = lab.length - 1; i >= 0; i--) if (/[İI]Z[İI]N|^RP$/i.test(lab[i].t)) lab.splice(i, 1);
  // etiket (görev yeri) birleştir: alt alta ve aynı hizada ise
  lab.sort((a, b) => a.cy - b.cy); const lb = []; lab.forEach((p) => { const l = lb[lb.length - 1]; if (l && p.y0 - l.y1 < mh * 0.8 && Math.abs(p.x0 - l.x0) < mh * 3) { l.t += " " + p.t; l.y1 = p.y1; l.cy = (l.y0 + l.y1) / 2; } else lb.push({ t: p.t, x0: p.x0, y0: p.y0, y1: p.y1, cy: p.cy }); });
  nm.forEach((p) => {
    let ci = 0, bd = 1e9; cols.forEach((c, i) => { const d = Math.abs(c.cx - p.cx); if (d < bd) { bd = d; ci = i; } });
    if (bd > gap * 0.9) return;
    let post = "", pd = 1e9; lb.forEach((l) => { const d = Math.abs(l.cy - p.cy); if (d < pd) { pd = d; post = l.t; } });
    if (pd > mh * 2.2) post = "";
    const cl = (s) => s.replace(/[|_=~]+/g, "").replace(/^[^A-Za-zÇĞİÖŞÜçğıöşü0-9]+|[^A-Za-zÇĞİÖŞÜçğıöşü0-9.]+$/g, "").replace(/\s+/g, " ").trim();
    cols[ci].names.push({ n: cl(p.t), p: cl(post), y: p.cy });
  });
  cols.forEach((c) => c.names.sort((a, b) => a.y - b.y));
  return { cols: cols.map((c) => ({ lab: c.lab, s: c.s, e: c.e, names: c.names })), date: date };
}

async function ocrW(file, prog) {
  if (window.__ocrWords) return window.__ocrWords;
  const bm = await createImageBitmap(file), sc = Math.min(1, 3000 / Math.max(bm.width, bm.height)), cv = document.createElement("canvas");
  cv.width = Math.round(bm.width * sc); cv.height = Math.round(bm.height * sc); const cx = cv.getContext("2d"); try { cx.filter = "grayscale(1) contrast(1.35)"; } catch (e) {}
  cx.drawImage(bm, 0, 0, cv.width, cv.height);
  const m = await import(TJ), cw = m.createWorker || (m.default && m.default.createWorker);
  const w = await cw("tur", 1, { logger: (x) => { if (x.status === "recognizing text") prog("Okunuyor… %" + Math.round(x.progress * 100)); else prog("Hazırlanıyor… (ilk seferde dil dosyası iner)"); } });
  try { await w.setParameters({ tessedit_pageseg_mode: "11" }); } catch (e) {}
  const r = await w.recognize(cv); try { await w.terminate(); } catch (e) {}
  return (r.data.words || []).map((x) => ({ t: x.text, x0: x.bbox.x0, y0: x.bbox.y0, x1: x.bbox.x1, y1: x.bbox.y1 }));
}
async function save(c, name, post, date, who) {
  let D; try { D = JSON.parse(localStorage.getItem("na_vardiya_v1")) || {}; } catch (e) { D = {}; }
  D.types = D.types || []; D.days = D.days || {}; D.fr = D.fr || []; D.target = D.target || 195;
  let id = "izin";
  if (c.s) { const e0 = c.e === "24:00" ? "00:00" : c.e; c = { s: c.s, e: e0 }; id = "g:" + c.s + "-" + c.e; if (!D.types.some((t) => t.id === id)) { const h = +c.s.slice(0, 2), g = h >= 22 || h <= 5, a = h >= 12 && !g; D.types.push({ id: id, n: c.s + " – " + c.e, ic: g ? "🌙" : a ? "🌇" : "☀️", c: g ? "#7c93ff" : a ? "#e06fa8" : "#f0c24b", s: c.s, e: c.e }); } }
  else if (!D.types.some((t) => t.id === "izin")) D.types.push({ id: "izin", n: "İzin", ic: "🏖️", c: "#4cc9a4", off: 1 });
  let tgt = D.days;
  if (who) { let f = D.fr.find((x) => fold(x.n) === fold(who)); if (!f) { f = { id: "f" + Date.now().toString(36), n: who, days: {} }; D.fr.push(f); } f.days = f.days || {}; tgt = f.days; }
  tgt[date] = { t: id, n: post || "" }; localStorage.setItem("na_vardiya_v1", JSON.stringify(D));
}
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
function open() {
  const ov = E("div", "position:fixed;inset:0;z-index:99999;background:var(--bg,#0f1320);color:var(--text,#eee);overflow:auto;padding:14px;font-family:inherit");
  const top = E("div", "display:flex;align-items:center;gap:10px"); const bk = E("button", BS, "← Geri"); bk.type = "button"; top.appendChild(bk); top.appendChild(E("b", "font-size:17px", "📋 Günlük çizelge")); ov.appendChild(top);
  const body = E("div"); ov.appendChild(body); document.body.appendChild(ov);
  const close = () => { try { ov.remove(); } catch (e) {} window.removeEventListener("popstate", close); };
  bk.onclick = () => { close(); try { if (history.state && history.state.gc) history.back(); } catch (e) {} };
  try { history.pushState({ gc: 1, vdb: 1 }, ""); window.addEventListener("popstate", close); } catch (e) {}
  let R = null, dt = today(), q = "", st = "";
  const draw1 = () => {
    body.innerHTML = "";
    body.appendChild(E("div", "margin-top:12px;font-size:14px;opacity:.85;line-height:1.5", "Günlük vardiya çizelgesinin (görev yeri satırlarda, vardiya saatleri sütunlarda) fotoğrafını seç. Tablo düz, yakın ve aydınlık olsun. Her vardiya ayrı bölümde listelenir."));
    const fi = E("input", "margin-top:12px"); fi.type = "file"; fi.accept = "image/*"; body.appendChild(fi);
    const go = E("button", BS + ";width:100%;margin-top:14px;background:var(--lamp,#f0c24b);color:#000;font-weight:700", "🔎 Çizelgeyi oku"); go.type = "button"; body.appendChild(go);
    const sm = E("div", "margin-top:12px;font-size:14px;line-height:1.5", st); body.appendChild(sm);
    go.onclick = async () => {
      const f = fi.files && fi.files[0]; if (!window.__ocrWords && !f) { sm.textContent = "Önce fotoğrafı seç."; return; } go.disabled = true;
      try { const w = await ocrW(f, (x) => { sm.textContent = x; }); R = parse(w); } catch (e) { st = "Fotoğraf okunamadı. İnternet bağlantını kontrol edip tekrar dene (okuyucu ilk seferde internetten yüklenir)."; draw1(); return; }
      if (!R) { st = "Tablodaki vardiya saatlerini (08:00-16:00 gibi başlıkları) bulamadım. Tüm tabloyu, başlık satırıyla birlikte, düz ve yakından çek."; draw1(); return; }
      if (R.date) dt = R.date; st = ""; drawR();
    };
  };
  const drawR = () => {
    body.innerHTML = ""; const tt = R.cols.reduce((s, c) => s + c.names.length, 0);
    const t2 = E("div", "display:flex;gap:8px;margin-top:12px;align-items:center"); const bb = E("button", BS, "↩ Başa dön"); bb.type = "button"; bb.onclick = draw1; t2.appendChild(bb); t2.appendChild(E("span", "font-size:13px;opacity:.8", tt + " kişi okundu")); body.appendChild(t2);
    const dr = E("div", "display:flex;align-items:center;gap:10px;margin-top:12px"); dr.appendChild(E("span", "font-size:14px;flex:1", "Çizelge tarihi")); const di = E("input", IS + ";width:170px;padding:8px"); di.type = "date"; di.value = dt; di.onchange = () => { dt = di.value || dt; }; dr.appendChild(di); body.appendChild(dr);
    const qi = E("input", IS + ";margin-top:12px"); qi.placeholder = "İsimle ara"; qi.value = q; body.appendChild(qi);
    body.appendChild(E("div", "margin-top:8px;font-size:13px;opacity:.8", "Okuma hatası olursa bir isme dokunup düzelt. Eksik kişiyi bölümdeki \"＋ Kişi ekle\" ile ekle."));
    const lw = E("div"); body.appendChild(lw);
    const list = () => {
      lw.innerHTML = ""; const w = fold(q).split(" ").filter(Boolean);
      R.cols.forEach((c, ci) => {
        const ns = c.names.filter((x) => { const fw = fold(x.n).split(/[^a-z0-9]+/); return !w.length || w.every((y) => fw.some((z) => z.indexOf(y) === 0)); });
        if (w.length && !ns.length) return;
        const h = +((c.s || "12").slice(0, 2)), ic = !c.s ? "🏖️" : h >= 22 || h <= 5 ? "🌙" : h >= 12 ? "🌇" : "☀️";
        const sec = E("div", "margin-top:16px;border:1px solid var(--line,#333);border-radius:14px;padding:10px 12px");
        sec.appendChild(E("div", "font-weight:700;font-size:16px", ic + " " + c.lab + " · " + c.names.length + " kişi"));
        ns.forEach((x) => { const b = E("button", BS + ";width:100%;margin-top:8px;text-align:left;display:block", ""); b.type = "button"; b.appendChild(E("div", "font-weight:700;font-size:15px", x.n)); if (x.p) b.appendChild(E("div", "margin-top:3px;font-size:12px;opacity:.75", "📍 " + x.p)); b.onclick = () => drawD(ci, c.names.indexOf(x)); sec.appendChild(b); });
        if (!ns.length) sec.appendChild(E("div", "margin-top:8px;font-size:13px;opacity:.7", "Bu vardiyada kimse okunmadı."));
        const ad = E("button", BS + ";width:100%;margin-top:8px;font-size:13px", "＋ Kişi ekle"); ad.type = "button"; ad.onclick = () => { c.names.push({ n: "", p: "", y: 1e9 }); drawD(ci, c.names.length - 1); }; sec.appendChild(ad);
        lw.appendChild(sec);
      });
    };
    qi.oninput = () => { q = qi.value; list(); }; list();
  };
  const drawD = (ci, ni) => {
    body.innerHTML = ""; const c = R.cols[ci], x = c.names[ni];
    const bb = E("button", BS + ";margin-top:12px", "↩ Listeye dön"); bb.type = "button"; bb.onclick = () => { if (!x.n.trim()) c.names.splice(ni, 1); drawR(); }; body.appendChild(bb);
    body.appendChild(E("div", "margin-top:14px;font-weight:700;font-size:16px", "Kişi bilgisi"));
    const n = E("input", IS + ";margin-top:8px"); n.placeholder = "Ad soyad"; n.value = x.n; body.appendChild(n);
    const p = E("input", IS + ";margin-top:8px"); p.placeholder = "Görev yeri (isteğe bağlı)"; p.value = x.p; body.appendChild(p);
    body.appendChild(E("div", "margin-top:12px;font-size:14px", "Vardiya"));
    const sl = E("select", IS + ";margin-top:6px"); R.cols.forEach((k, i) => sl.appendChild(new Option(k.lab, i))); sl.value = ci; body.appendChild(sl);
    body.appendChild(E("div", "margin-top:12px;font-size:14px", "Tarih"));
    const d = E("input", IS + ";margin-top:6px"); d.type = "date"; d.value = dt; body.appendChild(d);
    const msg = E("div", "margin-top:10px;font-size:14px;min-height:20px"); 
    const apply = () => { x.n = n.value.trim(); x.p = p.value.trim(); const k = +sl.value; if (k !== ci) { c.names.splice(ni, 1); R.cols[k].names.push(x); ci = k; ni = R.cols[k].names.length - 1; } dt = d.value || dt; return R.cols[ci]; };
    const sv = E("button", BS + ";width:100%;margin-top:14px;font-weight:700", "💾 Düzeltmeyi kaydet"); sv.type = "button"; sv.onclick = () => { apply(); drawR(); }; body.appendChild(sv);
    const ca = E("button", BS + ";width:100%;margin-top:10px;background:var(--lamp,#f0c24b);color:#000;font-weight:700", "📅 Takvimime ekle"); ca.type = "button";
    ca.onclick = async () => { const k = apply(); try { await save(k, x.n, x.p, dt, ""); msg.textContent = "✓ " + dt + " için " + k.lab + " takvimine eklendi. Vardiya ekranını yenileyince görünür."; } catch (e) { msg.textContent = "Kaydedilemedi, tekrar dene."; } }; body.appendChild(ca);
    const fr = E("button", BS + ";width:100%;margin-top:10px", "👥 Arkadaş olarak ekle"); fr.type = "button";
    fr.onclick = async () => { const k = apply(); if (!x.n) { msg.textContent = "Önce ad yaz."; return; } try { await save(k, x.n, x.p, dt, x.n); msg.textContent = "✓ " + x.n + " arkadaş olarak eklendi (" + dt + ")."; } catch (e) { msg.textContent = "Kaydedilemedi, tekrar dene."; } }; body.appendChild(fr);
    body.appendChild(msg);
    const dl = E("button", BS + ";width:100%;margin-top:14px;color:#ff8a8a;margin-bottom:24px", "🗑 Bu kişiyi listeden sil"); dl.type = "button"; dl.onclick = () => { c.names.splice(ni, 1); drawR(); }; body.appendChild(dl);
  };
  draw1();
}
let pend = false;
const scan = () => {
  pend = false;
  document.querySelectorAll("button[data-ph]").forEach((b) => { if (!b.dataset.gc && !(b.nextElementSibling && b.nextElementSibling.dataset.gc)) { const n = b.cloneNode(false); n.removeAttribute("data-ph"); n.dataset.gc = "1"; n.textContent = "📋 Günlük çizelge"; n.onclick = (e) => { e.stopPropagation(); open(); }; b.insertAdjacentElement("afterend", n); } });
};
try { new MutationObserver(() => { if (!pend) { pend = true; setTimeout(scan, 200); } }).observe(document.body, { childList: true, subtree: true }); scan(); } catch (e) {}
