// Aksiyon oyunları 7: Zıplayan Kuş, Koşucu, Ağaç Kes
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


/* ---------- Zıplayan Kuş ---------- */
function bird(body, el, act) {
  const W = 280, H = 400, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  let by, vy, pipes, score, over, off, started, dist, px;
  const GAP = 125, SP = 2.3;
  function start() {
    if (off) off();
    by = H / 2; vy = 0; pipes = []; score = 0; over = false; started = false; dist = 150; px = 0;
    off = raf((dt) => {
      if (started && !over) {
        vy += 0.34 * dt; by += vy * dt;
        px += SP * dt;
        dist -= SP * dt;
        if (dist <= 0) { pipes.push({ x: W + 20, top: 60 + rand(H - 120 - GAP - 60), ok: false }); dist = 160; }
        pipes.forEach((p) => { p.x -= SP * dt; if (!p.ok && p.x + 26 < 60) { p.ok = true; score++; } });
        pipes = pipes.filter((p) => p.x > -60);
        if (by > H - 20 || by < 8) { over = true; hi("nb_bird", score); }
        for (const p of pipes) {
          if (60 + 12 > p.x && 60 - 12 < p.x + 52 && (by - 12 < p.top || by + 12 > p.top + GAP)) { over = true; hi("nb_bird", score); }
        }
      }
      draw();
    });
  }
  function draw() {
    cx.fillStyle = "#4aa3d9"; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#d8f0ff";
    for (let i = 0; i < 3; i++) { const x = ((i * 110 - px * 0.3) % 360 + 360) % 360 - 40; cx.beginPath(); cx.arc(x, 70 + i * 40, 20, 0, 7); cx.arc(x + 22, 76 + i * 40, 16, 0, 7); cx.fill(); }
    pipes.forEach((p) => {
      cx.fillStyle = "#3fb06a"; cx.fillRect(p.x, 0, 52, p.top); cx.fillRect(p.x, p.top + GAP, 52, H);
      cx.fillStyle = "#2c8a50"; cx.fillRect(p.x - 4, p.top - 16, 60, 16); cx.fillRect(p.x - 4, p.top + GAP, 60, 16);
    });
    cx.fillStyle = "#8a5a2b"; cx.fillRect(0, H - 8, W, 8);
    cx.save(); cx.translate(60, by); cx.rotate(Math.max(-0.5, Math.min(1, vy * 0.08)));
    cx.fillStyle = "#f0c24b"; cx.beginPath(); cx.arc(0, 0, 12, 0, 7); cx.fill();
    cx.fillStyle = "#fff"; cx.beginPath(); cx.arc(5, -4, 4, 0, 7); cx.fill();
    cx.fillStyle = "#111"; cx.beginPath(); cx.arc(6, -4, 2, 0, 7); cx.fill();
    cx.fillStyle = "#e5884d"; cx.beginPath(); cx.moveTo(10, 0); cx.lineTo(19, 3); cx.lineTo(10, 6); cx.fill();
    cx.restore();
    cx.fillStyle = "#fff"; cx.font = "700 34px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "alphabetic";
    cx.fillText(String(score), W / 2, 50);
    info.textContent = "Skor: " + score + "   En iyi: " + best("nb_bird");
    if (!started && !over) banner(cx, W, H, "Hazır mısın?", "Dokununca başlar, her dokunuş zıplatır");
    if (over) banner(cx, W, H, "Bitti! " + score + " boru", "Yeniden başla'ya bas");
  }
  function flap() { if (over) return; started = true; vy = -5.6; }
  cv.onpointerdown = (e) => { e.preventDefault(); flap(); };
  row.appendChild(act("⬆ Zıpla", flap));
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => { off(); };
}

/* ---------- Koşucu ---------- */
function runner(body, el, act) {
  const W = 320, H = 220, GY = 175, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  let py, vy, duck, obs, score, over, off, next, speed, dist, t;
  function start() {
    if (off) off();
    py = GY; vy = 0; duck = false; obs = []; score = 0; over = false; next = 300; speed = 4; dist = 0; t = 0;
    off = raf((dt) => {
      if (!over) {
        speed = Math.min(10, 4 + dist / 1500);
        dist += speed * dt; t += dt; score = Math.floor(dist / 10);
        if (py < GY || vy < 0) { vy += 0.62 * dt; py += vy * dt; if (py >= GY) { py = GY; vy = 0; } }
        next -= speed * dt;
        if (next <= 0) {
          if (score > 40 && Math.random() < 0.35) obs.push({ k: "bird", x: W + 20, w: 28, y: GY - 34, h: 12 });
          else obs.push({ k: "cac", x: W + 20, w: 14 + rand(10), y: 0, h: 24 + rand(18) });
          next = 170 + rand(150) + speed * 8;
        }
        obs.forEach((o) => { o.x -= speed * dt; });
        obs = obs.filter((o) => o.x > -50);
        const ph = duck && py >= GY ? 18 : 36, pt = py - ph;
        for (const o of obs) {
          const ot = o.k === "bird" ? o.y : GY - o.h, ob = o.k === "bird" ? o.y + o.h : GY;
          if (50 + 9 > o.x && 50 - 9 < o.x + o.w && py > ot + 2 && pt < ob - 2) { over = true; hi("nb_run", score); }
        }
      }
      draw();
    });
  }
  function draw() {
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#16324f"; cx.fillRect(0, 0, W, GY);
    cx.fillStyle = "#c9a35b"; cx.fillRect(0, GY, W, H - GY);
    cx.fillStyle = "#a98445";
    for (let i = 0; i < 12; i++) cx.fillRect(((i * 40 - dist) % 480 + 480) % 480 - 40, GY + 10 + (i % 3) * 12, 14, 3);
    obs.forEach((o) => {
      if (o.k === "bird") { cx.fillStyle = "#e5484d"; cx.fillRect(o.x, o.y, o.w, o.h); cx.fillStyle = "#f0c24b"; cx.fillRect(o.x + (Math.floor(t / 6) % 2 ? 4 : 14), o.y - 8, 10, 8); }
      else { cx.fillStyle = "#3fb06a"; cx.fillRect(o.x, GY - o.h, o.w, o.h); cx.fillRect(o.x - 6, GY - o.h + 8, 6, 5); cx.fillRect(o.x + o.w, GY - o.h + 14, 6, 5); }
    });
    const ph = duck && py >= GY ? 18 : 36;
    cx.fillStyle = "#f0c24b"; cx.fillRect(41, py - ph, 18, ph);
    cx.fillStyle = "#111"; cx.fillRect(52, py - ph + 4, 4, 4);
    if (py >= GY) { cx.fillStyle = "#4a8fd9"; const f = Math.floor(t / 5) % 2; cx.fillRect(f ? 43 : 49, py - 4, 7, 4); }
    info.textContent = "Mesafe: " + score + " m   En iyi: " + best("nb_run");
    if (over) banner(cx, W, H, "Çarptın! " + score + " m", "Yeniden başla'ya bas");
  }
  function jump() { if (!over && py >= GY) { vy = -10.8; py -= 1; } }
  cv.onpointerdown = (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const p = pos(cv, e); if (p.x < W / 2) jump(); else duck = true; };
  cv.onpointerup = () => { duck = false; };
  cv.onpointercancel = cv.onpointerup;
  const j = act("⬆ Zıpla", () => {});
  j.onpointerdown = (e) => { e.preventDefault(); jump(); };
  const d = act("⬇ Eğil (basılı tut)", () => {});
  d.style.touchAction = "none";
  d.onpointerdown = (e) => { e.preventDefault(); duck = true; };
  d.onpointerup = () => { duck = false; }; d.onpointerleave = d.onpointerup; d.onpointercancel = d.onpointerup;
  row.appendChild(j); row.appendChild(d);
  row.appendChild(act("Yeniden başla", start));
  const hint = el("p", "", "Ekranın sol yarısı = zıpla, sağ yarısı (basılı tut) = eğil. Kaktüslerin üstünden atla, kuşların altından eğilerek geç.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  return () => { off(); };
}

/* ---------- Ağaç Kes ---------- */
function timber(body, el, act) {
  const W = 240, H = 360, SEG = 44, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  let segs, side, score, time, over, off, started, anim;
  const newSeg = (prev) => ({ b: prev !== 0 && Math.random() < 0.6 ? 0 : [-1, 0, 1][rand(3)] });
  function start() {
    if (off) off();
    segs = [{ b: 0 }, { b: 0 }];
    while (segs.length < 8) segs.push(newSeg(segs[segs.length - 1].b));
    side = -1; score = 0; time = 100; over = false; started = false; anim = 0;
    off = raf((dt) => {
      if (started && !over) {
        time -= 0.28 * dt * (1 + score / 70);
        if (time <= 0) { time = 0; over = true; hi("nb_timber", score); }
      }
      anim = Math.max(0, anim - dt);
      draw();
    });
  }
  function chop(s) {
    if (over) return;
    started = true; side = s; anim = 6;
    segs.shift(); segs.push(newSeg(segs[segs.length - 1].b));
    score++; time = Math.min(100, time + 3.5);
    if (segs[0].b === side) { over = true; hi("nb_timber", score - 1 < 0 ? 0 : score); }
  }
  function draw() {
    cx.fillStyle = "#16324f"; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#3b6b2e"; cx.fillRect(0, H - 40, W, 40);
    const cxm = W / 2;
    segs.forEach((s, i) => {
      const y = H - 40 - (i + 1) * SEG;
      cx.fillStyle = "#8a5a2b"; cx.fillRect(cxm - 24, y, 48, SEG - 2);
      cx.fillStyle = "#a8743c"; cx.fillRect(cxm - 24, y + 10, 48, 3);
      if (s.b) { cx.fillStyle = "#2c8a50"; cx.fillRect(s.b < 0 ? cxm - 24 - 56 : cxm + 24, y + 8, 56, 22); }
    });
    const px = side < 0 ? cxm - 24 - 30 : cxm + 24 + 30, py = H - 40;
    cx.fillStyle = "#e5484d"; cx.fillRect(px - 12, py - 36, 24, 36);
    cx.fillStyle = "#f0c24b"; cx.beginPath(); cx.arc(px, py - 44, 9, 0, 7); cx.fill();
    cx.fillStyle = "#8d96a3"; const ax = px + (side < 0 ? 14 : -14) + (anim ? (side < 0 ? 6 : -6) : 0); cx.fillRect(ax - 4, py - 30, 8, 5);
    cx.fillStyle = "#243650"; cx.fillRect(20, 14, W - 40, 12);
    cx.fillStyle = time > 30 ? "#3fb06a" : "#e5484d"; cx.fillRect(20, 14, (W - 40) * time / 100, 12);
    cx.fillStyle = "#fff"; cx.font = "700 30px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "alphabetic";
    cx.fillText(String(score), W / 2, 70);
    info.textContent = "Kesilen: " + score + "   En iyi: " + best("nb_timber");
    if (!started && !over) banner(cx, W, H, "Sol ya da sağa dokun", "Dalın olduğu tarafa geçme!");
    if (over) banner(cx, W, H, "Bitti! " + score + " kesim", "Yeniden başla'ya bas");
  }
  cv.onpointerdown = (e) => { e.preventDefault(); chop(pos(cv, e).x < W / 2 ? -1 : 1); };
  row.appendChild(act("◀ Sol", () => chop(-1)));
  row.appendChild(act("Sağ ▶", () => chop(1)));
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => { off(); };
}

export const SOLO = {
  bird: { group: "Aksiyon", icon: "🐦", label: "Zıplayan Kuş", start: bird },
  runner: { group: "Aksiyon", icon: "🏃", label: "Koşucu", start: runner },
  timber: { group: "Aksiyon", icon: "🪓", label: "Ağaç Kes", start: timber }
};
