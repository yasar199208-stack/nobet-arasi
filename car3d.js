// Aksiyon oyunları 17: Turbo Yarış 3D (tepeli-virajlı pist, 5 rakip, 3 tur, nitro)
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function put(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
const mul32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const fmt = (t) => { const s = t / 10, m = Math.floor(s / 60); return (m ? m + ":" : "") + (m ? (s - m * 60).toFixed(1).padStart(4, "0") : s.toFixed(1)) + (m ? "" : " sn"); };
const THEMES = [
  { n: "Orman", t: "#3d9bff", b: "#d6efff", g1: "#2f9a45", g2: "#298a3e", r1: "#4a4a54", r2: "#44444e", scn: "pine", tree: ["#1f6b34", "#2c8a45"], night: false, mt: "#7fa6c8", mt2: "#6a93b5", sun: "#fff7c9", low: false },
  { n: "Çöl", t: "#4aa8ff", b: "#ffe9b8", g1: "#e0c279", g2: "#d6b66c", r1: "#4d4a4a", r2: "#474444", scn: "cactus", tree: ["#4f8a3a", "#6aa84a"], night: false, mt: "#c99a6a", mt2: "#b8895a", sun: "#fff0b0", low: false },
  { n: "Şehir (gece)", t: "#04060f", b: "#222a5e", g1: "#1c2230", g2: "#181d2a", r1: "#2d2d38", r2: "#282832", scn: "city", tree: ["#2a3350", "#394570"], night: true, mt: "#10152e", mt2: "#0b1024", sun: "#e9ecf5", low: false },
  { n: "Kar", t: "#8fb4e8", b: "#f0f6ff", g1: "#eef3fa", g2: "#e1e9f3", r1: "#59606e", r2: "#535a68", scn: "pine", tree: ["#2f6b52", "#3f8a69"], night: false, mt: "#c9d6ea", mt2: "#b7c6de", sun: "#ffffff", low: false, snow: true },
  { n: "Sahil (gün batımı)", t: "#35255f", b: "#ff9d5c", g1: "#d9b87a", g2: "#cfae70", r1: "#5a4e58", r2: "#524651", scn: "palm", tree: ["#1c6b3a", "#2f9a52"], night: false, mt: "#5b3a6e", mt2: "#44284f", sun: "#ffd27a", low: true },
  { n: "Neon gece", t: "#05020f", b: "#3a1466", g1: "#120a26", g2: "#0e081f", r1: "#241c38", r2: "#1f1832", scn: "neon", tree: ["#ff3df0", "#35e6ff"], night: true, mt: "#1a0d38", mt2: "#12082a", sun: "#ff7ad9", low: false }
];
const CARCOL = ["#1c6ef2", "#d9342b", "#2fb36d", "#f0b323", "#8e5bd6", "#f08a24"];
const AICOL = ["#e8e8ee", "#222831", "#d9342b", "#2fb36d", "#f0b323", "#8e5bd6", "#1c6ef2", "#f08a24"];

export function carGame(o) {
  const el = o.el;
  const W = 360, H = 520, HY = 205, SL = 200, RW = 900, CAMH = 1000, CD = 0.84, DRAW = 115, ZP = 820, N = 480, LAP = N * SL, LAPS = 3;
  const level = Math.max(1, o.level || 1), th = THEMES[(level - 1) % 6];
  const maxSp = 5200 + Math.min(level, 10) * 80, seed = o.seed || 4321, TOTAL = LAPS * LAP;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const root = el("div", "");
  const cvs = el("canvas", "");
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.cssText = "display:block;width:100%;max-width:360px;margin:0 auto 8px;touch-action:none;user-select:none;border-radius:12px";
  root.appendChild(cvs);
  const ctx = cvs.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rnd = mul32(seed * 17 + level * 101);

  const segs = new Array(N).fill(0);
  (function build() {
    let i = 0;
    while (i < N - 30) {
      const st = 8 + Math.floor(rnd() * 18);
      for (let k = 0; k < st && i < N - 30; k++, i++) segs[i] = 0;
      const e = 12 + Math.floor(rnd() * 12), h = 16 + Math.floor(rnd() * 34), l = 12 + Math.floor(rnd() * 12);
      const c = (rnd() < 0.5 ? -1 : 1) * (0.9 + rnd() * (1.1 + Math.min(level, 10) * 0.1));
      const tot = e + h + l;
      for (let k = 0; k < tot && i < N - 30; k++, i++) segs[i] = k < e ? c * (k / e) : k >= e + h ? c * (1 - (k - e - h) / l) : c;
    }
  })();
  const curveAt = (z) => segs[((Math.floor(z / SL) % N) + N) % N];
  const hp = [{ k: 2 + Math.floor(rnd() * 2), a: 360 + level * 22, p: rnd() * 6.28 }, { k: 5 + Math.floor(rnd() * 3), a: 160, p: rnd() * 6.28 }, { k: 9 + Math.floor(rnd() * 4), a: 60, p: rnd() * 6.28 }];
  const hillAt = (z) => { let y = 0; for (let i = 0; i < 3; i++) y += hp[i].a * Math.sin(6.2832 * hp[i].k * z / LAP + hp[i].p); return y; };

  const LANES = [-0.55, 0.45, -0.15, 0.62, -0.62];
  const ai = [0, 1, 2, 3, 4].map((i) => ({ z: ZP + 450 + i * 480, sp: 0, lane: LANES[i], tl: LANES[i], t: 2 + Math.random() * 3, f: Math.min(1.03, 0.84 + 0.028 * i + 0.01 * Math.min(level, 10)), col: AICOL[(i + level) % AICOL.length], bump: 0, ph: Math.random() * 6 }));
  const colOf = () => (o.color ? o.color() : CARCOL[0]);

  let pos = 0, speed = 0, px = 0, lean = 0, nitro = 1, nOn = false, state = "ready", cd = 3.2, time = 0, shake = 0, msg = "", msgT = 0, lap = 1, lapStart = 0, laps = [], ftime = 0, rank = 1, dead = false, raf, last, goneSince = 0, bob = 0, steerL = false, steerR = false, bgOff = 0, wheel = 0;
  const keys = {}, ptr = {};
  const rankNow = () => 1 + ai.filter((a) => a.z - ZP > pos).length;

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
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
    return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
  }
  function drawCar(x, y, w, col, o2) {
    if (w < 3) return;
    const h = w * 0.62, br = o2 && o2.brake, nt = o2 && o2.nitro;
    ctx.fillStyle = "rgba(0,0,0,.38)";
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.6, w * 0.1, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#0b0c10";
    rr(x - w * 0.52, y - h * 0.34, w * 0.17, h * 0.34, w * 0.03); ctx.fill();
    rr(x + w * 0.35, y - h * 0.34, w * 0.17, h * 0.34, w * 0.03); ctx.fill();
    ctx.fillStyle = "#2a2d36"; ctx.fillRect(x - w * 0.5, y - h * 0.3, w * 0.1, h * 0.04); ctx.fillRect(x + w * 0.4, y - h * 0.3, w * 0.1, h * 0.04);
    if (nt) {
      ctx.fillStyle = "rgba(255,170,40,.9)";
      [-0.22, 0.22].forEach((s) => { ctx.beginPath(); ctx.moveTo(x + w * s - w * 0.06, y - h * 0.12); ctx.lineTo(x + w * s + w * 0.06, y - h * 0.12); ctx.lineTo(x + w * s, y + h * (0.1 + Math.random() * 0.25)); ctx.fill(); });
      ctx.fillStyle = "rgba(120,200,255,.9)";
      [-0.22, 0.22].forEach((s) => { ctx.beginPath(); ctx.moveTo(x + w * s - w * 0.03, y - h * 0.12); ctx.lineTo(x + w * s + w * 0.03, y - h * 0.12); ctx.lineTo(x + w * s, y + h * 0.04); ctx.fill(); });
    }
    const gb = ctx.createLinearGradient(0, y - h * 0.7, 0, y - h * 0.12);
    gb.addColorStop(0, shade(col, 0.35)); gb.addColorStop(0.55, col); gb.addColorStop(1, shade(col, -0.45));
    ctx.fillStyle = gb; rr(x - w * 0.5, y - h * 0.66, w, h * 0.5, w * 0.1); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.45)"; rr(x - w * 0.46, y - h * 0.26, w * 0.92, h * 0.15, w * 0.05); ctx.fill();
    ctx.fillStyle = "#1a1c22"; ctx.fillRect(x - w * 0.14, y - h * 0.2, w * 0.28, h * 0.07);
    ctx.fillStyle = "#cfd2d8"; ctx.fillRect(x - w * 0.08, y - h * 0.5, w * 0.16, h * 0.08);
    const gc = ctx.createLinearGradient(0, y - h, 0, y - h * 0.62);
    gc.addColorStop(0, shade(col, 0.25)); gc.addColorStop(1, shade(col, -0.2));
    ctx.fillStyle = gc;
    ctx.beginPath(); ctx.moveTo(x - w * 0.42, y - h * 0.62); ctx.lineTo(x - w * 0.31, y - h * 0.97); ctx.lineTo(x + w * 0.31, y - h * 0.97); ctx.lineTo(x + w * 0.42, y - h * 0.62); ctx.closePath(); ctx.fill();
    const gw = ctx.createLinearGradient(0, y - h * 0.95, 0, y - h * 0.64);
    gw.addColorStop(0, "#27384d"); gw.addColorStop(1, "#0e1722");
    ctx.fillStyle = gw;
    ctx.beginPath(); ctx.moveTo(x - w * 0.36, y - h * 0.65); ctx.lineTo(x - w * 0.27, y - h * 0.92); ctx.lineTo(x + w * 0.27, y - h * 0.92); ctx.lineTo(x + w * 0.36, y - h * 0.65); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.2)";
    ctx.beginPath(); ctx.moveTo(x - w * 0.3, y - h * 0.68); ctx.lineTo(x - w * 0.22, y - h * 0.9); ctx.lineTo(x - w * 0.1, y - h * 0.9); ctx.lineTo(x - w * 0.19, y - h * 0.68); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(col, -0.35);
    ctx.fillRect(x - w * 0.34, y - h * 1.0, w * 0.04, h * 0.1); ctx.fillRect(x + w * 0.3, y - h * 1.0, w * 0.04, h * 0.1);
    rr(x - w * 0.46, y - h * 1.06, w * 0.92, h * 0.1, w * 0.03); ctx.fill();
    ctx.fillStyle = shade(col, 0.15); ctx.fillRect(x - w * 0.46, y - h * 1.06, w * 0.92, h * 0.025);
    if (br) { ctx.fillStyle = "rgba(255,40,40,.35)"; ctx.beginPath(); ctx.arc(x - w * 0.36, y - h * 0.5, w * 0.2, 0, 7); ctx.arc(x + w * 0.36, y - h * 0.5, w * 0.2, 0, 7); ctx.fill(); }
    ctx.fillStyle = br ? "#ff2a2a" : "#b01818";
    rr(x - w * 0.47, y - h * 0.58, w * 0.3, h * 0.1, w * 0.03); ctx.fill();
    rr(x + w * 0.17, y - h * 0.58, w * 0.3, h * 0.1, w * 0.03); ctx.fill();
    ctx.fillStyle = "#2a2d36"; ctx.beginPath(); ctx.arc(x - w * 0.22, y - h * 0.1, w * 0.045, 0, 7); ctx.arc(x + w * 0.22, y - h * 0.1, w * 0.045, 0, 7); ctx.fill();
  }
  function drawScn(kind, x, y, w, hh, side) {
    if (w < 3) return;
    const t = (hh >>> 5) % 5, c0 = th.tree[0], c1 = th.tree[1];
    if (kind === "pine") {
      const H1 = w * (0.75 + t * 0.07);
      ctx.fillStyle = "#4a3320"; ctx.fillRect(x - w * 0.025, y - H1 * 0.3, w * 0.05, H1 * 0.3);
      ctx.fillStyle = c0; ctx.beginPath(); ctx.moveTo(x - H1 * 0.28, y - H1 * 0.22); ctx.lineTo(x + H1 * 0.28, y - H1 * 0.22); ctx.lineTo(x, y - H1 * 0.72); ctx.fill();
      ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(x - H1 * 0.22, y - H1 * 0.48); ctx.lineTo(x + H1 * 0.22, y - H1 * 0.48); ctx.lineTo(x, y - H1); ctx.fill();
      if (th.snow) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x - H1 * 0.09, y - H1 * 0.87); ctx.lineTo(x + H1 * 0.09, y - H1 * 0.87); ctx.lineTo(x, y - H1); ctx.fill(); }
    } else if (kind === "cactus") {
      const H1 = w * (0.45 + t * 0.05);
      ctx.fillStyle = c0; rr(x - w * 0.025, y - H1, w * 0.05, H1, w * 0.02); ctx.fill();
      rr(x - w * 0.09, y - H1 * 0.65, w * 0.065, w * 0.03, w * 0.015); ctx.fill(); rr(x - w * 0.09, y - H1 * 0.65, w * 0.025, H1 * 0.3, w * 0.012); ctx.fill();
      rr(x + w * 0.03, y - H1 * 0.5, w * 0.065, w * 0.03, w * 0.015); ctx.fill(); rr(x + w * 0.07, y - H1 * 0.5, w * 0.025, H1 * 0.28, w * 0.012); ctx.fill();
    } else if (kind === "palm") {
      const H1 = w * 0.8;
      ctx.strokeStyle = "#6a4a2a"; ctx.lineWidth = Math.max(1, w * 0.03); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + side * w * 0.05, y - H1 * 0.5, x + side * w * 0.02, y - H1); ctx.stroke();
      ctx.strokeStyle = c1; ctx.lineWidth = Math.max(1, w * 0.025);
      for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.55; ctx.beginPath(); ctx.moveTo(x + side * w * 0.02, y - H1); ctx.quadraticCurveTo(x + side * w * 0.02 + Math.cos(a) * w * 0.14, y - H1 + Math.sin(a) * w * 0.12 - w * 0.04, x + side * w * 0.02 + Math.cos(a) * w * 0.26, y - H1 + Math.sin(a) * w * 0.22 + w * 0.06); ctx.stroke(); }
    } else if (kind === "city") {
      const bw = w * (0.3 + t * 0.04), bh = w * (0.9 + (t % 3) * 0.5);
      ctx.fillStyle = "#151a30"; ctx.fillRect(x - bw / 2, y - bh, bw, bh);
      ctx.fillStyle = "#1d2542"; ctx.fillRect(x - bw / 2, y - bh, bw * 0.12, bh);
      const cols = 3, rows = Math.max(2, Math.floor(bh / (w * 0.14)));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (((hh >>> (r + c)) + r * 3 + c) % 3 === 0) continue;
        ctx.fillStyle = ((hh >>> (c + 3)) + r) % 4 === 0 ? "#ffd27a" : "#7fb6ff";
        ctx.fillRect(x - bw / 2 + bw * (0.16 + c * 0.28), y - bh + (r + 0.35) * (bh / rows), bw * 0.16, bh / rows * 0.4);
      }
    } else {
      const hue = (hh >>> 7) % 2 ? "#ff3df0" : "#35e6ff", bh = w * (0.5 + t * 0.12);
      ctx.fillStyle = "#0a0614"; ctx.fillRect(x - w * 0.03, y - bh, w * 0.06, bh);
      ctx.fillStyle = hue; ctx.fillRect(x - w * 0.012, y - bh, w * 0.024, bh);
      ctx.globalAlpha = 0.25; ctx.fillRect(x - w * 0.05, y - bh, w * 0.1, bh); ctx.globalAlpha = 1;
      ctx.fillStyle = hue; ctx.beginPath(); ctx.arc(x, y - bh, w * 0.04, 0, 7); ctx.fill();
    }
  }
  function drawBg(P2) {
    if (th.scn === "city" || th.scn === "neon") {
      ctx.fillStyle = th.mt;
      const off = bgOff * 4;
      for (let x2 = -20; x2 < W + 40; x2 += 22) {
        const hh = 30 + ((Math.floor((x2 + off) / 22) * 2654435761 >>> 0) % 50);
        ctx.fillRect(x2 - (off % 22), HY - hh, 20, hh);
      }
      ctx.fillStyle = th.mt2;
      for (let x2 = -20; x2 < W + 40; x2 += 30) {
        const hh = 14 + ((Math.floor((x2 + off * 1.6) / 30) * 40503 >>> 0) % 26);
        ctx.fillRect(x2 - ((off * 1.6) % 30), HY - hh, 28, hh);
      }
    } else {
      ctx.fillStyle = th.mt;
      ctx.beginPath(); ctx.moveTo(0, HY);
      for (let x2 = 0; x2 <= W + 20; x2 += 20) ctx.lineTo(x2, HY - 28 - 22 * Math.sin((x2 + bgOff * 6) * 0.03) - 12 * Math.sin((x2 + bgOff * 6) * 0.09));
      ctx.lineTo(W + 20, HY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = th.mt2;
      ctx.beginPath(); ctx.moveTo(0, HY);
      for (let x2 = 0; x2 <= W + 20; x2 += 20) ctx.lineTo(x2, HY - 12 - 10 * Math.sin((x2 + bgOff * 10) * 0.05 + 2));
      ctx.lineTo(W + 20, HY); ctx.closePath(); ctx.fill();
    }
  }

  function update(dt) {
    bob += dt;
    if (msgT > 0) msgT -= dt;
    if (shake > 0) shake -= dt;
    if (state === "ready") return;
    if (state === "count") {
      cd -= dt;
      if (cd <= 0) { state = "race"; msg = "BAŞLA!"; msgT = 1; }
      return;
    }
    const racing = state === "race";
    if (racing) time += dt;
    let dir = 0;
    if (racing) {
      if (steerL || keys.ArrowLeft || keys.a) dir -= 1;
      if (steerR || keys.ArrowRight || keys.d) dir += 1;
    }
    nOn = false;
    const nWant = racing && (keys.ArrowUp || keys.w || (o.nitro && o.nitro()));
    const br = racing && (keys.ArrowDown || keys.s || (o.brake && o.brake()));
    const sp = speed / maxSp;
    px += dir * dt * 1.75 * (0.45 + 0.55 * Math.min(1, sp + 0.25));
    px -= dt * 2.5 * sp * sp * curveAt(pos + ZP) * 0.2;
    const off = Math.abs(px) > 1.02;
    if (px < -1.4) px = -1.4;
    if (px > 1.4) px = 1.4;
    let tgt = racing ? maxSp : 0;
    if (nWant && nitro > 0.02 && racing) { tgt = maxSp * 1.28; nitro -= dt * 0.3; nOn = true; } else nitro = Math.min(1, nitro + dt * 0.07);
    if (off) tgt = Math.min(tgt, 1900);
    if (br) tgt = Math.min(tgt, 1300);
    if (speed < tgt) speed += (nOn ? 3800 : 2300) * dt; else speed -= ((br || !racing) ? 6500 : off ? 5000 : 1300) * dt;
    if (speed < 0) speed = 0;
    if (off && racing) shake = Math.max(shake, 0.12);
    lean += (dir * 0.14 - lean) * Math.min(1, dt * 8);
    wheel += speed * dt;
    pos += speed * dt;
    // rakipler
    ai.forEach((a) => {
      if (a.fin) { a.z += a.sp * dt; a.sp = Math.max(0, a.sp - 800 * dt); return; }
      let tv = racing || state === "done" ? a.f * maxSp * (1 - 0.1 * Math.min(1, Math.abs(curveAt(a.z)) / 2)) : 0;
      const gap = a.z - ZP - pos;
      if (gap > 12000) tv *= 0.93; else if (gap < -8000) tv *= 1.05;
      if (a.bump > 0) { tv *= 0.6; a.bump -= dt; }
      a.sp += Math.max(-3500 * dt, Math.min(2600 * dt, tv - a.sp));
      a.z += a.sp * dt;
      a.t -= dt;
      if (a.t <= 0) { a.t = 3 + Math.random() * 4; a.tl = (Math.random() * 2 - 1) * 0.7; }
      a.lane += (a.tl - a.lane) * Math.min(1, dt * 0.9);
      if (a.z - ZP >= TOTAL) a.fin = true;
      const rel = a.z - (pos + ZP);
      if (racing && Math.abs(rel) < 380 && Math.abs(px - a.lane) < 0.28) {
        if (rel >= 0) { speed = Math.min(speed, a.sp * 0.97); px += (px >= a.lane ? 1 : -1) * dt * 2.2; shake = Math.max(shake, 0.15); }
        else { a.bump = 0.4; a.lane += (a.lane >= px ? 1 : -1) * dt; }
      }
    });
    if (racing) {
      const L = Math.min(LAPS, Math.floor(pos / LAP) + 1);
      if (L > lap) {
        laps.push(Math.round((time - lapStart) * 10)); lapStart = time; lap = L;
        msg = lap === LAPS ? "SON TUR!" : "Tur " + lap; msgT = 1.3;
        const lt = laps[laps.length - 1], bl = best("nb_car3_l" + level);
        if (!bl || lt < bl) put("nb_car3_l" + level, lt);
      }
      if (pos >= TOTAL) {
        laps.push(Math.round((time - lapStart) * 10));
        const lt = laps[laps.length - 1], bl = best("nb_car3_l" + level);
        if (!bl || lt < bl) put("nb_car3_l" + level, lt);
        state = "done"; ftime = time;
        rank = 1 + ai.filter((a) => a.z - ZP >= TOTAL).length;
        if (o.onFinish) o.onFinish({ t: Math.round(time * 10), rank: rank });
      }
    }
  }

  function render() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 7 * Math.min(1, shake * 3), (Math.random() - 0.5) * 5 * Math.min(1, shake * 3));
    const sky = ctx.createLinearGradient(0, 0, 0, HY);
    sky.addColorStop(0, th.t); sky.addColorStop(1, th.b);
    ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, HY + 10);
    if (th.night) {
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.4 + (i % 3) * 0.2; ctx.fillRect((i * 97) % W, (i * 53) % (HY - 60), 1.5, 1.5); }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = th.sun; ctx.beginPath(); ctx.arc(th.low ? 90 : 270, th.low ? HY - 30 : 56, 20, 0, 7); ctx.fill();
    const base = Math.floor(pos / SL), pct = (pos % SL) / SL;
    bgOff = (bgOff + curveAt(pos + ZP) * speed * 0.00004 + 360) % 360;
    drawBg();
    ctx.fillStyle = th.g1; ctx.fillRect(-10, HY, W + 20, H - HY + 10);
    const cy = CAMH + hillAt(pos + ZP);
    const xs = [], ys = [], ws = [], ss = [];
    let x = 0, dx = -curveAt(base * SL) * pct;
    const pxw = px * RW;
    for (let n = 0; n <= DRAW; n++) {
      const z = Math.max(40, n * SL - pct * SL), s = CD / z;
      xs.push(x); ss.push(s); ys.push(HY + s * (cy - hillAt(base * SL + n * SL)) * H / 2); ws.push(s * RW * W / 2);
      x += dx; dx += segs[(base + n) % N];
    }
    const cxs = (n, off) => W / 2 + ss[n] * (xs[n] + off * RW - pxw) * W / 2;
    const bucket = {};
    ai.forEach((a, i) => {
      const d = a.z - pos, f = (d + pct * SL) / SL, n = Math.floor(f);
      if (n < 1 || n >= DRAW - 1) return;
      (bucket[n] = bucket[n] || []).push({ a: a, t: f - n, rz: d });
    });
    for (let n = DRAW - 1; n >= 0; n--) {
      const i = base + n, band = Math.floor(i / 3) % 2 === 0;
      const y1 = ys[n], y2 = ys[n + 1];
      if (n > 0 && y2 >= y1) continue;
      const x1 = cxs(n, 0), x2 = cxs(n + 1, 0), w1 = ws[n], w2 = ws[n + 1];
      ctx.fillStyle = band ? th.g1 : th.g2;
      ctx.fillRect(-10, y2, W + 20, y1 - y2 + 1);
      quad(x1 - w1 * 1.13, y1, x1 + w1 * 1.13, y1, x2 + w2 * 1.13, y2, x2 - w2 * 1.13, y2, band ? "#e8e8e8" : "#d94141");
      quad(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, band ? th.r1 : th.r2);
      if (band) {
        const lw1 = w1 * 0.02, lw2 = w2 * 0.02;
        [-0.5, 0.5].forEach((q) => { const a = x1 + w1 * q, b = x2 + w2 * q; quad(a - lw1, y1, a + lw1, y1, b + lw2, y2, b - lw2, y2, "rgba(255,255,255,.7)"); });
      }
      if (i % N === 0 || i % N === 1) {
        for (let c = 0; c < 12; c++) {
          const a1 = -1 + c * (2 / 12), a2 = a1 + 2 / 12, dark = (c + i) % 2;
          quad(x1 + w1 * a1, y1, x1 + w1 * a2, y1, x2 + w2 * a2, y2, x2 + w2 * a1, y2, dark ? "#111" : "#fff");
        }
      }
      const hh = ((i * 2654435761 + seed * 40503) >>> 0);
      if (hh % 4 < 2) {
        const side = hh & 8 ? 1 : -1, offs = 1.3 + ((hh >>> 5) % 100) / 100 * 1.3;
        drawScn(th.scn, cxs(n, side * offs), y1, w1, hh, side);
        if (hh % 4 === 0) drawScn(th.scn, cxs(n, -side * (offs + 0.5)), y1, w1, hh >>> 3, -side);
      }
      const bk = bucket[n];
      if (bk) {
        bk.sort((a, b) => b.rz - a.rz);
        bk.forEach((e) => {
          const z = Math.max(40, e.rz), s = CD / z, xi = xs[n] + (xs[n + 1] - xs[n]) * e.t, sy = HY + s * (cy - hillAt(pos + e.rz)) * H / 2, hp2 = s * RW * W / 2;
          if (sy > H + 60) return;
          drawCar(W / 2 + s * (xi + e.a.lane * RW - pxw) * W / 2, sy, hp2 * 0.5, e.a.col, { brake: e.a.bump > 0 });
        });
      }
    }
    const fog = ctx.createLinearGradient(0, HY - 2, 0, HY + 60);
    fog.addColorStop(0, th.b); fog.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.8; ctx.fillStyle = fog; ctx.fillRect(-10, HY - 2, W + 20, 62); ctx.globalAlpha = 1;
    if (speed > maxSp * 0.8 || nOn) {
      ctx.strokeStyle = "rgba(255,255,255," + (nOn ? 0.4 : 0.2) + ")"; ctx.lineWidth = 2;
      for (let k = 0; k < 9; k++) {
        const a = (performance.now() * 0.0025 + k * 0.37) % 1, lx = k % 2 ? 24 + k * 9 : W - 24 - k * 9, ly = HY + 60 + a * 250;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + (lx < W / 2 ? -1 : 1) * (6 + a * 30), ly + 16 + a * 44); ctx.stroke();
      }
    }
    const brakeNow = state === "race" && (keys.ArrowDown || keys.s || (o.brake && o.brake()));
    drawCar(W / 2, 486 + Math.sin(bob * 18) * Math.min(1.5, speed / 4000), 92, colOf(), { brake: brakeNow, nitro: nOn });
    // HUD
    ctx.fillStyle = "rgba(0,0,0,.5)"; rr(8, 8, 104, 40, 8); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "left"; ctx.fillText(Math.round(speed / 24), 16, 36);
    ctx.font = "11px sans-serif"; ctx.fillText("km/h", 66, 36);
    ctx.fillStyle = "rgba(0,0,0,.5)"; rr(W - 112, 8, 104, 40, 8); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "right";
    ctx.fillText("Tur " + Math.min(lap, LAPS) + "/" + LAPS, W - 16, 25); ctx.font = "13px sans-serif";
    ctx.fillText("⏱ " + (state === "done" ? ftime : time).toFixed(1), W - 16, 42);
    ctx.textAlign = "center"; ctx.fillStyle = "rgba(0,0,0,.5)"; rr(W / 2 - 38, 8, 76, 40, 8); ctx.fill();
    ctx.fillStyle = "#ffd23a"; ctx.font = "bold 22px sans-serif"; ctx.fillText((state === "done" ? rank : rankNow()) + "/6", W / 2, 37);
    ctx.fillStyle = "rgba(0,0,0,.5)"; rr(8, 54, W - 16, 8, 4); ctx.fill();
    ai.forEach((a) => { ctx.fillStyle = a.col; ctx.beginPath(); ctx.arc(12 + Math.min(1, Math.max(0, (a.z - ZP) / TOTAL)) * (W - 24), 58, 3, 0, 7); ctx.fill(); });
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(12 + Math.min(1, pos / TOTAL) * (W - 24), 58, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.5)"; rr(8, 66, 100, 14, 6); ctx.fill();
    ctx.fillStyle = nOn ? "#ffb02e" : "#35e6ff"; rr(10, 68, 96 * Math.max(0, nitro), 10, 4); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "9px sans-serif"; ctx.textAlign = "center"; ctx.fillText("NİTRO", 58, 77);
    if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT * 1.5); ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 4; ctx.font = "bold 28px sans-serif"; ctx.textAlign = "center"; ctx.strokeText(msg, W / 2, 130); ctx.fillText(msg, W / 2, 130); ctx.globalAlpha = 1; }
    if (state === "ready") {
      ctx.fillStyle = "rgba(0,0,0,.58)"; ctx.fillRect(0, 150, W, 140);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 26px sans-serif"; ctx.fillText("Pist: " + th.n, W / 2, 192);
      ctx.font = "16px sans-serif"; ctx.fillText(LAPS + " tur • 5 rakip • sondan başlıyorsun", W / 2, 222);
      ctx.fillStyle = "#ffd23a"; ctx.font = "bold 18px sans-serif"; ctx.fillText("Başlamak için ekrana dokun", W / 2, 262);
    } else if (state === "count") {
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 6; ctx.textAlign = "center"; ctx.font = "bold 96px sans-serif";
      const t = Math.ceil(cd); ctx.strokeText(String(t), W / 2, 240); ctx.fillText(String(t), W / 2, 240);
    } else if (state === "done") {
      ctx.fillStyle = "rgba(0,0,0,.62)"; ctx.fillRect(0, 140, W, 170);
      ctx.fillStyle = rank <= 3 ? "#ffd23a" : "#fff"; ctx.textAlign = "center"; ctx.font = "bold 30px sans-serif"; ctx.fillText(rank + ". sırada bitirdin" + (rank === 1 ? " 🏆" : ""), W / 2, 186);
      ctx.fillStyle = "#fff"; ctx.font = "18px sans-serif"; ctx.fillText("Süre: " + fmt(Math.round(ftime * 10)), W / 2, 220);
      ctx.font = "14px sans-serif"; ctx.fillText("Turlar: " + laps.map((t2) => (t2 / 10).toFixed(1)).join(" • "), W / 2, 248);
      ctx.fillText(rank <= 3 ? "Sonraki pist açıldı!" : "İlk 3'e girersen sonraki pist açılır", W / 2, 276);
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
  const pside = (e) => { const r = cvs.getBoundingClientRect(); return (e.clientX - r.left) < r.width / 2 ? -1 : 1; };
  cvs.onpointerdown = (e) => {
    if (state === "ready") { state = "count"; cd = 3.2; return; }
    try { cvs.setPointerCapture(e.pointerId); } catch (x) {}
    ptr[e.pointerId] = pside(e); side();
  };
  cvs.onpointermove = (e) => { if (ptr[e.pointerId] !== undefined) { ptr[e.pointerId] = pside(e); side(); } };
  const up = (e) => { delete ptr[e.pointerId]; side(); };
  cvs.onpointerup = up; cvs.onpointercancel = up;
  const kd = (e) => { if (state === "ready" && e.key === "Enter") { state = "count"; cd = 3.2; } keys[e.key] = true; };
  const ku = (e) => { keys[e.key] = false; };
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
  last = performance.now();
  raf = requestAnimationFrame(loop);
  return { root: root, destroy: destroy, get dead() { return dead; }, theme: th.n };
}

/* ---------- Oyun ekranı: kupalar ---------- */
function car(body, el, act) {
  let inst = null, level = 1, unlocked = Math.max(1, best("nb_car3")), colIdx = Math.min(CARCOL.length - 1, best("nb_car3_col")), nitroH = false, brakeH = false;
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 4px;font-size:15px";
  body.appendChild(info);
  const sub = el("p", "", "");
  sub.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)";
  body.appendChild(sub);
  const box = el("div", "");
  body.appendChild(box);
  const ctl = el("div", "");
  ctl.style.cssText = "display:flex;gap:8px;margin:0 auto 6px;max-width:360px";
  body.appendChild(ctl);
  function hold(label, setf) {
    const b = el("button", "", label);
    b.type = "button";
    b.style.cssText = "flex:1;padding:16px 4px;font-weight:700;font-size:16px;touch-action:none;user-select:none;min-width:0";
    b.onpointerdown = (e) => { try { b.setPointerCapture(e.pointerId); } catch (x) {} setf(true); };
    const off = () => setf(false);
    b.onpointerup = off; b.onpointercancel = off; b.onpointerleave = off;
    return b;
  }
  ctl.appendChild(hold("🛑 Fren", (v) => { brakeH = v; }));
  ctl.appendChild(hold("🔥 Nitro", (v) => { nitroH = v; }));
  const colRow = el("div", "");
  colRow.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:center;margin:6px 0";
  body.appendChild(colRow);
  colRow.appendChild(el("span", "", "Araba rengi:"));
  CARCOL.forEach((c, i) => {
    const b = el("button", "", "");
    b.type = "button";
    b.style.cssText = "width:30px;height:30px;padding:0;border-radius:50%!important;border:3px solid " + (i === colIdx ? "#fff" : "transparent") + "!important;background:" + c + "!important;min-width:0";
    b.onclick = () => { colIdx = i; put("nb_car3_col", i); Array.from(colRow.querySelectorAll("button")).forEach((x, j) => { x.style.setProperty("border", "3px solid " + (j === i ? "#fff" : "transparent"), "important"); }); };
    colRow.appendChild(b);
  });
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  body.appendChild(row);
  const bT = (n) => best("nb_car3_t" + n), bL = (n) => best("nb_car3_l" + n);
  function head() {
    const t = bT(level), l = bL(level);
    info.textContent = "Pist " + level + " • " + inst.theme;
    sub.textContent = "Açık pist: " + unlocked + "   En iyi süre: " + (t ? fmt(t) : "-") + "   En iyi tur: " + (l ? (l / 10).toFixed(1) + " sn" : "-");
    nextB.style.display = unlocked > level ? "" : "none";
  }
  function load(n) {
    if (inst) inst.destroy();
    box.textContent = "";
    level = Math.max(1, Math.min(n, unlocked));
    inst = carGame({
      el: el, level: level, seed: level * 6151 + 29,
      color: () => CARCOL[colIdx], nitro: () => nitroH, brake: () => brakeH,
      onFinish: (r) => {
        const t = bT(level);
        if (!t || r.t < t) put("nb_car3_t" + level, r.t);
        if (r.rank <= 3 && level + 1 > unlocked) { unlocked = level + 1; put("nb_car3", unlocked); }
        head();
      }
    });
    box.appendChild(inst.root);
    head();
  }
  const bPrev = act("◀", () => load(level - 1));
  const bNext = act("▶", () => load(level + 1));
  const retryB = act("Tekrar", () => load(level));
  const nextB = act("Sonraki pist ▶", () => load(level + 1));
  [bPrev, bNext, retryB, nextB].forEach((b) => { b.style.minWidth = "0"; row.appendChild(b); });
  const hint = el("p", "", "Ekranın sol yarısına basılı tut: sola, sağ yarısına basılı tut: sağa. Virajlarda 🛑 Fren'e dokun, düzlükte 🔥 Nitro ile fırla (nitro biter, kendiliğinden dolar). Rakiplere çarpma, yavaşlarsın: yan şeritten geç. Çimene çıkma. 3 turun sonunda ilk 3'e girersen sonraki pist açılır. Pistler tepeli ve virajlıdır, her pist farklı ortamdadır, rakipler zorlaşır.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  load(1);
  return () => { if (inst) inst.destroy(); };
}

export const SOLO = {
  car3d: { group: "Aksiyon", icon: "🏎️", label: "Turbo Yarış 3D", start: car }
};
