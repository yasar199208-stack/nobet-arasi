// Arkadaşla oynanan oyunlar 4: Hex, Nokta Kutu, Değirmen
const other = (g, me) => (g.x === me ? g.o : g.x);
function endMsg(c) {
  const g = c.g;
  if (g.winner === c.me) return "Kazandın! 🎉";
  if (g.winner === "draw") return "Berabere.";
  return "Kaybettin. " + c.name + " kazandı.";
}
function box(c, css) {
  const d = c.el("div", "");
  d.style.cssText = css;
  c.body.appendChild(d);
  return d;
}

/* ---------- Hex (7x7) ---------- */
const HN = 7;
function hexNb(i) {
  const r = Math.floor(i / HN), q = i % HN, o = [];
  [[0, 1], [0, -1], [1, 0], [-1, 0], [-1, 1], [1, -1]].forEach((d) => { const rr = r + d[0], qq = q + d[1]; if (rr >= 0 && rr < HN && qq >= 0 && qq < HN) o.push(rr * HN + qq); });
  return o;
}
function hexWin(b, ch) {
  const seen = new Set(), st = [];
  for (let k = 0; k < HN; k++) { const i = ch === "X" ? k : k * HN; if (b[i] === ch) { seen.add(i); st.push(i); } }
  while (st.length) {
    const i = st.pop();
    if (ch === "X" ? Math.floor(i / HN) === HN - 1 : i % HN === HN - 1) return true;
    hexNb(i).forEach((j) => { if (b[j] === ch && !seen.has(j)) { seen.add(j); st.push(j); } });
  }
  return false;
}
const hex = {
  icon: "🔷", label: "Hex",
  intro: (n) => n + " ile Hex oynamak için davet gönder. 🔴 üst kenardan alt kenara, 🔵 sol kenardan sağ kenara bir zincir kurmaya çalışır. Davet gönderen 🔴.",
  start: (me) => ({ board: "-".repeat(HN * HN), s: "", turn: me }),
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, mine = g.x === me ? "X" : "O";
    const can = g.status === "play" && g.turn === me;
    const wrap = box(c, "width:100%;max-width:340px;margin:0 auto;padding-bottom:6px");
    for (let r = 0; r < HN; r++) {
      const row = c.el("div", "");
      row.style.cssText = "display:flex;margin-left:" + (r * 5) + "%;margin-top:" + (r ? "-2.6%" : "0");
      for (let q = 0; q < HN; q++) {
        const i = r * HN + q, ch = g.board[i], b = c.el("button", "", "");
        b.type = "button";
        b.style.cssText = "width:10%;aspect-ratio:1/1.1;padding:0;border:0!important;border-radius:0!important;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:" + (ch === "X" ? "#e5484d" : ch === "O" ? "#4a8fd9" : "#243650") + "!important;outline:none;box-shadow:inset 0 0 0 2px rgba(255,255,255,.12)";
        b.disabled = !can || ch !== "-";
        b.onclick = () => {
          const nb = g.board.slice(0, i) + mine + g.board.slice(i + 1);
          if (hexWin(nb, mine)) c.upd({ board: nb, status: "done", turn: "", winner: me });
          else c.upd({ board: nb, turn: other(g, me) });
        };
        row.appendChild(b);
      }
      wrap.appendChild(row);
    }
    const goal = mine === "X" ? "🔴 Üst ↔ alt kenarı bağla" : "🔵 Sol ↔ sağ kenarı bağla";
    if (g.status !== "play") return endMsg(c);
    return (can ? "Sıra sende. " : "Sıra " + c.name + " oyuncusunda. ") + goal;
  }
};

/* ---------- Nokta Kutu (4x4 kutu) ---------- */
const DB = 4;
// Kenarlar: yatay h(r,c) r=0..4,c=0..3 -> r*4+c (0..19); dikey v(r,c) r=0..3,c=0..4 -> 20 + r*5+c (20..39)
const hE = (r, q) => r * DB + q, vE = (r, q) => 20 + r * (DB + 1) + q;
const boxEdges = (r, q) => [hE(r, q), hE(r + 1, q), vE(r, q), vE(r, q + 1)];
const dots = {
  icon: "⬜", label: "Nokta Kutu",
  intro: (n) => n + " ile Nokta Kutu oynamak için davet gönder. Sırayla iki nokta arasına çizgi çizin; kutuyu tamamlayan kutuyu alır ve bir kez daha oynar. Çok kutu alan kazanır.",
  start: (me) => ({ board: "0".repeat(40), s: "-".repeat(16), turn: me }),
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, mine = g.x === me ? "X" : "O";
    const can = g.status === "play" && g.turn === me;
    const gr = box(c, "display:grid;grid-template-columns:repeat(4,14px minmax(0,1fr)) 14px;grid-template-rows:repeat(4,14px 54px) 14px;gap:0;max-width:340px;margin:0 auto");
    const take = (e) => {
      const nb = g.board.slice(0, e) + "1" + g.board.slice(e + 1);
      let sc = g.s, got = 0;
      for (let r = 0; r < DB; r++) for (let q = 0; q < DB; q++) {
        if (sc[r * DB + q] === "-" && boxEdges(r, q).every((k) => nb[k] === "1")) { sc = sc.slice(0, r * DB + q) + mine + sc.slice(r * DB + q + 1); got++; }
      }
      const o = { board: nb, s: sc };
      if (nb.indexOf("0") < 0) {
        const x = (sc.match(/X/g) || []).length, y = (sc.match(/O/g) || []).length;
        o.status = "done"; o.turn = ""; o.winner = x === y ? "draw" : (x > y ? g.x : g.o);
      } else o.turn = got ? me : other(g, me);
      c.upd(o);
    };
    for (let R = 0; R < 9; R++) for (let Q = 0; Q < 9; Q++) {
      const cell = c.el("button", "", "");
      cell.type = "button";
      let css = "padding:0;border:0!important;border-radius:0!important;background:transparent!important;min-width:0;";
      if (R % 2 === 0 && Q % 2 === 0) { css += "width:14px;height:14px;position:relative;"; cell.disabled = true; cell.style.cssText = css; cell.textContent = ""; const d = c.el("div", ""); d.style.cssText = "width:10px;height:10px;border-radius:50%;background:var(--text);margin:2px"; cell.appendChild(d); }
      else if (R % 2 === 0 || Q % 2 === 0) {
        const e = R % 2 === 0 ? hE(R / 2, (Q - 1) / 2) : vE((R - 1) / 2, Q / 2), on = g.board[e] === "1";
        css += (on ? "background:var(--lamp)!important;" : "background:rgba(127,150,180,.18)!important;") + "margin:" + (R % 2 === 0 ? "2px 0" : "0 2px") + ";border-radius:4px!important;";
        cell.style.cssText = css;
        cell.disabled = on || !can;
        cell.onclick = () => take(e);
      } else {
        const own = g.s[((R - 1) / 2) * DB + (Q - 1) / 2];
        cell.style.cssText = css + "font-size:24px;font-weight:700;color:" + (own === mine ? "#3fb06a" : "#e5484d");
        cell.disabled = true;
        cell.textContent = own === "-" ? "" : (own === mine ? "S" : "R");
      }
      gr.appendChild(cell);
    }
    const x = (g.s.match(new RegExp(mine, "g")) || []).length, y = (g.s.match(new RegExp(mine === "X" ? "O" : "X", "g")) || []).length;
    const sc = "Kutular: sen (S) " + x + " – " + y + " " + c.name + " (R)";
    if (g.status !== "play") return endMsg(c) + "  " + sc;
    return (can ? "Sıra sende, bir çizgiye dokun. " : "Sıra " + c.name + " oyuncusunda. ") + sc;
  }
};

/* ---------- Değirmen (Dokuz Taş) ---------- */
const MP = [];
[[0, 0], [3, 0], [6, 0], [6, 3], [6, 6], [3, 6], [0, 6], [0, 3], [1, 1], [3, 1], [5, 1], [5, 3], [5, 5], [3, 5], [1, 5], [1, 3], [2, 2], [3, 2], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [2, 3]].forEach((p) => MP.push(p));
const MADJ = MP.map((_, i) => {
  const ring = Math.floor(i / 8), k = i % 8, o = [ring * 8 + (k + 1) % 8, ring * 8 + (k + 7) % 8];
  if (k % 2 === 1) { if (ring > 0) o.push(i - 8); if (ring < 2) o.push(i + 8); }
  return o;
});
const MILLS = [];
for (let r = 0; r < 3; r++) for (let s = 0; s < 4; s++) MILLS.push([r * 8 + 2 * s, r * 8 + 2 * s + 1, r * 8 + (2 * s + 2) % 8]);
[1, 3, 5, 7].forEach((k) => MILLS.push([k, k + 8, k + 16]));
const inMill = (b, i, ch) => MILLS.some((m) => m.indexOf(i) >= 0 && m.every((j) => b[j] === ch));
function mState(g) { const p = (g.s || "9,9,0").split(","); return { hx: +p[0], ho: +p[1], rm: p[2] === "1" }; }
let mSel = { key: "", i: -1 };
const mill = {
  icon: "⭕", label: "Değirmen",
  intro: (n) => n + " ile Değirmen oynamak için davet gönder. Önce 9'ar taş koyarsınız, sonra taşları komşu noktaya kaydırırsınız. Üç taşı yan yana dizen (değirmen) rakibin bir taşını alır. 3 taşı kalan her yere uçabilir.",
  start: (me) => ({ board: "-".repeat(24), s: "9,9,0", turn: me }),
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, mine = g.x === me ? "X" : "O", foe = mine === "X" ? "O" : "X";
    const can = g.status === "play" && g.turn === me, st = mState(g);
    const key = g.board + g.s;
    if (mSel.key !== key) mSel = { key: key, i: -1 };
    const hand = (ch) => (ch === "X" ? st.hx : st.ho);
    const onB = (b, ch) => b.split("").filter((x) => x === ch).length;
    const wrap = box(c, "position:relative;width:100%;max-width:340px;aspect-ratio:1;margin:0 auto;background:#1c2b3f;border-radius:10px");
    const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 6 6"); svg.setAttribute("style", "position:absolute;inset:0;width:100%;height:100%");
    const ln = (a, b2) => { const l = document.createElementNS(NS, "line"); l.setAttribute("x1", MP[a][0]); l.setAttribute("y1", MP[a][1]); l.setAttribute("x2", MP[b2][0]); l.setAttribute("y2", MP[b2][1]); l.setAttribute("stroke", "#8da0b6"); l.setAttribute("stroke-width", "0.05"); svg.appendChild(l); };
    MADJ.forEach((a, i) => a.forEach((j) => { if (j > i) ln(i, j); }));
    wrap.appendChild(svg);
    const phasePlace = can && hand(mine) > 0, fly = can && hand(mine) === 0 && onB(g.board, mine) === 3;
    const bs = [];
    function paint() {
      bs.forEach((b, i) => {
        const ch = g.board[i];
        b.style.setProperty("outline", mSel.i === i ? "3px solid var(--lamp)" : "none");
        b.style.setProperty("background", ch === "X" ? "#e5484d" : ch === "O" ? "#4a8fd9" : "#0f1a2a", "important");
      });
    }
    function finish(nb, ns, justMill) {
      // nb: yeni tahta, ns: yeni {hx, ho}
      if (justMill && nb.indexOf(foe) >= 0) {
        c.upd({ board: nb, s: ns.hx + "," + ns.ho + ",1" });
        return;
      }
      endTurn(nb, ns);
    }
    function endTurn(nb, ns) {
      const oppTotal = onB(nb, foe) + (foe === "X" ? ns.hx : ns.ho);
      const oppHand = foe === "X" ? ns.hx : ns.ho;
      let lose = oppTotal < 3;
      if (!lose && oppHand === 0 && oppTotal > 3) {
        lose = !nb.split("").some((ch, i) => ch === foe && MADJ[i].some((j) => nb[j] === "-"));
      }
      const o = { board: nb, s: ns.hx + "," + ns.ho + ",0", turn: other(g, me) };
      if (lose) { o.status = "done"; o.turn = ""; o.winner = me; }
      c.upd(o);
    }
    function go(i) {
      const ch = g.board[i];
      if (st.rm) {
        if (ch !== foe) return;
        const allMill = g.board.split("").every((x, k) => x !== foe || inMill(g.board, k, foe));
        if (inMill(g.board, i, foe) && !allMill) { c.toast("Değirmendeki taş alınamaz."); return; }
        endTurn(g.board.slice(0, i) + "-" + g.board.slice(i + 1), { hx: st.hx, ho: st.ho });
        return;
      }
      const ns = { hx: st.hx, ho: st.ho };
      if (phasePlace) {
        if (ch !== "-") return;
        const nb = g.board.slice(0, i) + mine + g.board.slice(i + 1);
        if (mine === "X") ns.hx--; else ns.ho--;
        finish(nb, ns, inMill(nb, i, mine));
        return;
      }
      if (ch === mine) { mSel = { key: key, i: mSel.i === i ? -1 : i }; paint(); return; }
      if (ch === "-" && mSel.i >= 0 && (fly || MADJ[mSel.i].indexOf(i) >= 0)) {
        const a = g.board.split("");
        a[mSel.i] = "-"; a[i] = mine;
        const nb = a.join("");
        finish(nb, ns, inMill(nb, i, mine));
      }
    }
    MP.forEach((p, i) => {
      const b = c.el("button", "", "");
      b.type = "button";
      b.style.cssText = "position:absolute;left:" + (p[0] / 6 * 90 + 5) + "%;top:" + (p[1] / 6 * 90 + 5) + "%;width:9%;aspect-ratio:1;transform:translate(-50%,-50%);padding:0;border:2px solid #8da0b6!important;border-radius:50%!important";
      b.disabled = !can;
      b.onclick = () => go(i);
      wrap.appendChild(b);
      bs.push(b);
    });
    paint();
    const sc = "Elinde: " + hand(mine) + "   Rakipte: " + hand(foe) + "   Tahtada: sen " + onB(g.board, mine) + ", " + c.name + " " + onB(g.board, foe);
    const col = mine === "X" ? "🔴" : "🔵";
    if (g.status !== "play") return endMsg(c) + "  " + sc;
    if (!can) return "Sıra " + c.name + " oyuncusunda. Sen: " + col + "  " + sc;
    if (st.rm) return "Değirmen yaptın! Rakibin bir taşına dokunup al. " + sc;
    return (phasePlace ? "Boş bir noktaya taş koy. " : fly ? "3 taşın kaldı: taşına dokun, sonra herhangi boş noktaya uç. " : "Taşına dokun, sonra komşu boş noktaya. ") + "Sen: " + col + "  " + sc;
  }
};

export const PAIR = { hex: hex, dots: dots, mill: mill };
