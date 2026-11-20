// Karışık oyunlar 1: Büyüyen Balık, Tüp Sıralama, Renk Seli
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


const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
function low(k, v) { const o = best(k); if (!o || v < o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }
const PAL = ["#e5484d", "#3fb06a", "#4a8fd9", "#f0c24b", "#9b5bd9", "#e5884d", "#2aa5a5", "#e55da8"];

/* ---------- Büyüyen Balık ---------- */
function fish(body, el, act) {
  const W = 300, H = 360, { cv, cx, info } = arena(body, el, W, H);
  const row = rowOf(body, el);
  let me, tgt, fs, score, over, off, spawn, t;
  function start() {
    if (off) off();
    me = { x: W / 2, y: H / 2, r: 12 }; tgt = null; fs = []; score = 0; over = false; spawn = 0; t = 0;
    off = raf((dt) => {
      t += dt;
      if (!over) {
        if (tgt) { me.x += (tgt.x - me.x) * 0.14 * dt; me.y += (tgt.y - me.y) * 0.14 * dt; }
        spawn -= dt;
        if (spawn <= 0) {
          spawn = 28 + rand(24);
          const big = Math.random() < 0.4, r = big ? me.r * (1.15 + Math.random() * 0.7) : me.r * (0.4 + Math.random() * 0.55);
          const rr = Math.max(5, Math.min(70, r)), from = Math.random() < 0.5 ? -1 : 1;
          fs.push({ x: from < 0 ? -rr - 5 : W + rr + 5, y: rr + rand(H - 2 * rr), r: rr, v: from * -1 * (0.8 + Math.random() * 1.2), c: PAL[rand(PAL.length)] });
        }
        fs.forEach((f) => { f.x += f.v * dt; });
        fs = fs.filter((f) => f.x > -90 && f.x < W + 90);
        for (const f of fs.slice()) {
          if (Math.hypot(f.x - me.x, f.y - me.y) < me.r + f.r - Math.min(me.r, f.r) * 0.35) {
            if (me.r >= f.r) { fs.splice(fs.indexOf(f), 1); score++; me.r = Math.min(46, Math.sqrt(me.r * me.r + 0.18 * f.r * f.r)); }
            else { over = true; hi("nb_fish", score); }
          }
        }
      }
      draw();
    });
  }
  function shape(x, y, r, col, dir) {
    cx.fillStyle = col; cx.beginPath(); cx.ellipse(x, y, r, r * 0.7, 0, 0, 7); cx.fill();
    cx.beginPath(); cx.moveTo(x - dir * r * 0.9, y); cx.lineTo(x - dir * r * 1.5, y - r * 0.5); cx.lineTo(x - dir * r * 1.5, y + r * 0.5); cx.fill();
    cx.fillStyle = "#fff"; cx.beginPath(); cx.arc(x + dir * r * 0.4, y - r * 0.15, Math.max(2, r * 0.18), 0, 7); cx.fill();
    cx.fillStyle = "#111"; cx.beginPath(); cx.arc(x + dir * r * 0.45, y - r * 0.15, Math.max(1, r * 0.08), 0, 7); cx.fill();
  }
  function draw() {
    cx.fillStyle = "#0e3a5c"; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "rgba(255,255,255,.06)";
    for (let i = 0; i < 6; i++) { cx.beginPath(); cx.arc((i * 61 + t * 0.3) % W, H - ((i * 53 + t * 0.8) % H), 6 + i, 0, 7); cx.fill(); }
    fs.forEach((f) => shape(f.x, f.y, f.r, f.r > me.r ? "#e5484d" : f.c, f.v > 0 ? 1 : -1));
    shape(me.x, me.y, me.r, "#f0c24b", tgt && tgt.x < me.x ? -1 : 1);
    info.textContent = "Yenen: " + score + "   Boyun: " + Math.round(me.r) + "   En iyi: " + best("nb_fish");
    if (over) banner(cx, W, H, "Yutuldun! " + score + " balık", "Yeniden başla'ya bas");
  }
  cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); tgt = pos(cv, e); };
  cv.onpointermove = (e) => { if (tgt) tgt = pos(cv, e); };
  row.appendChild(act("Yeniden başla", start));
  const hint = el("p", "", "Parmağını sürükle, balık seni takip eder. Senden küçük (renkli) balıkları ye, büyükleri (kırmızı) yaklaştırma.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  return () => { off(); };
}

/* ---------- Tüp Sıralama ---------- */
function tubes(body, el, act) {
  const NC = 5, CAP = 4;
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 10px;font-size:15px";
  body.appendChild(info);
  const gr = el("div", "");
  gr.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:10px";
  body.appendChild(gr);
  const row = rowOf(body, el);
  let T, sel, moves, hist;
  const full = (t) => t.length === CAP && t.every((c) => c === t[0]);
  const won = () => T.every((t) => !t.length || full(t));
  function draw() {
    gr.textContent = "";
    T.forEach((t, i) => {
      const b = el("button", "", "");
      b.type = "button";
      b.style.cssText = "width:48px;height:150px;padding:4px;display:flex;flex-direction:column-reverse;gap:3px;border-radius:0 0 24px 24px!important;" + (sel === i ? "outline:3px solid var(--lamp);" : "");
      t.forEach((c) => { const d = el("div", ""); d.style.cssText = "width:100%;height:32px;border-radius:6px;background:" + PAL[c]; b.appendChild(d); });
      b.onclick = () => {
        if (won()) return;
        if (sel < 0) { if (t.length) sel = i; draw(); return; }
        if (sel === i) { sel = -1; draw(); return; }
        const from = T[sel], top = from[from.length - 1];
        if (t.length < CAP && (!t.length || t[t.length - 1] === top)) {
          hist.push(JSON.stringify(T));
          while (from.length && from[from.length - 1] === top && t.length < CAP) t.push(from.pop());
          moves++; sel = -1;
          if (won()) low("nb_tubes", moves);
        } else sel = t.length ? i : -1;
        draw();
      };
      gr.appendChild(b);
    });
    info.textContent = (won() ? "Hepsi sıralandı! 🎉 " : "Bir tüpe dokun, sonra rengi akıtacağın tüpe dokun. ") + "Hamle: " + moves + (best("nb_tubes") ? "   En iyi: " + best("nb_tubes") : "");
  }
  function start() {
    const balls = [];
    for (let c = 0; c < NC; c++) for (let k = 0; k < CAP; k++) balls.push(c);
    const s = shuffle(balls);
    T = [];
    for (let i = 0; i < NC; i++) T.push(s.slice(i * CAP, i * CAP + CAP));
    T.push([]); T.push([]);
    sel = -1; moves = 0; hist = [];
    draw();
  }
  row.appendChild(act("↩ Geri al", () => { if (hist.length && !won()) { T = JSON.parse(hist.pop()); moves = Math.max(0, moves - 1); sel = -1; draw(); } }));
  row.appendChild(act("Yeni oyun", start));
  start();
}

/* ---------- Renk Seli ---------- */
function flood(body, el, act) {
  const N = 10, NC = 6, LIM = 22;
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 10px;font-size:15px";
  body.appendChild(info);
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-columns:repeat(" + N + ",1fr);gap:2px;max-width:320px;margin:0 auto 10px";
  body.appendChild(gr);
  const pal = el("div", "");
  pal.style.cssText = "display:flex;gap:8px;justify-content:center;flex-wrap:wrap";
  body.appendChild(pal);
  const row = rowOf(body, el);
  let g, moves;
  const done = () => g.every((c) => c === g[0]);
  function fill(c) {
    const old = g[0];
    if (c === old) return;
    const st = [0], seen = new Set([0]);
    while (st.length) {
      const i = st.pop();
      g[i] = c;
      const r = Math.floor(i / N), q = i % N;
      [[r - 1, q], [r + 1, q], [r, q - 1], [r, q + 1]].forEach((p) => {
        if (p[0] < 0 || p[1] < 0 || p[0] >= N || p[1] >= N) return;
        const j = p[0] * N + p[1];
        if (!seen.has(j) && g[j] === old) { seen.add(j); st.push(j); }
      });
    }
  }
  function draw() {
    gr.textContent = "";
    g.forEach((c) => { const d = el("div", ""); d.style.cssText = "aspect-ratio:1;border-radius:3px;background:" + PAL[c]; gr.appendChild(d); });
    pal.textContent = "";
    for (let c = 0; c < NC; c++) {
      const b = el("button", "", "");
      b.type = "button";
      b.style.cssText = "width:44px;height:44px;border-radius:50%!important;border:2px solid #fff!important;background:" + PAL[c] + "!important";
      b.onclick = () => {
        if (done() || moves >= LIM) return;
        fill(c); moves++;
        if (done()) low("nb_flood", moves);
        draw();
      };
      pal.appendChild(b);
    }
    const w = done();
    info.textContent = w ? "Tüm tahta tek renk! 🎉 " + moves + " hamlede." : moves >= LIM ? "Hamle bitti. Yeni oyunla tekrar dene." : "Sol üst köşeden başlayarak renk seç, bölgeyi büyüt. Kalan hamle: " + (LIM - moves) + (best("nb_flood") ? "   En iyi: " + best("nb_flood") : "");
  }
  function start() { g = []; for (let i = 0; i < N * N; i++) g.push(rand(NC)); moves = 0; draw(); }
  row.appendChild(act("Yeni oyun", start));
  start();
}

export const SOLO = {
  fish: { group: "Aksiyon", icon: "🐟", label: "Büyüyen Balık", start: fish },
  tubes: { group: "Zeka", icon: "🧪", label: "Tüp Sıralama", start: tubes },
  flood: { group: "Zeka", icon: "🌊", label: "Renk Seli", start: flood }
};
