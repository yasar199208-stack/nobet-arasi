// Renkli yazı: efektler ve çizim
export const FX = {
  g: { n: "🌈 Gökkuşağı", c: (i) => "hsl(" + ((i * 37) % 360) + ",90%,62%)" },
  f: { n: "🔥 Ateş", c: (i, t) => "hsl(" + Math.round(6 + 44 * t) + ",100%," + Math.round(50 + 12 * t) + "%)" },
  n: { n: "💎 Neon", c: (i) => (i % 2 ? "#ff6bf5" : "#5af0ff"), s: (i) => "0 0 8px " + (i % 2 ? "#ff3df0" : "#35e6ff") },
  o: { n: "🌊 Okyanus", c: (i, t) => "hsl(" + Math.round(175 + 60 * t) + ",85%,62%)" },
  a: { n: "🏆 Altın", c: (i) => "hsl(45,100%," + Math.round(48 + 18 * Math.abs(Math.sin(i * 0.8))) + "%)" },
  d: { n: "〰️ Dalga", c: (i) => "hsl(" + ((i * 37) % 360) + ",90%,62%)", w: 1 }
};
export const CSS = ".rk{white-space:pre-wrap;word-break:break-word}.rkw{display:inline-block;white-space:pre;animation:rkw 1.1s ease-in-out infinite}@keyframes rkw{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}.rkc{display:inline-block;width:2px;height:1em;margin-left:2px;vertical-align:-2px;background:#fff;animation:rkb .8s steps(1) infinite}@keyframes rkb{50%{opacity:0}}";
export function paint(el, text, key) {
  const fx = FX[key] || FX.g, a = Array.from(text), n = Math.max(1, a.length - 1);
  el.textContent = "";
  a.forEach((ch, i) => {
    const s = document.createElement("span");
    s.textContent = ch;
    s.style.color = fx.c(i, i / n);
    if (fx.s) s.style.textShadow = fx.s(i);
    if (fx.w) { s.className = "rkw"; s.style.animationDelay = (i * 0.09) + "s"; }
    el.appendChild(s);
  });
}
export function wrap(key, text) { return "§" + key + "§" + text; }
export function parse(t) {
  const m = /^§([a-z])§([\s\S]*)$/.exec(t);
  return m && FX[m[1]] ? { key: m[1], text: m[2] } : null;
}
