// Zeka oyunları 6: Şeker Patlatma (3'lü eşleştirme)
const rand = (n) => Math.floor(Math.random() * n);
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function hi(k, v) { const o = best(k); if (v > o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }

const PAT = {
  bottom: (r, c) => r >= 6,
  top: (r, c) => r <= 1,
  cross: (r, c) => r === 3 || r === 4 || c === 3 || c === 4,
  frame: (r, c) => r === 0 || r === 7 || c === 0 || c === 7,
  checker: (r, c) => (r + c) % 2 === 0,
  diag: (r, c) => r === c || r + c === 7,
  center: (r, c) => r >= 2 && r <= 5 && c >= 2 && c <= 5,
  stripes: (r, c) => r % 2 === 0,
  corners: (r, c) => (r < 3 || r > 4) && (c < 3 || c > 4),
  all: () => true
};
const PNAME = { bottom: "alt", top: "üst", cross: "artı", frame: "çerçeve", checker: "dama", diag: "çapraz", center: "orta", stripes: "çizgi", corners: "köşe", all: "tüm tahta" };
const GEN = ["bottom", "cross", "frame", "checker", "diag", "center", "stripes", "corners", "all"];
const LV = [
  { t: 4, m: 25, s: 300 },
  { t: 4, m: 24, c: [0, 20] },
  { t: 5, m: 24, s: 550 },
  { t: 5, m: 26, j: "bottom" },
  { t: 5, m: 24, c: [1, 24] },
  { t: 5, m: 26, j: "cross" },
  { t: 6, m: 25, s: 850 },
  { t: 5, m: 28, j: "frame" },
  { t: 6, m: 26, c: [2, 28] },
  { t: 5, m: 30, j: "checker" },
  { t: 6, m: 26, s: 700, c: [3, 20] },
  { t: 6, m: 28, j: "diag" },
  { t: 5, m: 26, j: "top", s: 600 },
  { t: 6, m: 28, c: [4, 32], j: "center" },
  { t: 6, m: 26, j: "cross", s: 800 },
  { t: 6, m: 38, j: "all" },
  { t: 6, m: 26, c: [5, 34] },
  { t: 6, m: 28, j: "frame", c: [0, 24] },
  { t: 6, m: 28, j: "checker", s: 900 },
  { t: 6, m: 38, j: "all", c: [1, 30] }
];
function cfg(n) {
  if (n <= LV.length) return LV[n - 1];
  const k = n - LV.length;
  const o = { t: 6, m: Math.max(22, 30 - Math.floor(k / 2)), j: GEN[k % GEN.length] };
  if (k % 2 === 0) o.c = [k % 6, 30 + k];
  if (k % 3 !== 1) o.s = 900 + k * 80;
  return o;
}

function candy(body, el, act) {
  const N = 8, TYPES = ["🍓", "🍋", "🍇", "🍊", "🍏", "🍬"], BG = ["#5a2433", "#5a5224", "#432a5a", "#5a3a1f", "#27502c", "#24465a"];
  let g, sel, score, moves, level, busy, dead, over, clearing, combo, T, C, jelly, jl, cnt, won, unlocked;
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 4px;font-size:15px";
  body.appendChild(info);
  const sub = el("p", "", "");
  sub.style.cssText = "margin:0 0 4px;font-size:13px";
  body.appendChild(sub);
  const sub2 = el("p", "", "");
  sub2.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)";
  body.appendChild(sub2);
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-columns:repeat(" + N + ",1fr);gap:3px;max-width:340px;margin:0 auto 10px;touch-action:none;user-select:none";
  body.appendChild(gr);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  body.appendChild(row);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const at = (r, c) => (r < 0 || c < 0 || r >= N || c >= N ? -2 : g[r * N + c]);
  unlocked = Math.max(1, best("nb_candy2"));

  function find() {
    const s = new Set();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const t = g[r * N + c];
      if (t < 0) continue;
      if (c + 2 < N && at(r, c + 1) === t && at(r, c + 2) === t) { s.add(r * N + c); s.add(r * N + c + 1); s.add(r * N + c + 2); }
      if (r + 2 < N && at(r + 1, c) === t && at(r + 2, c) === t) { s.add(r * N + c); s.add((r + 1) * N + c); s.add((r + 2) * N + c); }
    }
    return s;
  }
  function hasMove() {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      for (const d of [[0, 1], [1, 0]]) {
        const r2 = r + d[0], c2 = c + d[1];
        if (r2 >= N || c2 >= N) continue;
        const a = r * N + c, b = r2 * N + c2;
        [g[a], g[b]] = [g[b], g[a]];
        const ok = find().size > 0;
        [g[a], g[b]] = [g[b], g[a]];
        if (ok) return true;
      }
    }
    return false;
  }
  function fresh() {
    do {
      g = new Array(N * N).fill(-1);
      for (let i = 0; i < N * N; i++) {
        let t;
        do { t = rand(T); g[i] = t; } while (find().size > 0);
      }
    } while (!hasMove());
  }
  const cells = [];
  for (let i = 0; i < N * N; i++) {
    const b = el("button", "", "");
    b.type = "button";
    b.dataset.i = String(i);
    b.style.cssText = "aspect-ratio:1;padding:0;font-size:24px;line-height:1;border:0!important;border-radius:8px!important;transition:transform .15s,opacity .15s";
    gr.appendChild(b);
    cells.push(b);
  }
  function goalText() {
    const p = [];
    if (C.s) p.push("🎯 " + Math.min(score, C.s) + "/" + C.s + " puan");
    if (C.c) p.push(TYPES[C.c[0]] + " " + Math.min(cnt, C.c[1]) + "/" + C.c[1] + " topla");
    if (C.j) p.push("🟦 Jöle " + jl + " kaldı (" + PNAME[C.j] + ")");
    return p.join("  •  ");
  }
  let nextB, retryB;
  function draw() {
    for (let i = 0; i < N * N; i++) {
      const b = cells[i], hot = clearing && clearing.has(i);
      b.textContent = g[i] >= 0 ? TYPES[g[i]] : "";
      b.style.setProperty("background", g[i] >= 0 ? BG[g[i]] : "transparent", "important");
      b.style.outline = sel === i ? "3px solid #f0c24b" : "none";
      b.style.boxShadow = jelly[i] ? "inset 0 0 0 3px #5ac8fa, inset 0 0 12px 2px #5ac8fa88" : "none";
      b.style.transform = hot ? "scale(.6)" : "none";
      b.style.opacity = hot ? "0.5" : "1";
    }
    info.textContent = "Seviye " + level + "   Puan: " + score;
    sub.textContent = goalText();
    sub2.textContent = won ? "🎉 Seviye tamam! Sonraki seviyeye geç." : over ? "Hamle bitti! Tekrar dene." : "Kalan hamle: " + moves + "   Açık seviye: " + unlocked;
    nextB.style.display = won ? "" : "none";
    retryB.style.display = over || won ? "" : "none";
  }
  function complete() {
    return (!C.s || score >= C.s) && (!C.c || cnt >= C.c[1]) && jl <= 0;
  }
  async function cascade() {
    busy = true; combo = 1;
    while (!dead) {
      const m = find();
      if (!m.size) break;
      clearing = m; draw(); await sleep(230);
      if (dead) return;
      score += 10 * m.size * combo + (m.size > 3 ? 10 * (m.size - 3) : 0);
      m.forEach((i) => {
        if (C.c && g[i] === C.c[0]) cnt++;
        if (jelly[i]) { jelly[i] = 0; jl--; }
        g[i] = -1;
      });
      clearing = null;
      for (let c = 0; c < N; c++) {
        let w = N - 1;
        for (let r = N - 1; r >= 0; r--) if (g[r * N + c] >= 0) { g[w * N + c] = g[r * N + c]; if (w !== r) g[r * N + c] = -1; w--; }
        for (let r = w; r >= 0; r--) g[r * N + c] = rand(T);
      }
      combo++;
      draw(); await sleep(260);
    }
    if (dead) return;
    if (complete()) {
      won = true;
      if (level + 1 > unlocked) { unlocked = level + 1; hi("nb_candy2", unlocked); }
    } else {
      if (!hasMove()) fresh();
      if (moves <= 0) over = true;
    }
    busy = false; draw();
  }
  async function swap(a, b) {
    if (busy || over || won || dead) return;
    busy = true; sel = -1;
    [g[a], g[b]] = [g[b], g[a]]; draw(); await sleep(160);
    if (dead) return;
    if (!find().size) { [g[a], g[b]] = [g[b], g[a]]; draw(); await sleep(120); busy = false; draw(); return; }
    moves--;
    await cascade();
  }
  const adj = (a, b) => (Math.abs(a - b) === N) || (Math.abs(a - b) === 1 && Math.floor(a / N) === Math.floor(b / N));
  let ds = null;
  gr.onpointerdown = (e) => {
    const t = e.target.closest("button");
    if (!t || busy || over || won) return;
    try { gr.setPointerCapture(e.pointerId); } catch (x) {}
    const i = Number(t.dataset.i);
    if (sel >= 0 && adj(sel, i)) { const a = sel; ds = null; swap(a, i); return; }
    sel = sel === i ? -1 : i;
    ds = { i: i, x: e.clientX, y: e.clientY };
    draw();
  };
  gr.onpointermove = (e) => {
    if (!ds || busy || over || won) return;
    const dx = e.clientX - ds.x, dy = e.clientY - ds.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return;
    const r = Math.floor(ds.i / N), c = ds.i % N;
    let r2 = r, c2 = c;
    if (Math.abs(dx) > Math.abs(dy)) c2 += dx > 0 ? 1 : -1; else r2 += dy > 0 ? 1 : -1;
    const a = ds.i; ds = null;
    if (r2 < 0 || c2 < 0 || r2 >= N || c2 >= N) return;
    swap(a, r2 * N + c2);
  };
  gr.onpointerup = () => { ds = null; };
  gr.onpointercancel = gr.onpointerup;
  function load(n) {
    level = Math.max(1, Math.min(n, unlocked));
    C = cfg(level); T = C.t; score = 0; moves = C.m; cnt = 0;
    busy = false; over = false; won = false; sel = -1; clearing = null; dead = false;
    jelly = new Array(N * N).fill(0); jl = 0;
    if (C.j) for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (PAT[C.j](r, c)) { jelly[r * N + c] = 1; jl++; }
    fresh(); draw();
  }
  function go(n) { dead = true; setTimeout(() => load(n), 30); }
  const bPrev = act("◀", () => go(level - 1));
  const bNext = act("▶", () => go(level + 1));
  retryB = act("Tekrar", () => go(level));
  nextB = act("Sonraki seviye ▶", () => go(level + 1));
  [bPrev, bNext, retryB, nextB].forEach((b) => row.appendChild(b));
  const hint = el("p", "", "Yan yana iki şekere dokun ya da parmağınla kaydırıp yer değiştir. Aynı 3 ya da daha fazla şeker patlayınca hedef ilerler. 🟦 Mavi çerçeveli kareler jöle: üstündeki şekeri patlatınca temizlenir. Hamle bitmeden hedefleri tamamla! ◀ ▶ ile açtığın seviyelere dönebilirsin.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  won = false; over = false; jelly = []; C = cfg(1);
  nextB.style.display = "none"; retryB.style.display = "none";
  load(1);
  return () => { dead = true; };
}

export const SOLO = {
  candy: { group: "Zeka", icon: "🍬", label: "Şeker Patlatma", start: candy }
};
