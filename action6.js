// Aksiyon oyunları 6: Araba Yarışı, Bisiklet
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

/* ---------- Araba Yarışı ---------- */
function car(body, el, act) {
  const W = 260, H = 400, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  const RL = 30, RR = W - 30, CW = 28, CH = 48;
  let me, foes, coins, score, dist, speed, over, off, dash, target, tl, tr;
  const COLS = ["#4a8fd9", "#3fb06a", "#9b5bd9", "#e5884d", "#2aa5a5"];
  function start() {
    if (off) off();
    me = { x: W / 2, y: H - 80 };
    foes = []; coins = []; score = 0; dist = 0; speed = 3; over = false; dash = 0; target = null; tl = false; tr = false;
    let spawn = 0;
    off = raf((dt) => {
      if (!over) {
        speed = Math.min(9, 3 + dist / 900);
        dist += speed * dt; score = Math.floor(dist / 10); dash = (dash + speed * dt) % 40;
        let dx = 0;
        if (tl) dx -= 1; if (tr) dx += 1;
        if (target !== null) { const d = target - me.x; dx = Math.abs(d) < 4 ? 0 : d > 0 ? 1 : -1; }
        me.x = Math.max(RL + CW / 2 + 2, Math.min(RR - CW / 2 - 2, me.x + dx * 4.2 * dt));
        spawn -= speed * dt;
        if (spawn <= 0) {
          spawn = 110 + rand(90) - speed * 4;
          const x = RL + CW / 2 + 4 + rand(RR - RL - CW - 8);
          foes.push({ x: x, y: -CH, v: 0.45 + Math.random() * 0.35, c: COLS[rand(COLS.length)] });
          if (Math.random() < 0.5) coins.push({ x: RL + 14 + rand(RR - RL - 28), y: -60 - rand(60) });
        }
        foes.forEach((f) => { f.y += speed * f.v * 1.6 * dt + speed * 0.5 * dt; });
        coins.forEach((c) => { c.y += speed * dt; });
        foes = foes.filter((f) => f.y < H + 60);
        coins = coins.filter((c) => c.y < H + 20);
        coins = coins.filter((c) => {
          if (Math.abs(c.x - me.x) < CW / 2 + 8 && Math.abs(c.y - me.y) < CH / 2 + 8) { dist += 150; return false; }
          return true;
        });
        for (const f of foes) {
          if (Math.abs(f.x - me.x) < CW - 3 && Math.abs(f.y - me.y) < CH - 4) { over = true; hi("nb_car", score); break; }
        }
      }
      draw();
    });
  }
  function carShape(x, y, col) {
    cx.fillStyle = col; cx.fillRect(x - CW / 2, y - CH / 2, CW, CH);
    cx.fillStyle = "rgba(255,255,255,.55)"; cx.fillRect(x - CW / 2 + 4, y - CH / 2 + 10, CW - 8, 12);
    cx.fillStyle = "#111"; cx.fillRect(x - CW / 2 - 3, y - CH / 2 + 6, 4, 12); cx.fillRect(x + CW / 2 - 1, y - CH / 2 + 6, 4, 12);
    cx.fillRect(x - CW / 2 - 3, y + CH / 2 - 18, 4, 12); cx.fillRect(x + CW / 2 - 1, y + CH / 2 - 18, 4, 12);
  }
  function draw() {
    cx.fillStyle = "#1c3b24"; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#2b2f38"; cx.fillRect(RL, 0, RR - RL, H);
    cx.fillStyle = "#e5e9ef"; cx.fillRect(RL - 3, 0, 3, H); cx.fillRect(RR, 0, 3, H);
    cx.fillStyle = "#f0c24b";
    for (let y = -40 + dash; y < H; y += 40) cx.fillRect(W / 2 - 2, y, 4, 22);
    coins.forEach((c) => { cx.fillStyle = "#f0c24b"; cx.beginPath(); cx.arc(c.x, c.y, 8, 0, 7); cx.fill(); cx.fillStyle = "#b8860b"; cx.fillRect(c.x - 1.5, c.y - 4, 3, 8); });
    foes.forEach((f) => carShape(f.x, f.y, f.c));
    carShape(me.x, me.y, "#e5484d");
    info.textContent = "Mesafe: " + score + " m   En iyi: " + best("nb_car") + "   Hız: " + Math.round(speed * 20) + " km/s";
    if (over) banner(cx, W, H, "Çarptın! " + score + " m", "Yeniden başla'ya bas");
  }
  cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); target = pos(cv, e).x; };
  cv.onpointermove = (e) => { if (target !== null) target = pos(cv, e).x; };
  cv.onpointerup = () => { target = null; };
  cv.onpointercancel = cv.onpointerup;
  const L = act("◀ Sol", () => {}), R = act("Sağ ▶", () => {});
  [[L, "l"], [R, "r"]].forEach((x) => {
    const b = x[0];
    b.style.touchAction = "none";
    b.onpointerdown = (e) => { e.preventDefault(); if (x[1] === "l") tl = true; else tr = true; };
    const up = () => { if (x[1] === "l") tl = false; else tr = false; };
    b.onpointerup = up; b.onpointerleave = up; b.onpointercancel = up;
    row.appendChild(b);
  });
  row.appendChild(act("Yeniden başla", start));
  const hint = el("p", "", "Ekrana parmağınla dokunup sürükle ya da Sol/Sağ tuşlarına bas. Arabalara çarpma, sarı paraları topla (bonus mesafe).");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  return () => { off(); };
}

/* ---------- Bisiklet ---------- */
function bike(body, el, act) {
  const W = 320, H = 300, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  const BX = 80;
  let wx, speed, y, vy, air, obs, score, coins, over, off, nextObs, wheel;
  const ground = (x) => 215 + Math.sin(x / 90) * 14 + Math.sin(x / 37) * 4;
  function start() {
    if (off) off();
    wx = 0; speed = 3.2; y = ground(BX); vy = 0; air = false; obs = []; coins = []; score = 0; over = false; nextObs = 350; wheel = 0;
    off = raf((dt) => {
      if (!over) {
        speed = Math.min(8, 3.2 + wx / 1800);
        wx += speed * dt; wheel += speed * 0.12 * dt;
        score = Math.floor(wx / 10);
        while (nextObs < wx + W + 100) {
          const t = Math.random();
          if (t < 0.55) obs.push({ k: "rock", x: nextObs, w: 22 + rand(10), h: 18 + rand(14) });
          else if (t < 0.8) obs.push({ k: "gap", x: nextObs, w: 50 + rand(30) });
          else obs.push({ k: "log", x: nextObs, w: 50, h: 12 });
          if (Math.random() < 0.6) coins.push({ x: nextObs + 10, y: 130 + rand(50) });
          nextObs += 220 + rand(180) - speed * 6;
        }
        const wxB = wx + BX, g = ground(wxB);
        const inGap = obs.some((o) => o.k === "gap" && wxB > o.x + 6 && wxB < o.x + o.w - 6);
        if (air || inGap) {
          vy += 0.55 * dt; y += vy * dt; air = true;
          if (!inGap && y >= g) { y = g; vy = 0; air = false; }
          if (inGap && y > H + 20) { over = true; hi("nb_bike", score); }
        } else y = g;
        for (const o of obs) {
          if (o.k === "gap") continue;
          if (wxB + 10 > o.x && wxB - 10 < o.x + o.w && y > ground(o.x + o.w / 2) - o.h + 2) { over = true; hi("nb_bike", score); }
        }
        coins = coins.filter((c) => {
          if (Math.abs(c.x - wxB) < 18 && Math.abs(c.y - (y - 18)) < 24) { wx += 40; return false; }
          return c.x > wx - 40;
        });
        obs = obs.filter((o) => o.x + o.w > wx - 50);
      }
      draw();
    });
  }
  function draw() {
    cx.fillStyle = "#16324f"; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#1f4a72";
    for (let i = 0; i < 4; i++) { const x = ((i * 130 - wx * 0.2) % 520 + 520) % 520 - 100; cx.beginPath(); cx.moveTo(x, 200); cx.lineTo(x + 70, 110); cx.lineTo(x + 150, 200); cx.fill(); }
    const gaps = obs.filter((o) => o.k === "gap");
    cx.fillStyle = "#3b6b2e";
    cx.beginPath(); cx.moveTo(0, H);
    for (let sx = 0; sx <= W; sx += 4) {
      const x = wx + sx, gp = gaps.some((o) => x > o.x && x < o.x + o.w);
      cx.lineTo(sx, gp ? H + 10 : ground(x));
    }
    cx.lineTo(W, H); cx.fill();
    cx.fillStyle = "#6b4a2b";
    for (let sx = 0; sx <= W; sx += 4) {
      const x = wx + sx, gp = gaps.some((o) => x > o.x && x < o.x + o.w);
      if (!gp) cx.fillRect(sx, ground(x) + 8, 4, H);
    }
    obs.forEach((o) => {
      const sx = o.x - wx;
      if (o.k === "rock") { cx.fillStyle = "#8d96a3"; cx.beginPath(); cx.moveTo(sx, ground(o.x + o.w / 2) + 2); cx.lineTo(sx + o.w / 2, ground(o.x + o.w / 2) - o.h); cx.lineTo(sx + o.w, ground(o.x + o.w / 2) + 2); cx.fill(); }
      else if (o.k === "log") { cx.fillStyle = "#8a5a2b"; cx.fillRect(sx, ground(o.x + 25) - o.h, o.w, o.h); cx.fillStyle = "#c28a4a"; cx.fillRect(sx, ground(o.x + 25) - o.h, 4, o.h); }
    });
    coins.forEach((c) => { cx.fillStyle = "#f0c24b"; cx.beginPath(); cx.arc(c.x - wx, c.y, 7, 0, 7); cx.fill(); });
    // bisiklet
    const by = y, tilt = Math.max(-0.5, Math.min(0.5, air ? vy * 0.04 : (ground(wx + BX + 8) - ground(wx + BX - 8)) / 16));
    cx.save(); cx.translate(BX, by); cx.rotate(tilt);
    cx.strokeStyle = "#e5e9ef"; cx.lineWidth = 3;
    [[-16, -10], [16, -10]].forEach((p) => { cx.beginPath(); cx.arc(p[0], p[1], 10, 0, 7); cx.stroke(); for (let k = 0; k < 4; k++) { const a = wheel + k * Math.PI / 2; cx.beginPath(); cx.moveTo(p[0], p[1]); cx.lineTo(p[0] + Math.cos(a) * 10, p[1] + Math.sin(a) * 10); cx.lineWidth = 1; cx.stroke(); cx.lineWidth = 3; } });
    cx.strokeStyle = "#e5484d"; cx.beginPath(); cx.moveTo(-16, -10); cx.lineTo(-4, -24); cx.lineTo(10, -24); cx.lineTo(16, -10); cx.moveTo(-4, -24); cx.lineTo(0, -10); cx.lineTo(-16, -10); cx.moveTo(10, -24); cx.lineTo(8, -32); cx.stroke();
    cx.fillStyle = "#f0c24b"; cx.beginPath(); cx.arc(-2, -42, 6, 0, 7); cx.fill();
    cx.strokeStyle = "#4a8fd9"; cx.beginPath(); cx.moveTo(-2, -36); cx.lineTo(-4, -26); cx.moveTo(-2, -34); cx.lineTo(8, -32); cx.stroke();
    cx.restore();
    info.textContent = "Mesafe: " + score + " m   En iyi: " + best("nb_bike") + (air ? "   🚴 havada!" : "");
    if (over) banner(cx, W, H, "Düştün! " + score + " m", "Yeniden başla'ya bas");
  }
  function jump() { if (!over && !air) { vy = -9.5; air = true; } }
  cv.onpointerdown = (e) => { e.preventDefault(); jump(); };
  row.appendChild(act("⬆ Zıpla", jump));
  row.appendChild(act("Yeniden başla", start));
  const hint = el("p", "", "Ekrana dokun ya da Zıpla'ya bas: taşların, kütüklerin ve çukurların üstünden atla. Sarı paralar seni hızlandırır.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  return () => { off(); };
}

export const SOLO = {
  car: { group: "Aksiyon", icon: "🏎️", label: "Araba Yarışı", start: car },
  bike: { group: "Aksiyon", icon: "🚴", label: "Bisiklet", start: bike }
};
