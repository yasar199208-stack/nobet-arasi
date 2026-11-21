// Aksiyon oyunları 10: Trafikte Motor 3D (3D görünümlü trafik yarışı)
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function hi(k, v) { const o = best(k); if (v > o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }

function rider(body, el, act) {
  const W = 360, H = 520, HY = 208, SL = 200, RW = 900, CAMH = 1000, CD = 0.84, DRAW = 150, ZP = 840, N = 420;
  const LANES = [-0.75, -0.25, 0.25, 0.75], LSPD = [-3600, -2800, 2800, 2000];
  const COLS = ["#d94141", "#e8b923", "#3a7bd5", "#2fb36d", "#8e5bd6", "#e8e8ee", "#f08a24", "#222831"];
  const PALS = [
    { t: "#3d9bff", b: "#cdeaff", g1: "#2f9a45", g2: "#298a3e", r1: "#4c4c55", r2: "#46464f", night: false },
    { t: "#35255f", b: "#ff9d5c", g1: "#2d7a3a", g2: "#276d34", r1: "#43404c", r2: "#3d3a46", night: false },
    { t: "#04060f", b: "#1b2556", g1: "#12331d", g2: "#0f2c19", r1: "#2b2b36", r2: "#262630", night: true }
  ];
  const cvs = el("canvas", "");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let pos, speed, px, lean, nitro, score, bonus, level, over, dead, raf, last, shake, msg, msgT, cars, spawnT, steerL, steerR, brake, turbo, tOn, combo, comboT, wrong;
  const keys = {}, ptr = {};
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
  row.style.cssText = "display:flex;gap:8px;margin-bottom:6px";
  body.appendChild(row);

  // yol: sadece virajlar
  const segs = new Array(N).fill(0);
  (function build() {
    let i = 0;
    const add = (e, h, l, c) => {
      const tot = e + h + l;
      for (let k = 0; k < tot && i < N; k++, i++) {
        let v = c;
        if (k < e) v = c * (k / e);
        else if (k >= e + h) v = c * (1 - (k - e - h) / l);
        segs[i] = v;
      }
    };
    const plan = [[0, 0, 0, 0], [20, 30, 20, 1.1], [0, 40, 0, 0], [25, 40, 25, -1.6], [0, 30, 0, 0], [20, 50, 20, 2.1], [20, 25, 20, -1.2], [0, 30, 0, 0], [30, 45, 30, -2.4], [0, 30, 0, 0], [25, 40, 25, 1.9]];
    plan.forEach((p) => { if (p[0] + p[1] + p[2] > 0) add(p[0], p[1], p[2], p[3]); else { for (let k = 0; k < 30 && i < N; k++, i++) segs[i] = 0; } });
  })();
  const curveAt = (z) => segs[((Math.floor(z / SL) % N) + N) % N];

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

  function drawCar(x, y, w, col, front, night, truck) {
    if (w < 3) return;
    const h = w * (truck ? 1.05 : 0.74);
    ctx.fillStyle = "rgba(0,0,0,.32)";
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.58, w * 0.1, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#101114";
    ctx.fillRect(x - w * 0.5, y - h * 0.2, w * 0.15, h * 0.2);
    ctx.fillRect(x + w * 0.35, y - h * 0.2, w * 0.15, h * 0.2);
    ctx.fillStyle = col;
    rr(x - w / 2, y - h * 0.72, w, h * 0.56, w * 0.08); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.28)";
    rr(x - w / 2, y - h * 0.34, w, h * 0.18, w * 0.05); ctx.fill();
    if (truck) {
      ctx.fillStyle = col;
      rr(x - w * 0.46, y - h, w * 0.92, h * 0.4, w * 0.04); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.14)";
      ctx.fillRect(x - w * 0.46, y - h * 0.8, w * 0.92, h * 0.03);
    } else {
      ctx.fillStyle = col;
      rr(x - w * 0.38, y - h, w * 0.76, h * 0.42, w * 0.12); ctx.fill();
      ctx.fillStyle = "#1c2733";
      rr(x - w * 0.31, y - h * 0.93, w * 0.62, h * 0.28, w * 0.08); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.18)";
      ctx.fillRect(x - w * 0.28, y - h * 0.9, w * 0.22, h * 0.06);
    }
    if (front) {
      ctx.fillStyle = night ? "#fff7c2" : "#f4efc0";
      rr(x - w * 0.44, y - h * 0.62, w * 0.22, h * 0.12, w * 0.04); ctx.fill();
      rr(x + w * 0.22, y - h * 0.62, w * 0.22, h * 0.12, w * 0.04); ctx.fill();
      ctx.fillStyle = "#15171b";
      ctx.fillRect(x - w * 0.16, y - h * 0.58, w * 0.32, h * 0.1);
      if (night) { ctx.fillStyle = "rgba(255,247,194,.22)"; ctx.beginPath(); ctx.arc(x - w * 0.33, y - h * 0.56, w * 0.3, 0, 7); ctx.arc(x + w * 0.33, y - h * 0.56, w * 0.3, 0, 7); ctx.fill(); }
    } else {
      ctx.fillStyle = "#ff2b2b";
      rr(x - w * 0.46, y - h * 0.62, w * 0.2, h * 0.1, w * 0.03); ctx.fill();
      rr(x + w * 0.26, y - h * 0.62, w * 0.2, h * 0.1, w * 0.03); ctx.fill();
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(x - w * 0.1, y - h * 0.5, w * 0.2, h * 0.07);
    }
  }

  function drawBike() {
    const cx = W / 2, by = 486 + (over ? 0 : 0);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath(); ctx.ellipse(cx, by + 2, 26, 7, 0, 0, 7); ctx.fill();
    ctx.translate(cx, by); ctx.rotate(lean);
    ctx.fillStyle = "#0e0f12";
    ctx.beginPath(); ctx.ellipse(0, -16, 8, 18, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#c92a2a";
    rr(-9, -42, 18, 22, 6); ctx.fill();
    ctx.fillStyle = "#ff3b3b";
    ctx.fillRect(-7, -33, 14, 4);
    ctx.fillStyle = "#2d333b";
    rr(-12, -62, 24, 26, 8); ctx.fill();
    ctx.fillStyle = "#e8eaf0";
    rr(-15, -90, 30, 38, 11); ctx.fill();
    ctx.fillStyle = "#1c6ef2";
    rr(-15, -78, 30, 14, 5); ctx.fill();
    ctx.fillStyle = "#e8eaf0";
    ctx.beginPath(); ctx.arc(0, -98, 11.5, 0, 7); ctx.fill();
    ctx.fillStyle = "#1c6ef2";
    ctx.fillRect(-2, -108, 4, 12);
    ctx.strokeStyle = "#2d333b"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-13, -82); ctx.lineTo(-24, -64); ctx.moveTo(13, -82); ctx.lineTo(24, -64); ctx.stroke();
    ctx.fillStyle = "#15171b";
    ctx.fillRect(-27, -68, 54, 5);
    ctx.fillStyle = "#9aa3ad";
    ctx.fillRect(-30, -72, 6, 3); ctx.fillRect(24, -72, 6, 3);
    ctx.restore();
  }

  function newCar(rz, lane) {
    const truck = Math.random() < 0.18;
    return { z: pos + rz, lane: lane, o: LANES[lane] + (Math.random() - 0.5) * 0.06, sp: LSPD[lane] * (truck ? 0.9 : 1) + (Math.random() - 0.5) * 300, col: COLS[Math.floor(Math.random() * COLS.length)], truck: truck, prev: rz - ZP, done: false, front: lane < 2 };
  }
  function arrive(c) {
    const rel = speed - c.sp, rz = c.z - (pos + ZP);
    if (rel <= 200 || rz <= 0) return 1e9;
    return rz / rel;
  }
  function trySpawn(rz) {
    const lane = Math.floor(Math.random() * 4);
    const nc = newCar(rz, lane);
    const sp = Math.max(speed, 5000);
    const tn = rz / (sp - nc.sp);
    const blocked = new Set([lane]);
    cars.forEach((c) => {
      const t = arrive(c);
      if (Math.abs(t - tn) < 1.4 && c.lane !== lane) blocked.add(c.lane);
      if (c.lane === lane && Math.abs(c.z - nc.z) < 2600) blocked.add(99);
    });
    if (blocked.has(99) || blocked.size > 2) return;
    cars.push(nc);
  }
  function reset() {
    pos = 0; speed = 5200; px = 0.25; lean = 0; nitro = 1; score = 0; bonus = 0; level = 1; over = false;
    shake = 0; msg = ""; msgT = 0; cars = []; spawnT = 0.5; brake = false; turbo = false; combo = 0; comboT = 0; wrong = 0;
    for (let i = 0; i < 7; i++) trySpawn(4000 + Math.random() * 20000);
  }
  function maxSp() { return Math.min(13500, 8200 + level * 450); }
  function meters() { return Math.floor(pos / 100); }
  function crash() {
    if (over) return;
    over = true; shake = 0.6;
    hi("nb_rider", score);
  }
  function update(dt) {
    const sc = meters();
    const nl = 1 + Math.floor(sc / 2000);
    if (nl > level && !over) { level = nl; msg = "Seviye " + level + "!"; msgT = 1.6; }
    let dir = 0;
    if (steerL || keys.ArrowLeft || keys.a) dir -= 1;
    if (steerR || keys.ArrowRight || keys.d) dir += 1;
    const tb = turbo || keys[" "] || keys.ArrowUp;
    const br = brake || keys.ArrowDown;
    if (!over) {
      const sp = speed / 13500;
      px += dir * dt * 1.6 * (0.55 + 0.45 * sp);
      px -= dt * 2 * sp * sp * curveAt(pos + ZP) * 0.17;
      const off = Math.abs(px) > 1.02;
      if (px < -1.35) px = -1.35;
      if (px > 1.35) px = 1.35;
      let tgt = maxSp();
      tOn = false;
      if (tb && nitro > 0.02) { tgt = maxSp() * 1.25; nitro -= dt * 0.35; tOn = true; }
      else nitro = Math.min(1, nitro + dt * 0.08);
      if (off) tgt = Math.min(tgt, 3500);
      if (br) tgt = 2200;
      if (speed < tgt) speed += (tOn ? 6500 : 3200) * dt; else speed -= (br ? 9000 : off ? 6000 : 2500) * dt;
      if (off) shake = Math.max(shake, 0.15);
      lean += ((dir * 0.22) - lean) * Math.min(1, dt * 8);
      pos += speed * dt;
      score = meters() + bonus;
      // ters şerit puanı
      if (px < 0.0 && px > -1) { wrong += dt; bonus += 8 * dt; } else wrong = 0;
      comboT -= dt; if (comboT <= 0) combo = 0;
    } else {
      speed = Math.max(0, speed - 7000 * dt);
      pos += speed * dt;
      lean += (0.9 - lean) * dt * 3;
    }
    // trafik
    spawnT -= dt;
    if (spawnT <= 0 && !over) {
      spawnT = Math.max(0.28, 1.05 - level * 0.08) * (0.7 + Math.random() * 0.6);
      trySpawn(DRAW * SL - 300);
    }
    const pz = pos + ZP;
    cars.forEach((c) => {
      c.z += c.sp * dt;
      const rel = c.z - pz;
      if (!over && !c.done) {
        const dx = Math.abs(px - c.o), lim = c.truck ? 0.26 : 0.22;
        if (dx < lim && (Math.abs(rel) < 150 || (c.prev > 0 && rel <= 0) || (c.prev < 0 && rel >= 0)) && Math.abs(rel) < 700) { crash(); }
        else if ((c.prev > 0 && rel <= 0) || (c.prev < 0 && rel >= 0)) {
          c.done = true;
          if (dx < 0.62) {
            combo++; comboT = 2.5;
            const b = Math.floor((15 + speed / 400) * (c.front ? 1.5 : 1) * Math.min(4, combo));
            bonus += b; msg = "Yakın geçiş +" + b + (combo > 1 ? "  x" + Math.min(4, combo) : ""); msgT = 1.1;
          }
        }
      }
      c.prev = rel;
    });
    cars = cars.filter((c) => c.z - pos > -2500 && c.z - pos < DRAW * SL + 6000);
    if (msgT > 0) msgT -= dt;
    if (shake > 0) shake -= dt;
  }

  function render() {
    const P = PALS[(level - 1) % 3];
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 8 * Math.min(1, shake * 3), (Math.random() - 0.5) * 6 * Math.min(1, shake * 3));
    const sky = ctx.createLinearGradient(0, 0, 0, HY);
    sky.addColorStop(0, P.t); sky.addColorStop(1, P.b);
    ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, HY + 10);
    if (P.night) {
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 40; i++) { const sx = (i * 97) % W, sy = (i * 53) % (HY - 40); ctx.globalAlpha = 0.4 + (i % 3) * 0.2; ctx.fillRect(sx, sy, 1.5, 1.5); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#e9ecf5"; ctx.beginPath(); ctx.arc(280, 54, 15, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = level % 3 === 2 ? "#ffd27a" : "#fff7c9";
      ctx.beginPath(); ctx.arc(level % 3 === 2 ? 90 : 270, level % 3 === 2 ? HY - 30 : 56, 20, 0, 7); ctx.fill();
    }
    // dağlar
    const base = Math.floor(pos / SL), pct = (pos % SL) / SL;
    const sh = (curveAt(pos + ZP) * speed * 0.00008);
    bgOff = (bgOff + sh * 0.5 + 360) % 360;
    ctx.fillStyle = P.night ? "#0c1230" : level % 3 === 2 ? "#5b3a6e" : "#7fa6c8";
    ctx.beginPath(); ctx.moveTo(0, HY);
    for (let x = 0; x <= W + 20; x += 20) { ctx.lineTo(x, HY - 28 - 22 * Math.sin((x + bgOff * 6) * 0.03) - 12 * Math.sin((x + bgOff * 6) * 0.09)); }
    ctx.lineTo(W + 20, HY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.night ? "#09102a" : level % 3 === 2 ? "#44284f" : "#6a93b5";
    ctx.beginPath(); ctx.moveTo(0, HY);
    for (let x = 0; x <= W + 20; x += 20) { ctx.lineTo(x, HY - 12 - 10 * Math.sin((x + bgOff * 10) * 0.05 + 2)); }
    ctx.lineTo(W + 20, HY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.g1; ctx.fillRect(-10, HY, W + 20, H - HY + 10);
    // yol hesabı
    const xs = [], ys = [], ws = [], ss = [];
    let x = 0, dx = -curveAt(base * SL) * pct;
    const pxw = px * RW;
    for (let n = 0; n <= DRAW; n++) {
      const z = Math.max(40, n * SL - pct * SL);
      const s = CD / z;
      xs.push(x); ss.push(s);
      ys.push(HY + s * CAMH * H / 2);
      ws.push(s * RW * W / 2);
      x += dx; dx += segs[(base + n) % N];
    }
    const cxs = (n, o) => W / 2 + ss[n] * (xs[n] + o * RW - pxw) * W / 2;
    // araç kovaları
    const bucket = {};
    cars.forEach((c) => {
      const rz = c.z - pos;
      const f = (rz + pct * SL) / SL, n = Math.floor(f);
      if (n < 1 || n >= DRAW - 1) return;
      (bucket[n] = bucket[n] || []).push({ c: c, t: f - n, rz: rz });
    });
    for (let n = DRAW - 1; n >= 0; n--) {
      const i = base + n, band = Math.floor(i / 3) % 2 === 0;
      const y1 = ys[n], y2 = ys[n + 1];
      if (y1 > y2 - 0.01 && y1 - y2 < 0.01 && n > 0) continue;
      const x1 = cxs(n, 0), x2 = cxs(n + 1, 0), w1 = ws[n], w2 = ws[n + 1];
      ctx.fillStyle = band ? P.g1 : P.g2;
      ctx.fillRect(-10, y2, W + 20, y1 - y2 + 1);
      quad(x1 - w1 * 1.13, y1, x1 + w1 * 1.13, y1, x2 + w2 * 1.13, y2, x2 - w2 * 1.13, y2, band ? "#e8e8e8" : "#d94141");
      quad(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, band ? P.r1 : P.r2);
      if (band) {
        const lw1 = w1 * 0.022, lw2 = w2 * 0.022;
        [-0.5, 0.5].forEach((o) => { const a = x1 + w1 * o, b = x2 + w2 * o; quad(a - lw1, y1, a + lw1, y1, b + lw2, y2, b - lw2, y2, "#e9e9e9"); });
        quad(x1 - lw1 * 1.6, y1, x1 + lw1 * 1.6, y1, x2 + lw2 * 1.6, y2, x2 - lw2 * 1.6, y2, "#f2c230");
      }
      const bk = bucket[n];
      if (bk) {
        bk.sort((a, b) => b.rz - a.rz);
        bk.forEach((e) => {
          const c = e.c, z = Math.max(40, e.rz), s = CD / z;
          const xi = xs[n] + (xs[n + 1] - xs[n]) * e.t;
          const sx = W / 2 + s * (xi + c.o * RW - pxw) * W / 2, sy = HY + s * CAMH * H / 2;
          const halfPx = s * RW * W / 2;
          if (sy > H + 60) return;
          drawCar(sx, sy, halfPx * (c.truck ? 0.44 : 0.36), c.col, c.front, P.night, c.truck);
        });
      }
    }
    // sis
    const fog = ctx.createLinearGradient(0, HY - 2, 0, HY + 70);
    fog.addColorStop(0, P.b); fog.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.85; ctx.fillStyle = fog; ctx.fillRect(-10, HY - 2, W + 20, 72); ctx.globalAlpha = 1;
    // hız çizgileri
    if (speed > 9000 || tOn) {
      ctx.strokeStyle = "rgba(255,255,255," + (tOn ? 0.35 : 0.18) + ")"; ctx.lineWidth = 2;
      for (let k = 0; k < 8; k++) {
        const a = ((performance.now() * 0.002 + k * 0.37) % 1);
        const lx = k % 2 ? 30 + k * 10 : W - 30 - k * 10, ly = HY + 60 + a * 260;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + (lx < W / 2 ? -1 : 1) * (6 + a * 28), ly + 16 + a * 40); ctx.stroke();
      }
    }
    drawBike();
    // HUD
    ctx.fillStyle = "rgba(0,0,0,.45)"; rr(8, 8, 118, 40, 8); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(Math.round(speed / 50) + " km/h", 16, 36);
    ctx.fillStyle = "rgba(0,0,0,.45)"; rr(W - 118, 8, 110, 18, 6); ctx.fill();
    ctx.fillStyle = tOn ? "#ffb02e" : "#4fb3ff"; rr(W - 116, 10, 106 * Math.max(0, nitro), 14, 5); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "10px sans-serif"; ctx.textAlign = "center"; ctx.fillText("TURBO", W - 63, 21);
    if (px < 0 && px > -1 && !over) { ctx.fillStyle = "rgba(255,70,70,.9)"; ctx.font = "bold 13px sans-serif"; ctx.fillText("⚠ TERS ŞERİT +puan", W / 2, 72); }
    if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT * 1.5); ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 4; ctx.font = "bold 24px sans-serif"; ctx.textAlign = "center"; ctx.strokeText(msg, W / 2, 130); ctx.fillText(msg, W / 2, 130); ctx.globalAlpha = 1; }
    if (over) {
      ctx.fillStyle = "rgba(0,0,0,.62)"; ctx.fillRect(0, 170, W, 130);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 32px sans-serif"; ctx.fillText("Kaza yaptın!", W / 2, 218);
      ctx.font = "17px sans-serif"; ctx.fillText("Puan: " + score + "   En iyi: " + best("nb_rider"), W / 2, 254);
      ctx.font = "14px sans-serif"; ctx.fillText("\"Yeni oyun\" ile tekrar dene", W / 2, 282);
    }
    ctx.restore();
    info.textContent = "Seviye " + level + "   Mesafe: " + (pos / 100000).toFixed(2) + " km   Puan: " + score;
    sub.textContent = "En iyi: " + best("nb_rider") + "   Sol şerit ters yön (tehlikeli ama bonus!)";
  }
  let bgOff = 0;
  function loop(t) {
    if (dead) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    update(dt); render();
    raf = requestAnimationFrame(loop);
  }
  function side() {
    steerL = false; steerR = false;
    Object.keys(ptr).forEach((k) => { if (ptr[k] < 0) steerL = true; else steerR = true; });
  }
  function pside(e) {
    const r = cvs.getBoundingClientRect();
    return (e.clientX - r.left) < r.width / 2 ? -1 : 1;
  }
  cvs.onpointerdown = (e) => { try { cvs.setPointerCapture(e.pointerId); } catch (x) {} ptr[e.pointerId] = pside(e); side(); };
  cvs.onpointermove = (e) => { if (ptr[e.pointerId] !== undefined) { ptr[e.pointerId] = pside(e); side(); } };
  const up = (e) => { delete ptr[e.pointerId]; side(); };
  cvs.onpointerup = up; cvs.onpointercancel = up;
  const kd = (e) => { keys[e.key] = true; };
  const ku = (e) => { keys[e.key] = false; };
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);

  function hold(label, setf) {
    const b = el("button", "", label);
    b.type = "button";
    b.style.cssText = "flex:1;padding:14px 8px;font-weight:700;font-size:16px;touch-action:none;user-select:none";
    b.onpointerdown = (e) => { try { b.setPointerCapture(e.pointerId); } catch (x) {} setf(true); };
    const off = () => setf(false);
    b.onpointerup = off; b.onpointercancel = off; b.onpointerleave = off;
    return b;
  }
  row.appendChild(hold("🛑 Fren", (v) => { brake = v; }));
  row.appendChild(hold("🔥 Turbo", (v) => { turbo = v; }));
  const row2 = el("div", "");
  row2.style.cssText = "display:flex;gap:8px";
  row2.appendChild(act("Yeni oyun", reset));
  body.appendChild(row2);
  const hint = el("p", "", "Ekranın sol yarısına basılı tut: sola, sağ yarısına basılı tut: sağa git. Araçlara çarpmadan geç. Yakın geçişler puan kazandırır, soldaki iki şerit ters yön (oradan gitmek riskli ama ekstra puan verir). Çimene çıkma, yavaşlarsın. Her 2 km'de seviye atlarsın: trafik ve hız artar, hava gündüz → akşam → gece değişir.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  reset();
  dead = false; last = performance.now();
  raf = requestAnimationFrame(loop);
  return () => { dead = true; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
}

export const SOLO = {
  rider: { group: "Aksiyon", icon: "🏍️", label: "Trafikte Motor 3D", start: rider }
};
