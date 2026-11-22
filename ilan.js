import { ROOMS, ILLER } from "./rooms.js?v=2";
import { CSS as C1 } from "./belediye-css.js?v=1";
import { CSS as C2 } from "./ilan-css.js?v=1";
import { RULES } from "./ilan-data.js?v=1";
const $ = (i) => document.getElementById(i);
const st = document.createElement("style");
st.textContent = C1 + C2;
document.head.appendChild(st);
let panel = null, btn = null;
function el(t, c, x) {
  const e = document.createElement(t);
  if (c) e.className = c;
  if (x) e.textContent = x;
  return e;
}
function close() { if (panel) { panel.remove(); panel = null; } }
function again() { const q = $("q"); if (q) q.dispatchEvent(new Event("input")); }
function pick(i) {
  const id = "ilan" + i;
  for (let k = ROOMS.length - 1; k >= 0; k--) if (/^ilan\d+$/.test(ROOMS[k].id) && ROOMS[k].id !== id) ROOMS.splice(k, 1);
  const r = { id: id, ic: "💼", n: ILLER[i] + " İş İlanları", d: "Özel güvenlik iş ilanları: " + ILLER[i] };
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
  head.appendChild(back); head.appendChild(el("h2", "", "💼 İş İlanları"));
  const body = el("div", "mnb");
  const ic = el("div", "ilh");
  ["💼", "🛡️", "🔦", "📍"].forEach((x) => ic.appendChild(el("i", "", x)));
  body.appendChild(ic);
  const kb = el("div", "ilk");
  kb.appendChild(el("b", "", "İlan kuralları"));
  RULES.forEach((x) => kb.appendChild(el("div", "", x)));
  body.appendChild(kb);
  const q = el("input", "ilq");
  q.type = "search"; q.placeholder = "İl ara…";
  body.appendChild(q);
  const box = el("div", "");
  box.style.cssText = "display:flex;flex-direction:column;gap:8px";
  body.appendChild(box);
  function draw() {
    box.textContent = "";
    const f = q.value.trim().toLocaleLowerCase("tr");
    ILLER.forEach((n, i) => {
      if (f && n.toLocaleLowerCase("tr").indexOf(f) < 0) return;
      const b = el("button", "mnr");
      b.type = "button";
      b.appendChild(el("b", "", "💼 " + n));
      b.appendChild(el("span", "", "Özel güvenlik iş ilanları"));
      b.onclick = () => pick(i);
      box.appendChild(b);
    });
  }
  q.oninput = draw; draw();
  panel.appendChild(head); panel.appendChild(body);
  document.body.appendChild(panel);
}
function mount() {
  const h = $("rooms");
  if (!h || !$("app") || $("app").hidden) return;
  if (!btn) {
    btn = el("button", "room ilanb");
    btn.type = "button";
    btn.appendChild(el("b", "", "💼 İş İlanları"));
    btn.appendChild(el("span", "", "81 ilde özel güvenlik iş ilanları"));
    btn.onclick = open;
  }
  if (h.firstChild !== btn) h.insertBefore(btn, h.firstChild);
}
function bar() {
  const rt = $("rt"), rd = $("rd");
  if (!rt || !rd) return;
  let b = $("ilbar");
  const on = /İş İlanları$/.test(rt.textContent);
  if (!on) { if (b) b.remove(); return; }
  if (!b) { b = el("div", "ilbar", "📌 Kurallar: küfür, hakaret ve taciz yasak. Para isteyen ya da sahte ilan yok. Telefon/TC/adres yazma. İlanına görev yeri, vardiya, ücret ve aranan belgeyi yaz."); b.id = "ilbar"; }
  if (b.parentNode !== rd.parentNode || b.previousSibling !== rd) rd.insertAdjacentElement("afterend", b);
}
const h = $("rooms");
if (h) new MutationObserver(mount).observe(h, { childList: true });
const t = $("rt");
if (t) new MutationObserver(bar).observe(t, { childList: true, characterData: true, subtree: true });
setInterval(() => { mount(); bar(); }, 1500);
