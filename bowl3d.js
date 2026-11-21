// Aksiyon oyunları 18: Bowling 3D (10 frame, fizikli lobutlar, kıvrım, güç ölçer, 6 salon)
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function put(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
const XS = 3.2, PR = 0.06, BR = 0.108, LW = 0.53;
const THEMES = [
  { n: "Mahalle Bowling", bg: ["#2b1d3a", "#5b3a5e"], fl: "#241a2e", neon: "#ffb347", ball: "#2f6fe0", lane: ["#d9a45f", "#cf9a55"] },
  { n: "Retro Salon", bg: ["#0f2a3a", "#1f5a6e"], fl: "#10222c", neon: "#35e6ff", ball: "#d9342b", lane: ["#e0b070", "#d5a565"] },
  { n: "Neon Salon", bg: ["#12062a", "#3a1466"], fl: "#0d0620", neon: "#ff3df0", ball: "#8e5bd6", lane: ["#c99358", "#bf894e"] },
  { n: "Gökyüzü Salon", bg: ["#1c3b66", "#6fa8e8"], fl: "#18294a", neon: "#ffffff", ball: "#2fb36d", lane: ["#e6bd82", "#dbb277"] },
  { n: "Altın Salon", bg: ["#2a1e08", "#6b4a10"], fl: "#221806", neon: "#ffd23a", ball: "#111111", lane: ["#e8c27a", "#ddb76f"] },
  { n: "Şampiyon Arena", bg: ["#05050c", "#1a1030"], fl: "#07070f", neon: "#ff4d4d", ball: "#f0b323", lane: ["#d49a55", "#c9904b"] }
];
const L = [];
for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) L.push({ x0: (i - r / 2) * 0.305, z0: 18.29 + r * 0.264 });
const ALL = L.map((_, i) => i);
const FALLV = 0.5, FALLV2 = 0.35;

export function mkSim(idx, o) {
  const pins = idx.map((i) => ({ i: i, x: L[i].x0, z: L[i].z0, vx: 0, vz: 0, fallen: false, fall: 0, dir: 1, gone: false, gt: 0 }));
  return { pins: pins, ball: { x: o.x, z: 0.2, vx: o.vx, vz: o.vz, act: true, gut: false, rot: 0 }, t: 0, still: 0, done: false, o: o };
}
function fell(p) { if (!p.fallen) { p.fallen = true; p.dir = p.vx >= 0 ? 1 : -1; if (Math.abs(p.vx) < 0.15) p.dir = p.i % 2 ? 1 : -1; } }
export function step(S, dt) {
  if (S.done) return;
  const b = S.ball, o = S.o, ps = S.pins;
  S.t += dt;
  if (b.act) {
    if (b.z > 7 && !b.gut) b.vx += o.ax * dt;
    b.x += b.vx * dt; b.z += b.vz * dt; b.rot += b.vz * dt;
    if (!b.gut && Math.abs(b.x) > LW + 0.02) {
      const sg = Math.sign(b.x);
      if (o.bump) { b.x = sg * (LW + 0.02); b.vx = -sg * Math.abs(b.vx) * 0.4; }
      else { b.gut = true; b.vx = 0; }
    }
    if (b.gut) b.x += (Math.sign(b.x) * 0.6 - b.x) * Math.min(1, dt * 10);
    if (b.z > 19.95 || S.t > 7) b.act = false;
  }
  for (let a = 0; a < ps.length; a++) {
    const p = ps[a];
    if (p.gone) continue;
    if (b.act && !b.gut) {
      const dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz), rr = BR + PR;
      if (d < rr && d > 1e-6) {
        const nx = dx / d, nz = dz / d, rel = (b.vx - p.vx) * nx + (b.vz - p.vz) * nz;
        if (rel > 0) {
          const j = 1.7 * rel / (1 / 5.5 + 1 / 1.2);
          b.vx -= j / 5.5 * nx; b.vz -= j / 5.5 * nz;
          p.vx += j / 1.2 * nx; p.vz += j / 1.2 * nz;
          if (j / 1.2 > FALLV) fell(p);
        }
        p.x += nx * (rr - d); p.z += nz * (rr - d);
      }
    }
    for (let c = a + 1; c < ps.length; c++) {
      const q = ps[c];
      if (q.gone) continue;
      const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz), rr = PR * 2;
      if (d < rr && d > 1e-6) {
        const nx = dx / d, nz = dz / d, rel = (p.vx - q.vx) * nx + (p.vz - q.vz) * nz;
        if (rel > 0) {
          const j = 1.85 * rel / 2 * 1.2;
          p.vx -= j / 1.2 * nx; p.vz -= j / 1.2 * nz; q.vx += j / 1.2 * nx; q.vz += j / 1.2 * nz;
          if (j / 1.2 > FALLV2) { fell(p); fell(q); }
        }
        const ov = (rr - d) / 2;
        p.x -= nx * ov; p.z -= nz * ov; q.x += nx * ov; q.z += nz * ov;
      }
    }
  }
  let mv = 0;
  ps.forEach((p) => {
    if (p.gone) { p.gt += dt; return; }
    p.x += p.vx * dt; p.z += p.vz * dt;
    const sp = Math.hypot(p.vx, p.vz);
    if (sp > 0.8) fell(p);
    if (sp > 0) { const dec = (p.fallen ? 3 : 4) * dt; if (dec >= sp) { p.vx = 0; p.vz = 0; } else { p.vx *= 1 - dec / sp; p.vz *= 1 - dec / sp; } }
    if (p.fallen && p.fall < 1) p.fall = Math.min(1, p.fall + dt / 0.3);
    if (Math.abs(p.x) > 0.62 || p.z > 19.75) { p.gone = true; p.gt = 0; }
    mv = Math.max(mv, sp);
  });
  if (!b.act && mv < 0.06) S.still += dt; else S.still = 0;
  if (S.still > 0.6 || S.t > 9) S.done = true;
}
export const downCount = (S) => S.pins.filter((p) => p.fallen || p.gone).length;

function calc(rolls) {
  const fr = []; let i = 0, cum = 0, ok = true;
  for (let f = 0; f < 10; f++) {
    const r = []; let sc = null;
    if (f < 9) {
      if (rolls[i] === 10) { r.push(10); if (rolls[i + 1] !== undefined && rolls[i + 2] !== undefined) sc = 10 + rolls[i + 1] + rolls[i + 2]; i += 1; }
      else {
        if (rolls[i] !== undefined) r.push(rolls[i]);
        if (rolls[i + 1] !== undefined) { r.push(rolls[i + 1]); const t = rolls[i] + rolls[i + 1]; if (t === 10) { if (rolls[i + 2] !== undefined) sc = 10 + rolls[i + 2]; } else sc = t; }
        i += 2;
      }
    } else {
      const a = rolls[i], b = rolls[i + 1], c = rolls[i + 2];
      if (a !== undefined) r.push(a); if (b !== undefined) r.push(b); if (c !== undefined) r.push(c);
      if (a !== undefined && b !== undefined) { if (a === 10 || a + b === 10) { if (c !== undefined) sc = a + b + c; } else sc = a + b; }
    }
    if (sc !== null && ok) { cum += sc; fr.push({ r: r, s: cum }); } else { ok = false; fr.push({ r: r, s: null }); }
  }
  return fr;
}
const dg = (v) => (v === 0 ? "-" : String(v));
function syms(f, r) {
  if (f < 9) {
    if (r[0] === 10) return ["", "X"];
    return [r[0] === undefined ? "" : dg(r[0]), r[1] === undefined ? "" : r[0] + r[1] === 10 ? "/" : dg(r[1])];
  }
  const a = r[0], b = r[1], c = r[2], o = [];
  o.push(a === undefined ? "" : a === 10 ? "X" : dg(a));
  o.push(b === undefined ? "" : b === 10 ? "X" : a !== 10 && a + b === 10 ? "/" : dg(b));
  o.push(c === undefined ? "" : c === 10 ? "X" : a === 10 && b !== 10 && b + c === 10 ? "/" : dg(c));
  return o;
}

export function bowlGame(o) {
  const el = o.el, W = 360, H = 520, HY = 125, F = 360, CH = 3.6;
  const level = Math.max(1, o.level || 1), th = THEMES[(level - 1) % 6];
  const bump = level === 1, period = Math.max(0.8, 1.5 - level * 0.1), driftMax = level >= 3 ? Math.min(0.45, 0.1 * (level - 2)) : 0;
  const aim = o.aim || { pos: 0, dir: 0, spin: 0 };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const root = el("div", "");
  const cvs = el("canvas", "");
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.cssText = "display:block;width:100%;max-width:360px;margin:0 auto 8px;touch-action:none;user-select:none;border-radius:12px";
  root.appendChild(cvs);
  const ctx = cvs.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sbox = el("div", "");
  sbox.style.cssText = "display:grid;grid-template-columns:repeat(9,1fr) 1.5fr;max-width:360px;margin:0 auto 8px;font-size:12px;text-align:center";
  root.appendChild(sbox);

  let rolls = [], t10 = [], frame = 0, ballNo = 0, standing = ALL.slice(), state = "aim", sim = null, msg = "", msgT = 0, timer = 0, ph = 0, pw = 0, camZ = -4.2, camX = 0, dead = false, raf, last, goneSince = 0, total = 0, fin = false, sweepPins = [];
  const rand = Math.random;

  const aimPinC = {};
  function aimPin(i) { return aimPinC[i + "_" + (standing.length)] || (aimPinC[i + "_" + standing.length] = { i: i, x: L[i].x0, z: L[i].z0, fall: 0, dir: 1, gone: false, gt: 0 }); }
  function drawSB() {
    sbox.textContent = "";
    const fr = calc(rolls);
    fr.forEach((f, i) => {
      const c = el("div", "");
      c.style.cssText = "border:1px solid #556;padding:2px 0;min-width:0" + (i === frame && state !== "over" ? ";background:rgba(240,194,75,.25)" : "");
      const top = el("div", "", syms(i, f.r).join(" ").trim() || " ");
      top.style.cssText = "font-weight:700;white-space:pre";
      const bot = el("div", "", f.s === null ? " " : String(f.s));
      c.appendChild(top); c.appendChild(bot);
      sbox.appendChild(c);
    });
    const done = fr.filter((f) => f.s !== null);
    total = done.length ? done[done.length - 1].s : 0;
  }
  drawSB();

  const pr = (x, y, z) => { const d = z - camZ; if (d < 0.25) return null; const s = F / d; return [W / 2 + (x * XS - camX) * s, HY + (CH - y * XS) * s, s]; };
  function poly(pts, col) {
    const q = pts.map((p) => pr(p[0], p[1], p[2]));
    if (q.some((v) => !v)) return;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]);
    ctx.closePath(); ctx.fill();
  }
  const PROF = [[0, 0.036], [0.02, 0.045], [0.1, 0.06], [0.15, 0.059], [0.2, 0.045], [0.25, 0.026], [0.28, 0.024], [0.31, 0.034], [0.345, 0.036], [0.375, 0.02], [0.38, 0]];
  function drawPin(p) {
    const b = pr(p.x, 0, p.z);
    if (!b) return;
    const u = XS * b[2];
    ctx.save();
    if (p.gone) { ctx.globalAlpha = Math.max(0, 1 - p.gt * 2.5); if (ctx.globalAlpha <= 0) { ctx.restore(); return; } }
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(b[0], b[1], 0.06 * u * 1.3, 0.02 * u * 1.3, 0, 0, 7); ctx.fill();
    ctx.translate(b[0], b[1]);
    if (p.fall > 0) ctx.rotate(p.dir * Math.min(1, p.fall) * 1.45);
    const g = ctx.createLinearGradient(-0.06 * u, 0, 0.06 * u, 0);
    g.addColorStop(0, "#c2bdb0"); g.addColorStop(0.4, "#fffdf6"); g.addColorStop(1, "#b2ad9f");
    ctx.fillStyle = g; ctx.beginPath();
    PROF.forEach((q, k) => { if (k) ctx.lineTo(-q[1] * u, -q[0] * u); else ctx.moveTo(-q[1] * u, -q[0] * u); });
    for (let k = PROF.length - 1; k >= 0; k--) ctx.lineTo(PROF[k][1] * u, -PROF[k][0] * u);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#d9342b"; ctx.fillRect(-0.027 * u, -0.265 * u, 0.054 * u, 0.017 * u); ctx.fillRect(-0.028 * u, -0.29 * u, 0.056 * u, 0.012 * u);
    ctx.restore();
  }
  function drawBall(bl, x, z, rot) {
    const b = pr(x, 0, z);
    if (!b) return;
    const R = BR * XS * b[2], cx = b[0], cy = b[1] - R;
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(b[0], b[1], R * 0.95, R * 0.3, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, "#fff"); g.addColorStop(0.18, th.ball); g.addColorStop(1, "#05060a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    const th2 = rot / BR;
    [[-0.28, 0.5], [0.0, 0.5], [0.0, 0.1]].forEach((h) => {
      const a = th2 + h[1], vis = Math.cos(a);
      if (vis < 0.2) return;
      ctx.fillStyle = "rgba(0,0,0,.75)"; ctx.beginPath(); ctx.ellipse(cx + h[0] * R * 1.6 * 0.5, cy - Math.sin(a) * R * 0.75, R * 0.1, R * 0.1 * vis, 0, 0, 7); ctx.fill();
    });
  }
  function predicted() {
    const sx = aim.pos / 100 * 0.45, tx = aim.dir / 100 * 0.55, vz = 9, vx = vz * (tx - sx) / 18.3, ax = aim.spin * 0.3;
    ctx.fillStyle = "rgba(255,255,255,.85)";
    for (let z = 1; z <= 18.3; z += 0.9) {
      const t = (z - 0.2) / vz, x = sx + vx * t + 0.5 * ax * Math.pow(Math.max(0, t - (7 - 0.2) / vz), 2), p = pr(x, 0.002, z);
      if (!p) continue;
      ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.2, p[2] * 0.045), 0, 7); ctx.fill();
    }
    const m = pr(tx, 0.002, 18.3);
    if (m) { ctx.strokeStyle = th.neon; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m[0], m[1], 4, 0, 7); ctx.stroke(); }
  }
  function render() {
    const sky = ctx.createLinearGradient(0, 0, 0, HY + 40);
    sky.addColorStop(0, th.bg[0]); sky.addColorStop(1, th.bg[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = th.fl; ctx.fillRect(0, HY, W, H - HY);
    // yan ışıklar
    for (let z = 1; z < 24; z += 2.5) {
      [-1, 1].forEach((sd) => {
        const a = pr(sd * 1.25, 0, z), b = pr(sd * 1.25, 0.8, z);
        if (!a || !b) return;
        ctx.strokeStyle = th.neon; ctx.globalAlpha = 0.75; ctx.lineWidth = Math.max(1, a[2] * 0.04);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.globalAlpha = 1;
      });
    }
    // arka duvar + çukur
    poly([[-1.25, 0, 19.8], [1.25, 0, 19.8], [1.25, 0, 22], [-1.25, 0, 22]], "#05050a");
    poly([[-1.25, 0, 22], [1.25, 0, 22], [1.25, 1.9, 22], [-1.25, 1.9, 22]], "#14141f");
    poly([[-1.25, 1.75, 22], [1.25, 1.75, 22], [1.25, 1.9, 22], [-1.25, 1.9, 22]], th.neon);
    // şerit
    const z0 = Math.max(camZ + 0.3, -5);
    for (let sg = Math.floor(z0); sg < 20; sg++) {
      const za = Math.max(sg, camZ + 0.3), zb = Math.min(sg + 1, 19.85);
      if (zb <= za) continue;
      const band = ((sg % 2) + 2) % 2, col = th.lane[band];
      if (za < 0) {
        const zz = Math.min(zb, 0);
        poly([[-0.62, 0, za], [0.62, 0, za], [0.62, 0, zz], [-0.62, 0, zz]], band ? "#b98a52" : "#c4945a");
      }
      if (zb > 0) {
        const a2 = Math.max(za, 0);
        poly([[-LW, 0, a2], [LW, 0, a2], [LW, 0, zb], [-LW, 0, zb]], col);
        poly([[-LW - 0.09, 0, a2], [-LW, 0, a2], [-LW, 0, zb], [-LW - 0.09, 0, zb]], "#161824");
        poly([[LW, 0, a2], [LW + 0.09, 0, a2], [LW + 0.09, 0, zb], [LW, 0, zb]], "#161824");
        for (let k = -2; k <= 2; k++) poly([[k * 0.2 - 0.004, 0, a2], [k * 0.2 + 0.004, 0, a2], [k * 0.2 + 0.004, 0, zb], [k * 0.2 - 0.004, 0, zb]], "rgba(90,50,10,.28)");
        if (bump) {
          poly([[-LW, 0, a2], [-LW, 0.1, a2], [-LW, 0.1, zb], [-LW, 0, zb]], "#e5484d");
          poly([[LW, 0, a2], [LW, 0.1, a2], [LW, 0.1, zb], [LW, 0, zb]], "#e5484d");
        }
      }
    }
    if (camZ < 0) poly([[-0.62, 0, -0.03], [0.62, 0, -0.03], [0.62, 0, 0.03], [-0.62, 0, 0.03]], "#d9342b");
    for (let k = -3; k <= 3; k++) poly([[k * 0.075 - 0.03, 0.001, 4.4], [k * 0.075 + 0.03, 0.001, 4.4], [k * 0.075, 0.001, 4.9]], "rgba(60,30,5,.6)");
    // lobut + top (uzaktan yakına)
    const items = [];
    const ps = sim ? sim.pins : state === "aim" ? standing.map((i) => aimPin(i)) : sweepPins;
    ps.forEach((p) => { if (!(p.gone && p.gt > 0.4)) items.push({ z: p.z, f: () => drawPin(p) }); });
    if (state === "aim") {
      const sx = aim.pos / 100 * 0.45;
      predicted();
      items.push({ z: 0.2, f: () => drawBall(null, sx, 0.2, 0) });
    } else if (sim && sim.ball.z < 19.9 && state !== "sweep") {
      const b = sim.ball;
      items.push({ z: b.z, f: () => drawBall(b, b.x, b.z, b.rot) });
    }
    items.sort((a, b) => b.z - a.z);
    items.forEach((it) => it.f());
    // HUD
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(8, 8, 104, 40);
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Frame " + Math.min(10, frame + 1) + "/10", 16, 26); ctx.font = "12px sans-serif"; ctx.fillText("Atış " + (ballNo + 1) + " • " + th.n.split(" ")[0], 16, 42);
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(W - 88, 8, 80, 40);
    ctx.fillStyle = "#ffd23a"; ctx.font = "bold 24px sans-serif"; ctx.textAlign = "center"; ctx.fillText(String(total), W - 48, 38);
    if (state === "aim") {
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(20, 488, 320, 18);
      ctx.fillStyle = "rgba(60,200,100,.55)"; ctx.fillRect(20 + 320 * 0.55, 488, 320 * 0.3, 18);
      ctx.fillStyle = "#fff"; ctx.fillRect(20 + 320 * pw - 2, 484, 4, 26);
      ctx.font = "bold 11px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.fillText("GÜÇ", 24, 501);
    }
    if (msgT > 0) {
      ctx.globalAlpha = Math.min(1, msgT * 1.5); ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.lineWidth = 5; ctx.font = "bold 36px sans-serif"; ctx.textAlign = "center";
      ctx.strokeText(msg, W / 2, 110); ctx.fillText(msg, W / 2, 110); ctx.globalAlpha = 1;
    }
    if (state === "over") {
      ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.fillRect(0, 170, W, 150);
      ctx.fillStyle = "#ffd23a"; ctx.textAlign = "center"; ctx.font = "bold 30px sans-serif"; ctx.fillText("Oyun bitti: " + total + " puan", W / 2, 220);
      ctx.fillStyle = "#fff"; ctx.font = "16px sans-serif";
      ctx.fillText(total >= 200 ? "Efsane! 🏆" : total >= 150 ? "Harika oyun!" : total >= 100 ? "İyi oyun!" : "Bir daha dene!", W / 2, 252);
      ctx.fillText(o.need && total >= o.need ? "Sonraki salon açıldı!" : "Sonraki salon için " + (o.need || 100) + " puan gerek", W / 2, 282);
    }
  }
  function afterRoll(k, remain) {
    rolls.push(k);
    let full = false;
    if (frame < 9) {
      if (ballNo === 0) { if (k === 10) { frame++; full = true; } else ballNo = 1; }
      else { frame++; ballNo = 0; full = true; }
    } else {
      t10.push(k);
      const n = t10.length;
      if (n === 1) { if (k === 10) full = true; ballNo = 1; }
      else if (n === 2) { const a = t10[0]; if (a === 10) { if (k === 10) full = true; ballNo = 2; } else if (a + k === 10) { full = true; ballNo = 2; } else fin = true; }
      else fin = true;
    }
    standing = full ? ALL.slice() : remain;
    drawSB();
  }
  function endRoll() {
    const S = sim, k = downCount(S), remain = S.pins.filter((p) => !(p.fallen || p.gone)).map((p) => p.i);
    const first = (frame < 9 && ballNo === 0) || (frame === 9 && (t10.length === 0 || (t10.length === 1 && t10[0] === 10 && false)));
    const wasFull = S.pins.length === 10;
    msg = k === 10 ? (wasFull ? "STRIKE! 🎳" : "SPARE! ✨") : k === 0 ? (S.ball.gut ? "Oluk! 😬" : "Iska!") : k + " lobut";
    msgT = 1.8;
    afterRoll(k, remain);
    sweepPins = S.pins.filter((p) => !(p.fallen || p.gone));
    sim = null; state = fin ? "overwait" : "sweep"; timer = 1.7;
  }
  function update(dt) {
    if (msgT > 0) msgT -= dt;
    const tz = state === "roll" || state === "settle" ? Math.min(12.5, -4.2 + Math.max(0, sim.ball.z - 1) / 9 * 16.7) : -4.2, tx = state === "roll" && sim ? sim.ball.x * XS * 0.4 : 0;
    camZ += (tz - camZ) * Math.min(1, dt * 6); camX += (tx - camX) * Math.min(1, dt * 5);
    if (state === "aim") { ph = (ph + dt / period) % 1; pw = ph < 0.5 ? ph * 2 : 2 - ph * 2; }
    else if (state === "roll") {
      let left = dt; const h = 1 / 240;
      while (left > 0) { const d = Math.min(h, left); step(sim, d); left -= d; }
      if (sim.done) endRoll();
    } else if (state === "sweep" || state === "overwait") {
      timer -= dt;
      if (timer <= 0) {
        if (state === "overwait") { state = "over"; finish(); }
        else { sweepPins = []; state = "aim"; drawSB(); }
      }
    }
  }
  function finish() {
    drawSB();
    if (o.onEnd) o.onEnd({ score: total });
  }
  function throwBall() {
    if (state !== "aim") return;
    const vz = 6.5 + pw * 5.5, sx = aim.pos / 100 * 0.45, tx = aim.dir / 100 * 0.55;
    const drift = driftMax ? (rand() * 2 - 1) * driftMax : 0;
    sim = mkSim(standing, { x: sx, vx: vz * (tx - sx) / 18.3, vz: vz, ax: aim.spin * 0.3 + drift, bump: bump });
    sweepPins = [];
    state = "roll";
  }
  function destroy() { if (dead) return; dead = true; cancelAnimationFrame(raf); }
  function loop(t) {
    if (dead) return;
    if (!root.isConnected) {
      if (!goneSince) goneSince = t; else if (t - goneSince > 3000) { destroy(); return; }
      last = t; raf = requestAnimationFrame(loop); return;
    }
    goneSince = 0;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t; update(dt); render();
    raf = requestAnimationFrame(loop);
  }
  last = performance.now(); raf = requestAnimationFrame(loop);
  return { root: root, destroy: destroy, throw: throwBall, get state() { return state; }, get dead() { return dead; }, theme: th.n, bump: bump, drift: driftMax, dbg: { get sim() { return sim; } } };
}

function bowl(body, el, act) {
  let inst = null, level = 1, unlocked = Math.max(1, best("nb_bowl3"));
  const aim = { pos: 0, dir: 0, spin: 0 };
  const info = el("p", ""); info.style.cssText = "margin:0 0 4px;font-size:15px"; body.appendChild(info);
  const sub = el("p", ""); sub.style.cssText = "margin:0 0 8px;font-size:13px;color:var(--mute)"; body.appendChild(sub);
  const box = el("div", ""); body.appendChild(box);
  function slider(label, key) {
    const w = el("div", ""); w.style.cssText = "max-width:360px;margin:0 auto 4px";
    const l = el("div", "", label); l.style.cssText = "font-size:13px;color:var(--mute)";
    const r = el("input", ""); r.type = "range"; r.min = "-100"; r.max = "100"; r.value = "0"; r.style.cssText = "width:100%;margin:2px 0 6px";
    r.oninput = () => { aim[key] = Number(r.value); };
    w.appendChild(l); w.appendChild(r); body.appendChild(w);
    return r;
  }
  const sPos = slider("Atış yeri (◀ sol • sağ ▶)", "pos"), sDir = slider("Yön (nereye nişan alıyorsun)", "dir");
  const spinRow = el("div", ""); spinRow.style.cssText = "display:flex;gap:6px;max-width:360px;margin:0 auto 8px";
  body.appendChild(spinRow);
  const sbs = [];
  [["↶ Sola kıvır", -1], ["⬆ Düz", 0], ["Sağa kıvır ↷", 1]].forEach((s) => {
    const b = el("button", "", s[0]); b.type = "button";
    b.style.cssText = "flex:1;padding:10px 2px;font-weight:700;font-size:13px;min-width:0";
    b.onclick = () => { aim.spin = s[1]; sbs.forEach((x, i) => x.style.setProperty("border", i === s[1] + 1 ? "2px solid #f0c24b" : "1px solid #2a3d57", "important")); };
    sbs.push(b); spinRow.appendChild(b);
  });
  sbs[1].style.setProperty("border", "2px solid #f0c24b", "important");
  const go = el("button", "", "🎳 AT! (güç çubuğu yeşilken bas)");
  go.type = "button"; go.style.cssText = "display:block;width:100%;max-width:360px;margin:0 auto 8px;padding:16px;font-weight:800;font-size:17px;background:var(--lamp)!important;color:var(--lamp-ink)!important;border:0!important";
  go.onclick = () => { if (inst) inst.throw(); };
  body.appendChild(go);
  const row = el("div", ""); row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap"; body.appendChild(row);
  const bB = (n) => best("nb_bowl3_b" + n), need = (n) => Math.max(75, 100 - 5 * (n - 1));
  function head() {
    const b = bB(level);
    info.textContent = "Salon " + level + " • " + inst.theme + (inst.bump ? " (kenar korumalı)" : inst.drift ? " (yağlı pist: top sapabilir)" : "");
    sub.textContent = "Açık salon: " + unlocked + "   En iyi skor: " + (b || "-") + "   Hedef: " + need(level);
    nextB.style.display = unlocked > level ? "" : "none";
  }
  function load(n) {
    if (inst) inst.destroy();
    box.textContent = "";
    level = Math.max(1, Math.min(n, unlocked));
    inst = bowlGame({
      el: el, level: level, aim: aim, need: need(level),
      onEnd: (r) => {
        if (r.score > bB(level)) put("nb_bowl3_b" + level, r.score);
        if (r.score >= need(level) && level + 1 > unlocked && level < 6) { unlocked = level + 1; put("nb_bowl3", unlocked); }
        head();
      }
    });
    box.appendChild(inst.root);
    head();
  }
  const bPrev = act("◀", () => load(level - 1)), bNext = act("▶", () => load(level + 1)), retry = act("Yeniden başla", () => load(level)), nextB = act("Sonraki salon ▶", () => load(level + 1));
  [bPrev, bNext, retry, nextB].forEach((b) => { b.style.minWidth = "0"; row.appendChild(b); });
  const hint = el("p", "", "Önce 'Atış yeri' ile topun duracağı yeri, 'Yön' ile nereye nişan alacağını ayarla (beyaz noktalar topun yaklaşık yolunu gösterir). İstersen sola/sağa kıvır seç. Sonra güç çubuğunun yeşil bölgesinde AT'a bas. Tüm lobutları ilk atışta devirirsen STRIKE, ikinci atışta SPARE. Strike sonraki 2 atışın, spare sonraki 1 atışın puanını ekler. 10 frame oynanır, 300 en yüksek puandır.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px"; body.appendChild(hint);
  load(1);
  return () => { if (inst) inst.destroy(); };
}

export const SOLO = { bowl3d: { group: "Aksiyon", icon: "🎳", label: "Bowling 3D", start: bowl } };
