// Aksiyon oyunları 9: Baloncuk Atış 3D (3D görünümlü baloncuk patlatma)
const rand = (n) => Math.floor(Math.random() * n);
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function hi(k, v) { const o = best(k); if (v > o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }

function bubble(body, el, act) {
  const W = 360, H = 520, R = 22, D = 44, RH = 38.1, TOP = 26, COLS = 8, ROWS = 16, LOSE = 11, SX = 180, SY = 478;
  const HUES = [350, 48, 265, 28, 130, 200];
  let grid, par, cur, nxt, shot, aim, left, period, score, level, over, dead, ncol, msg, msgT, raf, last;
  let pops = [], falls = [], parts = [];
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 4px;font-size:15px";
  body.appendChild(info);
  const sub = el("p", "", "");
  sub.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)";
  body.appendChild(sub);
  const cv = el("canvas", "");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.cssText = "display:block;width:100%;max-width:360px;margin:0 auto 10px;touch-action:none;user-select:none;border-radius:12px";
  body.appendChild(cv);
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px";
  body.appendChild(row);

  const cnt = (r) => ((r + par) % 2 ? 7 : 8);
  const cx = (r, c) => ((r + par) % 2 ? 48 : 26) + c * D;
  const cy = (r) => TOP + r * RH;
  function nbs(r, c) {
    const o = (r + par) % 2, a = [[r, c - 1], [r, c + 1]];
    const dc = o ? [0, 1] : [-1, 0];
    for (const k of dc) { a.push([r - 1, c + k]); a.push([r + 1, c + k]); }
    return a.filter((p) => p[0] >= 0 && p[0] < ROWS && p[1] >= 0 && p[1] < cnt(p[0]));
  }
  function onBoard() {
    const s = new Set();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < cnt(r); c++) if (grid[r][c] >= 0) s.add(grid[r][c]);
    return Array.from(s);
  }
  function pick() {
    const a = onBoard();
    if (!a.length) return rand(ncol);
    return a[rand(a.length)];
  }
  function fill() {
    grid = []; par = 0;
    for (let r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill(-1));
    const n = Math.min(4 + Math.ceil(level / 2), 8);
    for (let r = 0; r < n; r++) for (let c = 0; c < cnt(r); c++) grid[r][c] = rand(ncol);
  }
  function setLevel() {
    ncol = Math.min(4 + Math.floor((level - 1) / 2), 6);
    period = Math.max(4, 7 - Math.floor((level - 1) / 2));
    left = period;
    fill();
    cur = pick(); nxt = pick();
  }
  function newRow() {
    par ^= 1;
    grid.unshift(new Array(COLS).fill(-1));
    grid.pop();
    for (let c = 0; c < cnt(0); c++) grid[0][c] = rand(ncol);
    for (let r = LOSE; r < ROWS; r++) for (let c = 0; c < cnt(r); c++) if (grid[r][c] >= 0) finish();
  }
  function finish() {
    if (over) return;
    over = true; hi("nb_bubble", score);
  }
  function spawn(x, y, h, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, s = 60 + Math.random() * 140;
      parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, h: h, life: 0.5 + Math.random() * 0.3 });
    }
  }
  function land() {
    let br = -1, bc = -1, bd = 1e9;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < cnt(r); c++) {
      if (grid[r][c] >= 0) continue;
      if (r > 0 && !nbs(r, c).some((p) => grid[p[0]][p[1]] >= 0)) continue;
      const d = Math.hypot(cx(r, c) - shot.x, cy(r) - shot.y);
      if (d < bd) { bd = d; br = r; bc = c; }
    }
    const col = shot.c;
    shot = null;
    if (br < 0) { finish(); return; }
    grid[br][bc] = col;
    const seen = new Set([br * 10 + bc]), q = [[br, bc]];
    while (q.length) {
      const p = q.pop();
      for (const n of nbs(p[0], p[1])) {
        const k = n[0] * 10 + n[1];
        if (!seen.has(k) && grid[n[0]][n[1]] === col) { seen.add(k); q.push(n); }
      }
    }
    if (seen.size >= 3) {
      let n = 0;
      seen.forEach((k) => {
        const r = Math.floor(k / 10), c = k % 10;
        pops.push({ x: cx(r, c), y: cy(r), h: HUES[col], t: 0 });
        spawn(cx(r, c), cy(r), HUES[col], 5);
        grid[r][c] = -1; n++;
      });
      score += n * 10 + (n > 3 ? (n - 3) * 10 : 0);
      // havada kalanları düşür
      const ok = new Set(), q2 = [];
      for (let c = 0; c < cnt(0); c++) if (grid[0][c] >= 0) { ok.add(c); q2.push([0, c]); }
      while (q2.length) {
        const p = q2.pop();
        for (const m of nbs(p[0], p[1])) {
          const k = m[0] * 10 + m[1];
          if (!ok.has(k) && grid[m[0]][m[1]] >= 0) { ok.add(k); q2.push(m); }
        }
      }
      let f = 0;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < cnt(r); c++) {
        if (grid[r][c] >= 0 && !ok.has(r * 10 + c)) {
          falls.push({ x: cx(r, c), y: cy(r), vy: -80 - Math.random() * 60, h: HUES[grid[r][c]] });
          grid[r][c] = -1; f++;
        }
      }
      score += f * 20;
      if (!onBoard().length) {
        level++; score += 500;
        msg = "Seviye " + level + "!"; msgT = 1.6;
        setLevel();
        return;
      }
    } else {
      left--;
      if (left <= 0) { newRow(); left = period; }
    }
    for (let r = LOSE; r < ROWS; r++) for (let c = 0; c < cnt(r); c++) if (grid[r][c] >= 0) finish();
    cur = nxt; nxt = pick();
  }
  function update(dt) {
    if (shot) {
      const sp = 640 * dt, n = Math.max(1, Math.ceil(sp / 5)), st = sp / n;
      for (let i = 0; i < n && shot; i++) {
        shot.x += shot.vx * st; shot.y += shot.vy * st;
        if (shot.x < 4 + R) { shot.x = 4 + R; shot.vx = -shot.vx; }
        if (shot.x > W - 4 - R) { shot.x = W - 4 - R; shot.vx = -shot.vx; }
        let hit = shot.y <= TOP;
        if (!hit) {
          for (let r = 0; r < ROWS && !hit; r++) for (let c = 0; c < cnt(r); c++) {
            if (grid[r][c] >= 0 && Math.hypot(cx(r, c) - shot.x, cy(r) - shot.y) < D - 5) { hit = true; break; }
          }
        }
        if (hit) land();
      }
    }
    pops.forEach((p) => { p.t += dt; });
    pops = pops.filter((p) => p.t < 0.25);
    falls.forEach((f) => { f.vy += 1100 * dt; f.y += f.vy * dt; });
    falls = falls.filter((f) => f.y < H + 40);
    parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.life -= dt; });
    parts = parts.filter((p) => p.life > 0);
    if (msgT > 0) msgT -= dt;
  }
  function sph(x, y, r, h, a) {
    ctx.save();
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.beginPath(); ctx.ellipse(x + r * 0.2, y + r * 0.85, r * 0.8, r * 0.26, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, "hsl(" + h + ",95%,82%)");
    g.addColorStop(0.35, "hsl(" + h + ",85%,55%)");
    g.addColorStop(1, "hsl(" + h + ",80%,24%)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r - 1, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.78)";
    ctx.beginPath(); ctx.ellipse(x - r * 0.36, y - r * 0.46, r * 0.27, r * 0.15, -0.6, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r - 2, 0.3, 1.5); ctx.stroke();
    ctx.restore();
  }
  function traj() {
    const pts = [];
    let x = SX, y = SY, vx = Math.cos(aim), vy = Math.sin(aim);
    for (let i = 0; i < 260; i++) {
      x += vx * 5; y += vy * 5;
      if (x < 4 + R) { x = 4 + R; vx = -vx; }
      if (x > W - 4 - R) { x = W - 4 - R; vx = -vx; }
      if (y <= TOP) break;
      let hit = false;
      for (let r = 0; r < ROWS && !hit; r++) for (let c = 0; c < cnt(r); c++) if (grid[r][c] >= 0 && Math.hypot(cx(r, c) - x, cy(r) - y) < D - 5) { hit = true; break; }
      if (hit) break;
      if (i % 4 === 3) pts.push([x, y]);
    }
    return pts;
  }
  function draw() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1b1740"); bg.addColorStop(1, "#0b0a1c");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // perspektif zemin çizgileri
    ctx.strokeStyle = "rgba(120,110,255,.12)"; ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(SX + i * 14, 300); ctx.lineTo(SX + i * 70, H); ctx.stroke(); }
    for (let k = 0; k < 6; k++) { const y = 310 + k * k * 6 + k * 14; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // yan raylar
    const rl = ctx.createLinearGradient(0, 0, 6, 0);
    rl.addColorStop(0, "#6e63ff"); rl.addColorStop(1, "#2a2470");
    ctx.fillStyle = rl; ctx.fillRect(0, 0, 4, H);
    ctx.fillStyle = rl; ctx.fillRect(W - 4, 0, 4, H);
    ctx.fillStyle = "#4b43c9"; ctx.fillRect(0, 0, W, 5);
    // kaybetme çizgisi
    ctx.strokeStyle = "rgba(255,80,80,.55)"; ctx.setLineDash([8, 6]); ctx.lineWidth = 2;
    const ly = cy(LOSE) - R + 2;
    ctx.beginPath(); ctx.moveTo(6, ly); ctx.lineTo(W - 6, ly); ctx.stroke(); ctx.setLineDash([]);
    // baloncuklar
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < cnt(r); c++) if (grid[r][c] >= 0) sph(cx(r, c), cy(r), R, HUES[grid[r][c]]);
    falls.forEach((f) => sph(f.x, f.y, R, f.h, 0.9));
    pops.forEach((p) => {
      const k = p.t / 0.25;
      sph(p.x, p.y, R * (1 + k * 0.5), p.h, 1 - k);
    });
    parts.forEach((p) => { ctx.globalAlpha = Math.max(0, p.life * 1.6); ctx.fillStyle = "hsl(" + p.h + ",90%,70%)"; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill(); ctx.globalAlpha = 1; });
    // nişan
    if (!over && !shot) {
      traj().forEach((p, i) => { ctx.fillStyle = "rgba(255,255,255," + Math.max(0.15, 0.7 - i * 0.012) + ")"; ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, 7); ctx.fill(); });
    }
    // top
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(SX, 506, 46, 12, 0, 0, 7); ctx.fill();
    ctx.translate(SX, SY); ctx.rotate(aim);
    const cg = ctx.createLinearGradient(0, -9, 0, 9);
    cg.addColorStop(0, "#c9c3ff"); cg.addColorStop(0.5, "#6b5fe0"); cg.addColorStop(1, "#2b2478");
    ctx.fillStyle = cg; ctx.fillRect(10, -9, 36, 18);
    ctx.restore();
    ctx.fillStyle = "#3b33a8"; ctx.beginPath(); ctx.ellipse(SX, 494, 34, 16, 0, 0, 7); ctx.fill();
    if (cur != null && !shot) sph(SX, SY, R, HUES[cur]);
    if (shot) sph(shot.x, shot.y, R, HUES[shot.c]);
    // sıradaki
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("sıradaki (dokun: değiştir)", 66, 462);
    if (nxt != null) sph(66, 490, 16, HUES[nxt]);
    ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.textAlign = "right"; ctx.font = "13px sans-serif";
    ctx.fillText("⬇ " + left, W - 12, 500);
    ctx.textAlign = "center";
    if (msgT > 0) { ctx.fillStyle = "rgba(255,255,255," + Math.min(1, msgT) + ")"; ctx.font = "bold 34px sans-serif"; ctx.fillText(msg, W / 2, 250); }
    if (over) {
      ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 170, W, 120);
      ctx.fillStyle = "#fff"; ctx.font = "bold 30px sans-serif"; ctx.fillText("Oyun bitti", W / 2, 218);
      ctx.font = "16px sans-serif"; ctx.fillText("Puan: " + score + "   En iyi: " + best("nb_bubble"), W / 2, 252);
    }
    info.textContent = "Seviye " + level + "   Puan: " + score;
    sub.textContent = "Tavan " + left + " atışta bir iner (kaçırınca). En iyi: " + best("nb_bubble");
  }
  function loop(t) {
    if (dead) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    update(dt); draw();
    raf = requestAnimationFrame(loop);
  }
  function pt(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  function setAim(p) {
    let dx = p.x - SX, dy = p.y - SY;
    if (dy > -12) dy = -12;
    let a = Math.atan2(dy, dx);
    a = Math.max(-Math.PI + 0.16, Math.min(-0.16, a));
    aim = a;
  }
  let down = false;
  cv.onpointerdown = (e) => { down = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} setAim(pt(e)); };
  cv.onpointermove = (e) => { if (down) setAim(pt(e)); };
  cv.onpointerup = (e) => {
    if (!down) return;
    down = false;
    const p = pt(e);
    if (over || shot) return;
    if (Math.hypot(p.x - 66, p.y - 490) < 30) { const t = cur; cur = nxt; nxt = t; return; }
    setAim(p);
    shot = { x: SX, y: SY, vx: Math.cos(aim), vy: Math.sin(aim), c: cur };
  };
  cv.onpointercancel = () => { down = false; };
  function start() {
    level = 1; score = 0; over = false; shot = null; msgT = 0; aim = -Math.PI / 2;
    pops = []; falls = []; parts = [];
    setLevel();
  }
  row.appendChild(act("Yeni oyun", start));
  const hint = el("p", "", "Ekrana dokunup sürükleyerek nişan al, parmağını bırakınca baloncuk fırlar. Aynı renkten 3 ya da daha fazlası yan yana gelince patlar, havada kalanlar düşer. Duvardan sekebilir. Kaçırdıkça tavan iner; kırmızı çizgiye ulaşırsa oyun biter.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);
  start();
  dead = false; last = performance.now();
  raf = requestAnimationFrame(loop);
  return () => { dead = true; cancelAnimationFrame(raf); };
}

export const SOLO = {
  bubble: { group: "Aksiyon", icon: "🫧", label: "Baloncuk Atış 3D", start: bubble }
};
