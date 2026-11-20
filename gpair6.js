// Arkadaşla oynanan oyunlar 6: Resim Tahmin
// board: "KELİME|144 haneli çizim" (0 = boş, 1-5 renk). s: "" = çizim sürüyor, "g0"/"g1" = tahmin aşaması (g sonrası yanlış sayısı)
const other = (g, me) => (g.x === me ? g.o : g.x);
function endMsg(c) {
  const g = c.g;
  if (g.winner === c.me) return "Kazandın! 🎉";
  return "Kaybettin. " + c.name + " kazandı.";
}
const WORDS = ["KEDİ", "KÖPEK", "ARABA", "EV", "AĞAÇ", "GÜNEŞ", "AY", "YILDIZ", "BALIK", "KUŞ", "ÇİÇEK", "ELMA", "MUZ", "BİSİKLET", "UÇAK", "GEMİ", "SAAT", "ŞEMSİYE", "KALP", "DAĞ", "BULUT", "YAĞMUR", "KİTAP", "KALEM", "TELEFON", "MASA", "SANDALYE", "ANAHTAR", "KAPI", "PENCERE", "ÇANTA", "GÖZLÜK", "ŞAPKA", "AYAKKABI", "DONDURMA", "PİZZA", "TAVŞAN", "ASLAN", "KURBAĞA", "KELEBEK"];
const COLS = ["#ffffff", "#111111", "#e5484d", "#4a8fd9", "#3fb06a", "#f0c24b"];
const GN = 12, CS = 20;
let dg = null, dgKey = "", dcol = 1;
const draw = {
  icon: "✏️", label: "Resim Tahmin",
  intro: (n) => n + " ile Resim Tahmin oynamak için davet gönder. Davet gönderen verilen kelimeyi çizer, karşı taraf 6 seçenekten doğrusunu bulur (2 hakkı var). Bulursa tahmin eden, bulamazsa çizen kazanır.",
  start: () => ({ board: WORDS[Math.floor(Math.random() * WORDS.length)] + "|", s: "", turn: "" }),
  needs: (g, me) => g.status === "play" && ((g.s === "" && g.x === me) || (g.s !== "" && g.x !== me)),
  render(c) {
    const g = c.g, me = c.me, drawer = g.x === me;
    const parts = g.board.split("|"), word = parts[0], grid = parts[1] || "";
    const sent = g.s !== "";
    const editing = drawer && !sent && g.status === "play";
    if (editing) { if (dgKey !== g.board || !dg) { dg = new Array(GN * GN).fill("0"); dgKey = g.board; } }
    const cv = c.el("canvas", "", "");
    cv.width = GN * CS; cv.height = GN * CS;
    cv.style.cssText = "display:block;width:100%;max-width:" + (GN * CS) + "px;margin:0 auto 10px;border:2px solid #243650;border-radius:8px;background:#fff;touch-action:none";
    c.body.appendChild(cv);
    const cx = cv.getContext("2d");
    const cells = () => (editing ? dg : (grid || "0".repeat(GN * GN)).split(""));
    function paint() {
      const a = cells();
      for (let i = 0; i < GN * GN; i++) { cx.fillStyle = COLS[Number(a[i]) || 0]; cx.fillRect((i % GN) * CS, Math.floor(i / GN) * CS, CS, CS); }
      cx.strokeStyle = "rgba(0,0,0,.08)"; cx.lineWidth = 1;
      for (let i = 1; i < GN; i++) { cx.beginPath(); cx.moveTo(i * CS, 0); cx.lineTo(i * CS, GN * CS); cx.stroke(); cx.beginPath(); cx.moveTo(0, i * CS); cx.lineTo(GN * CS, i * CS); cx.stroke(); }
    }
    paint();
    if (editing) {
      let down = false;
      const put = (e) => {
        const r = cv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * GN), y = Math.floor((e.clientY - r.top) / r.height * GN);
        if (x < 0 || y < 0 || x >= GN || y >= GN) return;
        dg[y * GN + x] = String(dcol); paint();
      };
      cv.onpointerdown = (e) => { down = true; cv.setPointerCapture(e.pointerId); put(e); };
      cv.onpointermove = (e) => { if (down) put(e); };
      cv.onpointerup = () => { down = false; };
      cv.onpointercancel = cv.onpointerup;
      const pal = c.el("div", "");
      pal.style.cssText = "display:flex;gap:8px;justify-content:center;margin-bottom:10px";
      COLS.forEach((col, i) => {
        const b = c.el("button", "", i === 0 ? "🧽" : "");
        b.type = "button";
        b.style.cssText = "width:42px;height:42px;padding:0;border-radius:50%!important;border:3px solid " + (i === dcol ? "var(--lamp)" : "#556") + "!important;background:" + col + "!important";
        b.onclick = () => { dcol = i; pal.querySelectorAll("button").forEach((x, k) => x.style.setProperty("border-color", k === dcol ? "#f0c24b" : "#556", "important")); };
        pal.appendChild(b);
      });
      c.body.appendChild(pal);
      const row = c.el("div", "");
      row.style.cssText = "display:flex;gap:8px";
      const clr = c.el("button", "", "Temizle"); clr.type = "button"; clr.style.cssText = "flex:1;padding:10px;font-weight:700";
      clr.onclick = () => { dg.fill("0"); paint(); };
      const ok = c.el("button", "", "Gönder"); ok.type = "button"; ok.style.cssText = "flex:1;padding:10px;font-weight:700;background:var(--lamp)!important;color:var(--lamp-ink)!important;border:0!important";
      ok.onclick = () => {
        if (dg.every((x) => x === "0")) { c.toast("Önce bir şeyler çiz."); return; }
        c.upd({ board: word + "|" + dg.join(""), s: "g0", turn: g.o });
      };
      row.appendChild(clr); row.appendChild(ok);
      c.body.appendChild(row);
      return "Çizeceğin kelime: " + word + " ✏️ Parmağınla çiz, bitince Gönder.";
    }
    if (g.status !== "play") return endMsg(c) + "  Kelime: " + word;
    if (drawer) return "Çizimin gönderildi. " + c.name + " tahmin ediyor…";
    if (!sent) return c.name + " çiziyor, bekle…";
    // tahmin eden
    const i0 = WORDS.indexOf(word), opts = [word];
    [7, 13, 19, 25, 31].forEach((k) => opts.push(WORDS[(i0 + k) % WORDS.length]));
    const rot = i0 % 6, shown = opts.map((_, i) => opts[(i + rot) % 6]);
    const wrong = Number(g.s.slice(1)) || 0;
    const gr = c.el("div", "");
    gr.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:8px";
    shown.forEach((w) => {
      const b = c.el("button", "", w);
      b.type = "button"; b.style.cssText = "padding:12px;font-size:16px;font-weight:700";
      b.onclick = () => {
        if (w === word) c.upd({ status: "done", turn: "", winner: me });
        else if (wrong + 1 >= 2) c.upd({ status: "done", turn: "", winner: g.x });
        else c.upd({ s: "g" + (wrong + 1) });
      };
      gr.appendChild(b);
    });
    c.body.appendChild(gr);
    return "Bu resim ne? Kalan hak: " + (2 - wrong);
  }
};

export const PAIR = { draw: draw };
