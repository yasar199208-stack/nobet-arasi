// Arkadaşla oynanan oyunlar 3: Satranç, Kelime Düellosu
// Tahta: 64 harf (büyük = beyaz = daveti gönderen, küçük = siyah). s: "KQkq,-" (rok hakları, geçerken alma karesi)
const other = (g, me) => (g.x === me ? g.o : g.x);
function endMsg(c) {
  const g = c.g;
  if (g.winner === c.me) return "Kazandın! 🎉";
  if (g.winner === "draw") return "Berabere (pat).";
  return "Kaybettin. " + c.name + " kazandı.";
}
const GLYPH = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const isW = (ch) => ch >= "A" && ch <= "Z";
const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

function attacked(b, sq, byW) {
  const r = Math.floor(sq / 8), c = sq % 8;
  const at = (rr, cc) => (inb(rr, cc) ? b[rr * 8 + cc] : "-");
  const pr = byW ? r + 1 : r - 1, pch = byW ? "P" : "p";
  if (at(pr, c - 1) === pch || at(pr, c + 1) === pch) return true;
  const n = byW ? "N" : "n", k = byW ? "K" : "k", q = byW ? "Q" : "q", rk = byW ? "R" : "r", bs = byW ? "B" : "b";
  if (KN.some((d) => at(r + d[0], c + d[1]) === n)) return true;
  if (KG.some((d) => at(r + d[0], c + d[1]) === k)) return true;
  return KG.some((d) => {
    let rr = r + d[0], cc = c + d[1];
    while (inb(rr, cc) && b[rr * 8 + cc] === "-") { rr += d[0]; cc += d[1]; }
    if (!inb(rr, cc)) return false;
    const ch = b[rr * 8 + cc], diag = d[0] !== 0 && d[1] !== 0;
    return ch === q || (diag ? ch === bs : ch === rk);
  });
}

function pseudo(b, i, cast, ep) {
  const ch = b[i], w = isW(ch), t = ch.toLowerCase(), r = Math.floor(i / 8), c = i % 8, out = [];
  const enemy = (x) => x !== "-" && isW(x) !== w;
  const add = (rr, cc) => { if (inb(rr, cc)) { const x = b[rr * 8 + cc]; if (x === "-" || enemy(x)) out.push(rr * 8 + cc); } };
  if (t === "p") {
    const d = w ? -1 : 1, start = w ? 6 : 1;
    if (inb(r + d, c) && b[(r + d) * 8 + c] === "-") {
      out.push((r + d) * 8 + c);
      if (r === start && b[(r + 2 * d) * 8 + c] === "-") out.push((r + 2 * d) * 8 + c);
    }
    [-1, 1].forEach((dc) => {
      if (!inb(r + d, c + dc)) return;
      const to = (r + d) * 8 + c + dc;
      if (enemy(b[to]) || to === ep) out.push(to);
    });
  } else if (t === "n") KN.forEach((d) => add(r + d[0], c + d[1]));
  else if (t === "k") {
    KG.forEach((d) => add(r + d[0], c + d[1]));
    const row = w ? 7 : 0;
    if (i === row * 8 + 4 && !attacked(b, i, !w)) {
      const ks = w ? "K" : "k", qs = w ? "Q" : "q", rk = w ? "R" : "r";
      if (cast.indexOf(ks) >= 0 && b[row * 8 + 5] === "-" && b[row * 8 + 6] === "-" && b[row * 8 + 7] === rk && !attacked(b, row * 8 + 5, !w) && !attacked(b, row * 8 + 6, !w)) out.push(row * 8 + 6);
      if (cast.indexOf(qs) >= 0 && b[row * 8 + 3] === "-" && b[row * 8 + 2] === "-" && b[row * 8 + 1] === "-" && b[row * 8] === rk && !attacked(b, row * 8 + 3, !w) && !attacked(b, row * 8 + 2, !w)) out.push(row * 8 + 2);
    }
  } else {
    const dirs = t === "r" ? KG.filter((d) => !d[0] || !d[1]) : t === "b" ? KG.filter((d) => d[0] && d[1]) : KG;
    dirs.forEach((d) => {
      let rr = r + d[0], cc = c + d[1];
      while (inb(rr, cc)) {
        const x = b[rr * 8 + cc];
        if (x === "-") out.push(rr * 8 + cc);
        else { if (enemy(x)) out.push(rr * 8 + cc); break; }
        rr += d[0]; cc += d[1];
      }
    });
  }
  return out;
}

// Hamleyi uygula, yeni tahta ve yeni durum döndür
function apply(b, from, to, cast, ep) {
  const a = b.split(""), ch = a[from], w = isW(ch), t = ch.toLowerCase();
  let nep = "-", nc = cast;
  if (t === "p" && to === ep) a[w ? to + 8 : to - 8] = "-";
  a[to] = ch; a[from] = "-";
  if (t === "p" && Math.abs(to - from) === 16) nep = String((from + to) / 2);
  if (t === "p" && (to < 8 || to >= 56)) a[to] = w ? "Q" : "q";
  if (t === "k" && Math.abs(to - from) === 2) {
    if (to > from) { a[to - 1] = a[to + 1]; a[to + 1] = "-"; } else { a[to + 1] = a[to - 2]; a[to - 2] = "-"; }
  }
  const strip = (s) => { nc = nc.split("").filter((x) => s.indexOf(x) < 0).join(""); };
  if (t === "k") strip(w ? "KQ" : "kq");
  [[63, "K"], [56, "Q"], [7, "k"], [0, "q"]].forEach((x) => { if (from === x[0] || to === x[0]) strip(x[1]); });
  return { board: a.join(""), s: (nc || "-") + "," + nep };
}

function legal(b, i, cast, ep) {
  const w = isW(b[i]);
  return pseudo(b, i, cast, ep).filter((to) => {
    const r = apply(b, i, to, cast, ep).board;
    return !attacked(r, r.indexOf(w ? "K" : "k"), !w);
  });
}
function anyLegal(b, w, cast, ep) {
  for (let i = 0; i < 64; i++) if (b[i] !== "-" && isW(b[i]) === w && legal(b, i, cast, ep).length) return true;
  return false;
}
const inCheck = (b, w) => attacked(b, b.indexOf(w ? "K" : "k"), !w);
function parse(s) { const p = (s || "KQkq,-").split(","); return { cast: p[0] === "-" ? "" : p[0], ep: p[1] === "-" ? -1 : Number(p[1]) }; }

let sel = { key: "", i: -1 };
const chess = {
  icon: "♟️", label: "Satranç",
  intro: (n) => n + " ile Satranç oynamak için davet gönder. Daveti gönderen beyaz başlar. Piyon sona gelince otomatik vezir olur.",
  start: (me) => ({ board: "rnbqkbnr" + "pppppppp" + "-".repeat(32) + "PPPPPPPP" + "RNBQKBNR", s: "KQkq,-", turn: me }),
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, white = g.x === me;
    const can = g.status === "play" && g.turn === me;
    const st = parse(g.s), key = g.board + g.s;
    if (sel.key !== key) sel = { key: key, i: -1 };
    const gr = c.el("div", "");
    gr.style.cssText = "display:grid;grid-template-columns:repeat(8,1fr);gap:0;border:2px solid #3b2a1a;border-radius:6px;overflow:hidden";
    c.body.appendChild(gr);
    const bs = [];
    const targets = () => (sel.i >= 0 && g.board[sel.i] !== "-" && isW(g.board[sel.i]) === white ? legal(g.board, sel.i, st.cast, st.ep) : []);
    function paint() {
      const tg = targets();
      for (let v = 0; v < 64; v++) {
        const i = white ? v : 63 - v, dark = (Math.floor(v / 8) + v % 8) % 2 === 1;
        bs[v].style.setProperty("background", sel.i === i ? "#f0c24b" : tg.indexOf(i) >= 0 ? "#6fcf97" : dark ? "#b58863" : "#f0d9b5", "important");
      }
    }
    function go(i) {
      const tg = targets();
      if (tg.indexOf(i) >= 0) {
        const r = apply(g.board, sel.i, i, st.cast, st.ep), nw = !white, ns = parse(r.s);
        const o = { board: r.board, s: r.s, turn: other(g, me) };
        if (!anyLegal(r.board, nw, ns.cast, ns.ep)) {
          o.status = "done"; o.turn = "";
          o.winner = inCheck(r.board, nw) ? me : "draw";
        }
        c.upd(o);
        return;
      }
      const ch = g.board[i];
      if (ch !== "-" && isW(ch) === white) { sel = { key: key, i: sel.i === i ? -1 : i }; paint(); }
      else { sel = { key: key, i: -1 }; paint(); }
    }
    for (let v = 0; v < 64; v++) {
      const i = white ? v : 63 - v, ch = g.board[i], b = c.el("button", "", "");
      b.type = "button";
      b.style.cssText = "aspect-ratio:1;padding:0;border:0!important;border-radius:0!important;font-size:28px;line-height:1;color:" + (ch !== "-" && isW(ch) ? "#fff" : "#111") + ";text-shadow:" + (ch !== "-" && isW(ch) ? "0 0 2px #000,0 0 2px #000,0 0 1px #000" : "none");
      b.textContent = ch === "-" ? "" : GLYPH[ch.toLowerCase()] + "︎";
      b.disabled = !can;
      b.onclick = () => go(i);
      gr.appendChild(b);
      bs.push(b);
    }
    paint();
    if (g.status !== "play") return endMsg(c);
    const chk = can && inCheck(g.board, white);
    return (can ? "Sıra sende" + (chk ? " — ŞAH! " : ". ") : "Sıra " + c.name + " oyuncusunda. ") + "Sen: " + (white ? "beyaz ⚪" : "siyah ⚫");
  }
};

/* ---------- Kelime Düellosu ---------- */
const WL = ["KALEM", "KİTAP", "ARABA", "BAHAR", "ÇİÇEK", "DENİZ", "DOLAP", "DÜNYA", "ELMAS", "FİDAN", "GÜNEŞ", "HAYAL", "İNSAN", "KAPAK", "KÖPRÜ", "LİMON", "MASAL", "MERAK", "NEHİR", "ORMAN", "PİLOT", "RADYO", "SAHİL", "SABAH", "TAKVİM", "ZAMAN", "BULUT", "DEFTER", "FENER", "GÖLGE", "LAMBA", "MEYVE", "NÖBET", "ŞEKER", "TEPSİ", "UYKU", "VAPUR", "YAZAR", "ÇANTA", "SİREN", "ÇAYIR", "DAĞCI", "KOLAY", "ZEKİ"].filter((w) => Array.from(w).length === 5);
const TRK = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");
function feedback(guess, word) {
  const g = Array.from(guess), w = Array.from(word), res = g.map(() => 0), left = {};
  w.forEach((ch, i) => { if (g[i] === ch) res[i] = 2; else left[ch] = (left[ch] || 0) + 1; });
  g.forEach((ch, i) => { if (!res[i] && left[ch] > 0) { res[i] = 1; left[ch]--; } });
  return res;
}
function wparse(g) { const p = (g.board || "").split("|"); return { word: p[0], gx: p[1] ? p[1].split(",") : [], go: p[2] ? p[2].split(",") : [] }; }
let wTyped = "", wKey = "";
const wduel = {
  icon: "🔠", label: "Kelime Düellosu",
  intro: (n) => n + " ile Kelime Düellosu oynamak için davet gönder. İkiniz de aynı 5 harfli kelimeyi bulmaya çalışırsınız (6 hak). Önce bulan kazanır. Yeşil: doğru yer, sarı: yanlış yer.",
  start: () => ({ board: WL[Math.floor(Math.random() * WL.length)] + "||", s: "", turn: "" }),
  needs: () => false,
  render(c) {
    const g = c.g, me = c.me, iX = g.x === me, w = wparse(g);
    const mine = iX ? w.gx : w.go, theirs = iX ? w.go : w.gx;
    const over = g.status !== "play", done = mine.length >= 6 || mine.indexOf(w.word) >= 0;
    if (wKey !== g.board) { wKey = g.board; wTyped = ""; }
    const COL = ["#3b4a60", "#d9a82b", "#3fb06a"];
    const mk = (css) => { const d = c.el("div", ""); d.style.cssText = css; c.body.appendChild(d); return d; };
    const title = (t) => { const p = c.el("p", "", t); p.style.cssText = "margin:0 0 4px;font-weight:700;font-size:14px;color:var(--mute);text-align:center"; c.body.appendChild(p); };
    function grid(rows, letters, typedRow) {
      const gr = mk("display:grid;grid-template-columns:repeat(5,1fr);gap:4px;max-width:" + (letters ? 260 : 110) + "px;margin:0 auto 8px");
      const cells = [];
      for (let r = 0; r < 6; r++) {
        const gs = rows[r] ? Array.from(rows[r]) : [], fb = rows[r] ? feedback(rows[r], w.word) : null;
        cells.push([]);
        for (let k = 0; k < 5; k++) {
          const e = c.el("div", "", letters ? (gs[k] || "") : "");
          e.style.cssText = "aspect-ratio:1;display:grid;place-items:center;border-radius:4px;font-weight:700;font-size:20px;color:#fff;background:" + (fb ? COL[fb[k]] : "#1c2b3f");
          gr.appendChild(e); cells[r].push(e);
        }
      }
      return cells;
    }
    title("Sen");
    const mc = grid(mine, true);
    title(c.name + " (harfler gizli)");
    grid(theirs, false);
    const typedRow = mine.length;
    function paint() {
      if (typedRow > 5 || done || over) return;
      const t = Array.from(wTyped);
      for (let k = 0; k < 5; k++) mc[typedRow][k].textContent = t[k] || "";
    }
    if (!over && !done) {
      const kb = mk("display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:8px");
      TRK.forEach((l) => {
        const b = c.el("button", "", l);
        b.type = "button"; b.style.cssText = "padding:9px 0;font-size:16px;font-weight:700";
        b.onclick = () => { if (Array.from(wTyped).length < 5) { wTyped += l; paint(); } };
        kb.appendChild(b);
      });
      const row = mk("display:flex;gap:8px;margin-top:8px");
      const del = c.el("button", "", "⌫ Sil"); del.type = "button"; del.style.cssText = "flex:1;padding:10px;font-weight:700";
      del.onclick = () => { wTyped = Array.from(wTyped).slice(0, -1).join(""); paint(); };
      const ok = c.el("button", "", "Gönder"); ok.type = "button"; ok.style.cssText = "flex:1;padding:10px;font-weight:700;background:var(--lamp)!important;color:var(--lamp-ink)!important;border:0!important";
      ok.onclick = () => {
        if (Array.from(wTyped).length !== 5) { c.toast("5 harf yaz."); return; }
        const guess = wTyped; wTyped = "";
        c.tx((d) => {
          if (d.status !== "play") return null;
          const p = wparse(d), arr = d.x === me ? p.gx : p.go;
          if (arr.length >= 6 || arr.indexOf(p.word) >= 0) return null;
          arr.push(guess);
          const out = { board: p.word + "|" + p.gx.join(",") + "|" + p.go.join(",") };
          if (guess === p.word) { out.status = "done"; out.winner = me; }
          else if (p.gx.length >= 6 && p.go.length >= 6) { out.status = "done"; out.winner = "draw"; }
          return out;
        });
      };
      row.appendChild(del); row.appendChild(ok);
      paint();
    }
    if (over) return endMsg(c) + "  Kelime: " + w.word;
    if (done) return "Haklarını bitirdin. " + c.name + " bekleniyor…";
    return "5 harfli kelimeyi bul. Hak: " + (6 - mine.length);
  }
};

export const PAIR = { chess: chess, wduel: wduel };
