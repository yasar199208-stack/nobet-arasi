// Zeka/Aksiyon oyunları 13: Yılan 3D (perspektif görünümlü yılan oyunu, seviyeli)
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function hi(k, v) { const o = best(k); if (v > o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }

function snake3d(body, el, act) {
  const W = 360, H = 430, N = 14, TOP = 62, BOT = 392, CWT = 15, CWB = 25.5;
  const THEMES = [
    { n: "Çayır", bg1: "#7fd0ff", bg2: "#d8f1ff", t1: "#5db04b", t2: "#52a343", edge: "#3b7a30", wall: "#8a8f9a", wallTop: "#b6bcc8" },
    { n: "Çöl", bg1: "#ff9d4d", bg2: "#ffe2a8", t1: "#e8c57a", t2: "#ddb86b", edge: "#a97c3a", wall: "#b0743c", wallTop: "#d49a5e" },
    { n: "Buz", bg1: "#86c9ff", bg2: "#eaf7ff", t1: "#d9f0fc", t2: "#c8e6f6", edge: "#8fb8d6", wall: "#8ec7ea", wallTop: "#c9ecff" },
    { n: "Gece", bg1: "#050816", bg2: "#2a2557", t1: "#2f6b45", t2: "#295e3d", edge: "#1c3a2a", wall: "#4a4f66", wallTop: "#6a7090" },
    { n: "Lav", bg1: "#2a0a12", bg2: "#c0482c", t1: "#6e5863", t2: "#624c57", edge: "#3a2a33", wall: "#2b1c22", wallTop: "#ff6a2a" }
  ];
  const LVL = [
    () => [],
    () => [[0, 0], [1, 0], [0, 1], [13, 0], [12, 0], [13, 1], [0, 13], [1, 13], [0, 12], [13, 13], [12, 13], [13, 12]],
    () => { const a = []; for (let x = 4; x < 10; x++) a.push([x, 6]); return a; },
    () => { const a = []; for (let y = 2; y < 9; y++) { a.push([4, y]); a.push([9, y]); } return a; },
    () => { const a = []; for (let i = 3; i < 11; i++) { if (i === 6 || i === 7) continue; a.push([i, 3]); a.push([i, 10]); a.push([3, i]); a.push([10, i]); } return a; },
    () => { const a = []; for (let y = 1; y < 13; y += 3) for (let x = 1; x < 13; x += 3) a.push([x + (y % 2), y]); return a; },
    () => { const a = []; for (let x = 0; x < 11; x++) { a.push([x, 4]); } for (let x = 3; x < 14; x++) { a.push([x, 8]); } return a; },
    () => { const a = []; for (let i = 2; i < 12; i++) { if (i !== 6 && i !== 7) { a.push([i, 6]); a.push([6, i]); } } return a; },
    () => { const a = []; for (let i = 1; i < 13; i++) { if (i % 4 !== 0) { a.push([i, i]); a.push([13 - i, i]); } } return a; },
    () => { const a = [], s = 7; let seed = s; const r = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; for (let i = 0; i < 24; i++) a.push([Math.floor(r() * 14), Math.floor(r() * 14)]); return a; }
  ];
  const cvs = el("canvas", "");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let level, theme, walls, snake, prev, dir, queue, food, gold, goldT, apples, goal, score, over, won, dead, raf, last, acc, interval, unlocked, msg, msgT, reach, T = 0, nextB, retryB, shake = 0;
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 4px;font-size:15px";
  body.appendChild(info);
  const sub = el("p", "", "");
  sub.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)";
  body.appendChild(sub);
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.cssText = "display:block;width:100%;max-width:360px;margin:0 auto 10px;touch-action:none;user-select:none;border-radius:12px";
  body.appendChild(cvs);
  const ctx = cvs.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  unlocked = Math.max(1, best("nb_snake3"));

  const P = (gx, gy, h) => {
    const v = Math.max(0, Math.min(1, gy / N)), cw = CWT + (CWB - CWT) * v, vv = Math.pow(v, 1.35);
    return [W / 2 + (gx - N / 2) * cw, TOP + (BOT - TOP) * vv - (h || 0) * cw, cw];
  };
  function poly(pts, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fill();
  }
  function levelCfg(n) { return { goal: Math.min(16, 5 + n), iv: Math.max(85, 190 - (n - 1) * 11), th: (n - 1) % 5 }; }
  const wallAt = (x, y) => walls.some((w) => w[0] === x && w[1] === y);

  function makeLevel(n) {
    let ws;
    if (n <= LVL.length) ws = LVL[n - 1]();
    else {
      ws = []; let seed = n * 77;
      const r = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < Math.min(40, 20 + n); i++) ws.push([Math.floor(r() * 14), Math.floor(r() * 14)]);
    }
    return ws.filter((c) => !(c[0] <= 8 && c[1] >= 9 && c[1] <= 13)).filter((c, i, a) => a.findIndex((d) => d[0] === c[0] && d[1] === c[1]) === i);
  }
  function computeReach() {
    const seen = new Set(), q = [[4, 11]];
    seen.add("4,11");
    while (q.length) {
      const c = q.pop();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach((d) => {
        const x = c[0] + d[0], y = c[1] + d[1], k = x + "," + y;
        if (x < 0 || y < 0 || x >= N || y >= N || seen.has(k) || wallAt(x, y)) return;
        seen.add(k); q.push([x, y]);
      });
    }
    reach = Array.from(seen).map((k) => k.split(",").map(Number));
  }
  function spawnFood() {
    const free = reach.filter((c) => !snake.some((s) => s.x === c[0] && s.y === c[1]) && !(gold && gold.x === c[0] && gold.y === c[1]));
    if (!free.length) { food = null; return; }
    const c = free[Math.floor(Math.random() * free.length)];
    food = { x: c[0], y: c[1] };
  }
  function start(n) {
    level = Math.max(1, Math.min(n, unlocked));
    const c = levelCfg(level);
    theme = THEMES[c.th]; goal = c.goal; interval = c.iv;
    walls = makeLevel(level);
    computeReach();
    snake = [{ x: 4, y: 11 }, { x: 3, y: 11 }, { x: 2, y: 11 }];
    prev = snake.map((s) => ({ x: s.x, y: s.y }));
    dir = [1, 0]; queue = []; gold = null; goldT = 0; apples = 0; over = false; won = false; acc = 0; msg = ""; msgT = 0; shake = 0;
    if (level === 1 || start.reset) { score = 0; start.reset = false; }
    spawnFood();
    if (nextB) { nextB.style.display = "none"; retryB.style.display = "none"; }
  }
  function turn(dx, dy) {
    if (over || won) return;
    const ref = queue.length ? queue[queue.length - 1] : dir;
    if (dx === -ref[0] && dy === -ref[1]) return;
    if (dx === ref[0] && dy === ref[1]) return;
    if (queue.length < 2) queue.push([dx, dy]);
  }
  function die(why) {
    over = true; shake = 0.5; msg = why; msgT = 5;
    hi("nb_snake3_best", score);
    retryB.style.display = "";
    try { if (navigator.vibrate) navigator.vibrate(100); } catch (e) {}
  }
  function step() {
    if (queue.length) dir = queue.shift();
    prev = snake.map((s) => ({ x: s.x, y: s.y }));
    const h = snake[0], nx = h.x + dir[0], ny = h.y + dir[1];
    if (nx < 0 || ny < 0 || nx >= N || ny >= N) { die("Duvara çarptın!"); return; }
    if (wallAt(nx, ny)) { die("Engele çarptın!"); return; }
    const tail = snake[snake.length - 1];
    if (snake.some((s, i) => s.x === nx && s.y === ny && !(i === snake.length - 1))) { die("Kendini ısırdın!"); return; }
    snake.unshift({ x: nx, y: ny });
    let grew = false;
    if (food && nx === food.x && ny === food.y) {
      grew = true; apples++; score += 10;
      if (apples >= goal) {
        won = true;
        score += 100;
        if (level + 1 > unlocked) { unlocked = level + 1; hi("nb_snake3", unlocked); }
        hi("nb_snake3_best", score);
        nextB.style.display = ""; retryB.style.display = "";
      } else {
        spawnFood();
        if (!gold && apples % 3 === 0) {
          const free = reach.filter((c) => !snake.some((s) => s.x === c[0] && s.y === c[1]) && !(food && food.x === c[0] && food.y === c[1]));
          if (free.length) { const c = free[Math.floor(Math.random() * free.length)]; gold = { x: c[0], y: c[1] }; goldT = 8; }
        }
      }
    } else if (gold && nx === gold.x && ny === gold.y) {
      grew = true; score += 50; gold = null; msg = "Altın elma +50"; msgT = 1;
    }
    if (!grew) snake.pop(); else prev.push({ x: tail.x, y: tail.y });
    if (prev.length < snake.length) prev.push({ x: tail.x, y: tail.y });
  }
  function update(dt) {
    T += dt;
    if (shake > 0) shake -= dt;
    if (msgT > 0) msgT -= dt;
    if (gold) { goldT -= dt; if (goldT <= 0) gold = null; }
    if (over || won) return;
    acc += dt * 1000;
    let guard = 0;
    while (acc >= interval && !over && !won && guard++ < 4) { acc -= interval; step(); }
  }

  function sphere(gx, gy, h, r, c1, c2, c3, alpha) {
    const p = P(gx, gy, h), g0 = P(gx, gy, 0), cw = p[2], rr = r * cw;
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.beginPath(); ctx.ellipse(g0[0] + cw * 0.08, g0[1], rr * 0.9, rr * 0.35, 0, 0, 7); ctx.fill();
    const gr = ctx.createRadialGradient(p[0] - rr * 0.35, p[1] - rr * 0.4, rr * 0.1, p[0], p[1], rr);
    gr.addColorStop(0, c1); gr.addColorStop(0.45, c2); gr.addColorStop(1, c3);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.ellipse(p[0] - rr * 0.35, p[1] - rr * 0.45, rr * 0.25, rr * 0.14, -0.6, 0, 7); ctx.fill();
    ctx.restore();
    return p;
  }
  function box(x, y) {
    const a = P(x, y, 0), b = P(x + 1, y, 0), c = P(x + 1, y + 1, 0), d = P(x, y + 1, 0);
    const ah = P(x, y, 0.95), bh = P(x + 1, y, 0.95), ch = P(x + 1, y + 1, 0.95), dh = P(x, y + 1, 0.95);
    poly([d, c, ch, dh], theme.wall);
    poly([dh, ch, bh, ah], theme.wallTop);
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(d[0], d[1]); ctx.lineTo(dh[0], dh[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(ch[0], ch[1]); ctx.stroke();
  }
  function render() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 8 * Math.min(1, shake * 3), (Math.random() - 0.5) * 6 * Math.min(1, shake * 3));
    const sky = ctx.createLinearGradient(0, 0, 0, TOP + 60);
    sky.addColorStop(0, theme.bg1); sky.addColorStop(1, theme.bg2);
    ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, H + 20);
    if (level % 5 === 4) { ctx.fillStyle = "#fff"; for (let i = 0; i < 30; i++) { ctx.globalAlpha = 0.5; ctx.fillRect((i * 97) % W, (i * 31) % 50, 1.5, 1.5); } ctx.globalAlpha = 1; }
    // zemin tahtası
    const c1 = P(0, 0, 0), c2 = P(N, 0, 0), c3 = P(N, N, 0), c4 = P(0, N, 0);
    poly([[c4[0] - 6, c4[1]], [c3[0] + 6, c3[1]], [c3[0] + 6, c3[1] + 16], [c4[0] - 6, c4[1] + 16]], theme.edge);
    poly([[c1[0] - 6, c1[1] - 4], [c2[0] + 6, c2[1] - 4], [c3[0] + 6, c3[1]], [c4[0] - 6, c4[1]]], theme.edge);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const a = P(x, y, 0), b = P(x + 1, y, 0), c = P(x + 1, y + 1, 0), d = P(x, y + 1, 0);
      poly([a, b, c, d], (x + y) % 2 ? theme.t1 : theme.t2);
    }
    // nesneler (arkadan öne)
    const items = [];
    walls.forEach((w) => items.push({ y: w[1], x: w[0], k: "w" }));
    if (food) items.push({ y: food.y, x: food.x, k: "f" });
    if (gold) items.push({ y: gold.y, x: gold.x, k: "g" });
    const t = Math.min(1, acc / interval);
    const sp = snake.map((s, i) => {
      const p0 = prev[i] || s;
      const tt = over || won ? 1 : t;
      return { x: p0.x + (s.x - p0.x) * tt, y: p0.y + (s.y - p0.y) * tt, i: i };
    });
    sp.forEach((s) => items.push({ y: s.y, x: s.x, k: "s", s: s }));
    items.sort((a, b) => (a.y - b.y) || (a.x - b.x));
    items.forEach((it) => {
      if (it.k === "w") box(it.x, it.y);
      else if (it.k === "f") {
        const bob = Math.sin(T * 4) * 0.05;
        const p = sphere(it.x + 0.5, it.y + 0.5, 0.42 + bob, 0.36, "#ff9a9a", "#e8262c", "#8a0a12");
        ctx.fillStyle = "#3a8a2a"; ctx.beginPath(); ctx.ellipse(p[0] + p[2] * 0.12, p[1] - p[2] * 0.4, p[2] * 0.14, p[2] * 0.07, -0.6, 0, 7); ctx.fill();
        ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = Math.max(1, p[2] * 0.06); ctx.beginPath(); ctx.moveTo(p[0], p[1] - p[2] * 0.33); ctx.lineTo(p[0] + 1, p[1] - p[2] * 0.48); ctx.stroke();
      } else if (it.k === "g") {
        const a = goldT < 2 ? (Math.floor(T * 8) % 2 ? 0.4 : 1) : 1;
        sphere(it.x + 0.5, it.y + 0.5, 0.45 + Math.sin(T * 6) * 0.07, 0.38, "#fff5b0", "#ffd23a", "#b8860b", a);
      } else {
        const s = it.s, head = s.i === 0, ratio = s.i / Math.max(1, snake.length - 1);
        const h1 = 120 - ratio * 20, l = 62 - ratio * 22;
        const c1 = "hsl(" + h1 + ",85%," + (l + 22) + "%)", c2 = "hsl(" + h1 + ",75%," + l + "%)", c3 = "hsl(" + h1 + ",70%," + (l - 28) + "%)";
        const p = sphere(s.x + 0.5, s.y + 0.5, 0.42, head ? 0.5 : 0.45 - ratio * 0.08, c1, c2, c3);
        if (head) {
          const cw = p[2], ex = dir[0], ey = dir[1];
          const px = -ey, py = ex;
          [-1, 1].forEach((sg) => {
            const ox = (ex * 0.22 + px * 0.2 * sg) * cw, oy = (ey * 0.2 + py * 0.2 * sg) * cw * 0.7 - cw * 0.12;
            ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p[0] + ox, p[1] + oy, cw * 0.12, 0, 7); ctx.fill();
            ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(p[0] + ox + ex * cw * 0.03, p[1] + oy + ey * cw * 0.02, cw * 0.06, 0, 7); ctx.fill();
          });
          if (!over && Math.floor(T * 3) % 2 === 0) { ctx.strokeStyle = "#e8262c"; ctx.lineWidth = Math.max(1, cw * 0.05); ctx.beginPath(); ctx.moveTo(p[0] + ex * cw * 0.4, p[1] + ey * cw * 0.3 + cw * 0.05); ctx.lineTo(p[0] + ex * cw * 0.66, p[1] + ey * cw * 0.5 + cw * 0.05); ctx.stroke(); }
        }
      }
    });
    // HUD
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(8, 8, 150, 34, 8) : ctx.rect(8, 8, 150, 34); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("🍎 " + apples + " / " + goal + "   ⭐ " + score, 16, 30);
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(W - 128, 8, 120, 34, 8) : ctx.rect(W - 128, 8, 120, 34); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText("Seviye " + level + " • " + theme.n, W - 68, 30);
    if (msgT > 0 && !over) { ctx.globalAlpha = Math.min(1, msgT * 1.5); ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 4; ctx.font = "bold 22px sans-serif"; ctx.strokeText(msg, W / 2, 80); ctx.fillText(msg, W / 2, 80); ctx.globalAlpha = 1; }
    if (over) {
      ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.fillRect(0, 160, W, 120);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 28px sans-serif"; ctx.fillText("Oyun bitti!", W / 2, 200);
      ctx.font = "16px sans-serif"; ctx.fillText(msg + "  Puan: " + score, W / 2, 232);
      ctx.font = "14px sans-serif"; ctx.fillText("\"Tekrar\" ile bu seviyeyi yeniden dene", W / 2, 258);
    }
    if (won) {
      ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 150, W, 130);
      ctx.fillStyle = "#ffd23a"; ctx.textAlign = "center"; ctx.font = "bold 28px sans-serif"; ctx.fillText("Seviye tamam! 🎉", W / 2, 200);
      ctx.fillStyle = "#fff"; ctx.font = "16px sans-serif"; ctx.fillText("Puan: " + score + "   (+100 bonus)", W / 2, 236);
    }
    ctx.restore();
    info.textContent = "Seviye " + level + "   Puan: " + score + "   Uzunluk: " + snake.length;
    sub.textContent = "Açık seviye: " + unlocked + "   En iyi puan: " + best("nb_snake3_best");
  }
  function loop(tm) {
    if (dead) return;
    const dt = Math.min(0.05, (tm - last) / 1000 || 0.016);
    last = tm;
    update(dt); render();
    raf = requestAnimationFrame(loop);
  }
  let dn = null;
  cvs.onpointerdown = (e) => { try { cvs.setPointerCapture(e.pointerId); } catch (x) {} dn = { x: e.clientX, y: e.clientY }; };
  cvs.onpointermove = (e) => {
    if (!dn) return;
    const dx = e.clientX - dn.x, dy = e.clientY - dn.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
    dn = { x: e.clientX, y: e.clientY };
  };
  cvs.onpointerup = () => { dn = null; };
  cvs.onpointercancel = cvs.onpointerup;
  const kd = (e) => {
    const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1] }[e.key];
    if (m) { e.preventDefault(); turn(m[0], m[1]); }
  };
  window.addEventListener("keydown", kd);
  const pad = el("div", "");
  pad.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:260px;margin:0 auto 8px";
  const pb = (txt, dx, dy, col) => {
    const b = el("button", "", txt);
    b.type = "button";
    b.style.cssText = "padding:14px 0;font-size:20px;font-weight:800;touch-action:none;user-select:none;grid-column:" + col;
    b.onpointerdown = (e) => { e.preventDefault(); turn(dx, dy); };
    pad.appendChild(b);
  };
  pb("▲", 0, -1, "2"); pb("◀", -1, 0, "1"); pb("▼", 0, 1, "2"); pb("▶", 1, 0, "3");
  pad.children[1].style.gridRow = "2"; pad.children[2].style.gridRow = "2"; pad.children[3].style.gridRow = "2";
  pad.children[0].style.gridRow = "1";
  body.appendChild(pad);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  body.appendChild(row);
  const go = (n) => { start(n); };
  const bPrev = act("◀ Önceki", () => go(level - 1));
  const bNext = act("Sonraki ▶", () => go(level + 1));
  retryB = act("Tekrar", () => go(level));
  nextB = act("Sonraki seviye ▶", () => go(level + 1));
  [bPrev, bNext, retryB, nextB].forEach((b) => { b.style.minWidth = "0"; row.appendChild(b); });
  const hint = el("p", "", "Parmağınla ekranda kaydır ya da ok tuşlarına bas. Kırmızı elmaları ye, hedef sayıya ulaşınca seviye biter. Altın elma 8 saniye durur (+50 puan). Duvara, engele ya da kendi kuyruğuna çarpma. Seviyeler ilerledikçe hız artar, engeller ve temalar (çayır, çöl, buz, gece, lav) değişir.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start.reset = true;
  start(1);
  nextB.style.display = "none"; retryB.style.display = "none";
  dead = false; last = performance.now();
  raf = requestAnimationFrame(loop);
  return () => { dead = true; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); };
}

export const SOLO = {
  snake3d: { group: "Aksiyon", icon: "🐍", label: "Yılan 3D", start: snake3d }
};
