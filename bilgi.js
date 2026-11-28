// 📚 Bilgi köşesi: yetkiler (5188), ilk yardım, yangın, acil durumlar, numaralar, nöbet ipuçları
// Bilgiler bu dosyanın içinde; veritabanı kullanmaz.
const $ = (i) => document.getElementById(i);

const DATA = [
  { k: "yetki", ic: "⚖️", n: "Yetkiler", cards: [
    { t: "Yetkiler ne zaman geçerli?", b: [
      "Yetkiler yalnızca görev alanı içinde ve görev süresi içinde kullanılabilir (5188 md. 9).",
      "Kimlik kartı görünür şekilde takılı olmalı.",
      "Üzerinde kimlik kartı olmayan özel güvenlik görevlisi yetkilerini kullanamaz."
    ] },
    { t: "Kontrol ve arama", b: [
      "Kişileri duyarlı kapıdan geçirebilir, detektörle üstlerini arayabilir, eşyaları x-ray gibi cihazlardan geçirebilirsin.",
      "⚠️ El ile arama yetkisi YOKTUR.",
      "İstisna: spor müsabakası, ÖSYM sınavı gibi özel kanunu olan yerlerde genel kolluğun gözetim ve denetiminde el ile arama yapılabilir.",
      "Suçüstü yakalanan kişi kendine, başkasına ya da görevliye zarar vermesin diye kaba üst araması yapılabilir."
    ] },
    { t: "Yakalama", b: [
      "Görev alanında suçüstü hâlinde olan kişiyi yakalayıp arayabilirsin.",
      "Hakkında yakalama emri ya da mahkûmiyet kararı bulunan kişiyi yakalayıp arayabilirsin.",
      "Olay yerini ve delilleri korumak amacıyla CMK 168'e göre yakalama yapılabilir.",
      "Yakaladığın kişiyi ve olayı gecikmeden genel kolluğa (polis/jandarma) bildir ve teslim et."
    ] },
    { t: "Kimlik sorma", b: [
      "Kimlik sorma yetkisi sınırlıdır.",
      "Toplantı, konser, spor müsabakası, sahne gösterisi, cenaze ve düğün törenlerinde sorulabilir.",
      "Havalimanı, liman, gar, istasyon ve terminal gibi toplu ulaşım tesislerinde sorulabilir.",
      "Bunların dışındaki bina girişlerinde kimlik alıp kayda geçirmek tartışmalıdır; kurumunun talimatına ve güncel mevzuata bak."
    ] },
    { t: "İş yeri ve konuta girme", b: [
      "Yangın, deprem gibi tabii afetlerde ve imdat istendiğinde görev alanındaki iş yeri ve konutlara girebilirsin."
    ] },
    { t: "Emanete alma", b: [
      "Arama sırasında bulunan suç teşkil eden, delil olabilecek ya da tehlike doğurabilecek eşyayı emanete alabilirsin.",
      "Terk edilmiş ve bulunmuş eşyayı emanete alabilirsin.",
      "Şart: genel kolluğa derhal bildirmek."
    ] },
    { t: "Zor kullanma", b: [
      "Türk Medeni Kanunu 981, Borçlar Kanunu 52 ve Türk Ceza Kanunu 24–25. maddeleri çerçevesinde zor kullanılabilir.",
      "Zor kullanma ölçülü olmalı: tehlikeyi durduracak kadar, fazlası değil.",
      "Tehlike geçince zor kullanmayı bırak ve hemen kolluğa haber ver."
    ] },
    { t: "Suçla karşılaşınca ne yapmalı?", b: [
      "1️⃣ Suça el koy.",
      "2️⃣ Suçun devam etmesini önle.",
      "3️⃣ Şüphelileri tespit et ve yakala.",
      "4️⃣ Olay yerini ve delilleri koru, genel kolluğa teslim et.",
      "5️⃣ Kolluk isterse araştırma ve delil toplamada yardımcı ol.",
      "📞 Hemen 112'yi ara."
    ] }
  ] },
  { k: "ilk", ic: "🚑", n: "İlk yardım", cards: [
    { t: "Bilinci kapalı ve nefes almıyor", b: [
      "📞 Önce 112'yi ara ya da birine aratıp hoparlöre al.",
      "Sert bir zemine sırtüstü yatır.",
      "Ellerini göğsün ortasına koy, kollar dik: 30 kez bastır (5–6 cm derinlik, dakikada 100–120 hızla).",
      "Biliyorsan 2 kez suni solunum yap; bilmiyorsan sadece göğüs basısına devam et.",
      "Yakında otomatik şok cihazı (OED) varsa getirt, cihazın sesli talimatlarına uy.",
      "Ekip gelene kadar bırakma."
    ] },
    { t: "Kanama", b: [
      "Temiz bir bezle yaranın üstüne doğrudan ve sıkıca bastır.",
      "Bez ıslanırsa kaldırma, üstüne yenisini ekle.",
      "Kırık yoksa kanayan kolu ya da bacağı kalp seviyesinin üstüne kaldır.",
      "Kanama durmuyorsa 📞 112."
    ] },
    { t: "Boğazına bir şey kaçtı", b: [
      "Öksürebiliyorsa öksürmeye devam ettir, sırtına vurma.",
      "Konuşamıyor ve nefes alamıyorsa: öne eğ, kürek kemiklerinin arasına 5 kez sert vur.",
      "Çıkmazsa arkasına geç, göbeğin biraz üstüne yumruk yapıp 5 kez içe ve yukarı doğru bastır (Heimlich).",
      "Cisim çıkana kadar 5 vuruş, 5 bası şeklinde sürdür. Bilinci kaybolursa 📞 112 ve kalp masajı."
    ] },
    { t: "Sara nöbeti (kasılma)", b: [
      "Etrafındaki sert ve keskin eşyaları kaldır, başının altına yumuşak bir şey koy.",
      "Ağzına hiçbir şey sokma, kasılmayı tutarak durdurmaya çalışma.",
      "Nöbetin süresini tut. 5 dakikayı geçerse ya da ilk kez oluyorsa 📞 112.",
      "Kasılma bitince yan yatır, yanında kal."
    ] },
    { t: "Yanık", b: [
      "Yanan yeri en az 10–20 dakika akan serin suyun altında tut.",
      "Buz, diş macunu, yoğurt ya da yağ sürme.",
      "Yanığa yapışmış giysiyi çekip çıkarma.",
      "Üstünü temiz ve nemli bir bezle gevşekçe ört. Büyük yanıklarda 📞 112."
    ] },
    { t: "Bayılma", b: [
      "Sırtüstü yatır, bacaklarını 30 cm kadar kaldır.",
      "Yaka, kemer gibi sıkan yerleri gevşet, ortamı havalandır.",
      "Kısa sürede kendine gelmezse ya da nefesi düzensizse 📞 112.",
      "Kendine gelince hemen ayağa kaldırma."
    ] }
  ] },
  { k: "yangin", ic: "🔥", n: "Yangın", cards: [
    { t: "Yangın tüpü nasıl kullanılır?", b: [
      "1️⃣ Pimi çek.",
      "2️⃣ Hortumu ateşin dibine, yanan maddeye doğrult (alevin tepesine değil).",
      "3️⃣ Tetiğe bas.",
      "4️⃣ Süpürür gibi sağa sola hareket ettir.",
      "Rüzgârı arkana al, 2–3 metre uzaktan başla, kaçış yolunu arkanda bırak."
    ] },
    { t: "Elektrik yangını", b: [
      "Su ile söndürmeye çalışma.",
      "Önce elektriği sigortadan ya da şalterden kes.",
      "Karbondioksitli (CO₂) ya da kuru kimyevi tozlu tüp kullan."
    ] },
    { t: "Yağ (mutfak) yangını", b: [
      "Kesinlikle su dökme, alev patlar.",
      "Ocağı kapat, tencerenin üstünü kapakla ya da ıslak bezle ört.",
      "Varsa yangın battaniyesi kullan."
    ] },
    { t: "Tahliye", b: [
      "Alarmı çalıştır, 📞 112'yi ara.",
      "Asansör kullandırma, merdivenleri kullan.",
      "Çıkarken kapıları kapat (kilitleme); yangının yayılması yavaşlar.",
      "Dumanda eğilerek ilerle, ağzını ıslak bezle kapat.",
      "Toplanma alanında sayım yap, eksik kişi varsa itfaiyeye bildir."
    ] }
  ] },
  { k: "acil", ic: "🚨", n: "Acil durum", cards: [
    { t: "Deprem", b: [
      "Çök, kapan, tutun: sağlam bir masanın yanına çök, başını ve enseni koru.",
      "Pencere, cam ve devrilebilecek dolaplardan uzak dur.",
      "Sarsıntı bitince merdivenden çık, asansör kullanma.",
      "Toplanma alanına yönlendir, gaz ve elektriği kontrol et."
    ] },
    { t: "Şüpheli paket", b: [
      "Dokunma, açma, yerini değiştirme.",
      "Çevredeki insanları sakince uzaklaştır, alanı kordona al.",
      "📞 112'yi paketten uzakta ara; paketin yakınında telefon ve telsiz kullanma.",
      "Paketin yerini, görünüşünü ve bırakanı gördüysen eşkâlini not al."
    ] },
    { t: "Gaz kaçağı", b: [
      "Işık düğmesine, prize ve elektrikli cihazlara dokunma, çakmak yakma.",
      "Pencere ve kapıları aç, gaz vanasını kapat.",
      "Alanı boşalt, dışarı çıkınca 📞 187 (Doğalgaz Acil) ya da 112'yi ara."
    ] },
    { t: "Hırsızlık, kavga, saldırı", b: [
      "Kendini ve başkalarını gereksiz tehlikeye atma.",
      "📞 112'yi ara, olayın yerini net söyle.",
      "Eşkâl not al: boy, kıyafet, saç, kaçtığı yön, araç plakası.",
      "Olay yerini koru, hiçbir şeyin yerini değiştirme, kamera kayıtlarını sakla."
    ] }
  ] },
  { k: "tel", ic: "📞", n: "Numaralar", cards: [
    { t: "Acil numaralar", tel: [
      ["112", "Tek acil numara: ambulans, polis, jandarma, itfaiye, AFAD, orman, sahil güvenlik"],
      ["187", "Doğalgaz acil"],
      ["186", "Elektrik arıza"],
      ["185", "Su arıza"]
    ], b: [
      "2021'den beri 81 ilde 155, 156, 110, 122 gibi numaralar 112 altında birleşti. Bu numaraları arayınca da 112'ye bağlanırsın."
    ] }
  ] },
  { k: "ipucu", ic: "📋", n: "Nöbet ipuçları", cards: [
    { t: "Devir teslim", b: [
      "Olay defterini birlikte oku ve imzalayın.",
      "Anahtarları, telsizi, el feneri ve detektörü sayarak teslim et.",
      "Arızalı kamera, kapı ya da alarm varsa söyle.",
      "Beklenen ziyaretçi, teslimat ve özel talimatları aktar."
    ] },
    { t: "Olay raporu nasıl yazılır? (5N1K)", b: [
      "Ne oldu?", "Nerede oldu?", "Ne zaman oldu? (saat ve dakika)", "Kim? (olaya karışanlar, tanıklar)", "Nasıl oldu?", "Neden oldu? (biliniyorsa)",
      "Sadece gördüğünü yaz, yorum katma. Kimi aradığını ve saatini de ekle."
    ] },
    { t: "Gece nöbetinde uyanık kalmak", b: [
      "Saat başı kısa yürüyüş ya da devriye at.",
      "Çay ve kahveyi gece yarısından sonra azalt, bol su iç.",
      "Ağır yemek yerine hafif atıştırmalık tercih et.",
      "Ortamı loş değil aydınlık tut."
    ] }
  ] }
];

let btn = null, panel = null, tabsEl = null, listEl = null, qEl = null, cur = "yetki";

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

const st = document.createElement("style");
st.textContent =
  ".bk-panel{z-index:70}" +
  ".bk-panel .sheet{max-width:560px}" +
  ".bk-q{display:block;width:100%;margin:0 0 10px;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-size:15px}" +
  ".bk-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:6px}" +
  ".bk-tabs button{flex:none;border-radius:999px!important;padding:6px 12px!important;font-size:14px!important;white-space:nowrap}" +
  ".bk-tabs button.on{border-color:var(--lamp)!important;background:rgba(240,194,75,.14)!important;color:var(--lamp)!important;font-weight:700}" +
  ".bk-card{border:1px solid var(--line);border-radius:10px;margin:0 0 8px;overflow:hidden;background:rgba(127,150,180,.06)}" +
  ".bk-card>button{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;border:0!important;border-radius:0!important;padding:12px!important;font-size:16px!important;font-weight:700;text-align:left;background:none}" +
  ".bk-card>button::after{content:'▾';color:var(--mute);transition:transform .2s}" +
  ".bk-card.open>button::after{transform:rotate(180deg)}" +
  ".bk-body{display:none;padding:0 12px 12px}" +
  ".bk-card.open .bk-body{display:block}" +
  ".bk-body ul{margin:0;padding-left:18px}" +
  ".bk-body li{margin:0 0 6px;line-height:1.45}" +
  ".bk-sec{color:var(--mute);font-size:12px;margin:0 0 4px}" +
  ".bk-tel{display:flex;align-items:center;gap:10px;margin:0 0 8px;padding:10px;border:1px solid var(--line);border-radius:10px;color:var(--text);text-decoration:none}" +
  ".bk-tel b{min-width:52px;text-align:center;padding:6px 8px;border-radius:8px;background:var(--lamp);color:var(--lamp-ink);font:700 18px var(--head)}" +
  ".bk-tel span{font-size:14px}" +
  ".bk-note{color:var(--mute);font-size:12px;margin-top:10px}" +
  ".bk-empty{color:var(--mute);padding:10px 0}";
document.head.appendChild(st);

function card(c, sec, open) {
  const w = el("div", "bk-card" + (open ? " open" : ""));
  const h = el("button", "", c.t);
  h.type = "button";
  h.onclick = () => w.classList.toggle("open");
  w.appendChild(h);
  const body = el("div", "bk-body");
  if (sec) body.appendChild(el("div", "bk-sec", sec));
  if (c.tel) c.tel.forEach((x) => {
    const a = el("a", "bk-tel");
    a.href = "tel:" + x[0];
    a.appendChild(el("b", "", x[0]));
    a.appendChild(el("span", "", x[1]));
    body.appendChild(a);
  });
  if (c.b && c.b.length) {
    const ul = el("ul");
    c.b.forEach((x) => ul.appendChild(el("li", "", x)));
    body.appendChild(ul);
  }
  w.appendChild(body);
  return w;
}

function norm(s) { return s.toLocaleLowerCase("tr"); }

function render() {
  tabsEl.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.k === cur));
  listEl.textContent = "";
  const q = norm(qEl.value.trim());
  if (q) {
    let n = 0;
    DATA.forEach((g) => g.cards.forEach((c) => {
      const txt = norm(c.t + " " + (c.b || []).join(" ") + " " + (c.tel || []).map((x) => x.join(" ")).join(" "));
      if (txt.indexOf(q) >= 0) { listEl.appendChild(card(c, g.ic + " " + g.n, true)); n++; }
    }));
    if (!n) listEl.appendChild(el("div", "bk-empty", "Sonuç bulunamadı."));
    return;
  }
  const g = DATA.find((x) => x.k === cur) || DATA[0];
  g.cards.forEach((c, i) => listEl.appendChild(card(c, "", g.cards.length === 1 || i === 0)));
}

function open() {
  if (!panel) {
    panel = el("div", "panel bk-panel");
    panel.hidden = true;
    const sh = el("div", "sheet");
    const head = el("div", "sh");
    head.appendChild(el("h2", "", "📚 Bilgi köşesi"));
    const x = el("button", "", "Kapat"); x.type = "button";
    x.onclick = () => { panel.hidden = true; };
    head.appendChild(x);
    sh.appendChild(head);
    qEl = el("input", "bk-q");
    qEl.type = "search";
    qEl.placeholder = "Ara… (ör. yangın, kimlik, kanama)";
    qEl.oninput = render;
    sh.appendChild(qEl);
    tabsEl = el("div", "bk-tabs");
    DATA.forEach((g) => {
      const b = el("button", "", g.ic + " " + g.n);
      b.type = "button";
      b.dataset.k = g.k;
      b.onclick = () => { cur = g.k; qEl.value = ""; render(); };
      tabsEl.appendChild(b);
    });
    sh.appendChild(tabsEl);
    listEl = el("div", "");
    sh.appendChild(listEl);
    sh.appendChild(el("p", "bk-note", "Bilgiler genel bilgilendirme içindir. Yetkiler 5188 sayılı Kanun ve Emniyet Genel Müdürlüğü özel güvenlik eğitim belgelerine göre özetlenmiştir; mevzuat değişebilir. Kesin bilgi için kurumuna, resmi mevzuata ve acil durumda 112'ye başvur. İlk yardım bilgisi eğitimin yerini tutmaz."));
    panel.appendChild(sh);
    panel.onclick = (e) => { if (e.target === panel) panel.hidden = true; };
    document.body.appendChild(panel);
  }
  render();
  panel.hidden = false;
}

function ensureBtn() {
  if (btn && btn.isConnected) return;
  const tools = document.querySelector(".tools");
  if (!tools) return;
  btn = el("button", "", "📚 Bilgi");
  btn.type = "button";
  btn.onclick = open;
  const out = $("out");
  if (out && out.parentNode === tools) tools.insertBefore(btn, out); else tools.appendChild(btn);
}

setInterval(ensureBtn, 1500);
ensureBtn();
