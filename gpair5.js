// Arkadaşla oynanan oyunlar 5: Beşli, Hız Yarışı, Dart
const other = (g, me) => (g.x === me ? g.o : g.x);
function endMsg(c) {
  const g = c.g;
  if (g.winner === c.me) return "Kazandın! 🎉";
  if (g.winner === "draw") return "Berabere.";
  return "Kaybettin. " + c.name + " kazandı.";
}

/* ---------- Beşli (9x9, 5 taş yan yana) ---------- */
const GN = 9;
function five(b, i, ch) {
  const r = Math.floor(i / GN), q = i % GN;
  return [[0, 1], [1, 0], [1, 1], [1, -1]].some((d) => {
    let n = 1;
    for (const s of [1, -1]) {
      let rr = r + d[0] * s, qq = q + d[1] * s;
      while (rr >= 0 && rr < GN && qq >= 0 && qq < GN && b[rr * GN + qq] === ch) { n++; rr += d[0] * s; qq += d[1] * s; }
    }
    return n >= 5;
  });
}
const gomoku = {
  icon: "⚫", label: "Beşli",
  intro: (n) => n + " ile Beşli oynamak için davet gönder. Sırayla taş koyun; yatay, dikey ya da çapraz 5 taşı yan yana getiren kazanır. Davet gönderen 🔴.",
  start: (me) => ({ board: "-".repeat(GN * GN), s: "", turn: me }),
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, mine = g.x === me ? "X" : "O";
    const can = g.status === "play" && g.turn === me;
    const gr = c.el("div", "");
    gr.style.cssText = "display:grid;grid-template-columns:repeat(" + GN + ",1fr);gap:2px;max-width:340px;margin:0 auto;background:#8a5a2b;padding:3px;border-radius:8px";
    c.body.appendChild(gr);
    for (let i = 0; i < GN * GN; i++) {
      const ch = g.board[i], b = c.el("button", "", "");
      b.type = "button";
      b.style.cssText = "aspect-ratio:1;padding:0;border:0!important;border-radius:4px!important;background:#d9b46a!important;position:relative";
      if (ch !== "-") {
        const d = c.el("div", "");
        d.style.cssText = "position:absolute;inset:12%;border-radius:50%;background:" + (ch === "X" ? "#e5484d" : "#2a3d57") + ";box-shadow:0 1px 3px rgba(0,0,0,.5)";
        b.appendChild(d);
      }
      b.disabled = !can || ch !== "-";
      b.onclick = () => {
        const nb = g.board.slice(0, i) + mine + g.board.slice(i + 1);
        if (five(nb, i, mine)) c.upd({ board: nb, status: "done", turn: "", winner: me });
        else if (nb.indexOf("-") < 0) c.upd({ board: nb, status: "done", turn: "", winner: "draw" });
        else c.upd({ board: nb, turn: other(g, me) });
      };
      gr.appendChild(b);
    }
    if (g.status !== "play") return endMsg(c);
    return (can ? "Sıra sende. " : "Sıra " + c.name + " oyuncusunda. ") + "Sen: " + (mine === "X" ? "🔴" : "⚫");
  }
};

/* ---------- Hız Yarışı (10 saniyede en çok dokun) ---------- */
let run = null;
const sp = (b) => { const p = (b || "-1|-1").split("|").map(Number); return [isNaN(p[0]) ? -1 : p[0], isNaN(p[1]) ? -1 : p[1]]; };
const speed = {
  icon: "⚡", label: "Hız Yarışı",
  intro: (n) => n + " ile Hız Yarışı oynamak için davet gönder. İkiniz de sırayla 10 saniyede olabildiğince çok dokunursunuz. Çok dokunan kazanır. Aynı anda oynamak zorunda değilsiniz.",
  start: () => ({ board: "-1|-1", s: "", turn: "" }),
  needs: (g, me) => { if (g.status !== "play") return false; const p = sp(g.board); return p[g.x === me ? 0 : 1] < 0; },
  render(c) {
    const g = c.g, me = c.me, iX = g.x === me, p = sp(g.board);
    const mine = p[iX ? 0 : 1], theirs = p[iX ? 1 : 0];
    if (g.status !== "play") return endMsg(c) + "  Sen: " + mine + " – " + c.name + ": " + theirs;
    if (mine >= 0) return "Skorun: " + mine + " dokunuş. " + c.name + " oynayınca sonuç belli olur.";
    const box = c.el("div", "");
    c.body.appendChild(box);
    const big = c.el("button", "", "");
    big.type = "button";
    big.style.cssText = "width:100%;height:150px;font-size:26px;font-weight:700;touch-action:manipulation";
    box.appendChild(big);
    if (run) { run.c = c; run.big = big; }
    function paint() {
      if (!run) { big.textContent = "▶ Başla (10 sn)"; big.style.setProperty("background", "var(--lamp)", "important"); big.style.setProperty("color", "var(--lamp-ink)", "important"); return; }
      const left = Math.max(0, (run.end - Date.now()) / 1000);
      big.textContent = "👆 " + run.n + "   ⏱ " + left.toFixed(1);
    }
    big.onpointerdown = (e) => {
      e.preventDefault();
      if (!run) {
        run = { n: 0, end: Date.now() + 10000, c: c, big: big };
        run.t = setInterval(() => {
          if (!run) return;
          if (!run.big.isConnected) { clearInterval(run.t); run = null; return; }
          if (Date.now() >= run.end) {
            clearInterval(run.t);
            const n = run.n, cc = run.c;
            run = null;
            cc.tx((d) => {
              const q = sp(d.board), idx = d.x === cc.me ? 0 : 1;
              if (d.status !== "play" || q[idx] >= 0) return null;
              q[idx] = n;
              const o = { board: q[0] + "|" + q[1] };
              if (q[0] >= 0 && q[1] >= 0) { o.status = "done"; o.turn = ""; o.winner = q[0] === q[1] ? "draw" : (q[0] > q[1] ? d.x : d.o); }
              return o;
            });
            return;
          }
          const l = Math.max(0, (run.end - Date.now()) / 1000);
          run.big.textContent = "👆 " + run.n + "   ⏱ " + l.toFixed(1);
        }, 100);
      } else run.n++;
      paint();
    };
    paint();
    return "Başla'ya bas, sonra 10 saniye boyunca olabildiğince hızlı dokun!";
  }
};

/* ---------- Dart ---------- */
const DR = 105;
const dparse = (s) => (s ? s.split(",").filter((x) => x !== "").map(Number) : []);
let dstate = { key: "", list: [], t: 0 };
const dart = {
  icon: "🎯", label: "Dart",
  intro: (n) => n + " ile Dart oynamak için davet gönder. Her turda 3 ok atarsınız, toplam 2 tur. Hedef hareket ederken tam ortaya denk getirip Fırlat'a bas. Merkez 10 puan, dışa doğru azalır. Toplam puanı yüksek olan kazanır.",
  start: (me) => ({ board: "|", s: "", turn: me }),
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, iX = g.x === me;
    const sides = (g.board || "|").split("|"), a = dparse(sides[0]), b = dparse(sides[1]);
    const mine = iX ? a : b, theirs = iX ? b : a;
    const sum = (l) => l.reduce((x, y) => x + y, 0);
    const can = g.status === "play" && g.turn === me;
    const key = g.board + g.turn;
    if (dstate.key !== key) dstate = { key: key, list: [], t: 0 };
    const sc = "Sen: " + sum(mine) + " (" + mine.join(" ") + ")   " + c.name + ": " + sum(theirs) + " (" + theirs.join(" ") + ")";
    const cv = c.el("canvas", "", "");
    cv.width = 240; cv.height = 240;
    cv.style.cssText = "display:block;width:100%;max-width:240px;margin:0 auto 10px;background:#0b1422;border-radius:10px";
    c.body.appendChild(cv);
    const cx = cv.getContext("2d");
    const pt = () => ({ x: 120 + DR * 0.92 * Math.sin(dstate.t * 0.045), y: 120 + DR * 0.92 * Math.sin(dstate.t * 0.061 + 1) });
    function draw() {
      cx.fillStyle = "#0b1422"; cx.fillRect(0, 0, 240, 240);
      for (let i = 10; i >= 1; i--) { cx.fillStyle = i % 2 ? "#243650" : "#1b2c44"; if (i >= 9) cx.fillStyle = i === 10 ? "#e5484d" : "#f0c24b"; cx.beginPath(); cx.arc(120, 120, DR * i / 10 + 0.001, 0, 7); cx.fill(); }
      cx.fillStyle = "#e5484d"; cx.beginPath(); cx.arc(120, 120, DR * 0.1, 0, 7); cx.fill();
      cx.strokeStyle = "#fff"; cx.lineWidth = 1;
      for (let i = 1; i <= 10; i++) { cx.beginPath(); cx.arc(120, 120, DR * i / 10, 0, 7); cx.stroke(); }
      dstate.list.forEach((d) => { cx.fillStyle = "#4a8fd9"; cx.beginPath(); cx.arc(d.x, d.y, 5, 0, 7); cx.fill(); cx.strokeStyle = "#fff"; cx.stroke(); });
      if (can && dstate.list.length < 3) {
        const p = pt();
        cx.strokeStyle = "#3fb06a"; cx.lineWidth = 2;
        cx.beginPath(); cx.arc(p.x, p.y, 9, 0, 7); cx.moveTo(p.x - 14, p.y); cx.lineTo(p.x + 14, p.y); cx.moveTo(p.x, p.y - 14); cx.lineTo(p.x, p.y + 14); cx.stroke();
      }
    }
    draw();
    if (can) {
      const timer = setInterval(() => { if (!cv.isConnected) { clearInterval(timer); return; } dstate.t += 1; draw(); }, 30);
      const row = c.el("div", "");
      row.style.cssText = "display:flex;gap:8px";
      c.body.appendChild(row);
      const bt = c.el("button", "", "🎯 Fırlat (" + (3 - dstate.list.length) + " ok kaldı)");
      bt.type = "button";
      bt.style.cssText = "flex:1;padding:14px;font-size:17px;font-weight:700;background:var(--lamp)!important;color:var(--lamp-ink)!important;border:0!important";
      bt.onclick = () => {
        if (dstate.list.length >= 3) return;
        const p = pt(), d = Math.hypot(p.x - 120, p.y - 120) / DR;
        const v = d >= 1 ? 0 : Math.max(0, 10 - Math.floor(d * 10));
        dstate.list.push({ x: p.x, y: p.y, v: v });
        if (dstate.list.length < 3) { bt.textContent = "🎯 Fırlat (" + (3 - dstate.list.length) + " ok kaldı)"; draw(); return; }
        clearInterval(timer);
        const add = dstate.list.map((q) => q.v);
        const nm = mine.concat(add), nl = nm.join(","), ol = theirs.join(",");
        const nb = iX ? nl + "|" + ol : ol + "|" + nl;
        const o = { board: nb, turn: other(g, me) };
        if (nm.length >= 6 && theirs.length >= 6) {
          const t1 = sum(nm), t2 = sum(theirs);
          o.status = "done"; o.turn = ""; o.winner = t1 === t2 ? "draw" : (t1 > t2 ? me : other(g, me));
        }
        c.upd(o);
      };
      row.appendChild(bt);
    }
    if (g.status !== "play") return endMsg(c) + "  " + sc;
    return (can ? "Sıra sende: merkeze denk gelince Fırlat. " : "Sıra " + c.name + " oyuncusunda. ") + sc;
  }
};

export const PAIR = { gomoku: gomoku, speed: speed, dart: dart };
