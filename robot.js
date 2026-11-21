// Aksiyon oyunları 11: Dönüşüm Robotu 3D (araba - robot - jet)
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function hi(k, v) { const o = best(k); if (v > o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }

function robot(body, el, act) {
  const W = 360, H = 520, HY = 200, SL = 200, RW = 900, CAMH = 1000, CD = 0.84, DRAW = 140, ZP = 840;
  const LX = [-0.667, 0, 0.667];
  const NAMES = ["🚗 Araba", "🤖 Robot", "✈️ Jet"];
  const PALS = [
    { t: "#3d9bff", b: "#d4ecff", g: "#7d8794", r1: "#3b3f4a", r2: "#353944", sw: "#aab3c0", bl: ["#6c7a96", "#8895ad", "#5a6782"], night: false },
    { t: "#3a1f66", b: "#ff9a5a", g: "#5b4a66", r1: "#3a3445", r2: "#342f3f", sw: "#8d7a9a", bl: ["#4d3566", "#6a4478", "#3d2a55"], night: false },
    { t: "#04050f", b: "#241a58", g: "#201a3d", r1: "#16162a", r2: "#121224", sw: "#2e2a5c", bl: ["#1a1740", "#241f58", "#141233"], night: true }
  ];
  const cvs = el("canvas", "");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let pos, speed, lane, px, form, tr, alt, score, coins, level, over, dead, raf, last, shake, msg, msgT, objs, spawnZ, why, bob, flash, bonus, T = 0;
  const keys = {};
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 4px;font-size:15px";
  body.appendChild(info);
  const sub = el("p", "", "");
  sub.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)";
  body.appendChild(sub);
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.cssText = "display:block;width:100%;max-width:360px;margin:0 auto 10px;touch-action:none;user-select:none;border-radius:12px";
  body.appendChild(cvs);
  const ctx = cvs.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px;margin-bottom:8px";
  body.appendChild(row);
  const fbtn = [];

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
  const hash = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };

  function genWave(z) {
    const types = level >= 2 ? ["gate", "crate", "pit"] : ["gate", "crate"];
    const pick = () => types[Math.floor(Math.random() * types.length)];
    const add = (type, ln, zz) => objs.push({ z: zz, lane: ln, type: type, len: type === "pit" ? 1500 : 0, prev: zz - (pos + ZP), done: false });
    const r = Math.random();
    const pRow = level >= 3 ? Math.min(0.3, 0.06 * (level - 2)) : 0;
    const pMix = level >= 5 ? Math.min(0.25, 0.05 * (level - 4)) : 0;
    const free = [0, 1, 2];
    if (r < 0.16) {
      const l = Math.floor(Math.random() * 3);
      for (let k = 0; k < 6; k++) objs.push({ z: z + k * 420, lane: l, type: "coin", len: 0, prev: 1, done: false });
      return;
    }
    if (r < 0.16 + pRow) { const t = pick(); for (let l = 0; l < 3; l++) add(t, l, z); return; }
    if (r < 0.16 + pRow + pMix) { const ts = ["gate", "crate", "pit"].sort(() => Math.random() - 0.5); for (let l = 0; l < 3; l++) add(ts[l], l, z); return; }
    const t = pick();
    const n = Math.random() < 0.35 + Math.min(0.3, level * 0.03) ? 2 : 1;
    free.sort(() => Math.random() - 0.5);
    const blocked = free.splice(0, n);
    blocked.forEach((l) => add(t, l, z));
    free.forEach((l) => { if (Math.random() < 0.6) for (let k = 0; k < 3; k++) objs.push({ z: z - 300 + k * 450, lane: l, type: "coin", len: 0, prev: 1, done: false }); });
  }
  function reset() {
    pos = 0; speed = 6000; lane = 1; px = 0; form = 0; tr = 0; alt = 0; score = 0; coins = 0; level = 1; over = false;
    shake = 0; msg = ""; msgT = 0; objs = []; why = ""; bonus = 0; flash = 0; bob = 0;
    spawnZ = 7000;
    upBtns();
  }
  function maxSp() { return Math.min(11500, 6000 + level * 450); }
  const meters = () => Math.floor(pos / 100);
  function crash(t) {
    if (over) return;
    over = true; shake = 0.6; why = t;
    hi("nb_robot", score);
    try { if (navigator.vibrate) navigator.vibrate(120); } catch (e) {}
  }
  function setForm(f) {
    if (over || f === form) return;
    form = f; tr = 0.4; flash = 0.3;
    upBtns();
  }
  function moveLane(d) { if (over) return; lane = Math.max(0, Math.min(2, lane + d)); }
  function upBtns() {
    fbtn.forEach((b, i) => {
      b.style.setProperty("background", i === form ? "var(--lamp)" : "", "important");
      b.style.setProperty("color", i === form ? "var(--lamp-ink)" : "", "important");
    });
  }
  function nextHint() {
    let b = null;
    objs.forEach((o) => {
      if (o.type === "coin" || o.done || o.lane !== lane) return;
      const rz = o.z - (pos + ZP);
      if (rz > -o.len && (!b || o.z < b.z)) b = o;
    });
    return b;
  }
  function update(dt) {
    T += dt;
    const nl = 1 + Math.floor(meters() / 1500);
    if (nl > level && !over) { level = nl; msg = "Seviye " + level + "!"; msgT = 1.6; }
    let kf = -1;
    if (keys["1"]) kf = 0; if (keys["2"]) kf = 1; if (keys["3"]) kf = 2;
    if (kf >= 0) setForm(kf);
    if (tr > 0) tr -= dt;
    if (flash > 0) flash -= dt;
    px += (LX[lane] - px) * Math.min(1, dt * 11);
    alt += ((form === 2 ? 1 : 0) - alt) * Math.min(1, dt * 8);
    if (!over) {
      if (speed < maxSp()) speed += 900 * dt;
      pos += speed * dt;
      score = meters() + coins * 10 + bonus;
      bob += dt * (form === 1 ? 14 : 6);
    } else {
      speed = Math.max(0, speed - 9000 * dt);
      pos += speed * dt;
    }
    while (spawnZ < pos + DRAW * SL - 300) {
      genWave(spawnZ);
      spawnZ += Math.max(2300, 5200 - level * 320) + Math.random() * 1200;
    }
    const pz = pos + ZP;
    objs.forEach((o) => {
      const rel = o.z - pz;
      if (!over && !o.done) {
        const near = Math.abs(px - LX[o.lane]) < 0.4;
        const crossed = (o.prev > 0 && rel <= 0);
        if (o.type === "coin") {
          if (crossed && near) { o.done = true; coins++; }
        } else if (o.type === "pit") {
          const inside = (rel <= 0 && rel > -o.len) || (o.prev > 0 && rel <= -o.len);
          if (inside && near && form !== 2) crash("Çukura düştün! Çukurda ✈️ Jet ol.");
          if (rel <= -o.len) { o.done = true; if (near && form === 2) { bonus += 30; msg = "Çukuru uçarak geçtin +30"; msgT = 1; } }
        } else if (crossed && near) {
          if (o.type === "crate") {
            if (form === 1) { o.done = true; o.smash = 0.5; bonus += 50; msg = "Kasa parçalandı +50"; msgT = 1; shake = 0.12; }
            else crash("Kasaya çarptın! Kasada 🤖 Robot ol.");
          } else if (o.type === "gate") {
            if (form === 0) { o.done = true; bonus += 20; msg = "Kapıdan geçtin +20"; msgT = 0.9; }
            else crash("Alçak kapıya çarptın! Kapıda 🚗 Araba ol.");
          }
        }
      }
      if (o.smash > 0) o.smash -= dt;
      o.prev = rel;
    });
    objs = objs.filter((o) => o.z - pos > -3000);
    if (msgT > 0) msgT -= dt;
    if (shake > 0) shake -= dt;
  }

  // ---- çizimler ----
  function building(x, base, w, h, col, night, seed) {
    ctx.fillStyle = col; ctx.fillRect(x - w / 2, base - h, w, h);
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(x + w * 0.3, base - h, w * 0.2, h);
    if (w > 18) {
      const cols = Math.max(2, Math.floor(w / 14)), rows = Math.max(2, Math.floor(h / 16));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (hash(seed + r * 7 + c, 3) < 0.45) continue;
        ctx.fillStyle = night ? "rgba(255,225,130,.8)" : "rgba(255,255,255,.35)";
        ctx.fillRect(x - w / 2 + 3 + c * (w - 6) / cols + 1, base - h + 4 + r * (h - 8) / rows + 2, (w - 6) / cols - 3, (h - 8) / rows - 4);
      }
    }
  }
  function drawCrate(x, y, sc, smash) {
    const w = sc * 440, h = sc * 400;
    if (w < 3) return;
    if (smash > 0) {
      const k = 1 - smash / 0.5;
      ctx.fillStyle = "#b9772e";
      for (let i = 0; i < 8; i++) { const a = i * 0.8 + 0.3; ctx.fillRect(x + Math.cos(a) * w * k * 0.9 - 4, y - h * 0.4 + Math.sin(a) * h * k * 0.8 - k * 30 - 3, 8, 6); }
      return;
    }
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(x, y, w * 0.6, w * 0.1, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#d9964a"; ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w * 0.42, y - h * 1.16); ctx.lineTo(x + w * 0.42, y - h * 1.16); ctx.lineTo(x + w / 2, y - h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#b9772e"; ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.strokeStyle = "#7a4a17"; ctx.lineWidth = Math.max(1, w * 0.04);
    ctx.strokeRect(x - w / 2 + 2, y - h + 2, w - 4, h - 4);
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x + w / 2, y); ctx.moveTo(x + w / 2, y - h); ctx.lineTo(x - w / 2, y); ctx.stroke();
    if (w > 24) { ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.font = "bold " + Math.round(w * 0.3) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillText("🤖", x, y - h * 0.38); }
  }
  function drawGate(x, y, sc) {
    const w = sc * 560, h = sc * 330;
    if (w < 4) return;
    ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(x, y, w * 0.55, w * 0.07, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#555c6b"; ctx.fillRect(x - w / 2, y - h, w * 0.1, h); ctx.fillRect(x + w * 0.4, y - h, w * 0.1, h);
    const bh = sc * 90;
    ctx.fillStyle = "#f2c230"; ctx.fillRect(x - w / 2, y - h - bh * 0.4, w, bh);
    ctx.fillStyle = "#16181d";
    const n = 8;
    for (let i = 0; i < n; i += 2) ctx.fillRect(x - w / 2 + i * w / n, y - h - bh * 0.4, w / n, bh);
    ctx.fillStyle = "rgba(255,70,70,.9)"; ctx.fillRect(x - w * 0.03, y - h + bh * 0.6, w * 0.06, bh * 0.2);
  }
  function drawCoin(x, y, sc) {
    const r = sc * 60;
    if (r < 1.5) return;
    const k = Math.abs(Math.cos(T * 4 + x * 0.05));
    ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.ellipse(x, y - sc * 150, Math.max(1, r * k), r, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#b78a00"; ctx.lineWidth = Math.max(1, r * 0.14); ctx.stroke();
  }
  function drawPlayer() {
    const cx = W / 2 - (px - cameraX) * 0 , by = 480;
    const j = alt * 62, lean = (LX[lane] - px) * 0.35;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath(); ctx.ellipse(cx, by + 4, 40 - alt * 8, 9 - alt * 2, 0, 0, 7); ctx.fill();
    ctx.translate(cx, by - j); ctx.rotate(lean);
    if (tr > 0) { const k = tr / 0.4; const s = 1 + Math.sin(k * 3.14) * 0.18; ctx.scale(s, s); }
    if (form === 0) {
      ctx.fillStyle = "#0e0f12"; rr(-38, -14, 16, 16, 4); ctx.fill(); rr(22, -14, 16, 16, 4); ctx.fill();
      ctx.fillStyle = "#1c6ef2"; rr(-40, -44, 80, 36, 8); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(-40, -22, 80, 14);
      ctx.fillStyle = "#2e7bff"; rr(-30, -64, 60, 28, 10); ctx.fill();
      ctx.fillStyle = "#1a2433"; rr(-24, -60, 48, 18, 6); ctx.fill();
      ctx.fillStyle = "#ff2b2b"; rr(-37, -38, 20, 8, 3); ctx.fill(); rr(17, -38, 20, 8, 3); ctx.fill();
      ctx.fillStyle = "#0f1a33"; ctx.fillRect(-36, -70, 72, 5);
      ctx.fillStyle = "#ffcf3a"; ctx.fillRect(-10, -26, 20, 8);
    } else if (form === 1) {
      const sw = Math.sin(bob) * 5;
      ctx.fillStyle = "#2a3140"; rr(-22, -38 + sw, 17, 38 - sw, 4); ctx.fill(); rr(5, -38 - sw, 17, 38 + sw, 4); ctx.fill();
      ctx.fillStyle = "#e8e8ef"; rr(-26, -6 + sw, 22, 10, 3); ctx.fill(); rr(4, -6 - sw, 22, 10, 3); ctx.fill();
      ctx.fillStyle = "#1c6ef2"; rr(-30, -92, 60, 58, 10); ctx.fill();
      ctx.fillStyle = "#ff8a1f"; rr(-20, -86, 40, 22, 5); ctx.fill();
      ctx.fillStyle = "#3a465c"; rr(-12, -62, 24, 22, 4); ctx.fill();
      ctx.fillStyle = "#cfd6e4"; rr(-45, -92, 17, 36, 7); ctx.fill(); rr(28, -92, 17, 36, 7); ctx.fill();
      ctx.fillStyle = "#2a3140"; ctx.fillRect(-43, -58 + sw, 13, 16); ctx.fillRect(30, -58 - sw, 13, 16);
      ctx.fillStyle = "#cfd6e4"; rr(-12, -116, 24, 24, 8); ctx.fill();
      ctx.fillStyle = "#00e5ff"; ctx.fillRect(-9, -108, 18, 6);
      ctx.fillStyle = "#ff8a1f"; ctx.fillRect(-26, -98, 8, 14); ctx.fillRect(18, -98, 8, 14);
    } else {
      const fl = 6 + Math.sin(T * 40) * 3;
      ctx.fillStyle = "#ffb02e"; ctx.beginPath(); ctx.moveTo(-18, -8); ctx.lineTo(-12, -8 + fl * 2); ctx.lineTo(-6, -8); ctx.fill(); ctx.beginPath(); ctx.moveTo(6, -8); ctx.lineTo(12, -8 + fl * 2); ctx.lineTo(18, -8); ctx.fill();
      ctx.fillStyle = "#1c6ef2"; ctx.beginPath(); ctx.moveTo(-58, -34); ctx.lineTo(-14, -66); ctx.lineTo(14, -66); ctx.lineTo(58, -34); ctx.lineTo(40, -22); ctx.lineTo(-40, -22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.moveTo(-58, -34); ctx.lineTo(-40, -22); ctx.lineTo(40, -22); ctx.lineTo(58, -34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#e8e8ef"; rr(-16, -78, 32, 62, 12); ctx.fill();
      ctx.fillStyle = "#ff8a1f"; ctx.fillRect(-16, -50, 32, 8);
      ctx.fillStyle = "#1a2433"; rr(-8, -72, 16, 16, 6); ctx.fill();
      ctx.fillStyle = "#e8e8ef"; ctx.beginPath(); ctx.moveTo(-20, -62); ctx.lineTo(-30, -92); ctx.lineTo(-14, -70); ctx.fill(); ctx.beginPath(); ctx.moveTo(20, -62); ctx.lineTo(30, -92); ctx.lineTo(14, -70); ctx.fill();
    }
    if (flash > 0) { ctx.fillStyle = "rgba(255,255,255," + Math.min(0.9, flash * 3) + ")"; ctx.beginPath(); ctx.arc(0, -50, 62 * (1 + (0.3 - flash) * 2), 0, 7); ctx.fill(); }
    ctx.restore();
  }
  let cameraX = 0;

  function render() {
    const P = PALS[(level - 1) % 3];
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 8 * Math.min(1, shake * 3), (Math.random() - 0.5) * 6 * Math.min(1, shake * 3));
    const sky = ctx.createLinearGradient(0, 0, 0, HY);
    sky.addColorStop(0, P.t); sky.addColorStop(1, P.b);
    ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, HY + 10);
    if (P.night) {
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.4 + (i % 3) * 0.2; ctx.fillRect((i * 97) % W, (i * 53) % (HY - 50), 1.5, 1.5); }
      ctx.globalAlpha = 1; ctx.fillStyle = "#e9ecf5"; ctx.beginPath(); ctx.arc(70, 54, 15, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = level % 3 === 2 ? "#ffd27a" : "#fff7c9";
      ctx.beginPath(); ctx.arc(level % 3 === 2 ? 280 : 90, level % 3 === 2 ? HY - 30 : 56, 20, 0, 7); ctx.fill();
    }
    ctx.fillStyle = P.g; ctx.fillRect(-10, HY, W + 20, H - HY + 10);
    cameraX += (px - cameraX) * 0.1;
    const base = Math.floor(pos / SL), pct = (pos % SL) / SL, pxw = cameraX * RW * 0.8;
    const ys = [], ws = [], ss = [];
    for (let n = 0; n <= DRAW; n++) {
      const z = Math.max(40, n * SL - pct * SL), s = CD / z;
      ss.push(s); ys.push(HY + s * CAMH * H / 2); ws.push(s * RW * W / 2);
    }
    const sxAt = (n, wx) => W / 2 + ss[n] * (wx - pxw) * W / 2;
    const bucket = {};
    objs.forEach((o) => {
      const rz = o.z - pos, f = (rz + pct * SL) / SL, n = Math.floor(f);
      if (n < 1 || n >= DRAW - 1) return;
      (bucket[n] = bucket[n] || []).push({ o: o, rz: rz });
    });
    for (let n = DRAW - 1; n >= 0; n--) {
      const i = base + n, band = Math.floor(i / 4) % 2 === 0;
      const y1 = ys[n], y2 = ys[n + 1];
      if (y1 - y2 < 0.01 && n > 0) continue;
      const w1 = ws[n], w2 = ws[n + 1], x1 = sxAt(n, 0), x2 = sxAt(n + 1, 0);
      ctx.fillStyle = band ? P.g : P.sw; ctx.globalAlpha = band ? 0 : 0.18; ctx.fillRect(-10, y2, W + 20, y1 - y2 + 1); ctx.globalAlpha = 1;
      quad(x1 - w1 * 1.3, y1, x1 + w1 * 1.3, y1, x2 + w2 * 1.3, y2, x2 - w2 * 1.3, y2, P.sw);
      quad(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, band ? P.r1 : P.r2);
      if (band) {
        [-0.333, 0.333].forEach((o) => { const a = x1 + w1 * o, b = x2 + w2 * o; quad(a - w1 * 0.014, y1, a + w1 * 0.014, y1, b + w2 * 0.014, y2, b - w2 * 0.014, y2, "rgba(255,255,255,.7)"); });
      }
      if (P.night && band) {
        quad(x1 - w1, y1, x1 - w1 * 0.97, y1, x2 - w2 * 0.97, y2, x2 - w2, y2, "#00e5ff");
        quad(x1 + w1 * 0.97, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 * 0.97, y2, "#ff3df0");
      }
      // binalar
      if (i % 3 === 0) {
        for (let sd = -1; sd <= 1; sd += 2) {
          const hh = 500 + hash(i, sd) * 2200, bw = 450 + hash(i, sd + 5) * 500;
          const wx = sd * (RW * 1.45 + bw / 2 + hash(i, sd + 9) * 250);
          const sc = ss[n] * W / 2, bx = sxAt(n, wx);
          if (bx > -200 && bx < W + 200) building(bx, y1, bw * sc, hh * sc, P.bl[Math.floor(hash(i, 2) * 3)], P.night, i * 3 + sd);
        }
      }
      const bk = bucket[n];
      if (bk) {
        bk.sort((a, b) => b.rz - a.rz);
        bk.forEach((e) => {
          const o = e.o, z = Math.max(40, e.rz), s = CD / z, sc = s * W / 2;
          const sy = HY + s * CAMH * H / 2, wx = LX[o.lane] * RW;
          const sx = W / 2 + s * (wx - pxw) * W / 2;
          if (sy > H + 80) return;
          if (o.type === "pit") {
            const z2 = Math.max(40, e.rz + o.len), s2 = CD / z2, sy2 = HY + s2 * CAMH * H / 2;
            const hw = RW * 0.3;
            const xa = W / 2 + s * (wx - hw - pxw) * W / 2, xb = W / 2 + s * (wx + hw - pxw) * W / 2;
            const xc = W / 2 + s2 * (wx - hw - pxw) * W / 2, xd = W / 2 + s2 * (wx + hw - pxw) * W / 2;
            quad(xa, sy, xb, sy, xd, sy2, xc, sy2, "#05060a");
            quad(xa, sy, xa - 3 * s * 90, sy, xc - 3 * s2 * 90, sy2, xc, sy2, "#ffb02e");
            quad(xb, sy, xb + 3 * s * 90, sy, xd + 3 * s2 * 90, sy2, xd, sy2, "#ffb02e");
            ctx.fillStyle = "rgba(255,176,46,.9)"; ctx.fillRect(xa, sy - 3, xb - xa, 3);
          } else if (o.type === "crate") drawCrate(sx, sy, sc, o.smash || 0);
          else if (o.type === "gate") { if (!o.done) drawGate(sx, sy, sc); }
          else if (!o.done) drawCoin(sx, sy, sc);
        });
      }
    }
    const fog = ctx.createLinearGradient(0, HY - 2, 0, HY + 80);
    fog.addColorStop(0, P.b); fog.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.8; ctx.fillStyle = fog; ctx.fillRect(-10, HY - 2, W + 20, 82); ctx.globalAlpha = 1;
    if (speed > 8000) {
      ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.lineWidth = 2;
      for (let k = 0; k < 8; k++) {
        const a = ((performance.now() * 0.002 + k * 0.37) % 1), lx = k % 2 ? 24 + k * 8 : W - 24 - k * 8, ly = HY + 60 + a * 260;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + (lx < W / 2 ? -1 : 1) * (6 + a * 26), ly + 16 + a * 40); ctx.stroke();
      }
    }
    drawPlayer();
    // HUD
    ctx.fillStyle = "rgba(0,0,0,.45)"; rr(8, 8, 112, 34, 8); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 18px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("⚡ " + coins + "  ⭐ " + level, 16, 31);
    const h = nextHint();
    if (h && !over) {
      const ic = h.type === "pit" ? "✈️ Jet ol!" : h.type === "crate" ? "🤖 Robot ol!" : "🚗 Araba ol!";
      const need = h.type === "pit" ? 2 : h.type === "crate" ? 1 : 0;
      ctx.fillStyle = need === form ? "rgba(40,170,90,.85)" : "rgba(220,60,60,.9)";
      rr(W - 128, 8, 120, 34, 8); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center"; ctx.fillText(ic, W - 68, 31);
    }
    if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT * 1.5); ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 4; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.strokeText(msg, W / 2, 110); ctx.fillText(msg, W / 2, 110); ctx.globalAlpha = 1; }
    if (over) {
      ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.fillRect(0, 160, W, 150);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 30px sans-serif"; ctx.fillText("Oyun bitti!", W / 2, 205);
      ctx.font = "15px sans-serif"; ctx.fillText(why, W / 2, 236);
      ctx.font = "17px sans-serif"; ctx.fillText("Puan: " + score + "   En iyi: " + best("nb_robot"), W / 2, 266);
      ctx.font = "14px sans-serif"; ctx.fillText("\"Yeni oyun\" ile tekrar dene", W / 2, 292);
    }
    ctx.restore();
    info.textContent = "Seviye " + level + "   Mesafe: " + (pos / 100000).toFixed(2) + " km   Puan: " + score;
    sub.textContent = "En iyi: " + best("nb_robot") + "   Kapı→🚗  Kasa→🤖  Çukur→✈️";
  }
  function loop(t) {
    if (dead) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    update(dt); render();
    raf = requestAnimationFrame(loop);
  }
  let dn = null;
  cvs.onpointerdown = (e) => { try { cvs.setPointerCapture(e.pointerId); } catch (x) {} dn = { x: e.clientX, y: e.clientY, id: e.pointerId }; };
  cvs.onpointerup = (e) => {
    if (!dn) return;
    const dx = e.clientX - dn.x, r = cvs.getBoundingClientRect();
    if (Math.abs(dx) > 28) moveLane(dx > 0 ? 1 : -1);
    else moveLane((e.clientX - r.left) < r.width / 2 ? -1 : 1);
    dn = null;
  };
  cvs.onpointercancel = () => { dn = null; };
  const kd = (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") moveLane(-1);
    else if (e.key === "ArrowRight" || e.key === "d") moveLane(1);
    else if (e.key === "1" || e.key === "2" || e.key === "3") setForm(Number(e.key) - 1);
  };
  window.addEventListener("keydown", kd);
  NAMES.forEach((nm, i) => {
    const b = el("button", "", nm);
    b.type = "button";
    b.style.cssText = "flex:1;min-width:0;padding:14px 4px;font-weight:700;font-size:15px;touch-action:none;user-select:none";
    b.onpointerdown = (e) => { e.preventDefault(); setForm(i); };
    row.appendChild(b); fbtn.push(b);
  });
  const row2 = el("div", "");
  row2.style.cssText = "display:flex;gap:8px";
  row2.appendChild(act("Yeni oyun", reset));
  body.appendChild(row2);
  const hint = el("p", "", "Ekranın sol yarısına dokun: sola şerit, sağ yarısına dokun: sağa şerit (ya da parmağını kaydır). Engele göre dönüş: 🚧 alçak kapı → 🚗 Araba (altından geçer), 📦 kasa → 🤖 Robot (parçalar), 🕳 çukur → ✈️ Jet (üstünden uçar). Yanlış şekilde çarparsan oyun biter. Başka şeride geçerek de kaçabilirsin. ⚡ topla, seviye atladıkça engeller sıklaşır ve karışık sıralar gelir.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  reset();
  dead = false; last = performance.now();
  raf = requestAnimationFrame(loop);
  return () => { dead = true; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); };
}

export const SOLO = {
  robot: { group: "Aksiyon", icon: "🤖", label: "Dönüşüm Robotu 3D", start: robot }
};
