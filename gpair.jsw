// Arkadaşla oynanan oyunlar. Her oyun: start (davet verisi), needs (sıra bende mi), render (ekran).
// c: { me, name, g (oyun belgesi), body (alan), upd(veri), tx(fn), toast, el }
const TR = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");
const MARK = { X: "✕", O: "◯" };

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

/* ---------- XOX ---------- */
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function xoxResult(b) {
  for (const l of LINES) if (b[l[0]] !== "-" && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return b[l[0]];
  return b.indexOf("-") < 0 ? "draw" : "";
}

const xox = {
  icon: "❌", label: "XOX",
  intro: (n) => n + " ile XOX oynamak için davet gönder.",
  start: (me) => ({ board: "---------", s: "", turn: me }),
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, mine = g.x === me ? "X" : "O";
    const can = g.status === "play" && g.turn === me;
    const gr = grid(c, 3, 8);
    for (let i = 0; i < 9; i++) {
      const b = cellBtn(c, gr), ch = g.board[i];
      b.style.cssText = "height:88px;font-size:44px;font-weight:700;line-height:1;padding:0;color:var(--lamp)";
      b.textContent = MARK[ch] || "";
      b.disabled = !can || ch !== "-";
      b.onclick = () => {
        const nb = g.board.slice(0, i) + mine + g.board.slice(i + 1);
        const r = xoxResult(nb);
        if (r) c.upd({ board: nb, status: "done", turn: "", winner: r === "draw" ? "draw" : me });
        else c.upd({ board: nb, turn: g.x === me ? g.o : g.x });
      };
    }
    if (g.status !== "play") return endMsg(c);
    return (can ? "Sıra sende. Sen: " : "Sıra " + c.name + " oyuncusunda. Sen: ") + MARK[mine];
  }
};

/* ---------- Dört bağla ---------- */
const W = 7, H = 6;
function c4win(b, ch) {
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (let r = 0; r < H; r++) for (let q = 0; q < W; q++) for (const d of dirs) {
    let k = 0;
    for (; k < 4; k++) {
      const rr = r + d[1] * k, qq = q + d[0] * k;
      if (rr < 0 || rr >= H || qq < 0 || qq >= W || b[rr * W + qq] !== ch) break;
    }
    if (k === 4) return true;
  }
  return false;
}

const c4 = {
  icon: "🔴", label: "Dört Bağla",
  intro: (n) => n + " ile Dört Bağla oynamak için davet gönder.",
  start: (me) => ({ board: "-".repeat(W * H), s: "", turn: me }),
  needs: (g, me) => g.status === "play" && g.turn === me,
  render(c) {
    const g = c.g, me = c.me, mine = g.x === me ? "X" : "O";
    const can = g.status === "play" && g.turn === me;
    const gr = grid(c, W, 4);
    gr.style.background = "#244466";
    gr.style.padding = "6px";
    gr.style.borderRadius = "10px";
    const drop = (col) => {
      if (!can) return;
      let r = H - 1;
      while (r >= 0 && g.board[r * W + col] !== "-") r--;
      if (r < 0) { c.toast("Bu sütun dolu."); return; }
      const i = r * W + col;
      const nb = g.board.slice(0, i) + mine + g.board.slice(i + 1);
      if (c4win(nb, mine)) c.upd({ board: nb, status: "done", turn: "", winner: me });
      else if (nb.indexOf("-") < 0) c.upd({ board: nb, status: "done", turn: "", winner: "draw" });
      else c.upd({ board: nb, turn: g.x === me ? g.o : g.x });
    };
    for (let r = 0; r < H; r++) for (let q = 0; q < W; q++) {
      const b = cellBtn(c, gr), ch = g.board[r * W + q];
      b.style.cssText = "aspect-ratio:1;border-radius:50%!important;padding:0!important;border:0!important;background:" + (ch === "X" ? "#e5484d" : ch === "O" ? "#f0c24b" : "#0f1a2a") + "!important";
      b.setAttribute("aria-label", "Sütun " + (q + 1));
      b.disabled = !can;
      b.onclick = () => drop(q);
    }
    const me2 = mine === "X" ? "🔴" : "🟡";
    if (g.status !== "play") return endMsg(c);
    return (can ? "Sıra sende, bir sütuna dokun. Sen: " : "Sıra " + c.name + " oyuncusunda. Sen: ") + me2;
  }
};

/* ---------- Taş-Kâğıt-Makas (3'e kadar) ---------- */
const SYM = { R: "✊ Taş", P: "✋ Kâğıt", S: "✌️ Makas", "-": "?" };
function rpsWin(a, b) {
  if (a === b) return 0;
  return (a === "R" && b === "S") || (a === "S" && b === "P") || (a === "P" && b === "R") ? 1 : 2;
}

const rps = {
  icon: "✊", label: "Taş-Kâğıt-Makas",
  intro: (n) => n + " ile Taş-Kâğıt-Makas oynamak için davet gönder. 3 tur alan kazanır.",
  start: () => ({ board: "--", s: "0,0,", turn: "" }),
  needs: (g, me) => g.status === "play" && g.board[g.x === me ? 0 : 1] === "-",
  render(c) {
    const g = c.g, me = c.me, idx = g.x === me ? 0 : 1;
    const sc = (g.s || "0,0,").split(",");
    const info = c.el("p", "", "Sen " + (+sc[idx] || 0) + " – " + (+sc[1 - idx] || 0) + " " + c.name + "  (3'e kadar)");
    info.style.cssText = "font-weight:700;margin:0 0 8px";
    c.body.appendChild(info);
    const last = sc[2] || "";
    if (last.length === 2) {
      const l = c.el("p", "", "Son tur: sen " + SYM[last[idx]] + ", " + c.name + " " + SYM[last[1 - idx]]);
      l.style.cssText = "color:var(--mute);font-size:14px;margin:0 0 10px";
      c.body.appendChild(l);
    }
    if (g.status !== "play") return endMsg(c);
    if (g.board[idx] !== "-") return "Seçtin. " + c.name + " bekleniyor…";
    const row = c.el("div", "");
    row.style.cssText = "display:flex;gap:8px";
    ["R", "P", "S"].forEach((ch) => {
      const b = c.el("button", "", SYM[ch]);
      b.type = "button";
      b.style.cssText = "flex:1;padding:16px 4px;font-size:18px;font-weight:700";
      b.onclick = () => c.tx((d) => {
        if (d.status !== "play") return null;
        const i = d.x === me ? 0 : 1;
        if (d.board[i] !== "-") return null;
        const nb = d.board.slice(0, i) + ch + d.board.slice(i + 1);
        if (nb[0] === "-" || nb[1] === "-") return { board: nb };
        const w = rpsWin(nb[0], nb[1]), s2 = (d.s || "0,0,").split(",");
        let a = +s2[0] || 0, z = +s2[1] || 0;
        if (w === 1) a++;
        if (w === 2) z++;
        const out = { board: "--", s: a + "," + z + "," + nb };
        if (a >= 3 || z >= 3) { out.status = "done"; out.winner = a >= 3 ? d.x : d.o; }
        return out;
      });
      row.appendChild(b);
    });
    c.body.appendChild(row);
    return "Bir seçim yap. Aynı anda seçilir, rakip görmez.";
  }
};

/* ---------- Adam Asmaca (davet eden kelimeyi seçer) ---------- */
const hang = {
  icon: "🔤", label: "Adam Asmaca",
  intro: (n) => n + " için 3-15 harflik bir kelime seç. O harf harf tahmin edecek.",
  extra(area, toast, el) {
    const inp = el("input", "");
    inp.placeholder = "Kelime (sadece harf)";
    inp.maxLength = 15;
    inp.autocomplete = "off";
    inp.autocapitalize = "characters";
    inp.style.cssText = "width:100%;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:10px 12px";
    area.appendChild(inp);
    return () => {
      const w = inp.value.trim().toLocaleUpperCase("tr");
      if (!/^[A-ZÇĞİÖŞÜ]{3,15}$/.test(w)) { toast("3-15 harf yaz. Rakam, boşluk ve işaret olmasın."); return ""; }
      return w;
    };
  },
  start: (me, other, w) => ({ board: w, s: "", turn: other }),
  needs: (g, me) => g.status === "play" && g.o === me,
  render(c) {
    const g = c.g, me = c.me, word = g.board || "", got = g.s || "";
    const guesser = g.o === me;
    const wrong = Array.from(got).filter((l) => word.indexOf(l) < 0);
    const faces = ["😀", "🙂", "😐", "😟", "😨", "😰", "💀"];
    const big = c.el("p", "", faces[Math.min(6, wrong.length)] + "  " + Array.from(word).map((l) => (got.indexOf(l) >= 0 || g.status === "done" || !guesser ? l : "_")).join(" "));
    big.style.cssText = "font-size:26px;font-weight:700;letter-spacing:2px;margin:0 0 6px;overflow-wrap:anywhere";
    c.body.appendChild(big);
    const info = c.el("p", "", "Kalan hak: " + (6 - wrong.length) + (wrong.length ? "   Yanlış: " + wrong.join(" ") : ""));
    info.style.cssText = "color:var(--mute);font-size:14px;margin:0 0 10px";
    c.body.appendChild(info);
    if (g.status !== "play") return guesser ? (g.winner === me ? "Kelimeyi buldun! 🎉" : "Hakların bitti. Kelime: " + word) : (g.winner === me ? "Bilemedi, sen kazandın! 🎉" : c.name + " kelimeyi buldu.");
    if (!guesser) return c.name + " tahmin ediyor…";
    const kb = grid(c, 7, 6);
    TR.forEach((l) => {
      const b = cellBtn(c, kb);
      b.textContent = l;
      b.style.cssText = "padding:10px 0;font-size:17px;font-weight:700";
      b.disabled = got.indexOf(l) >= 0;
      b.onclick = () => {
        const ng = got + l;
        const bad = Array.from(ng).filter((x) => word.indexOf(x) < 0).length;
        const won = Array.from(word).every((x) => ng.indexOf(x) >= 0);
        if (won) c.upd({ s: ng, status: "done", winner: me, turn: "" });
        else if (bad >= 6) c.upd({ s: ng, status: "done", winner: g.x, turn: "" });
        else c.upd({ s: ng });
      };
    });
    return "Bir harf seç.";
  }
};

export const PAIR = { xox: xox, rps: rps, c4: c4, hang: hang };
