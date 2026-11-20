// Zeka oyunları 1: Mayın Tarlası, Sudoku, Kaydırmalı Bulmaca
const rand = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
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
function gridOf(body, el, cols, gap) {
  const g = el("div", "");
  g.style.cssText = "display:grid;grid-template-columns:repeat(" + cols + ",1fr);gap:" + gap + "px;margin-bottom:10px";
  body.appendChild(g);
  return g;
}
function rowOf(body, el) {
  const r = el("div", "");
  r.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  body.appendChild(r);
  return r;
}

/* ---------- Mayın Tarlası (9x9, 10 mayın) ---------- */
function mines(body, el, act) {
  const N = 9, M = 10;
  const info = line(body, el);
  const gr = gridOf(body, el, N, 3);
  const row = rowOf(body, el);
  let mine, rev, flg, adj, mode, state, t0, tm;
  const NB = (i) => {
    const r = Math.floor(i / N), c = i % N, out = [];
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      if (!a && !b) continue;
      const rr = r + a, cc = c + b;
      if (rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(rr * N + cc);
    }
    return out;
  };
  function plant(safe) {
    const bad = new Set([safe].concat(NB(safe)));
    const pool = shuffle([...Array(N * N).keys()].filter((i) => !bad.has(i)));
    mine = new Array(N * N).fill(false);
    pool.slice(0, M).forEach((i) => { mine[i] = true; });
    adj = mine.map((_, i) => NB(i).filter((j) => mine[j]).length);
  }
  function open(i) {
    const st = [i];
    while (st.length) {
      const k = st.pop();
      if (rev[k] || flg[k]) continue;
      rev[k] = true;
      if (!adj[k]) NB(k).forEach((j) => { if (!rev[j]) st.push(j); });
    }
  }
  function tap(i) {
    if (state === "won" || state === "lost") return;
    if (mode === "flag") { if (!rev[i]) flg[i] = !flg[i]; draw(); return; }
    if (flg[i] || rev[i]) return;
    if (!mine) { plant(i); state = "play"; t0 = Date.now(); }
    if (mine[i]) { state = "lost"; mine.forEach((m, k) => { if (m) rev[k] = true; }); draw(); return; }
    open(i);
    if (rev.filter(Boolean).length === N * N - M) { state = "won"; save("nb_mine", Math.floor((Date.now() - t0) / 1000), true); }
    draw();
  }
  const COLS = ["", "#4a8fd9", "#3fb06a", "#e5484d", "#7a5bd9", "#d9822b", "#2aa5a5", "#e3e9f0", "#8da0b6"];
  function draw() {
    gr.textContent = "";
    for (let i = 0; i < N * N; i++) {
      const b = el("button", "", "");
      b.type = "button";
      let bg = "", tx = "", col = "";
      if (rev[i]) { bg = mine && mine[i] ? "#e5484d" : "#0f1a2a"; tx = mine && mine[i] ? "💣" : (adj[i] || ""); col = COLS[adj[i]] || ""; }
      else if (flg[i]) tx = "🚩";
      b.textContent = tx;
      b.style.cssText = "aspect-ratio:1;padding:0;font-size:17px;font-weight:700;" + (rev[i] ? "background:" + bg + "!important;color:" + col : "");
      b.onclick = () => tap(i);
      gr.appendChild(b);
    }
    const left = M - flg.filter(Boolean).length;
    const b = best("nb_mine");
    info.textContent = state === "won" ? "Kazandın! 🎉 En iyi süre: " + b + " sn" : state === "lost" ? "Mayına bastın 💥" : "Kalan mayın: " + left + (b ? "   En iyi: " + b + " sn" : "");
    modeBtn.textContent = mode === "flag" ? "Mod: 🚩 Bayrak" : "Mod: ⛏️ Aç";
  }
  function start() { mine = null; adj = null; rev = new Array(N * N).fill(false); flg = new Array(N * N).fill(false); mode = "open"; state = "ready"; draw(); }
  const modeBtn = act("", () => { mode = mode === "flag" ? "open" : "flag"; draw(); });
  row.appendChild(modeBtn);
  row.appendChild(act("Yeniden başla", start));
  start();
}

/* ---------- Sudoku ---------- */
function sudoku(body, el, act) {
  const info = line(body, el);
  const gr = gridOf(body, el, 9, 0);
  gr.style.cssText += ";border:2px solid var(--lamp);border-radius:6px;overflow:hidden;gap:0";
  const pad = gridOf(body, el, 5, 6);
  const row = rowOf(body, el);
  let sol, cur, fixed, sel, level = 38;
  function make() {
    const base = (r, c) => (r * 3 + Math.floor(r / 3) + c) % 9;
    const g = shuffle([0, 1, 2]), rr = [], cc = [];
    g.forEach((a) => shuffle([0, 1, 2]).forEach((b) => rr.push(a * 3 + b)));
    shuffle([0, 1, 2]).forEach((a) => shuffle([0, 1, 2]).forEach((b) => cc.push(a * 3 + b)));
    const dig = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    sol = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) sol.push(dig[base(rr[r], cc[c])]);
    cur = sol.slice();
    shuffle([...Array(81).keys()]).slice(0, 81 - level).forEach((i) => { cur[i] = 0; });
    fixed = cur.map((v) => v !== 0);
    sel = -1;
    draw();
  }
  function done() { return cur.every((v, i) => v === sol[i]); }
  function draw() {
    gr.textContent = "";
    for (let i = 0; i < 81; i++) {
      const r = Math.floor(i / 9), c = i % 9;
      const b = el("button", "", cur[i] ? String(cur[i]) : "");
      b.type = "button";
      const bad = cur[i] && cur[i] !== sol[i];
      b.style.cssText = "aspect-ratio:1;padding:0;font-size:18px;border-radius:0!important;border:1px solid var(--line);" +
        (c % 3 === 2 && c < 8 ? "border-right:2px solid var(--lamp);" : "") + (r % 3 === 2 && r < 8 ? "border-bottom:2px solid var(--lamp);" : "") +
        "font-weight:" + (fixed[i] ? "800" : "500") + ";color:" + (bad ? "#e5484d" : fixed[i] ? "var(--text)" : "var(--lamp)") +
        ";background:" + (i === sel ? "rgba(240,194,75,.35)" : "transparent");
      b.onclick = () => { if (!fixed[i]) { sel = i; draw(); } };
      gr.appendChild(b);
    }
    info.textContent = done() ? "Tamamladın! 🎉" : "Bir kutuya dokun, sonra rakam seç. Kırmızı: yanlış.";
  }
  for (let n = 1; n <= 9; n++) {
    const b = el("button", "", String(n));
    b.type = "button"; b.style.cssText = "padding:12px 0;font-size:18px;font-weight:700";
    b.onclick = () => { if (sel >= 0 && !fixed[sel]) { cur[sel] = n; draw(); } };
    pad.appendChild(b);
  }
  const er = el("button", "", "⌫");
  er.type = "button"; er.style.cssText = "padding:12px 0;font-size:18px";
  er.onclick = () => { if (sel >= 0 && !fixed[sel]) { cur[sel] = 0; draw(); } };
  pad.appendChild(er);
  [["Kolay", 40], ["Orta", 32], ["Zor", 26]].forEach((x) => row.appendChild(act(x[0], () => { level = x[1]; make(); })));
  make();
}

/* ---------- Kaydırmalı Bulmaca (15) ---------- */
function slide(body, el, act) {
  const info = line(body, el);
  const gr = gridOf(body, el, 4, 6);
  const row = rowOf(body, el);
  let t, moves;
  const solved = () => t.every((v, i) => v === (i + 1) % 16);
  function swap(i) {
    const z = t.indexOf(0), r1 = Math.floor(i / 4), c1 = i % 4, r2 = Math.floor(z / 4), c2 = z % 4;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return false;
    t[z] = t[i]; t[i] = 0;
    return true;
  }
  function draw() {
    gr.textContent = "";
    t.forEach((v, i) => {
      const b = el("button", "", v ? String(v) : "");
      b.type = "button";
      b.style.cssText = "aspect-ratio:1;font-size:26px;font-weight:700;padding:0;" + (v ? "" : "visibility:hidden");
      b.onclick = () => { if (!solved() && swap(i)) { moves++; if (solved()) save("nb_slide", moves, true); draw(); } };
      gr.appendChild(b);
    });
    const b = best("nb_slide");
    info.textContent = (solved() ? "Çözdün! 🎉 " : "") + "Hamle: " + moves + (b ? "   En iyi: " + b : "");
  }
  function start() {
    t = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]; moves = 0;
    for (let k = 0; k < 300; k++) {
      const z = t.indexOf(0), r = Math.floor(z / 4), c = z % 4, n = [];
      if (r > 0) n.push(z - 4); if (r < 3) n.push(z + 4); if (c > 0) n.push(z - 1); if (c < 3) n.push(z + 1);
      swap(n[rand(n.length)]);
    }
    if (solved()) start(); else draw();
  }
  row.appendChild(act("Karıştır", start));
  start();
}

export const SOLO = {
  mines: { group: "Zeka", icon: "💣", label: "Mayın Tarlası", start: mines },
  sudoku: { group: "Zeka", icon: "🔢", label: "Sudoku", start: sudoku },
  slide: { group: "Zeka", icon: "🧩", label: "Kaydırmalı Bulmaca", start: slide }
};
