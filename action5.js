// Aksiyon oyunları 5: Piyano Karoları, Basket Atışı, Blok Bulmaca
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

/* ---------- Piyano Karoları ---------- */
function piano(body, el, act) {
  const W = 240, H = 360, RH = 90, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  let rows, off, score, over, scroll, speed, bad, ac;
  function beep(f) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = f; g.gain.value = 0.07; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.12);
    } catch (e) {}
  }
  function start() {
    if (off) off();
    rows = [];
    for (let i = 0; i < 6; i++) rows.push({ c: rand(4), hit: false });
    rows[5].c = -1;
    score = 0; over = false; scroll = -90; speed = 1.2; bad = null;
    off = raf((dt) => {
      if (!over) {
        scroll += speed * dt;
        speed = 1.2 + score * 0.035;
        while (scroll >= RH && !over) {
          const gone = rows[0];
          if (gone.c >= 0 && !gone.hit) { over = true; hi("nb_piano", score); break; }
          scroll -= RH; rows.shift(); rows.push({ c: rand(4), hit: false });
        }
      }
      draw();
    });
  }
  function draw() {
    cx.fillStyle = "#fff"; cx.fillRect(0, 0, W, H);
    rows.forEach((r, i) => {
      const y = H - (i + 1) * RH + scroll;
      cx.fillStyle = r.c >= 0 ? (r.hit ? "#9aa7b8" : "#111") : "#fff";
      if (r.c >= 0) cx.fillRect(r.c * (W / 4) + 1, y + 1, W / 4 - 2, RH - 2);
    });
    cx.strokeStyle = "#cfd9e4"; cx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { cx.beginPath(); cx.moveTo(i * W / 4, 0); cx.lineTo(i * W / 4, H); cx.stroke(); }
    if (bad) { cx.fillStyle = "rgba(229,72,77,.7)"; cx.fillRect(bad.c * (W / 4), bad.y, W / 4, RH); }
    info.textContent = "Skor: " + score + "   En iyi: " + best("nb_piano");
    if (over) banner(cx, W, H, "Bitti! " + score + " karo", "Yeniden başla'ya bas");
  }
  cv.onpointerdown = (e) => {
    if (over) return;
    const p = pos(cv, e), c = Math.floor(p.x / (W / 4));
    let i = rows.findIndex((r) => r.c >= 0 && !r.hit);
    if (i < 0) return;
    const r = rows[i], y = H - (i + 1) * RH + scroll;
    if (c === r.c && p.y > y - 10 && p.y < y + RH + 10) { r.hit = true; score++; beep(300 + (score % 8) * 60); }
    else { over = true; bad = { c: c, y: Math.floor(p.y / RH) * RH }; hi("nb_piano", score); }
  };
  row.appendChild(act("Yeniden başla", start));
  const hint = el("p", "", "Siyah karolara alttan başlayarak sırayla dokun. Beyaza basma, hiçbirini kaçırma.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  return () => { off(); try { if (ac) ac.close(); } catch (e) {} };
}

/* ---------- Basket Atışı ---------- */
function hoops(body, el, act) {
  const W = 300, H = 380, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  let ball, v, state, hx, hd, score, shots, drag, off, over, msgT, prevY;
  function newBall() { ball = { x: W / 2, y: H - 40 }; v = { x: 0, y: 0 }; state = "aim"; drag = null; }
  function start() {
    if (off) off();
    score = 0; shots = 10; over = false; hx = 150; hd = 1; msgT = 0;
    newBall();
    off = raf((dt) => {
      hx += hd * (0.8 + score * 0.1) * dt;
      if (hx > W - 45) hd = -1; if (hx < 45) hd = 1;
      if (state === "fly") {
        prevY = ball.y;
        ball.x += v.x * dt; ball.y += v.y * dt; v.y += 0.28 * dt;
        if (ball.x < 8 || ball.x > W - 8) { v.x = -v.x * 0.8; ball.x = Math.max(8, Math.min(W - 8, ball.x)); }
        if (prevY < 90 && ball.y >= 90 && v.y > 0 && Math.abs(ball.x - hx) < 24) { score++; msgT = 40; state = "done"; setTimeout(next, 500); }
        else if ((Math.abs(ball.y - 90) < 8 && (Math.abs(ball.x - (hx - 28)) < 6 || Math.abs(ball.x - (hx + 28)) < 6))) { v.y = Math.abs(v.y) * 0.6; v.x += (ball.x - hx) * 0.05; }
        if (ball.y > H + 20) { state = "done"; setTimeout(next, 300); }
      }
      msgT = Math.max(0, msgT - dt);
      draw();
    });
  }
  function next() {
    if (!off) return;
    shots--;
    if (shots <= 0) { over = true; hi("nb_hoop", score); state = "end"; }
    else newBall();
  }
  function draw() {
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#e5e9ef"; cx.fillRect(hx - 30, 62, 6, 6); cx.fillRect(hx + 24, 62, 6, 6);
    cx.fillStyle = "#e5484d"; cx.fillRect(hx - 30, 88, 60, 4);
    cx.strokeStyle = "#e5e9ef"; cx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) { cx.beginPath(); cx.moveTo(hx + i * 12, 92); cx.lineTo(hx + i * 8, 120); cx.stroke(); }
    cx.fillStyle = "#e5e9ef"; cx.fillRect(hx - 36, 40, 72, 22);
    cx.font = "26px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle";
    if (state !== "end") cx.fillText("🏀", ball.x, ball.y);
    if (drag && state === "aim") {
      cx.strokeStyle = "#f0c24b"; cx.lineWidth = 3; cx.setLineDash([6, 6]); cx.beginPath(); cx.moveTo(ball.x, ball.y);
      cx.lineTo(ball.x + (ball.x - drag.x), ball.y + (ball.y - drag.y)); cx.stroke(); cx.setLineDash([]);
    }
    if (msgT > 0) { cx.font = "700 30px sans-serif"; cx.fillStyle = "#3fb06a"; cx.fillText("SAYI! 🎉", W / 2, 200); }
    info.textContent = "Sayı: " + score + "   Kalan atış: " + Math.max(0, shots) + "   En iyi: " + best("nb_hoop");
    if (over) banner(cx, W, H, "Bitti! " + score + " sayı", "Yeniden başla'ya bas");
  }
  cv.onpointerdown = (e) => { if (state === "aim") { drag = pos(cv, e); cv.setPointerCapture(e.pointerId); } };
  cv.onpointermove = (e) => { if (drag) drag = pos(cv, e); };
  cv.onpointerup = () => {
    if (!drag || state !== "aim") { drag = null; return; }
    const dx = ball.x - drag.x, dy = ball.y - drag.y, d = Math.hypot(dx, dy);
    drag = null;
    if (d < 15 || dy < 5) return;
    const p = Math.min(d, 150) * 0.105;
    v = { x: dx / d * p * 0.7, y: dy / d * p }; state = "fly";
  };
  row.appendChild(act("Yeniden başla", start));
  const hint = el("p", "", "Topu aşağı çekip bırak, yukarı fırlasın. Hedef: potanın içinden aşağı geçirmek.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  return () => { off(); off = null; };
}

/* ---------- Blok Bulmaca (8x8) ---------- */
const SHAPES = [
  [[1]], [[1, 1]], [[1], [1]], [[1, 1, 1]], [[1], [1], [1]], [[1, 1], [1, 1]], [[1, 1, 1, 1]], [[1], [1], [1], [1]],
  [[1, 0], [1, 1]], [[0, 1], [1, 1]], [[1, 1], [1, 0]], [[1, 1], [0, 1]], [[1, 1, 1], [1, 0, 0]], [[1, 1, 1], [0, 0, 1]],
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]], [[1, 1, 1], [0, 1, 0]]
];
const BCOL = ["#e5484d", "#3fb06a", "#4a8fd9", "#f0c24b", "#9b5bd9", "#2aa5a5"];
function blocks(body, el, act) {
  const N = 8;
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 8px;font-size:15px";
  body.appendChild(info);
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-columns:repeat(" + N + ",1fr);gap:2px;max-width:320px;margin:0 auto 10px;background:#243650;padding:2px;border-radius:8px";
  body.appendChild(gr);
  const tray = el("div", "");
  tray.style.cssText = "display:flex;gap:8px;justify-content:center;margin-bottom:8px;min-height:80px";
  body.appendChild(tray);
  const row = rowOf(body, el);
  let g, pcs, sel, ghost, score, over;
  const fits = (sh, r, c) => sh.every((rw, y) => rw.every((v, x) => !v || (r + y < N && c + x < N && !g[(r + y) * N + c + x])));
  const canAny = (sh) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(sh, r, c)) return true; return false; };
  function deal() { pcs = [0, 1, 2].map(() => ({ sh: SHAPES[rand(SHAPES.length)], col: rand(BCOL.length), used: false })); }
  function place(r, c) {
    const p = pcs[sel];
    p.sh.forEach((rw, y) => rw.forEach((v, x) => { if (v) { g[(r + y) * N + c + x] = p.col + 1; score++; } }));
    p.used = true; sel = -1; ghost = null;
    const rows = [], cols = [];
    for (let i = 0; i < N; i++) {
      if (g.slice(i * N, i * N + N).every((v) => v)) rows.push(i);
      let full = true; for (let k = 0; k < N; k++) if (!g[k * N + i]) full = false;
      if (full) cols.push(i);
    }
    rows.forEach((r2) => { for (let k = 0; k < N; k++) g[r2 * N + k] = 0; });
    cols.forEach((c2) => { for (let k = 0; k < N; k++) g[k * N + c2] = 0; });
    const n = rows.length + cols.length;
    if (n) score += 10 * n * n;
    if (pcs.every((q) => q.used)) deal();
    over = !pcs.some((q) => !q.used && canAny(q.sh));
    if (over) hi("nb_blocks", score);
    draw();
  }
  function draw() {
    gr.textContent = "";
    const gh = new Set();
    if (ghost && sel >= 0) { const p = pcs[sel], ok = fits(p.sh, ghost.r, ghost.c); p.sh.forEach((rw, y) => rw.forEach((v, x) => { if (v) gh.add(ok ? (ghost.r + y) * N + ghost.c + x : -1); })); ghost.ok = ok; }
    for (let i = 0; i < N * N; i++) {
      const b = el("button", "", "");
      b.type = "button";
      const isG = gh.has(i);
      b.style.cssText = "aspect-ratio:1;padding:0;border:0!important;border-radius:4px!important;background:" + (g[i] ? BCOL[g[i] - 1] : isG ? "rgba(240,194,75,.6)" : "#0f1a2a") + "!important";
      b.onclick = () => {
        if (over || sel < 0) return;
        const r = Math.floor(i / N), c = i % N;
        if (ghost && ghost.r === r && ghost.c === c && ghost.ok) { place(r, c); return; }
        ghost = { r: r, c: c, ok: false }; draw();
      };
      gr.appendChild(b);
    }
    tray.textContent = "";
    pcs.forEach((p, k) => {
      const b = el("button", "", "");
      b.type = "button";
      b.style.cssText = "padding:8px;min-width:84px;min-height:80px;display:flex;align-items:center;justify-content:center;" + (sel === k ? "outline:3px solid var(--lamp)" : "") + (p.used ? ";opacity:.25" : "");
      const mini = el("div", "");
      mini.style.cssText = "display:grid;grid-template-columns:repeat(" + p.sh[0].length + ",14px);gap:2px";
      p.sh.forEach((rw) => rw.forEach((v) => { const d = el("div", ""); d.style.cssText = "width:14px;height:14px;border-radius:3px;background:" + (v ? BCOL[p.col] : "transparent"); mini.appendChild(d); }));
      b.appendChild(mini);
      b.onclick = () => { if (!p.used && !over) { sel = k; ghost = null; draw(); } };
      tray.appendChild(b);
    });
    info.textContent = (over ? "Yer kalmadı! " : "") + "Puan: " + score + "   En iyi: " + best("nb_blocks") + (over ? "" : "   Parçayı seç, bir kareye dokun, aynı kareye tekrar dokununca yerleşir.");
  }
  function start() { g = new Array(N * N).fill(0); score = 0; over = false; sel = -1; ghost = null; deal(); draw(); }
  row.appendChild(act("Yeni oyun", start));
  start();
}

export const SOLO = {
  piano: { group: "Aksiyon", icon: "🎹", label: "Piyano Karoları", start: piano },
  hoop: { group: "Aksiyon", icon: "🏀", label: "Basket Atışı", start: hoops },
  blocks: { group: "Zeka", icon: "🧱", label: "Blok Bulmaca", start: blocks }
};
