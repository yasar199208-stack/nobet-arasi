// Aksiyon oyunları 20: Atlayış Bisikleti 3D (3 şerit, zıplama, rampa, boşluk, altın, 6 pist)
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function put(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
const mul32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const W = 360, H = 520, HY = 190, F = 300, CH = 2.4, CB = 5.2, LANE = 2.4, RW = 3.9, G = 22, JV = 8.6;
const THEMES = [
  { n: "Şehir Parkı", t: "#4aa8ff", b: "#d6efff", g1: "#3da650", g2: "#369a47", r1: "#4a4a54", r2: "#44444e", scn: "tree", c: ["#1f6b34", "#2c8a45"], night: false },
  { n: "Çöl Yolu", t: "#4aa8ff", b: "#ffe9b8", g1: "#e0c279", g2: "#d6b66c", r1: "#5a5148", r2: "#534a41", scn: "cactus", c: ["#4f8a3a", "#6aa84a"], night: false },
  { n: "Karlı Patika", t: "#8fb4e8", b: "#f0f6ff", g1: "#f2f6fb", g2: "#e4ebf4", r1: "#596070", r2: "#535a69", scn: "pine", c: ["#2f6b52", "#3f8a69"], night: false },
  { n: "Gece Şehri", t: "#04060f", b: "#222a5e", g1: "#1c2230", g2: "#181d2a", r1: "#2d2d38", r2: "#282832", scn: "lamp", c: ["#ffd27a", "#7fb6ff"], night: true },
  { n: "Sahil Yolu", t: "#35255f", b: "#ff9d5c", g1: "#d9b87a", g2: "#cfae70", r1: "#6a5a58", r2: "#625250", scn: "palm", c: ["#1c6b3a", "#2f9a52"], night: false },
  { n: "Neon Tüneli", t: "#05020f", b: "#3a1466", g1: "#120a26", g2: "#0e081f", r1: "#241c38", r2: "#1f1832", scn: "neon", c: ["#ff3df0", "#35e6ff"], night: true }
];

function gen(level) {
  const rnd = mul32(level * 6007 + 71), diff = Math.min(1, (level - 1) / 8), L = 520 + 50 * Math.min(level, 8);
  const obs = [], coins = [], gaps = [], ramps = [];
  const lanes = [-LANE, 0, LANE], pl = () => lanes[Math.floor(rnd() * 3)];
  const cpz = [L * 0.25, L * 0.5, L * 0.75];
  let z = 50;
  const free = (zz) => cpz.some((c) => zz > c - 8 && zz < c + 22);
  function coinLine(x, z0, n, y) { for (let i = 0; i < n; i++) coins.push({ x: x, z: z0 + i * 2.2, y: y || 0.9, got: false }); }
  while (z < L - 40) {
    if (free(z)) { z += 12; continue; }
    const r = rnd(), kind = r < 0.3 ? "single" : r < 0.5 ? "wall2" : r < 0.66 ? "hurdle" : r < 0.8 ? "gap" : r < 0.9 + (level >= 3 ? 0.02 : 0) ? "slalom" : level >= 3 ? "ramp" : "single";
    if (kind === "single") {
      const x = pl(), t = ["log", "rock", "crate"][Math.floor(rnd() * (level > 1 ? 3 : 2))];
      obs.push({ t: t, x: x, z: z, w: 2.0, h: t === "crate" ? 1.8 : t === "rock" ? 0.75 : 0.55, d: t === "log" ? 0.8 : 1.4 });
      lanes.forEach((lx) => { if (lx !== x && rnd() < 0.6) coinLine(lx, z - 3, 3); });
      if (t !== "crate") coinLine(x, z - 1.5, 1, 1.9);
    } else if (kind === "wall2") {
      const free2 = pl();
      lanes.forEach((lx) => { if (lx !== free2) obs.push({ t: "crate", x: lx, z: z, w: 2.0, h: 1.8, d: 1.4 }); });
      coinLine(free2, z - 4, 5);
    } else if (kind === "hurdle") {
      obs.push({ t: "hurdle", x: 0, z: z, w: RW * 2, h: 0.85, d: 0.5 });
      coinLine(0, z - 2, 1, 1.9); coinLine(0, z + 0.2, 1, 2.0); coinLine(0, z + 2.4, 1, 1.9);
    } else if (kind === "gap") {
      const gw = 3.5 + rnd() * 1.5 + diff;
      gaps.push({ z: z, w: gw });
      coinLine(0, z - 0.5, 3, 1.8); coinLine(-LANE, z + 0.4, 2, 1.7); coinLine(LANE, z + 0.4, 2, 1.7);
    } else if (kind === "slalom") {
      let a = Math.floor(rnd() * 3);
      for (let i = 0; i < 3; i++) { obs.push({ t: i % 2 ? "rock" : "crate", x: lanes[a], z: z + i * 9, w: 2.0, h: i % 2 ? 0.75 : 1.8, d: 1.4 }); coinLine(lanes[(a + 1) % 3], z + i * 9, 2); a = (a + 1 + Math.floor(rnd() * 2)) % 3; }
      z += 18;
    } else {
      const x = pl();
      ramps.push({ x: x, z: z, len: 4, h: 1.2 });
      for (let i = 0; i < 6; i++) coins.push({ x: x, z: z + 5 + i * 2.2, y: 1.8 + Math.sin(i / 5 * Math.PI) * 1.6, got: false });
      lanes.forEach((lx) => obs.push({ t: "crate", x: lx, z: z + 11, w: 2.0, h: 1.8, d: 1.0 }));
      z += 8;
    }
    z += 17 + rnd() * 9 - 3 * diff;
  }
  return { L: L, obs: obs, coins: coins, gaps: gaps, ramps: ramps, cpz: cpz, total: coins.length };
}

export function hurdleGame(o) {
  const el = o.el, level = Math.max(1, o.level || 1), th = THEMES[(level - 1) % 6], D = gen(level), L = D.L;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const root = el("div", "");
  const cvs = el("canvas", "");
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.cssText = "display:block;width:100%;max-width:360px;margin:0 auto 8px;touch-action:none;user-select:none;border-radius:12px";
  root.appendChild(cvs);
  const ctx = cvs.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const obs = D.obs, coins = D.coins, gaps = D.gaps, ramps = D.ramps;
  const baseSp = 13 + Math.min(level, 8) * 0.7;
  let pos = 0, x = 0, lane = 1, y = 0, vy = 0, speed = 0, hearts = 3, inv = 0, state = "ready", cd = 2.9, time = 0, coinN = 0, crashes = 0, falls = 0, camX = 0, shake = 0, msg = "", msgT = 0, cpAt = 0, stateT = 0, stars = 0, dead = false, raf, last, goneSince = 0, wheel = 0, lean = 0, bgOff = 0, part = [];
  const keys = {};
  const laneX = () => [-LANE, 0, LANE][lane];

  const pr = (wx, wy, wz) => { const d = wz - (pos - CB); if (d < 0.3) return null; const s = F / d; return [W / 2 + (wx - camX) * s, HY + (CH - wy) * s, s]; };
  function poly(pts, col) {
    const q = pts.map((p) => pr(p[0], p[1], p[2]));
    if (q.some((v) => !v)) return;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]);
    ctx.closePath(); ctx.fill();
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
    return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
  }
  function box(cx, z, w, h, d, col, extra) {
    const x0 = cx - w / 2, x1 = cx + w / 2, z1 = z + d;
    if (x1 < camX) poly([[x1, 0, z], [x1, h, z], [x1, h, z1], [x1, 0, z1]], shade(col, -0.35));
    if (x0 > camX) poly([[x0, 0, z], [x0, h, z], [x0, h, z1], [x0, 0, z1]], shade(col, -0.35));
    poly([[x0, h, z], [x1, h, z], [x1, h, z1], [x0, h, z1]], shade(col, 0.25));
    poly([[x0, 0, z], [x1, 0, z], [x1, h, z], [x0, h, z]], col);
    if (extra) extra(x0, x1, h, z);
  }
  function burst(bx, by, col, n) { for (let i = 0; i < n; i++) part.push({ x: bx, y: by, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 120, l: 0.5, c: col }); }

  function surface(zz) {
    // rampa yüksekliği (şeritteyse)
    for (const r of ramps) if (Math.abs(x - r.x) < 1.2 && zz >= r.z && zz <= r.z + r.len) return (zz - r.z) / r.len * r.h;
    return 0;
  }
  function crash(why) {
    if (inv > 0 || state !== "race") return;
    hearts--; inv = 1.6; crashes++; shake = 0.25; speed = Math.max(baseSp * 0.45, speed * 0.4); msg = why; msgT = 1;
    burst(W / 2, 330, "#fff", 10);
    if (hearts <= 0) { state = "dead"; stateT = 0; falls++; }
  }
  function update(dt) {
    if (msgT > 0) msgT -= dt; if (shake > 0) shake -= dt; if (inv > 0) inv -= dt;
    part.forEach((q) => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt; q.l -= dt; }); part = part.filter((q) => q.l > 0);
    if (state === "ready") return;
    if (state === "count") { cd -= dt; if (cd <= 0) { state = "race"; msg = "GİT!"; msgT = 0.8; speed = baseSp * 0.7; } return; }
    if (state === "dead") { stateT += dt; speed *= 0.95; if (stateT > 1.2) { pos = cpAt; x = 0; lane = 1; y = 0; vy = 0; hearts = 3; inv = 2; speed = baseSp * 0.7; state = "race"; msg = "Kontrol noktası"; msgT = 1; } return; }
    if (state === "done") { stateT += dt; speed = Math.max(0, speed - 8 * dt); pos += speed * dt; return; }
    time += dt;
    const prog = pos / L, target = baseSp + prog * 4;
    speed += (target - speed) * Math.min(1, dt * 0.8);
    pos += speed * dt; wheel += speed * dt;
    if (keys.L) { keys.L = false; if (lane > 0) lane--; } if (keys.R) { keys.R = false; if (lane < 2) lane++; }
    const tx = laneX(); const ox = x; x += (tx - x) * Math.min(1, dt * 9); lean += ((tx - x) * 0.12 - lean) * Math.min(1, dt * 8);
    camX = x * 0.55;
    // zemin
    const gnd = surface(pos);
    const onGround = y <= gnd + 0.02 && vy <= 0.01;
    if (keys.J) { keys.J = false; if (onGround) { vy = JV; y = Math.max(y, gnd) + 0.01; burst(W / 2, 330, "#ddd", 4); } }
    const prevY = y;
    vy -= G * dt; y += vy * dt;
    // rampa sonundan fırlama
    ramps.forEach((r) => { if (Math.abs(x - r.x) < 1.2 && pos > r.z + r.len && pos - speed * dt <= r.z + r.len && prevY <= r.h + 0.15) { vy = Math.max(vy, 8.8); y = Math.max(y, r.h); } });
    const g2 = surface(pos);
    if (y < g2) { y = g2; if (vy < 0) vy = 0; }
    if (y < 0) { y = 0; vy = 0; }
    // boşluk
    gaps.forEach((gp) => { if (pos > gp.z + 0.4 && pos < gp.z + gp.w - 0.3 && y <= 0.02) { pos = gp.z - 2.5; speed = baseSp * 0.5; crash("Boşluğa düştün!"); } });
    // engeller
    obs.forEach((b) => {
      if (Math.abs(x - b.x) < b.w / 2 + 0.38 - (b.t === "hurdle" ? -0.2 : 0) && pos + 0.35 > b.z && pos - 0.35 < b.z + b.d && y < b.h - 0.08 && !b.hit) {
        if (inv > 0) return; b.hit = true; crash(b.t === "crate" ? "Sandık!" : "Çarptın!");
      }
    });
    coins.forEach((c) => { if (!c.got && Math.abs(c.z - pos) < 0.9 && Math.abs(c.x - x) < 1.0 && Math.abs(c.y - (y + 0.8)) < 1.1) { c.got = true; coinN++; burst(W / 2, 300, "#ffd23a", 3); } });
    D.cpz.forEach((c) => { if (pos >= c && cpAt < c) { cpAt = c; msg = "Kontrol noktası ✓"; msgT = 1; } });
    if (pos >= L) {
      state = "done"; stateT = 0;
      stars = 1 + (coinN >= D.total * 0.6 ? 1 : 0) + (crashes === 0 ? 1 : 0);
      if (o.onFinish) o.onFinish({ coins: coinN, total: D.total, crashes: crashes, time: Math.round(time), stars: stars });
    }
    bgOff += 0;
  }

  function scn(kind, sx, sy, s, hh, side) {
    const t = (hh >>> 4) % 4, u = s * 1.0;
    if (u < 2) return;
    if (kind === "tree" || kind === "pine") {
      const h2 = u * (2.4 + t * 0.4);
      ctx.fillStyle = "#4a3320"; ctx.fillRect(sx - u * 0.08, sy - h2 * 0.35, u * 0.16, h2 * 0.35);
      ctx.fillStyle = th.c[0]; ctx.beginPath();
      if (kind === "pine") { ctx.moveTo(sx - h2 * 0.28, sy - h2 * 0.3); ctx.lineTo(sx + h2 * 0.28, sy - h2 * 0.3); ctx.lineTo(sx, sy - h2 * 0.78); ctx.fill(); ctx.fillStyle = th.c[1]; ctx.beginPath(); ctx.moveTo(sx - h2 * 0.2, sy - h2 * 0.55); ctx.lineTo(sx + h2 * 0.2, sy - h2 * 0.55); ctx.lineTo(sx, sy - h2); ctx.fill(); }
      else { ctx.arc(sx, sy - h2 * 0.6, h2 * 0.32, 0, 7); ctx.fill(); ctx.fillStyle = th.c[1]; ctx.beginPath(); ctx.arc(sx - h2 * 0.08, sy - h2 * 0.68, h2 * 0.2, 0, 7); ctx.fill(); }
    } else if (kind === "cactus") {
      const h2 = u * (1.6 + t * 0.3);
      ctx.fillStyle = th.c[0]; ctx.fillRect(sx - u * 0.1, sy - h2, u * 0.2, h2); ctx.fillRect(sx - u * 0.4, sy - h2 * 0.65, u * 0.3, u * 0.12); ctx.fillRect(sx - u * 0.4, sy - h2 * 0.65, u * 0.12, h2 * 0.3); ctx.fillRect(sx + u * 0.1, sy - h2 * 0.5, u * 0.3, u * 0.12); ctx.fillRect(sx + u * 0.28, sy - h2 * 0.5, u * 0.12, h2 * 0.3);
    } else if (kind === "palm") {
      const h2 = u * 2.6;
      ctx.strokeStyle = "#6a4a2a"; ctx.lineWidth = Math.max(1, u * 0.12); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + side * u * 0.2, sy - h2 * 0.5, sx + side * u * 0.1, sy - h2); ctx.stroke();
      ctx.strokeStyle = th.c[1]; ctx.lineWidth = Math.max(1, u * 0.08);
      for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.6; ctx.beginPath(); ctx.moveTo(sx + side * u * 0.1, sy - h2); ctx.quadraticCurveTo(sx + Math.cos(a) * u * 0.6, sy - h2 + Math.sin(a) * u * 0.4 - u * 0.2, sx + Math.cos(a) * u * 1.0, sy - h2 + Math.sin(a) * u * 0.8 + u * 0.3); ctx.stroke(); }
    } else if (kind === "lamp") {
      const h2 = u * 3.2;
      ctx.fillStyle = "#2a3350"; ctx.fillRect(sx - u * 0.05, sy - h2, u * 0.1, h2);
      ctx.fillStyle = th.c[0]; ctx.beginPath(); ctx.arc(sx, sy - h2, u * 0.2, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.arc(sx, sy - h2, u * 0.7, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    } else {
      const h2 = u * (2 + t * 0.5), hue = (hh >>> 7) % 2 ? th.c[0] : th.c[1];
      ctx.fillStyle = "#0a0614"; ctx.fillRect(sx - u * 0.1, sy - h2, u * 0.2, h2);
      ctx.fillStyle = hue; ctx.fillRect(sx - u * 0.04, sy - h2, u * 0.08, h2); ctx.globalAlpha = 0.25; ctx.fillRect(sx - u * 0.2, sy - h2, u * 0.4, h2); ctx.globalAlpha = 1;
    }
  }
  function drawRider() {
    const b = pr(x, y, pos);
    if (!b) return;
    const s = b[2], bx = b[0], by = b[1];
    ctx.save();
    if (inv > 0 && Math.floor(inv * 14) % 2) ctx.globalAlpha = 0.4;
    ctx.translate(bx, by); ctx.rotate(lean * 1.5 + (y > 0.1 ? -Math.max(-0.2, Math.min(0.25, vy * 0.02)) * 0 : 0));
    const u = s * 0.55;
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(0, y * s * 0.0 + 2, u * 0.9, u * 0.18, 0, 0, 7); ctx.fill();
    // arka teker
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.ellipse(0, -u * 0.75, u * 0.22, u * 0.78, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#555"; for (let k = 0; k < 5; k++) { const yy = -u * 0.75 + Math.sin(wheel * 2 + k * 1.26) * u * 0.6; ctx.fillRect(-u * 0.2, yy, u * 0.4, u * 0.05); }
    // çatı/sele/gövde
    ctx.fillStyle = "#e5484d"; ctx.fillRect(-u * 0.05, -u * 1.55, u * 0.1, u * 0.8);
    ctx.fillStyle = "#222"; ctx.fillRect(-u * 0.22, -u * 1.6, u * 0.44, u * 0.1);
    // sürücü
    ctx.fillStyle = "#2f6fe0"; ctx.beginPath(); ctx.moveTo(-u * 0.42, -u * 1.65); ctx.lineTo(-u * 0.32, -u * 2.7); ctx.lineTo(u * 0.32, -u * 2.7); ctx.lineTo(u * 0.42, -u * 1.65); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1c4fb5"; ctx.fillRect(-u * 0.42, -u * 1.75, u * 0.84, u * 0.1);
    ctx.strokeStyle = "#2f6fe0"; ctx.lineWidth = u * 0.2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-u * 0.38, -u * 2.55); ctx.lineTo(-u * 0.75, -u * 2.05); ctx.moveTo(u * 0.38, -u * 2.55); ctx.lineTo(u * 0.75, -u * 2.05); ctx.stroke();
    ctx.fillStyle = "#f1c7a0"; ctx.beginPath(); ctx.arc(0, -u * 3.0, u * 0.3, 0, 7); ctx.fill();
    const hg = ctx.createRadialGradient(-u * 0.1, -u * 3.2, u * 0.05, 0, -u * 3.1, u * 0.4); hg.addColorStop(0, "#ffd23a"); hg.addColorStop(1, "#c4a020");
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, -u * 3.1, u * 0.36, Math.PI, 0); ctx.fill(); ctx.fillRect(-u * 0.36, -u * 3.1, u * 0.72, u * 0.06);
    // gidon
    ctx.strokeStyle = "#222"; ctx.lineWidth = u * 0.07; ctx.beginPath(); ctx.moveTo(-u * 0.8, -u * 2.05); ctx.lineTo(u * 0.8, -u * 2.05); ctx.stroke();
    ctx.restore();
  }
  function render() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4);
    const sky = ctx.createLinearGradient(0, 0, 0, HY); sky.addColorStop(0, th.t); sky.addColorStop(1, th.b);
    ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, HY + 10);
    if (th.night) { ctx.fillStyle = "#fff"; for (let i = 0; i < 36; i++) { ctx.globalAlpha = 0.4 + (i % 3) * 0.2; ctx.fillRect((i * 97) % W, (i * 53) % (HY - 40), 1.5, 1.5); } ctx.globalAlpha = 1; }
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.arc(th.night ? 280 : 90, th.night ? 50 : 60, 20, 0, 7); ctx.fill();
    // uzak silüet
    ctx.fillStyle = th.night ? "#10152e" : th.b; ctx.globalAlpha = th.night ? 1 : 0.5;
    ctx.beginPath(); ctx.moveTo(0, HY); for (let sx2 = 0; sx2 <= W + 10; sx2 += 12) ctx.lineTo(sx2, HY - 14 - 12 * Math.abs(Math.sin((sx2 + camX * 8 + 30) * 0.03 + 1)) - 6 * Math.sin(sx2 * 0.1)); ctx.lineTo(W + 10, HY); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = th.g1; ctx.fillRect(-10, HY, W + 20, H - HY + 10);
    // yol
    const base = Math.floor((pos - CB) / 2) * 2;
    for (let n = 70; n >= 0; n--) {
      const z0 = base + n * 2, z1 = z0 + 2, band = (Math.floor(z0 / 2) % 2 + 2) % 2;
      poly([[-60, 0, z0], [60, 0, z0], [60, 0, z1], [-60, 0, z1]], band ? th.g1 : th.g2);
      poly([[-RW - 0.35, 0, z0], [RW + 0.35, 0, z0], [RW + 0.35, 0, z1], [-RW - 0.35, 0, z1]], band ? "#e8e8e8" : "#d94141");
      poly([[-RW, 0, z0], [RW, 0, z0], [RW, 0, z1], [-RW, 0, z1]], band ? th.r1 : th.r2);
      if (band) [-LANE / 2 - 0.6, LANE / 2 + 0.6].forEach((lx) => poly([[lx - 0.04, 0, z0], [lx + 0.04, 0, z0], [lx + 0.04, 0, z1], [lx - 0.04, 0, z1]], "rgba(255,255,255,.55)"));
      // başlangıç çizgisi
      if (z0 <= 0 && z1 > 0) for (let c = 0; c < 10; c++) poly([[-RW + c * RW / 5, 0, 0], [-RW + (c + 1) * RW / 5, 0, 0], [-RW + (c + 1) * RW / 5, 0, 1], [-RW + c * RW / 5, 0, 1]], c % 2 ? "#111" : "#fff");
    }
    gaps.forEach((gp) => { if (gp.z + gp.w > pos - CB && gp.z < pos + 120) { poly([[-RW - 0.35, 0.001, gp.z], [RW + 0.35, 0.001, gp.z], [RW + 0.35, 0.001, gp.z + gp.w], [-RW - 0.35, 0.001, gp.z + gp.w]], "#05060a"); poly([[-RW, 0, gp.z], [RW, 0, gp.z], [RW, -1.2, gp.z], [-RW, -1.2, gp.z]], "#1a1410"); } });
    D.cpz.forEach((c) => { if (c > pos - CB && c < pos + 110) poly([[-RW, 0.002, c], [RW, 0.002, c], [RW, 0.002, c + 0.6], [-RW, 0.002, c + 0.6]], cpAt >= c ? "#4cc35a" : "#ffd23a"); });
    const items = [];
    for (let zz = Math.ceil((pos - CB + 1) / 8) * 8; zz < pos + 120; zz += 8) {
      const hh = ((zz * 2654435761 + level * 40503) >>> 0);
      [-1, 1].forEach((sd, k) => { if (((hh >>> k) & 3) !== 0 || th.scn === "lamp") items.push({ z: zz, f: () => { const p = pr(sd * (RW + 3.2 + ((hh >>> (4 + k)) % 5) * 0.5), 0, zz); if (p) scn(th.scn, p[0], p[1], p[2], hh >>> k, sd); } }); });
    }
    ramps.forEach((r) => { if (r.z + r.len > pos - CB && r.z < pos + 110) items.push({ z: r.z + r.len, f: () => {
      const x0 = r.x - 1.1, x1 = r.x + 1.1;
      poly([[x0, 0, r.z], [x0, r.h, r.z + r.len], [x0, 0, r.z + r.len]], "#7a5a3a"); poly([[x1, 0, r.z], [x1, r.h, r.z + r.len], [x1, 0, r.z + r.len]], "#5e4328");
      poly([[x0, 0, r.z], [x1, 0, r.z], [x1, r.h, r.z + r.len], [x0, r.h, r.z + r.len]], "#c9955a");
      poly([[x0, r.h, r.z + r.len], [x1, r.h, r.z + r.len], [x1, 0, r.z + r.len], [x0, 0, r.z + r.len]], "#8a5a30");
      for (let k = 1; k < 4; k++) poly([[x0, r.h * k / 4 - 0.02, r.z + r.len * k / 4], [x1, r.h * k / 4 - 0.02, r.z + r.len * k / 4], [x1, r.h * k / 4 + 0.02, r.z + r.len * k / 4], [x0, r.h * k / 4 + 0.02, r.z + r.len * k / 4]], "rgba(0,0,0,.25)");
    } }); });
    obs.forEach((b) => { if (b.z + b.d > pos - CB && b.z < pos + 110) items.push({ z: b.z + b.d, f: () => {
      if (b.t === "log") box(b.x, b.z, b.w, b.h, b.d, "#8a5a32", (x0, x1, h, z) => { poly([[x0, h * 0.3, z - 0.001], [x1, h * 0.3, z - 0.001], [x1, h * 0.38, z - 0.001], [x0, h * 0.38, z - 0.001]], "rgba(0,0,0,.25)"); });
      else if (b.t === "rock") box(b.x, b.z, b.w * 0.9, b.h, b.d, "#8b919d");
      else if (b.t === "crate") box(b.x, b.z, b.w * 0.95, b.h, b.d, "#c28a3e", (x0, x1, h, z) => { const q = [pr(x0, 0, z), pr(x1, h, z), pr(x1, 0, z), pr(x0, h, z)]; if (q.some((v) => !v)) return; ctx.strokeStyle = "#7a5020"; ctx.lineWidth = Math.max(1, q[0][2] * 0.1); ctx.strokeRect(q[0][0], q[1][1], q[2][0] - q[0][0], q[0][1] - q[1][1]); ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); ctx.lineTo(q[2][0], q[1][1]); ctx.moveTo(q[2][0], q[2][1]); ctx.lineTo(q[0][0], q[3][1]); ctx.stroke(); });
      else { [-RW + 0.2, RW - 0.2].forEach((px) => box(px, b.z, 0.35, b.h + 0.15, 0.4, "#e5484d")); poly([[-RW + 0.2, b.h - 0.12, b.z], [RW - 0.2, b.h - 0.12, b.z], [RW - 0.2, b.h + 0.08, b.z], [-RW + 0.2, b.h + 0.08, b.z]], "#fff"); poly([[-RW * 0.4, b.h - 0.12, b.z - 0.001], [-RW * 0.2, b.h - 0.12, b.z - 0.001], [-RW * 0.2, b.h + 0.08, b.z - 0.001], [-RW * 0.4, b.h + 0.08, b.z - 0.001]], "#e5484d"); poly([[RW * 0.2, b.h - 0.12, b.z - 0.001], [RW * 0.4, b.h - 0.12, b.z - 0.001], [RW * 0.4, b.h + 0.08, b.z - 0.001], [RW * 0.2, b.h + 0.08, b.z - 0.001]], "#e5484d"); }
    } }); });
    coins.forEach((c) => { if (!c.got && c.z > pos - CB && c.z < pos + 100) items.push({ z: c.z, f: () => { const p = pr(c.x, c.y, c.z); if (!p) return; const r = p[2] * 0.28, sq = Math.abs(Math.sin(time * 5 + c.z)); ctx.fillStyle = "#c4a020"; ctx.beginPath(); ctx.ellipse(p[0], p[1], r * (0.25 + 0.75 * sq) + 1, r, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.ellipse(p[0] - 0.5, p[1], r * (0.2 + 0.7 * sq), r * 0.85, 0, 0, 7); ctx.fill(); } }); });
    items.push({ z: L, f: () => { poly([[-RW, 0.003, L], [RW, 0.003, L], [RW, 0.003, L + 1], [-RW, 0.003, L + 1]], "#fff"); [-RW - 0.5, RW + 0.5].forEach((px) => box(px, L, 0.6, 5, 0.6, "#ffd23a")); poly([[-RW - 0.5, 4.2, L], [RW + 0.5, 4.2, L], [RW + 0.5, 5.2, L], [-RW - 0.5, 5.2, L]], "#e5484d"); } });
    items.push({ z: pos, f: drawRider });
    items.sort((a, b) => b.z - a.z);
    items.forEach((it) => it.f());
    const fog = ctx.createLinearGradient(0, HY - 2, 0, HY + 50); fog.addColorStop(0, th.b); fog.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.75; ctx.fillStyle = fog; ctx.fillRect(-10, HY - 2, W + 20, 52); ctx.globalAlpha = 1;
    part.forEach((q) => { ctx.globalAlpha = Math.max(0, q.l * 2); ctx.fillStyle = q.c; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }); ctx.globalAlpha = 1;
    // HUD
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(8, 8, 112, 28);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < hearts ? "#ff4d6a" : "#553"; ctx.beginPath(); const hx = 20 + i * 22; ctx.moveTo(hx, 26); ctx.bezierCurveTo(hx - 12, 16, hx - 4, 11, hx, 18); ctx.bezierCurveTo(hx + 4, 11, hx + 12, 16, hx, 26); ctx.fill(); }
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(W - 120, 8, 112, 28); ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.arc(W - 106, 22, 8, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left"; ctx.fillText(coinN + "/" + D.total, W - 92, 27);
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(8, 42, W - 16, 8); ctx.fillStyle = "#35e6ff"; ctx.fillRect(8, 42, (W - 16) * Math.min(1, pos / L), 8);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(8 + (W - 16) * Math.min(1, pos / L), 46, 5, 0, 7); ctx.fill();
    ctx.font = "bold 12px sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = "#fff"; ctx.fillText(Math.round(speed * 3.6) + " km/sa", W - 10, 66);
    if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT * 1.5); ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 4; ctx.font = "bold 26px sans-serif"; ctx.textAlign = "center"; ctx.strokeText(msg, W / 2, 120); ctx.fillText(msg, W / 2, 120); ctx.globalAlpha = 1; }
    if (state === "ready") { ctx.fillStyle = "rgba(0,0,0,.58)"; ctx.fillRect(0, 150, W, 130); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 24px sans-serif"; ctx.fillText("Pist " + level + ": " + th.n, W / 2, 190); ctx.font = "15px sans-serif"; ctx.fillText("Engellerden atla, sandıklardan şerit değiştirerek kaç", W / 2, 218); ctx.fillStyle = "#ffd23a"; ctx.font = "bold 18px sans-serif"; ctx.fillText("Başlamak için ekrana dokun", W / 2, 256); }
    else if (state === "count") { ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 6; ctx.textAlign = "center"; ctx.font = "bold 90px sans-serif"; const t = Math.ceil(cd); ctx.strokeText(String(t), W / 2, 240); ctx.fillText(String(t), W / 2, 240); }
    else if (state === "dead") { ctx.fillStyle = "rgba(0,0,0," + Math.min(0.5, stateT) + ")"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 26px sans-serif"; ctx.fillText("Düştün! Son kontrol noktasından devam", W / 2, 230); }
    else if (state === "done" && stateT > 0.6) {
      ctx.fillStyle = "rgba(0,0,0,.62)"; ctx.fillRect(0, 130, W, 200); ctx.textAlign = "center"; ctx.fillStyle = "#ffd23a"; ctx.font = "bold 30px sans-serif"; ctx.fillText("Bitiş çizgisi!", W / 2, 176);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i < stars ? "#ffd23a" : "#555"; ctx.font = "40px sans-serif"; ctx.fillText("★", W / 2 - 50 + i * 50, 226); }
      ctx.fillStyle = "#fff"; ctx.font = "15px sans-serif"; ctx.fillText("Altın: " + coinN + "/" + D.total + "   Kaza: " + crashes + "   Süre: " + Math.round(time) + " sn", W / 2, 262); ctx.fillText("3 yıldız: %60 altın + hiç kaza yapmadan", W / 2, 288);
    }
    ctx.restore();
  }
  function destroy() { if (dead) return; dead = true; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); }
  function loop(t) {
    if (dead) return;
    if (!root.isConnected) { if (!goneSince) goneSince = t; else if (t - goneSince > 3000) { destroy(); return; } last = t; raf = requestAnimationFrame(loop); return; }
    goneSince = 0;
    let dt = Math.min(0.05, (t - last) / 1000 || 0.016) * (o.ts || 1); last = t;
    while (dt > 0) { const d = Math.min(dt, 1 / 60); update(d); dt -= d; }
    render();
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (state === "ready") { state = "count"; cd = 2.9; } };
  let sx0 = 0, sy0 = 0, sid = -1;
  cvs.onpointerdown = (e) => { if (state === "ready") { start(); return; } sid = e.pointerId; sx0 = e.clientX; sy0 = e.clientY; try { cvs.setPointerCapture(e.pointerId); } catch (x2) {} };
  cvs.onpointerup = (e) => { if (e.pointerId !== sid) return; sid = -1; const dx = e.clientX - sx0, dy = e.clientY - sy0; if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) keys[dx > 0 ? "R" : "L"] = true; else keys.J = true; };
  const kd = (e) => { if (e.key === "ArrowLeft" || e.key === "a") keys.L = true; else if (e.key === "ArrowRight" || e.key === "d") keys.R = true; else if (e.key === "ArrowUp" || e.key === " " || e.key === "w") { keys.J = true; start(); } else if (e.key === "Enter") start(); };
  window.addEventListener("keydown", kd);
  last = performance.now(); raf = requestAnimationFrame(loop);
  return { root: root, destroy: destroy, keys: keys, theme: th.n, start: start, get dead() { return dead; }, dbg: { D: D, get pos() { return pos; }, get x() { return x; }, get y() { return y; }, get lane() { return lane; }, get state() { return state; }, get hearts() { return hearts; }, get speed() { return speed; }, get crashes() { return crashes; }, get falls() { return falls; } } };
}

function hurdle(body, el, act) {
  let inst = null, level = 1, unlocked = Math.max(1, best("nb_hb3"));
  const info = el("p", ""); info.style.cssText = "margin:0 0 4px;font-size:15px"; body.appendChild(info);
  const sub = el("p", ""); sub.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)"; body.appendChild(sub);
  const box2 = el("div", ""); body.appendChild(box2);
  const ctl = el("div", ""); ctl.style.cssText = "display:flex;gap:8px;max-width:360px;margin:0 auto 8px"; body.appendChild(ctl);
  function btn(label, key, flex) {
    const b = el("button", "", label); b.type = "button";
    b.style.cssText = "flex:" + flex + ";padding:22px 4px;font-weight:800;font-size:20px;touch-action:none;user-select:none;min-width:0";
    b.onpointerdown = (e) => { e.preventDefault(); if (!inst) return; if (key === "S") inst.start(); else inst.keys[key] = true; };
    b.oncontextmenu = (e) => e.preventDefault();
    return b;
  }
  ctl.appendChild(btn("◀", "L", 1)); ctl.appendChild(btn("⤒ ZIPLA", "J", 2)); ctl.appendChild(btn("▶", "R", 1));
  const row = el("div", ""); row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap"; body.appendChild(row);
  const bS = (n) => best("nb_hb3_s" + n), bC = (n) => best("nb_hb3_c" + n);
  function head() {
    const s = bS(level);
    info.textContent = "Pist " + level + " • " + inst.theme;
    sub.textContent = "Açık pist: " + unlocked + "   Yıldız: " + (s ? "★".repeat(s) + "☆".repeat(3 - s) : "-") + "   En çok altın: " + (bC(level) || "-");
    nextB.style.display = unlocked > level ? "" : "none";
  }
  function load(n) {
    if (inst) inst.destroy();
    box2.textContent = "";
    level = Math.max(1, Math.min(n, unlocked));
    inst = hurdleGame({
      el: el, level: level,
      onFinish: (r) => {
        if (r.stars > bS(level)) put("nb_hb3_s" + level, r.stars);
        if (r.coins > bC(level)) put("nb_hb3_c" + level, r.coins);
        if (level + 1 > unlocked) { unlocked = level + 1; put("nb_hb3", unlocked); }
        head();
      }
    });
    box2.appendChild(inst.root);
    head();
  }
  const bPrev = act("◀", () => load(level - 1)), bNext = act("▶", () => load(level + 1)), retry = act("Baştan", () => load(level)), nextB = act("Sonraki pist ▶", () => load(level + 1));
  [bPrev, bNext, retry, nextB].forEach((b) => { b.style.minWidth = "0"; row.appendChild(b); });
  const hint = el("p", "", "Başlamak için ekrana dokun. ◀ ▶ ile şerit değiştir, ⤒ ZIPLA ile atla (ekranda sağa/sola kaydırarak şerit, yukarı dokunarak zıplama da yapabilirsin). Kütük, taş ve çitlerin üstünden atla, boşlukları zıplayarak geç. Büyük sandıklardan atlanmaz: şerit değiştir! Rampa seni çok yükseğe fırlatır, havadaki altınları topla. 3 kalbin var, bitince son kontrol noktasından devam edersin. Bitiş çizgisinde: bitir (1★), altınların %60'ını topla (2★), hiç kaza yapma (3★).");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px"; body.appendChild(hint);
  load(1);
  return () => { if (inst) inst.destroy(); };
}

export const SOLO = { hurdle3d: { group: "Aksiyon", icon: "🚵", label: "Atlayış Bisikleti 3D", start: hurdle } };
