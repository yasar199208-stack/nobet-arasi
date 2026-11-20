// Arkadaşla oynanan oyunlar 2: Savaş Gemileri, Dama, Mancala, Reversi
// Her oyun: start (davet verisi), needs (sıra bende mi), render (ekran). c: { me, name, g, body, upd, tx, toast, el }
const rand = (n) => Math.floor(Math.random() * n);
const other = (g, me) => (g.x === me ? g.o : g.x);

function endMsg(c) {
  const g = c.g;
  if (g.winner === c.me) return "Kazandın! 🎉";
  if (g.winner === "draw") return "Berabere.";
  return "Kaybettin. " + c.name + " kazandı.";
}
function grid(c, cols, gap) {
  const d = c.el("div", "");
  d.style.cssText = "display:grid;grid-template-columns:repeat(" + cols + ",1fr);gap:" + gap + "px";
  c.body.appendChild(d);
  return d;
}
function cellBtn(c, parent) {
  const b = c.el("button", "", "");
  b.type = "button";
  parent.appendChild(b);
  return b;
}
function label(c, txt) {
  const p = c.el("p", "", txt);
  p.style.cssText = "margin:8px 0 4px;font-weight:700;font-size:14px;color:var(--mute)";
  c.body.appendChild(p);
}

/* ---------- Savaş Gemileri (8x8, 5 gemi) ---------- */
const BN = 8;
function fleet() {
  const f = new Array(BN * BN).fill("-");
  [4, 3, 3, 2, 2].forEach((len) => {
    for (let t = 0; t < 500; t++) {
      const h = Math.random() < 0.5, x = rand(BN - (h ? len - 1 : 0)), y = rand(BN - (h ? 0 : len - 1)), idx = [];
      for (let k = 0; k < len; k++) idx.push((y + (h ? 0 : k)) * BN + x + (h ? k : 0));
      if (idx.every((i) => f[i] === "-")) { idx.forEach((i) => { f[i] = "S"; }); break; }
    }
  });
  return f.join("");
}
const ships = {
  icon: "🚢", label: "Savaş Gemileri",
  intro: (n) => n + " ile Savaş Gemileri oynamak için davet gönder. 8×8 denizde 5 gemi (rastgele dizilir), sırayla ateş edersiniz.",
  start: (me) => ({ board: fleet(), s: fleet(), turn: me }),
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, iX = g.x === me;
    const mine = iX ? g.board : g.s, foe = iX ? g.s : g.board, fld = iX ? "s" : "board";
    const can = g.status === "play" && g.turn === me;
    label(c, "Rakip suları" + (can ? " (ateş etmek için dokun)" : ""));
    const eg = grid(c, BN, 2);
    for (let i = 0; i < BN * BN; i++) {
      const b = cellBtn(c, eg), ch = foe[i];
      b.style.cssText = "aspect-ratio:1;padding:0;font-size:15px;background:#1d3a5c!important";
      b.textContent = ch === "h" ? "💥" : ch === "m" ? "·" : "";
      b.disabled = !can || ch === "h" || ch === "m";
      b.onclick = () => {
        const nf = foe.slice(0, i) + (ch === "S" ? "h" : "m") + foe.slice(i + 1);
        const o = {}; o[fld] = nf;
        if (nf.indexOf("S") < 0) { o.status = "done"; o.winner = me; o.turn = ""; }
        else o.turn = other(g, me);
        c.upd(o);
      };
    }
    label(c, "Filom");
    const mg = grid(c, BN, 2);
    for (let i = 0; i < BN * BN; i++) {
      const b = cellBtn(c, mg), ch = mine[i];
      b.disabled = true;
      b.style.cssText = "aspect-ratio:1;padding:0;font-size:12px;opacity:1!important;background:" + (ch === "S" ? "#6b7f99" : "#1d3a5c") + "!important";
      b.textContent = ch === "h" ? "💥" : ch === "m" ? "·" : "";
    }
    const left = (s) => (s.match(/S/g) || []).length;
    const st = "Rakipte kalan gemi parçası: " + left(foe) + "   Sende: " + left(mine);
    if (g.status !== "play") return endMsg(c) + "  " + st;
    return (can ? "Sıra sende, ateş et! " : "Sıra " + c.name + " oyuncusunda. ") + st;
  }
};

/* ---------- Reversi ---------- */
const DIR8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
function flips(b, i, ch) {
  if (b[i] !== "-") return [];
  const r = Math.floor(i / 8), q = i % 8, op = ch === "X" ? "O" : "X", out = [];
  DIR8.forEach((d) => {
    const tmp = [];
    let rr = r + d[0], qq = q + d[1];
    while (rr >= 0 && rr < 8 && qq >= 0 && qq < 8 && b[rr * 8 + qq] === op) { tmp.push(rr * 8 + qq); rr += d[0]; qq += d[1]; }
    if (tmp.length && rr >= 0 && rr < 8 && qq >= 0 && qq < 8 && b[rr * 8 + qq] === ch) out.push.apply(out, tmp);
  });
  return out;
}
const anyMove = (b, ch) => { for (let i = 0; i < 64; i++) if (flips(b, i, ch).length) return true; return false; };
const reversi = {
  icon: "⚫", label: "Reversi",
  intro: (n) => n + " ile Reversi oynamak için davet gönder. Rakibin taşlarını arada sıkıştırıp çevir; sonunda çok taşı olan kazanır.",
  start: (me) => {
    const b = new Array(64).fill("-");
    b[27] = "O"; b[36] = "O"; b[28] = "X"; b[35] = "X";
    return { board: b.join(""), s: "", turn: me };
  },
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, mine = g.x === me ? "X" : "O", foe = mine === "X" ? "O" : "X";
    const can = g.status === "play" && g.turn === me;
    const gr = grid(c, 8, 2);
    gr.style.cssText += ";background:#1f5a34;padding:4px;border-radius:8px";
    for (let i = 0; i < 64; i++) {
      const b = cellBtn(c, gr), ch = g.board[i], fl = can && ch === "-" ? flips(g.board, i, mine) : [];
      b.style.cssText = "aspect-ratio:1;padding:0;border:0!important;border-radius:4px!important;font-size:24px;line-height:1;background:#2c7a45!important;color:" + (ch === "X" ? "#111" : "#fff");
      b.textContent = ch === "-" ? (fl.length ? "·" : "") : "●";
      b.disabled = !fl.length;
      b.onclick = () => {
        const a = g.board.split("");
        a[i] = mine; fl.forEach((k) => { a[k] = mine; });
        const nb = a.join("");
        let next = anyMove(nb, foe) ? other(g, me) : anyMove(nb, mine) ? me : "";
        if (!next) {
          const nx = (nb.match(/X/g) || []).length, no = (nb.match(/O/g) || []).length;
          c.upd({ board: nb, status: "done", turn: "", winner: nx === no ? "draw" : (nx > no ? g.x : g.o) });
        } else c.upd({ board: nb, turn: next });
      };
    }
    const cm = (g.board.match(new RegExp(mine, "g")) || []).length, cf = (g.board.match(new RegExp(foe, "g")) || []).length;
    const sc = "Sen " + (mine === "X" ? "⚫" : "⚪") + " " + cm + " – " + cf + " " + c.name;
    if (g.status !== "play") return endMsg(c) + "  " + sc;
    return (can ? "Sıra sende (· işaretli yerlere koyabilirsin). " : "Sıra " + c.name + " oyuncusunda. ") + sc;
  }
};

/* ---------- Mancala (Kalah) ---------- */
function sow(b, i, p) {
  const base = p * 7, store = base + 6, oppStore = (1 - p) * 7 + 6;
  let n = b[i], j = i;
  b[i] = 0;
  while (n > 0) { j = (j + 1) % 14; if (j === oppStore) continue; b[j]++; n--; }
  let extra = j === store;
  if (j >= base && j < base + 6 && b[j] === 1 && b[12 - j] > 0) { b[store] += b[12 - j] + 1; b[j] = 0; b[12 - j] = 0; }
  const sx = b.slice(0, 6).reduce((a, v) => a + v, 0), so = b.slice(7, 13).reduce((a, v) => a + v, 0);
  let done = false;
  if (sx === 0 || so === 0) { b[6] += sx; b[13] += so; for (let k = 0; k < 6; k++) { b[k] = 0; b[k + 7] = 0; } done = true; }
  return { extra: extra && !done, done: done };
}
const mancala = {
  icon: "🥣", label: "Mancala",
  intro: (n) => n + " ile Mancala oynamak için davet gönder. Çukurdaki taşları saat yönünün tersine dağıt; son taş kendi kuyuna düşerse tekrar oynarsın.",
  start: (me) => ({ board: "4,4,4,4,4,4,0,4,4,4,4,4,4,0", s: "", turn: me }),
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, p = g.x === me ? 0 : 1, base = p * 7, ob = (1 - p) * 7;
    const b = g.board.split(",").map(Number);
    const can = g.status === "play" && g.turn === me;
    const gr = c.el("div", "");
    gr.style.cssText = "display:grid;grid-template-columns:1.1fr repeat(6,1fr) 1.1fr;grid-template-rows:64px 64px;gap:6px;background:#5a3b22;padding:8px;border-radius:14px";
    c.body.appendChild(gr);
    const mk = (txt, col, row, rs, on) => {
      const e = c.el("button", "", String(txt));
      e.type = "button";
      e.style.cssText = "grid-column:" + col + ";grid-row:" + row + (rs ? "/span 2" : "") + ";border:0!important;border-radius:" + (rs ? "30px" : "50%") + "!important;background:#e8c99a!important;color:#3b2512!important;font-size:20px;font-weight:700;padding:0";
      e.disabled = !on;
      if (on) { e.style.outline = "3px solid var(--lamp)"; e.onclick = on; }
      gr.appendChild(e);
    };
    mk(b[ob + 6], 1, 1, true, null);
    mk(b[base + 6], 8, 1, true, null);
    for (let k = 0; k < 6; k++) mk(b[ob + k], 7 - k, 1, false, null);
    for (let k = 0; k < 6; k++) {
      const i = base + k, ok = can && b[i] > 0;
      mk(b[i], 2 + k, 2, false, ok ? () => {
        const nb = b.slice(), r = sow(nb, i, p);
        const o = { board: nb.join(",") };
        if (r.done) { o.status = "done"; o.turn = ""; o.winner = nb[6] === nb[13] ? "draw" : (nb[6] > nb[13] ? g.x : g.o); }
        else o.turn = r.extra ? me : other(g, me);
        c.upd(o);
      } : null);
    }
    const sc = "Sen " + b[base + 6] + " – " + b[ob + 6] + " " + c.name;
    if (g.status !== "play") return endMsg(c) + "  " + sc;
    return (can ? "Sıra sende, altaki çukurlardan birine dokun. " : "Sıra " + c.name + " oyuncusunda. ") + sc;
  }
};

/* ---------- Dama (Türk daması) ---------- */
const own = (ch) => (ch === "a" || ch === "A" ? "X" : ch === "b" || ch === "B" ? "O" : "");
function dMoves(b, i, side) {
  const ch = b[i], king = ch === "A" || ch === "B", r = Math.floor(i / 8), q = i % 8, fw = side === "X" ? -1 : 1, out = [];
  const ok = (rr, qq) => rr >= 0 && rr < 8 && qq >= 0 && qq < 8;
  const dirs = king ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[fw, 0], [0, 1], [0, -1]];
  dirs.forEach((d) => {
    let rr = r + d[0], qq = q + d[1];
    if (!king) {
      if (!ok(rr, qq)) return;
      const n = rr * 8 + qq;
      if (b[n] === "-") out.push({ to: n, cap: -1 });
      else if (own(b[n]) && own(b[n]) !== side && ok(rr + d[0], qq + d[1]) && b[(rr + d[0]) * 8 + qq + d[1]] === "-") out.push({ to: (rr + d[0]) * 8 + qq + d[1], cap: n });
      return;
    }
    while (ok(rr, qq) && b[rr * 8 + qq] === "-") { out.push({ to: rr * 8 + qq, cap: -1 }); rr += d[0]; qq += d[1]; }
    if (ok(rr, qq) && own(b[rr * 8 + qq]) && own(b[rr * 8 + qq]) !== side) {
      const cp = rr * 8 + qq;
      rr += d[0]; qq += d[1];
      while (ok(rr, qq) && b[rr * 8 + qq] === "-") { out.push({ to: rr * 8 + qq, cap: cp }); rr += d[0]; qq += d[1]; }
    }
  });
  return out;
}
const dCaps = (b, i, side) => dMoves(b, i, side).filter((m) => m.cap >= 0);
function dAll(b, side) { const r = []; for (let i = 0; i < 64; i++) if (own(b[i]) === side) r.push(i); return r; }
function dLegal(b, side, forced) {
  const idx = forced !== "" && forced != null ? [Number(forced)] : dAll(b, side);
  const caps = {};
  let any = false;
  idx.forEach((i) => { const c = dCaps(b, i, side); if (c.length) { caps[i] = c; any = true; } });
  if (any) return caps;
  const mv = {};
  idx.forEach((i) => { const m = dMoves(b, i, side); if (m.length) mv[i] = m; });
  return mv;
}
let dSel = { key: "", i: -1 };
const dama = {
  icon: "⚪", label: "Dama",
  intro: (n) => n + " ile Dama oynamak için davet gönder. Taşlar ileri ve yana gider; rakibin taşını atlayarak alırsın (zorunlu). Son sıraya ulaşan taş dama olur.",
  start: (me) => {
    const b = new Array(64).fill("-");
    for (let q = 0; q < 8; q++) { b[8 + q] = "b"; b[16 + q] = "b"; b[40 + q] = "a"; b[48 + q] = "a"; }
    return { board: b.join(""), s: "", turn: me };
  },
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, side = g.x === me ? "X" : "O";
    const can = g.status === "play" && g.turn === me;
    const key = g.board + "|" + g.s;
    if (dSel.key !== key) dSel = { key: key, i: -1 };
    const legal = can ? dLegal(g.board, side, g.s) : {};
    const tgs = () => (dSel.i >= 0 && legal[dSel.i] ? legal[dSel.i] : []);
    const gr = grid(c, 8, 1);
    gr.style.cssText += ";background:#3b2a1a;padding:3px;border-radius:8px";
    const bs = [];
    function paint() {
      const tg = tgs();
      for (let v = 0; v < 64; v++) {
        const i = side === "X" ? v : 63 - v, dark = (Math.floor(v / 8) + v % 8) % 2 === 1;
        bs[v].style.setProperty("background", dSel.i === i ? "#f0c24b" : tg.some((m) => m.to === i) ? "#6fcf97" : dark ? "#a97c50" : "#e8d3b0", "important");
      }
    }
    function go(i) {
      const t = tgs().find((m) => m.to === i);
      if (!t) { if (legal[i]) { dSel = { key: key, i: dSel.i === i ? -1 : i }; paint(); } return; }
      const a = g.board.split("");
      a[i] = a[dSel.i]; a[dSel.i] = "-";
      if (t.cap >= 0) a[t.cap] = "-";
      const R = Math.floor(i / 8);
      if (a[i] === "a" && R === 0) a[i] = "A";
      if (a[i] === "b" && R === 7) a[i] = "B";
      const nb = a.join("");
      if (t.cap >= 0 && dCaps(nb, i, side).length) { c.upd({ board: nb, s: String(i) }); return; }
      const foe = side === "X" ? "O" : "X";
      const o = { board: nb, s: "", turn: other(g, me) };
      if (!dAll(nb, foe).length || !Object.keys(dLegal(nb, foe, "")).length) { o.status = "done"; o.turn = ""; o.winner = me; }
      c.upd(o);
    }
    for (let v = 0; v < 64; v++) {
      const i = side === "X" ? v : 63 - v, ch = g.board[i], b = cellBtn(c, gr);
      b.style.cssText = "aspect-ratio:1;padding:0;border:0!important;border-radius:2px!important;font-size:22px;line-height:1;color:" + (own(ch) === "X" ? "#e5484d" : "#1d1d1d");
      b.textContent = ch === "-" ? "" : (ch === "A" || ch === "B" ? "♛" : "●");
      b.disabled = !can;
      b.onclick = () => go(i);
      bs.push(b);
    }
    paint();
    const mc = (g.board.match(side === "X" ? /[aA]/g : /[bB]/g) || []).length, fc = (g.board.match(side === "X" ? /[bB]/g : /[aA]/g) || []).length;
    const sc = "Taş: sen " + mc + ", " + c.name + " " + fc;
    if (g.status !== "play") return endMsg(c) + "  " + sc;
    return (can ? (g.s !== "" ? "Aynı taşla atlamaya devam et. " : "Sıra sende. Taşına dokun, sonra hedefe. ") : "Sıra " + c.name + " oyuncusunda. ") + sc;
  }
};

export const PAIR = { ships: ships, reversi: reversi, mancala: mancala, dama: dama };
