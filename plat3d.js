// Aksiyon oyunları 19: Macera Ormanı 3D (orijinal platform oyunu: 2 karakter, 6 dünya, elmas, düşman, kalpler, yıldızlar)
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function put(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
const mul32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const T = 26, R = 16, W = 360, H = T * R, DX = 7;
const THEMES = [
  { n: "Yeşil Orman", s: ["#5bb8ff", "#d6f0ff"], f: "#7fc8a0", m: "#4fa56a", top: "#4cc35a", topL: "#8ae27a", side: "#8a5a32", sideD: "#5e3b1f", bg: "hills", cl: "#fff" },
  { n: "Çöl Vadisi", s: ["#4aa8ff", "#ffe9b8"], f: "#e6c187", m: "#d4a465", top: "#e8c46a", topL: "#f6dc92", side: "#b9844a", sideD: "#8a5e2e", bg: "dunes", cl: "#fff" },
  { n: "Karlı Dağlar", s: ["#8fb4e8", "#f0f6ff"], f: "#c9d6ea", m: "#aebfd9", top: "#f2f7ff", topL: "#ffffff", side: "#7c8aa8", sideD: "#58657f", bg: "peaks", cl: "#fff" },
  { n: "Kristal Mağara", s: ["#120a26", "#2a1650"], f: "#3a2468", m: "#2a1850", top: "#5b86d6", topL: "#8fb4ff", side: "#3b2f5e", sideD: "#241a3f", bg: "cave", cl: "" },
  { n: "Lav Dağı", s: ["#2a0d10", "#c4501c"], f: "#7a2a1a", m: "#4a1a12", top: "#6b4a3a", topL: "#8f6a52", side: "#3e2a24", sideD: "#241512", bg: "volcano", cl: "" },
  { n: "Gün Batımı Adaları", s: ["#35255f", "#ff9d5c"], f: "#8e5a8a", m: "#5b3a6e", top: "#6bd0a0", topL: "#a2f0c8", side: "#8a6a5a", sideD: "#5a3f35", bg: "islands", cl: "#ffd9b0" }
];
const CHARS = [
  { n: "Kuzey", skin: "#f1c7a0", hair: "#6a3d1c", top: "#f08a24", topD: "#c46a10", pants: "#2f5fd0", acc: "#ffd23a", ponytail: false },
  { n: "Duru", skin: "#e8b88e", hair: "#2a1a14", top: "#1fa7a0", topD: "#137d78", pants: "#f0b323", acc: "#e5484d", ponytail: true }
];

function gen(level) {
  const rnd = mul32(level * 7919 + 13), diff = Math.min(1, (level - 1) / 9), COLS = 100 + 12 * Math.min(level, 9) + 24;
  const gh = new Array(COLS).fill(3), pf = {}, movers = [], enemies = [], gems = [], springs = [];
  let cp = null, goal = 0, x = 0, h = 3, lastFlat = 0, half = Math.floor(COLS / 2);
  const pi = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  function flat(n, hh) { for (let i = 0; i < n && x < COLS; i++) gh[x++] = hh; }
  function gemRow(x0, n, y) { for (let i = 0; i < n; i++) gems.push({ x: x0 + i + 0.5, y: y }); }
  function gemArc(x0, w, y0) { for (let i = 0; i < w; i++) gems.push({ x: x0 + i + 0.5, y: y0 - Math.sin((i + 0.5) / w * Math.PI) * 2.2 }); }
  flat(8, h); lastFlat = 8;
  while (x < COLS - 20) {
    let r = rnd() * (5.4 + (level >= 3 ? 0.6 : 0)); if (x < 24) r = Math.min(r, 3.5); const top = R - h;
    if (r < 2.4 || lastFlat < 3) {
      const n = pi(4, 9), x0 = x;
      flat(n, h); lastFlat += n;
      gemRow(x0 + 1, Math.min(n - 2, 4), top - 1.4);
      if (n >= 5 && rnd() < 0.3 + 0.4 * diff) enemies.push({ t: "slime", x: x0 + n / 2, y: top, a: x0 + 1, b: x0 + n - 1 });
      else if (n >= 6 && rnd() < 0.15 + 0.3 * diff) { enemies.push({ t: "spike", x: x0 + n / 2, y: top }); gemArc(x0 + n / 2 - 1.5, 3, top - 1.6); }
      else if (n >= 7 && rnd() < 0.2 + 0.3 * diff) enemies.push({ t: "bat", x: x0 + n / 2, y: top - 3.2, a: x0 - 1, b: x0 + n + 1 });
      if (!cp && x >= half) cp = { x: x0 + 1, y: top };
    } else if (r < 3.6) {
      const gw = pi(2, 2 + Math.round(diff * 2)), x0 = x;
      for (let i = 0; i < gw; i++) gh[x++] = 0;
      gemArc(x0, gw, top - 1.6);
      const nh = gw >= 4 ? Math.min(h, pi(2, h)) : Math.max(2, Math.min(6, h + pi(-1, 1)));
      h = nh; flat(3, h); lastFlat = 3;
    } else if (r < 4.4) {
      const up = rnd() < 0.5, steps = pi(2, 3);
      for (let s = 0; s < steps; s++) { const nh = h + (up ? 1 : -1); if (nh < 2 || nh > 6) break; h = nh; flat(2, h); gemRow(x - 2 + 0.5, 1, R - h - 1.4); }
      flat(2, h); lastFlat = 2;
    } else if (r < 5.4) {
      const x0 = x, y = R - h - 2;
      for (let i = 0; i < 9; i++) gh[x++] = 0;
      [[x0 + 1, 3], [x0 + 5, 3]].forEach((p) => { for (let i = 0; i < p[1]; i++) pf[y * 1000 + p[0] + i] = 1; gemRow(p[0], p[1], y - 1.3); });
      if (rnd() < 0.3 + 0.5 * diff) enemies.push({ t: "bat", x: x0 + 4.5, y: y - 2.6, a: x0 + 1, b: x0 + 8 });
      flat(3, h); lastFlat = 3;
    } else {
      const x0 = x;
      for (let i = 0; i < 8; i++) gh[x++] = 0;
      movers.push({ x0: (x0 - 1) * T, x1: (x0 + 8 + 1) * T - 3 * T, y: (R - h) * T, w: 3 * T, sp: 46 + diff * 22, ph: rnd() * 6, dx: 0, x: (x0 - 1) * T });
      gemRow(x0 + 2, 4, R - h - 2.4);
      flat(3, h); lastFlat = 3;
    }
    if (rnd() < 0.18 && lastFlat >= 6 && x < COLS - 24) {
      const sx = x - 4;
      springs.push({ x: sx });
      const y = R - h - 5;
      if (y >= 1) { for (let i = 0; i < 3; i++) pf[y * 1000 + sx - 1 + i] = 1; gemRow(sx - 1, 3, y - 1.3); }
    }
  }
  while (x < COLS) gh[x++] = h;
  goal = COLS - 6;
  if (!cp) cp = { x: half, y: R - gh[half] };
  const tot = gems.length;
  return { COLS: COLS, gh: gh, pf: pf, movers: movers, enemies: enemies, gems: gems, springs: springs, cp: cp, goal: goal, total: tot };
}

export function platGame(o) {
  const el = o.el, level = Math.max(1, o.level || 1), th = THEMES[(level - 1) % 6], ch = CHARS[o.char ? o.char() : 0] || CHARS[0];
  const L = gen(level), COLS = L.COLS, gh = L.gh, pf = L.pf;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const root = el("div", "");
  const cvs = el("canvas", "");
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.cssText = "display:block;width:100%;max-width:360px;margin:0 auto 8px;touch-action:none;user-select:none;border-radius:12px";
  root.appendChild(cvs);
  const ctx = cvs.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const keys = { left: false, right: false, jump: false };
  const solid = (tx, ty) => { if (tx < 0 || tx >= COLS) return true; if (ty < 0 || ty >= R) return false; return (gh[tx] > 0 && ty >= R - gh[tx]) || !!pf[ty * 1000 + tx]; };
  const groundY = (tx) => (gh[tx] > 0 ? (R - gh[tx]) * T : 99999);
  const gems = L.gems.map((g) => ({ x: g.x * T, y: g.y * T, got: false }));
  const en = L.enemies.map((e) => ({ t: e.t, x: e.x * T, y: e.y * T, vx: e.t === "slime" ? 32 * (Math.random() < 0.5 ? -1 : 1) : 0, vy: 0, a: (e.a || 0) * T, b: (e.b || 0) * T, by: e.y * T, dead: 0, ph: Math.random() * 6, w: e.t === "slime" ? T * 0.8 : T * 0.8, h: e.t === "slime" ? T * 0.7 : T * 0.7 }));
  const sp = L.springs.map((s) => ({ x: s.x * T + T / 2, y: groundY(s.x), t: 0 }));
  const startX = 3 * T, startY = groundY(3);
  let p = { x: startX, y: startY, vx: 0, vy: 0, w: T * 0.64, h: T * 0.98, face: 1, ground: false, coy: 0, buf: 0, inv: 0, hearts: 3, anim: 0, onM: null };
  let respawn = { x: startX, y: startY }, cpOn = false;
  let state = "play", cam = 0, ts = 1, gemCount = 0, deaths = 0, time = 0, stateT = 0, intro = 2.2, shake = 0, stars = 0, wasJump = false, dead = false, raf, last, goneSince = 0, part = [];
  function burst(x, y, col, n) { for (let i = 0; i < n; i++) part.push({ x: x, y: y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 160 - 20, l: 0.5 + Math.random() * 0.4, c: col }); }

  function moveX(e, dx) {
    e.x += dx;
    const l = Math.floor((e.x - e.w / 2) / T), r = Math.floor((e.x + e.w / 2 - 0.01) / T), t = Math.floor((e.y - e.h) / T), b = Math.floor((e.y - 0.01) / T);
    for (let ty = t; ty <= b; ty++) for (let tx = l; tx <= r; tx++) if (solid(tx, ty)) { e.x = dx > 0 ? tx * T - e.w / 2 : (tx + 1) * T + e.w / 2; e.hitX = true; return; }
  }
  function moveY(e, dy) {
    e.y += dy; e.gnd = false;
    const l = Math.floor((e.x - e.w / 2) / T), r = Math.floor((e.x + e.w / 2 - 0.01) / T), t = Math.floor((e.y - e.h) / T), b = Math.floor((e.y - 0.01) / T);
    for (let ty = t; ty <= b; ty++) for (let tx = l; tx <= r; tx++) if (solid(tx, ty)) {
      if (dy > 0) { e.y = ty * T; e.vy = 0; e.gnd = true; } else { e.y = (ty + 1) * T + e.h; e.vy = 0; }
      return;
    }
  }
  function die() {
    if (state !== "play") return;
    state = "dead"; stateT = 0; deaths++; shake = 0.3; burst(p.x, p.y - 12, "#fff", 14);
  }
  function hurt() {
    if (p.inv > 0 || state !== "play") return;
    p.hearts--; p.inv = 1.6; p.vy = -260; p.vx = -p.face * 140; shake = 0.2;
    if (p.hearts <= 0) die();
  }
  function step(dt) {
    time += dt; if (intro > 0) intro -= dt; if (shake > 0) shake -= dt;
    L.movers.forEach((m) => { const nx = m.x0 + (m.x1 - m.x0) * (0.5 + 0.5 * Math.sin(time * m.sp / ((m.x1 - m.x0) / 2) + m.ph)); m.dx = nx - m.x; m.x = nx; });
    sp.forEach((s) => { if (s.t > 0) s.t -= dt; });
    en.forEach((e) => {
      if (e.dead) { e.dead += dt; return; }
      e.ph += dt;
      if (e.t === "slime") {
        e.vy += 1300 * dt; e.hitX = false; moveX(e, e.vx * dt); moveY(e, e.vy * dt);
        const ax = e.x + Math.sign(e.vx) * (e.w / 2 + 2), ty = Math.floor((e.y + 2) / T);
        if (e.hitX || e.x < e.a || e.x > e.b || (e.gnd && !solid(Math.floor(ax / T), ty))) { e.vx = -e.vx; e.x += e.vx * dt * 2; }
      } else if (e.t === "bat") {
        e.x += Math.cos(e.ph * 1.2) * 38 * dt; e.y = e.by + Math.sin(e.ph * 2.2) * T * 0.8;
        if (e.x < e.a) e.x = e.a; if (e.x > e.b) e.x = e.b;
      }
    });
    if (state === "dead") { stateT += dt; if (stateT > 0.9) { p.x = respawn.x; p.y = respawn.y; p.vx = 0; p.vy = 0; p.hearts = 3; p.inv = 1.5; state = "play"; } return; }
    if (state === "win") { stateT += dt; return; }
    // oyuncu
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const acc = p.ground ? 1400 : 900;
    if (dir) { p.vx += dir * acc * dt; p.face = dir; } else p.vx -= Math.sign(p.vx) * Math.min(Math.abs(p.vx), (p.ground ? 1300 : 300) * dt);
    p.vx = Math.max(-150, Math.min(150, p.vx));
    if (keys.jump && !wasJump) p.buf = 0.12;
    wasJump = keys.jump;
    p.buf -= dt; p.coy -= dt; if (p.ground) p.coy = 0.1;
    if (p.buf > 0 && p.coy > 0) { p.vy = -465; p.coy = 0; p.buf = 0; p.ground = false; burst(p.x, p.y, "#fff", 4); }
    if (!keys.jump && p.vy < -170) p.vy = -170;
    p.vy = Math.min(p.vy + 1300 * dt, 640);
    const py0 = p.y;
    p.hitX = false;
    if (p.onM) { moveX(p, p.onM.dx); }
    moveX(p, p.vx * dt);
    moveY(p, p.vy * dt);
    p.ground = p.gnd;
    p.onM = null;
    L.movers.forEach((m) => {
      if (p.vy >= 0 && py0 <= m.y + 3 && p.y >= m.y && p.x + p.w / 2 > m.x && p.x - p.w / 2 < m.x + m.w) { p.y = m.y; p.vy = 0; p.ground = true; p.onM = m; }
    });
    if (p.inv > 0) p.inv -= dt;
    p.anim += Math.abs(p.vx) * dt * 0.09;
    sp.forEach((s) => { if (p.vy >= 0 && Math.abs(p.x - s.x) < T * 0.6 && p.y >= s.y - 8 && p.y <= s.y + 6) { p.vy = -610; p.ground = false; s.t = 0.3; burst(s.x, s.y, "#ffd23a", 6); } });
    gems.forEach((g) => { if (!g.got && Math.abs(p.x - g.x) < T * 0.6 && Math.abs(p.y - p.h / 2 - g.y) < T * 0.75) { g.got = true; gemCount++; burst(g.x, g.y, "#6fe3ff", 5); } });
    en.forEach((e) => {
      if (e.dead) return;
      const ex = Math.abs(p.x - e.x) < (p.w + e.w) / 2 - 2, ey = p.y > e.y - e.h && p.y - p.h < e.y;
      if (!(ex && ey)) return;
      if (e.t !== "spike" && p.vy > 40 && py0 <= e.y - e.h * 0.4) { e.dead = 0.001; p.vy = -380; burst(e.x, e.y - 8, "#ffb347", 8); }
      else hurt();
    });
    if (L.cp && !cpOn && p.x > L.cp.x * T) { cpOn = true; respawn = { x: L.cp.x * T, y: L.cp.y * T }; burst(L.cp.x * T, L.cp.y * T - 20, "#ffd23a", 10); }
    if (p.y > H + 60) die();
    if (p.x > L.goal * T) {
      state = "win"; stateT = 0;
      stars = 1 + (gemCount >= L.total * 0.7 ? 1 : 0) + (deaths === 0 ? 1 : 0);
      burst(p.x, p.y - 20, "#ffd23a", 24);
      if (o.onFinish) o.onFinish({ gems: gemCount, total: L.total, deaths: deaths, time: Math.round(time), stars: stars });
    }
    part.forEach((q) => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 500 * dt; q.l -= dt; });
    part = part.filter((q) => q.l > 0);
    const tc = Math.max(0, Math.min(COLS * T - W, p.x - W * 0.38 + p.vx * 0.3));
    cam += (tc - cam) * Math.min(1, dt * 6);
  }

  function silh(type, x) {
    if (type === "hills") return 38 + 24 * Math.sin(x * 0.012) + 12 * Math.sin(x * 0.031);
    if (type === "dunes") return 30 + 22 * Math.sin(x * 0.008 + 1) + 6 * Math.sin(x * 0.02);
    if (type === "islands") return 20 + 40 * Math.max(0, Math.sin(x * 0.011)) ** 2;
    return 22 + 60 * Math.abs(Math.sin(x * 0.0085)) + 10 * Math.sin(x * 0.04);
  }
  function drawHero(x, y, face, anim, inv, spec) {
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
    if (inv > 0 && Math.floor(inv * 14) % 2) ctx.globalAlpha = 0.4;
    const run = Math.abs(p.vx) > 15, sw = run && p.ground ? Math.sin(anim * 2) : 0, air = !p.ground;
    ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(0, 0, 9, 3, 0, 0, 7); ctx.fill();
    const leg = (dx, ph) => { ctx.fillStyle = ch.pants; ctx.fillRect(dx - 3 + (air ? ph * 2 : sw * 5 * ph), -9, 6, 9); ctx.fillStyle = "#3a2a22"; ctx.fillRect(dx - 3 + (air ? ph * 2 : sw * 5 * ph), -3, 8, 3); };
    leg(-4, -1); leg(4, 1);
    const g = ctx.createLinearGradient(-8, 0, 8, 0); g.addColorStop(0, ch.topD); g.addColorStop(0.5, ch.top); g.addColorStop(1, ch.topD);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-8, -9); ctx.lineTo(-7, -19); ctx.lineTo(7, -19); ctx.lineTo(8, -9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ch.acc; ctx.fillRect(-8, -12, 16, 2);
    const ay = air ? -22 : -15 + sw * 2;
    ctx.fillStyle = ch.skin; ctx.beginPath(); ctx.arc(9, ay, 3.2, 0, 7); ctx.fill();
    ctx.strokeStyle = ch.topD; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(6, -18); ctx.lineTo(9, ay); ctx.stroke();
    if (ch.ponytail) { ctx.fillStyle = ch.hair; ctx.beginPath(); ctx.ellipse(-9 - sw * 1.5, -22, 4, 6, 0.5, 0, 7); ctx.fill(); }
    ctx.fillStyle = ch.skin; ctx.beginPath(); ctx.arc(0, -25, 8, 0, 7); ctx.fill();
    ctx.fillStyle = ch.hair; ctx.beginPath(); ctx.arc(0, -27, 8.5, Math.PI, 0); ctx.lineTo(8, -25); ctx.lineTo(3, -28); ctx.lineTo(-8, -24); ctx.closePath(); ctx.fill();
    if (!ch.ponytail) { ctx.beginPath(); ctx.moveTo(-6, -33); ctx.lineTo(-3, -37); ctx.lineTo(0, -33); ctx.lineTo(3, -37); ctx.lineTo(6, -32); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = ch.acc; ctx.fillRect(-8, -29, 16, 2.5);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(3.5, -25, 2.6, 0, 7); ctx.fill(); ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(4.4, -25, 1.3, 0, 7); ctx.fill();
    ctx.strokeStyle = "#a0452a"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(3, -21, 2.3, 0.2, 2.5); ctx.stroke();
    ctx.restore();
  }
  function drawEnemy(e) {
    ctx.save(); ctx.translate(e.x, e.y);
    if (e.dead) { ctx.globalAlpha = Math.max(0, 1 - e.dead * 3); ctx.scale(1.2, 0.3); }
    if (e.t === "slime") {
      const sq = 1 + Math.sin(e.ph * 8) * 0.07;
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(0, 0, 11, 3, 0, 0, 7); ctx.fill();
      const g = ctx.createRadialGradient(-3, -12, 2, 0, -8, 14); g.addColorStop(0, "#ffd9a0"); g.addColorStop(0.5, "#ff9a3c"); g.addColorStop(1, "#c4601a");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.quadraticCurveTo(-12 * sq, -18 / sq, 0, -18 / sq); ctx.quadraticCurveTo(12 * sq, -18 / sq, 11, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-4, -10, 3, 0, 7); ctx.arc(4, -10, 3, 0, 7); ctx.fill();
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(-3.5 + Math.sign(e.vx), -10, 1.5, 0, 7); ctx.arc(4.5 + Math.sign(e.vx), -10, 1.5, 0, 7); ctx.fill();
    } else if (e.t === "bat") {
      const f = Math.sin(e.ph * 14) * 7;
      ctx.fillStyle = "#2a2036"; ctx.beginPath(); ctx.ellipse(0, -9, 7, 6, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(-17, -10 - f); ctx.lineTo(-10, -4); ctx.lineTo(-4, -5); ctx.moveTo(5, -10); ctx.lineTo(17, -10 - f); ctx.lineTo(10, -4); ctx.lineTo(4, -5); ctx.fill();
      ctx.fillStyle = "#ff6a6a"; ctx.beginPath(); ctx.arc(-2.5, -10, 1.6, 0, 7); ctx.arc(2.5, -10, 1.6, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(0, 0, 11, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#b9c0cc";
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.2) * 9, -10 + Math.sin(a - 0.2) * 9); ctx.lineTo(Math.cos(a) * 15, -10 + Math.sin(a) * 15); ctx.lineTo(Math.cos(a + 0.2) * 9, -10 + Math.sin(a + 0.2) * 9); ctx.fill(); }
      const g = ctx.createRadialGradient(-3, -13, 1, 0, -10, 10); g.addColorStop(0, "#9aa4b5"); g.addColorStop(1, "#3a4252");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -10, 9, 0, 7); ctx.fill();
      ctx.fillStyle = "#ff6a6a"; ctx.beginPath(); ctx.arc(-3, -11, 1.6, 0, 7); ctx.arc(3, -11, 1.6, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  function slab(x, y, w, hgt, cTop, cTopL, cSide, cSideD, grass) {
    ctx.fillStyle = cSideD; ctx.fillRect(x + DX, y - DX, w, hgt);
    ctx.fillStyle = cSide; ctx.fillRect(x, y, w, hgt);
    if (grass) {
      ctx.fillStyle = cTopL; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w + DX, y - DX); ctx.lineTo(x + DX, y - DX); ctx.closePath(); ctx.fill();
      ctx.fillStyle = cTop; ctx.fillRect(x, y, w, 7);
    }
  }
  function render() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, th.s[0]); sky.addColorStop(1, th.s[1]);
    ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, H + 20);
    if (th.bg === "cave" || th.bg === "volcano") {
      ctx.fillStyle = th.bg === "cave" ? "#8fb4ff" : "#ffcf6a";
      for (let i = 0; i < 30; i++) { ctx.globalAlpha = 0.3 + (i % 4) * 0.15; ctx.fillRect((i * 53 - cam * 0.05 + 1000) % W, (i * 37) % (H - 120), 2, 2); } ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.arc(290, 60, 22, 0, 7); ctx.fill();
      ctx.fillStyle = th.cl;
      for (let i = 0; i < 6; i++) { const cx = ((i * 190 - cam * 0.12) % 1140 + 1140) % 1140 - 120, cy = 50 + (i * 47) % 110; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(cx, cy, 34, 11, 0, 0, 7); ctx.ellipse(cx + 20, cy - 6, 22, 11, 0, 0, 7); ctx.ellipse(cx - 18, cy - 3, 20, 9, 0, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    [[0.18, th.f, 120], [0.4, th.m, 70]].forEach((lay) => {
      ctx.fillStyle = lay[1]; ctx.beginPath(); ctx.moveTo(0, H);
      for (let sx = 0; sx <= W + 8; sx += 8) ctx.lineTo(sx, H - lay[2] - silh(th.bg, sx + cam * lay[0] + (lay[0] > 0.3 ? 400 : 0)) * (lay[0] > 0.3 ? 0.8 : 1.2));
      ctx.lineTo(W + 8, H); ctx.closePath(); ctx.fill();
    });
    if (th.bg === "cave") { ctx.fillStyle = "#0b0618"; for (let sx = -20; sx < W + 40; sx += 34) { const hh = 24 + ((Math.floor((sx + cam * 0.5) / 34) * 2654435761 >>> 0) % 40); ctx.beginPath(); ctx.moveTo(sx - ((cam * 0.5) % 34), 0); ctx.lineTo(sx - ((cam * 0.5) % 34) + 34, 0); ctx.lineTo(sx - ((cam * 0.5) % 34) + 17, hh); ctx.fill(); } }
    ctx.save(); ctx.translate(-Math.floor(cam), 0);
    const c0 = Math.max(0, Math.floor(cam / T) - 1), c1 = Math.min(COLS - 1, Math.ceil((cam + W) / T) + 1);
    for (let x = c0; x <= c1; x++) if (gh[x] > 0) { const y = (R - gh[x]) * T; slab(x * T, y, T, gh[x] * T + 40, th.top, th.topL, th.side, th.sideD, true); }
    for (const k in pf) { const ty = Math.floor(k / 1000), tx = k - ty * 1000; if (tx >= c0 && tx <= c1) slab(tx * T, ty * T, T, T, th.top, th.topL, th.side, th.sideD, true); }
    L.movers.forEach((m) => { slab(m.x, m.y, m.w, T * 0.42, "#ffb347", "#ffd98a", "#c46a10", "#8a470a", true); });
    // bitiş kapısı
    const gx = L.goal * T, gy = groundY(L.goal);
    ctx.fillStyle = "#6a4a8a"; ctx.fillRect(gx - 22, gy - 70, 10, 70); ctx.fillRect(gx + 12, gy - 70, 10, 70);
    ctx.fillStyle = "#8a6ab0"; ctx.fillRect(gx - 22, gy - 70, 3, 70); ctx.fillRect(gx + 12, gy - 70, 3, 70);
    ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.arc(gx, gy - 70, 22, Math.PI, 0); ctx.fill();
    const pg = ctx.createLinearGradient(gx, gy - 70, gx, gy); pg.addColorStop(0, "rgba(140,230,255,.95)"); pg.addColorStop(1, "rgba(180,120,255,.7)");
    ctx.fillStyle = pg; ctx.fillRect(gx - 12, gy - 70, 24, 70);
    ctx.fillStyle = "rgba(255,255,255,.6)"; for (let i = 0; i < 4; i++) { const yy = gy - ((time * 30 + i * 18) % 70); ctx.fillRect(gx - 8 + (i % 2) * 8, yy, 4, 4); }
    // kontrol noktası
    const cx0 = L.cp.x * T, cy0 = L.cp.y * T;
    ctx.fillStyle = "#e8e8f0"; ctx.fillRect(cx0 - 1.5, cy0 - 40, 3, 40);
    ctx.fillStyle = cpOn ? "#4cc35a" : "#c4c4cc"; ctx.beginPath(); ctx.moveTo(cx0 + 1.5, cy0 - 40); ctx.lineTo(cx0 + 20, cy0 - 33 + Math.sin(time * 5) * 1.5); ctx.lineTo(cx0 + 1.5, cy0 - 26); ctx.fill();
    sp.forEach((s) => {
      const k = s.t > 0 ? 0.5 : 1;
      ctx.fillStyle = "#6a6a78"; ctx.fillRect(s.x - 11, s.y - 4, 22, 4);
      ctx.fillStyle = "#ffd23a"; ctx.fillRect(s.x - 9, s.y - 4 - 10 * k, 18, 4); ctx.strokeStyle = "#c4a020"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x - 6, s.y - 4); ctx.lineTo(s.x + 6, s.y - 4 - 5 * k); ctx.lineTo(s.x - 6, s.y - 4 - 10 * k); ctx.stroke();
    });
    gems.forEach((g) => {
      if (g.got || g.x < cam - 20 || g.x > cam + W + 20) return;
      const bob = Math.sin(time * 4 + g.x * 0.05) * 2, sc = 0.8 + 0.2 * Math.abs(Math.sin(time * 3 + g.x * 0.1));
      ctx.save(); ctx.translate(g.x, g.y + bob); ctx.scale(sc, 1);
      ctx.fillStyle = "#6fe3ff"; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(7, -2); ctx.lineTo(0, 8); ctx.lineTo(-7, -2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#c9f6ff"; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(-7, -2); ctx.lineTo(0, -1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#2fa8d9"; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(7, -2); ctx.lineTo(0, 8); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    en.forEach((e) => { if (e.x > cam - 40 && e.x < cam + W + 40 && !(e.dead && e.dead > 0.4)) drawEnemy(e); });
    if (!(state === "dead")) drawHero(p.x, p.y, p.face, p.anim, p.inv, ch);
    part.forEach((q) => { ctx.globalAlpha = Math.max(0, q.l * 2); ctx.fillStyle = q.c; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }); ctx.globalAlpha = 1;
    ctx.restore();
    // HUD
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(8, 8, 150, 26);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < p.hearts ? "#ff4d6a" : "#553"; ctx.beginPath(); const hx = 20 + i * 22; ctx.moveTo(hx, 24); ctx.bezierCurveTo(hx - 12, 14, hx - 4, 9, hx, 16); ctx.bezierCurveTo(hx + 4, 9, hx + 12, 14, hx, 24); ctx.fill(); }
    ctx.fillStyle = "#6fe3ff"; ctx.beginPath(); ctx.moveTo(98, 13); ctx.lineTo(104, 19); ctx.lineTo(98, 28); ctx.lineTo(92, 19); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left"; ctx.fillText(gemCount + "/" + L.total, 110, 26);
    const pr = Math.min(1, p.x / (L.goal * T));
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(168, 17, 184, 8); ctx.fillStyle = "#ffd23a"; ctx.fillRect(168, 17, 184 * pr, 8);
    if (intro > 0 && state === "play") { ctx.globalAlpha = Math.min(1, intro); ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 150, W, 70); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 22px sans-serif"; ctx.fillText("Seviye " + level + " • " + th.n, W / 2, 182); ctx.font = "14px sans-serif"; ctx.fillText("Kapıya ulaş, elmasları topla!", W / 2, 204); ctx.globalAlpha = 1; }
    if (state === "dead") { ctx.fillStyle = "rgba(0,0,0," + Math.min(0.5, stateT) + ")"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 24px sans-serif"; ctx.fillText("Tekrar dene!", W / 2, 200); }
    if (state === "win") {
      ctx.fillStyle = "rgba(0,0,0,.62)"; ctx.fillRect(0, 110, W, 200); ctx.textAlign = "center"; ctx.fillStyle = "#ffd23a"; ctx.font = "bold 30px sans-serif"; ctx.fillText("Seviye tamam!", W / 2, 158);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i < stars ? "#ffd23a" : "#555"; ctx.font = "40px sans-serif"; ctx.fillText("★", W / 2 - 50 + i * 50, 208); }
      ctx.fillStyle = "#fff"; ctx.font = "15px sans-serif"; ctx.fillText("Elmas: " + gemCount + "/" + L.total + "   Düşme/can kaybı: " + deaths + "   Süre: " + Math.round(time) + " sn", W / 2, 244);
      ctx.fillText("3 yıldız: %70 elmas + hiç ölmeden", W / 2, 270);
    }
    ctx.restore();
  }
  function destroy() { if (dead) return; dead = true; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); }
  function loop(t) {
    if (dead) return;
    if (!root.isConnected) { if (!goneSince) goneSince = t; else if (t - goneSince > 3000) { destroy(); return; } last = t; raf = requestAnimationFrame(loop); return; }
    goneSince = 0;
    let dt = Math.min(0.05, (t - last) / 1000 || 0.016) * ts; last = t;
    while (dt > 0) { const d = Math.min(dt, 1 / 60); step(d); dt -= d; }
    render();
    raf = requestAnimationFrame(loop);
  }
  const kmap = { ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right", ArrowUp: "jump", w: "jump", " ": "jump" };
  const kd = (e) => { if (kmap[e.key]) keys[kmap[e.key]] = true; };
  const ku = (e) => { if (kmap[e.key]) keys[kmap[e.key]] = false; };
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
  last = performance.now(); raf = requestAnimationFrame(loop);
  return { root: root, destroy: destroy, keys: keys, theme: th.n, get dead() { return dead; }, get ts() { return ts; }, set ts(v) { ts = v; }, dbg: { get p() { return p; }, get state() { return state; }, solid: solid, L: L, en: en, T: T, get gems() { return gemCount; }, get deaths() { return deaths; } } };
}

function plat(body, el, act) {
  let inst = null, level = 1, unlocked = Math.max(1, best("nb_pl3")), chI = Math.min(1, best("nb_pl3_ch"));
  const info = el("p", ""); info.style.cssText = "margin:0 0 4px;font-size:15px"; body.appendChild(info);
  const sub = el("p", ""); sub.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)"; body.appendChild(sub);
  const box = el("div", ""); body.appendChild(box);
  const ctl = el("div", ""); ctl.style.cssText = "display:flex;gap:8px;max-width:360px;margin:0 auto 8px;align-items:stretch"; body.appendChild(ctl);
  function hold(label, key, flex) {
    const b = el("button", "", label); b.type = "button";
    b.style.cssText = "flex:" + flex + ";padding:20px 4px;font-weight:800;font-size:22px;touch-action:none;user-select:none;min-width:0";
    const on = (e) => { try { b.setPointerCapture(e.pointerId); } catch (x) {} if (inst) inst.keys[key] = true; };
    const off = () => { if (inst) inst.keys[key] = false; };
    b.onpointerdown = on; b.onpointerup = off; b.onpointercancel = off; b.onpointerleave = off;
    b.oncontextmenu = (e) => e.preventDefault();
    return b;
  }
  ctl.appendChild(hold("◀", "left", 1)); ctl.appendChild(hold("▶", "right", 1)); ctl.appendChild(hold("⤒ ZIPLA", "jump", 2));
  const chRow = el("div", ""); chRow.style.cssText = "display:flex;gap:8px;max-width:360px;margin:0 auto 8px;align-items:center;justify-content:center"; body.appendChild(chRow);
  chRow.appendChild(el("span", "", "Karakter:"));
  const cbs = [];
  CHARS.forEach((c, i) => {
    const b = el("button", "", (i ? "🎀 " : "🧢 ") + c.n); b.type = "button"; b.style.cssText = "padding:8px 14px;font-weight:700";
    b.onclick = () => { chI = i; put("nb_pl3_ch", i); cbs.forEach((x, j) => x.style.setProperty("border", j === i ? "2px solid #f0c24b" : "1px solid #2a3d57", "important")); load(level); };
    cbs.push(b); chRow.appendChild(b);
  });
  cbs[chI].style.setProperty("border", "2px solid #f0c24b", "important");
  const row = el("div", ""); row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap"; body.appendChild(row);
  const bS = (n) => best("nb_pl3_s" + n), bG = (n) => best("nb_pl3_g" + n);
  function head() {
    const s = bS(level);
    info.textContent = "Seviye " + level + " • " + inst.theme;
    sub.textContent = "Açık seviye: " + unlocked + "   Yıldız: " + (s ? "★".repeat(s) + "☆".repeat(3 - s) : "-") + "   En çok elmas: " + (bG(level) || "-");
    nextB.style.display = unlocked > level ? "" : "none";
  }
  function load(n) {
    if (inst) inst.destroy();
    box.textContent = "";
    level = Math.max(1, Math.min(n, unlocked));
    inst = platGame({
      el: el, level: level, char: () => chI,
      onFinish: (r) => {
        if (r.stars > bS(level)) put("nb_pl3_s" + level, r.stars);
        if (r.gems > bG(level)) put("nb_pl3_g" + level, r.gems);
        if (level + 1 > unlocked) { unlocked = level + 1; put("nb_pl3", unlocked); }
        head();
      }
    });
    box.appendChild(inst.root);
    head();
  }
  const bPrev = act("◀", () => load(level - 1)), bNext = act("▶", () => load(level + 1)), retry = act("Baştan", () => load(level)), nextB = act("Sonraki seviye ▶", () => load(level + 1));
  [bPrev, bNext, retry, nextB].forEach((b) => { b.style.minWidth = "0"; row.appendChild(b); });
  const hint = el("p", "", "◀ ▶ ile koş, ZIPLA'ya basılı tutarsan daha yükseğe zıplarsın. Düşmanların üstüne zıplayarak ez (dikenli topa dokunma!). Sarı yaylara basarsan yükseğe fırlarsın. Yarı yolda bayrağa dokunursan oradan devam edersin. Boşluğa düşersen bayraktan başlarsın. 3 kalbin var. Kapıya ulaşınca seviye biter: elmasların %70'ini topla ve hiç ölme, 3 yıldız kazan. Karakter seçebilirsin.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px"; body.appendChild(hint);
  load(1);
  return () => { if (inst) inst.destroy(); };
}

export const SOLO = { plat3d: { group: "Aksiyon", icon: "🏃", label: "Macera Ormanı 3D", start: plat } };
