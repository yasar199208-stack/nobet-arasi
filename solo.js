// Tek başına oyunlar. Her oyun start(body, el, act) ile çizilir; temizleme fonksiyonu döndürebilir.
function best(key, val) {
  try {
    const old = parseInt(localStorage.getItem(key) || "0", 10) || 0;
    if (val !== undefined) {
      if (!old || (key === "nb_mem" ? val < old : val > old)) { localStorage.setItem(key, String(val)); return val; }
    }
    return old;
  } catch (e) { return val || 0; }
}

function note(body, el, txt) {
  const p = el("p", "", txt);
  p.style.cssText = "margin:0 0 10px;font-size:15px";
  body.appendChild(p);
  return p;
}

/* ---------- Hafıza kartları ---------- */
function memory(body, el, act) {
  const ICONS = ["🚓", "🔦", "🛡️", "🚨", "☕", "🌙", "📻", "🔑"];
  const info = note(body, el, "");
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px";
  body.appendChild(gr);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px";
  body.appendChild(row);
  let cards, open, moves, found, lock, timer;

  function say() {
    const b = best("nb_mem");
    info.textContent = "Hamle: " + moves + "   Eşleşen: " + found + "/8" + (b ? "   En iyi: " + b : "");
  }
  function start() {
    clearTimeout(timer);
    cards = ICONS.concat(ICONS).map((v) => ({ v: v, up: false, ok: false, r: Math.random() })).sort((a, b) => a.r - b.r);
    open = []; moves = 0; found = 0; lock = false;
    draw(); say();
  }
  function draw() {
    gr.textContent = "";
    cards.forEach((c, i) => {
      const b = el("button", "", c.up || c.ok ? c.v : "❔");
      b.type = "button";
      b.style.cssText = "height:68px;font-size:32px;padding:0;" + (c.ok ? "opacity:.5" : "");
      b.onclick = () => flip(i);
      gr.appendChild(b);
    });
  }
  function flip(i) {
    const c = cards[i];
    if (lock || c.up || c.ok) return;
    c.up = true; open.push(i);
    if (open.length === 2) {
      moves++;
      const a = cards[open[0]], d = cards[open[1]];
      if (a.v === d.v) {
        a.ok = d.ok = true; found++; open = [];
        if (found === 8) { const b = best("nb_mem", moves); info.textContent = "Bitti! " + moves + " hamle. En iyi: " + b; draw(); return; }
      } else {
        lock = true;
        timer = setTimeout(() => { a.up = d.up = false; open = []; lock = false; draw(); }, 800);
      }
    }
    draw(); if (found < 8) say();
  }
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => clearTimeout(timer);
}

/* ---------- 2048 ---------- */
function g2048(body, el, act) {
  const COL = { 0: "#1d2c42", 2: "#3b5878", 4: "#4a6d94", 8: "#c98f00", 16: "#d9822b", 32: "#e0603a", 64: "#e5484d", 128: "#c9a227", 256: "#c9a227", 512: "#b8962e", 1024: "#a98b2f", 2048: "#f0c24b" };
  const info = note(body, el, "");
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px;background:#0f1a2a;border-radius:10px;margin-bottom:10px;touch-action:none;user-select:none";
  body.appendChild(gr);
  const pad = el("div", "");
  pad.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:220px;margin:0 auto 10px";
  body.appendChild(pad);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px";
  body.appendChild(row);
  let b, score, over;

  function add() {
    const e = [];
    b.forEach((v, i) => { if (!v) e.push(i); });
    if (e.length) b[e[Math.floor(Math.random() * e.length)]] = Math.random() < 0.9 ? 2 : 4;
  }
  function draw() {
    gr.textContent = "";
    b.forEach((v) => {
      const t = el("div", "", v ? String(v) : "");
      t.style.cssText = "aspect-ratio:1;display:grid;place-items:center;border-radius:8px;font-weight:700;color:#fff;font-size:" + (v > 999 ? 20 : v > 99 ? 24 : 30) + "px;background:" + (COL[v] || "#f0c24b");
      gr.appendChild(t);
    });
    const bs = best("nb_2048");
    info.textContent = over ? "Oyun bitti. Skor: " + score : "Skor: " + score + (bs ? "   En iyi: " + bs : "");
  }
  function line(a) {
    const n = a.filter((x) => x), out = [];
    for (let i = 0; i < n.length; i++) {
      if (n[i] === n[i + 1]) { out.push(n[i] * 2); score += n[i] * 2; i++; } else out.push(n[i]);
    }
    while (out.length < 4) out.push(0);
    return out;
  }
  function move(d) {
    if (over) return;
    const old = b.join(",");
    for (let k = 0; k < 4; k++) {
      const idx = [0, 1, 2, 3].map((j) => (d < 2 ? k * 4 + j : j * 4 + k));
      if (d % 2) idx.reverse();
      const res = line(idx.map((i) => b[i]));
      idx.forEach((i, j) => { b[i] = res[j]; });
    }
    if (b.join(",") === old) return;
    add();
    best("nb_2048", score);
    over = !b.some((v, i) => !v || (i % 4 < 3 && v === b[i + 1]) || (i < 12 && v === b[i + 4]));
    draw();
  }
  // d: 0 sola, 1 sağa, 2 yukarı, 3 aşağı
  function start() { b = new Array(16).fill(0); score = 0; over = false; add(); add(); draw(); }

  [["", null], ["⬆️", 2], ["", null], ["⬅️", 0], ["⬇️", 3], ["➡️", 1]].forEach((x) => {
    const bt = el("button", "", x[0]);
    bt.type = "button";
    bt.style.cssText = "padding:12px 0;font-size:22px" + (x[1] === null ? ";visibility:hidden" : "");
    if (x[1] !== null) bt.onclick = () => move(x[1]);
    pad.appendChild(bt);
  });
  let sx = 0, sy = 0;
  gr.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  gr.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : 0); else move(dy > 0 ? 3 : 2);
  }, { passive: true });
  const key = (e) => {
    const m = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 };
    if (m[e.key] !== undefined) { e.preventDefault(); move(m[e.key]); }
  };
  document.addEventListener("keydown", key);
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => document.removeEventListener("keydown", key);
}

/* ---------- Kelime bulmaca (5 harf, 6 hak) ---------- */
const WORDS = ("KALEM KİTAP MASAL DENİZ BULUT ÇİÇEK GÜNEŞ ARABA BALIK ÇOCUK DOLAP ELMAS FİDAN HAVUZ İNSAN KAPAK KÖPEK LİMON MERAK NÖBET ORMAN PİLOT RADYO SABAH TAVUK UZMAN VAPUR YARIN ZAMAN BAHAR CEVAP DÜNYA EKMEK FIRIN HABER ÇANTA FİKİR GÜZEL HAYAT LAMBA MEYVE NEFES PAMUK ŞEKER SOKAK TARLA YAZAR ZEMİN BAKIR CADDE FENER GÖLGE KALIN KURAL MASUM NAZAR ÖDEME PERDE RAKAM SAKİN TEMİZ VATAN YALAN ZİRVE AKŞAM BEKÇİ ÇELİK DALGA ESNEK GEÇİT KORKU MESAİ SAHİL UYARI").split(" ").filter((w) => Array.from(w).length === 5);

function word(body, el, act) {
  const info = note(body, el, "");
  const gr = el("div", "");
  gr.style.cssText = "display:grid;grid-template-rows:repeat(6,1fr);gap:6px;margin-bottom:12px";
  body.appendChild(gr);
  const kb = el("div", "");
  body.appendChild(kb);
  const row = el("div", "");
  row.style.cssText = "display:flex;gap:8px;margin-top:10px";
  body.appendChild(row);
  const keys = {};
  let target, tries, cur, done;

  function paint(c, st) { c.style.background = st === 2 ? "#3fb06a" : st === 1 ? "#c9a227" : "#3a4a5e"; c.style.color = "#fff"; }
  function drawRows() {
    gr.textContent = "";
    for (let r = 0; r < 6; r++) {
      const line = el("div", "");
      line.style.cssText = "display:grid;grid-template-columns:repeat(5,1fr);gap:6px";
      const g = tries[r] || (r === tries.length ? cur : "");
      for (let i = 0; i < 5; i++) {
        const c = el("div", "", Array.from(g)[i] || "");
        c.style.cssText = "aspect-ratio:1;max-height:52px;display:grid;place-items:center;border:1px solid var(--line);border-radius:6px;font-size:22px;font-weight:700";
        if (tries[r]) paint(c, grade(tries[r])[i]);
        line.appendChild(c);
      }
      gr.appendChild(line);
    }
  }
  function grade(g) {
    const a = Array.from(g), t = Array.from(target), res = [0, 0, 0, 0, 0], left = {};
    a.forEach((ch, i) => { if (ch === t[i]) res[i] = 2; else left[t[i]] = (left[t[i]] || 0) + 1; });
    a.forEach((ch, i) => { if (res[i] !== 2 && left[ch] > 0) { res[i] = 1; left[ch]--; } });
    return res;
  }
  function submit() {
    if (done || Array.from(cur).length !== 5) return;
    const g = cur, res = grade(g);
    Array.from(g).forEach((ch, i) => { if (!keys[ch] || res[i] > keys[ch].st) keys[ch] = { st: res[i] }; });
    tries.push(g); cur = "";
    if (g === target) { done = true; info.textContent = "Buldun! 🎉 " + tries.length + ". denemede."; }
    else if (tries.length === 6) { done = true; info.textContent = "Olmadı. Kelime: " + target; }
    else info.textContent = "Kalan hak: " + (6 - tries.length);
    drawRows(); drawKb();
  }
  function type(ch) { if (!done && Array.from(cur).length < 5) { cur += ch; drawRows(); } }
  function del() { if (!done) { cur = Array.from(cur).slice(0, -1).join(""); drawRows(); } }
  function drawKb() {
    kb.textContent = "";
    ["ERTYUIOPĞÜ", "ASDFGHJKLŞİ", "ZCVBNMÖÇ"].forEach((rw, ri) => {
      const l = el("div", "");
      l.style.cssText = "display:flex;gap:4px;justify-content:center;margin-bottom:4px";
      Array.from(rw).forEach((ch) => {
        const b = el("button", "", ch);
        b.type = "button";
        b.style.cssText = "flex:1;min-width:0;padding:12px 0;font-size:15px;font-weight:700";
        if (keys[ch]) paint(b, keys[ch].st);
        b.onclick = () => type(ch);
        l.appendChild(b);
      });
      if (ri === 2) {
        const e = el("button", "", "Gir"); e.type = "button"; e.style.cssText = "flex:1.6;padding:12px 0;font-size:14px;font-weight:700"; e.onclick = submit;
        const s = el("button", "", "⌫"); s.type = "button"; s.style.cssText = "flex:1.4;padding:12px 0;font-size:16px;font-weight:700"; s.onclick = del;
        l.appendChild(e); l.appendChild(s);
      }
      kb.appendChild(l);
    });
  }
  function start() {
    target = WORDS[Math.floor(Math.random() * WORDS.length)];
    tries = []; cur = ""; done = false;
    Object.keys(keys).forEach((k) => delete keys[k]);
    info.textContent = "5 harfli kelimeyi bul. Yeşil: doğru yer, sarı: yanlış yer, gri: yok.";
    drawRows(); drawKb();
  }
  row.appendChild(act("Yeni kelime", start));
  start();
}

export const SOLO = {
  memory: { group: "Zeka", icon: "🧠", label: "Hafıza kartları", start: memory },
  g2048: { group: "Zeka", icon: "🔢", label: "2048", start: g2048 },
  word: { group: "Zeka", icon: "🔤", label: "Kelime bulmaca", start: word }
};
