// Zeka oyunları 5: Işıkları Söndür, Nonogram, Boruları Bağla
const rand = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function low(k, v) { const o = best(k); if (!o || v < o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }
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

/* ---------- Işıkları Söndür ---------- */
function lights(body, el, act) {
  const N = 5;
  const info = line(body, el);
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-columns:repeat(" + N + ",1fr);gap:6px;max-width:320px;margin:0 auto 10px";
  body.appendChild(gr);
  const row = rowOf(body, el);
  let g, moves;
  function press(i) {
    const r = Math.floor(i / N), c = i % N;
    [[r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach((p) => { if (p[0] >= 0 && p[0] < N && p[1] >= 0 && p[1] < N) g[p[0] * N + p[1]] ^= 1; });
  }
  function draw() {
    gr.textContent = "";
    g.forEach((v, i) => {
      const b = el("button", "", "");
      b.type = "button";
      b.style.cssText = "aspect-ratio:1;border:0!important;border-radius:12px!important;background:" + (v ? "#f0c24b" : "#243650") + "!important";
      b.onclick = () => { if (g.some((x) => x)) { press(i); moves++; if (!g.some((x) => x)) low("nb_lights", moves); draw(); } };
      gr.appendChild(b);
    });
    const won = !g.some((x) => x);
    info.textContent = (won ? "Hepsi söndü! 🎉 " : "Bir ışığa dokun: kendisi ve komşuları değişir. ") + "Hamle: " + moves + (best("nb_lights") ? "   En iyi: " + best("nb_lights") : "");
  }
  function start() {
    g = new Array(N * N).fill(0); moves = 0;
    for (let k = 0; k < 10 + rand(8); k++) press(rand(N * N));
    if (!g.some((x) => x)) press(12);
    draw();
  }
  row.appendChild(act("Yeni oyun", start));
  start();
}

/* ---------- Nonogram (6x6) ---------- */
function nonogram(body, el, act) {
  const N = 6;
  const info = line(body, el);
  const tb = el("div", "");
  tb.style.cssText = "display:grid;grid-template-columns:70px repeat(" + N + ",1fr);gap:3px;max-width:340px;margin:0 auto 10px";
  body.appendChild(tb);
  const row = rowOf(body, el);
  let sol, cur, rc, cc, mark;
  const clues = (a) => {
    const out = [];
    let n = 0;
    a.forEach((v) => { if (v) n++; else if (n) { out.push(n); n = 0; } });
    if (n) out.push(n);
    return out.length ? out : [0];
  };
  const rowOfG = (g, r) => g.slice(r * N, r * N + N);
  const colOfG = (g, c) => { const o = []; for (let r = 0; r < N; r++) o.push(g[r * N + c]); return o; };
  const same = (a, b) => a.join(",") === b.join(",");
  function solved() {
    for (let r = 0; r < N; r++) if (!same(clues(rowOfG(cur, r)), rc[r])) return false;
    for (let c = 0; c < N; c++) if (!same(clues(colOfG(cur, c)), cc[c])) return false;
    return true;
  }
  function draw() {
    tb.textContent = "";
    tb.appendChild(el("div", ""));
    for (let c = 0; c < N; c++) {
      const d = el("div", "", cc[c].join("\n"));
      d.style.cssText = "white-space:pre;text-align:center;font-size:13px;font-weight:700;color:var(--lamp);line-height:1.1;display:flex;align-items:flex-end;justify-content:center";
      tb.appendChild(d);
    }
    for (let r = 0; r < N; r++) {
      const d = el("div", "", rc[r].join(" "));
      d.style.cssText = "text-align:right;font-size:14px;font-weight:700;color:var(--lamp);align-self:center;padding-right:4px";
      tb.appendChild(d);
      for (let c = 0; c < N; c++) {
        const i = r * N + c, b = el("button", "", cur[i] === 2 ? "✕" : "");
        b.type = "button";
        b.style.cssText = "aspect-ratio:1;padding:0;font-size:16px;color:var(--mute);border-radius:6px!important;" + (cur[i] === 1 ? "background:var(--lamp)!important" : "");
        b.onclick = () => { cur[i] = cur[i] === 1 ? 0 : (mark ? (cur[i] === 2 ? 0 : 2) : 1); if (!mark && cur[i] === 0) cur[i] = 1; draw(); };
        tb.appendChild(b);
      }
    }
    const f = cur.map((v) => (v === 1 ? 1 : 0));
    const save = cur;
    cur = f;
    const ok = solved();
    cur = save;
    info.textContent = ok ? "Çözdün! 🎉" : "Sayılar o satır/sütundaki art arda dolu kutu sayısıdır. Dolu kutuya tekrar dokunursan boşalır.";
    modeBtn.textContent = mark ? "Mod: ✕ İşaret" : "Mod: ■ Doldur";
  }
  function start() {
    do { sol = []; for (let i = 0; i < N * N; i++) sol.push(Math.random() < 0.55 ? 1 : 0); } while (sol.every((v) => !v));
    cur = new Array(N * N).fill(0); mark = false;
    rc = []; cc = [];
    for (let r = 0; r < N; r++) rc.push(clues(rowOfG(sol, r)));
    for (let c = 0; c < N; c++) cc.push(clues(colOfG(sol, c)));
    draw();
  }
  const modeBtn = act("", () => { mark = !mark; draw(); });
  row.appendChild(modeBtn);
  row.appendChild(act("Yeni bulmaca", start));
  start();
}

/* ---------- Boruları Bağla (Flow) ---------- */
const COLS = ["#e5484d", "#3fb06a", "#4a8fd9", "#f0c24b", "#9b5bd9", "#2aa5a5", "#e5884d", "#e55da8", "#a6e22e", "#8da0b6"];
function makeFlow(N) {
  for (let tries = 0; tries < 400; tries++) {
    const owner = new Array(N * N).fill(-1), paths = [];
    const nbs = (i) => { const r = Math.floor(i / N), c = i % N, o = []; if (r > 0) o.push(i - N); if (r < N - 1) o.push(i + N); if (c > 0) o.push(i - 1); if (c < N - 1) o.push(i + 1); return o; };
    let ok = true;
    const order = shuffle([...Array(N * N).keys()]);
    for (const s of order) {
      if (owner[s] >= 0) continue;
      const p = [s];
      owner[s] = paths.length;
      const max = 3 + rand(4);
      while (p.length < max) {
        const nx = shuffle(nbs(p[p.length - 1]).filter((j) => owner[j] < 0));
        if (!nx.length) break;
        owner[nx[0]] = paths.length; p.push(nx[0]);
      }
      paths.push(p);
    }
    for (let k = 0; k < paths.length && ok; k++) {
      if (paths[k].length >= 2) continue;
      const s = paths[k][0];
      const t = nbs(s).find((j) => { const q = paths[owner[j]]; return owner[j] !== k && q.length >= 2 && (q[0] === j || q[q.length - 1] === j); });
      if (t === undefined) { ok = false; break; }
      const q = paths[owner[t]];
      if (q[0] === t) q.unshift(s); else q.push(s);
      owner[s] = owner[t]; paths[k] = [];
    }
    if (!ok) continue;
    const res = paths.filter((p) => p.length >= 2);
    if (res.length >= 3 && res.length <= N + 3) return res.map((p) => [p[0], p[p.length - 1]]);
  }
  return [[0, 1], [5, 6], [10, 11]];
}
function flow(body, el, act) {
  let N = 5;
  const info = line(body, el);
  const S = 300;
  const cv = el("canvas", "", "");
  cv.width = S; cv.height = S;
  cv.style.cssText = "display:block;width:100%;max-width:" + S + "px;margin:0 auto 6px;border:1px solid var(--line);border-radius:10px;background:#0b1422;touch-action:none;user-select:none";
  body.appendChild(cv);
  const cx = cv.getContext("2d");
  const row = rowOf(body, el);
  let ends, path, active, done;
  const cellAt = (e) => {
    const r = cv.getBoundingClientRect(), u = r.width / N;
    const x = Math.floor((e.clientX - r.left) / u), y = Math.floor((e.clientY - r.top) / u);
    return x < 0 || y < 0 || x >= N || y >= N ? -1 : y * N + x;
  };
  const endOf = (i) => ends.findIndex((e) => e[0] === i || e[1] === i);
  const adj = (a, b) => (Math.abs(a - b) === N) || (Math.abs(a - b) === 1 && Math.floor(a / N) === Math.floor(b / N));
  const complete = (k) => { const p = path[k]; return p.length >= 2 && endOf(p[p.length - 1]) === k && p[p.length - 1] !== p[0]; };
  function check() {
    const used = new Set();
    path.forEach((p) => p.forEach((i) => used.add(i)));
    done = ends.every((_, k) => complete(k)) && used.size === N * N;
  }
  function draw() {
    const u = S / N;
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, S, S);
    cx.strokeStyle = "#243650"; cx.lineWidth = 1;
    for (let i = 0; i <= N; i++) { cx.beginPath(); cx.moveTo(i * u, 0); cx.lineTo(i * u, S); cx.stroke(); cx.beginPath(); cx.moveTo(0, i * u); cx.lineTo(S, i * u); cx.stroke(); }
    path.forEach((p, k) => {
      cx.strokeStyle = COLS[k]; cx.lineWidth = u * 0.42; cx.lineCap = "round"; cx.lineJoin = "round";
      if (p.length > 1) { cx.beginPath(); p.forEach((i, n) => { const x = (i % N + 0.5) * u, y = (Math.floor(i / N) + 0.5) * u; if (n) cx.lineTo(x, y); else cx.moveTo(x, y); }); cx.stroke(); }
    });
    ends.forEach((e, k) => e.forEach((i) => { cx.fillStyle = COLS[k]; cx.beginPath(); cx.arc((i % N + 0.5) * u, (Math.floor(i / N) + 0.5) * u, u * 0.32, 0, 7); cx.fill(); }));
    check();
    const cnt = ends.filter((_, k) => complete(k)).length;
    info.textContent = done ? "Hepsi bağlandı! 🎉" : "Aynı renkleri parmağınla sürükleyip bağla, tüm kareleri doldur. Bağlı: " + cnt + "/" + ends.length;
  }
  function start() {
    ends = makeFlow(N);
    path = ends.map(() => []);
    active = -1; done = false; draw();
  }
  cv.onpointerdown = (e) => {
    if (done) return;
    const i = cellAt(e);
    if (i < 0) return;
    cv.setPointerCapture(e.pointerId);
    const k = endOf(i);
    if (k >= 0) { path[k] = [i]; active = k; draw(); return; }
    const kk = path.findIndex((p) => p.indexOf(i) >= 0);
    if (kk >= 0) { path[kk] = path[kk].slice(0, path[kk].indexOf(i) + 1); active = kk; draw(); }
  };
  cv.onpointermove = (e) => {
    if (active < 0 || done) return;
    const i = cellAt(e), p = path[active];
    if (i < 0 || !p.length || i === p[p.length - 1] || !adj(p[p.length - 1], i)) return;
    if (complete(active)) return;
    const idx = p.indexOf(i);
    if (idx >= 0) { path[active] = p.slice(0, idx + 1); draw(); return; }
    const ek = endOf(i);
    if (ek >= 0 && ek !== active) return;
    if (ek === active && i === p[0]) return;
    path.forEach((q, k) => { if (k !== active) { const j = q.indexOf(i); if (j >= 0) path[k] = q.slice(0, j); } });
    p.push(i);
    draw();
  };
  cv.onpointerup = () => { active = -1; draw(); };
  cv.onpointercancel = cv.onpointerup;
  [["5×5", 5], ["6×6", 6], ["7×7", 7]].forEach((x) => row.appendChild(act(x[0], () => { N = x[1]; start(); })));
  start();
}

export const SOLO = {
  lights: { group: "Zeka", icon: "💡", label: "Işıkları Söndür", start: lights },
  nono: { group: "Zeka", icon: "🧮", label: "Nonogram", start: nonogram },
  flow: { group: "Zeka", icon: "🔗", label: "Boruları Bağla", start: flow }
};
