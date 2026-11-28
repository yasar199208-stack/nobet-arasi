// Modern üst bar: sohbet alanı büyüsün diye her şey tek satırda
//   [←] [✕]  🌙 Oda adı ……………  [🔍] [🔔] [📹] [☰]
// - "Sen: …", 📍 Durum, 🎧 Sesli oda, 📚 Bilgi ve 🆘 Acil durum ☰ menünün içine taşınır
// - ☰ düğmesinin köşesinde seçili durumun simgesi görünür (🟢, 🌙, ☕ …)
// Diğer dosyalara dokunmaz; düğmeleri yerine taşır ve görünüşlerini düzenler.
const $ = (i) => document.getElementById(i);

const st = document.createElement("style");
st.textContent =
  // Başlık satırı
  ".top{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:8px!important;padding:10px 12px!important;background:linear-gradient(180deg,rgba(24,39,59,.96),rgba(15,26,42,.96));box-shadow:0 2px 10px rgba(0,0,0,.25)}" +
  ".top h2#rt{flex:1 1 auto!important;min-width:0;margin:0!important;font:700 22px/1.15 var(--head)!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.2px}" +
  ".top .desc{display:none!important}" +
  ".top .tools{flex:none!important;display:flex!important;flex-wrap:nowrap!important;gap:8px!important;margin:0!important;width:auto!important}" +
  ".top .tools > span:first-child{display:none!important}" +
  // Simge düğmeleri: hepsi aynı boy, yuvarlak köşe
  "#nb,#cx,#srb,#mtb,#cb,.top .mmenu{flex:none!important;position:relative;display:grid!important;place-items:center;width:42px!important;height:42px!important;min-width:0!important;padding:0!important;margin:0!important;border-radius:14px!important;border:1px solid var(--line)!important;background:rgba(127,150,180,.10)!important;color:var(--text)!important;font-size:19px!important;line-height:1!important;cursor:pointer;transition:background .15s,border-color .15s,transform .1s}" +
  "#nb[hidden],#cx[hidden],#cb[hidden]{display:none!important}" +
  "#nb:active,#cx:active,#srb:active,#mtb:active,#cb:active,.top .mmenu:active{transform:scale(.94)}" +
  "#srb[aria-pressed=\"true\"],.top .mmenu[aria-expanded=\"true\"]{border-color:var(--lamp)!important;background:rgba(240,194,75,.15)!important}" +
  ".top .mmenu{font-size:22px!important}" +
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
  ".mpanel .du-sos{background:rgba(217,83,79,.14)!important;border-color:rgba(217,83,79,.6)!important;color:#ff9b93!important;font-weight:700}";
document.head.appendChild(st);

function colorOf(s) { let h = 0; s = String(s || ""); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return "hsl(" + h + ",55%,68%)"; }

// ☰ menünün en üstünde olacak düğmeler (sırayla)
const TOP = [
  (b) => b.classList.contains("dur-chip"),
  (b) => b.textContent.trim().indexOf("🎧") === 0,
  (b) => b.textContent.trim().indexOf("📚") === 0
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
  // Kullanıcı kartı (Sen: … yerine)
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

  // Üst grup: Durum, Sesli oda, Bilgi
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

  // 🆘 Acil durum: menünün en altına
  const sos = $("sosb");
  if (sos) {
    if (!sos.classList.contains("du-sos")) { sos.classList.add("du-sos"); sos.textContent = "🆘 Acil durum (arkadaşlarına haber ver)"; }
    if (panel.lastChild !== sos) panel.appendChild(sos);
  }
}

let badge = null;
function tidyBar() {
  const menuBtn = document.querySelector(".top .mmenu") || document.querySelector(".mmenu");
  if (menuBtn) {
    if (menuBtn.firstChild && menuBtn.firstChild.nodeType === 3 && menuBtn.firstChild.nodeValue !== "☰") menuBtn.firstChild.nodeValue = "☰";
    if (menuBtn.title !== "Menü") { menuBtn.title = "Menü"; menuBtn.setAttribute("aria-label", "Menü"); }
    if (!badge || !badge.isConnected) { badge = document.createElement("span"); badge.className = "du-badge"; menuBtn.appendChild(badge); }
    const chip = document.querySelector(".dur-chip");
    const on = chip && chip.classList.contains("on");
    const ic = on ? chip.textContent.trim().split(" ")[0] : "";
    if (badge.textContent !== ic) badge.textContent = ic;
    if (badge.hidden !== !on) badge.hidden = !on;
  }
  // Yazılı düğmeleri simgeye çevir
  const nb = $("nb");
  if (nb && nb.textContent !== "←") { nb.textContent = "←"; nb.title = "Odalara dön"; nb.setAttribute("aria-label", "Odalara dön"); }
  const cx = $("cx");
  if (cx && cx.textContent !== "✕") { cx.textContent = "✕"; cx.title = "Kapat"; cx.setAttribute("aria-label", "Kapat"); }
  const cb = $("cb");
  if (cb && cb.textContent !== "📹") { cb.textContent = "📹"; cb.title = "Görüntülü ara"; cb.setAttribute("aria-label", "Görüntülü ara"); }
  // Başlık satırındaki sıra: 🔍 🔔 sonra araçlar (📹 ☰)
  const srb = $("srb"), mtb = $("mtb"), rt = $("rt");
  if (rt && srb && srb.previousSibling !== rt) rt.parentNode.insertBefore(srb, rt.nextSibling);
  if (srb && mtb && mtb.previousSibling !== srb) srb.parentNode.insertBefore(mtb, srb.nextSibling);
}

function tidy() {
  try { tidyBar(); } catch (e) {}
  try { tidyMenu(); } catch (e) {}
}

setInterval(tidy, 800);
tidy();
