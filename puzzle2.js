// Zeka oyunları 2: Hanoi Kuleleri, Renk Dizisi (Simon), Sayı Tahmin (Mastermind), Tetris
const rand = (n) => Math.floor(Math.random() * n);
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function save(k, v, lowerBetter) {
  const o = best(k);
  if (!o || (lowerBetter ? v < o : v > o)) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; }
  return o;
}
function line(body, el, txt) {
  const p = el("p", "", txt || "");
  p.style.cssText = "margin:0 0 10px;font-size:15px";
  body.appendChild(p);
  return p;
}
function rowOf(body, el) {
  const r = el("div", "");
  r.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:8px";
  body.appendChild(r);
  return r;
}

/* ---------- Hanoi Kuleleri ---------- */
function hanoi(body, el, act) {
  const info = line(body, el);
  const pegs = el("div", "");
  pegs.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px";
  body.appendChild(pegs);
  const row = rowOf(body, el);
  let n = 4, p, sel, moves;
  const COL = ["#e5484d", "#d9822b", "#f0c24b", "#3fb06a", "#4a8fd9", "#7a5bd9"];
  function draw() {
    pegs.textContent = "";
    p.forEach((st, i) => {
      const b = el("button", "", "");
      b.type = "button";
      b.style.cssText = "height:" + (n * 26 + 30) + "px;display:flex;flex-direction:column-reverse;align-items:center;gap:2px;padding:6px 2px;border:2px solid " + (sel === i ? "var(--lamp)" : "var(--line)");
      st.forEach((d) => {
        const x = el("div", "");
        x.style.cssText = "height:22px;border-radius:6px;background:" + COL[d - 1] + ";width:" + (24 + d * 12) + "%";
        b.appendChild(x);
      });
      b.onclick = () => click(i);
      pegs.appendChild(b);
    });
    const win = p[0].length === 0 && (p[1].length === n || p[2].length === n);
    info.textContent = (win ? "Bitti! 🎉 " : "Diski taşı: önce kuleye, sonra hedefe dokun. ") + "Hamle: " + moves + " (en az " + (Math.pow(2, n) - 1) + ")";
    if (win) save("nb_hanoi" + n, moves, true);
  }
  function click(i) {
    if (p[0].length === 0 && (p[1].length === n || p[2].length === n)) return;
    if (sel < 0) { if (p[i].length) sel = i; }
    else {
      if (sel !== i) {
        const d = p[sel][p[sel].length - 1], top = p[i][p[i].length - 1];
        if (!top || d < top) { p[i].push(p[sel].pop()); moves++; }
      }
      sel = -1;
    }
    draw();
  }
  function start() {
    p = [[], [], []];
    for (let d = n; d >= 1; d--) p[0].push(d);
    sel = -1; moves = 0; draw();
  }
  [3, 4, 5, 6].forEach((k) => row.appendChild(act(k + " disk", () => { n = k; start(); })));
  start();
}

/* ---------- Renk Dizisi (Simon) ---------- */
function simon(body, el, act) {
  const info = line(body, el);
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:300px;margin:0 auto 10px";
  body.appendChild(gr);
  const row = rowOf(body, el);
  const COL = ["#3fb06a", "#e5484d", "#f0c24b", "#4a8fd9"], FR = [330, 262, 392, 196];
  let seq, step, input, timers = [], pads = [], ac = null;
  function beep(i) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = FR[i]; g.gain.value = 0.08;
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.25);
    } catch (e) {}
  }
  function lit(i, on) { pads[i].style.opacity = on ? "1" : "0.45"; pads[i].style.transform = on ? "scale(1.04)" : ""; if (on) beep(i); }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function play() {
    input = false; step = 0;
    info.textContent = "Dizi: " + seq.length + ". Izle…";
    seq.forEach((c, k) => { later(() => lit(c, true), 700 + k * 650); later(() => lit(c, false), 700 + k * 650 + 400); });
    later(() => { input = true; info.textContent = "Sıra sende. Diziyi tekrarla (" + seq.length + ")."; }, 700 + seq.length * 650);
  }
  function tap(i) {
    if (!input) return;
    lit(i, true); later(() => lit(i, false), 200);
    if (i !== seq[step]) {
      input = false;
      const b = save("nb_simon", seq.length - 1);
      info.textContent = "Yanlış! Ulaştığın tur: " + (seq.length - 1) + "   En iyi: " + b;
      return;
    }
    step++;
    if (step === seq.length) { input = false; seq.push(rand(4)); later(play, 800); }
  }
  for (let i = 0; i < 4; i++) {
    const b = el("button", "", "");
    b.type = "button";
    b.style.cssText = "height:110px;border:0!important;border-radius:16px!important;opacity:.45;transition:opacity .1s;background:" + COL[i] + "!important";
    b.onclick = () => tap(i);
    pads.push(b); gr.appendChild(b);
  }
  function start() { timers.forEach(clearTimeout); timers = []; seq = [rand(4)]; play(); }
  row.appendChild(act("Başla / Yeniden", start));
  info.textContent = "Renklerin sırasını hatırla ve tekrarla. Başlamak için düğmeye bas.";
  return () => { timers.forEach(clearTimeout); try { if (ac) ac.close(); } catch (e) {} };
}

/* ---------- Sayı Tahmin (Mastermind) ---------- */
function guess(body, el, act) {
  const info = line(body, el);
  const hist = el("div", "");
  hist.style.cssText = "margin-bottom:8px;font-size:18px;font-family:monospace";
  body.appendChild(hist);
  const cur = el("div", "");
  cur.style.cssText = "font-size:30px;font-weight:700;letter-spacing:8px;text-align:center;min-height:42px;color:var(--lamp)";
  body.appendChild(cur);
  const pad = el("div", "");
  pad.style.cssText = "display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:8px 0";
  body.appendChild(pad);
  const row = rowOf(body, el);
  let secret, tries, g, over;
  function newSecret() { const d = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5); return d.slice(0, 4).join(""); }
  function draw() {
    hist.textContent = "";
    tries.forEach((t, i) => { hist.appendChild(el("div", "", (i + 1 < 10 ? " " : "") + (i + 1) + ".  " + t.g + "   ✅" + t.a + " 🔄" + t.b)); });
    cur.textContent = g + "_".repeat(4 - g.length);
    if (!over) info.textContent = "4 farklı rakamı bul. ✅ doğru yer, 🔄 yanlış yer. Kalan hak: " + (10 - tries.length);
  }
  function submit() {
    if (over || g.length !== 4) return;
    let a = 0, b = 0;
    for (let i = 0; i < 4; i++) { if (g[i] === secret[i]) a++; else if (secret.indexOf(g[i]) >= 0) b++; }
    tries.push({ g: g, a: a, b: b }); g = "";
    if (a === 4) { over = true; info.textContent = "Buldun! 🎉 " + tries.length + " denemede. En iyi: " + save("nb_guess", tries.length, true); }
    else if (tries.length >= 10) { over = true; info.textContent = "Hakların bitti. Sayı: " + secret; }
    draw();
  }
  for (let n = 0; n <= 9; n++) {
    const b = el("button", "", String(n));
    b.type = "button"; b.style.cssText = "padding:12px 0;font-size:18px;font-weight:700";
    b.onclick = () => { if (!over && g.length < 4 && g.indexOf(String(n)) < 0) { g += n; draw(); } };
    pad.appendChild(b);
  }
  row.appendChild(act("⌫ Sil", () => { g = g.slice(0, -1); draw(); }));
  row.appendChild(act("Gir", submit, "background:var(--lamp)!important;color:var(--lamp-ink)!important;border:0!important"));
  row.appendChild(act("Yeni oyun", () => { secret = newSecret(); tries = []; g = ""; over = false; draw(); }));
  secret = newSecret(); tries = []; g = ""; over = false; draw();
}

/* ---------- Tetris ---------- */
function tetris(body, el, act) {
  const info = line(body, el);
  const W = 10, H = 20, S = 20;
  const cv = el("canvas", "", "");
  cv.width = W * S; cv.height = H * S;
  cv.style.cssText = "display:block;width:100%;max-width:200px;margin:0 auto 10px;border:1px solid var(--line);border-radius:6px;background:#0b1422";
  body.appendChild(cv);
  const cx = cv.getContext("2d");
  const pad = el("div", "");
  pad.style.cssText = "display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:8px";
  body.appendChild(pad);
  const row = rowOf(body, el);
  const SH = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]]];
  const COL = ["#4ad1d9", "#f0c24b", "#9b5bd9", "#4a8fd9", "#d9822b", "#3fb06a", "#e5484d"];
  let bd, pc, px, py, score, lines, over, timer;
  const rot = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse());
  const fits = (m, x, y) => m.every((r, j) => r.every((v, i) => !v || (x + i >= 0 && x + i < W && y + j < H && (y + j < 0 || !bd[y + j][x + i]))));
  function spawn() {
    const k = rand(7);
    pc = { m: SH[k], c: k + 1 };
    px = Math.floor((W - pc.m[0].length) / 2); py = 0;
    if (!fits(pc.m, px, py)) { over = true; save("nb_tetris", score); clearInterval(timer); }
  }
  function lock() {
    pc.m.forEach((r, j) => r.forEach((v, i) => { if (v && py + j >= 0) bd[py + j][px + i] = pc.c; }));
    let n = 0;
    bd = bd.filter((r) => { if (r.every((v) => v)) { n++; return false; } return true; });
    while (bd.length < H) bd.unshift(new Array(W).fill(0));
    if (n) { score += [0, 100, 300, 500, 800][n] * (1 + Math.floor(lines / 10)); lines += n; setSpeed(); }
    spawn();
  }
  function down() { if (over) return; if (fits(pc.m, px, py + 1)) py++; else lock(); draw(); }
  function hard() { if (over) return; while (fits(pc.m, px, py + 1)) py++; lock(); draw(); }
  function mv(d) { if (!over && fits(pc.m, px + d, py)) { px += d; draw(); } }
  function turn() {
    if (over) return;
    const m = rot(pc.m);
    for (const k of [0, -1, 1, -2, 2]) if (fits(m, px + k, py)) { pc.m = m; px += k; draw(); return; }
  }
  function setSpeed() { clearInterval(timer); timer = setInterval(down, Math.max(120, 700 - Math.floor(lines / 10) * 70)); }
  function draw() {
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, W * S, H * S);
    const cell = (x, y, c) => { cx.fillStyle = COL[c - 1]; cx.fillRect(x * S + 1, y * S + 1, S - 2, S - 2); };
    bd.forEach((r, y) => r.forEach((v, x) => { if (v) cell(x, y, v); }));
    if (!over) pc.m.forEach((r, j) => r.forEach((v, i) => { if (v) cell(px + i, py + j, pc.c); }));
    info.textContent = (over ? "Bitti! " : "") + "Skor: " + score + "   Satır: " + lines + "   En iyi: " + best("nb_tetris");
  }
  function start() {
    bd = []; for (let y = 0; y < H; y++) bd.push(new Array(W).fill(0));
    score = 0; lines = 0; over = false; spawn(); setSpeed(); draw();
  }
  [["◀", () => mv(-1)], ["⟳", turn], ["▶", () => mv(1)], ["⬇", down], ["⤓", hard]].forEach((x) => {
    const b = el("button", "", x[0]);
    b.type = "button"; b.style.cssText = "padding:14px 0;font-size:20px";
    b.onclick = x[1];
    pad.appendChild(b);
  });
  const key = (e) => {
    const m = { ArrowLeft: () => mv(-1), ArrowRight: () => mv(1), ArrowUp: turn, ArrowDown: down, " ": hard };
    if (m[e.key]) { e.preventDefault(); m[e.key](); }
  };
  document.addEventListener("keydown", key);
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => { clearInterval(timer); document.removeEventListener("keydown", key); };
}

export const SOLO = {
  hanoi: { group: "Zeka", icon: "🗼", label: "Hanoi Kuleleri", start: hanoi },
  simon: { group: "Zeka", icon: "🎨", label: "Renk Dizisi", start: simon },
  guess: { group: "Zeka", icon: "🎯", label: "Sayı Tahmin", start: guess },
  tetris: { group: "Aksiyon", icon: "⬛", label: "Tetris", start: tetris }
};
