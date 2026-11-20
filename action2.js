// Aksiyon oyunları 2: Nişan Al, Yarış, Karşıdan Geç
const rand = (n) => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function hi(k, v) { const o = best(k); if (v > o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }
function lo(k, v) { const o = best(k); if (!o || v < o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }
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
function dpad(body, el, fn) {
  const g = el("div", "");
  g.style.cssText = "display:grid;grid-template-columns:repeat(3,64px);gap:6px;justify-content:center;margin:10px 0";
  [["", 0, 0], ["▲", 0, -1], ["", 0, 0], ["◀", -1, 0], ["▼", 0, 1], ["▶", 1, 0]].forEach((x) => {
    const b = el("button", "", x[0]);
    b.type = "button";
    b.style.cssText = "height:52px;font-size:22px" + (x[0] ? "" : ";visibility:hidden");
    b.onclick = () => fn(x[1], x[2]);
    g.appendChild(b);
  });
  body.appendChild(g);
}

/* ---------- Nişan Al ---------- */
function aim(body, el, act) {
  const W = 300, H = 300, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  let ts, score, miss, left, over, nextT, off;
  function start() {
    if (off) off();
    ts = []; score = 0; miss = 0; left = 30; over = false; nextT = 0;
    off = raf((dt) => {
      if (over) return;
      left -= dt / 60;
      nextT -= dt;
      if (nextT <= 0) { ts.push({ x: 30 + rand(W - 60), y: 30 + rand(H - 60), r: 28, life: 70 }); nextT = 28 + rand(20); }
      ts.forEach((t) => { t.life -= dt; t.r = 8 + 20 * Math.max(0, t.life / 70); });
      ts = ts.filter((t) => { if (t.life <= 0) { miss++; return false; } return true; });
      if (left <= 0) { over = true; hi("nb_aim", score); }
      draw();
    });
  }
  function draw() {
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W, H);
    ts.forEach((t) => {
      cx.fillStyle = "#e5484d"; cx.beginPath(); cx.arc(t.x, t.y, t.r, 0, 7); cx.fill();
      cx.fillStyle = "#fff"; cx.beginPath(); cx.arc(t.x, t.y, t.r * 0.55, 0, 7); cx.fill();
      cx.fillStyle = "#e5484d"; cx.beginPath(); cx.arc(t.x, t.y, t.r * 0.25, 0, 7); cx.fill();
    });
    info.textContent = "Vurulan: " + score + "   Kaçan: " + miss + "   Süre: " + Math.max(0, Math.ceil(left)) + "   En iyi: " + best("nb_aim");
    if (over) banner(cx, W, H, "Süre bitti! " + score + " hedef", "Yeniden başla'ya bas");
  }
  cv.onpointerdown = (e) => {
    if (over) return;
    const p = pos(cv, e);
    for (let i = ts.length - 1; i >= 0; i--) if (Math.hypot(ts[i].x - p.x, ts[i].y - p.y) <= ts[i].r + 6) { ts.splice(i, 1); score++; return; }
  };
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => off();
}

/* ---------- Yarış ---------- */
function race(body, el, act) {
  const W = 240, H = 360, L = 80, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  let lane, obs, dist, speed, over, off, tick;
  function start() {
    if (off) off();
    lane = 1; obs = []; dist = 0; speed = 3; over = false; tick = 0;
    off = raf((dt) => {
      if (over) { draw(); return; }
      dist += speed * dt / 10; speed = Math.min(9, 3 + dist / 60);
      tick -= speed * dt;
      if (tick <= 0) { obs.push({ l: rand(3), y: -50 }); if (Math.random() < 0.35) obs.push({ l: rand(3), y: -140 }); tick = 150; }
      obs.forEach((o) => { o.y += speed * dt; });
      obs = obs.filter((o) => o.y < H + 40);
      if (obs.some((o) => o.l === lane && o.y > H - 130 && o.y < H - 40)) { over = true; hi("nb_race", Math.floor(dist)); }
      draw();
    });
  }
  function draw() {
    cx.fillStyle = "#1c2b3f"; cx.fillRect(0, 0, W, H);
    cx.strokeStyle = "#8da0b6"; cx.lineWidth = 2; cx.setLineDash([16, 16]); cx.lineDashOffset = -dist * 10 % 32;
    [L, 2 * L].forEach((x) => { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); });
    cx.setLineDash([]);
    cx.font = "44px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle";
    obs.forEach((o) => cx.fillText("🚙", o.l * L + L / 2, o.y));
    cx.fillText("🏎️", lane * L + L / 2, H - 80);
    info.textContent = "Mesafe: " + Math.floor(dist) + " m   En iyi: " + best("nb_race") + (over ? "   Çarptın! 💥" : "");
    if (over) banner(cx, W, H, "Kaza! " + Math.floor(dist) + " m", "Yeniden başla'ya bas");
  }
  const go = (d) => { if (!over) lane = clamp(lane + d, 0, 2); };
  cv.onpointerdown = (e) => { const p = pos(cv, e); go(p.x < W / 2 ? -1 : 1); };
  const key = (e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); };
  document.addEventListener("keydown", key);
  row.appendChild(act("◀ Sol", () => go(-1)));
  row.appendChild(act("Sağ ▶", () => go(1)));
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => { off(); document.removeEventListener("keydown", key); };
}

/* ---------- Karşıdan Geç ---------- */
function cross(body, el, act) {
  const N = 9, U = 33, W = N * U, { cv, cx, info } = arena(body, el, W, W);
  const row = rowOf(body, el);
  let fx, fy, lives, score, cars, over, off;
  function reset() { fx = 4; fy = N - 1; }
  function start() {
    if (off) off();
    cars = [];
    for (let r = 1; r <= 7; r++) {
      const dir = r % 2 ? 1 : -1, sp = 0.5 + (r % 3) * 0.35, n = 2 + (r % 2);
      for (let k = 0; k < n; k++) cars.push({ r: r, x: k * (W / n) + rand(40), d: dir, s: sp, w: 40 + (r % 2) * 20 });
    }
    lives = 3; score = 0; over = false; reset();
    off = raf((dt) => {
      if (!over) {
        cars.forEach((c) => { c.x += c.d * c.s * dt * (1 + score * 0.08); if (c.x > W + 60) c.x = -60; if (c.x < -60) c.x = W + 60; });
        hit();
      }
      draw();
    });
  }
  function hit() {
    const X = fx * U, Y = fy;
    if (cars.some((c) => c.r === Y && X + 6 < c.x + c.w / 2 && X + U - 6 > c.x - c.w / 2)) {
      lives--; reset();
      if (lives <= 0) { over = true; hi("nb_cross", score); }
    }
  }
  function draw() {
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W, W);
    for (let r = 1; r <= 7; r++) { cx.fillStyle = "#1c2b3f"; cx.fillRect(0, r * U, W, U); }
    cx.fillStyle = "rgba(63,176,106,.35)"; cx.fillRect(0, 0, W, U); cx.fillRect(0, (N - 1) * U, W, U);
    cx.font = "26px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle";
    cars.forEach((c) => cx.fillText(c.d > 0 ? "🚗" : "🚕", c.x, c.r * U + U / 2 + 2));
    cx.fillText("🐸", fx * U + U / 2, fy * U + U / 2 + 2);
    info.textContent = "Geçiş: " + score + "   Can: " + "❤️".repeat(Math.max(0, lives)) + "   En iyi: " + best("nb_cross");
    if (over) banner(cx, W, W, "Oyun bitti! " + score + " geçiş", "Yeniden başla'ya bas");
  }
  function move(dx, dy) {
    if (over) return;
    fx = clamp(fx + dx, 0, N - 1); fy = clamp(fy + dy, 0, N - 1);
    if (fy === 0) { score++; reset(); }
    hit();
  }
  dpad(body, el, move);
  const key = (e) => {
    const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (m) { e.preventDefault(); move(m[0], m[1]); }
  };
  document.addEventListener("keydown", key);
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => { off(); document.removeEventListener("keydown", key); };
}

export const SOLO = {
  aim: { group: "Aksiyon", icon: "🎯", label: "Nişan Al", start: aim },
  race: { group: "Aksiyon", icon: "🏎️", label: "Yarış", start: race },
  cross: { group: "Aksiyon", icon: "🐸", label: "Karşıdan Geç", start: cross }
};
