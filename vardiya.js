// Vardiya takibi: nöbet takvimi, sıradaki nöbet sayacı, döngü ile doldurma, aylık özet. Veriler yalnızca bu telefonda saklanır.
const KEY = "na_vardiya_v1";
const DEF = [
  { id: "gunduz", n: "Gündüz", ic: "☀️", c: "#f0c24b", s: "08:00", e: "20:00" }, { id: "gece", n: "Gece", ic: "🌙", c: "#7c93ff", s: "20:00", e: "08:00" },
  { id: "tam", n: "24 Saat", ic: "⏳", c: "#ff8a5b", s: "08:00", e: "08:00" }, { id: "sabah", n: "Sabah", ic: "🌅", c: "#ffb36b", s: "08:00", e: "16:00" },
  { id: "aksam", n: "Akşam", ic: "🌇", c: "#e06fa8", s: "16:00", e: "00:00" }, { id: "izin", n: "İzin", ic: "🏖️", c: "#4cc9a4", off: 1 }, { id: "rapor", n: "Rapor", ic: "🩺", c: "#9aa7b8", off: 1 }
];
const MON = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const DS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DL = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function load() {
  try { const x = JSON.parse(localStorage.getItem(KEY)); if (x && Array.isArray(x.types) && x.days) return x; } catch (e) {}
  return { types: DEF.map((t) => Object.assign({}, t)), days: {}, target: 195 };
}
let D = load();
if (!Array.isArray(D.fr)) D.fr = [];
let sel = "";
function days() { const f = sel && D.fr.find((x) => x.id === sel); return f ? f.days : D.days; }
function who(k) { const o = []; if (sel) { const e = D.days[k], t = e && tdef(e.t); if (t) o.push(["Sen", t]); } else D.fr.forEach((f) => { const e = f.days[k], t = e && tdef(e.t); if (t) o.push([f.n, t, f]); }); return o; }
function wa(f, msg) {
  let n = String((f && f.p) || "").replace(/\D/g, "");
  if (n.length === 11 && n[0] === "0") n = "9" + n; else if (n.length === 10 && n[0] === "5") n = "90" + n;
  if (n.length < 10) { if (!msg) { toast("Önce “Arkadaşlar”dan telefon numarasını gir."); return; } window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank", "noopener"); toast("WhatsApp’ta kişiyi seç."); return; }
  window.open("https://wa.me/" + n + (msg ? "?text=" + encodeURIComponent(msg) : ""), "_blank", "noopener");
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { toast("Kaydedilemedi, depolama dolu olabilir."); } }

const st = document.createElement("style");
st.textContent = `
.vd{position:fixed;inset:0;z-index:45;background:var(--bg);color:var(--text);display:flex;flex-direction:column;animation:vdin .22s ease}
@keyframes vdin{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.vd *,.vd-sb *{box-sizing:border-box}
.vd-h{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line);background:var(--panel)}
.vd-h h2{margin:0;font-size:19px;flex:1}
.vd-ib{background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:7px 11px;font-size:16px;cursor:pointer}
.vd-b{flex:1;overflow:auto;padding:14px;max-width:560px;width:100%;margin:0 auto}
.vd-hero{border-radius:20px;padding:18px;border:1px solid var(--line);background:linear-gradient(135deg,rgba(240,194,75,.2),rgba(124,147,255,.16));box-shadow:0 8px 24px rgba(0,0,0,.25)}
.vd-hero small{color:var(--mute);font-size:13px;letter-spacing:.3px}
.vd-hero .big{font-size:30px;font-weight:800;margin:4px 0 2px;line-height:1.15}
.vd-hero .sub{font-size:15px;color:var(--text);opacity:.9}
.vd-bar{height:9px;border-radius:9px;background:rgba(255,255,255,.12);margin-top:12px;overflow:hidden}
.vd-bar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,var(--lamp),#ff8a5b)}
.vd-wk{display:flex;gap:7px;margin:12px 0;overflow-x:auto;padding-bottom:2px}
.vd-wk div{flex:1 0 54px;text-align:center;border:1px solid var(--line);border-radius:14px;padding:8px 2px;background:var(--panel);font-size:12px;color:var(--mute)}
.vd-wk div b{display:block;font-size:19px;margin:2px 0;color:var(--text)}
.vd-wk div.t{border-color:var(--lamp)}
.vd-mn{display:flex;align-items:center;justify-content:space-between;margin:14px 0 8px}
.vd-mn b{font-size:18px}
.vd-mn button{background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:10px;width:42px;height:38px;font-size:18px;cursor:pointer}
.vd-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.vd-cal .w{text-align:center;font-size:11px;color:var(--mute);padding:2px 0}
.vd-d{position:relative;min-height:56px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--text);cursor:pointer;padding:4px 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;font:inherit}
.vd-d .n{position:absolute;left:6px;top:3px;font-size:11px;color:var(--mute)}
.vd-d .i{font-size:20px;line-height:1;margin-top:8px}
.vd-d .h{font-size:10px;color:var(--mute);margin-top:2px}
.vd-d.t{box-shadow:0 0 0 2px var(--lamp)}
.vd-d.z{opacity:.0;pointer-events:none}
.vd-sts{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:14px 0}
.vd-sts div{background:var(--panel);border:1px solid var(--line);border-radius:14px;text-align:center;padding:10px 2px}
.vd-sts b{display:block;font-size:20px}.vd-sts span{font-size:11px;color:var(--mute)}
.vd-tg{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px;font-size:13px;color:var(--mute)}
.vd-act{display:flex;gap:8px;margin:14px 0 24px;flex-wrap:wrap}
.vd-act button,.vd-btn{flex:1 1 30%;background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:12px;padding:12px 6px;font-size:14px;font-weight:600;cursor:pointer}
.vd-btn.p{background:var(--lamp);color:var(--lamp-ink);border-color:var(--lamp)}
.vd-sb{position:fixed;inset:0;z-index:46;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center}
.vd-sh{width:100%;max-width:560px;max-height:88%;overflow:auto;background:var(--panel);border-top:3px solid var(--lamp);border-radius:20px 20px 0 0;padding:16px;animation:vdup .22s ease}
@keyframes vdup{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.vd-sh h3{margin:0 0 12px;font-size:18px}
.vd-sh label{display:block;font-size:13px;color:var(--mute);margin:12px 0 5px}
.vd-sh input,.vd-sh select,.vd-sh textarea{width:100%;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit}
.vd-ch{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.vd-ch button{display:flex;align-items:center;gap:8px;text-align:left;background:var(--bg);border:1px solid var(--line);color:var(--text);border-radius:12px;padding:10px;font:inherit;cursor:pointer}
.vd-ch button span{font-size:22px}.vd-ch button small{display:block;color:var(--mute);font-size:11px}
.vd-ch button.on{border-color:var(--lamp);box-shadow:0 0 0 2px var(--lamp)}
.vd-pr{display:flex;flex-direction:column;gap:7px}
.vd-pr button{text-align:left;background:var(--bg);border:1px solid var(--line);color:var(--text);border-radius:12px;padding:11px;font:inherit;cursor:pointer}
.vd-pr button.on{border-color:var(--lamp);box-shadow:0 0 0 2px var(--lamp)}
.vd-r{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.vd-r input[type=text]{flex:1}.vd-r input[type=time]{width:110px;flex:none;padding:10px 6px}.vd-r input[type=text]{min-width:0}
.vd-fc{display:flex;gap:7px;overflow-x:auto;margin:12px 0 2px;padding-bottom:3px}
.vd-fc button{flex:none;background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:20px;padding:7px 13px;font:inherit;font-size:14px;cursor:pointer;white-space:nowrap}
.vd-fc button.on{background:var(--lamp);color:var(--lamp-ink);border-color:var(--lamp);font-weight:700}
.vd-who{margin-top:14px}.vd-who div{display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line);font-size:14px}.vd-who b{flex:1}
.vd-seq{min-height:40px;border:1px dashed var(--line);border-radius:12px;padding:8px;font-size:22px}
`;
document.head.appendChild(st);

function el(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
function toast(m) {
  const t = document.getElementById("toast"); if (!t) return;
  t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3200);
}
const pad = (n) => (n < 10 ? "0" : "") + n;
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const mins = (s) => { const p = String(s || "00:00").split(":"); return (+p[0] || 0) * 60 + (+p[1] || 0); };
const wd = (d) => (d.getDay() + 6) % 7;
const PAL = ["#4cc9a4", "#7c93ff", "#f0c24b", "#ff8a5b", "#e06fa8", "#5bc0eb", "#9bc53d", "#c77dff"];
function tdef(id) {
  const t = D.types.find((x) => x.id === id); if (t || !id || id.slice(0, 2) !== "c:") return t;
  const c = id.slice(2); let h = 0; for (let i = 0; i < c.length; i++) h = (h * 31 + c.charCodeAt(i)) >>> 0;
  return { id: id, n: c, ic: "📍", c: PAL[h % 8], cd: 1 };
}
function dur(t) { if (!t || t.off || t.cd) return 0; return ((((mins(t.e) - mins(t.s)) % 1440) + 1440) % 1440 || 1440) / 60; }
function iv(d, t) {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, mins(t.s));
  return [a, new Date(a.getTime() + dur(t) * 3600000)];
}
function isNight(t) { return !t.off && (mins(t.s) >= 1200 || mins(t.s) < 300) && dur(t) < 24; }
function rgba(h, a) { const n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }
function span(ms) {
  const m = Math.max(0, Math.floor(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
  if (d > 0) return d + " gün " + h + " sa";
  if (h > 0) return h + " sa " + (m % 60) + " dk";
  return (m % 60) + " dk";
}
function dayName(d, now) {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()), b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const k = Math.round((b - a) / 86400000);
  if (k === 0) return "Bugün"; if (k === 1) return "Yarın";
  return DS[wd(d)] + " " + d.getDate() + " " + MON[d.getMonth()].slice(0, 3);
}
const hm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());

let root = null, heroEl = null, sheet = null, tick = 0, view = new Date();
function nextInfo(now) {
  let cur = null, nxt = null;
  for (let k = -1; k <= 120 && !(cur && nxt); k++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k), e = D.days[ymd(d)], t = e && tdef(e.t);
    if (!t || t.off || t.cd) continue;
    const r = iv(d, t);
    if (now >= r[0] && now < r[1]) cur = { t: t, a: r[0], b: r[1] };
    else if (r[0] > now && !nxt) nxt = { t: t, a: r[0], b: r[1] };
  }
  return { cur: cur, nxt: nxt };
}
function updHero() {
  if (!heroEl) return;
  const now = new Date(), x = nextInfo(now);
  heroEl.innerHTML = "";
  if (x.cur) {
    heroEl.appendChild(el("small", "", "ŞU AN NÖBETTESİN"));
    heroEl.appendChild(el("div", "big", x.cur.t.ic + " " + x.cur.t.n));
    heroEl.appendChild(el("div", "sub", "Bitişe " + span(x.cur.b - now) + " kaldı · " + hm(x.cur.b)));
    const b = el("div", "vd-bar"), i = el("i"); i.style.width = Math.min(100, Math.max(2, (now - x.cur.a) / (x.cur.b - x.cur.a) * 100)) + "%";
    b.appendChild(i); heroEl.appendChild(b);
  } else if (x.nxt) {
    heroEl.appendChild(el("small", "", "SIRADAKİ NÖBET"));
    heroEl.appendChild(el("div", "big", span(x.nxt.a - now) + " sonra"));
    heroEl.appendChild(el("div", "sub", x.nxt.t.ic + " " + x.nxt.t.n + " · " + dayName(x.nxt.a, now) + " " + hm(x.nxt.a) + "–" + hm(x.nxt.b)));
  } else {
    heroEl.appendChild(el("small", "", "VARDİYA"));
    heroEl.appendChild(el("div", "big", "Takvim boş"));
    heroEl.appendChild(el("div", "sub", "Bir güne dokun, “PDF’den yükle” ya da “Döngü ile doldur” de."));
  }
}

function closeSheet() { if (sheet) { sheet.remove(); sheet = null; } }
function openSheet(build) {
  closeSheet();
  const back = el("div", "vd-sb"), sh = el("div", "vd-sh");
  back.onclick = (e) => { if (e.target === back) closeSheet(); };
  build(sh); back.appendChild(sh); document.body.appendChild(back); sheet = back;
}

function dayCell(d, now) {
  const k = ymd(d), e = days()[k], t = e && tdef(e.t);
  const b = el("button", "vd-d" + (k === ymd(now) ? " t" : "")); b.type = "button";
  b.appendChild(el("span", "n", d.getDate()));
  if (t) {
    b.style.background = rgba(t.c, 0.18); b.style.borderColor = rgba(t.c, 0.6);
    if (t.cd) { const c = el("span", "i", t.n.length > 6 ? t.n.slice(0, 6) : t.n); c.style.cssText = "font-size:12px;font-weight:700;margin-top:10px"; b.appendChild(c); } else {
      b.appendChild(el("span", "i", t.ic));
      b.appendChild(el("span", "h", t.off ? (t.n.length > 5 ? t.n.slice(0, 5) : t.n) : dur(t) + "s"));
    }
  } else b.appendChild(el("span", "i", "·"));
  if (e && e.n) b.appendChild(el("span", "h", "📝"));
  if (!sel && D.fr.length && t && !t.off) { const c = who(k).filter((q) => !q[1].off).length; if (c) b.appendChild(el("span", "h", "👥" + c)); }
  b.onclick = () => dayEdit(d);
  return b;
}
function render() {
  if (!root) return;
  const now = new Date(), keep = root.querySelector(".vd-b"), top = keep ? keep.scrollTop : 0;
  root.innerHTML = "";
  const h = el("div", "vd-h"), cl = el("button", "vd-ib", "✕"); cl.type = "button"; cl.onclick = close;
  h.appendChild(el("h2", "", "🗓️ Vardiyam")); h.appendChild(cl); root.appendChild(h);
  const b = el("div", "vd-b"); root.appendChild(b);
  heroEl = el("div", "vd-hero"); b.appendChild(heroEl); updHero();
  const wk = el("div", "vd-wk");
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i), e = D.days[ymd(d)], t = e && tdef(e.t);
    const c = el("div", i === 0 ? "t" : ""); c.appendChild(document.createTextNode(i === 0 ? "Bugün" : DS[wd(d)]));
    c.appendChild(el("b", "", d.getDate())); c.appendChild(document.createTextNode(t ? t.ic : "–")); wk.appendChild(c);
  }
  b.appendChild(wk);
  if (D.fr.length) {
    const fc = el("div", "vd-fc"), mk = (id, tx) => { const x = el("button", sel === id ? "on" : "", tx); x.type = "button"; x.onclick = () => { sel = id; render(); }; fc.appendChild(x); };
    mk("", "👤 Ben"); D.fr.forEach((f) => mk(f.id, f.n)); b.appendChild(fc);
    if (sel) {
      const sf = D.fr.find((x) => x.id === sel) || {};
      b.appendChild(el("div", "vd-tg", "👁️ " + (sf.n || "") + " adlı arkadaşının takvimi. Güne dokunup onun vardiyasını düzeltebilirsin."));
      const wb = el("button", "vd-btn", "💬 " + (sf.n || "") + " ile WhatsApp’ta yaz"); wb.type = "button"; wb.style.cssText = "width:100%;margin-top:8px"; wb.onclick = () => wa(sf, "Selam, nöbet arası müsait misin?"); b.appendChild(wb);
    }
  }
  const mn = el("div", "vd-mn"), pv = el("button", "", "‹"), nx = el("button", "", "›"); pv.type = nx.type = "button";
  pv.onclick = () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); };
  nx.onclick = () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); };
  const mt = el("b", "", MON[view.getMonth()] + " " + view.getFullYear()); mt.onclick = () => { view = new Date(now.getFullYear(), now.getMonth(), 1); render(); };
  mn.appendChild(pv); mn.appendChild(mt); mn.appendChild(nx); b.appendChild(mn);
  const cal = el("div", "vd-cal");
  DS.forEach((s) => cal.appendChild(el("div", "w", s)));
  const first = new Date(view.getFullYear(), view.getMonth(), 1), nd = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  for (let i = 0; i < wd(first); i++) cal.appendChild(el("div", "vd-d z"));
  let work = 0, hours = 0, nights = 0, off = 0;
  for (let i = 1; i <= nd; i++) {
    const d = new Date(view.getFullYear(), view.getMonth(), i), e = days()[ymd(d)], t = e && tdef(e.t);
    if (t) { if (t.off) { if (t.id === "izin") off++; } else { work++; hours += dur(t); if (isNight(t)) nights++; } }
    cal.appendChild(dayCell(d, now));
  }
  b.appendChild(cal);
  const ss = el("div", "vd-sts");
  [[work, "Nöbet"], [Math.round(hours * 10) / 10, "Saat"], [nights, "Gece"], [off, "İzin"]].forEach((q) => { const c = el("div"); c.appendChild(el("b", "", q[0])); c.appendChild(el("span", "", q[1])); ss.appendChild(c); });
  b.appendChild(ss);
  const diff = Math.round((hours - D.target) * 10) / 10;
  b.appendChild(el("div", "vd-tg", "Hedef " + D.target + " saat · " + (diff > 0 ? "hedefin " + diff + " saat üstünde" : diff === 0 ? "hedefe ulaştın" : (-diff) + " saat kaldı") + " (hedefi Ayarlar’dan değiştirebilirsin)"));
  const ac = el("div", "vd-act");
  [["📄 PDF’den yükle", "pdf"], ["🗂️ Gruplar · Metro · Tramvay", "gruplar"], ["👥 Arkadaşlar", "friends"], ["🔁 Döngü ile doldur", "wizard"], ["📤 Paylaş", "share"], ["⚙️ Ayarlar", "settings"]].forEach((q) => { const x = el("button", "", q[0]); x.type = "button"; x.onclick = () => ext(q[1]); if (q[1] === "pdf") { x.style.flexBasis = "100%"; x.style.background = "var(--lamp)"; x.style.color = "var(--lamp-ink)"; } ac.appendChild(x); });
  b.appendChild(ac);
  b.appendChild(el("p", "vd-tg", "🔒 Vardiya bilgilerin yalnızca bu telefonda saklanır, kimseyle paylaşılmaz."));
  b.scrollTop = top;
}

function dayEdit(d) {
  const k = ymd(d), DD = days();
  openSheet((sh) => {
    sh.appendChild(el("h3", "", d.getDate() + " " + MON[d.getMonth()] + " " + DL[wd(d)]));
    const cur = DD[k] || {}, g = el("div", "vd-ch");
    const note = el("input"); note.placeholder = "Not (isteğe bağlı)"; note.value = cur.n || ""; note.maxLength = 80;
    D.types.forEach((t) => {
      const b = el("button", cur.t === t.id ? "on" : ""); b.type = "button";
      b.appendChild(el("span", "", t.ic));
      const w = el("div"); w.appendChild(document.createTextNode(t.n)); w.appendChild(el("small", "", t.off ? "Çalışma yok" : t.s + "–" + t.e + " · " + dur(t) + " sa"));
      b.appendChild(w);
      b.onclick = () => { DD[k] = { t: t.id, n: note.value.trim() }; save(); closeSheet(); render(); };
      g.appendChild(b);
    });
    sh.appendChild(g);
    sh.appendChild(el("label", "", "Not")); sh.appendChild(note);
    const wl = who(k);
    if (wl.length || D.fr.length) {
      sh.appendChild(el("label", "", sel ? "Bu gün sen" : "Bu gün arkadaşların")); const wb = el("div", "vd-who");
      if (!wl.length) wb.appendChild(el("div", "", sel ? "Senin vardiyan yok." : "Kayıtlı arkadaşın çalışmıyor ya da girilmemiş."));
      wl.forEach((q) => { const r = el("div"); r.appendChild(el("b", "", q[0])); r.appendChild(el("span", "", q[1].ic + " " + q[1].n + (q[1].off || q[1].cd ? "" : " " + q[1].s + "–" + q[1].e))); if (q[2]) { const w = el("button", "vd-ib", "💬"); w.type = "button"; w.onclick = () => wa(q[2], "Selam, nöbet arası müsait misin?"); r.appendChild(w); } wb.appendChild(r); });
      sh.appendChild(wb);
    }
    const r = el("div", "vd-r"), cl = el("button", "vd-btn", "Temizle"), ok = el("button", "vd-btn p", "Tamam"); cl.type = ok.type = "button";
    cl.onclick = () => { delete DD[k]; save(); closeSheet(); render(); };
    ok.onclick = () => { if (cur.t) { DD[k] = { t: cur.t, n: note.value.trim() }; save(); } closeSheet(); render(); };
    r.style.marginTop = "14px"; r.appendChild(cl); r.appendChild(ok); sh.appendChild(r);
  });
}


// Ek parça (döngü, paylaşma, ayarlar) ayrı dosyada
let X = null, X3 = null, X4 = null, X5 = null;
import("./vardiya2.js?v=1").then((m) => { X = m; }).catch(() => {});
import("./vardiya3.js?v=4").then((m) => { X3 = m; }).catch(() => {});
import("./vardiya4.js?v=3").then((m) => { X4 = m; }).catch(() => {});
import("./vardiya5.js?v=1").then((m) => { X5 = m; }).catch(() => {});
const API = {
  get D() { return D; }, set D(v) { D = v; if (!Array.isArray(D.fr)) D.fr = []; },
  save, wa, el, toast, openSheet, closeSheet, tdef, dur, ymd, wd, MON, DS, DL, render,
  setView(d) { view = d; }, getView() { return view; },
  getSel() { return sel; }, setSel(v) { sel = v || ""; },
  newFriend(n) { const f = { id: "f" + Date.now().toString(36) + Math.floor(Math.random() * 99), n: n, days: {} }; D.fr.push(f); return f; },
  delFriend(id) { D.fr = D.fr.filter((x) => x.id !== id); if (sel === id) sel = ""; },
  reset() { D = { types: DEF.map((t) => Object.assign({}, t)), days: {}, target: 195, fr: [] }; sel = ""; save(); }
};
function ext(name) { const m = name === "gruplar" ? X5 : name === "pdf" ? X3 : name === "friends" ? X4 : X; if (m && m[name]) m[name](API); else toast("Biraz bekle, yükleniyor…"); }

function open() {
  if (root) return;
  root = el("div", "vd"); document.body.appendChild(root);
  view = new Date(); view = new Date(view.getFullYear(), view.getMonth(), 1);
  render(); tick = setInterval(updHero, 20000);
}
function close() { closeSheet(); clearInterval(tick); if (root) { root.remove(); root = null; heroEl = null; } }

function mount() {
  const w = document.querySelector(".mtabs");
  if (!w) return false;
  if (!w.querySelector(".vdtab")) {
    const b = el("button", "vdtab", "🗓️ Vardiya");
    b.type = "button"; b.onclick = open;
    w.appendChild(b);
  }
  return true;
}
let n = 0;
const iv2 = setInterval(() => { if (mount() || ++n > 60) clearInterval(iv2); }, 300);
