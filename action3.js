// Aksiyon oyunları 3: Renk Patlat, Düello, Mini Golf
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

/* ---------- Renk Patlat ---------- */
function pop(body, el, act) {
  const R = 9, C = 8, COL = ["#e5484d", "#3fb06a", "#4a8fd9", "#f0c24b", "#9b5bd9"];
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 8px;font-size:15px";
  body.appendChild(info);
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-columns:repeat(" + C + ",1fr);gap:3px;margin-bottom:10px";
  body.appendChild(gr);
  const row = rowOf(body, el);
  let g, score;
  function group(i) {
    const c = g[i];
    if (c < 0) return [];
    const seen = new Set([i]), st = [i];
    while (st.length) {
      const k = st.pop(), r = Math.floor(k / C), q = k % C;
      [[r - 1, q], [r + 1, q], [r, q - 1], [r, q + 1]].forEach((n) => {
        if (n[0] < 0 || n[1] < 0 || n[0] >= R || n[1] >= C) return;
        const j = n[0] * C + n[1];
        if (g[j] === c && !seen.has(j)) { seen.add(j); st.push(j); }
      });
    }
    return Array.from(seen);
  }
  function settle() {
    const cols = [];
    for (let q = 0; q < C; q++) { const col = []; for (let r = R - 1; r >= 0; r--) if (g[r * C + q] >= 0) col.push(g[r * C + q]); if (col.length) cols.push(col); }
    g = new Array(R * C).fill(-1);
    cols.forEach((col, q) => col.forEach((v, k) => { g[(R - 1 - k) * C + q] = v; }));
  }
  const alive = () => g.some((c, i) => c >= 0 && group(i).length >= 2);
  function draw() {
    gr.textContent = "";
    g.forEach((c, i) => {
      const b = el("button", "", "");
      b.type = "button";
      b.style.cssText = "aspect-ratio:1;padding:0;border:0!important;border-radius:8px!important;background:" + (c >= 0 ? COL[c] : "transparent") + "!important";
      b.onclick = () => {
        const gp = group(i);
        if (gp.length < 2) return;
        gp.forEach((k) => { g[k] = -1; });
        score += gp.length * gp.length;
        settle(); draw();
      };
      gr.appendChild(b);
    });
    const over = !alive();
    if (over) hi("nb_pop", score);
    info.textContent = (over ? "Bitti! " : "") + "Puan: " + score + "   En iyi: " + best("nb_pop") + (over ? "" : "   Aynı renkten 2+ kutuya dokun");
  }
  function start() { g = []; for (let i = 0; i < R * C; i++) g.push(rand(COL.length)); score = 0; draw(); }
  row.appendChild(act("Yeni oyun", start));
  start();
}

/* ---------- Düello (refleks) ---------- */
function duel(body, el, act) {
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 8px;font-size:15px";
  body.appendChild(info);
  const pad = el("button", "", "");
  pad.type = "button";
  pad.style.cssText = "width:100%;height:200px;font-size:26px;font-weight:700;border:0!important;border-radius:14px!important;color:#fff";
  body.appendChild(pad);
  const row = rowOf(body, el);
  let ph, t0, res, timer;
  function setP(bg, txt) { pad.style.background = bg + "!important"; pad.textContent = txt; }
  function wait() {
    ph = "wait"; setP("#e5484d", "Bekle… yeşil olunca bas!");
    info.textContent = "Tur " + (res.length + 1) + "/5   En iyi ort.: " + (best("nb_duel") ? best("nb_duel") + " ms" : "-");
    timer = setTimeout(() => { ph = "go"; t0 = performance.now(); setP("#3fb06a", "ŞİMDİ!"); }, 1200 + rand(2800));
  }
  pad.onclick = () => {
    if (ph === "wait") { clearTimeout(timer); setP("#d9822b", "Erken bastın! Dokun, tekrar dene"); ph = "early"; return; }
    if (ph === "early") { wait(); return; }
    if (ph === "go") {
      const ms = Math.round(performance.now() - t0);
      res.push(ms);
      if (res.length >= 5) {
        const avg = Math.round(res.reduce((a, b) => a + b, 0) / 5);
        ph = "end"; setP("#4a8fd9", "Ortalama: " + avg + " ms");
        info.textContent = "Tepkiler: " + res.join(", ") + " ms   En iyi ort.: " + lo("nb_duel", avg) + " ms";
      } else { ph = "pause"; setP("#4a8fd9", ms + " ms. Devam için dokun"); }
      return;
    }
    if (ph === "pause") wait();
    else if (ph === "end") start();
  };
  function start() { clearTimeout(timer); res = []; wait(); }
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => clearTimeout(timer);
}

/* ---------- Mini Golf ---------- */
const HOLES = [
  { b: [50, 250], h: [250, 50], o: [] },
  { b: [40, 150], h: [260, 150], o: [[140, 60, 20, 180]] },
  { b: [40, 260], h: [260, 40], o: [[100, 0, 20, 200], [190, 100, 20, 200]] },
  { b: [150, 270], h: [150, 30], o: [[60, 140, 90, 20], [150, 140, 90, 20], [120, 70, 60, 16]] }
];
function golf(body, el, act) {
  const W = 300, H = 300, { cv, cx, info } = arena(body, el, W, W);
  const row = rowOf(body, el);
  let hole, ball, v, strokes, total, drag, off, state;
  function load() { const L = HOLES[hole]; ball = { x: L.b[0], y: L.b[1] }; v = { x: 0, y: 0 }; strokes = 0; drag = null; state = "aim"; }
  function start() {
    if (off) off();
    hole = 0; total = 0; load();
    off = raf((dt) => { step(dt); draw(); });
  }
  function step(dt) {
    if (state !== "roll") return;
    const L = HOLES[hole], n = Math.ceil(dt * 2);
    for (let s = 0; s < n; s++) {
      ball.x += v.x * dt / n; ball.y += v.y * dt / n;
      if (ball.x < 8) { ball.x = 8; v.x = -v.x; } if (ball.x > W - 8) { ball.x = W - 8; v.x = -v.x; }
      if (ball.y < 8) { ball.y = 8; v.y = -v.y; } if (ball.y > H - 8) { ball.y = H - 8; v.y = -v.y; }
      L.o.forEach((o) => {
        if (ball.x > o[0] - 6 && ball.x < o[0] + o[2] + 6 && ball.y > o[1] - 6 && ball.y < o[1] + o[3] + 6) {
          const dl = ball.x - (o[0] - 6), dr = o[0] + o[2] + 6 - ball.x, dtp = ball.y - (o[1] - 6), db = o[1] + o[3] + 6 - ball.y;
          const m = Math.min(dl, dr, dtp, db);
          if (m === dl) { ball.x = o[0] - 6; v.x = -Math.abs(v.x); }
          else if (m === dr) { ball.x = o[0] + o[2] + 6; v.x = Math.abs(v.x); }
          else if (m === dtp) { ball.y = o[1] - 6; v.y = -Math.abs(v.y); }
          else { ball.y = o[1] + o[3] + 6; v.y = Math.abs(v.y); }
        }
      });
    }
    const f = Math.pow(0.985, dt); v.x *= f; v.y *= f;
    const sp = Math.hypot(v.x, v.y);
    if (Math.hypot(ball.x - L.h[0], ball.y - L.h[1]) < 11 && sp < 7) {
      total += strokes; state = "in";
      setTimeout(() => {
        if (!off) return;
        if (hole + 1 >= HOLES.length) { state = "end"; lo("nb_golf", total); }
        else { hole++; load(); }
      }, 900);
    } else if (sp < 0.08) { v.x = 0; v.y = 0; state = "aim"; }
  }
  function draw() {
    const L = HOLES[hole];
    cx.fillStyle = "#2c6b3f"; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#6b4a2b"; L.o.forEach((o) => cx.fillRect(o[0], o[1], o[2], o[3]));
    cx.fillStyle = "#000"; cx.beginPath(); cx.arc(L.h[0], L.h[1], 11, 0, 7); cx.fill();
    cx.fillStyle = "#fff"; cx.beginPath(); cx.arc(ball.x, ball.y, 6, 0, 7); cx.fill();
    if (drag && state === "aim") {
      cx.strokeStyle = "#f0c24b"; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(ball.x, ball.y);
      cx.lineTo(ball.x + (ball.x - drag.x), ball.y + (ball.y - drag.y)); cx.stroke();
    }
    info.textContent = "Delik " + (hole + 1) + "/" + HOLES.length + "   Vuruş: " + strokes + "   Toplam: " + (total + (state === "in" ? 0 : strokes)) + (best("nb_golf") ? "   En iyi: " + best("nb_golf") : "") + (state === "in" ? "   Delikte! ⛳" : "");
    if (state === "end") banner(cx, W, H, "Bitti! Toplam " + total + " vuruş", "Yeniden başla'ya bas");
  }
  cv.onpointerdown = (e) => { if (state === "aim") { drag = pos(cv, e); cv.setPointerCapture(e.pointerId); } };
  cv.onpointermove = (e) => { if (drag) drag = pos(cv, e); };
  cv.onpointerup = () => {
    if (!drag || state !== "aim") { drag = null; return; }
    const dx = ball.x - drag.x, dy = ball.y - drag.y, d = Math.hypot(dx, dy);
    drag = null;
    if (d < 8) return;
    const p = Math.min(d, 120) * 0.09;
    v = { x: dx / d * p, y: dy / d * p }; strokes++; state = "roll";
  };
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => { off(); off = null; };
}

export const SOLO = {
  pop: { group: "Zeka", icon: "💥", label: "Renk Patlat", start: pop },
  duel: { group: "Aksiyon", icon: "⚡", label: "Düello (Refleks)", start: duel },
  golf: { group: "Aksiyon", icon: "⛳", label: "Mini Golf", start: golf }
};
