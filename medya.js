// Medya paneli: radyo, canlı TV, müzik linki
import { view as radyo, stop, playing, setOnState } from "./medya-radyo.js?v=1";
import { tvView, musicView } from "./medya-tv.js?v=1";
const $ = (i) => document.getElementById(i);
let panel = null, body = null, tabs = {}, cur = "r";
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
function show(k) {
  cur = k;
  Object.keys(tabs).forEach((x) => { tabs[x].style.borderColor = x === k ? "var(--lamp)" : ""; tabs[x].style.fontWeight = x === k ? "800" : ""; });
  if (k === "r") radyo(body, el, toast);
  else if (k === "t") tvView(body, el);
  else musicView(body, el, toast);
}
function close() {
  if (panel) panel.hidden = true;
  if (body) body.textContent = "";
}
function build() {
  panel = el("div", "panel");
  panel.hidden = true;
  const sheet = el("div", "sheet"), head = el("div", "sh");
  head.appendChild(el("h2", "", "📻 Medya"));
  const x = el("button", "", "Kapat");
  x.type = "button"; x.onclick = close;
  head.appendChild(x); sheet.appendChild(head);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:6px;margin-bottom:10px";
  [["r", "📻 Radyo"], ["t", "📺 TV"], ["m", "🎵 Müzik"]].forEach((p) => {
    const b = el("button", "", p[1]);
    b.type = "button"; b.style.cssText = "flex:1;padding:10px 4px;font-size:15px";
    b.onclick = () => show(p[0]);
    tabs[p[0]] = b; row.appendChild(b);
  });
  sheet.appendChild(row);
  body = el("div", "");
  sheet.appendChild(body);
  panel.appendChild(sheet);
  panel.onclick = (e) => { if (e.target === panel) close(); };
  document.body.appendChild(panel);
}
function open() {
  if (!panel) build();
  panel.hidden = false;
  show(cur);
}
function mount() {
  const w = document.querySelector(".mtabs");
  if (!w) return false;
  if (!w.querySelector(".mdtab")) {
    const b = el("button", "mdtab", "📻 Medya");
    b.type = "button"; b.onclick = open;
    w.appendChild(b);
  }
  return true;
}
let n = 0;
const iv = setInterval(() => { if (mount() || ++n > 60) clearInterval(iv); }, 300);
