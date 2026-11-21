// Aksiyon oyunları 12: Pıtır 3D Macera (3D görünümlü platform koşusu)
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function hi(k, v) { const o = best(k); if (v > o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }

function jump3d(body, el, act) {
  const W = 360, H = 520, HY = 205, SL = 200, RW = 900, CAMH = 1000, CD = 0.84, DRAW = 140, ZP = 840;
  const LX = [-0.667, 0, 0.667], G = 4200, JV = 1500, JV2 = 1250;
  // temalar: g = zemin, a/b = gökyüzü, side = yan süs, lava = boşluk rengi
  const TH = {
    grass: { t: "#3d9bff", b: "#d4ecff", g1: "#59b84a", g2: "#4fa842", e: "#7a5a33", gap: "#1a1530", side: "tree", name: "Çayır" },
    desert: { t: "#ff9a4a", b: "#ffe1a8", g1: "#e6c277", g2: "#dcb468", e: "#a97c3a", gap: "#2a1a0c", side: "cactus", name: "Çöl" },
    ice: { t: "#7fc4ff", b: "#eaf6ff", g1: "#d6eefc", g2: "#c6e4f6", e: "#8fb8d6", gap: "#12304d", side: "crystal", name: "Buz" },
    night: { t: "#050816", b: "#26214f", g1: "#2f6b45", g2: "#295e3d", e: "#1c3a2a", gap: "#05060a", side: "pine", name: "Gece Ormanı", night: true },
    castle: { t: "#2a0a12", b: "#b3402a", g1: "#6b5560", g2: "#5f4a55", e: "#3a2a33", gap: "#ff5a1a", side: "rock", name: "Kale", lava: true }
  };
  // seviye tanımları: l=uzunluk(m), v=hız, d=aralık(birim), th=tema, ty=engeller, gp=boşluk oranı, st=yıldız
  const LV = [
    { l: 1300, v: 4800, d: 4800, th: "grass", ty: ["bush"], gp: 0 },
    { l: 1500, v: 5000, d: 4600, th: "grass", ty: ["bush"], gp: 0.35 },
    { l: 1700, v: 5100, d: 4500, th: "grass", ty: ["bush", "walker"], gp: 0.2 },
    { l: 1800, v: 5200, d: 4400, th: "desert", ty: ["cactus", "walker", "spiky"], gp: 0.2 },
    { l: 2000, v: 5300, d: 4300, th: "desert", ty: ["cactus", "bee", "walker"], gp: 0.25 },
    { l: 2100, v: 5400, d: 4200, th: "ice", ty: ["crystal", "walker", "bee"], gp: 0.25, slip: true },
    { l: 2300, v: 5500, d: 4100, th: "night", ty: ["bush", "spiky", "bee", "walker"], gp: 0.3 },
    { l: 2400, v: 5600, d: 4000, th: "castle", ty: ["rock", "spiky", "walker"], gp: 0.45 },
    { l: 2600, v: 5800, d: 3900, th: "ice", ty: ["crystal", "spiky", "bee", "walker"], gp: 0.35, slip: true },
    { l: 3000, v: 6000, d: 3800, th: "castle", ty: ["rock", "spiky", "bee", "walker"], gp: 0.45 }
  ];
  const THS = ["grass", "desert", "ice", "night", "castle"];
  function cfg(n) {
    if (n <= LV.length) return LV[n - 1];
    const k = n - LV.length;
    return { l: 3000 + k * 150, v: Math.min(8200, 6000 + k * 150), d: Math.max(3500, 3800 - k * 30), th: THS[(n - 1) % 5], ty: ["bush", "rock", "spiky", "bee", "walker"], gp: 0.45, slip: n % 3 === 0 };
  }
  const cvs = el("canvas", "");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let level, C, pos, speed, lane, px, py, vy, jumps, lives, coins, score, over, won, dead, raf, last, shake, msg, msgT, objs, spawnZ, inv, star, T = 0, bob = 0, hurt, why, unlocked, cameraX = 0, hits, endZ, spawned;
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
  unlocked = Math.max(1, best("nb_p3d"));

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
  const meters = () => Math.floor(pos / 100);

  function O(type, ln, z, extra) { const o = { type: type, lane: ln, z: z, prev: z - (pos + ZP), done: false, len: 0, h: 0, sp: 0 }; return Object.assign(o, extra || {}); }
  function genWave(z) {
    const r = Math.random(), ty = C.ty, level0 = level;
    const pick = () => ty[Math.floor(Math.random() * ty.length)];
    if (r < 0.14) {
      const l = Math.floor(Math.random() * 3);
      for (let k = 0; k < 6; k++) objs.push(O("coin", l, z + k * 420, { h: 70 }));
      return;
    }
    if (r < 0.2 && level0 >= 3) { objs.push(O("star", Math.floor(Math.random() * 3), z, { h: 90 })); return; }
    if (Math.random() < C.gp) {
      const all = level0 >= 2 && Math.random() < 0.5;
      const lanes = all ? [0, 1, 2] : [Math.floor(Math.random() * 3)];
      lanes.forEach((l) => objs.push(O("gap", l, z, { len: 1700 })));
      const arcL = all ? 1 : lanes[0];
      for (let k = 0; k < 5; k++) objs.push(O("coin", arcL, z - 400 + k * 520, { h: 80 + Math.sin(k / 4 * Math.PI) * 200 }));
      return;
    }
    const t = pick();
    const n = Math.random() < 0.3 + Math.min(0.3, level0 * 0.03) ? 2 : 1;
    const ls = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, n);
    ls.forEach((l) => {
      if (t === "walker") objs.push(O("walker", l, z, { h: 170, sp: -1500 }));
      else if (t === "bee") objs.push(O("bee", l, z, { h: 230 }));
      else if (t === "spiky") objs.push(O("spiky", l, z, { h: 200 }));
      else objs.push(O(t, l, z, { h: 210 }));
    });
    [0, 1, 2].filter((l) => ls.indexOf(l) < 0).forEach((l) => { if (Math.random() < 0.5) for (let k = 0; k < 3; k++) objs.push(O("coin", l, z - 300 + k * 450, { h: 70 })); });
  }
  function start(n) {
    level = Math.max(1, Math.min(n, unlocked));
    C = cfg(level);
    pos = 0; speed = C.v; lane = 1; px = 0; py = 0; vy = 0; jumps = 0; lives = 3; coins = 0; score = 0; over = false; won = false;
    shake = 0; msg = ""; msgT = 0; objs = []; inv = 0; star = 0; hurt = 0; why = ""; hits = 0; bob = 0;
    endZ = C.l * 100; spawnZ = 6500;
    if (nextB) { nextB.style.display = "none"; retryB.style.display = "none"; }
    cameraX = 0;
  }
  function jump() {
    if (over || won) return;
    if (py <= 5 && jumps === 0) { vy = JV; jumps = 1; }
    else if (jumps === 1) { vy = JV2; jumps = 2; msg = "Çift zıplama!"; msgT = 0.5; }
  }
  function moveLane(d) { if (over || won) return; lane = Math.max(0, Math.min(2, lane + d)); }
  function lose(why0, fell) {
    if (inv > 0 || over || won) return;
    lives--; hits++; why = why0; shake = 0.4; inv = 1.6; hurt = 0.4;
    try { if (navigator.vibrate) navigator.vibrate(80); } catch (e) {}
    if (fell) { py = 0; vy = 0; jumps = 0; }
    if (lives <= 0) { over = true; hi("nb_p3d_best", score); }
  }
  function update(dt) {
    T += dt;
    if (inv > 0) inv -= dt;
    if (star > 0) star -= dt;
    if (hurt > 0) hurt -= dt;
    const slip = C.slip ? 4 : 11;
    px += (LX[lane] - px) * Math.min(1, dt * slip);
    if (!over && !won) {
      pos += speed * dt;
      bob += dt * 12;
      vy -= G * dt; py += vy * dt;
      if (py <= 0) { py = 0; vy = 0; jumps = 0; }
      score = meters() + coins * 10 + (star > 0 ? 0 : 0);
    } else {
      speed = Math.max(0, speed - 7000 * dt);
      pos += speed * dt;
      py += vy * dt; vy -= G * dt; if (py < 0) { py = 0; vy = 0; }
    }
    while (spawnZ < Math.min(endZ - 2500, pos + DRAW * SL - 300)) {
      genWave(spawnZ);
      spawnZ += C.d + Math.random() * 1200;
    }
    const pz = pos + ZP;
    objs.forEach((o) => {
      if (o.sp) o.z += o.sp * dt;
      const rel = o.z - pz;
      if (!over && !won && !o.done) {
        const near = Math.abs(px - LX[o.lane]) < 0.4;
        const crossed = (o.prev > 0 && rel <= 0) || Math.abs(rel) < 140;
        if (o.type === "coin") {
          if (near && crossed && Math.abs((py + 60) - o.h) < 190) { o.done = true; coins++; }
        } else if (o.type === "star") {
          if (near && crossed && Math.abs((py + 60) - o.h) < 220) { o.done = true; star = 6; msg = "Yıldız gücü! 6 sn"; msgT = 1.2; }
        } else if (o.type === "gap") {
          const inside = (rel <= 0 && rel > -o.len) || (o.prev > 0 && rel <= -o.len);
          if (inside && near && py < 40) {
            if (star > 0) { /* yıldız: uçarak geçer */ }
            else {
              lose("Boşluğa düştün!", true);
              if (!over) { pos = Math.max(0, o.z - 3200 - ZP); objs.forEach((q) => { q.prev = q.z - (pos + ZP); }); }
            }
          }
          if (rel <= -o.len) o.done = true;
        } else if (crossed && near && Math.abs(rel) < 160) {
          if (star > 0 && o.type !== "gap") { o.done = true; o.dead = 0.4; score += 0; coins += 2; msg = "Yıldız darbesi +20"; msgT = 0.7; }
          else if (o.type === "walker") {
            if (py >= 60 && vy <= 0 && py < 220) { o.done = true; o.dead = 0.4; vy = 1100; jumps = 1; coins += 3; msg = "Ezdin! +30"; msgT = 0.8; }
            else if (py < 60 || (py < 170 && vy > 0)) lose("Düşmana çarptın!");
          } else if (o.type === "bee") {
            if (py > 70 && py < 380) lose("Arıya çarptın!");
          } else if (py < o.h) lose(o.type === "spiky" ? "Dikene çarptın!" : "Engele çarptın!");
        }
      }
      if (o.dead > 0) o.dead -= dt;
      o.prev = rel;
    });
    objs = objs.filter((o) => o.z - pos > -3000 && o.z - pos < DRAW * SL + 8000);
    if (!over && !won && pos + ZP >= endZ + 400) {
      won = true;
      if (level + 1 > unlocked) { unlocked = level + 1; hi("nb_p3d", unlocked); }
      score += lives * 100 + 300;
      hi("nb_p3d_best", score);
      nextB.style.display = ""; retryB.style.display = "";
    }
    if (over) retryB.style.display = "";
    if (msgT > 0) msgT -= dt;
    if (shake > 0) shake -= dt;
  }

  // ---- çizimler ----
  function tree(x, y, sc, kind, seed) {
    const h = (1100 + hash(seed, 1) * 900) * sc, w = 340 * sc;
    if (w < 2) return;
    if (kind === "tree") {
      ctx.fillStyle = "#6b4a28"; ctx.fillRect(x - w * 0.09, y - h * 0.4, w * 0.18, h * 0.4);
      ctx.fillStyle = "#2f9a3e"; ctx.beginPath(); ctx.arc(x, y - h * 0.62, w * 0.55, 0, 7); ctx.fill();
      ctx.fillStyle = "#3fb54e"; ctx.beginPath(); ctx.arc(x - w * 0.12, y - h * 0.7, w * 0.36, 0, 7); ctx.fill();
    } else if (kind === "cactus") {
      ctx.fillStyle = "#3f9a52"; rr(x - w * 0.1, y - h * 0.8, w * 0.2, h * 0.8, w * 0.1); ctx.fill();
      rr(x - w * 0.38, y - h * 0.55, w * 0.16, h * 0.3, w * 0.08); ctx.fill(); rr(x + w * 0.22, y - h * 0.62, w * 0.16, h * 0.32, w * 0.08); ctx.fill();
    } else if (kind === "crystal") {
      ctx.fillStyle = "#9fdcff"; ctx.beginPath(); ctx.moveTo(x - w * 0.3, y); ctx.lineTo(x - w * 0.05, y - h * 0.8); ctx.lineTo(x + w * 0.2, y); ctx.fill();
      ctx.fillStyle = "#c9ecff"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * 0.25, y - h * 0.55); ctx.lineTo(x + w * 0.45, y); ctx.fill();
    } else if (kind === "pine") {
      ctx.fillStyle = "#4a3320"; ctx.fillRect(x - w * 0.07, y - h * 0.2, w * 0.14, h * 0.2);
      ctx.fillStyle = "#15472c"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - w * (0.45 - i * 0.1), y - h * (0.2 + i * 0.25)); ctx.lineTo(x, y - h * (0.55 + i * 0.25)); ctx.lineTo(x + w * (0.45 - i * 0.1), y - h * (0.2 + i * 0.25)); ctx.fill(); }
    } else {
      ctx.fillStyle = "#2b1c22"; ctx.beginPath(); ctx.moveTo(x - w * 0.4, y); ctx.lineTo(x - w * 0.25, y - h * 0.55); ctx.lineTo(x, y - h * 0.4); ctx.lineTo(x + w * 0.3, y - h * 0.7); ctx.lineTo(x + w * 0.45, y); ctx.fill();
      ctx.fillStyle = "rgba(255,110,40,.7)"; ctx.fillRect(x - w * 0.1, y - h * 0.2, w * 0.2, h * 0.04);
    }
  }
  function sprite(o, x, y, sc, th) {
    const t = o.type;
    if (t === "coin") {
      const r = sc * 60;
      if (r < 1.5) return;
      const k = Math.abs(Math.cos(T * 4 + o.z * 0.002));
      const cy = y - sc * o.h;
      ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.ellipse(x, cy, Math.max(1, r * k), r, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "#b78a00"; ctx.lineWidth = Math.max(1, r * 0.14); ctx.stroke();
      return;
    }
    if (t === "star") {
      const r = sc * 110; if (r < 2) return;
      const cy = y - sc * o.h - r * 0.4;
      ctx.fillStyle = "#ffe14a"; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5 + T * 2, rr0 = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr0, cy + Math.sin(a) * rr0); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#c79a00"; ctx.lineWidth = Math.max(1, r * 0.08); ctx.stroke();
      return;
    }
    if (t === "gap") return;
    const w = sc * 420;
    if (w < 3) return;
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(x, y, w * 0.6, w * 0.1, 0, 0, 7); ctx.fill();
    if (t === "bush") {
      ctx.fillStyle = "#2f9a3e"; ctx.beginPath(); ctx.arc(x - w * 0.2, y - w * 0.28, w * 0.3, 0, 7); ctx.arc(x + w * 0.2, y - w * 0.28, w * 0.3, 0, 7); ctx.arc(x, y - w * 0.42, w * 0.32, 0, 7); ctx.fill();
      ctx.fillStyle = "#47b857"; ctx.beginPath(); ctx.arc(x - w * 0.05, y - w * 0.5, w * 0.16, 0, 7); ctx.fill();
    } else if (t === "cactus") {
      ctx.fillStyle = "#3f9a52"; rr(x - w * 0.14, y - w * 0.75, w * 0.28, w * 0.75, w * 0.12); ctx.fill();
      rr(x - w * 0.42, y - w * 0.5, w * 0.18, w * 0.3, w * 0.08); ctx.fill(); rr(x + w * 0.24, y - w * 0.58, w * 0.18, w * 0.3, w * 0.08); ctx.fill();
    } else if (t === "crystal") {
      ctx.fillStyle = "#8fd3ff"; ctx.beginPath(); ctx.moveTo(x - w * 0.35, y); ctx.lineTo(x - w * 0.1, y - w * 0.8); ctx.lineTo(x + w * 0.1, y); ctx.fill();
      ctx.fillStyle = "#c9ecff"; ctx.beginPath(); ctx.moveTo(x - w * 0.05, y); ctx.lineTo(x + w * 0.2, y - w * 0.6); ctx.lineTo(x + w * 0.4, y); ctx.fill();
    } else if (t === "rock") {
      ctx.fillStyle = "#4a3a42"; ctx.beginPath(); ctx.moveTo(x - w * 0.4, y); ctx.lineTo(x - w * 0.3, y - w * 0.5); ctx.lineTo(x, y - w * 0.7); ctx.lineTo(x + w * 0.35, y - w * 0.45); ctx.lineTo(x + w * 0.42, y); ctx.fill();
      ctx.fillStyle = "rgba(255,120,50,.55)"; ctx.fillRect(x - w * 0.12, y - w * 0.3, w * 0.24, w * 0.05);
    } else if (t === "spiky") {
      ctx.fillStyle = "#c53d7a"; ctx.beginPath(); ctx.arc(x, y - w * 0.3, w * 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = "#f2e6ef";
      for (let i = 0; i < 9; i++) { const a = -Math.PI + i * Math.PI / 8; ctx.beginPath(); ctx.moveTo(x + Math.cos(a - 0.15) * w * 0.28, y - w * 0.3 + Math.sin(a - 0.15) * w * 0.28); ctx.lineTo(x + Math.cos(a) * w * 0.48, y - w * 0.3 + Math.sin(a) * w * 0.48); ctx.lineTo(x + Math.cos(a + 0.15) * w * 0.28, y - w * 0.3 + Math.sin(a + 0.15) * w * 0.28); ctx.fill(); }
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x - w * 0.09, y - w * 0.3, w * 0.07, 0, 7); ctx.arc(x + w * 0.09, y - w * 0.3, w * 0.07, 0, 7); ctx.fill();
      ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(x - w * 0.09, y - w * 0.29, w * 0.03, 0, 7); ctx.arc(x + w * 0.09, y - w * 0.29, w * 0.03, 0, 7); ctx.fill();
    } else if (t === "walker") {
      const sq = o.dead > 0 ? 0.35 : 1;
      ctx.fillStyle = "#7d4fd0"; ctx.beginPath(); ctx.ellipse(x, y - w * 0.22 * sq, w * 0.36, w * 0.3 * sq, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#9a6de6"; ctx.beginPath(); ctx.ellipse(x - w * 0.1, y - w * 0.32 * sq, w * 0.14, w * 0.1 * sq, 0, 0, 7); ctx.fill();
      if (sq === 1) {
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(x - w * 0.12, y - w * 0.25, w * 0.09, w * 0.11, 0, 0, 7); ctx.ellipse(x + w * 0.12, y - w * 0.25, w * 0.09, w * 0.11, 0, 0, 7); ctx.fill();
        ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(x - w * 0.12, y - w * 0.23, w * 0.04, 0, 7); ctx.arc(x + w * 0.12, y - w * 0.23, w * 0.04, 0, 7); ctx.fill();
        ctx.fillStyle = "#3a2470"; const st = Math.sin(T * 10 + o.z) * w * 0.05; ctx.fillRect(x - w * 0.24, y - w * 0.04, w * 0.16, w * 0.04 + st); ctx.fillRect(x + w * 0.08, y - w * 0.04, w * 0.16, w * 0.04 - st);
      }
    } else if (t === "bee") {
      const cy = y - sc * o.h + Math.sin(T * 6 + o.z) * w * 0.05;
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(x, y, w * 0.3, w * 0.06, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.7)"; const fl = Math.sin(T * 40) * w * 0.05; ctx.beginPath(); ctx.ellipse(x - w * 0.25, cy - w * 0.22 + fl, w * 0.22, w * 0.1, -0.5, 0, 7); ctx.ellipse(x + w * 0.25, cy - w * 0.22 - fl, w * 0.22, w * 0.1, 0.5, 0, 7); ctx.fill();
      ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.ellipse(x, cy, w * 0.26, w * 0.2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#222"; ctx.fillRect(x - w * 0.05, cy - w * 0.2, w * 0.07, w * 0.4); ctx.fillRect(x + w * 0.12, cy - w * 0.18, w * 0.06, w * 0.36);
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x - w * 0.12, cy - w * 0.04, w * 0.05, 0, 7); ctx.arc(x + w * 0.0, cy - w * 0.04, w * 0.05, 0, 7); ctx.fill();
    }
  }
  function drawFlag(x, y, sc) {
    const h = sc * 1500, w = sc * 120;
    if (h < 6) return;
    ctx.fillStyle = "#e8e8f0"; ctx.fillRect(x - w * 0.15, y - h, w * 0.3, h);
    ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.arc(x, y - h, w * 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = "#ff3d5a"; ctx.beginPath(); ctx.moveTo(x + w * 0.15, y - h * 0.95); ctx.lineTo(x + w * 3.2, y - h * 0.82); ctx.lineTo(x + w * 0.15, y - h * 0.69); ctx.fill();
  }
  function drawPlayer() {
    const cx = W / 2, by = 482, jy = py * 0.2;
    const blink = inv > 0 && Math.floor(inv * 14) % 2 === 0;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath(); ctx.ellipse(cx, by + 4, 34 - jy * 0.1, 8 - jy * 0.03, 0, 0, 7); ctx.fill();
    if (blink && !over) ctx.globalAlpha = 0.35;
    ctx.translate(cx, by - jy); ctx.rotate((LX[lane] - px) * 0.3);
    const sq = py <= 3 ? 1 + Math.sin(bob) * 0.04 : 0.96;
    ctx.scale(1 / sq, sq);
    const run = py <= 3 ? Math.sin(bob) : 0;
    ctx.fillStyle = "#ff9a1f";
    ctx.fillRect(-18, -12, 12, 12 + run * 4); ctx.fillRect(6, -12, 12, 12 - run * 4);
    ctx.fillRect(-22, -2 + run * 4, 18, 5); ctx.fillRect(4, -2 - run * 4, 18, 5);
    ctx.fillStyle = star > 0 ? "#ffd23a" : "#2f9bff";
    ctx.beginPath(); ctx.ellipse(0, -44, 32, 32, 0, 0, 7); ctx.fill();
    ctx.fillStyle = star > 0 ? "#ffe680" : "#58b4ff";
    ctx.beginPath(); ctx.ellipse(0, -76, 22, 21, 0, 0, 7); ctx.fill();
    ctx.fillStyle = star > 0 ? "#ffcf2a" : "#1b7fe0";
    const wf = py > 3 ? -10 : Math.sin(bob * 0.5) * 3;
    ctx.beginPath(); ctx.ellipse(-30, -46 + wf, 10, 20, 0.3, 0, 7); ctx.ellipse(30, -46 + wf, 10, 20, -0.3, 0, 7); ctx.fill();
    ctx.fillStyle = "#ff5a3d";
    ctx.beginPath(); ctx.moveTo(-8, -96); ctx.lineTo(0, -114); ctx.lineTo(8, -96); ctx.fill(); ctx.beginPath(); ctx.moveTo(-2, -97); ctx.lineTo(10, -110); ctx.lineTo(14, -94); ctx.fill();
    ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.moveTo(-10, -22); ctx.lineTo(0, -4); ctx.lineTo(10, -22); ctx.fill();
    if (hurt > 0) { ctx.fillStyle = "rgba(255,60,60,.5)"; ctx.beginPath(); ctx.ellipse(0, -52, 40, 50, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  function render() {
    const P = TH[C.th];
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 8 * Math.min(1, shake * 3), (Math.random() - 0.5) * 6 * Math.min(1, shake * 3));
    const sky = ctx.createLinearGradient(0, 0, 0, HY);
    sky.addColorStop(0, P.t); sky.addColorStop(1, P.b);
    ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, HY + 10);
    if (P.night) {
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.4 + (i % 3) * 0.2; ctx.fillRect((i * 97) % W, (i * 53) % (HY - 50), 1.5, 1.5); }
      ctx.globalAlpha = 1; ctx.fillStyle = "#e9ecf5"; ctx.beginPath(); ctx.arc(280, 54, 15, 0, 7); ctx.fill();
    } else if (!P.lava) {
      ctx.fillStyle = "#fff7c9"; ctx.beginPath(); ctx.arc(90, 56, 20, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.8)";
      for (let i = 0; i < 3; i++) { const cx0 = ((i * 140 + T * 6) % (W + 120)) - 60; ctx.beginPath(); ctx.arc(cx0, 40 + i * 24, 18, 0, 7); ctx.arc(cx0 + 18, 44 + i * 24, 14, 0, 7); ctx.arc(cx0 - 16, 46 + i * 24, 12, 0, 7); ctx.fill(); }
    }
    ctx.fillStyle = P.e; ctx.fillRect(-10, HY, W + 20, H - HY + 10);
    cameraX += (px - cameraX) * 0.1;
    const base = Math.floor(pos / SL), pct = (pos % SL) / SL, pxw = cameraX * RW * 0.8;
    const ys = [], ws = [], ss = [];
    for (let n = 0; n <= DRAW; n++) {
      const z = Math.max(40, n * SL - pct * SL), s = CD / z;
      ss.push(s); ys.push(HY + s * CAMH * H / 2); ws.push(s * RW * W / 2);
    }
    const sxAt = (n, wx) => W / 2 + ss[n] * (wx - pxw) * W / 2;
    const bucket = {};
    const add = (o, rz) => { const f = (rz + pct * SL) / SL, n = Math.floor(f); if (n < 1 || n >= DRAW - 1) return; (bucket[n] = bucket[n] || []).push({ o: o, rz: rz }); };
    objs.forEach((o) => add(o, o.z - pos));
    const flag = { type: "flag", lane: 1, z: endZ };
    add(flag, endZ - pos);
    for (let n = DRAW - 1; n >= 0; n--) {
      const i = base + n, band = Math.floor(i / 4) % 2 === 0;
      const y1 = ys[n], y2 = ys[n + 1];
      if (y1 - y2 < 0.01 && n > 0) continue;
      const w1 = ws[n], w2 = ws[n + 1], x1 = sxAt(n, 0), x2 = sxAt(n + 1, 0);
      const wy = pos + n * SL;
      const fin = wy >= endZ;
      quad(x1 - w1 * 1.25, y1, x1 + w1 * 1.25, y1, x2 + w2 * 1.25, y2, x2 - w2 * 1.25, y2, P.e);
      quad(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, fin ? (Math.floor(i / 2) % 2 ? "#f2f2f2" : "#2a2a33") : band ? P.g1 : P.g2);
      if (band && !fin) {
        [-0.333, 0.333].forEach((o) => { const a = x1 + w1 * o, b = x2 + w2 * o; quad(a - w1 * 0.01, y1, a + w1 * 0.01, y1, b + w2 * 0.01, y2, b - w2 * 0.01, y2, "rgba(255,255,255,.22)"); });
      }
      if (i % 3 === 0) {
        for (let sd = -1; sd <= 1; sd += 2) {
          const wx = sd * (RW * 1.6 + hash(i, sd + 9) * 900), sc = ss[n] * W / 2, bx = sxAt(n, wx);
          if (bx > -150 && bx < W + 150 && hash(i, sd + 3) > 0.25) tree(bx, y1, sc, P.side, i * 3 + sd);
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
          if (o.type === "flag") { drawFlag(W / 2 + s * (-RW * 1.05 - pxw) * W / 2, sy, sc); return; }
          if (o.type === "gap") {
            if (o.done) return;
            const z2 = Math.max(40, e.rz + o.len), s2 = CD / z2, sy2 = HY + s2 * CAMH * H / 2;
            const hw = RW * 0.33;
            const xa = W / 2 + s * (wx - hw - pxw) * W / 2, xb = W / 2 + s * (wx + hw - pxw) * W / 2;
            const xc = W / 2 + s2 * (wx - hw - pxw) * W / 2, xd = W / 2 + s2 * (wx + hw - pxw) * W / 2;
            quad(xa, sy, xb, sy, xd, sy2, xc, sy2, P.gap);
            if (P.lava) { quad(xa + (xb - xa) * 0.1, sy, xb - (xb - xa) * 0.1, sy, xd - (xd - xc) * 0.1, sy2, xc + (xd - xc) * 0.1, sy2, "rgba(255,200,60,.55)"); }
            else { quad(xa, sy, xb, sy, xb, sy - 3, xa, sy - 3, "rgba(255,255,255,.35)"); }
            return;
          }
          if (o.done && o.type !== "walker") return;
          if (o.done && !(o.dead > 0)) return;
          sprite(o, sx, sy, sc, P);
        });
      }
    }
    const fog = ctx.createLinearGradient(0, HY - 2, 0, HY + 80);
    fog.addColorStop(0, P.b); fog.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.75; ctx.fillStyle = fog; ctx.fillRect(-10, HY - 2, W + 20, 82); ctx.globalAlpha = 1;
    drawPlayer();
    // HUD
    ctx.fillStyle = "rgba(0,0,0,.45)"; rr(8, 8, 116, 34, 8); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("❤️".repeat(Math.max(0, lives)) + "  🪙 " + coins, 14, 31);
    ctx.fillStyle = "rgba(0,0,0,.45)"; rr(W - 116, 8, 108, 34, 8); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 13px sans-serif"; ctx.fillText("Seviye " + level + " • " + P.name, W - 62, 22);
    const pr = Math.max(0, Math.min(1, (pos + ZP) / endZ));
    ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.fillRect(W - 110, 29, 96, 6); ctx.fillStyle = "#58e07a"; ctx.fillRect(W - 110, 29, 96 * pr, 6);
    if (star > 0) { ctx.fillStyle = "#ffd23a"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center"; ctx.fillText("⭐ " + Math.ceil(star) + " sn", W / 2, 62); }
    if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT * 1.5); ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 4; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.strokeText(msg, W / 2, 110); ctx.fillText(msg, W / 2, 110); ctx.globalAlpha = 1; }
    if (over) {
      ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.fillRect(0, 160, W, 150);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 30px sans-serif"; ctx.fillText("Canların bitti!", W / 2, 205);
      ctx.font = "15px sans-serif"; ctx.fillText(why, W / 2, 236);
      ctx.font = "16px sans-serif"; ctx.fillText("\"Tekrar\" ile bu seviyeyi yeniden dene", W / 2, 270);
    }
    if (won) {
      ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 150, W, 170);
      ctx.fillStyle = "#ffd23a"; ctx.textAlign = "center"; ctx.font = "bold 30px sans-serif"; ctx.fillText("Seviye tamam! 🎉", W / 2, 200);
      ctx.font = "34px sans-serif"; ctx.fillText(hits === 0 ? "⭐⭐⭐" : hits <= 1 ? "⭐⭐" : "⭐", W / 2, 245);
      ctx.fillStyle = "#fff"; ctx.font = "16px sans-serif"; ctx.fillText("🪙 " + coins + "   Puan: " + score, W / 2, 285);
    }
    ctx.restore();
    info.textContent = "Seviye " + level + "   Puan: " + score + "   🪙 " + coins;
    sub.textContent = "Açık seviye: " + unlocked + "   En iyi puan: " + best("nb_p3d_best") + "   Zıpla: ezmek için üstüne in, diken/arı için kaç";
  }
  function loop(t) {
    if (dead) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    update(dt); render();
    raf = requestAnimationFrame(loop);
  }
  let dn = null;
  cvs.onpointerdown = (e) => { try { cvs.setPointerCapture(e.pointerId); } catch (x) {} dn = { x: e.clientX, y: e.clientY }; };
  cvs.onpointerup = (e) => {
    if (!dn) return;
    const dx = e.clientX - dn.x, dy = e.clientY - dn.y, r = cvs.getBoundingClientRect();
    if (dy < -30 && Math.abs(dy) > Math.abs(dx)) jump();
    else if (Math.abs(dx) > 28) moveLane(dx > 0 ? 1 : -1);
    else moveLane((e.clientX - r.left) < r.width / 2 ? -1 : 1);
    dn = null;
  };
  cvs.onpointercancel = () => { dn = null; };
  const kd = (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") moveLane(-1);
    else if (e.key === "ArrowRight" || e.key === "d") moveLane(1);
    else if (e.key === " " || e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); jump(); }
  };
  window.addEventListener("keydown", kd);
  const jb = el("button", "", "⬆ ZIPLA (çift dokun: çift zıplama)");
  jb.type = "button";
  jb.style.cssText = "display:block;width:100%;padding:18px 8px;font-weight:800;font-size:17px;margin-bottom:8px;touch-action:none;user-select:none";
  jb.onpointerdown = (e) => { e.preventDefault(); jump(); };
  body.appendChild(jb);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  body.appendChild(row);
  let nextB = null, retryB = null;
  const go = (n) => { start(n); };
  const bPrev = act("◀", () => go(level - 1));
  const bNext = act("▶", () => go(level + 1));
  retryB = act("Tekrar", () => go(level));
  nextB = act("Sonraki seviye ▶", () => go(level + 1));
  [bPrev, bNext, retryB, nextB].forEach((b) => { b.style.minWidth = "0"; row.appendChild(b); });
  const hint = el("p", "", "Ekranın sol yarısına dokun: sola şerit, sağ yarısına dokun: sağa şerit (ya da kaydır). ⬆ ZIPLA butonuna bas (havadayken tekrar basarsan çift zıplama). Mor yaratığın üstüne inerek ezebilirsin. Diken ve arılara çarpma, boşluklardan zıplayarak geç. ⭐ yıldız kısa süre dokunulmaz yapar. Her seviyenin sonundaki bayrağa ulaş. 3 canın var. Seviyeler: çayır, çöl, buz (kaygan), gece ormanı, lav kalesi... ◀ ▶ ile açtığın seviyelere dönebilirsin.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start(1);
  nextB.style.display = "none"; retryB.style.display = "none";
  dead = false; last = performance.now();
  raf = requestAnimationFrame(loop);
  return () => { dead = true; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); };
}

export const SOLO = {
  jump3d: { group: "Aksiyon", icon: "🐥", label: "Pıtır 3D Macera", start: jump3d }
};
