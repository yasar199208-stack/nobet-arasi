// Oda oyunu: "Doğru mu yanlış mı?" Herkes aynı soruyu yanıtlar, doğru bilenler puan alır.
// Oyunu başlatan kişinin telefonu oyunu yönetir. Sorular bu dosyadadır, internetten çekilmez.
const Q = [
  ["Türkiye'nin en yüksek dağı Ağrı Dağı'dır.", true],
  ["Türkiye'nin başkenti İstanbul'dur.", false],
  ["Van Gölü, Türkiye'nin en büyük gölüdür.", true],
  ["İstanbul 1453'te fethedildi.", true],
  ["Cumhuriyet 29 Ekim 1923'te ilan edildi.", true],
  ["Acil çağrı merkezinin numarası 112'dir.", true],
  ["Yangın anında asansör kullanılmaz.", true],
  ["Elektrik yangınına su ile müdahale edilmemelidir.", true],
  ["Dünya, Güneş'in etrafında döner.", true],
  ["Güneş bir gezegendir.", false],
  ["Ay, kendi ışığıyla parlar.", false],
  ["Işık, sesten daha hızlı yayılır.", true],
  ["Su, deniz seviyesinde 100 derecede kaynar.", true],
  ["Bir üçgenin iç açıları toplamı 180 derecedir.", true],
  ["Satranç tahtasında 64 kare vardır.", true],
  ["Bir futbol takımı sahada 11 oyuncuyla oynar.", true],
  ["Yetişkin bir insanda 206 kemik vardır.", true],
  ["Kalbin görevi kanı vücuda pompalamaktır.", true],
  ["Balinalar memelidir.", true],
  ["Yarasa bir kuş türüdür.", false],
  ["Bütün kuşlar uçabilir.", false],
  ["Örümcekler böcektir.", false],
  ["Bal arıları bal üretir.", true],
  ["Penguenler Kuzey Kutbu'nda yaşar.", false],
  ["Dünyanın en büyük okyanusu Pasifik'tir.", true],
  ["Mısır piramitleri Afrika kıtasındadır.", true],
  ["Japonya'nın başkenti Pekin'dir.", false],
  ["Karadeniz, Türkiye'nin kuzeyindedir.", true],
  ["Ege Denizi, Türkiye'nin doğusundadır.", false],
  ["Pamukkale Denizli'dedir.", true],
  ["Kapadokya, Nevşehir çevresindedir.", true],
  ["Selimiye Camii'ni Mimar Sinan yapmıştır.", true],
  ["Altın bir metaldir.", true],
  ["Demir, mıknatıs tarafından çekilir.", true],
  ["Elektrik akımının birimi amperdir.", true],
  ["Ses, boşlukta yayılır.", false],
  ["Havanın çoğunu oksijen oluşturur.", false],
  ["Gökkuşağında yedi renk sayılır.", true],
  ["Mevlana Konya'da yatmaktadır.", true],
  ["Dünyada yedi kıta vardır (yaygın sınıflandırma).", true]
];
const N = 10;
const T_Q = window.__vgFast ? 900 : 15000;
const T_R = window.__vgFast ? 500 : 4500;

const css = document.createElement("style");
css.textContent = ".vgm{position:fixed;left:0;right:0;top:0;height:100dvh;background:var(--bg);color:var(--text);z-index:38;display:flex;flex-direction:column}" +
  ".vgh{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line)}.vgh h2{margin:0;font-size:18px;flex:1}" +
  ".vgh button{background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:9px 12px;font-size:15px;cursor:pointer}" +
  ".vgb{flex:1;overflow:auto;padding:16px 14px;display:flex;flex-direction:column;gap:14px}" +
  ".vgb .vgd{border:1px solid var(--line);border-left:3px solid var(--lamp);border-radius:10px;padding:10px 12px;background:var(--panel);font-size:15px;line-height:1.45}" +
  ".vgb .vgq{font-size:22px;font-weight:700;line-height:1.35;text-align:center;padding:14px 4px}" +
  ".vgb .vgt{text-align:center;font-size:30px;font-weight:700;color:var(--lamp)}" +
  ".vgb .vgn{text-align:center;color:var(--mute);font-size:14px}" +
  ".vgb .vgy{display:flex;gap:10px}.vgb .vgy button{flex:1;font-size:20px;font-weight:700;padding:18px 8px;border-radius:14px;border:2px solid var(--line);background:var(--panel);color:var(--text);cursor:pointer}" +
  ".vgb .vgy button.sel{border-color:var(--lamp);box-shadow:0 0 0 2px var(--lamp)}" +
  ".vgb .vgo{background:var(--lamp);color:var(--lamp-ink);border:0;border-radius:12px;padding:15px;font-size:18px;font-weight:700;cursor:pointer}" +
  ".vgb .vgs{display:flex;flex-direction:column;gap:6px}.vgb .vgs div{display:flex;justify-content:space-between;border:1px solid var(--line);border-radius:10px;padding:9px 12px;background:var(--panel)}" +
  ".vgb .vgs div.me{border-color:var(--lamp)}.vgb .vgres{text-align:center;font-size:20px;font-weight:700}";
document.head.appendChild(css);

function el(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function cleanScores(o) {
  const r = {};
  if (o && typeof o === "object") Object.keys(o).slice(0, 12).forEach((k) => { if (typeof o[k] === "number") r[k] = o[k]; });
  return r;
}
function cleanNames(o) {
  const r = {};
  if (o && typeof o === "object") Object.keys(o).slice(0, 12).forEach((k) => { if (typeof o[k] === "string") r[k] = o[k].slice(0, 20); });
  return r;
}

export function createGame(api) {
  let ov = null, G = null, timer = null, tick = null, wd = null;

  function clearT() { clearTimeout(timer); clearInterval(tick); }
  function nm(id) { return id === api.me ? "Sen" : ((G && G.nm && G.nm[id]) || api.name(id)); }
  function names() {
    const o = {};
    o[api.me] = api.nick;
    api.peers().forEach((id) => { o[id] = api.name(id); });
    return o;
  }

  function open() { show(); render(); }
  function hide() { if (ov) { ov.remove(); ov = null; } }
  function show() {
    if (ov) return;
    ov = el("div", "vgm");
    const h = el("div", "vgh");
    const back = el("button", "", "←"); back.type = "button"; back.onclick = hide;
    h.appendChild(back); h.appendChild(el("h2", "", "🎮 Doğru mu, yanlış mı?"));
    ov.appendChild(h); ov.appendChild(el("div", "vgb"));
    document.body.appendChild(ov);
  }

  function scoreboard(b) {
    const ids = Object.keys(G.s).sort((a, c) => G.s[c] - G.s[a]);
    Object.keys(G.nm || {}).forEach((id) => { if (ids.indexOf(id) < 0) ids.push(id); });
    if (ids.indexOf(api.me) < 0) ids.push(api.me);
    const w = el("div", "vgs");
    const medal = ["🥇", "🥈", "🥉"];
    ids.forEach((id, i) => {
      const r = el("div", id === api.me ? "me" : "");
      r.appendChild(el("span", "", (G.phase === "end" && medal[i] ? medal[i] + " " : "") + nm(id)));
      r.appendChild(el("b", "", String(G.s[id] || 0)));
      w.appendChild(r);
    });
    b.appendChild(w);
  }

  function render() {
    if (!ov) return;
    const b = ov.querySelector(".vgb");
    b.textContent = "";
    if (!G) {
      b.appendChild(el("div", "vgd", "Herkes aynı ifadeyi görür ve 15 saniyede \"Doğru\" ya da \"Yanlış\" der. Doğru bilen 1 puan alır. " + N + " soru sürer. Oyunu başlatınca odadaki herkesin ekranında açılır."));
      const go = el("button", "vgo", "▶️ Oyunu başlat (" + N + " soru)"); go.type = "button"; go.onclick = startMaster;
      b.appendChild(go);
      return;
    }
    if (G.phase === "wait") { b.appendChild(el("div", "vgd", "Oyun başlıyor, ilk soru geliyor…")); return; }
    if (G.phase === "q" || G.phase === "r") {
      b.appendChild(el("div", "vgn", "Soru " + (G.n + 1) + " / " + (G.qs.length || N)));
      b.appendChild(el("div", "vgq", Q[G.q][0]));
    }
    if (G.phase === "q") {
      const t = el("div", "vgt", Math.max(0, Math.ceil((G.deadline - Date.now()) / 1000)) + " sn");
      b.appendChild(t);
      const y = el("div", "vgy");
      [[true, "✅ Doğru"], [false, "❌ Yanlış"]].forEach((x) => {
        const bt = el("button", G.my === x[0] ? "sel" : "", x[1]); bt.type = "button";
        bt.onclick = () => answer(x[0]);
        y.appendChild(bt);
      });
      b.appendChild(y);
      if (G.my !== undefined) b.appendChild(el("div", "vgn", "Cevabın alındı. Diğerleri bekleniyor…"));
    } else if (G.phase === "r") {
      b.appendChild(el("div", "vgres", "Doğru cevap: " + (G.ok ? "✅ Doğru" : "❌ Yanlış")));
      b.appendChild(el("div", "vgres", G.my === undefined ? "⏱ Cevap vermedin" : (G.my === G.ok ? "🎉 Bildin! +1" : "😅 Bilemedin")));
      scoreboard(b);
      b.appendChild(el("div", "vgn", "Sıradaki soru birazdan…"));
    } else if (G.phase === "end") {
      b.appendChild(el("div", "vgres", G.stopped ? "Oyun durdu (başlatan odadan ayrılmış olabilir)" : "🏁 Oyun bitti"));
      scoreboard(b);
      const go = el("button", "vgo", "🔁 Yeni oyun başlat"); go.type = "button"; go.onclick = startMaster;
      b.appendChild(go);
    }
  }

  function startTick() {
    clearInterval(tick);
    tick = setInterval(() => {
      if (!ov || !G || G.phase !== "q") return;
      const t = ov.querySelector(".vgt");
      if (t) t.textContent = Math.max(0, Math.ceil((G.deadline - Date.now()) / 1000)) + " sn";
    }, 250);
  }
  function watch() {
    clearInterval(wd);
    wd = setInterval(() => {
      if (G && !G.master && G.phase !== "end" && Date.now() - G.last > T_Q + T_R + 15000) {
        G.phase = "end"; G.stopped = true; clearInterval(wd); clearInterval(tick); render();
      }
    }, 3000);
  }

  // ---- Oyunu yöneten telefon ----
  function startMaster() {
    if (G && G.phase !== "end") return;
    clearT();
    const qs = shuffle(Q.map((_, i) => i)).slice(0, N);
    G = { g: Math.random().toString(36).slice(2, 8), by: api.me, qs: qs, n: -1, phase: "wait", ans: {}, s: {}, nm: names(), master: true, last: Date.now() };
    api.all(JSON.stringify({ t: "start", g: G.g, qs: qs }));
    show();
    nextQ();
  }
  function nextQ() {
    if (!G || !G.master) return;
    G.n++;
    if (G.n >= G.qs.length) { finish(); return; }
    G.ans[G.n] = {}; G.pend = false; G.my = undefined;
    G.q = G.qs[G.n]; G.phase = "q"; G.deadline = Date.now() + T_Q;
    api.all(JSON.stringify({ t: "q", g: G.g, n: G.n, i: G.q }));
    render(); startTick();
    clearTimeout(timer);
    timer = setTimeout(reveal, T_Q + 1200);
  }
  function reveal() {
    clearTimeout(timer);
    if (!G || !G.master || G.phase !== "q") return;
    const a = G.ans[G.n] || {}, ok = Q[G.q][1];
    Object.keys(a).forEach((id) => { if (a[id] === ok) G.s[id] = (G.s[id] || 0) + 1; });
    G.nm = names(); G.ok = ok; G.phase = "r";
    api.all(JSON.stringify({ t: "r", g: G.g, n: G.n, ok: ok, s: G.s, nm: G.nm }));
    clearInterval(tick);
    render();
    timer = setTimeout(nextQ, T_R);
  }
  function finish() {
    G.phase = "end"; G.nm = names();
    clearT();
    api.all(JSON.stringify({ t: "end", g: G.g, s: G.s, nm: G.nm }));
    render();
  }
  function checkAll() {
    if (!G || !G.master || G.phase !== "q" || G.pend) return;
    const a = G.ans[G.n] || {};
    if (Object.keys(a).length >= api.peers().length + 1) {
      G.pend = true;
      clearTimeout(timer);
      timer = setTimeout(reveal, 400);
    }
  }

  function answer(v) {
    if (!G || G.phase !== "q" || G.my !== undefined) return;
    G.my = v;
    if (G.master) { G.ans[G.n][api.me] = v; checkAll(); }
    else api.send(G.by, JSON.stringify({ t: "a", g: G.g, n: G.n, v: v }));
    render();
  }

  // ---- Gelen mesajlar ----
  function onMsg(pid, raw) {
    let m;
    try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m !== "object" || typeof m.g !== "string") return;
    if (m.t === "a") {
      if (!G || !G.master || G.phase !== "q" || m.g !== G.g || m.n !== G.n || typeof m.v !== "boolean") return;
      const a = G.ans[G.n];
      if (a[pid] !== undefined) return;
      a[pid] = m.v;
      checkAll();
      return;
    }
    if (m.t === "start") {
      if (G && G.master && G.phase !== "end") return;
      if (!Array.isArray(m.qs) || m.qs.length < 1 || m.qs.length > N || !m.qs.every((i) => Number.isInteger(i) && i >= 0 && i < Q.length)) return;
      clearT();
      G = { g: m.g, by: pid, qs: m.qs, n: -1, phase: "wait", s: {}, nm: {}, master: false, last: Date.now() };
      api.toast("🎮 " + api.name(pid) + " oyun başlattı!");
      show(); render(); watch();
      return;
    }
    if (!G && m.t === "q") {
      G = { g: m.g, by: pid, qs: [], n: -1, phase: "wait", s: {}, nm: {}, master: false, last: Date.now() };
      show(); watch();
    }
    if (!G || G.master || G.by !== pid || m.g !== G.g) return;
    G.last = Date.now();
    if (m.t === "q") {
      if (!Number.isInteger(m.n) || !Number.isInteger(m.i) || m.i < 0 || m.i >= Q.length) return;
      G.n = m.n; G.q = m.i; G.my = undefined; G.phase = "q"; G.deadline = Date.now() + T_Q;
      render(); startTick();
    } else if (m.t === "r") {
      G.ok = !!m.ok; G.s = cleanScores(m.s); G.nm = cleanNames(m.nm); G.phase = "r";
      clearInterval(tick);
      render();
    } else if (m.t === "end") {
      G.s = cleanScores(m.s); G.nm = cleanNames(m.nm); G.phase = "end";
      clearInterval(tick); clearInterval(wd);
      render();
    }
  }

  function destroy() { clearT(); clearInterval(wd); hide(); G = null; }
  return { open: open, onMsg: onMsg, destroy: destroy };
}
