// Zeka oyunları 4: Kelime Avı, Devriye (labirent), Sokoban
const rand = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function save(k, v) { const o = best(k); if (!o || v < o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }
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
function dpad(body, el, fn) {
  const g = el("div", "");
  g.style.cssText = "display:grid;grid-template-columns:repeat(3,64px);gap:6px;justify-content:center;margin:10px 0";
  [["", 0, 0], ["▲", 0, -1], ["", 0, 0], ["◀", -1, 0], ["▼", 0, 1], ["▶", 1, 0]].forEach((x) => {
    const b = el("button", "", x[0]);
    b.type = "button";
    b.style.cssText = "height:52px;font-size:22px" + (x[0] ? "" : ";visibility:hidden");
    b.onclick = () => fn(x[1], x[2]);
    g.appendChild(b);
  });
  body.appendChild(g);
}
function keys(fn) {
  const k = (e) => {
    const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (m) { e.preventDefault(); fn(m[0], m[1]); }
  };
  document.addEventListener("keydown", k);
  return () => document.removeEventListener("keydown", k);
}
function canvas(body, el, w, h) {
  const cv = el("canvas", "", "");
  cv.width = w; cv.height = h;
  cv.style.cssText = "display:block;width:100%;max-width:" + w + "px;margin:0 auto 6px;border:1px solid var(--line);border-radius:10px;background:#0b1422;touch-action:none;user-select:none";
  body.appendChild(cv);
  return cv;
}

/* ---------- Kelime Avı ---------- */
const POOL = ["NÖBET", "KAMERA", "TELSİZ", "FENER", "KAPI", "DENİZ", "ORMAN", "YILDIZ", "BULUT", "ELMA", "KÖPRÜ", "ÇİÇEK", "RADYO", "DEFTER", "UÇAK", "SAHİL", "TAKVİM", "BALIK", "MASA", "KİTAP", "SABAH", "GECE", "PİLOT", "HARİTA", "KALEM", "DAĞ", "NEHİR", "YOL", "ŞEHİR", "SİREN"];
const TRL = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
function hunt(body, el, act) {
  const N = 9;
  const info = line(body, el);
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-columns:repeat(" + N + ",1fr);gap:3px;margin-bottom:10px";
  body.appendChild(gr);
  const wl = el("div", "");
  wl.style.cssText = "display:flex;flex-wrap:wrap;gap:6px 12px;font-weight:700;margin-bottom:8px";
  body.appendChild(wl);
  const row = rowOf(body, el);
  let g, words, found, start, hit, t0;
  const DIRS = [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]];
  function build() {
    for (let tries = 0; tries < 200; tries++) {
      g = new Array(N * N).fill("");
      words = shuffle(POOL).slice(0, 6);
      let ok = true;
      for (const w of words) {
        let put = false;
        for (let k = 0; k < 80 && !put; k++) {
          const d = DIRS[rand(DIRS.length)], L = w.length;
          const x = rand(N), y = rand(N), ex = x + d[0] * (L - 1), ey = y + d[1] * (L - 1);
          if (ex < 0 || ey < 0 || ex >= N || ey >= N) continue;
          let fit = true;
          for (let i = 0; i < L; i++) { const c = g[(y + d[1] * i) * N + x + d[0] * i]; if (c && c !== w[i]) { fit = false; break; } }
          if (!fit) continue;
          for (let i = 0; i < L; i++) g[(y + d[1] * i) * N + x + d[0] * i] = w[i];
          put = true;
        }
        if (!put) { ok = false; break; }
      }
      if (ok) break;
    }
    for (let i = 0; i < N * N; i++) if (!g[i]) g[i] = TRL[rand(TRL.length)];
    found = []; hit = new Array(N * N).fill(false); start = -1; t0 = Date.now();
    draw();
  }
  function tap(i) {
    if (found.length === words.length) return;
    if (start < 0) { start = i; draw(); return; }
    const x1 = start % N, y1 = Math.floor(start / N), x2 = i % N, y2 = Math.floor(i / N);
    const dx = x2 - x1, dy = y2 - y1, L = Math.max(Math.abs(dx), Math.abs(dy)) + 1;
    start = -1;
    if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
      const sx = Math.sign(dx), sy = Math.sign(dy), cells = [];
      let s = "";
      for (let k = 0; k < L; k++) { const c = (y1 + sy * k) * N + x1 + sx * k; cells.push(c); s += g[c]; }
      const w = words.find((q) => found.indexOf(q) < 0 && q === s);
      if (w) { found.push(w); cells.forEach((c) => { hit[c] = true; }); }
    }
    draw();
  }
  function draw() {
    gr.textContent = "";
    g.forEach((c, i) => {
      const b = el("button", "", c);
      b.type = "button";
      b.style.cssText = "aspect-ratio:1;padding:0;font-size:17px;font-weight:700;" + (hit[i] ? "background:#3fb06a!important;color:#fff" : i === start ? "background:rgba(240,194,75,.5)!important" : "");
      b.onclick = () => tap(i);
      gr.appendChild(b);
    });
    wl.textContent = "";
    words.forEach((w) => {
      const s = el("span", "", w);
      if (found.indexOf(w) >= 0) { s.style.textDecoration = "line-through"; s.style.color = "var(--mute)"; }
      wl.appendChild(s);
    });
    const done = found.length === words.length;
    if (done) { const sec = Math.floor((Date.now() - t0) / 1000); info.textContent = "Hepsini buldun! 🎉 Süre: " + sec + " sn   En iyi: " + save("nb_hunt", sec) + " sn"; }
    else info.textContent = "Kelimeler yatay, dikey, çapraz ve ters olabilir. İlk harfe, sonra son harfe dokun.";
  }
  row.appendChild(act("Yeni oyun", build));
  build();
}

/* ---------- Devriye (labirent) ---------- */
function maze(body, el, act) {
  const info = line(body, el);
  const S = 300, cv = canvas(body, el, S, S), cx = cv.getContext("2d");
  const row = rowOf(body, el);
  let C = 8, w, px, py, steps, t0, done;
  function make() {
    w = [];
    for (let i = 0; i < C * C; i++) w.push([true, true, true, true]); // yukarı, sağ, aşağı, sol duvarları
    const seen = new Array(C * C).fill(false), st = [0];
    seen[0] = true;
    const D = [[0, -1, 0, 2], [1, 0, 1, 3], [0, 1, 2, 0], [-1, 0, 3, 1]];
    while (st.length) {
      const c = st[st.length - 1], x = c % C, y = Math.floor(c / C);
      const nb = shuffle(D).filter((d) => { const nx = x + d[0], ny = y + d[1]; return nx >= 0 && ny >= 0 && nx < C && ny < C && !seen[ny * C + nx]; });
      if (!nb.length) { st.pop(); continue; }
      const d = nb[0], n = (y + d[1]) * C + x + d[0];
      w[c][d[2]] = false; w[n][d[3]] = false; seen[n] = true; st.push(n);
    }
    px = 0; py = 0; steps = 0; t0 = Date.now(); done = false;
    draw();
  }
  function draw() {
    const u = S / C;
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, S, S);
    cx.fillStyle = "rgba(63,176,106,.35)"; cx.fillRect((C - 1) * u, (C - 1) * u, u, u);
    cx.font = Math.floor(u * 0.7) + "px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle";
    cx.fillText("🏁", (C - 0.5) * u, (C - 0.5) * u);
    cx.strokeStyle = "#8da0b6"; cx.lineWidth = 2; cx.beginPath();
    for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) {
      const c = w[y * C + x], X = x * u, Y = y * u;
      if (c[0]) { cx.moveTo(X, Y); cx.lineTo(X + u, Y); }
      if (c[1]) { cx.moveTo(X + u, Y); cx.lineTo(X + u, Y + u); }
      if (c[2]) { cx.moveTo(X, Y + u); cx.lineTo(X + u, Y + u); }
      if (c[3]) { cx.moveTo(X, Y); cx.lineTo(X, Y + u); }
    }
    cx.stroke();
    cx.fillStyle = "#f0c24b"; cx.beginPath(); cx.arc((px + 0.5) * u, (py + 0.5) * u, u * 0.28, 0, 7); cx.fill();
    info.textContent = done ? "Çıkışa vardın! 🎉 " + steps + " adım, " + Math.floor((Date.now() - t0) / 1000) + " sn" : "Adım: " + steps + "   Hedef: sağ alttaki 🏁   Boyut: " + C + "×" + C;
  }
  function move(dx, dy) {
    if (done) return;
    const side = dx === 1 ? 1 : dx === -1 ? 3 : dy === 1 ? 2 : 0;
    if (w[py * C + px][side]) return;
    px += dx; py += dy; steps++;
    if (px === C - 1 && py === C - 1) done = true;
    draw();
  }
  let sx = 0, sy = 0;
  cv.onpointerdown = (e) => { sx = e.clientX; sy = e.clientY; };
  cv.onpointerup = (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0); else move(0, dy > 0 ? 1 : -1);
  };
  dpad(body, el, move);
  [["Küçük", 6], ["Orta", 8], ["Büyük", 12]].forEach((x) => row.appendChild(act(x[0], () => { C = x[1]; make(); })));
  const off = keys(move);
  make();
  return off;
}

/* ---------- Sokoban ---------- */
const LV = [
  ["#####", "#@$.#", "#####"],
  ["######", "#    #", "# $@ #", "# .  #", "######"],
  ["#######", "#     #", "# .$. #", "# $@$ #", "# .   #", "#######"],
  ["  ####  ", " ##  ## ", "## $  ##", "#  .$. #", "# .$@  #", "##    ##", " ###### "],
  ["######## ", "#      # ", "# $ $  # ", "#  ##.  # ", "# @ #.  # ", "#    $. # ", "#      # ", "######## "]
];
function soko(body, el, act) {
  const info = line(body, el);
  const cv = canvas(body, el, 300, 300), cx = cv.getContext("2d");
  const row = rowOf(body, el);
  let lv = 0, map, box, goal, p, W, H, moves, hist;
  function load() {
    const L = LV[lv];
    H = L.length; W = Math.max(...L.map((r) => r.length));
    map = []; box = []; goal = []; hist = []; moves = 0;
    L.forEach((r, y) => { for (let x = 0; x < W; x++) {
      const c = r[x] || " ", k = y * W + x;
      map[k] = c === "#" ? 1 : 0;
      if (c === "." || c === "*" || c === "+") goal.push(k);
      if (c === "$" || c === "*") box.push(k);
      if (c === "@" || c === "+") p = k;
    } });
    draw();
  }
  const won = () => box.every((b) => goal.indexOf(b) >= 0);
  function draw() {
    const u = Math.floor(300 / Math.max(W, H)), ox = (300 - u * W) / 2, oy = (300 - u * H) / 2;
    cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, 300, 300);
    cx.textAlign = "center"; cx.textBaseline = "middle"; cx.font = Math.floor(u * 0.7) + "px sans-serif";
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x, X = ox + x * u, Y = oy + y * u;
      if (map[k]) { cx.fillStyle = "#3b5273"; cx.fillRect(X, Y, u - 1, u - 1); }
      else if (goal.indexOf(k) >= 0) { cx.fillStyle = "rgba(63,176,106,.45)"; cx.fillRect(X + 2, Y + 2, u - 5, u - 5); }
    }
    box.forEach((b) => { const X = ox + (b % W) * u, Y = oy + Math.floor(b / W) * u; cx.fillStyle = goal.indexOf(b) >= 0 ? "#3fb06a" : "#d9822b"; cx.fillRect(X + 3, Y + 3, u - 7, u - 7); });
    cx.fillText("🙂", ox + (p % W) * u + u / 2, oy + Math.floor(p / W) * u + u / 2);
    info.textContent = (won() ? "Bölüm bitti! 🎉 " : "") + "Bölüm " + (lv + 1) + "/" + LV.length + "   Hamle: " + moves + "   Kutuları 🟩 hedeflere it.";
  }
  function move(dx, dy) {
    if (won()) return;
    const np = p + dx + dy * W, x = p % W;
    if (x + dx < 0 || x + dx >= W || map[np]) return;
    const bi = box.indexOf(np);
    hist.push({ p: p, box: box.slice() });
    if (bi >= 0) {
      const t = np + dx + dy * W;
      if ((np % W) + dx < 0 || (np % W) + dx >= W || map[t] || box.indexOf(t) >= 0) { hist.pop(); return; }
      box[bi] = t;
    }
    p = np; moves++;
    draw();
  }
  function undo() { if (!hist.length || won()) return; const h = hist.pop(); p = h.p; box = h.box; moves = Math.max(0, moves - 1); draw(); }
  dpad(body, el, move);
  row.appendChild(act("↶ Geri al", undo));
  row.appendChild(act("Baştan", load));
  row.appendChild(act("Sonraki ▶", () => { lv = (lv + 1) % LV.length; load(); }));
  const off = keys(move);
  load();
  return off;
}

export const SOLO = {
  hunt: { group: "Zeka", icon: "🔎", label: "Kelime Avı", start: hunt },
  maze: { group: "Zeka", icon: "🔦", label: "Devriye (Labirent)", start: maze },
  soko: { group: "Zeka", icon: "📦", label: "Sokoban", start: soko }
};
