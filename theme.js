// Tema özelliği: 60 renk teması. Seçim telefonda saklanır.
const T = [
  ["gece", "🌙", "Gece Mavisi", "#0f1a2a", "#e3e9f0", "#f0c24b", 0],
  ["amoled", "⚫", "Siyah", "#000000", "#f0f0f0", "#f0c24b", 0],
  ["orman", "🌲", "Orman", "#0e1f17", "#e2efe6", "#6ee7a0", 0],
  ["bordo", "🍷", "Bordo", "#2a0f17", "#f3e3e6", "#ff6b81", 0],
  ["mor", "🔮", "Mor Gece", "#1a1230", "#ece6fa", "#b794ff", 0],
  ["okyanus", "🌊", "Okyanus", "#06202b", "#def3f8", "#22d3ee", 0],
  ["gunbatimi", "🌇", "Gün Batımı", "#2b1408", "#fbeadc", "#ff8a3d", 0],
  ["neon", "💖", "Neon Pembe", "#1a0a1f", "#fbe6f6", "#ff3cac", 0],
  ["zumrut", "💚", "Zümrüt", "#06241f", "#dcf5ee", "#2ee6a6", 0],
  ["kizil", "🔥", "Kızıl", "#240a0a", "#fbe4e4", "#ff4d4d", 0],
  ["altin", "🏆", "Altın", "#1c1608", "#f6efdc", "#ffc83d", 0],
  ["buz", "🧊", "Buz", "#0b1d2e", "#e8f6ff", "#7dd3fc", 0],
  ["kahve", "☕", "Kahve", "#21160f", "#f3e8de", "#d9a066", 0],
  ["lav", "🪻", "Lav", "#241a2e", "#f1e7f7", "#e879f9", 0],
  ["petrol", "🛢️", "Petrol", "#082a30", "#e0f4f5", "#2dd4bf", 0],
  ["celik", "🔩", "Çelik", "#1b2127", "#e6ebf0", "#60a5fa", 0],
  ["kiraz", "🍒", "Kiraz", "#2c0b1c", "#fde6ef", "#fb7185", 0],
  ["limon", "🍋", "Limon", "#1b1d08", "#f6f7dc", "#d9f24a", 0],
  ["mercan", "🪸", "Mercan", "#2a1210", "#fde8e2", "#ff7f6b", 0],
  ["elektrik", "⚡", "Elektrik", "#0a0f2e", "#e6eaff", "#4f7cff", 0],
  ["gokyuzu", "☁️", "Açık Gökyüzü", "#eef4fb", "#1b2a3a", "#1f6feb", 1],
  ["krem", "🍦", "Krem", "#f6f0e4", "#2d2417", "#b7791f", 1],
  ["nane", "🌿", "Nane", "#e9f6ef", "#12301f", "#12a15a", 1],
  ["pudra", "🌸", "Pudra", "#fbeef0", "#3a1f27", "#d6336c", 1],
  ["lavanta", "💜", "Lavanta", "#f1ecfa", "#2a1f45", "#7c3aed", 1],
  ["gunisigi", "🌞", "Gün Işığı", "#fff8e1", "#3b3000", "#b36b00", 1],
  ["beyaz", "🤍", "Beyaz", "#f7f7f8", "#17181a", "#111827", 1],
  ["seftali", "🍑", "Şeftali", "#fdf0e6", "#3a2314", "#d2501a", 1],
  ["denizkopugu", "🐚", "Deniz Köpüğü", "#e6f7f6", "#0f3330", "#0e9aa7", 1],
  ["bulut", "🌫️", "Gri Bulut", "#eceef1", "#20252b", "#3b82f6", 1],
  ["murekkep", "🖋️", "Mürekkep", "#0b1020", "#e6e9f5", "#8ab4ff", 0],
  ["yosun", "🌱", "Yosun", "#101a0c", "#e5f2dc", "#a3e635", 0],
  ["gulkurusu", "🥀", "Gül Kurusu", "#2a1519", "#f6e3e2", "#e8a0a0", 0],
  ["komur", "🪨", "Kömür", "#15171a", "#e9e9ea", "#f97316", 0],
  ["mavigolge", "🌌", "Mavi Gölge", "#0d1b3a", "#e3ecff", "#38bdf8", 0],
  ["cam", "🌳", "Çam", "#0b1f1a", "#dff3ea", "#34d399", 0],
  ["patlican", "🍆", "Patlıcan", "#20102a", "#efe3f7", "#c084fc", 0],
  ["kumsal", "🏖️", "Kumsal Gecesi", "#1f1a12", "#f4ecdc", "#fbbf24", 0],
  ["murdum", "🫐", "Mürdüm", "#2a0e2a", "#f9e4f9", "#f472b6", 0],
  ["bakir", "🥉", "Bakır", "#231510", "#f6e6dc", "#e2814d", 0],
  ["turkuaz", "🧿", "Turkuaz Gece", "#04232a", "#dcf4f8", "#06b6d4", 0],
  ["kehribar", "🟠", "Kehribar", "#241a05", "#fbf0d4", "#f59e0b", 0],
  ["safir", "💎", "Safir", "#0a1536", "#e4ebff", "#6366f1", 0],
  ["kizil2", "🧱", "Kızıl Toprak", "#2a130c", "#f8e5dc", "#f87171", 0],
  ["bulgumor", "🌆", "Buğulu Mor", "#1a1626", "#e9e5f5", "#a78bfa", 0],
  ["bal", "🍯", "Bal", "#fdf3d8", "#3a2a05", "#b45309", 1],
  ["ayisigi", "🌝", "Ay Işığı", "#f3f4f8", "#1e2233", "#4f46e5", 1],
  ["yaprak", "🍃", "Yaprak", "#eef5e4", "#1f2d12", "#4d7c0f", 1],
  ["gul", "🌹", "Gül", "#fdecee", "#3d1620", "#e11d48", 1],
  ["buzmavi", "🩵", "Buz Mavisi", "#e8f3fb", "#0f2a3d", "#0369a1", 1],
  ["kum", "🏜️", "Kum", "#f3ebdd", "#34281a", "#a16207", 1],
  ["okaliptus", "🌾", "Okaliptus", "#e5f1ee", "#123029", "#0f766e", 1],
  ["misket", "🔮", "Misket", "#f7e9f7", "#3a1a3a", "#a21caf", 1],
  ["limonata", "🍹", "Limonata", "#fbfbd9", "#33330a", "#6b7a00", 1],
  ["seker", "🍬", "Pamuk Şeker", "#fdeef6", "#3b1a2f", "#c026d3", 1],
  ["kayisi", "🧡", "Kayısı", "#fdeedd", "#3a2410", "#c2410c", 1],
  ["mavikus", "🐦", "Mavi Kuş", "#e3f0ff", "#102a4d", "#2563eb", 1],
  ["gritas", "🪨", "Gri Taş", "#e7e7e9", "#1f1f23", "#52525b", 1],
  ["fistik", "🥜", "Fıstık", "#eaf5dc", "#20300f", "#3f8f2a", 1],
  ["tarcin", "🍂", "Tarçın", "#f4e8e0", "#3a2216", "#9a3412", 1]
];
const $ = (i) => document.getElementById(i);
function rgb(h) { h = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); }
function hex(a) { return "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
function mix(a, b, t) { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); }
function lum(h) { const c = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function vars(t) {
  const bg = t[3], tx = t[4], lamp = t[5], light = !!t[6];
  return {
    "--bg": bg,
    "--panel": light ? mix(bg, "#ffffff", 0.65) : mix(bg, tx, 0.07),
    "--line": mix(bg, tx, light ? 0.2 : 0.17),
    "--text": tx,
    "--mute": mix(bg, tx, light ? 0.62 : 0.58),
    "--lamp": lamp,
    "--lamp-ink": lum(lamp) > 0.45 ? "#1a1a1a" : "#ffffff",
    "--mine": mix(bg, lamp, light ? 0.22 : 0.3),
    "--danger": light ? "#c0392b" : "#e0786a"
  };
}
const KEYS = ["--bg", "--panel", "--line", "--text", "--mute", "--lamp", "--lamp-ink", "--mine", "--danger"];
function apply(id) {
  const r = document.documentElement;
  const t = T.find((x) => x[0] === id) || T[0];
  if (t[0] === "gece") {
    KEYS.forEach((k) => r.style.removeProperty(k));
    r.style.colorScheme = "";
  } else {
    const v = vars(t);
    KEYS.forEach((k) => r.style.setProperty(k, v[k]));
    r.style.colorScheme = t[6] ? "light" : "dark";
  }
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", t[3]);
  const c = document.querySelector('meta[name="color-scheme"]');
  if (c) c.setAttribute("content", t[6] ? "light" : "dark");
  return t[0];
}
let cur = "gece";
try { cur = localStorage.getItem("theme") || "gece"; } catch (e) {}
if (!T.some((x) => x[0] === cur)) cur = "gece";
apply(cur);

const st = document.createElement("style");
st.textContent = ".thp{position:fixed;left:0;right:0;top:0;height:100dvh;background:var(--bg);color:var(--text);z-index:36;display:flex;flex-direction:column}" +
  ".thh{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line)}.thh h2{margin:0;font-size:18px;flex:1}" +
  ".thh button{background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:9px 12px;font-size:15px;cursor:pointer}" +
  ".thb{padding:12px;overflow:auto;display:flex;flex-direction:column;gap:12px}.thb h3{margin:6px 0 0;font-size:14px;color:var(--mute);font-weight:600}" +
  ".thg{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
  ".thc{position:relative;border-radius:14px;padding:10px;cursor:pointer;text-align:left;border:2px solid transparent;font-size:15px;font-weight:700;display:flex;flex-direction:column;gap:8px;min-height:92px}" +
  ".thc .a{display:flex;gap:6px;align-items:center}.thc .a i{display:block;height:8px;border-radius:4px}" +
  ".thc .m{display:flex;flex-direction:column;gap:4px}.thc .m i{display:block;height:12px;border-radius:7px}" +
  ".thc.on{border-color:var(--lamp);box-shadow:0 0 0 2px var(--lamp)}.thc.on:after{content:'✓';position:absolute;right:9px;top:6px;font-size:16px}";
document.head.appendChild(st);
function el(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
let panel = null;
function close() { if (panel) { panel.remove(); panel = null; } }
function card(t) {
  const v = vars(t);
  const b = el("button", "thc"); b.type = "button";
  b.style.background = t[3]; b.style.color = t[4]; b.style.borderColor = v["--line"];
  b.appendChild(el("span", "", t[1] + " " + t[2]));
  const m = el("div", "m");
  const p = el("i"); p.style.background = v["--panel"]; p.style.width = "70%";
  const q = el("i"); q.style.background = v["--mine"]; q.style.width = "55%"; q.style.alignSelf = "flex-end";
  const z = el("i"); z.style.background = t[5]; z.style.width = "35%";
  m.appendChild(p); m.appendChild(q); m.appendChild(z);
  b.appendChild(m);
  if (t[0] === cur) b.classList.add("on");
  b.onclick = () => {
    cur = apply(t[0]);
    try { localStorage.setItem("theme", cur); } catch (e) {}
    panel.querySelectorAll(".thc").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
  };
  return b;
}
function open() {
  close();
  panel = el("div", "thp");
  const h = el("div", "thh");
  const back = el("button", "", "←"); back.type = "button"; back.onclick = close;
  h.appendChild(back); h.appendChild(el("h2", "", "🎨 Tema"));
  const body = el("div", "thb");
  body.appendChild(el("h3", "", "Koyu temalar"));
  const g1 = el("div", "thg");
  T.filter((x) => !x[6]).forEach((x) => g1.appendChild(card(x)));
  body.appendChild(g1);
  body.appendChild(el("h3", "", "Açık temalar"));
  const g2 = el("div", "thg");
  T.filter((x) => x[6]).forEach((x) => g2.appendChild(card(x)));
  body.appendChild(g2);
  panel.appendChild(h); panel.appendChild(body);
  document.body.appendChild(panel);
}
function mount() {
  const w = document.querySelector(".mtabs");
  if (!w) return false;
  if (!w.querySelector(".thtab")) {
    const b = el("button", "thtab", "🎨 Tema");
    b.type = "button"; b.onclick = open;
    w.appendChild(b);
  }
  return true;
}
let n = 0;
const iv = setInterval(() => { if (mount() || ++n > 60) clearInterval(iv); }, 300);
