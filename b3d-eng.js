// Zıpla Top 3D: oyun motoru (fizik, kontrol, panel)
import { gen } from "./b3d-lvl.js?v=1";
import { draw } from "./b3d-draw.js?v=1";
const W = 360, H = 520, R = 0.5, G = 26, VY = 9.94, PADV = 19;
export function game(o) {
  const g = gen(o.level), root = document.createElement("div");
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  cv.style.cssText = "width:100%;max-width:360px;display:block;margin:0 auto 8px;border-radius:12px;touch-action:none;background:#000";
  root.appendChild(cv);
  const c = cv.getContext("2d");
  let S, raf = 0, last = 0, dir = 0, keys = {}, px = null, dead = false;
  function reset() {
    S = { g: g, t: 0, ball: { x: 0, y: 0, z: 0, vy: VY }, lives: 3, coins: 0, cp: 0, inv: 0, st: "ready", msg: "Dokun ve başla" };
  }
  function respawn() {
    const b = S.ball; b.x = 0; b.y = 0; b.vy = VY; b.z = S.cp; S.inv = 1.6;
  }
  function hurt() {
    if (S.inv > 0 || S.st !== "play") return;
    S.lives--;
    if (S.lives <= 0) { S.st = "lose"; S.msg = "Olmadı! Dokun, tekrar dene"; return; }
    respawn();
  }
  function step(dt) {
    S.t += dt;
    if (S.st !== "play") return;
    const b = S.ball;
    S.inv = Math.max(0, S.inv - dt);
    const d = (dir || (keys.ArrowLeft ? -1 : 0) + (keys.ArrowRight ? 1 : 0));
    b.x = Math.max(-g.hw + R, Math.min(g.hw - R, b.x + d * 5.5 * dt));
    b.z += g.v * dt;
    b.vy -= G * dt; b.y += b.vy * dt;
    const gap = g.gaps.some((a) => b.z > a[0] && b.z < a[1]);
    if (b.y <= 0 && !gap && b.vy < 0) {
      b.y = 0;
      b.vy = g.pads.some((p) => b.z > p.z && b.z < p.z + p.len) ? PADV : VY;
    }
    if (b.y < -7) { if (S.inv > 0) respawn(); else hurt(); }
    g.cps.forEach((z, i) => { if (b.z > z && S.cp < z) S.cp = z; });
    g.coins.forEach((k) => {
      if (!k.got && Math.abs(k.z - b.z) < 0.9 && Math.abs(k.x - b.x) < 0.9 && Math.abs(k.y - (b.y + R)) < 0.9) { k.got = true; S.coins++; }
    });
    g.objs.forEach((ob) => {
      const x = ob.k === "mover" ? ob.amp * Math.sin(S.t * ob.sp + ob.ph) : ob.x;
      const hh = ob.k === "spike" ? 0.9 : ob.h + 0.3;
      if (Math.abs(x - b.x) < ob.w + R * 0.7 && Math.abs(ob.z - b.z) < 0.7 + R * 0.7 && b.y < hh - 0.2) hurt();
    });
    if (b.z >= g.L) {
      S.st = "win"; S.msg = "Bölüm bitti! " + "★".repeat(S.lives) + "☆".repeat(3 - S.lives);
      if (o.onFinish) o.onFinish({ stars: S.lives, coins: S.coins });
    }
  }
  function hud() {
    c.font = "bold 20px sans-serif"; c.textBaseline = "top";
    c.fillStyle = "#fff"; c.strokeStyle = "#000"; c.lineWidth = 3;
    const t2 = "● " + S.coins;
    for (let i = 0; i < 3; i++) { c.fillStyle = i < S.lives ? "#ff4d6a" : "#444"; c.strokeText("♥", 10 + i * 24, 6); c.fillText("♥", 10 + i * 24, 6); }
    c.fillStyle = "#ffd23a";
    c.textAlign = "right"; c.strokeText(t2, W - 10, 8); c.fillText(t2, W - 10, 8); c.textAlign = "left";
    c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(10, 38, W - 20, 6);
    c.fillStyle = "#ffd23a"; c.fillRect(10, 38, (W - 20) * Math.min(1, S.ball.z / g.L), 6);
    if (S.st !== "play") {
      c.textAlign = "center"; c.font = "bold 26px sans-serif";
      c.strokeText(S.msg, W / 2, 250); c.fillStyle = "#fff"; c.fillText(S.msg, W / 2, 250); c.textAlign = "left";
    }
  }
  function loop(ts) {
    if (dead) return;
    const dt = Math.min(0.033, (ts - (last || ts)) / 1000); last = ts;
    step(dt); draw(c, S); hud();
    raf = requestAnimationFrame(loop);
  }
  cv.onpointerdown = (e) => {
    if (S.st === "ready") { S.st = "play"; }
    else if (S.st === "lose") { reset(); g.coins.forEach((k) => { k.got = false; }); S.st = "play"; }
    px = e.clientX; try { cv.setPointerCapture(e.pointerId); } catch (x) {}
  };
  cv.onpointermove = (e) => {
    if (px === null || S.st !== "play") return;
    const k = (e.clientX - px) * (W / cv.getBoundingClientRect().width) * 0.025; px = e.clientX;
    S.ball.x = Math.max(-g.hw + R, Math.min(g.hw - R, S.ball.x + k));
  };
  cv.onpointerup = cv.onpointercancel = () => { px = null; };
  const kd = (e) => { keys[e.key] = true; }, ku = (e) => { keys[e.key] = false; };
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
  reset(); raf = requestAnimationFrame(loop);
  return {
    root: root, theme: g.th.n, S: () => S,
    setDir: (v) => { dir = v; },
    start: () => { if (S.st === "ready") S.st = "play"; },
    destroy: () => { dead = true; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); }
  };
}
