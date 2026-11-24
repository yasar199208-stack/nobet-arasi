// Vardiya takibi 3. parça: PDF listesinden kendi satırını bulup takvime aktarma. PDF telefonda açılır, hiçbir yere gönderilmez.
const PB = window.__vdPdfBase || "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/legacy/build";
const MONF = ["ocak", "subat", "mart", "nisan", "mayis", "haziran", "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik"];
let lib = null;
async function getLib() {
  if (lib) return lib;
  lib = await import(PB + "/pdf.min.mjs");
  lib.GlobalWorkerOptions.workerSrc = PB + "/pdf.worker.min.mjs";
  return lib;
}
function fold(s) {
  return String(s || "").toLocaleLowerCase("tr").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, " ").trim();
}
// Sayfadaki yazıları satırlara ve kelimelere ayırır; her kelimenin yeri (x) bilinir
function rowsOf(items) {
  const toks = [];
  items.forEach((it) => {
    const str = it.str || ""; if (!str.trim()) return;
    const x0 = it.transform[4], y = it.transform[5], w = it.width || str.length * 4, h = Math.abs(it.transform[3]) || 8, re = /\S+/g;
    let m;
    while ((m = re.exec(str))) toks.push({ s: m[0], x: x0 + w * (m.index + m[0].length / 2) / str.length, x1: x0 + w * m.index / str.length, x2: x0 + w * (m.index + m[0].length) / str.length, y: y, h: h });
  });
  toks.sort((a, b) => b.y - a.y || a.x - b.x);
  const rows = [];
  toks.forEach((t) => {
    const r = rows.find((q) => Math.abs(q.y - t.y) <= Math.max(2, t.h * 0.45));
    if (r) r.t.push(t); else rows.push({ y: t.y, h: t.h, t: [t] });
  });
  rows.forEach((r) => r.t.sort((a, b) => a.x - b.x));
  return rows;
}
function matchRow(r, q) { const ws = r.t.map((t) => fold(t.s)); return q.every((w) => ws.some((x) => x === w || (w.length >= 3 && x.indexOf(w) === 0))); }
function guess(code, types) {
  const c = fold(code).replace(/ /g, "");
  const by = (id) => (types.some((t) => t.id === id) ? id : "");
  if (/^(g|gn|gunduz|d|day)$/.test(c)) return by("gunduz");
  if (/^(n|gece|ng)$/.test(c)) return by("gece");
  if (/^(24|24s|tam|t|24saat)$/.test(c)) return by("tam");
  if (/^(s|sabah)$/.test(c)) return by("sabah");
  if (/^(a|aksam)$/.test(c)) return by("aksam");
  if (/^(i|iz|izin|x|ht|h|hi|yi|y|off|hafta)$/.test(c)) return by("izin");
  if (/^(r|rp|rapor|raporlu)$/.test(c)) return by("rapor");
  const m = String(code).match(/^(\d{1,2})[:.]?(\d{2})?\s*[-–]\s*(\d{1,2})/);
  if (m) {
    const a = +m[1], b = +m[3] % 24, f = types.find((t) => !t.off && +t.s.slice(0, 2) === a % 24 && +t.e.slice(0, 2) === b);
    return f ? f.id : "";
  }
  return "";
}
// Satırdaki hücreleri günlere dağıtır: önce sayfadaki 1,2,3… başlık satırına göre, bulunamazsa sırayla
function assign(rows, ri, q) {
  const row = rows[ri], out = {}; let auto = false;
  let hdr = null;
  for (let i = ri - 1; i >= 0 && !hdr; i--) {
    const nums = rows[i].t.filter((t) => /^\d{1,2}$/.test(t.s) && +t.s >= 1 && +t.s <= 31);
    if (nums.length >= 15) hdr = nums;
  }
  if (hdr) {
    const xs = hdr.map((t) => t.x), sp = (Math.max.apply(null, xs) - Math.min.apply(null, xs)) / Math.max(1, hdr.length - 1);
    const lo = Math.min.apply(null, xs) - sp * 0.6, hi = Math.max.apply(null, xs) + sp * 0.6;
    row.t.forEach((t) => {
      if (t.x < lo || t.x > hi) return;
      let best = null; hdr.forEach((h) => { if (!best || Math.abs(h.x - t.x) < Math.abs(best.x - t.x)) best = h; });
      const d = +best.s; out[d] = out[d] ? out[d] + " " + t.s : t.s;
    });
    auto = true;
  } else {
    let last = -1; row.t.forEach((t, i) => { if (q.some((w) => fold(t.s).indexOf(w) === 0)) last = i; });
    row.t.slice(last + 1).filter((t) => t.s.length <= 8 && !(/^\d{3,}$/.test(t.s))).forEach((t, i) => { if (i < 31) out[i + 1] = t.s; });
  }
  return { out: out, auto: auto };
}

export function pdf(api) {
  const { el, toast, openSheet, closeSheet, ymd, MON, save, render } = api;
  openSheet((sh) => {
    sh.appendChild(el("h3", "", "📄 PDF'den vardiya yükle"));
    sh.appendChild(el("div", "vd-tg", "🔒 PDF yalnızca telefonunda açılır, hiçbir yere gönderilmez. Yalnızca seçtiğin satır bu telefondaki takvime yazılır. Başkasının satırını sadece sen “arkadaşım olarak ekle” dersen kaydedilir."));
    sh.appendChild(el("label", "", "Listedeki ad soyad (kendin ya da arkadaşın)"));
    const nm = el("input"); nm.maxLength = 40; nm.placeholder = "Örn: Ahmet Yılmaz"; try { nm.value = localStorage.getItem("na_vardiya_ad") || ""; } catch (e) {} sh.appendChild(nm);
    sh.appendChild(el("label", "", "Vardiya listesi (PDF) · Arkadaşının adını yazıp aynı PDF’i seçersen onun vardiyasını da ekleyebilirsin"));
    const fi = el("input"); fi.type = "file"; fi.accept = ".pdf,application/pdf"; sh.appendChild(fi);
    const go = el("button", "vd-btn p", "🔍 Yerimi bul"); go.type = "button"; go.style.cssText = "width:100%;margin-top:12px"; sh.appendChild(go);
    const msg = el("div", "vd-tg"); msg.style.marginTop = "12px"; msg.hidden = true; sh.appendChild(msg);
    const res = el("div"); sh.appendChild(res);
    const say = (t) => { msg.hidden = !t; msg.textContent = t || ""; };
    let busy = false;
    go.onclick = async () => {
      if (busy) return;
      const q = fold(nm.value).split(" ").filter((w) => w.length >= 2), f = fi.files && fi.files[0];
      if (!q.length) { say("Önce listedeki adını yaz."); return; }
      if (!f) { say("Önce PDF dosyasını seç."); return; }
      busy = true; res.innerHTML = ""; say("PDF okunuyor, birkaç saniye sürebilir…");
      try {
        try { localStorage.setItem("na_vardiya_ad", nm.value.trim()); } catch (e) {}
        const L = await getLib(), doc = await L.getDocument({ data: await f.arrayBuffer() }).promise, hits = [], pages = [];
        for (let p = 1; p <= Math.min(doc.numPages, 40); p++) {
          const pg = await doc.getPage(p), tc = await pg.getTextContent(), rows = rowsOf(tc.items);
          pages.push({ pg: pg, rows: rows });
          rows.forEach((r, i) => { if (matchRow(r, q)) hits.push({ p: p - 1, i: i }); });
        }
        if (!pages.some((x) => x.rows.length)) { say("Bu PDF'den yazı okuyamadım. Taranmış (fotoğraf) bir PDF olabilir. Yazısı seçilebilen bir PDF dene."); busy = false; return; }
        if (!hits.length) { say("Adın PDF'de bulunamadı. Adı PDF'deki gibi yaz ya da sadece soyadını dene."); busy = false; return; }
        say(hits.length === 1 ? "Yerini buldum ✅" : hits.length + " satır buldum, seninkini seç:");
        if (hits.length === 1) show(hits[0]); else hits.forEach((h) => {
          const b = el("button", "vd-btn", "Sayfa " + (h.p + 1) + " · " + pages[h.p].rows[h.i].t.map((t) => t.s).join(" ").slice(0, 46)); b.type = "button"; b.style.cssText = "width:100%;margin-top:7px;text-align:left";
          b.onclick = () => show(h); res.appendChild(b);
        });
        busy = false;
        async function show(h) {
          try { await show2(h); } catch (e) { say("Sayfa gösterilemedi, tekrar dene."); busy = false; }
        }
        async function show2(h) {
          res.innerHTML = ""; busy = true;
          const P = pages[h.p], row = P.rows[h.i], as = assign(P.rows, h.i, q);
          const vp = P.pg.getViewport({ scale: 1.8 }), cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height;
          const cx = cv.getContext("2d"); await P.pg.render({ canvasContext: cx, canvas: cv, viewport: vp }).promise;
          const x1 = Math.min.apply(null, row.t.map((t) => t.x1)), x2 = Math.max.apply(null, row.t.map((t) => t.x2));
          const T = vp.transform, pt = (x, y) => [T[0] * x + T[2] * y + T[4], T[1] * x + T[3] * y + T[5]], pa = pt(x1 - 3, row.y - row.h * 0.3), pb = pt(x2 + 3, row.y + row.h * 1.05), r = [pa[0], pa[1], pb[0], pb[1]], rx = Math.min(r[0], r[2]), ry = Math.min(r[1], r[3]), rw = Math.abs(r[2] - r[0]), rh = Math.abs(r[3] - r[1]);
          cx.fillStyle = "rgba(255,214,0,0.35)"; cx.fillRect(rx, ry, rw, rh); cx.strokeStyle = "#e11d48"; cx.lineWidth = 3; cx.strokeRect(rx, ry, rw, rh);
          const box = el("div"); box.style.cssText = "overflow:auto;max-height:230px;border:1px solid var(--line);border-radius:12px;margin-top:12px;background:#fff"; box.appendChild(cv); res.appendChild(box);
          box.scrollTop = Math.max(0, ry - 90); box.scrollLeft = Math.max(0, rx - 20);
          res.appendChild(el("div", "vd-tg", "Sarı çerçeve senin satırın. Kaydırarak PDF'i inceleyebilirsin."));
          const days = Object.keys(as.out).map(Number).sort((a, b) => a - b);
          if (!days.length) { say("Satırında vardiya kodu bulamadım."); busy = false; return; }
          if (!as.auto) res.appendChild(el("div", "vd-tg", "⚠️ Gün sütunlarını otomatik bulamadım, hücreleri sırayla 1. günden başlattım. Aşağıdan kontrol et."));
          const codes = []; days.forEach((d) => { const c = as.out[d].toUpperCase(); if (codes.indexOf(c) < 0) codes.push(c); });
          res.appendChild(el("label", "", "Kodlar hangi vardiya?"));
          const sel = {};
          codes.forEach((c) => {
            const r2 = el("div", "vd-r"), lb = el("b", "", c), s = el("select"); lb.style.cssText = "min-width:70px;font-size:17px";
            s.appendChild(new Option("Atla", "")); api.D.types.forEach((t) => s.appendChild(new Option(t.ic + " " + t.n, t.id))); s.value = guess(c, api.D.types);
            r2.appendChild(lb); r2.appendChild(s); res.appendChild(r2); sel[c] = s;
          });
          res.appendChild(el("label", "", "Hangi ay?"));
          const r3 = el("div", "vd-r"), ms = el("select"), ys = el("select"), v = api.getView();
          MON.forEach((m, i) => ms.appendChild(new Option(m, i))); const y0 = new Date().getFullYear(); for (let y = y0 - 1; y <= y0 + 1; y++) ys.appendChild(new Option(y, y));
          let dm = v.getMonth(), dy = v.getFullYear();
          P.rows.slice(0, 14).forEach((rr) => { const tx = fold(rr.t.map((t) => t.s).join(" ")); MONF.forEach((m, i) => { if (tx.split(" ").indexOf(m) >= 0) { dm = i; const yy = tx.match(/\b(20\d\d)\b/); if (yy) dy = +yy[1]; } }); });
          ms.value = dm; ys.value = dy; r3.appendChild(ms); r3.appendChild(ys); res.appendChild(r3);
          const ap = el("button", "vd-btn p", "✅ Kendi takvimime aktar"); ap.type = "button"; ap.style.cssText = "width:100%;margin-top:14px";
          const put = (fid) => {
            let n = 0; const mo = +ms.value, yr = +ys.value, dim = new Date(yr, mo + 1, 0).getDate(), dd = fid ? api.D.fr.find((x) => x.id === fid).days : api.D.days;
            days.forEach((d) => {
              const id = sel[as.out[d].toUpperCase()].value; if (!id || d > dim) return;
              const k = ymd(new Date(yr, mo, d)); dd[k] = { t: id, n: (dd[k] && dd[k].n) || "" }; n++;
            });
            if (!n) { toast("Hiçbir kod eşlenmedi, bir vardiya seç."); return; }
            api.setSel(fid || ""); save(); closeSheet(); api.setView(new Date(yr, mo, 1)); render(); toast(n + " gün aktarıldı.");
          };
          ap.onclick = () => put("");
          res.appendChild(ap);
          const nmv = nm.value.trim(), fb = el("button", "vd-btn", "👥 " + nmv + " adlı ARKADAŞIM olarak ekle"); fb.type = "button"; fb.style.cssText = "width:100%;margin-top:9px";
          fb.onclick = () => { const key = fold(nmv); let f = api.D.fr.find((x) => fold(x.n) === key); if (!f) f = api.newFriend(nmv); put(f.id); };
          res.appendChild(fb); busy = false;
        }
      } catch (e) { say("PDF okunamadı. İnternet bağlantını kontrol edip tekrar dene. (PDF okuyucu ilk seferde internetten yüklenir.)"); busy = false; }
    };
  });
}
