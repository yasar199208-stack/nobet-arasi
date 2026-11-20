// Aksiyon oyunları: Yılan, Tuğla Kır, Pong, Zıpla, Uzay Kaçışı, Köstebek Vur
const rand = (n) => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
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
  r.style.cssText = "display:flex;gap:8px;margin-top:8px";
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
function text(cx, w, h, a, b) {
  cx.fillStyle = "rgba(0,0,0,.55)"; cx.fillRect(0, h / 2 - 44, w, 88);
  cx.fillStyle = "#fff"; cx.textAlign = "center";
  cx.font = "700 22px sans-serif"; cx.fillText(a, w / 2, h / 2 - 6);
  cx.font = "15px sans-serif"; cx.fillText(b || "", w / 2, h / 2 + 22);
}

/* ---------- Yılan ---------- */
function snake(body, el, act) {
  const N = 16, S = 20, { cv, cx, info } = arena(body, el, N * S, N * S);
  let sn, dir, nd, food, score, over, timer;
  function place() { do { food = [rand(N), rand(N)]; } while (sn.some((s) => s[0] === food[0] && s[1] === food[1])); }
  function say() { info.textContent = over ? "Bitti! Skor: " + score + "   En iyi: " + best("nb_snake") : "Skor: " + score + "   En iyi: " + best("nb_snake"); }
  function draw() {
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, N * S, N * S);
    cx.fillStyle = "#e5484d"; cx.fillRect(food[0] * S + 2, food[1] * S + 2, S - 4, S - 4);
    sn.forEach((s, i) => { cx.fillStyle = i ? "#3fb06a" : "#f0c24b"; cx.fillRect(s[0] * S + 1, s[1] * S + 1, S - 2, S - 2); });
  }
  function tick() {
    if (over) return;
    dir = nd;
    const h = [sn[0][0] + dir[0], sn[0][1] + dir[1]];
    if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || sn.some((s) => s[0] === h[0] && s[1] === h[1])) {
      over = true; hi("nb_snake", score); say(); draw(); return;
    }
    sn.unshift(h);
    if (h[0] === food[0] && h[1] === food[1]) {
      score++; place();
      if (score % 4 === 0) { clearInterval(timer); timer = setInterval(tick, Math.max(60, 130 - score * 3)); }
    } else sn.pop();
    draw(); say();
  }
  function turn(dx, dy) { if (dx !== -dir[0] || dy !== -dir[1]) nd = [dx, dy]; }
  function start() {
    sn = [[8, 8], [7, 8], [6, 8]]; dir = [1, 0]; nd = dir; score = 0; over = false;
    place(); clearInterval(timer); timer = setInterval(tick, 130); draw(); say();
  }
  let sx = 0, sy = 0;
  cv.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
  cv.addEventListener("pointerup", (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
  });
  const pad = el("div", "");
  pad.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:220px;margin:0 auto 8px";
  [["", 0, 0], ["⬆️", 0, -1], ["", 0, 0], ["⬅️", -1, 0], ["⬇️", 0, 1], ["➡️", 1, 0]].forEach((x) => {
    const b = el("button", "", x[0]);
    b.type = "button";
    b.style.cssText = "padding:12px 0;font-size:22px" + (x[0] ? "" : ";visibility:hidden");
    if (x[0]) b.onclick = () => turn(x[1], x[2]);
    pad.appendChild(b);
  });
  body.appendChild(pad);
  const key = (e) => {
    const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (m[e.key]) { e.preventDefault(); turn(m[e.key][0], m[e.key][1]); }
  };
  document.addEventListener("keydown", key);
  rowOf(body, el).appendChild(act("Yeniden başla", start));
  start();
  return () => { clearInterval(timer); document.removeEventListener("keydown", key); };
}

/* ---------- Tuğla Kır ---------- */
function breakout(body, el, act) {
  const W = 320, H = 400, { cv, cx, info } = arena(body, el, W, H);
  const COL = ["#e5484d", "#d9822b", "#f0c24b", "#3fb06a", "#4a8fd9"];
  let padX, bx, by, vx, vy, bricks, lives, score, state;
  function reset() {
    padX = W / 2; lives = 3; score = 0; state = "ready";
    bricks = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) bricks.push({ x: c * 40 + 2, y: 40 + r * 20, c: COL[r], on: true });
    serve();
  }
  function serve() { state = state === "lost" ? "lost" : "ready"; bx = padX; by = H - 30; vx = 0; vy = 0; }
  function say() { info.textContent = "Skor: " + score + "   Can: " + "❤️".repeat(lives) + "   En iyi: " + best("nb_brick"); }
  function step(dt) {
    if (state === "play") {
      bx += vx * dt; by += vy * dt;
      if (bx < 6) { bx = 6; vx = -vx; }
      if (bx > W - 6) { bx = W - 6; vx = -vx; }
      if (by < 6) { by = 6; vy = -vy; }
      if (vy > 0 && by + 6 >= H - 24 && by - 6 <= H - 14 && bx >= padX - 38 && bx <= padX + 38) {
        vy = -Math.abs(vy); vx = clamp((bx - padX) / 32 * 5, -5.5, 5.5);
      }
      for (const b of bricks) {
        if (b.on && bx >= b.x - 6 && bx <= b.x + 42 && by >= b.y - 6 && by <= b.y + 20) {
          b.on = false; vy = -vy; score += 10; break;
        }
      }
      if (!bricks.some((b) => b.on)) { state = "won"; hi("nb_brick", score); }
      if (by > H) {
        lives--;
        if (lives <= 0) { state = "lost"; hi("nb_brick", score); } else { state = "ready"; serve(); }
      }
    } else if (state === "ready") { bx = padX; by = H - 30; }
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W, H);
    bricks.forEach((b) => { if (b.on) { cx.fillStyle = b.c; cx.fillRect(b.x, b.y, 36, 14); } });
    cx.fillStyle = "#e3e9f0"; cx.fillRect(padX - 32, H - 20, 64, 8);
    cx.beginPath(); cx.arc(bx, by, 6, 0, 7); cx.fill();
    if (state === "ready") text(cx, W, H, "Dokun ve başla", "Parmağını sürükleyerek çubuğu oynat");
    if (state === "won") text(cx, W, H, "Kazandın! 🎉", "Skor: " + score);
    if (state === "lost") text(cx, W, H, "Oyun bitti", "Skor: " + score);
    say();
  }
  cv.addEventListener("pointermove", (e) => { padX = clamp(pos(cv, e).x, 32, W - 32); });
  cv.addEventListener("pointerdown", (e) => {
    padX = clamp(pos(cv, e).x, 32, W - 32);
    if (state === "ready") { state = "play"; vy = -4.4; vx = 2.2 * (Math.random() < 0.5 ? -1 : 1); }
  });
  rowOf(body, el).appendChild(act("Yeniden başla", reset));
  reset();
  return raf(step);
}

/* ---------- Pong ---------- */
function pong(body, el, act) {
  const W = 320, H = 420, { cv, cx, info } = arena(body, el, W, H);
  let padX, aiX, bx, by, vx, vy, ps, as, state, serveDir;
  function serve() { bx = W / 2; by = H / 2; vx = 0; vy = 0; state = "ready"; }
  function reset() { padX = W / 2; aiX = W / 2; ps = 0; as = 0; serveDir = 1; serve(); }
  function step(dt) {
    if (state === "play") {
      bx += vx * dt; by += vy * dt;
      if (bx < 6) { bx = 6; vx = -vx; }
      if (bx > W - 6) { bx = W - 6; vx = -vx; }
      if (vy > 0 && by + 6 >= H - 20 && by <= H - 10 && Math.abs(bx - padX) <= 38) {
        vy = -Math.min(9, Math.abs(vy) * 1.05); vx = clamp(vx + (bx - padX) / 32 * 3, -6, 6);
      }
      if (vy < 0 && by - 6 <= 20 && by >= 10 && Math.abs(bx - aiX) <= 38) {
        vy = Math.min(9, Math.abs(vy) * 1.05); vx = clamp(vx + (bx - aiX) / 32 * 3, -6, 6);
      }
      const sp = 2.4 + Math.min(1.4, ps * 0.25);
      aiX = clamp(aiX + clamp(bx - aiX, -sp * dt, sp * dt), 32, W - 32);
      if (by > H + 10) { as++; state = as >= 5 ? "lost" : "ready"; if (state === "ready") { serve(); serveDir = 1; } }
      if (by < -10) { ps++; state = ps >= 5 ? "won" : "ready"; if (state === "ready") { serve(); serveDir = -1; } }
    }
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W, H);
    cx.strokeStyle = "#2a3d57"; cx.setLineDash([8, 8]); cx.beginPath(); cx.moveTo(0, H / 2); cx.lineTo(W, H / 2); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle = "#e5484d"; cx.fillRect(aiX - 32, 12, 64, 8);
    cx.fillStyle = "#e3e9f0"; cx.fillRect(padX - 32, H - 20, 64, 8);
    cx.beginPath(); cx.arc(bx, by, 6, 0, 7); cx.fill();
    info.textContent = "Sen " + ps + " – " + as + " Bilgisayar   (5'e kadar)";
    if (state === "ready") text(cx, W, H, "Dokun ve başla", "Çubuğu parmağınla sürükle");
    if (state === "won") text(cx, W, H, "Kazandın! 🎉", ps + " – " + as);
    if (state === "lost") text(cx, W, H, "Kaybettin", ps + " – " + as);
  }
  cv.addEventListener("pointermove", (e) => { padX = clamp(pos(cv, e).x, 32, W - 32); });
  cv.addEventListener("pointerdown", (e) => {
    padX = clamp(pos(cv, e).x, 32, W - 32);
    if (state === "ready") { state = "play"; vy = 4 * serveDir; vx = 2 * (Math.random() < 0.5 ? -1 : 1); }
  });
  rowOf(body, el).appendChild(act("Yeniden başla", reset));
  reset();
  return raf(step);
}

/* ---------- Zıpla ---------- */
function flap(body, el, act) {
  const W = 320, H = 440, { cv, cx, info } = arena(body, el, W, H);
  let y, vy, pipes, score, state, t0;
  function reset() { y = H / 2; vy = 0; pipes = []; score = 0; state = "ready"; }
  function jump() {
    if (state === "ready") state = "play";
    if (state === "play") vy = -6.6;
    else if (state === "over" && performance.now() - t0 > 500) reset();
  }
  function step(dt) {
    if (state === "play") {
      vy += 0.42 * dt; y += vy * dt;
      if (!pipes.length || pipes[pipes.length - 1].x < W - 170) pipes.push({ x: W + 10, g: 120 + rand(H - 240), p: false });
      pipes.forEach((p) => { p.x -= 2.5 * dt; });
      pipes = pipes.filter((p) => p.x > -60);
      for (const p of pipes) {
        if (!p.p && p.x + 50 < 80) { p.p = true; score++; }
        if (80 + 11 > p.x && 80 - 11 < p.x + 50 && (y - 11 < p.g - 70 || y + 11 > p.g + 70)) state = "over";
      }
      if (y > H - 11 || y < 0) state = "over";
      if (state === "over") { hi("nb_flap", score); t0 = performance.now(); }
    }
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#3fb06a";
    pipes.forEach((p) => { cx.fillRect(p.x, 0, 50, p.g - 70); cx.fillRect(p.x, p.g + 70, 50, H); });
    cx.fillStyle = "#f0c24b"; cx.beginPath(); cx.arc(80, y, 11, 0, 7); cx.fill();
    info.textContent = "Skor: " + score + "   En iyi: " + best("nb_flap");
    if (state === "ready") text(cx, W, H, "Dokun: zıpla", "Borulardan geç");
    if (state === "over") text(cx, W, H, "Bitti! Skor: " + score, "Yeniden için dokun");
  }
  cv.addEventListener("pointerdown", jump);
  rowOf(body, el).appendChild(act("Yeniden başla", reset));
  reset();
  return raf(step);
}

/* ---------- Uzay Kaçışı ---------- */
function space(body, el, act) {
  const W = 320, H = 440, { cv, cx, info } = arena(body, el, W, H);
  let sx, rocks, frames, state, spawn;
  function reset() { sx = W / 2; rocks = []; frames = 0; spawn = 0; state = "ready"; }
  function step(dt) {
    if (state === "play") {
      frames += dt; spawn -= dt;
      if (spawn <= 0) { rocks.push({ x: rand(W), y: -20, r: 9 + rand(14), v: 2 + Math.random() * 2.5 + frames / 1500 }); spawn = Math.max(10, 36 - frames / 25); }
      rocks.forEach((r) => { r.y += r.v * dt; });
      rocks = rocks.filter((r) => r.y < H + 30);
      for (const r of rocks) if (Math.hypot(r.x - sx, r.y - (H - 40)) < r.r + 9) state = "over";
      if (state === "over") hi("nb_space", Math.floor(frames / 60));
    }
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#8da0b6"; rocks.forEach((r) => { cx.beginPath(); cx.arc(r.x, r.y, r.r, 0, 7); cx.fill(); });
    cx.fillStyle = "#f0c24b"; cx.beginPath(); cx.moveTo(sx, H - 52); cx.lineTo(sx - 12, H - 28); cx.lineTo(sx + 12, H - 28); cx.fill();
    info.textContent = "Süre: " + Math.floor(frames / 60) + " sn   En iyi: " + best("nb_space") + " sn";
    if (state === "ready") text(cx, W, H, "Dokun ve başla", "Parmağınla gemiyi sürükle, kayalardan kaç");
    if (state === "over") text(cx, W, H, "Çarptın! " + Math.floor(frames / 60) + " sn", "Yeniden başla'ya bas");
  }
  cv.addEventListener("pointermove", (e) => { sx = clamp(pos(cv, e).x, 14, W - 14); });
  cv.addEventListener("pointerdown", (e) => { sx = clamp(pos(cv, e).x, 14, W - 14); if (state === "ready") state = "play"; });
  rowOf(body, el).appendChild(act("Yeniden başla", reset));
  reset();
  return raf(step);
}

/* ---------- Köstebek Vur ---------- */
function mole(body, el, act) {
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 10px;font-size:15px";
  body.appendChild(info);
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px";
  body.appendChild(gr);
  let score, left, cur, tm, cd, run;
  function draw() {
    gr.textContent = "";
    for (let i = 0; i < 9; i++) {
      const b = el("button", "", i === cur ? "🐹" : "🕳️");
      b.type = "button";
      b.style.cssText = "height:84px;font-size:40px;padding:0";
      b.onclick = () => { if (run && i === cur) { score++; cur = -1; clearTimeout(tm); tm = setTimeout(pop, 150); draw(); say(); } };
      gr.appendChild(b);
    }
  }
  function say() { info.textContent = run ? "Süre: " + left + " sn   Skor: " + score : "Süre bitti! Skor: " + score + "   En iyi: " + best("nb_mole"); }
  function pop() {
    if (!run) return;
    cur = rand(9); draw();
    tm = setTimeout(() => { cur = -1; draw(); tm = setTimeout(pop, 250); }, Math.max(380, 750 - score * 12));
  }
  function start() {
    clearTimeout(tm); clearInterval(cd);
    score = 0; left = 30; cur = -1; run = true; draw(); say(); pop();
    cd = setInterval(() => {
      left--;
      if (left <= 0) { run = false; cur = -1; clearInterval(cd); clearTimeout(tm); hi("nb_mole", score); draw(); }
      say();
    }, 1000);
  }
  rowOf(body, el).appendChild(act("Yeniden başla", start));
  start();
  return () => { run = false; clearTimeout(tm); clearInterval(cd); };
}

export const SOLO = {
  snake: { group: "Aksiyon", icon: "🐍", label: "Yılan", start: snake },
  breakout: { group: "Aksiyon", icon: "🧱", label: "Tuğla Kır", start: breakout },
  pong: { group: "Aksiyon", icon: "🏓", label: "Pong", start: pong },
  flap: { group: "Aksiyon", icon: "🐦", label: "Zıpla", start: flap },
  space: { group: "Aksiyon", icon: "🚀", label: "Uzay Kaçışı", start: space },
  mole: { group: "Aksiyon", icon: "🔨", label: "Köstebek Vur", start: mole }
};
