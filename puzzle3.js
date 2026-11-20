// Zeka oyunları 3: Hızlı Matematik, Sıralı Hafıza, Bilgi Yarışması, Adam Asmaca (tek)
const rand = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
function best(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
function hi(k, v) { const o = best(k); if (v > o) { try { localStorage.setItem(k, String(v)); } catch (e) {} return v; } return o; }
function line(body, el, txt) {
  const p = el("p", "", txt || "");
  p.style.cssText = "margin:0 0 10px;font-size:15px";
  body.appendChild(p);
  return p;
}
function gridOf(body, el, cols, gap) {
  const g = el("div", "");
  g.style.cssText = "display:grid;grid-template-columns:repeat(" + cols + ",1fr);gap:" + gap + "px;margin-bottom:10px";
  body.appendChild(g);
  return g;
}
function rowOf(body, el) {
  const r = el("div", "");
  r.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:8px";
  body.appendChild(r);
  return r;
}

/* ---------- Hızlı Matematik (60 sn) ---------- */
function math(body, el, act) {
  const info = line(body, el);
  const q = el("p", "", "");
  q.style.cssText = "font-size:36px;font-weight:700;text-align:center;margin:12px 0";
  body.appendChild(q);
  const ch = gridOf(body, el, 2, 8);
  const row = rowOf(body, el);
  let score, left, timer, ans, over;
  function say() { info.textContent = (over ? "Süre bitti! " : "") + "Skor: " + score + "   Süre: " + left + " sn   En iyi: " + best("nb_math") + "  (yanlış: -3 sn)"; }
  function mk() {
    const t = rand(3);
    let a, b, r, s;
    if (t === 0) { a = rand(40) + 5; b = rand(40) + 5; r = a + b; s = "+"; }
    else if (t === 1) { a = rand(50) + 20; b = rand(a - 1) + 1; r = a - b; s = "−"; }
    else { a = rand(11) + 2; b = rand(11) + 2; r = a * b; s = "×"; }
    q.textContent = a + " " + s + " " + b + " = ?";
    ans = r;
    const o = new Set([r]);
    while (o.size < 4) { const w = r + rand(21) - 10; if (w >= 0) o.add(w); }
    ch.textContent = "";
    shuffle(Array.from(o)).forEach((v) => {
      const b2 = el("button", "", String(v));
      b2.type = "button";
      b2.style.cssText = "padding:16px 0;font-size:22px;font-weight:700";
      b2.onclick = () => {
        if (over) return;
        if (v === ans) score++; else left = Math.max(0, left - 3);
        if (left <= 0) { finish(); return; }
        mk(); say();
      };
      ch.appendChild(b2);
    });
  }
  function finish() { over = true; clearInterval(timer); hi("nb_math", score); ch.textContent = ""; q.textContent = "🏁 " + score; say(); }
  function start() {
    clearInterval(timer);
    score = 0; left = 60; over = false; mk(); say();
    timer = setInterval(() => { left--; if (left <= 0) { left = 0; finish(); } else say(); }, 1000);
  }
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => clearInterval(timer);
}

/* ---------- Sıralı Hafıza (sayı dizisi) ---------- */
function seq(body, el, act) {
  const info = line(body, el);
  const big = el("p", "", "");
  big.style.cssText = "font-size:40px;font-weight:700;text-align:center;letter-spacing:6px;min-height:56px;margin:8px 0;color:var(--lamp)";
  body.appendChild(big);
  const pad = gridOf(body, el, 5, 6);
  const row = rowOf(body, el);
  let n, code, typed, phase, timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function say(t) { info.textContent = t + "   En iyi: " + best("nb_seq"); }
  function show() {
    phase = "show"; typed = "";
    code = ""; for (let i = 0; i < n; i++) code += rand(10);
    big.textContent = code;
    say("Seviye " + (n - 2) + ": rakamları ezberle (" + n + " hane)");
    later(() => { phase = "type"; big.textContent = "_".repeat(n); say("Şimdi yaz"); }, 900 + n * 450);
  }
  function key(d) {
    if (phase !== "type") return;
    typed += d;
    big.textContent = typed + "_".repeat(n - typed.length);
    if (typed.length < n) return;
    if (typed === code) { n++; phase = "wait"; say("Doğru! 🎉"); later(show, 700); }
    else { phase = "over"; hi("nb_seq", n - 3); big.textContent = code; say("Yanlış! Ulaştığın seviye: " + (n - 3)); }
  }
  for (let d = 0; d <= 9; d++) {
    const b = el("button", "", String(d));
    b.type = "button"; b.style.cssText = "padding:14px 0;font-size:20px;font-weight:700";
    b.onclick = () => key(String(d));
    pad.appendChild(b);
  }
  function start() { timers.forEach(clearTimeout); timers = []; n = 3; show(); }
  row.appendChild(act("Yeniden başla", start));
  start();
  return () => timers.forEach(clearTimeout);
}

/* ---------- Bilgi Yarışması (genel kültür) ---------- */
const QS = [
  ["Türkiye'nin başkenti neresidir?", "Ankara", "İstanbul", "İzmir", "Bursa"],
  ["Türkiye Cumhuriyeti hangi yıl ilan edildi?", "1923", "1919", "1920", "1938"],
  ["Tamamı Türkiye sınırları içinde kalan en uzun nehir hangisidir?", "Kızılırmak", "Fırat", "Sakarya", "Yeşilırmak"],
  ["Türkiye'nin en yüksek dağı hangisidir?", "Ağrı Dağı", "Erciyes", "Uludağ", "Kaçkar"],
  ["Dünyanın en büyük okyanusu hangisidir?", "Pasifik", "Atlas", "Hint", "Arktik"],
  ["Su deniz seviyesinde kaç derecede kaynar?", "100", "90", "80", "120"],
  ["Güneş Sistemi'nin en büyük gezegeni hangisidir?", "Jüpiter", "Satürn", "Neptün", "Dünya"],
  ["Mona Lisa tablosunu kim yapmıştır?", "Leonardo da Vinci", "Michelangelo", "Picasso", "Van Gogh"],
  ["Everest Dağı hangi dağ silsilesindedir?", "Himalayalar", "Alpler", "Andlar", "Kayalık Dağlar"],
  ["İstanbul hangi yıl fethedildi?", "1453", "1071", "1299", "1517"],
  ["Türkiye kaç ilden oluşur?", "81", "76", "85", "79"],
  ["Yetişkin bir insanda kaç kemik vardır?", "206", "150", "300", "180"],
  ["Hangi gezegene Kızıl Gezegen denir?", "Mars", "Venüs", "Merkür", "Jüpiter"],
  ["Altının element simgesi nedir?", "Au", "Ag", "Fe", "Go"],
  ["Suyun kimyasal formülü nedir?", "H2O", "CO2", "O2", "NaCl"],
  ["Bir üçgenin iç açıları toplamı kaç derecedir?", "180", "90", "360", "270"],
  ["Ay'a ilk ayak basan insan kimdir?", "Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "Michael Collins"],
  ["Japonya'nın para birimi nedir?", "Yen", "Won", "Yuan", "Ringgit"],
  ["Aşağıdakilerden hangisi memelidir?", "Yunus", "Köpekbalığı", "Ahtapot", "Ton balığı"],
  ["Çanakkale Deniz Zaferi hangi yıldır?", "1915", "1911", "1918", "1922"],
  ["Hangisi Türkiye'nin komşusu değildir?", "Mısır", "Gürcistan", "Bulgaristan", "Yunanistan"],
  ["Dünyanın en büyük kıtası hangisidir?", "Asya", "Afrika", "Avrupa", "Amerika"],
  ["Evrim teorisi ile tanınan bilim insanı kimdir?", "Charles Darwin", "Isaac Newton", "Galileo", "Nikola Tesla"],
  ["Süleymaniye Camii'nin mimarı kimdir?", "Mimar Sinan", "Mimar Kemaleddin", "Vedat Tek", "Sedefkâr Mehmed Ağa"],
  ["Ankara hangi coğrafi bölgededir?", "İç Anadolu", "Ege", "Marmara", "Karadeniz"],
  ["7 × 8 işleminin sonucu kaçtır?", "56", "54", "49", "63"],
  ["İstiklal Marşı'nın şairi kimdir?", "Mehmet Akif Ersoy", "Namık Kemal", "Ziya Gökalp", "Yahya Kemal"],
  ["En küçük asal sayı kaçtır?", "2", "1", "3", "0"],
  ["Bitkilerin ışıkla besin üretmesine ne denir?", "Fotosentez", "Solunum", "Terleme", "Sindirim"],
  ["Dünya'nın doğal uydusu nedir?", "Ay", "Mars", "Güneş", "Venüs"],
  ["Atatürk hangi şehirde doğmuştur?", "Selanik", "İstanbul", "Ankara", "Manastır"],
  ["Kanı vücuda pompalayan organ hangisidir?", "Kalp", "Akciğer", "Karaciğer", "Böbrek"],
  ["Dünyanın en büyük sıcak çölü hangisidir?", "Sahra", "Gobi", "Kalahari", "Atacama"],
  ["Olimpiyat Oyunları kaç yılda bir yapılır?", "4", "2", "3", "5"],
  ["Kolezyum hangi şehirdedir?", "Roma", "Atina", "Paris", "Madrid"],
  ["Satranç tahtasında kaç kare vardır?", "64", "49", "81", "72"],
  ["Eyfel Kulesi hangi şehirdedir?", "Paris", "Londra", "Berlin", "Viyana"],
  ["Bir yıl (artık olmayan) kaç gündür?", "365", "360", "366", "364"],
  ["Hangi ay 28 veya 29 gün çeker?", "Şubat", "Nisan", "Haziran", "Eylül"]
];
function quiz(body, el, act) {
  const info = line(body, el);
  const q = el("p", "", "");
  q.style.cssText = "font-size:19px;font-weight:600;margin:6px 0 12px;min-height:54px";
  body.appendChild(q);
  const ch = el("div", "");
  ch.style.cssText = "display:flex;flex-direction:column;gap:8px";
  body.appendChild(ch);
  const row = rowOf(body, el);
  let list, i, score, lock, timer;
  function show() {
    const it = list[i];
    info.textContent = "Soru " + (i + 1) + "/10   Puan: " + score + "   En iyi: " + best("nb_quiz");
    q.textContent = it[0];
    ch.textContent = "";
    lock = false;
    shuffle(it.slice(1)).forEach((o) => {
      const b = el("button", "", o);
      b.type = "button";
      b.style.cssText = "padding:13px;font-size:16px;text-align:left";
      b.onclick = () => {
        if (lock) return;
        lock = true;
        const ok = o === it[1];
        if (ok) score++;
        b.style.background = ok ? "#3fb06a" : "#e5484d";
        b.style.color = "#fff";
        if (!ok) Array.from(ch.children).forEach((x) => { if (x.textContent === it[1]) { x.style.background = "#3fb06a"; x.style.color = "#fff"; } });
        timer = setTimeout(() => { i++; if (i >= 10) end(); else show(); }, 1100);
      };
      ch.appendChild(b);
    });
  }
  function end() {
    const b = hi("nb_quiz", score);
    ch.textContent = "";
    q.textContent = "Bitti! 10 sorudan " + score + " doğru. " + (score >= 8 ? "Harika! 🎉" : score >= 5 ? "İyi!" : "Tekrar dene!");
    info.textContent = "En iyi: " + b + "/10";
  }
  function start() { clearTimeout(timer); list = shuffle(QS).slice(0, 10); i = 0; score = 0; show(); }
  row.appendChild(act("Yeni yarışma", start));
  start();
  return () => clearTimeout(timer);
}

/* ---------- Adam Asmaca (tek başına) ---------- */
const WORDS = ["KARPUZ", "BİLGİSAYAR", "ÇANTA", "DENİZ", "GÜVENLİK", "NÖBET", "KAPI", "KAMERA", "TELSİZ", "ANAHTAR", "FENER", "TURNİKE", "ZİYARETÇİ", "BARİYER", "MESAİ", "KÖPRÜ", "ÇİÇEK", "ÖĞRETMEN", "TRAKTÖR", "MERDİVEN", "PENCERE", "BULUT", "YILDIZ", "ELMA", "ÇAYDANLIK", "SAHİL", "ŞEMSİYE", "KİTAPLIK", "BALIKÇI", "ORMAN", "UÇAK", "TELEFON", "DEFTER", "OKYANUS", "GÖKYÜZÜ", "TAKVİM", "RADYO", "TERAZİ", "SÜRAHİ", "MUTFAK"];
const TRL = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");
function hang(body, el, act) {
  const big = el("p", "", "");
  big.style.cssText = "font-size:26px;font-weight:700;letter-spacing:2px;margin:0 0 6px;overflow-wrap:anywhere";
  body.appendChild(big);
  const info = line(body, el);
  info.style.color = "var(--mute)";
  const kb = gridOf(body, el, 7, 6);
  const row = rowOf(body, el);
  let word, got;
  const faces = ["😀", "🙂", "😐", "😟", "😨", "😰", "💀"];
  function draw() {
    const wrong = got.filter((l) => word.indexOf(l) < 0);
    const won = Array.from(word).every((l) => got.indexOf(l) >= 0), lost = wrong.length >= 6;
    big.textContent = faces[Math.min(6, wrong.length)] + "  " + Array.from(word).map((l) => (got.indexOf(l) >= 0 || lost ? l : "_")).join(" ");
    info.textContent = won ? "Buldun! 🎉" : lost ? "Kaybettin. Kelime: " + word : "Kalan hak: " + (6 - wrong.length) + (wrong.length ? "   Yanlış: " + wrong.join(" ") : "");
    kb.textContent = "";
    TRL.forEach((l) => {
      const b = el("button", "", l);
      b.type = "button";
      b.style.cssText = "padding:10px 0;font-size:17px;font-weight:700";
      b.disabled = got.indexOf(l) >= 0 || won || lost;
      b.onclick = () => { got.push(l); draw(); };
      kb.appendChild(b);
    });
  }
  function start() { word = WORDS[rand(WORDS.length)]; got = []; draw(); }
  row.appendChild(act("Yeni kelime", start));
  start();
}

export const SOLO = {
  math: { group: "Zeka", icon: "➕", label: "Hızlı Matematik", start: math },
  seq: { group: "Zeka", icon: "🧠", label: "Sıralı Hafıza", start: seq },
  quiz: { group: "Zeka", icon: "❓", label: "Bilgi Yarışması", start: quiz },
  hang1: { group: "Zeka", icon: "🔤", label: "Adam Asmaca (tek)", start: hang }
};
