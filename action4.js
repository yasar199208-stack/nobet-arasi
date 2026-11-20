// Aksiyon oyunları 4: Uzaylı İstilası, Asteroid Avı, Meyve Kes
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

/* ---------- Uzaylı İstilası ---------- */
function invaders(body, el, act) {
  const W = 300, H = 380, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  let px, tx, shots, bombs, en, dir, score, lives, wave, over, fire, off, hurt;
  function wave1() {
    en = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) en.push({ x: 30 + c * 34, y: 40 + r * 30, r: r });
    dir = 1; shots = []; bombs = [];
  }
  function start() {
    if (off) off();
    px = tx = W / 2; score = 0; lives = 3; wave = 1; over = false; fire = 0; hurt = 0;
    wave1();
    off = raf((dt) => {
      if (!over) step(dt);
      draw();
    });
  }
  function step(dt) {
    px += (tx - px) * Math.min(1, 0.25 * dt);
    fire -= dt;
    if (fire <= 0) { shots.push({ x: px, y: H - 40 }); fire = 22; }
    shots.forEach((s) => { s.y -= 7 * dt; });
    shots = shots.filter((s) => s.y > -10);
    const sp = (0.5 + wave * 0.15 + (28 - en.length) * 0.03) * dt;
    let edge = false;
    en.forEach((e) => { e.x += dir * sp; if (e.x < 14 || e.x > W - 14) edge = true; });
    if (edge) { dir = -dir; en.forEach((e) => { e.y += 12; }); }
    if (Math.random() < 0.02 * dt * (1 + wave * 0.3) && en.length) { const e = en[rand(en.length)]; bombs.push({ x: e.x, y: e.y + 10 }); }
    bombs.forEach((b) => { b.y += (3 + wave * 0.3) * dt; });
    shots.forEach((s) => {
      const i = en.findIndex((e) => Math.abs(e.x - s.x) < 13 && Math.abs(e.y - s.y) < 12);
      if (i >= 0) { en.splice(i, 1); s.y = -99; score += 10; }
    });
    bombs = bombs.filter((b) => {
      if (b.y > H - 40 && Math.abs(b.x - px) < 16) { lives--; hurt = 20; return false; }
      return b.y < H + 10;
    });
    hurt = Math.max(0, hurt - dt);
    if (en.some((e) => e.y > H - 60)) lives = 0;
    if (lives <= 0) { over = true; hi("nb_inv", score); }
    else if (!en.length) { wave++; wave1(); }
  }
  function draw() {
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W, H);
    cx.font = "22px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle";
    en.forEach((e) => cx.fillText(["👾", "👽", "🛸", "👾"][e.r], e.x, e.y));
    cx.fillStyle = "#f0c24b"; shots.forEach((s) => cx.fillRect(s.x - 1.5, s.y - 6, 3, 10));
    cx.fillStyle = "#e5484d"; bombs.forEach((b) => cx.fillRect(b.x - 2, b.y - 5, 4, 10));
    cx.globalAlpha = hurt > 0 && Math.floor(hurt / 3) % 2 ? 0.3 : 1;
    cx.font = "28px sans-serif"; cx.fillText("🚀", px, H - 28);
    cx.globalAlpha = 1;
    info.textContent = "Skor: " + score + "   Dalga: " + wave + "   Can: " + "❤️".repeat(Math.max(0, lives)) + "   En iyi: " + best("nb_inv");
    if (over) banner(cx, W, H, "Oyun bitti! " + score + " puan", "Yeniden başla'ya bas");
  }
  const mv = (e) => { tx = clamp(pos(cv, e).x, 16, W - 16); };
  cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); mv(e); };
  cv.onpointermove = (e) => { if (e.buttons || e.pointerType === "touch") mv(e); };
  const key = (e) => { if (e.key === "ArrowLeft") tx = clamp(tx - 30, 16, W - 16); if (e.key === "ArrowRight") tx = clamp(tx + 30, 16, W - 16); };
  document.addEventListener("keydown", key);
  row.appendChild(act("Yeniden başla", start));
  const hint = el("p", "", "Gemiyi parmağınla sürükle. Otomatik ateş eder.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  return () => { off(); document.removeEventListener("keydown", key); };
}

/* ---------- Asteroid Avı ---------- */
function asteroids(body, el, act) {
  const W = 300, H = 300, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  let rocks, hp, score, over, spawn, off, boom, t;
  function start() {
    if (off) off();
    rocks = []; hp = 5; score = 0; over = false; spawn = 0; boom = []; t = 0;
    off = raf((dt) => {
      if (!over) {
        t += dt; spawn -= dt;
        if (spawn <= 0) {
          const a = Math.random() * 6.283, big = Math.random() < 0.3, sp = 0.5 + Math.min(1.3, t / 2400);
          rocks.push({ x: W / 2 + Math.cos(a) * 200, y: H / 2 + Math.sin(a) * 200, vx: 0, vy: 0, r: big ? 24 : 15, hp: big ? 2 : 1, sp: sp * (big ? 0.7 : 1) });
          spawn = Math.max(18, 60 - t / 40);
        }
        rocks.forEach((r) => { const d = Math.hypot(W / 2 - r.x, H / 2 - r.y) || 1; r.x += (W / 2 - r.x) / d * r.sp * dt; r.y += (H / 2 - r.y) / d * r.sp * dt; });
        rocks = rocks.filter((r) => { if (Math.hypot(W / 2 - r.x, H / 2 - r.y) < 26) { hp--; boom.push({ x: r.x, y: r.y, l: 12 }); return false; } return true; });
        if (hp <= 0) { over = true; hi("nb_ast", score); }
      }
      boom.forEach((b) => { b.l -= dt; });
      boom = boom.filter((b) => b.l > 0);
      draw();
    });
  }
  function draw() {
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W, H);
    cx.font = "44px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle";
    cx.fillText("🌍", W / 2, H / 2);
    rocks.forEach((r) => { cx.font = Math.round(r.r * 1.7) + "px sans-serif"; cx.fillText("☄️", r.x, r.y); });
    boom.forEach((b) => { cx.font = "26px sans-serif"; cx.fillText("💥", b.x, b.y); });
    info.textContent = "Skor: " + score + "   Gezegen: " + "🟢".repeat(Math.max(0, hp)) + "   En iyi: " + best("nb_ast");
    if (over) banner(cx, W, H, "Gezegen düştü! " + score + " puan", "Yeniden başla'ya bas");
  }
  cv.onpointerdown = (e) => {
    if (over) return;
    const p = pos(cv, e);
    for (let i = rocks.length - 1; i >= 0; i--) {
      const r = rocks[i];
      if (Math.hypot(r.x - p.x, r.y - p.y) < r.r + 12) {
        r.hp--;
        boom.push({ x: r.x, y: r.y, l: 8 });
        if (r.hp <= 0) { rocks.splice(i, 1); score += 10; } else { r.r = 17; score += 2; }
        return;
      }
    }
  };
  row.appendChild(act("Yeniden başla", start));
  const hint = el("p", "", "Gezegene yaklaşan asteroitlere dokun. Büyükler 2 dokunuş ister.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  return () => off();
}

/* ---------- Meyve Kes ---------- */
function fruit(body, el, act) {
  const W = 300, H = 360, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  const F = ["🍉", "🍎", "🍊", "🍋", "🍇", "🍓"];
  let it, score, lives, over, spawn, off, trail, cut, t;
  function start() {
    if (off) off();
    it = []; score = 0; lives = 3; over = false; spawn = 0; trail = []; cut = []; t = 0;
    off = raf((dt) => {
      if (!over) {
        t += dt; spawn -= dt;
        if (spawn <= 0) {
          const n = 1 + rand(1 + Math.min(2, Math.floor(t / 1500)));
          for (let k = 0; k < n; k++) it.push({ x: 40 + rand(W - 80), y: H + 20, vx: (Math.random() - 0.5) * 3, vy: -(11 + Math.random() * 3), bomb: Math.random() < 0.14, e: F[rand(F.length)] });
          spawn = Math.max(35, 75 - t / 50);
        }
        it.forEach((o) => { o.x += o.vx * dt; o.y += o.vy * dt; o.vy += 0.22 * dt; });
        it = it.filter((o) => {
          if (o.y > H + 30 && o.vy > 0) { if (!o.bomb) { lives--; } return false; }
          return true;
        });
        if (lives <= 0) { over = true; hi("nb_fruit", score); }
      }
      cut.forEach((c) => { c.l -= dt; });
      cut = cut.filter((c) => c.l > 0);
      trail.forEach((p) => { p.l -= dt; });
      trail = trail.filter((p) => p.l > 0);
      draw();
    });
  }
  function slice(p) {
    if (over) return;
    for (let i = it.length - 1; i >= 0; i--) {
      const o = it[i];
      if (Math.hypot(o.x - p.x, o.y - p.y) < 26) {
        it.splice(i, 1);
        if (o.bomb) { lives = 0; over = true; hi("nb_fruit", score); cut.push({ x: o.x, y: o.y, e: "💥", l: 20 }); }
        else { score++; cut.push({ x: o.x, y: o.y, e: "✨", l: 12 }); }
      }
    }
  }
  function draw() {
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W, H);
    cx.font = "36px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle";
    it.forEach((o) => cx.fillText(o.bomb ? "💣" : o.e, o.x, o.y));
    cut.forEach((c) => cx.fillText(c.e, c.x, c.y));
    cx.strokeStyle = "#fff"; cx.lineWidth = 3; cx.lineCap = "round";
    for (let i = 1; i < trail.length; i++) { cx.globalAlpha = Math.max(0, trail[i].l / 10); cx.beginPath(); cx.moveTo(trail[i - 1].x, trail[i - 1].y); cx.lineTo(trail[i].x, trail[i].y); cx.stroke(); }
    cx.globalAlpha = 1;
    info.textContent = "Kesilen: " + score + "   Can: " + "❤️".repeat(Math.max(0, lives)) + "   En iyi: " + best("nb_fruit");
    if (over) banner(cx, W, H, "Bitti! " + score + " meyve", "Yeniden başla'ya bas");
  }
  cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); const p = pos(cv, e); trail.push({ x: p.x, y: p.y, l: 10 }); slice(p); };
  cv.onpointermove = (e) => {
    if (!(e.buttons || e.pointerType === "touch")) return;
    const p = pos(cv, e), q = trail[trail.length - 1];
    trail.push({ x: p.x, y: p.y, l: 10 });
    if (q) { const n = Math.ceil(Math.hypot(p.x - q.x, p.y - q.y) / 12); for (let k = 1; k <= n; k++) slice({ x: q.x + (p.x - q.x) * k / n, y: q.y + (p.y - q.y) * k / n }); }
  };
  row.appendChild(act("Yeniden başla", start));
  const hint = el("p", "", "Meyvelerin üstünden parmağını kaydır. 💣'e dokunma! Düşen meyve can götürür.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  return () => off();
}

export const SOLO = {
  inv: { group: "Aksiyon", icon: "👾", label: "Uzaylı İstilası", start: invaders },
  ast: { group: "Aksiyon", icon: "☄️", label: "Asteroid Avı", start: asteroids },
  fruit: { group: "Aksiyon", icon: "🍉", label: "Meyve Kes", start: fruit }
};
