// Zeka oyunları 15: Satranç 3D (aynı telefonda 2 kişilik, perspektifli 3D tahta ve taşlar)
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function bump(k) { try { localStorage.setItem(k, String(best(k) + 1)); } catch (e) {} }

function chess3d(body, el, act) {
  const W = 360, H = 450, TOP = 74, BOT = 404, CWT = 34, CWB = 44;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const SYM = { wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙", bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟" };
  const PL = ["r", "n", "b", "q", "k", "b", "n", "r"];
  const opp = (c) => (c === "w" ? "b" : "w");
  const NAMEC = { w: "Beyaz", b: "Siyah" };

  function initial() {
    const b = new Array(64).fill(null);
    for (let c = 0; c < 8; c++) { b[c] = "b" + PL[c]; b[8 + c] = "bp"; b[48 + c] = "wp"; b[56 + c] = "w" + PL[c]; }
    return { b: b, turn: "w", ep: -1, cast: { wk: 1, wq: 1, bk: 1, bq: 1 }, last: null, caps: { w: [], b: [] }, half: 0 };
  }
  function attacked(b, sq, by) {
    const r = sq >> 3, c = sq & 7;
    const pr = by === "w" ? r + 1 : r - 1;
    for (const dc of [-1, 1]) { const cc = c + dc; if (pr >= 0 && pr < 8 && cc >= 0 && cc < 8 && b[pr * 8 + cc] === by + "p") return true; }
    for (const d of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) {
      const rr = r + d[0], cc = c + d[1];
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === by + "n") return true;
    }
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === by + "k") return true;
    }
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const diag = d[0] && d[1];
      let rr = r + d[0], cc = c + d[1];
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        const q = b[rr * 8 + cc];
        if (q) { if (q[0] === by && (q[1] === "q" || q[1] === (diag ? "b" : "r"))) return true; break; }
        rr += d[0]; cc += d[1];
      }
    }
    return false;
  }
  function pseudo(st, sq) {
    const b = st.b, p = b[sq];
    if (!p) return [];
    const col = p[0], t = p[1], r = sq >> 3, c = sq & 7, out = [], o = opp(col);
    const add = (to, ex) => out.push(Object.assign({ f: sq, t: to }, ex || {}));
    if (t === "p") {
      const d = col === "w" ? -1 : 1, start = col === "w" ? 6 : 1, lastR = col === "w" ? 0 : 7, r1 = r + d;
      if (r1 >= 0 && r1 < 8) {
        if (!b[r1 * 8 + c]) {
          add(r1 * 8 + c, r1 === lastR ? { pr: 1 } : null);
          if (r === start && !b[(r + 2 * d) * 8 + c]) add((r + 2 * d) * 8 + c, { dbl: 1 });
        }
        for (const dc of [-1, 1]) {
          const cc = c + dc;
          if (cc < 0 || cc > 7) continue;
          const to = r1 * 8 + cc, q = b[to];
          if (q && q[0] !== col) add(to, r1 === lastR ? { pr: 1 } : null);
          else if (!q && to === st.ep) add(to, { ep: 1 });
        }
      }
    } else if (t === "n" || t === "k") {
      const offs = t === "n" ? [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      offs.forEach((d) => {
        const rr = r + d[0], cc = c + d[1];
        if (rr < 0 || rr > 7 || cc < 0 || cc > 7) return;
        const q = b[rr * 8 + cc];
        if (!q || q[0] !== col) add(rr * 8 + cc);
      });
      if (t === "k") {
        const row = col === "w" ? 7 : 0;
        if (sq === row * 8 + 4 && !attacked(b, sq, o)) {
          if (st.cast[col + "k"] && b[row * 8 + 7] === col + "r" && !b[row * 8 + 5] && !b[row * 8 + 6] && !attacked(b, row * 8 + 5, o) && !attacked(b, row * 8 + 6, o)) add(row * 8 + 6, { castle: "k" });
          if (st.cast[col + "q"] && b[row * 8] === col + "r" && !b[row * 8 + 1] && !b[row * 8 + 2] && !b[row * 8 + 3] && !attacked(b, row * 8 + 3, o) && !attacked(b, row * 8 + 2, o)) add(row * 8 + 2, { castle: "q" });
        }
      }
    } else {
      const dirs = t === "r" ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : t === "b" ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      dirs.forEach((d) => {
        let rr = r + d[0], cc = c + d[1];
        while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
          const q = b[rr * 8 + cc];
          if (q) { if (q[0] !== col) add(rr * 8 + cc); break; }
          add(rr * 8 + cc);
          rr += d[0]; cc += d[1];
        }
      });
    }
    return out;
  }
  function legal(st, sq) {
    const p = st.b[sq];
    if (!p) return [];
    const col = p[0];
    return pseudo(st, sq).filter((mv) => {
      const nb = st.b.slice();
      if (mv.ep) nb[mv.t + (col === "w" ? 8 : -8)] = null;
      nb[mv.t] = nb[mv.f]; nb[mv.f] = null;
      const ks = nb.indexOf(col + "k");
      return ks >= 0 && !attacked(nb, ks, opp(col));
    });
  }
  function allLegal(st) {
    const out = [];
    for (let i = 0; i < 64; i++) if (st.b[i] && st.b[i][0] === st.turn) legal(st, i).forEach((m) => out.push(m));
    return out;
  }
  function inCheck(st) { const ks = st.b.indexOf(st.turn + "k"); return ks >= 0 && attacked(st.b, ks, opp(st.turn)); }
  function apply(st, mv, pt) {
    const b = st.b.slice(), p = b[mv.f], col = p[0], caps = { w: st.caps.w.slice(), b: st.caps.b.slice() };
    let cap = b[mv.t];
    if (mv.ep) { const cs = mv.t + (col === "w" ? 8 : -8); cap = b[cs]; b[cs] = null; }
    if (cap) caps[cap[0]].push(cap);
    b[mv.t] = mv.pr ? col + (pt || "q") : p; b[mv.f] = null;
    if (mv.castle) { const row = col === "w" ? 7 : 0; if (mv.castle === "k") { b[row * 8 + 5] = b[row * 8 + 7]; b[row * 8 + 7] = null; } else { b[row * 8 + 3] = b[row * 8]; b[row * 8] = null; } }
    const cast = Object.assign({}, st.cast);
    if (p[1] === "k") { cast[col + "k"] = 0; cast[col + "q"] = 0; }
    if (mv.f === 63 || mv.t === 63) cast.wk = 0;
    if (mv.f === 56 || mv.t === 56) cast.wq = 0;
    if (mv.f === 7 || mv.t === 7) cast.bk = 0;
    if (mv.f === 0 || mv.t === 0) cast.bq = 0;
    return { b: b, turn: opp(col), ep: mv.dbl ? (mv.f + mv.t) / 2 : -1, cast: cast, last: { f: mv.f, t: mv.t }, caps: caps, half: p[1] === "p" || cap ? 0 : st.half + 1 };
  }
  function deadDraw(st) {
    const rest = st.b.filter((x) => x && x[1] !== "k");
    return rest.length === 0 || (rest.length === 1 && (rest[0][1] === "n" || rest[0][1] === "b"));
  }

  let st = initial(), hist = [], sel = -1, targets = [], promo = null, over = null, anim = null, flip = false, auto = false, tm = 0, dead = false, raf, last;
  const info = el("p", "", "");
  info.style.cssText = "margin:0 0 4px;font-size:16px;font-weight:700";
  body.appendChild(info);
  const sub = el("p", "", "");
  sub.style.cssText = "margin:0 0 6px;font-size:13px;color:var(--mute);min-height:2.6em";
  body.appendChild(sub);
  const cvs = el("canvas", "");
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.cssText = "display:block;width:100%;max-width:360px;margin:0 auto 10px;touch-action:none;user-select:none;border-radius:12px";
  body.appendChild(cvs);
  const ctx = cvs.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const P = (gx, gy) => {
    const v = gy / 8, cw = CWT + (CWB - CWT) * v;
    return [W / 2 + (gx - 4) * cw, TOP + (BOT - TOP) * v, cw];
  };
  function inv(px, py) {
    const v = (py - TOP) / (BOT - TOP), cw = CWT + (CWB - CWT) * v;
    return [(px - W / 2) / cw + 4, v * 8];
  }
  const disp = (sq) => { const r = sq >> 3, c = sq & 7; return flip ? [7 - r, 7 - c] : [r, c]; };
  const undisp = (dr, dc) => (flip ? (7 - dr) * 8 + (7 - dc) : dr * 8 + dc);
  function poly(pts, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fill();
  }

  function drawPiece(p, x, gy, cw, lift) {
    const col = p[0], t = p[1], u = cw * 1.02, y = gy - lift * u;
    const pal = col === "w" ? ["#e6d7b0", "#fffaf0", "#8f7d55"] : ["#3b3b48", "#85859a", "#08080c"];
    ctx.fillStyle = "rgba(0,0,0,.32)";
    ctx.beginPath(); ctx.ellipse(x + u * 0.06, gy, u * 0.36, u * 0.11, 0, 0, 7); ctx.fill();
    const grad = (hw) => {
      const g = ctx.createLinearGradient(x - hw * u, 0, x + hw * u, 0);
      g.addColorStop(0, pal[0]); g.addColorStop(0.3, pal[1]); g.addColorStop(0.7, pal[0]); g.addColorStop(1, pal[2]);
      return g;
    };
    const bodyP = (pts) => {
      let hw = 0;
      pts.forEach((q) => { hw = Math.max(hw, q[0]); });
      ctx.fillStyle = grad(hw);
      ctx.beginPath();
      ctx.moveTo(x + pts[0][0] * u, y - pts[0][1] * u);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(x + pts[i][0] * u, y - pts[i][1] * u);
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(x - pts[i][0] * u, y - pts[i][1] * u);
      ctx.closePath(); ctx.fill();
    };
    const ball = (bx, by, r) => {
      const g = ctx.createRadialGradient(bx - r * 0.35, by - r * 0.4, r * 0.1, bx, by, r);
      g.addColorStop(0, pal[1]); g.addColorStop(0.55, pal[0]); g.addColorStop(1, pal[2]);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill();
    };
    ctx.fillStyle = pal[0]; ctx.beginPath(); ctx.ellipse(x, y - 0.02 * u, 0.37 * u, 0.1 * u, 0, 0, 7); ctx.fill();
    if (t === "p") {
      bodyP([[0.34, 0.02], [0.34, 0.09], [0.22, 0.16], [0.13, 0.4], [0.21, 0.46], [0.2, 0.5]]);
      ball(x, y - 0.63 * u, 0.18 * u);
    } else if (t === "r") {
      bodyP([[0.36, 0.02], [0.36, 0.1], [0.25, 0.18], [0.2, 0.6], [0.31, 0.68], [0.31, 0.92]]);
      ctx.fillStyle = pal[1]; ctx.beginPath(); ctx.ellipse(x, y - 0.92 * u, 0.31 * u, 0.07 * u, 0, 0, 7); ctx.fill();
      ctx.fillStyle = pal[2];
      ctx.fillRect(x - 0.13 * u, y - 0.99 * u, 0.07 * u, 0.09 * u); ctx.fillRect(x + 0.06 * u, y - 0.99 * u, 0.07 * u, 0.09 * u);
    } else if (t === "b") {
      bodyP([[0.34, 0.02], [0.34, 0.1], [0.22, 0.18], [0.14, 0.5], [0.23, 0.58], [0.14, 0.62]]);
      const g = ctx.createRadialGradient(x - 0.06 * u, y - 0.88 * u, 0.02 * u, x, y - 0.8 * u, 0.28 * u);
      g.addColorStop(0, pal[1]); g.addColorStop(0.55, pal[0]); g.addColorStop(1, pal[2]);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - 0.8 * u, 0.17 * u, 0.26 * u, 0, 0, 7); ctx.fill();
      ball(x, y - 1.1 * u, 0.06 * u);
      ctx.strokeStyle = pal[2]; ctx.lineWidth = Math.max(1, u * 0.04);
      ctx.beginPath(); ctx.moveTo(x + 0.01 * u, y - 0.93 * u); ctx.lineTo(x + 0.1 * u, y - 0.8 * u); ctx.stroke();
    } else if (t === "q") {
      bodyP([[0.38, 0.02], [0.38, 0.1], [0.25, 0.18], [0.15, 0.62], [0.3, 0.9], [0.3, 0.96]]);
      [-0.25, -0.125, 0, 0.125, 0.25].forEach((o, i) => ball(x + o * u, y - (1.0 + (i === 2 ? 0.1 : i % 2 === 0 ? 0.04 : 0)) * u, 0.065 * u));
    } else if (t === "k") {
      bodyP([[0.38, 0.02], [0.38, 0.1], [0.26, 0.18], [0.16, 0.66], [0.3, 0.92], [0.28, 1.0]]);
      ctx.fillStyle = grad(0.14);
      ctx.fillRect(x - 0.04 * u, y - 1.36 * u, 0.08 * u, 0.36 * u);
      ctx.fillRect(x - 0.13 * u, y - 1.25 * u, 0.26 * u, 0.08 * u);
    } else {
      const dir = col === "w" ? 1 : -1;
      const pts = [[-0.3, 0.02], [0.3, 0.02], [0.3, 0.1], [0.2, 0.16], [0.24, 0.45], [0.2, 0.7], [0.1, 0.9], [-0.02, 1.0], [-0.1, 0.92], [-0.3, 0.62], [-0.32, 0.5], [-0.2, 0.45], [-0.08, 0.5], [-0.14, 0.4], [-0.2, 0.16], [-0.3, 0.1]];
      ctx.fillStyle = grad(0.32);
      ctx.beginPath();
      pts.forEach((q, i) => { const px = x + q[0] * u * dir, py = y - q[1] * u; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = pal[2]; ctx.beginPath(); ctx.arc(x - 0.1 * u * dir, y - 0.78 * u, 0.035 * u, 0, 7); ctx.fill();
    }
  }

  function render() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1a2540"); bg.addColorStop(0.55, "#2d3f6b"); bg.addColorStop(1, "#141b30");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const c1 = P(0, 0), c2 = P(8, 0), c3 = P(8, 8), c4 = P(0, 8);
    poly([[c4[0] - 9, c4[1]], [c3[0] + 9, c3[1]], [c3[0] + 9, c3[1] + 18], [c4[0] - 9, c4[1] + 18]], "#3b2412");
    poly([[c1[0] - 9, c1[1] - 7], [c2[0] + 9, c2[1] - 7], [c3[0] + 9, c3[1]], [c4[0] - 9, c4[1]]], "#6b4524");
    const ksq = inCheck(st) && !over || (over && over.mate) ? st.b.indexOf(st.turn + "k") : -1;
    for (let dr = 0; dr < 8; dr++) for (let dc = 0; dc < 8; dc++) {
      const a = P(dc, dr), b = P(dc + 1, dr), c = P(dc + 1, dr + 1), d = P(dc, dr + 1), sq = undisp(dr, dc);
      poly([a, b, c, d], (dr + dc) % 2 ? "#a9794b" : "#ecd9b0");
      if (st.last && (st.last.f === sq || st.last.t === sq)) poly([a, b, c, d], "rgba(255,225,70,.38)");
      if (sq === sel) poly([a, b, c, d], "rgba(70,190,255,.55)");
      if (sq === ksq) poly([a, b, c, d], "rgba(235,50,50,.55)");
    }
    ctx.fillStyle = "#e8d9b8"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
    for (let i = 0; i < 8; i++) {
      const f = String.fromCharCode(97 + (flip ? 7 - i : i)), p = P(i + 0.5, 8);
      ctx.fillText(f, p[0], p[1] + 13);
      const q = P(0, i + 0.5);
      ctx.fillText(String(flip ? i + 1 : 8 - i), q[0] - 14, q[1] + 3);
    }
    targets.forEach((mv) => {
      const d = disp(mv.t), p = P(d[1] + 0.5, d[0] + 0.5), cap = st.b[mv.t] || mv.ep;
      if (cap) { ctx.strokeStyle = "rgba(235,40,40,.9)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p[0], p[1], p[2] * 0.4, p[2] * 0.28, 0, 0, 7); ctx.stroke(); }
      else { ctx.fillStyle = "rgba(40,190,90,.85)"; ctx.beginPath(); ctx.ellipse(p[0], p[1], p[2] * 0.16, p[2] * 0.11, 0, 0, 7); ctx.fill(); }
    });
    for (let dr = 0; dr < 8; dr++) for (let dc = 0; dc < 8; dc++) {
      const sq = undisp(dr, dc), p = st.b[sq];
      if (!p || (anim && anim.t === sq)) continue;
      const q = P(dc + 0.5, dr + 0.5);
      const lift = sq === sel ? 0.12 + Math.abs(Math.sin(tm * 6)) * 0.1 : 0;
      drawPiece(p, q[0], q[1], q[2], lift);
    }
    if (anim) {
      const k = Math.min(1, anim.tm / anim.dur), e = k * k * (3 - 2 * k);
      const a = disp(anim.f), b = disp(anim.t);
      const gx = a[1] + (b[1] - a[1]) * e + 0.5, gy = a[0] + (b[0] - a[0]) * e + 0.5, q = P(gx, gy);
      drawPiece(anim.p, q[0], q[1], q[2], Math.sin(k * Math.PI) * 0.5);
    }
    if (over) {
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 190, W, 70);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 24px sans-serif"; ctx.fillText(over.text, W / 2, 232);
    }
  }
  function status() {
    const cap = (c) => st.caps[c].slice().sort().map((x) => SYM[x]).join("");
    sub.textContent = "Alınan taşlar → Beyaz: " + (cap("w") || "-") + "   Siyah: " + (cap("b") || "-") + "   |   Skor Beyaz " + best("nb_ch3_w") + " - " + best("nb_ch3_b") + " Siyah";
    if (over) info.textContent = over.text;
    else info.textContent = (st.turn === "w" ? "⚪ Beyaz" : "⚫ Siyah") + " oynuyor" + (inCheck(st) ? " — ŞAH!" : "");
    undoB.disabled = !hist.length || !!anim;
    autoB.textContent = "Otomatik çevir: " + (auto ? "Açık" : "Kapalı");
  }
  function evaluate() {
    over = null;
    const ms = allLegal(st), chk = inCheck(st);
    if (!ms.length) {
      if (chk) { const w = opp(st.turn); over = { mate: true, text: "Şah mat! " + NAMEC[w] + " kazandı 🏆" }; bump(w === "w" ? "nb_ch3_w" : "nb_ch3_b"); }
      else over = { text: "Pat — berabere" };
    } else if (deadDraw(st)) over = { text: "Yetersiz taş — berabere" };
    else if (st.half >= 100) over = { text: "50 hamle kuralı — berabere" };
  }
  function commit(mv, pt) {
    hist.push(st);
    const p = st.b[mv.f];
    st = apply(st, mv, pt);
    anim = { p: mv.pr ? p : p, f: mv.f, t: mv.t, tm: 0, dur: 0.3 };
    if (mv.pr) anim.p = st.b[mv.t];
    sel = -1; targets = []; promo = null; promoRow.style.display = "none";
    evaluate();
    status();
  }
  function tap(sq) {
    if (anim || over || promo) return;
    const mv = sel >= 0 ? targets.find((m) => m.t === sq) : null;
    if (mv) {
      if (mv.pr) { promo = mv; promoRow.style.display = "flex"; sel = -1; targets = []; return; }
      commit(mv); return;
    }
    const p = st.b[sq];
    if (p && p[0] === st.turn) { sel = sq; targets = legal(st, sq); }
    else { sel = -1; targets = []; }
  }
  function pickSq(e) {
    const rc = cvs.getBoundingClientRect();
    const px = (e.clientX - rc.left) * W / rc.width, py = (e.clientY - rc.top) * H / rc.height;
    const q = inv(px, py), tc = Math.floor(q[0]), tr = Math.floor(q[1]);
    const tileSq = tr >= 0 && tr < 8 && tc >= 0 && tc < 8 ? undisp(tr, tc) : -1;
    if (tileSq >= 0 && sel >= 0 && !st.b[tileSq] && targets.some((m) => m.t === tileSq)) return tileSq;
    let bestSq = -1, bd = 1e9;
    for (let dr = 0; dr < 8; dr++) for (let dc = 0; dc < 8; dc++) {
      const sq = undisp(dr, dc), p = st.b[sq];
      if (!p) continue;
      const b = P(dc + 0.5, dr + 0.5), h = (p[1] === "k" ? 1.4 : p[1] === "q" ? 1.15 : p[1] === "p" ? 0.8 : 1.05) * b[2];
      if (Math.abs(px - b[0]) > b[2] * 0.42 || py < b[1] - h || py > b[1] + b[2] * 0.15) continue;
      const d = Math.abs(py - (b[1] - h * 0.4)) + Math.abs(px - b[0]) * 0.3;
      if (d < bd) { bd = d; bestSq = sq; }
    }
    return bestSq >= 0 ? bestSq : tileSq;
  }
  cvs.onpointerdown = (e) => { const sq = pickSq(e); if (sq >= 0) tap(sq); else if (!anim) { sel = -1; targets = []; } };

  const promoRow = el("div", "");
  promoRow.style.cssText = "display:none;gap:8px;flex-wrap:wrap;margin-bottom:8px";
  [["q", "♕ Vezir"], ["r", "♖ Kale"], ["b", "♗ Fil"], ["n", "♘ At"]].forEach((x) => {
    const b = act(x[1], () => { if (promo) commit(promo, x[0]); }, "min-width:0");
    promoRow.appendChild(b);
  });
  body.appendChild(promoRow);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  body.appendChild(row);
  const undoB = act("↶ Geri al", () => {
    if (anim || !hist.length) return;
    st = hist.pop(); sel = -1; targets = []; promo = null; promoRow.style.display = "none";
    evaluate();
    if (auto) flip = st.turn === "b";
    status();
  });
  const flipB = act("🔄 Çevir", () => { flip = !flip; });
  const autoB = act("Otomatik çevir: Kapalı", () => { auto = !auto; if (auto) flip = st.turn === "b"; status(); });
  const newB = act("Yeni oyun", () => {
    if (hist.length && !over && !confirm("Oyun silinsin mi?")) return;
    st = initial(); hist = []; sel = -1; targets = []; promo = null; promoRow.style.display = "none"; over = null; anim = null; flip = false;
    status();
  });
  [undoB, flipB, autoB, newB].forEach((b) => { b.style.minWidth = "0"; row.appendChild(b); });
  const hint = el("p", "", "İki kişi aynı telefonda sırayla oynar: Beyaz önce başlar. Taşına dokun, yeşil noktalardan birine dokunarak oyna (kırmızı halka = taş alırsın). Rok, geçerken alma, vezir/kale/fil/at terfisi, şah, mat ve pat kuralları tamam. 🔄 ile tahtayı karşı oyuncuya çevirebilir, \"Otomatik çevir\" ile her hamlede kendiliğinden döndürebilirsin.");
  hint.style.cssText = "margin:8px 0 0;color:var(--mute);font-size:13px";
  body.appendChild(hint);

  function loop(t) {
    if (dead) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t; tm += dt;
    if (anim) {
      anim.tm += dt;
      if (anim.tm >= anim.dur) { anim = null; if (auto && !over) flip = st.turn === "b"; status(); }
    }
    render();
    raf = requestAnimationFrame(loop);
  }
  status();
  last = performance.now();
  raf = requestAnimationFrame(loop);
  return () => { dead = true; cancelAnimationFrame(raf); };
}

export const SOLO = {
  chess3d: { group: "Zeka", icon: "♟️", label: "Satranç 3D (2 kişi)", start: chess3d }
};
