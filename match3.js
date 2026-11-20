// Zeka oyunları 6: Şeker Patlatma (3'lü eşleştirme)
const rand = (n) => Math.floor(Math.random() * n);
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function hi(k, v) { const o = best(k); if (v > o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }

function candy(body, el, act) {
  const N = 8, TYPES = ["🍓", "🍋", "🍇", "🍊", "🍏", "🍬"], BG = ["#5a2433", "#5a5224", "#432a5a", "#5a3a1f", "#27502c", "#24465a"];
  let g, sel, score, moves, goal, level, busy, dead, over, clearing, combo;
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 4px;font-size:15px";
  body.appendChild(info);
  const sub = el("p", "", "");
  sub.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)";
  body.appendChild(sub);
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-columns:repeat(" + N + ",1fr);gap:3px;max-width:340px;margin:0 auto 10px;touch-action:none;user-select:none";
  body.appendChild(gr);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px";
  body.appendChild(row);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const at = (r, c) => (r < 0 || c < 0 || r >= N || c >= N ? -2 : g[r * N + c]);

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
        do { t = rand(TYPES.length); g[i] = t; } while (find().size > 0);
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
  function draw() {
    for (let i = 0; i < N * N; i++) {
      const b = cells[i], hot = clearing && clearing.has(i);
      b.textContent = g[i] >= 0 ? TYPES[g[i]] : "";
      b.style.setProperty("background", g[i] >= 0 ? BG[g[i]] : "transparent", "important");
      b.style.outline = sel === i ? "3px solid #f0c24b" : "none";
      b.style.transform = hot ? "scale(.6)" : "none";
      b.style.opacity = hot ? "0.5" : "1";
    }
    info.textContent = "Seviye " + level + "   Puan: " + score + " / " + goal;
    sub.textContent = over ? "Hamle bitti! En iyi: " + best("nb_candy") : "Kalan hamle: " + moves + "   En iyi: " + best("nb_candy");
  }
  async function cascade() {
    busy = true; combo = 1;
    while (!dead) {
      const m = find();
      if (!m.size) break;
      clearing = m; draw(); await sleep(230);
      if (dead) return;
      score += 10 * m.size * combo + (m.size > 3 ? 10 * (m.size - 3) : 0);
      m.forEach((i) => { g[i] = -1; });
      clearing = null;
      for (let c = 0; c < N; c++) {
        let w = N - 1;
        for (let r = N - 1; r >= 0; r--) if (g[r * N + c] >= 0) { g[w * N + c] = g[r * N + c]; if (w !== r) g[r * N + c] = -1; w--; }
        for (let r = w; r >= 0; r--) g[r * N + c] = rand(TYPES.length);
      }
      combo++;
      draw(); await sleep(260);
    }
    if (dead) return;
    if (score >= goal) { level++; goal += 250 + level * 60; moves += 12; sub.textContent = ""; }
    if (!hasMove()) fresh();
    if (moves <= 0 && score < goal) { over = true; hi("nb_candy", score); }
    busy = false; draw();
  }
  async function swap(a, b) {
    if (busy || over || dead) return;
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
    if (!t || busy || over) return;
    try { gr.setPointerCapture(e.pointerId); } catch (x) {}
    const i = Number(t.dataset.i);
    if (sel >= 0 && adj(sel, i)) { const a = sel; ds = null; swap(a, i); return; }
    sel = sel === i ? -1 : i;
    ds = { i: i, x: e.clientX, y: e.clientY };
    draw();
  };
  gr.onpointermove = (e) => {
    if (!ds || busy || over) return;
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
  function start() {
    level = 1; score = 0; moves = 20; goal = 400; busy = false; over = false; sel = -1; clearing = null; dead = false;
    fresh(); draw();
  }
  const b1 = act("Yeni oyun", () => { dead = true; setTimeout(start, 30); });
  row.appendChild(b1);
  const hint = el("p", "", "Yan yana iki şekere dokun ya da parmağınla kaydırıp yer değiştir. Aynı 3 ya da daha fazla şeker yan yana gelince patlar. Hedef puana hamle bitmeden ulaş!");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  return () => { dead = true; };
}

export const SOLO = {
  candy: { group: "Zeka", icon: "🍬", label: "Şeker Patlatma", start: candy }
};
