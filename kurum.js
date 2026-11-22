import { ROOMS } from "./rooms.js?v=2";
import { CSS as C1 } from "./belediye-css.js?v=1";
import { KURUMLAR } from "./kurum-data.js?v=3";
const $ = (i) => document.getElementById(i);
const st = document.createElement("style");
st.textContent = C1 + ".mtabs{flex-wrap:wrap}.mtabs button{flex:1 1 0;min-width:56px;padding:7px 2px;font-size:13px}.mnq{width:100%;box-sizing:border-box;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:16px}";
document.head.appendChild(st);
let panel = null;
function el(t, c, x) {
  const e = document.createElement(t);
  if (c) e.className = c;
  if (x) e.textContent = x;
  return e;
}
function close() { if (panel) { panel.remove(); panel = null; } }
function again() { const q = $("q"); if (q) q.dispatchEvent(new Event("input")); }
function pick(i) {
  const k = KURUMLAR[i], id = "kur" + i;
  for (let j = ROOMS.length - 1; j >= 0; j--) if (/^kur\d+$/.test(ROOMS[j].id) && ROOMS[j].id !== id) ROOMS.splice(j, 1);
  const r = { id: id, ic: k[0], n: k[1] + " Kurum Odası", d: k[2] };
  if (!ROOMS.some((x) => x.id === id)) ROOMS.splice(3, 0, r);
  again();
  close();
  const want = r.ic + " " + r.n;
  const b = Array.from(document.querySelectorAll("#rooms .room b")).find((x) => x.textContent === want);
  if (b && b.parentNode) b.parentNode.click();
}
function open() {
  close();
  panel = el("div", "mnp");
  const head = el("div", "mnh"), back = el("button", "", "←");
  back.type = "button"; back.onclick = close;
  head.appendChild(back); head.appendChild(el("h2", "", "🏢 Kurum Odaları"));
  const body = el("div", "mnb");
  const q = el("input", "mnq");
  q.type = "search"; q.placeholder = "Kurum ara…";
  body.appendChild(q);
  const box = el("div", "");
  box.style.cssText = "display:flex;flex-direction:column;gap:8px";
  body.appendChild(box);
  function draw() {
    box.textContent = "";
    const f = q.value.trim().toLocaleLowerCase("tr");
    KURUMLAR.forEach((k, i) => {
      if (f && (k[1] + " " + k[2]).toLocaleLowerCase("tr").indexOf(f) < 0) return;
      const b = el("button", "mnr");
      b.type = "button";
      b.appendChild(el("b", "", k[0] + " " + k[1]));
      b.appendChild(el("span", "", k[2]));
      b.onclick = () => pick(i);
      box.appendChild(b);
    });
  }
  q.oninput = draw; draw();
  panel.appendChild(head); panel.appendChild(body);
  document.body.appendChild(panel);
}
function mount() {
  const w = document.querySelector(".mtabs");
  if (!w) return false;
  if (!w.querySelector(".kutab")) {
    const b = el("button", "kutab", "🏢 Kurumlar");
    b.type = "button"; b.onclick = open;
    w.appendChild(b);
  }
  return true;
}
let n = 0;
const iv = setInterval(() => { if (mount() || ++n > 60) clearInterval(iv); }, 300);
