// Renkli yazı sekmesi: daktilo önizleme ve sohbete renkli gönderme
import { FX, CSS, paint, parse, wrap } from "./renk-fx.js?v=1";
const $ = (i) => document.getElementById(i);
const SAMPLES = ["Nöbet Arası'na hoş geldin!", "Gece vardiyası kolay gelsin 🌙", "Bugün nöbette kim var?", "Çay demlendi, gelin ☕"];
let panel = null, pv = null, inp = null, tm = 0, i = 0, k = 0, fx = "g", chips = {};
const st = document.createElement("style");
st.textContent = CSS;
document.head.appendChild(st);
function el(t, c, x) {
  const e = document.createElement(t);
  if (c) e.className = c;
  if (x) e.textContent = x;
  return e;
}
function toast(m) {
  const t = $("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 3200);
}
function tick() {
  const v = inp.value.trim(), t = Array.from(v || SAMPLES[k % SAMPLES.length]);
  i++;
  paint(pv, t.slice(0, Math.min(i, t.length)).join(""), fx);
  if (i <= t.length) pv.appendChild(el("span", "rkc"));
  if (i > t.length + 14) { i = 0; if (!v) k++; }
}
function close() { clearInterval(tm); if (panel) panel.hidden = true; }
function send() {
  const v = inp.value.trim(), sf = $("sf"), f = $("in"), t = $("rt");
  if (!v) { toast("Önce bir yazı yaz."); return; }
  if (!sf || !f || !t || !t.textContent.trim() || sf.offsetParent === null) { toast("Önce bir oda ya da sohbet aç."); return; }
  close();
  f.value = wrap(fx, v);
  f.dispatchEvent(new Event("input", { bubbles: true }));
  setTimeout(() => { try { sf.requestSubmit(); } catch (e) { const b = sf.querySelector("button"); if (b) b.click(); } }, 60);
}
function pick(key) {
  fx = key; i = 0;
  Object.keys(chips).forEach((c) => { chips[c].style.borderColor = c === key ? "var(--lamp)" : ""; chips[c].style.fontWeight = c === key ? "800" : ""; });
}
function build() {
  panel = el("div", "panel");
  panel.hidden = true;
  const sheet = el("div", "sheet"), head = el("div", "sh");
  head.appendChild(el("h2", "", "🌈 Renkli yazı"));
  const x = el("button", "", "Kapat");
  x.type = "button"; x.onclick = close;
  head.appendChild(x); sheet.appendChild(head);
  pv = el("div", "rk");
  pv.style.cssText = "min-height:96px;padding:14px;margin-bottom:10px;border:1px solid var(--line);border-radius:12px;background:#0b111c;font-size:24px;font-weight:700;line-height:1.35";
  sheet.appendChild(pv);
  inp = el("textarea", "");
  inp.rows = 2; inp.maxLength = 395; inp.placeholder = "Yazını buraya yaz…";
  inp.style.cssText = "width:100%;box-sizing:border-box;padding:10px;margin-bottom:10px;font-size:16px";
  inp.oninput = () => { i = 0; };
  sheet.appendChild(inp);
  const row = el("div", "");
  row.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px";
  Object.keys(FX).forEach((key) => {
    const b = el("button", "", FX[key].n);
    b.type = "button"; b.style.cssText = "padding:9px 10px;font-size:15px";
    b.onclick = () => pick(key);
    chips[key] = b; row.appendChild(b);
  });
  sheet.appendChild(row);
  const go = el("button", "", "Sohbete gönder");
  go.type = "button";
  go.style.cssText = "width:100%;padding:12px;font-weight:800;font-size:16px;background:var(--lamp);color:var(--lamp-ink);border:0";
  go.onclick = send;
  sheet.appendChild(go);
  panel.appendChild(sheet);
  panel.onclick = (e) => { if (e.target === panel) close(); };
  document.body.appendChild(panel);
  pick("g");
}
function open() {
  if (!panel) build();
  panel.hidden = false; i = 0;
  clearInterval(tm);
  tm = setInterval(tick, 90);
}
function mount() {
  const w = document.querySelector(".mtabs");
  if (!w) return false;
  if (!w.querySelector(".rktab")) {
    const b = el("button", "rktab", "🌈 Renkli");
    b.type = "button"; b.onclick = open;
    w.appendChild(b);
  }
  return true;
}
function scan() {
  document.querySelectorAll(".msg p:not([data-c])").forEach((p) => {
    p.setAttribute("data-c", "1");
    const r = parse(p.textContent || "");
    if (r) { p.classList.add("rk"); paint(p, r.text, r.key); }
  });
}
let n = 0;
const iv = setInterval(() => { if (mount() || ++n > 60) clearInterval(iv); }, 300);
let sm = 0;
new MutationObserver(() => { clearTimeout(sm); sm = setTimeout(scan, 50); }).observe(document.body, { childList: true, subtree: true });
scan();
