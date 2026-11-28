// Modern üst bar: sohbet alanı büyüsün diye her şey tek satırda
//   Oda:          [🏠]  🌙 Oda adı ………………  [🔍] [☰]
//   Özel sohbet:  [←]   💌 @arkadaş ………………  [🔍] [📹] [☰]
// - "Sen: …", 📍 Durum, 🎧 Sesli oda, 📚 Bilgi, 🔔 oda bildirimi ve 🆘 Acil durum ☰ menünün içine taşınır
// - ☰ düğmesinin köşesinde seçili durumun simgesi görünür (🟢, 🌙, ☕ …)
// - Ana ekran: başlık incelir, büyük kutular satırda 4'lü küçük kartlara döner,
//   🗑️ Hesabı sil ana ekrandan ☰ menünün en altına taşınır
// Diğer dosyalara dokunmaz; düğmeleri yerine taşır ve görünüşlerini düzenler.
const $ = (i) => document.getElementById(i);

const ICON = "flex:none!important;position:relative;display:grid!important;place-items:center;width:40px!important;height:40px!important;min-width:0!important;padding:0!important;margin:0!important;border-radius:13px!important;border:1px solid var(--line)!important;background:rgba(127,150,180,.10)!important;color:var(--text)!important;font-size:18px!important;line-height:1!important;cursor:pointer;transition:background .15s,border-color .15s,transform .1s";

const st = document.createElement("style");
st.textContent =
  // Başlık satırı
  ".top{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:8px!important;padding:10px 12px!important;background:linear-gradient(180deg,rgba(24,39,59,.96),rgba(15,26,42,.96));box-shadow:0 2px 10px rgba(0,0,0,.25)}" +
  ".top h2#rt{flex:1 1 auto!important;min-width:70px;margin:0 2px!important;font:700 22px/1.15 var(--head)!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.2px}" +
  ".top .desc{display:none!important}" +
  ".top .tools{flex:none!important;display:flex!important;flex-wrap:nowrap!important;gap:8px!important;margin:0!important;width:auto!important}" +
  ".top .tools > span:first-child{display:none!important}" +
  // Simge düğmeleri: hepsi aynı boy, yuvarlak köşe
  "#nb,#srb,#cb,.top .mmenu,.top .du-ic{" + ICON + "}" +
  "@media (max-width:760px){#tmb{" + ICON + "}}" +
  "#nb[hidden],#cx,#cb[hidden],#tmb[hidden],.top .du-ic[hidden]{display:none!important}" +
  "#nb:active,#srb:active,#cb:active,#tmb:active,.top .mmenu:active,.top .du-ic:active{transform:scale(.93)}" +
  "#srb[aria-pressed=\"true\"],.top .mmenu[aria-expanded=\"true\"]{border-color:var(--lamp)!important;background:rgba(240,194,75,.15)!important}" +
  ".top .mmenu{font-size:21px!important}" +
  ".du-badge{position:absolute;right:-5px;top:-5px;min-width:20px;height:20px;padding:0 2px;border-radius:10px;background:var(--panel);border:1px solid var(--line);display:grid;place-items:center;font-size:12px;line-height:1}" +
  ".du-badge[hidden]{display:none!important}" +
  // Menü paneli
  ".mpanel{border-radius:18px!important;padding:12px!important;border-color:var(--line)!important;box-shadow:0 16px 40px rgba(0,0,0,.55)!important}" +
  ".mpanel .du-me{display:flex;align-items:center;gap:10px;padding:4px 4px 12px;margin-bottom:10px;border-bottom:1px solid var(--line)}" +
  ".mpanel .du-me i{font-style:normal;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font:700 18px var(--head);color:#10151d;flex:none}" +
  ".mpanel .du-me b{display:block;font-size:17px}" +
  ".mpanel .du-me small{display:block;color:var(--mute);font-size:13px;margin-top:1px}" +
  ".mpanel .minfo{display:none!important}" +
  ".mpanel button{min-height:46px;border-radius:12px!important;font-size:16px!important;padding:10px 14px!important;margin:0 0 8px!important}" +
  ".mpanel .du-sep{height:1px;background:var(--line);margin:4px 2px 12px}" +
  ".mpanel .du-sos{background:rgba(217,83,79,.14)!important;border-color:rgba(217,83,79,.6)!important;color:#ff9b93!important;font-weight:700}" +
  ".mpanel .du-del{background:none!important;border-color:rgba(217,83,79,.45)!important;color:#e0786a!important;font-size:14px!important;min-height:40px!important}" +
  // Ana ekran (telefon)
  "@media (max-width:760px){" +
  "aside .brand{padding:10px 16px 9px!important;border-bottom-width:2px!important}" +
  "aside .brand .logo svg{width:28px!important;height:28px!important}" +
  "aside .brand h1{font-size:25px!important}" +
  ".mtabs{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px!important;padding:10px 12px 2px!important}" +
  ".mtabs button{display:flex!important;align-items:center;justify-content:center;flex-wrap:wrap;min-width:0!important;min-height:54px;margin:0!important;padding:6px 4px!important;border-radius:14px!important;border:1px solid var(--line)!important;background:rgba(127,150,180,.08)!important;color:var(--text)!important;font-size:13px!important;line-height:1.25!important;text-align:center;white-space:normal;overflow-wrap:anywhere;transition:background .15s,border-color .15s,transform .1s}" +
  ".mtabs button:active{transform:scale(.95)}" +
  ".mtabs button[aria-pressed=\"true\"]{border-color:var(--lamp)!important;background:rgba(240,194,75,.12)!important;font-weight:700}" +
  "aside .q{margin:10px 12px 4px!important;width:calc(100% - 24px)!important;border-radius:14px!important;padding:11px 14px!important}" +
  "aside .rooms{padding:8px 12px 10px!important;gap:8px!important}" +
  "aside .room{border-radius:999px!important;padding:8px 16px!important}" +
  "aside .room[aria-current=\"true\"]{background:rgba(240,194,75,.12)!important}" +
  "}";
document.head.appendChild(st);

function colorOf(s) { let h = 0; s = String(s || ""); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return "hsl(" + h + ",55%,68%)"; }
function setTxt(b, t) { if (b.textContent !== t) b.textContent = t; }
function setHid(b, h) { if (b.hidden !== h) b.hidden = h; }
function setTitle(b, t) { if (b.title !== t) { b.title = t; b.setAttribute("aria-label", t); } }

// ☰ menünün en üstünde olacak düğmeler (sırayla)
const TOP = [
  (b) => b.classList.contains("dur-chip"),
  (b) => b.textContent.trim().indexOf("🎧") === 0,
  (b) => b.textContent.trim().indexOf("📚") === 0,
  (b) => b.id === "mtb"
];

function findBtn(test) {
  const all = document.querySelectorAll(".top button, .mpanel button");
  for (let i = 0; i < all.length; i++) if (test(all[i])) return all[i];
  return null;
}

let meBox = null;
function tidyMenu() {
  const panel = document.querySelector(".mpanel");
  if (!panel) return;
  // Kullanıcı kartı ("Sen: …" yerine)
  const nick = ($("me") && $("me").textContent) || "";
  if (!meBox || !meBox.isConnected) {
    meBox = document.createElement("div");
    meBox.className = "du-me";
    meBox.innerHTML = "<i></i><div><b></b><small></small></div>";
  }
  if (panel.firstChild !== meBox) panel.insertBefore(meBox, panel.firstChild);
  const av = meBox.querySelector("i"), nm = meBox.querySelector("b"), sub = meBox.querySelector("small");
  if (nm.textContent !== nick) { nm.textContent = nick; av.textContent = nick.slice(0, 1).toLocaleUpperCase("tr"); av.style.background = colorOf(nick); }
  const chip = document.querySelector(".dur-chip");
  const stx = chip && chip.classList.contains("on") ? chip.textContent.trim() : "Durum seçilmedi";
  if (sub.textContent !== stx) sub.textContent = stx;

  // Üst grup: Durum, Sesli oda, Bilgi, Oda bildirimi
  let ref = meBox;
  const info = panel.querySelector(".minfo");
  if (info && info.previousSibling !== meBox) panel.insertBefore(info, meBox.nextSibling);
  if (info) ref = info;
  let moved = 0;
  TOP.forEach((t) => {
    const b = findBtn(t);
    if (!b) return;
    b.setAttribute("data-mrank", "0");
    if (ref.nextSibling !== b) panel.insertBefore(b, ref.nextSibling);
    ref = b; moved++;
  });
  if (moved) {
    let sep = panel.querySelector(".du-sep");
    if (!sep) { sep = document.createElement("div"); sep.className = "du-sep"; }
    if (ref.nextSibling !== sep) panel.insertBefore(sep, ref.nextSibling);
  }

  // 🔔 oda bildirimi: menüde anlaşılır yazı
  const mtb = $("mtb");
  if (mtb) {
    const t = mtb.textContent.trim();
    if (t === "🔔") setTxt(mtb, "🔔 Bu odanın bildirimi açık (kapatmak için dokun)");
    else if (t === "🔕") setTxt(mtb, "🔕 Bu oda sessizde (açmak için dokun)");
  }

  // En alta: 🆘 Acil durum, sonra 🗑️ Hesabı sil
  const sos = $("sosb");
  if (sos && !sos.classList.contains("du-sos")) { sos.classList.add("du-sos"); sos.textContent = "🆘 Acil durum (arkadaşlarına haber ver)"; }
  const del = findDel();
  if (del && !del.classList.contains("du-del")) {
    const row = del.parentElement;
    if (row && !row.closest(".mpanel")) row.style.display = "none";   // ana ekrandaki boş satırı gizle
    del.classList.add("du-del");
    del.style.cssText = "";
  }
  const tail = [sos, del].filter(Boolean);
  let ok = true;
  for (let i = 0; i < tail.length; i++) if (panel.children[panel.children.length - tail.length + i] !== tail[i]) ok = false;
  if (!ok) tail.forEach((b) => panel.appendChild(b));
}

// hesap.js'in "🗑️ Hesabı sil" düğmesi
function findDel() {
  const all = document.querySelectorAll("button");
  for (let i = 0; i < all.length; i++) {
    const b = all[i];
    if (b.closest(".msg") || b.closest(".sheet")) continue;
    if (b.textContent.trim() === "🗑️ Hesabı sil") return b;
  }
  return null;
}

let badge = null;
function tidyBar() {
  const top = document.querySelector(".top");
  if (!top) return;
  const nb = $("nb");
  const dm = !!(nb && !nb.hidden);

  // ☰ Menü
  const menuBtn = document.querySelector(".top .mmenu");
  if (menuBtn) {
    if (menuBtn.firstChild && menuBtn.firstChild.nodeType === 3 && menuBtn.firstChild.nodeValue !== "☰") menuBtn.firstChild.nodeValue = "☰";
    setTitle(menuBtn, "Menü");
    if (!badge || !badge.isConnected) { badge = document.createElement("span"); badge.className = "du-badge"; menuBtn.appendChild(badge); }
    const chip = document.querySelector(".dur-chip");
    const on = !!(chip && chip.classList.contains("on"));
    const ic = on ? chip.textContent.trim().split(" ")[0] : "";
    if (badge.textContent !== ic) badge.textContent = ic;
    setHid(badge, !on);
  }

  // 🏠 / 💬 : oda listesini göster ya da sohbeti tam ekran yap (özel sohbette ← yeterli)
  const tmb = $("tmb");
  if (tmb) {
    const tam = document.body.classList.contains("tam");
    setTxt(tmb, tam ? "🏠" : "💬");
    setTitle(tmb, tam ? "Odaları göster" : "Sohbeti büyüt");
    setHid(tmb, dm);
  }

  // Özel sohbette geri ve görüntülü ara
  if (nb) { setTxt(nb, "←"); setTitle(nb, "Odalara dön"); }
  const cb = $("cb");
  if (cb) { setTxt(cb, "📹"); setTitle(cb, "Görüntülü ara"); }

  // Diğer başlık düğmeleri: "← Odalar / ← Geri / ← Vardiya" ve "📹 Görüntülü"
  Array.prototype.forEach.call(top.children, (b) => {
    if (b.tagName !== "BUTTON" || b.id) return;
    const t = b.textContent.trim();
    if (t.indexOf("← ") === 0) b.dataset.lab = t;
    if (t.indexOf("📹 ") === 0) b.dataset.lab = t;
    const lab = b.dataset.lab || "";
    if (!lab) return;
    b.classList.add("du-ic");
    if (lab === "← Odalar") { setHid(b, true); return; }      // 🏠 aynı işi yapıyor
    if (lab.indexOf("← ") === 0) { setTxt(b, "←"); setTitle(b, lab.slice(2)); }
    else if (lab.indexOf("📹 ") === 0) { setTxt(b, "📹"); setTitle(b, "Görüntülü oda"); }
  });

  // 🔍 başlığın hemen sağında
  const srb = $("srb"), rt = $("rt");
  if (rt && srb && srb.previousSibling !== rt) rt.parentNode.insertBefore(srb, rt.nextSibling);
  if (srb) setTitle(srb, "Sohbette ara");
}

function tidy() {
  try { tidyBar(); } catch (e) {}
  try { tidyMenu(); } catch (e) {}
}

setInterval(tidy, 700);
tidy();
