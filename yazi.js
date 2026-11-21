// Şekilli yazı: mesaj kutusuna yazdığın yazıyı farklı yazı tiplerine çevirir (Unicode harfleri).
const $ = (i) => document.getElementById(i);
const U = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", L = "abcdefghijklmnopqrstuvwxyz", D = "0123456789";
const cp = (n) => String.fromCodePoint(n);

// Başlangıç noktası verilen blok (büyük, küçük, rakam), boşlukları istisnalarla doldurur
function block(u0, l0, d0, ex) {
  const m = {};
  for (let i = 0; i < 26; i++) {
    if (u0) m[U[i]] = cp(u0 + i);
    if (l0) m[L[i]] = cp(l0 + i);
  }
  if (d0) for (let i = 0; i < 10; i++) m[D[i]] = cp(d0 + i);
  if (ex) Object.keys(ex).forEach((k) => { m[k] = ex[k]; });
  return m;
}

const circ = {};
for (let i = 0; i < 26; i++) { circ[U[i]] = cp(0x24b6 + i); circ[L[i]] = cp(0x24d0 + i); }
circ["0"] = "⓪";
for (let i = 1; i < 10; i++) circ[D[i]] = cp(0x2460 + i - 1);

const sq = {};
for (let i = 0; i < 26; i++) { sq[U[i]] = cp(0x1f130 + i); sq[L[i]] = cp(0x1f130 + i); }

const STYLES = [
  { n: "Kalın", m: block(0x1d5d4, 0x1d5ee, 0x1d7ec) },
  { n: "Kalın serif", m: block(0x1d400, 0x1d41a, 0x1d7ce) },
  { n: "İtalik", m: block(0x1d434, 0x1d44e, 0, { h: "ℎ" }) },
  { n: "Kalın italik", m: block(0x1d468, 0x1d482, 0x1d7ce) },
  { n: "El yazısı", m: block(0x1d4d0, 0x1d4ea, 0x1d7ce) },
  { n: "Gotik", m: block(0x1d56c, 0x1d586, 0x1d7ce) },
  { n: "Çift çizgi", m: block(0x1d538, 0x1d552, 0x1d7d8, { C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ" }) },
  { n: "Daktilo", m: block(0x1d670, 0x1d68a, 0x1d7f6) },
  { n: "Baloncuk", m: circ },
  { n: "Kare", m: sq },
  { n: "Geniş", m: block(0xff21, 0xff41, 0xff10) },
  { n: "Üstü çizili", mark: "̶" },
  { n: "Altı çizili", mark: "̲" }
];

export function convert(text, st) {
  let out = "";
  for (const ch of text) {
    if (st.mark) out += ch === " " ? ch : ch + st.mark;
    else out += st.m[ch] || ch;
  }
  return out;
}
export function plain(text) { return text.normalize("NFKC").replace(/[̶̲]/g, ""); }

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}
function toast(m) {
  const t = $("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 3200);
}

let panel = null, list = null, btn = null;

function apply(fn) {
  const inp = $("in");
  if (!inp) return;
  const v = fn(inp.value);
  if (inp.maxLength > 0 && v.length > inp.maxLength) { toast("Yazı çok uzun, kısalt ve tekrar dene."); return; }
  const old = inp.value;
  inp.blur();
  inp.value = v;
  inp.dispatchEvent(new Event("input", { bubbles: true }));
  panel.hidden = true;
  setTimeout(() => { if (inp.value === old) inp.value = v; inp.focus(); try { inp.setSelectionRange(v.length, v.length); } catch (e) {} }, 120);
}

function open() {
  const inp = $("in");
  if (inp) inp.blur();
  setTimeout(show, 80);
}

function show() {
  const inp = $("in");
  const raw = plain(inp ? inp.value : "");
  const sample = raw.trim() ? raw : "Nöbet Arası";
  if (!panel) {
    panel = el("div", "panel");
    panel.hidden = true;
    const sheet = el("div", "sheet");
    const head = el("div", "sh");
    head.appendChild(el("h2", "", "Şekilli yazı"));
    const x = el("button", "", "Kapat");
    x.type = "button";
    x.onclick = () => { panel.hidden = true; };
    head.appendChild(x);
    sheet.appendChild(head);
    const p = el("p", "", "Önce mesajını yaz, sonra bir yazı tipi seç. Ç, Ğ, İ, Ö, Ş, Ü gibi Türkçe harfler olduğu gibi kalır.");
    p.style.cssText = "margin:0 0 10px;color:var(--mute);font-size:14px";
    sheet.appendChild(p);
    list = el("div", "");
    sheet.appendChild(list);
    panel.appendChild(sheet);
    panel.onclick = (e) => { if (e.target === panel) panel.hidden = true; };
    document.body.appendChild(panel);
  }
  list.textContent = "";
  const mk = (label, txt, fn) => {
    const b = el("button", "", "");
    b.type = "button";
    b.style.cssText = "display:block;width:100%;text-align:left;padding:10px 12px;margin-bottom:8px;font-size:18px;overflow-wrap:anywhere";
    const s1 = el("span", "", txt);
    s1.style.display = "block";
    const s2 = el("span", "", label);
    s2.style.cssText = "display:block;font-size:12px;color:var(--mute);margin-top:2px";
    b.appendChild(s1); b.appendChild(s2);
    b.onclick = fn;
    list.appendChild(b);
  };
  mk("Düz yazı", sample, () => apply(plain));
  STYLES.forEach((st) => mk(st.n, convert(sample.slice(0, 40), st), () => apply((v) => convert(plain(v), st))));
  panel.hidden = false;
}

function init() {
  const sf = $("sf");
  if (!sf || btn) return;
  const bs = sf.querySelectorAll("button");
  const send = bs[bs.length - 1];
  if (!send) return;
  btn = el("button", "", "𝓐");
  btn.type = "button";
  btn.title = "Şekilli yazı";
  btn.setAttribute("aria-label", "Şekilli yazı");
  btn.onclick = open;
  send.parentNode.insertBefore(btn, send);
}

init();
