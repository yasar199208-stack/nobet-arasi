// Zeka oyunları 14: Şeker Patlatma 3D (perspektifli 3D tahta, parlak şekerler, özel şekerler)
const rand = (n) => Math.floor(Math.random() * n);
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function hi(k, v) { const o = best(k); if (v > o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }

const PAT = {
  bottom: (r, c) => r >= 6,
  top: (r, c) => r <= 1,
  cross: (r, c) => r === 3 || r === 4 || c === 3 || c === 4,
  frame: (r, c) => r === 0 || r === 7 || c === 0 || c === 7,
  checker: (r, c) => (r + c) % 2 === 0,
  diag: (r, c) => r === c || r + c === 7,
  center: (r, c) => r >= 2 && r <= 5 && c >= 2 && c <= 5,
  stripes: (r, c) => r % 2 === 0,
  corners: (r, c) => (r < 3 || r > 4) && (c < 3 || c > 4),
  all: () => true
};
const PNAME = { bottom: "alt", top: "üst", cross: "artı", frame: "çerçeve", checker: "dama", diag: "çapraz", center: "orta", stripes: "çizgi", corners: "köşe", all: "tüm tahta" };
const GEN = ["bottom", "cross", "frame", "checker", "diag", "center", "stripes", "corners", "all"];
const LV = [
  { t: 4, m: 25, s: 300 },
  { t: 4, m: 24, c: [0, 18] },
  { t: 5, m: 24, s: 550 },
  { t: 5, m: 26, j: "bottom" },
  { t: 5, m: 24, c: [1, 22] },
  { t: 5, m: 26, j: "cross" },
  { t: 6, m: 25, s: 850 },
  { t: 5, m: 28, j: "frame" },
  { t: 6, m: 26, c: [2, 26] },
  { t: 5, m: 30, j: "checker" },
  { t: 6, m: 26, s: 700, c: [3, 20] },
  { t: 6, m: 28, j: "diag" },
  { t: 5, m: 26, j: "top", s: 600 },
  { t: 6, m: 28, c: [4, 30], j: "center" },
  { t: 6, m: 26, j: "cross", s: 800 },
  { t: 6, m: 36, j: "all" },
  { t: 6, m: 26, c: [5, 32] },
  { t: 6, m: 28, j: "frame", c: [0, 24] },
  { t: 6, m: 28, j: "checker", s: 900 },
  { t: 6, m: 36, j: "all", c: [1, 30] }
];
function cfg(n) {
  if (n <= LV.length) return LV[n - 1];
  const k = n - LV.length;
  const o = { t: 6, m: Math.max(22, 30 - Math.floor(k / 2)), j: GEN[k % GEN.length] };
  if (k % 2 === 0) o.c = [k % 6, 30 + k];
  if (k % 3 !== 1) o.s = 900 + k * 80;
  return o;
}

function candy3d(body, el, act) {
  const N = 8, W = 360, H = 440, TOP = 56, BOT = 396, CWT = 35, CWB = 43;
  const HUE = [352, 48, 270, 26, 130, 205];
  const NAME = ["kırmızı", "sarı", "mor", "turuncu", "yeşil", "mavi"];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let g, sel = -1, score = 0, moves = 0, level = 1, busy = false, dead = false, over = false, won = false, combo = 1;
  let T = 4, C = cfg(1), jelly = [], jl = 0, cnt = 0, unlocked = Math.max(1, best("nb_candy3")), raf, last, tm = 0, parts = [], pops = [], shake = 0;
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 4px;font-size:15px";
  body.appendChild(info);
  const sub = el("p", "", "");
  sub.style.cssText = "margin:0 0 4px;font-size:13px";
  body.appendChild(sub);
  const sub2 = el("p", "", "");
  sub2.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)";
  body.appendChild(sub2);
  const cvs = el("canvas", "");
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.cssText = "display:block;width:100%;max-width:360px;margin:0 auto 10px;touch-action:none;user-select:none;border-radius:12px";
  body.appendChild(cvs);
  const ctx = cvs.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const P = (gx, gy, h) => {
    const v = gy / N, cw = CWT + (CWB - CWT) * v;
    return [W / 2 + (gx - N / 2) * cw, TOP + (BOT - TOP) * v - (h || 0) * cw, cw];
  };
  function inv(px, py) {
    const v = (py - TOP) / (BOT - TOP), cw = CWT + (CWB - CWT) * v;
    return [(px - W / 2) / cw + N / 2, v * N];
  }
  function poly(pts, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fill();
  }
  const mk = (t, r, c, sy) => ({ t: t, sp: 0, x: c, y: sy == null ? r : sy, s: 1, die: 0, bob: Math.random() * 6 });
  const ty = (r, c) => { if (r < 0 || c < 0 || r >= N || c >= N) return -2; const o = g[r * N + c]; return !o || o.die || o.t < 0 ? -2 : o.t; };

  // eşleşme bulma (dizi üzerinde)
  function runsOf(a) {
    const out = [];
    const at = (r, c) => (r < 0 || c < 0 || r >= N || c >= N ? -2 : a[r * N + c]);
    for (let r = 0; r < N; r++) {
      let c = 0;
      while (c < N) {
        const t = at(r, c);
        if (t < 0) { c++; continue; }
        let e = c;
        while (e + 1 < N && at(r, e + 1) === t) e++;
        if (e - c >= 2) { const cells = []; for (let k = c; k <= e; k++) cells.push(r * N + k); out.push({ cells: cells, h: true, t: t }); }
        c = e + 1;
      }
    }
    for (let c = 0; c < N; c++) {
      let r = 0;
      while (r < N) {
        const t = at(r, c);
        if (t < 0) { r++; continue; }
        let e = r;
        while (e + 1 < N && at(e + 1, c) === t) e++;
        if (e - r >= 2) { const cells = []; for (let k = r; k <= e; k++) cells.push(k * N + c); out.push({ cells: cells, h: false, t: t }); }
        r = e + 1;
      }
    }
    return out;
  }
  const typeArr = () => g.map((o) => (!o || o.die || o.t < 0 ? -2 : o.t));
  function hasMove() {
    if (g.some((o) => o && o.sp === 3)) return true;
    const a = typeArr();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      for (const d of [[0, 1], [1, 0]]) {
        const r2 = r + d[0], c2 = c + d[1];
        if (r2 >= N || c2 >= N) continue;
        const i = r * N + c, j = r2 * N + c2;
        [a[i], a[j]] = [a[j], a[i]];
        const ok = runsOf(a).length > 0;
        [a[i], a[j]] = [a[j], a[i]];
        if (ok) return true;
      }
    }
    return false;
  }
  function fresh() {
    let a;
    do {
      a = new Array(N * N).fill(-2);
      for (let i = 0; i < N * N; i++) {
        let t, n = 0;
        do { t = rand(T); a[i] = t; n++; } while (runsOf(a).length > 0 && n < 40);
      }
      g = a.map((t, i) => mk(t, Math.floor(i / N), i % N, Math.floor(i / N) - N - 1));
    } while (!hasMove());
  }
  async function settle() {
    for (let k = 0; k < 120; k++) {
      let ok = true;
      for (let i = 0; i < N * N; i++) { const o = g[i]; if (o && (Math.abs(o.x - (i % N)) > 0.02 || Math.abs(o.y - Math.floor(i / N)) > 0.02)) ok = false; }
      if (ok) return;
      await sleep(16);
    }
  }
  function boom(i, big) {
    const r = Math.floor(i / N) + 0.5, c = (i % N) + 0.5, o = g[i];
    const h = o && o.t >= 0 ? HUE[o.t] : 50;
    for (let k = 0; k < (big ? 14 : 8); k++) parts.push({ gx: c, gy: r, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, vz: 1 + Math.random() * 3, z: 0.4, life: 0.6 + Math.random() * 0.3, h: h });
  }

  function complete() { return (!C.s || score >= C.s) && (!C.c || cnt >= C.c[1]) && jl <= 0; }

  function expand(set, keep) {
    const q = Array.from(set), seen = new Set(q);
    while (q.length) {
      const i = q.pop(), o = g[i];
      if (!o || keep.has(i)) continue;
      const r = Math.floor(i / N), c = i % N, add = [];
      if (o.sp === 1) { for (let k = 0; k < N; k++) add.push(r * N + k); pops.push({ k: "h", r: r, t: 0.35 }); }
      else if (o.sp === 2) { for (let k = 0; k < N; k++) add.push(k * N + c); pops.push({ k: "v", c: c, t: 0.35 }); }
      add.forEach((j) => { if (!seen.has(j) && g[j]) { seen.add(j); set.add(j); q.push(j); } });
    }
    return set;
  }

  async function resolve(forced) {
    busy = true; combo = 1;
    let first = forced || null, moved = first ? [] : (resolve.moved || []);
    resolve.moved = null;
    while (!dead) {
      let set = new Set(), make = {};
      if (first) { first.forEach((i) => set.add(i)); }
      else {
        const rs = runsOf(typeArr());
        if (!rs.length) break;
        rs.forEach((run) => run.cells.forEach((i) => set.add(i)));
        rs.forEach((run) => {
          if (run.cells.length < 4) return;
          let pos = run.cells.find((i) => moved.indexOf(i) >= 0);
          if (pos == null) pos = run.cells[Math.floor(run.cells.length / 2)];
          const sp = run.cells.length >= 5 ? 3 : run.h ? 2 : 1;
          if (!make[pos] || sp > make[pos].sp) make[pos] = { sp: sp, t: run.t };
        });
      }
      first = null; moved = [];
      const keep = new Set(Object.keys(make).map(Number));
      keep.forEach((i) => set.delete(i));
      expand(set, new Set());
      keep.forEach((i) => set.delete(i));
      if (set.size > 3) shake = 0.25;
      set.forEach((i) => { const o = g[i]; if (o) { o.die = 0.0001; boom(i, o.sp > 0); } });
      let tot = 0;
      set.forEach((i) => {
        const o = g[i];
        if (!o) return;
        tot++;
        if (C.c && o.t === C.c[0]) cnt++;
        if (jelly[i]) { jelly[i] = 0; jl--; }
      });
      score += 10 * tot * combo + (tot > 3 ? 10 * (tot - 3) : 0);
      Object.keys(make).forEach((k) => { const o = g[+k]; if (o) { o.sp = make[k].sp; o.t = o.sp === 3 ? -3 : make[k].t; o.s = 1.5; boom(+k, true); } });
      draw();
      await sleep(240);
      if (dead) return;
      set.forEach((i) => { g[i] = null; });
      for (let c = 0; c < N; c++) {
        let w = N - 1;
        for (let r = N - 1; r >= 0; r--) if (g[r * N + c]) { g[w * N + c] = g[r * N + c]; if (w !== r) g[r * N + c] = null; w--; }
        for (let r = w, k = 0; r >= 0; r--, k++) g[r * N + c] = mk(rand(T), r, c, -1 - k);
      }
      combo++;
      draw();
      await settle();
      if (dead) return;
    }
    if (dead) return;
    if (complete()) {
      won = true;
      if (level + 1 > unlocked) { unlocked = level + 1; hi("nb_candy3", unlocked); }
      hi("nb_candy3_best", score);
    } else {
      if (!hasMove()) { fresh(); await settle(); }
      if (moves <= 0) { over = true; hi("nb_candy3_best", score); }
    }
    busy = false; draw();
  }
  function swapObjs(a, b) { const t = g[a]; g[a] = g[b]; g[b] = t; }
  async function swap(a, b) {
    if (busy || over || won || dead) return;
    busy = true; sel = -1;
    swapObjs(a, b); draw(); await sleep(190);
    if (dead) return;
    const A = g[a], B = g[b];
    if ((A && A.sp === 3) || (B && B.sp === 3)) {
      moves--;
      const set = new Set();
      if (A.sp === 3 && B.sp === 3) { for (let i = 0; i < N * N; i++) set.add(i); }
      else {
        const bomb = A.sp === 3 ? a : b, other = A.sp === 3 ? B : A;
        set.add(bomb);
        for (let i = 0; i < N * N; i++) if (g[i] && g[i].t === other.t) set.add(i);
        pops.push({ k: "b", r: Math.floor(bomb / N), c: bomb % N, t: 0.4 });
      }
      shake = 0.35;
      await resolve(set);
      return;
    }
    const ra = runsOf(typeArr());
    if (!ra.length) { swapObjs(a, b); draw(); await sleep(190); busy = false; draw(); return; }
    moves--;
    resolve.moved = [a, b];
    await resolve(null);
  }
  const adj = (a, b) => (Math.abs(a - b) === N) || (Math.abs(a - b) === 1 && Math.floor(a / N) === Math.floor(b / N));
  function cellAt(e) {
    const rc = cvs.getBoundingClientRect();
    const px = (e.clientX - rc.left) * W / rc.width, py = (e.clientY - rc.top) * H / rc.height;
    const q = inv(px, py), c = Math.floor(q[0]), r = Math.floor(q[1]);
    if (r < 0 || c < 0 || r >= N || c >= N) return -1;
    return r * N + c;
  }
  let ds = null;
  cvs.onpointerdown = (e) => {
    if (busy || over || won) return;
    const i = cellAt(e);
    if (i < 0) return;
    try { cvs.setPointerCapture(e.pointerId); } catch (x) {}
    if (sel >= 0 && adj(sel, i)) { const a = sel; ds = null; swap(a, i); return; }
    sel = sel === i ? -1 : i;
    ds = { i: i, x: e.clientX, y: e.clientY };
  };
  cvs.onpointermove = (e) => {
    if (!ds || busy || over || won) return;
    const dx = e.clientX - ds.x, dy = e.clientY - ds.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return;
    const r = Math.floor(ds.i / N), c = ds.i % N;
    let r2 = r, c2 = c;
    if (Math.abs(dx) > Math.abs(dy)) c2 += dx > 0 ? 1 : -1; else r2 += dy > 0 ? 1 : -1;
    const a = ds.i; ds = null;
    if (r2 < 0 || c2 < 0 || r2 >= N || c2 >= N) return;
    swap(a, r2 * N + c2);
  };
  cvs.onpointerup = () => { ds = null; };
  cvs.onpointercancel = cvs.onpointerup;

  function goalText() {
    const p = [];
    if (C.s) p.push("🎯 " + Math.min(score, C.s) + "/" + C.s + " puan");
    if (C.c) p.push("🍭 " + NAME[C.c[0]] + " şeker " + Math.min(cnt, C.c[1]) + "/" + C.c[1]);
    if (C.j) p.push("🟦 Jöle " + jl + " kaldı (" + PNAME[C.j] + ")");
    return p.join("  •  ");
  }
  let nextB, retryB;
  function draw() {
    info.textContent = "Seviye " + level + "   Puan: " + score;
    sub.textContent = goalText();
    sub2.textContent = won ? "🎉 Seviye tamam! Sonraki seviyeye geç." : over ? "Hamle bitti! Tekrar dene." : "Kalan hamle: " + moves + "   Açık seviye: " + unlocked + "   En iyi: " + best("nb_candy3_best");
    nextB.style.display = won ? "" : "none";
    retryB.style.display = over || won ? "" : "none";
  }

  function drawCandy(o, r, c) {
    const x = o.x + 0.5, y = o.y + 0.5;
    let sc = o.s;
    if (o.die) sc *= Math.max(0, 1 - o.die * 4);
    if (sc <= 0.02) return;
    const idx = r * N + c, sl = sel === idx;
    const bob = sl ? Math.abs(Math.sin(tm * 8)) * 0.18 : 0;
    const p = P(x, y, 0.38 + bob), g0 = P(x, y, 0), cw = p[2], rr = 0.4 * cw * sc * (sl ? 1.1 : 1);
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath(); ctx.ellipse(g0[0] + cw * 0.06, g0[1] + cw * 0.04, rr * 0.9, rr * 0.34, 0, 0, 7); ctx.fill();
    let c1, c2, c3;
    if (o.sp === 3) { c1 = "#777"; c2 = "#2b2b3a"; c3 = "#07070d"; }
    else { const h = HUE[o.t]; c1 = "hsl(" + h + ",95%,78%)"; c2 = "hsl(" + h + ",88%,55%)"; c3 = "hsl(" + h + ",85%,30%)"; }
    const gr = ctx.createRadialGradient(p[0] - rr * 0.35, p[1] - rr * 0.4, rr * 0.1, p[0], p[1], rr);
    gr.addColorStop(0, c1); gr.addColorStop(0.5, c2); gr.addColorStop(1, c3);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.fill();
    if (o.sp === 1 || o.sp === 2) {
      ctx.save(); ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.clip();
      ctx.fillStyle = "rgba(255,255,255,.75)";
      for (let k = -1; k <= 1; k++) {
        if (o.sp === 1) ctx.fillRect(p[0] - rr, p[1] + k * rr * 0.5 - rr * 0.1, rr * 2, rr * 0.2);
        else ctx.fillRect(p[0] + k * rr * 0.5 - rr * 0.1, p[1] - rr, rr * 0.2, rr * 2);
      }
      ctx.restore();
    }
    if (o.sp === 3) {
      for (let k = 0; k < 6; k++) {
        const a = tm * 2 + k * 1.047;
        ctx.fillStyle = "hsl(" + HUE[k] + ",95%,60%)";
        ctx.beginPath(); ctx.arc(p[0] + Math.cos(a) * rr * 0.62, p[1] + Math.sin(a) * rr * 0.62, rr * 0.17, 0, 7); ctx.fill();
      }
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p[0], p[1], rr * 0.2, 0, 7); ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.ellipse(p[0] - rr * 0.35, p[1] - rr * 0.45, rr * 0.28, rr * 0.15, -0.6, 0, 7); ctx.fill();
    if (sl) { ctx.strokeStyle = "#ffe066"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p[0], p[1], rr + 3, 0, 7); ctx.stroke(); }
  }
  function render() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 7 * Math.min(1, shake * 4), (Math.random() - 0.5) * 5 * Math.min(1, shake * 4));
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#2a1450"); bg.addColorStop(0.5, "#5b2a86"); bg.addColorStop(1, "#1d0e3a");
    ctx.fillStyle = bg; ctx.fillRect(-10, -10, W + 20, H + 20);
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 26; i++) { ctx.globalAlpha = 0.25 + 0.25 * Math.sin(tm * 2 + i); ctx.fillRect((i * 83) % W, (i * 41) % 48, 2, 2); }
    ctx.globalAlpha = 1;
    // tahta
    const c1 = P(0, 0), c2 = P(N, 0), c3 = P(N, N), c4 = P(0, N);
    poly([[c4[0] - 8, c4[1]], [c3[0] + 8, c3[1]], [c3[0] + 8, c3[1] + 18], [c4[0] - 8, c4[1] + 18]], "#2a1648");
    poly([[c1[0] - 8, c1[1] - 6], [c2[0] + 8, c2[1] - 6], [c3[0] + 8, c3[1]], [c4[0] - 8, c4[1]]], "#3c2166");
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const a = P(c, r), b = P(c + 1, r), cc = P(c + 1, r + 1), d = P(c, r + 1);
      poly([a, b, cc, d], (r + c) % 2 ? "#4b2c7d" : "#573391");
      if (jelly[r * N + c]) {
        poly([a, b, cc, d], "rgba(90,200,250,.38)");
        ctx.strokeStyle = "rgba(160,230,255,.9)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(cc[0], cc[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.stroke();
      }
    }
    // şimşek (özel şeker) efektleri
    pops.forEach((p) => {
      ctx.globalAlpha = Math.min(1, p.t * 3);
      if (p.k === "h") { const a = P(0, p.r), b = P(N, p.r), d = P(0, p.r + 1), e = P(N, p.r + 1); poly([a, b, e, d], "rgba(255,255,255,.7)"); }
      else if (p.k === "v") { const a = P(p.c, 0), b = P(p.c + 1, 0), d = P(p.c, N), e = P(p.c + 1, N); poly([a, b, e, d], "rgba(255,255,255,.7)"); }
      else { const q = P(p.c + 0.5, p.r + 0.5, 0.4); ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.arc(q[0], q[1], (0.4 - p.t) * 520, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    });
    // şekerler (arkadan öne)
    ctx.save();
    ctx.beginPath(); ctx.rect(0, TOP - 8, W, H); ctx.clip();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const o = g[r * N + c]; if (o) drawCandy(o, r, c); }
    ctx.restore();
    // parçacıklar
    parts.forEach((q) => {
      const p = P(q.gx, q.gy, q.z);
      ctx.globalAlpha = Math.max(0, q.life * 1.5);
      ctx.fillStyle = "hsl(" + q.h + ",95%,65%)";
      ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1, p[2] * 0.08), 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    });
    if (over || won) {
      ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 170, W, 100);
      ctx.textAlign = "center";
      ctx.fillStyle = won ? "#ffd23a" : "#fff"; ctx.font = "bold 28px sans-serif";
      ctx.fillText(won ? "Seviye tamam! 🎉" : "Hamle bitti!", W / 2, 212);
      ctx.fillStyle = "#fff"; ctx.font = "16px sans-serif"; ctx.fillText("Puan: " + score, W / 2, 244);
    }
    ctx.restore();
  }
  function update(dt) {
    tm += dt;
    if (shake > 0) shake -= dt;
    for (let i = 0; i < N * N; i++) {
      const o = g[i];
      if (!o) continue;
      const tx = i % N, ty2 = Math.floor(i / N);
      const k = Math.min(1, dt * 11);
      o.x += (tx - o.x) * k;
      const dy = ty2 - o.y;
      o.y += dy * k + (dy > 0.02 ? Math.min(dy, dt * 4) : 0);
      if (Math.abs(o.x - tx) < 0.015) o.x = tx;
      if (Math.abs(ty2 - o.y) < 0.015) o.y = ty2;
      if (o.s > 1) o.s = Math.max(1, o.s - dt * 2);
      if (o.die) o.die += dt;
    }
    parts.forEach((q) => { q.gx += q.vx * dt; q.gy += q.vy * dt; q.z += q.vz * dt; q.vz -= 9 * dt; q.life -= dt; });
    parts = parts.filter((q) => q.life > 0);
    pops.forEach((p) => { p.t -= dt; });
    pops = pops.filter((p) => p.t > 0);
  }
  function loop(t) {
    if (killed) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    update(dt); render();
    raf = requestAnimationFrame(loop);
  }
  function load(n) {
    level = Math.max(1, Math.min(n, unlocked));
    C = cfg(level); T = C.t; score = 0; moves = C.m; cnt = 0;
    busy = false; over = false; won = false; sel = -1; dead = false; parts = []; pops = [];
    jelly = new Array(N * N).fill(0); jl = 0;
    if (C.j) for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (PAT[C.j](r, c)) { jelly[r * N + c] = 1; jl++; }
    fresh(); draw();
  }
  let gen = 0, killed = false;
  function go(n) { dead = true; const my = ++gen; setTimeout(() => { if (my === gen && !killed) load(n); }, 40); }
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  body.appendChild(row);
  const bPrev = act("◀", () => go(level - 1));
  const bNext = act("▶", () => go(level + 1));
  retryB = act("Tekrar", () => go(level));
  nextB = act("Sonraki seviye ▶", () => go(level + 1));
  [bPrev, bNext, retryB, nextB].forEach((b) => { b.style.minWidth = "0"; row.appendChild(b); });
  const hint = el("p", "", "Yan yana iki şekere dokun ya da parmağınla kaydırıp yer değiştir. Aynı renkten 3 şeker patlatınca hedef ilerler. 4'lü eşleşme çizgili şeker yapar (satırı ya da sütunu temizler), 5'li eşleşme renk bombası yapar: onu yanındaki bir şekerle değiştirirsen o renkteki tüm şekerler patlar. 🟦 Mavi kareler jöle: üstündeki şekeri patlatınca temizlenir. Hamle bitmeden hedefleri tamamla!");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  g = new Array(N * N).fill(null);
  nextB.style.display = "none"; retryB.style.display = "none";
  load(1);
  last = performance.now();
  raf = requestAnimationFrame(loop);
  return () => { killed = true; dead = true; cancelAnimationFrame(raf); };
}

export const SOLO = {
  candy3d: { group: "Zeka", icon: "🍭", label: "Şeker Patlatma 3D", start: candy3d }
};
