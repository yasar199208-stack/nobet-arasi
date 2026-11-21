// Aksiyon oyunları 16: Bisiklet Yarışı 3D (tekli parkur + arkadaşla zaman yarışı)
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function put(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
const mul32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const fmt = (t) => (t / 10).toFixed(1) + " sn";
const THEMES = [
  { n: "Orman", t: "#3d9bff", b: "#d6efff", g1: "#2f9a45", g2: "#298a3e", r1: "#9a8466", r2: "#917c5f", tree: ["#1f6b34", "#2c8a45"], night: false, mt: "#7fa6c8", mt2: "#6a93b5", sun: "#fff7c9", sunLow: false },
  { n: "Çöl", t: "#4aa8ff", b: "#ffe9b8", g1: "#e0c279", g2: "#d6b66c", r1: "#b58a5a", r2: "#ad8353", tree: ["#6b8a3a", "#86a64a"], night: false, mt: "#c99a6a", mt2: "#b8895a", sun: "#fff0b0", sunLow: false },
  { n: "Sonbahar", t: "#6f8fd8", b: "#ffd9a8", g1: "#8a9a3a", g2: "#7e8c33", r1: "#8a7058", r2: "#826a52", tree: ["#c4561f", "#e08a2a"], night: false, mt: "#a07a6a", mt2: "#8a6659", sun: "#ffe3a0", sunLow: false },
  { n: "Kar", t: "#8fb4e8", b: "#f0f6ff", g1: "#eef3fa", g2: "#e1e9f3", r1: "#9aa3b2", r2: "#939cab", tree: ["#2f6b52", "#3f8a69"], night: false, mt: "#c9d6ea", mt2: "#b7c6de", sun: "#ffffff", sunLow: false },
  { n: "Gün batımı", t: "#35255f", b: "#ff9d5c", g1: "#2d7a3a", g2: "#276d34", r1: "#6a5a66", r2: "#625260", tree: ["#1c4f2c", "#276b3a"], night: false, mt: "#5b3a6e", mt2: "#44284f", sun: "#ffd27a", sunLow: true },
  { n: "Gece", t: "#04060f", b: "#1b2556", g1: "#12331d", g2: "#0f2c19", r1: "#33333f", r2: "#2e2e3a", tree: ["#0e2a1a", "#143a24"], night: true, mt: "#0c1230", mt2: "#09102a", sun: "#e9ecf5", sunLow: false }
];

export function bikeGame(o) {
  const el = o.el, act = o.act;
  const W = 360, H = 500, HY = 200, SL = 200, RW = 900, CAMH = 1000, CD = 0.84, DRAW = 130, ZP = 800, N = 420;
  const level = Math.max(1, o.level || 1), th = THEMES[(o.theme != null ? o.theme : level - 1) % 6];
  const len = o.len || Math.min(280000, 140000 + 14000 * Math.min(level, 10));
  const cruise = 3000 + Math.min(level, 10) * 140;
  const seed = o.seed || 12345;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const root = el("div", "");
  const cvs = el("canvas", "");
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.cssText = "display:block;width:100%;max-width:360px;margin:0 auto 8px;touch-action:none;user-select:none;border-radius:12px";
  root.appendChild(cvs);
  const ctx = cvs.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rnd = mul32(seed * 31 + level * 7);

  // yol virajları
  const segs = new Array(N).fill(0);
  (function build() {
    let i = 0;
    while (i < N) {
      const straight = 12 + Math.floor(rnd() * 24);
      for (let k = 0; k < straight && i < N; k++, i++) segs[i] = 0;
      const e = 14 + Math.floor(rnd() * 14), h = 20 + Math.floor(rnd() * 40), l = 14 + Math.floor(rnd() * 14);
      const c = (rnd() < 0.5 ? -1 : 1) * (0.8 + rnd() * (1.2 + level * 0.1));
      const tot = e + h + l;
      for (let k = 0; k < tot && i < N; k++, i++) segs[i] = k < e ? c * (k / e) : k >= e + h ? c * (1 - (k - e - h) / l) : c;
    }
  })();
  const curveAt = (z) => segs[((Math.floor(z / SL) % N) + N) % N];

  // engeller
  const obs = [];
  (function gen() {
    let z = 16000;
    while (z < len - 6000) {
      const r = rnd(), kind = r < 0.3 ? "log" : r < 0.56 ? "rock" : r < 0.78 ? "puddle" : "boost";
      const ob = { z: z, o: (rnd() * 2 - 1) * 0.78, k: kind, w: kind === "log" && rnd() < 0.4 ? 2 : 1, done: false };
      if (ob.w === 2) ob.o = 0;
      obs.push(ob);
      if (level >= 3 && kind === "rock" && rnd() < 0.4) obs.push({ z: z, o: ob.o > 0 ? ob.o - 0.7 : ob.o + 0.7, k: "rock", w: 1, done: false });
      z += Math.max(1800, (4600 - Math.min(level, 10) * 260) * (0.75 + rnd() * 0.5));
    }
  })();
  // rakipler (sadece tekli)
  const rv = o.rivals ? [0, 1, 2].map((i) => ({ v: cruise * (0.9 + 0.055 * i + 0.01 * Math.min(level, 10)), ph: rnd() * 6, lane: [-0.5, 0.1, 0.55][i], col: ["#e8b923", "#2fb36d", "#d94141"][i] })) : [];

  let pos = 0, speed = 0, px = 0, lean = 0, energy = 1, jumpT = 0, stun = 0, slowT = 0, boostT = 0, time = 0, state = "ready", cd = 3.2, shake = 0, msg = "", msgT = 0, di = 0, oi = 0, ftime = 0, rank = 1, fin = false, dead = false, raf, last, goneSince = 0, ph = 0, bgOff = 0, steerL = false, steerR = false, brake = false, sprint = false;
  const keys = {}, ptr = {};
  const rz = (i) => 350 + i * 300 + rv[i].v * time + 250 * Math.sin(time * 0.3 + rv[i].ph);
  const rankNow = () => 1 + rv.filter((r, i) => rz(i) > pos).length;

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }
  function quad(x1, y1, x2, y2, x3, y3, x4, y4, col) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill();
  }
  function drawRider(cx, by, k, jersey, ln, phase, lift, helmet) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath(); ctx.ellipse(cx, by + 2 * k, 22 * k, 6 * k, 0, 0, 7); ctx.fill();
    ctx.translate(cx, by - lift); ctx.rotate(ln);
    ctx.fillStyle = "#0e0f12";
    ctx.beginPath(); ctx.ellipse(0, -17 * k, 4.5 * k, 17 * k, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#6b7280";
    ctx.beginPath(); ctx.ellipse(0, -17 * k, 1.6 * k, 15 * k, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#3a3f47"; ctx.lineWidth = 3 * k; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, -30 * k); ctx.lineTo(0, -48 * k); ctx.stroke();
    ctx.fillStyle = "#111";
    rr(-7 * k, -52 * k, 14 * k, 6 * k, 3 * k); ctx.fill();
    [0, 1].forEach((s) => {
      const sx = s ? 1 : -1, fy = -27 * k + 9 * k * Math.sin(phase + s * Math.PI), hipY = -60 * k, kneeY = (hipY + fy) / 2 - 4 * k;
      ctx.strokeStyle = "#232834"; ctx.lineWidth = 6 * k;
      ctx.beginPath(); ctx.moveTo(sx * 5 * k, hipY); ctx.lineTo(sx * 12 * k, kneeY); ctx.lineTo(sx * 8 * k, fy); ctx.stroke();
      ctx.fillStyle = "#15171b"; rr(sx * 8 * k - 5 * k, fy - 2 * k, 10 * k, 5 * k, 2 * k); ctx.fill();
    });
    const g = ctx.createLinearGradient(-11 * k, 0, 11 * k, 0);
    g.addColorStop(0, jersey); g.addColorStop(0.5, "#ffffff55"); g.addColorStop(1, jersey);
    ctx.fillStyle = jersey; rr(-11 * k, -92 * k, 22 * k, 36 * k, 8 * k); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(-2 * k, -88 * k, 4 * k, 28 * k);
    ctx.strokeStyle = jersey; ctx.lineWidth = 5 * k;
    ctx.beginPath(); ctx.moveTo(-10 * k, -86 * k); ctx.lineTo(-20 * k, -68 * k); ctx.moveTo(10 * k, -86 * k); ctx.lineTo(20 * k, -68 * k); ctx.stroke();
    ctx.fillStyle = "#15171b"; ctx.fillRect(-23 * k, -71 * k, 46 * k, 4 * k);
    ctx.fillStyle = "#e0b090"; ctx.fillRect(-3 * k, -96 * k, 6 * k, 6 * k);
    ctx.fillStyle = helmet || "#ffffff"; ctx.beginPath(); ctx.arc(0, -101 * k, 9.5 * k, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fillRect(-1.5 * k, -110 * k, 3 * k, 10 * k);
    ctx.restore();
  }
  function drawTree(x, y, w, type, h) {
    if (w < 2) return;
    if (type < 2) {
      const H1 = w * (0.7 + (h % 5) * 0.06);
      ctx.fillStyle = "#4a3320"; ctx.fillRect(x - w * 0.025, y - H1 * 0.32, w * 0.05, H1 * 0.32);
      ctx.fillStyle = th.tree[0];
      ctx.beginPath(); ctx.moveTo(x - H1 * 0.28, y - H1 * 0.25); ctx.lineTo(x + H1 * 0.28, y - H1 * 0.25); ctx.lineTo(x, y - H1 * 0.75); ctx.fill();
      ctx.fillStyle = th.tree[1];
      ctx.beginPath(); ctx.moveTo(x - H1 * 0.22, y - H1 * 0.5); ctx.lineTo(x + H1 * 0.22, y - H1 * 0.5); ctx.lineTo(x, y - H1); ctx.fill();
      if (th.n === "Kar") { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x - H1 * 0.08, y - H1 * 0.88); ctx.lineTo(x + H1 * 0.08, y - H1 * 0.88); ctx.lineTo(x, y - H1); ctx.fill(); }
    } else if (type === 2) {
      ctx.fillStyle = th.tree[0]; ctx.beginPath(); ctx.ellipse(x, y - w * 0.07, w * 0.14, w * 0.09, 0, 0, 7); ctx.fill();
      ctx.fillStyle = th.tree[1]; ctx.beginPath(); ctx.ellipse(x - w * 0.03, y - w * 0.1, w * 0.1, w * 0.06, 0, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = "#7d828c"; ctx.beginPath(); ctx.ellipse(x, y - w * 0.06, w * 0.13, w * 0.09, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#a3a8b2"; ctx.beginPath(); ctx.ellipse(x - w * 0.03, y - w * 0.09, w * 0.07, w * 0.04, 0, 0, 7); ctx.fill();
    }
  }
  function drawObs(ob, x, y, hp) {
    const w = hp * 0.32;
    if (w < 2) return;
    if (ob.k === "log") {
      const ww = ob.w === 2 ? hp * 1.15 : w;
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(x, y, ww * 0.55, ww * 0.09, 0, 0, 7); ctx.fill();
      const g = ctx.createLinearGradient(0, y - w * 0.3, 0, y);
      g.addColorStop(0, "#b07a45"); g.addColorStop(1, "#6a4424");
      ctx.fillStyle = g; rr(x - ww / 2, y - w * 0.3, ww, w * 0.3, w * 0.12); ctx.fill();
      ctx.fillStyle = "#d9a86d"; ctx.beginPath(); ctx.ellipse(x - ww / 2, y - w * 0.15, w * 0.08, w * 0.15, 0, 0, 7); ctx.fill();
    } else if (ob.k === "rock") {
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(x, y, w * 0.55, w * 0.1, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#6f747e";
      ctx.beginPath(); ctx.moveTo(x - w * 0.5, y); ctx.lineTo(x - w * 0.35, y - w * 0.45); ctx.lineTo(x - w * 0.05, y - w * 0.7); ctx.lineTo(x + w * 0.35, y - w * 0.5); ctx.lineTo(x + w * 0.5, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#9097a3";
      ctx.beginPath(); ctx.moveTo(x - w * 0.35, y - w * 0.45); ctx.lineTo(x - w * 0.05, y - w * 0.7); ctx.lineTo(x + w * 0.05, y - w * 0.35); ctx.closePath(); ctx.fill();
    } else if (ob.k === "puddle") {
      ctx.fillStyle = "rgba(60,130,200,.7)"; ctx.beginPath(); ctx.ellipse(x, y - w * 0.05, w * 0.75, w * 0.17, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.ellipse(x - w * 0.2, y - w * 0.08, w * 0.25, w * 0.04, 0, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = "rgba(255,200,40,.35)"; ctx.beginPath(); ctx.ellipse(x, y - w * 0.05, w * 0.8, w * 0.22, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#ffcc2e"; ctx.beginPath(); ctx.ellipse(x, y - w * 0.05, w * 0.55, w * 0.14, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x - w * 0.25, y - w * 0.02); ctx.lineTo(x, y - w * 0.14); ctx.lineTo(x + w * 0.25, y - w * 0.02); ctx.lineTo(x, y - w * 0.07); ctx.closePath(); ctx.fill();
    }
  }

  function crash(txt) {
    speed *= 0.35; stun = 0.55; shake = 0.4; msg = txt; msgT = 1.1; jumpT = 0;
  }
  function update(dt) {
    ph += dt * (3 + speed / 450);
    if (msgT > 0) msgT -= dt;
    if (shake > 0) shake -= dt;
    if (state === "count") {
      cd -= dt;
      if (cd <= 0) { state = "race"; msg = "BAŞLA!"; msgT = 0.9; speed = cruise * 0.5; }
      return;
    }
    if (state === "ready") return;
    let dir = 0;
    if (state === "race" && stun <= 0) {
      if (steerL || keys.ArrowLeft || keys.a) dir -= 1;
      if (steerR || keys.ArrowRight || keys.d) dir += 1;
    }
    const spr = state === "race" && (sprint || keys.ArrowUp || keys.w), br = state === "race" && (brake || keys.ArrowDown || keys.s);
    if (state === "race") time += dt;
    const sp = Math.min(1.3, speed / (cruise * 1.4));
    px += dir * dt * 1.7 * (0.6 + 0.4 * sp);
    px -= dt * 2.2 * sp * sp * curveAt(pos + ZP) * 0.19;
    const off = Math.abs(px) > 1.02;
    if (px < -1.35) px = -1.35;
    if (px > 1.35) px = 1.35;
    let tgt = cruise;
    if (state === "done") tgt = 0;
    else {
      if (boostT > 0) tgt = cruise * 1.45;
      if (spr && energy > 0.02) { tgt = Math.max(tgt, cruise * 1.32); energy -= dt * 0.28; }
      else energy = Math.min(1, energy + dt * 0.09);
      if (slowT > 0) tgt = Math.min(tgt, cruise * 0.55);
      if (off) tgt = Math.min(tgt, 1300);
      if (stun > 0) tgt = Math.min(tgt, 600);
      if (br) tgt = Math.min(tgt, 1200);
    }
    if (speed < tgt) speed += (boostT > 0 ? 3200 : 1800) * dt; else speed -= ((br || state === "done") ? 4200 : off ? 3500 : 1500) * dt;
    if (speed < 0) speed = 0;
    if (off && state === "race") shake = Math.max(shake, 0.12);
    if (stun > 0) stun -= dt;
    if (slowT > 0) slowT -= dt;
    if (boostT > 0) boostT -= dt;
    if (jumpT > 0) { jumpT += dt; if (jumpT > 0.75) jumpT = 0; }
    lean += (dir * 0.2 - lean) * Math.min(1, dt * 8);
    pos += speed * dt;
    const h = jumpT > 0 ? Math.sin(Math.PI * jumpT / 0.75) : 0;
    const pz = pos + ZP;
    while (oi < obs.length && obs[oi].z - pz <= 0) {
      const ob = obs[oi++];
      if (state !== "race") continue;
      const lim = (ob.k === "log" ? (ob.w === 2 ? 0.62 : 0.2) : ob.k === "rock" ? 0.17 : ob.k === "puddle" ? 0.26 : 0.24);
      if (Math.abs(px - ob.o) >= lim) continue;
      if (ob.k === "log") { if (h > 0.3) { msg = "Güzel atlayış!"; msgT = 0.8; } else crash("Kütüğe çarptın!"); }
      else if (ob.k === "rock") crash("Kayaya çarptın!");
      else if (ob.k === "puddle") { if (h <= 0.3) { slowT = 1.2; msg = "Su birikintisi"; msgT = 0.8; } }
      else { boostT = 1.6; msg = "Hız bonusu! 🔥"; msgT = 0.9; }
    }
    if (state === "race" && pos >= len) {
      state = "done"; ftime = time; rank = rv.length ? 1 + rv.filter((r, i) => rz(i) >= len).length : 1; fin = true;
      if (o.onFinish) o.onFinish({ t: Math.round(time * 10), rank: rank });
    }
  }

  function render() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 8 * Math.min(1, shake * 3), (Math.random() - 0.5) * 6 * Math.min(1, shake * 3));
    const sky = ctx.createLinearGradient(0, 0, 0, HY);
    sky.addColorStop(0, th.t); sky.addColorStop(1, th.b);
    ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, HY + 10);
    if (th.night) {
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.4 + (i % 3) * 0.2; ctx.fillRect((i * 97) % W, (i * 53) % (HY - 40), 1.5, 1.5); }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = th.sun; ctx.beginPath(); ctx.arc(th.sunLow ? 90 : 270, th.sunLow ? HY - 30 : 56, 20, 0, 7); ctx.fill();
    const base = Math.floor(pos / SL), pct = (pos % SL) / SL;
    bgOff = (bgOff + curveAt(pos + ZP) * speed * 0.00004 + 360) % 360;
    ctx.fillStyle = th.mt;
    ctx.beginPath(); ctx.moveTo(0, HY);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, HY - 28 - 22 * Math.sin((x + bgOff * 6) * 0.03) - 12 * Math.sin((x + bgOff * 6) * 0.09));
    ctx.lineTo(W + 20, HY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = th.mt2;
    ctx.beginPath(); ctx.moveTo(0, HY);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, HY - 12 - 10 * Math.sin((x + bgOff * 10) * 0.05 + 2));
    ctx.lineTo(W + 20, HY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = th.g1; ctx.fillRect(-10, HY, W + 20, H - HY + 10);
    const xs = [], ys = [], ws = [], ss = [];
    let x = 0, dx = -curveAt(base * SL) * pct;
    const pxw = px * RW;
    for (let n = 0; n <= DRAW; n++) {
      const z = Math.max(40, n * SL - pct * SL), s = CD / z;
      xs.push(x); ss.push(s); ys.push(HY + s * CAMH * H / 2); ws.push(s * RW * W / 2);
      x += dx; dx += segs[(base + n) % N];
    }
    const cxs = (n, off) => W / 2 + ss[n] * (xs[n] + off * RW - pxw) * W / 2;
    const bucket = {};
    while (di < obs.length && obs[di].z < pos + SL) di++;
    for (let k = di; k < obs.length && obs[k].z - pos < (DRAW - 1) * SL; k++) {
      const r = obs[k].z - pos, f = (r + pct * SL) / SL, n = Math.floor(f);
      if (n < 1 || n >= DRAW - 1) continue;
      (bucket[n] = bucket[n] || []).push({ ob: obs[k], t: f - n, rz: r, rv: null });
    }
    rv.forEach((r, i) => {
      const d = rz(i) - pos, f = (d + pct * SL) / SL, n = Math.floor(f);
      if (n < 1 || n >= DRAW - 1) return;
      (bucket[n] = bucket[n] || []).push({ ob: null, t: f - n, rz: d, rv: r, i: i });
    });
    const finI = Math.floor(len / SL);
    for (let n = DRAW - 1; n >= 0; n--) {
      const i = base + n, band = Math.floor(i / 3) % 2 === 0;
      const y1 = ys[n], y2 = ys[n + 1];
      if (y1 > y2 - 0.01 && y1 - y2 < 0.01 && n > 0) continue;
      const x1 = cxs(n, 0), x2 = cxs(n + 1, 0), w1 = ws[n], w2 = ws[n + 1];
      ctx.fillStyle = band ? th.g1 : th.g2;
      ctx.fillRect(-10, y2, W + 20, y1 - y2 + 1);
      quad(x1 - w1 * 1.08, y1, x1 + w1 * 1.08, y1, x2 + w2 * 1.08, y2, x2 - w2 * 1.08, y2, band ? "#d8d2c4" : "#b9b2a2");
      quad(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, band ? th.r1 : th.r2);
      if (band) {
        const lw1 = w1 * 0.018, lw2 = w2 * 0.018;
        quad(x1 - lw1, y1, x1 + lw1, y1, x2 + lw2, y2, x2 - lw2, y2, "rgba(255,255,255,.55)");
      }
      if (i === finI || i === finI + 1) {
        for (let c = 0; c < 10; c++) {
          const a1 = -1 + c * 0.2, a2 = a1 + 0.2, dark = (c + i) % 2;
          quad(x1 + w1 * a1, y1, x1 + w1 * a2, y1, x2 + w2 * a2, y2, x2 + w2 * a1, y2, dark ? "#111" : "#fff");
        }
      }
      const hh = ((i * 2654435761 + seed * 40503) >>> 0);
      if (hh % 5 < 3) {
        const side = hh & 8 ? 1 : -1, offs = 1.2 + ((hh >>> 5) % 100) / 100 * 1.4;
        const sx = cxs(n, side * offs);
        drawTree(sx, y1, w1, (hh >>> 12) % 4, hh >>> 17);
        if (hh % 5 === 0) { const sx2 = cxs(n, -side * (offs + 0.6)); drawTree(sx2, y1, w1, (hh >>> 14) % 4, hh >>> 19); }
      }
      const bk = bucket[n];
      if (bk) {
        bk.sort((a, b) => b.rz - a.rz);
        bk.forEach((e) => {
          const z = Math.max(40, e.rz), s = CD / z, xi = xs[n] + (xs[n + 1] - xs[n]) * e.t, sy = HY + s * CAMH * H / 2, hp = s * RW * W / 2;
          if (sy > H + 60) return;
          if (e.ob) drawObs(e.ob, W / 2 + s * (xi + e.ob.o * RW - pxw) * W / 2, sy, hp);
          else {
            const lane = e.rv.lane + Math.sin(time * 0.7 + e.rv.ph) * 0.08;
            drawRider(W / 2 + s * (xi + lane * RW - pxw) * W / 2, sy, Math.max(0.05, hp * 0.0042), e.rv.col, 0, ph * 0.8 + e.i, 0, "#222");
          }
        });
      }
    }
    const fog = ctx.createLinearGradient(0, HY - 2, 0, HY + 60);
    fog.addColorStop(0, th.b); fog.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.85; ctx.fillStyle = fog; ctx.fillRect(-10, HY - 2, W + 20, 62); ctx.globalAlpha = 1;
    if (speed > cruise * 1.2) {
      ctx.strokeStyle = "rgba(255,255,255,.28)"; ctx.lineWidth = 2;
      for (let k = 0; k < 8; k++) {
        const a = (performance.now() * 0.002 + k * 0.37) % 1, lx = k % 2 ? 30 + k * 10 : W - 30 - k * 10, ly = HY + 60 + a * 240;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + (lx < W / 2 ? -1 : 1) * (6 + a * 28), ly + 16 + a * 40); ctx.stroke();
      }
    }
    const h = jumpT > 0 ? Math.sin(Math.PI * jumpT / 0.75) : 0;
    const wob = stun > 0 ? Math.sin(time * 40) * 0.25 : 0;
    drawRider(W / 2, 478, 1, "#1c6ef2", lean + wob, ph, h * 70, "#ffffff");
    // HUD
    ctx.fillStyle = "rgba(0,0,0,.45)"; rr(8, 8, 112, 36, 8); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 20px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(Math.round(speed / 130) + " km/h", 16, 33);
    ctx.fillStyle = "rgba(0,0,0,.45)"; rr(W - 118, 8, 110, 36, 8); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 18px sans-serif"; ctx.textAlign = "right";
    ctx.fillText("⏱ " + ((state === "done" ? ftime : time)).toFixed(1), W - 16, 32);
    if (rv.length) { ctx.textAlign = "center"; ctx.fillStyle = "rgba(0,0,0,.45)"; rr(W / 2 - 34, 8, 68, 36, 8); ctx.fill(); ctx.fillStyle = "#ffd23a"; ctx.font = "bold 18px sans-serif"; ctx.fillText("🏁 " + (state === "done" ? rank : rankNow()) + "/4", W / 2, 33); }
    ctx.fillStyle = "rgba(0,0,0,.45)"; rr(8, 52, W - 16, 10, 5); ctx.fill();
    const prog = Math.min(1, pos / len);
    rv.forEach((r, i) => { ctx.fillStyle = r.col; ctx.beginPath(); ctx.arc(14 + Math.min(1, rz(i) / len) * (W - 28), 57, 3.5, 0, 7); ctx.fill(); });
    ctx.fillStyle = "#4fb3ff"; ctx.beginPath(); ctx.arc(14 + prog * (W - 28), 57, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.45)"; rr(8, 68, 100, 14, 6); ctx.fill();
    ctx.fillStyle = sprint ? "#ffb02e" : "#4fb3ff"; rr(10, 70, 96 * Math.max(0, energy), 10, 4); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "9px sans-serif"; ctx.textAlign = "center"; ctx.fillText("ENERJİ", 58, 79);
    if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT * 1.5); ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 4; ctx.font = "bold 24px sans-serif"; ctx.textAlign = "center"; ctx.strokeText(msg, W / 2, 130); ctx.fillText(msg, W / 2, 130); ctx.globalAlpha = 1; }
    if (state === "ready") {
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 150, W, 130);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 28px sans-serif"; ctx.fillText("Parkur: " + th.n, W / 2, 195);
      ctx.font = "16px sans-serif"; ctx.fillText(((len / 100) | 0) + " metre yarış", W / 2, 224);
      ctx.fillStyle = "#ffd23a"; ctx.font = "bold 18px sans-serif"; ctx.fillText("Başlamak için ekrana dokun", W / 2, 258);
    } else if (state === "count") {
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 6; ctx.textAlign = "center"; ctx.font = "bold 90px sans-serif";
      const t = Math.ceil(cd); ctx.strokeText(String(t), W / 2, 230); ctx.fillText(String(t), W / 2, 230);
    } else if (state === "done") {
      ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 150, W, 140);
      ctx.fillStyle = "#ffd23a"; ctx.textAlign = "center"; ctx.font = "bold 32px sans-serif"; ctx.fillText("Bitiş! 🏁", W / 2, 198);
      ctx.fillStyle = "#fff"; ctx.font = "20px sans-serif"; ctx.fillText("Süre: " + fmt(Math.round(ftime * 10)), W / 2, 232);
      if (rv.length) { ctx.font = "16px sans-serif"; ctx.fillText(rank + ". oldun" + (rank <= 3 ? " — sonraki parkur açıldı!" : " — ilk 3'e girmelisin"), W / 2, 262); }
    }
    ctx.restore();
  }
  function destroy() {
    if (dead) return;
    dead = true; cancelAnimationFrame(raf);
    window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku);
  }
  function loop(t) {
    if (dead) return;
    if (!root.isConnected) {
      if (!goneSince) goneSince = t;
      else if (t - goneSince > 3000) { destroy(); return; }
      last = t; raf = requestAnimationFrame(loop); return;
    }
    goneSince = 0;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    update(dt); render();
    raf = requestAnimationFrame(loop);
  }
  function side() { steerL = false; steerR = false; Object.keys(ptr).forEach((k) => { if (ptr[k] < 0) steerL = true; else steerR = true; }); }
  const pside = (e) => ((e.clientX - cvs.getBoundingClientRect().left) < cvs.getBoundingClientRect().width / 2 ? -1 : 1);
  cvs.onpointerdown = (e) => {
    if (state === "ready") { state = "count"; cd = 3.2; return; }
    try { cvs.setPointerCapture(e.pointerId); } catch (x) {}
    ptr[e.pointerId] = pside(e); side();
  };
  cvs.onpointermove = (e) => { if (ptr[e.pointerId] !== undefined) { ptr[e.pointerId] = pside(e); side(); } };
  const up = (e) => { delete ptr[e.pointerId]; side(); };
  cvs.onpointerup = up; cvs.onpointercancel = up;
  const kd = (e) => {
    if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); jump(); return; }
    if (state === "ready" && e.key === "Enter") { state = "count"; cd = 3.2; }
    keys[e.key] = true;
  };
  const ku = (e) => { keys[e.key] = false; };
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
  function jump() { if (state === "race" && jumpT <= 0 && stun <= 0) jumpT = 0.0001; }
  function hold(label, setf) {
    const b = el("button", "", label);
    b.type = "button";
    b.style.cssText = "flex:1;padding:14px 4px;font-weight:700;font-size:15px;touch-action:none;user-select:none;min-width:0";
    b.onpointerdown = (e) => { try { b.setPointerCapture(e.pointerId); } catch (x) {} setf(true); };
    const off = () => setf(false);
    b.onpointerup = off; b.onpointercancel = off; b.onpointerleave = off;
    return b;
  }
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px;margin:0 auto 6px;max-width:360px";
  row.appendChild(hold("🛑 Fren", (v) => { brake = v; }));
  row.appendChild(hold("🔥 Sprint", (v) => { sprint = v; }));
  const jb = el("button", "", "⬆ Zıpla");
  jb.type = "button";
  jb.style.cssText = "flex:1;padding:14px 4px;font-weight:700;font-size:15px;touch-action:none;user-select:none;min-width:0";
  jb.onpointerdown = (e) => { e.preventDefault(); jump(); };
  row.appendChild(jb);
  root.appendChild(row);
  last = performance.now();
  raf = requestAnimationFrame(loop);
  return { root: root, destroy: destroy, get dead() { return dead; }, theme: th.n, len: len };
}

/* ---------- Tekli: parkurlar ---------- */
function bike(body, el, act) {
  let inst = null, level = 1, unlocked = Math.max(1, best("nb_bike3")), passed = false, gone = false;
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 4px;font-size:15px";
  body.appendChild(info);
  const sub = el("p", "", "");
  sub.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)";
  body.appendChild(sub);
  const box = el("div", "");
  body.appendChild(box);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  body.appendChild(row);
  const bT = (n) => best("nb_bike3_t" + n);
  function head() {
    const t = bT(level);
    info.textContent = "Parkur " + level + " • " + inst.theme;
    sub.textContent = "Açık parkur: " + unlocked + "   En iyi süre: " + (t ? fmt(t) : "-") + "   Rakip: 3 bisikletçi";
    nextB.style.display = unlocked > level ? "" : "none";
  }
  function load(n) {
    if (inst) inst.destroy();
    box.textContent = "";
    level = Math.max(1, Math.min(n, unlocked));
    inst = bikeGame({
      el: el, act: act, level: level, seed: level * 7919 + 13, rivals: true,
      onFinish: (r) => {
        const t = bT(level);
        if (!t || r.t < t) put("nb_bike3_t" + level, r.t);
        if (r.rank <= 3 && level + 1 > unlocked) { unlocked = level + 1; put("nb_bike3", unlocked); }
        head();
      }
    });
    box.appendChild(inst.root);
    head();
  }
  const bPrev = act("◀", () => load(level - 1));
  const bNext = act("▶", () => load(level + 1));
  const retryB = act("Tekrar", () => load(level));
  const nextB = act("Sonraki parkur ▶", () => load(level + 1));
  [bPrev, bNext, retryB, nextB].forEach((b) => { b.style.minWidth = "0"; row.appendChild(b); });
  const hint = el("p", "", "Ekranın sol yarısına basılı tut: sola, sağ yarısına basılı tut: sağa. Kütüklerin üstünden ⬆ Zıpla ile atla, kayalardan kaç, su birikintisi seni yavaşlatır, sarı ok pedleri hız verir. 🔥 Sprint enerjini harcar. Viraj sert gelirse 🛑 Fren'e bas, yoldan çıkma. Rakiplerin arasında ilk 3'e girersen sonraki parkur açılır. Parkurlar kolaydan zora gider.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  load(1);
  return () => { gone = true; if (inst) inst.destroy(); };
}

export const SOLO = {
  bike3d: { group: "Aksiyon", icon: "🚴", label: "Bisiklet Yarışı 3D", start: bike }
};
