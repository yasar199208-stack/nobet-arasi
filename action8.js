// Aksiyon oyunları 8: Pıtır Macerası (platform oyunu)
const rand = (n) => Math.floor(Math.random() * n);
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function hi(k, v) { const o = best(k); if (v > o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }
function arena(body, el, w, h) {
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 8px;font-size:15px";
  body.appendChild(info);
  const cv = el("canvas", "", "");
  cv.width = w; cv.height = h;
  cv.style.cssText = "display:block;width:100%;max-width:" + w + "px;margin:0 auto 10px;border:1px solid var(--line);border-radius:10px;background:#0b1422;touch-action:none;user-select:none";
  body.appendChild(cv);
  return { cv: cv, cx: cv.getContext("2d"), info: info };
}
function pos(cv, e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height };
}
function rowOf(body, el) {
  const r = el("div", "");
  r.style.cssText = "display:flex;gap:8px;margin-top:8px;flex-wrap:wrap";
  body.appendChild(r);
  return r;
}
function raf(fn) {
  let on = true, last = performance.now();
  function f(t) {
    if (!on) return;
    const dt = Math.min(40, t - last) / 16.67; last = t;
    fn(dt);
    requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
  return () => { on = false; };
}
function banner(cx, w, h, a, b) {
  cx.fillStyle = "rgba(0,0,0,.6)"; cx.fillRect(0, h / 2 - 44, w, 88);
  cx.fillStyle = "#fff"; cx.textAlign = "center"; cx.textBaseline = "alphabetic";
  cx.font = "700 22px sans-serif"; cx.fillText(a, w / 2, h / 2 - 6);
  cx.font = "15px sans-serif"; cx.fillText(b || "", w / 2, h / 2 + 22);
}


/* ---------- Pıtır Macerası (platform oyunu) ---------- */
function platform(body, el, act) {
  const W = 320, H = 240, TS = 24, ROWS = 10;
  const { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  let level, grid, N, coins, foes, flagC, p, lives, score, over, off, cam, msgT, keys, t, spawnX;
  const solid = (c, r) => (c < 0 || c >= N ? r < ROWS : r < 0 || r >= ROWS ? false : grid[r][c] === 1);
  function hit(x, y, w, h) {
    for (let r = Math.floor(y / TS); r <= Math.floor((y + h - 0.01) / TS); r++)
      for (let c = Math.floor(x / TS); c <= Math.floor((x + w - 0.01) / TS); c++)
        if (solid(c, r)) return { c: c, r: r };
    return null;
  }
  function gen(lv) {
    N = 56 + lv * 10;
    grid = []; for (let r = 0; r < ROWS; r++) grid.push(new Array(N).fill(0));
    coins = []; foes = [];
    flagC = N - 4;
    let c = 0, lastGap = -10;
    while (c < N) {
      const canGap = c > 8 && c < N - 10 && c - lastGap > 6 && Math.random() < 0.13;
      if (canGap) { const gl = 2 + rand(2); for (let k = 0; k < gl; k++) coins.push({ x: (c + k) * TS + 12, y: 6 * TS + 4 - Math.sin(k / gl * Math.PI) * 30, got: false }); lastGap = c + gl; c += gl; continue; }
      grid[8][c] = 1; grid[9][c] = 1;
      c++;
    }
    for (let k = 0; k < N; k++) if (k < 6 || k > N - 8) { grid[8][k] = 1; grid[9][k] = 1; }
    for (let k = 10; k < N - 10; k += 3 + rand(5)) {
      if (!grid[8][k] || !grid[8][k + 1]) continue;
      const t2 = Math.random();
      if (t2 < 0.3) { grid[7][k] = 1; }
      else if (t2 < 0.45) { grid[7][k] = 1; grid[6][k] = 1; grid[7][k + 1] = 1; }
      else if (t2 < 0.8) { const len = 3 + rand(2); for (let q = 0; q < len; q++) { grid[5][k + q] = 1; coins.push({ x: (k + q) * TS + 12, y: 4 * TS + 6, got: false }); } }
      else coins.push({ x: k * TS + 12, y: 6 * TS, got: false }, { x: (k + 1) * TS + 12, y: 6 * TS - 6, got: false });
    }
    for (let k = 14; k < N - 12; k += 6 + rand(5)) {
      if (grid[8][k] && !grid[7][k] && !grid[7][k + 1] && grid[8][k + 1] && grid[8][k - 1]) foes.push({ x: k * TS, y: 8 * TS - 16, w: 18, h: 16, v: Math.random() < 0.5 ? -0.6 : 0.6, dead: 0 });
    }
  }
  function respawn() { p = { x: 40, y: 8 * TS - 22, w: 16, h: 22, vx: 0, vy: 0, on: false, face: 1 }; cam = 0; }
  function start() {
    if (off) off();
    level = 1; lives = 3; score = 0; over = false; msgT = 0; t = 0;
    keys = { l: 0, r: 0, j: 0 };
    gen(level); respawn();
    off = raf((dt) => { step(dt); draw(); });
  }
  function die() {
    lives--; msgT = 0;
    if (lives <= 0) { over = true; hi("nb_plat", score); } else respawn();
  }
  function step(dt) {
    t += dt;
    if (over) return;
    if (msgT > 0) { msgT -= dt; if (msgT <= 0) { level++; gen(level); respawn(); } return; }
    const ax = (keys.r - keys.l) * 2.3;
    p.vx = ax; if (ax) p.face = ax > 0 ? 1 : -1;
    if (keys.j && p.on) { p.vy = -8.6; p.on = false; }
    p.vy = Math.min(10, p.vy + 0.42 * dt);
    p.x += p.vx * dt;
    let h1 = hit(p.x, p.y, p.w, p.h);
    if (h1) { p.x = p.vx > 0 ? h1.c * TS - p.w : (h1.c + 1) * TS; }
    if (p.x < 0) p.x = 0;
    p.y += p.vy * dt; p.on = false;
    h1 = hit(p.x, p.y, p.w, p.h);
    if (h1) { if (p.vy > 0) { p.y = h1.r * TS - p.h; p.on = true; } else p.y = (h1.r + 1) * TS; p.vy = 0; }
    if (p.y > ROWS * TS + 30) { die(); return; }
    foes.forEach((e) => {
      if (e.dead) { e.dead -= dt; return; }
      e.x += e.v * dt;
      const ac = Math.floor((e.x + (e.v > 0 ? e.w : 0) + (e.v > 0 ? 1 : -1)) / TS);
      if (solid(ac, 7) || !solid(ac, 8)) e.v = -e.v;
      if (p.x + p.w > e.x + 2 && p.x < e.x + e.w - 2 && p.y + p.h > e.y && p.y < e.y + e.h) {
        if (p.vy > 1 && p.y + p.h - e.y < 14) { e.dead = 20; p.vy = -6; score += 20; }
        else { die(); }
      }
    });
    if (over) return;
    foes = foes.filter((e) => !(e.dead && e.dead <= 0));
    coins.forEach((q) => { if (!q.got && Math.abs(q.x - (p.x + p.w / 2)) < 14 && Math.abs(q.y - (p.y + p.h / 2)) < 16) { q.got = true; score += 10; } });
    if (p.x + p.w > flagC * TS + 6) { score += 100; msgT = 70; }
    cam = Math.max(0, Math.min(N * TS - W, p.x - 110));
  }
  function draw() {
    const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#4aa3d9"); g.addColorStop(1, "#bfe4f7");
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#e8f6ff";
    for (let i = 0; i < 5; i++) { const x = ((i * 190 - cam * 0.4) % 760 + 760) % 760 - 60; cx.beginPath(); cx.arc(x, 40 + (i % 3) * 22, 14, 0, 7); cx.arc(x + 16, 44 + (i % 3) * 22, 11, 0, 7); cx.arc(x - 14, 46 + (i % 3) * 22, 10, 0, 7); cx.fill(); }
    const c0 = Math.floor(cam / TS), c1 = Math.min(N - 1, c0 + Math.ceil(W / TS) + 1);
    for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) {
      if (!grid[r][c]) continue;
      const x = c * TS - cam, y = r * TS;
      if (r >= 8) { cx.fillStyle = "#8a5a2b"; cx.fillRect(x, y, TS, TS); if (!grid[r - 1] || !grid[r - 1][c]) { cx.fillStyle = "#3fb06a"; cx.fillRect(x, y, TS, 6); } }
      else { cx.fillStyle = "#c9803c"; cx.fillRect(x, y, TS, TS); cx.strokeStyle = "#8a5a2b"; cx.lineWidth = 2; cx.strokeRect(x + 1, y + 1, TS - 2, TS - 2); }
    }
    coins.forEach((q) => { if (q.got) return; const x = q.x - cam; if (x < -10 || x > W + 10) return; const wd = Math.abs(Math.sin((t + q.x) / 12)) * 6 + 2; cx.fillStyle = "#f0c24b"; cx.beginPath(); cx.ellipse(x, q.y, wd, 7, 0, 0, 7); cx.fill(); });
    const fx = flagC * TS - cam;
    cx.fillStyle = "#e5e9ef"; cx.fillRect(fx + 10, 4 * TS, 3, 4 * TS);
    cx.fillStyle = "#e5484d"; cx.beginPath(); cx.moveTo(fx + 13, 4 * TS); cx.lineTo(fx + 32, 4 * TS + 8); cx.lineTo(fx + 13, 4 * TS + 16); cx.fill();
    foes.forEach((e) => {
      const x = e.x - cam; if (x < -30 || x > W + 30) return;
      cx.fillStyle = "#9b5bd9";
      if (e.dead) cx.fillRect(x, e.y + e.h - 5, e.w, 5);
      else { cx.beginPath(); cx.ellipse(x + e.w / 2, e.y + e.h / 2 + 2, e.w / 2 + 1, e.h / 2 + 1, 0, 0, 7); cx.fill(); cx.fillStyle = "#fff"; cx.fillRect(x + 4, e.y + 4, 4, 5); cx.fillRect(x + 11, e.y + 4, 4, 5); cx.fillStyle = "#111"; cx.fillRect(x + 5, e.y + 6, 2, 3); cx.fillRect(x + 12, e.y + 6, 2, 3); }
    });
    if (!over) {
      const x = p.x - cam, y = p.y;
      cx.fillStyle = "#4a8fd9"; cx.beginPath(); cx.ellipse(x + 8, y + 12, 9, 11, 0, 0, 7); cx.fill();
      cx.fillStyle = "#fff"; cx.beginPath(); cx.arc(x + 8 + p.face * 3, y + 8, 4, 0, 7); cx.arc(x + 8 + p.face * -2, y + 8, 3, 0, 7); cx.fill();
      cx.fillStyle = "#111"; cx.beginPath(); cx.arc(x + 9 + p.face * 3, y + 8, 1.6, 0, 7); cx.arc(x + 8 + p.face * -2, y + 8, 1.3, 0, 7); cx.fill();
      cx.strokeStyle = "#4a8fd9"; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x + 8, y + 2); cx.lineTo(x + 8 - p.face * 3, y - 5); cx.stroke();
      cx.fillStyle = "#f0c24b"; cx.beginPath(); cx.arc(x + 8 - p.face * 3, y - 6, 2.5, 0, 7); cx.fill();
    }
    info.textContent = "Bölüm " + level + "   ❤ " + lives + "   Puan: " + score + "   En iyi: " + best("nb_plat");
    if (msgT > 0) banner(cx, W, H, "Bölüm " + level + " bitti! 🎉", "Sıradaki bölüm geliyor…");
    if (over) banner(cx, W, H, "Oyun bitti! " + score + " puan", "Yeniden başla'ya bas");
  }
  const hold = (label, k, grow) => {
    const b = act(label, () => {});
    b.style.cssText += ";touch-action:none;font-size:22px;padding:16px 0;min-width:0;flex:" + grow;
    b.onpointerdown = (e) => { e.preventDefault(); keys[k] = 1; };
    const up = () => { keys[k] = 0; };
    b.onpointerup = up; b.onpointerleave = up; b.onpointercancel = up;
    b.oncontextmenu = (e) => e.preventDefault();
    return b;
  };
  row.appendChild(hold("◀", "l", "1")); row.appendChild(hold("▶", "r", "1")); row.appendChild(hold("⬆ Zıpla", "j", "2"));
  const row2 = rowOf(body, el);
  row2.appendChild(act("Yeniden başla", start));
  const hint = el("p", "", "◀ ▶ ile yürü, ⬆ ile zıpla. Mor yaratıkların üstüne atlayarak ez, paraları topla, sondaki bayrağa ulaş. Çukurlara düşme!");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  return () => { off(); };
}

export const SOLO = {
  plat: { group: "Aksiyon", icon: "🕹️", label: "Pıtır Macerası", start: platform }
};
