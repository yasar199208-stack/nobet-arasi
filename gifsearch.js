// Giphy ile GIF arama. media.js bu dosyayı yükler.
// Seçilen GIF indirilir ve fotoğraf düğmesinin kullandığı yoldan gönderilir.
const KEY = "3Ue9EtLKBV4EmAvRj64CcyR2jUNRHdFa";
const API = "https://api.giphy.com/v1/gifs/";
const LIMIT = 24;
const CHIPS = ["Günaydın", "İyi geceler", "Komik", "Teşekkürler", "Çay", "Geçmiş olsun", "Alkış", "Kalp", "Yorgun", "Selam"];

let btn = null, panel = null, inp = null, grid = null, more = null, say = null;
let query = "", offset = 0, busy = false, seq = 0, timer = 0;

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

// Fotoğraf düğmesinin gerçekten kullandığı dosya kutusunu bulur
// (sayfada profil resmi gibi başka dosya kutuları da olabilir).
let photoRef = null;
function findFile() {
  if (!photoRef) return null;
  let found = null;
  const orig = HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click = function () { found = this; };
  try { photoRef.click(); } finally { HTMLInputElement.prototype.click = orig; }
  return found;
}

function closePanel() { if (panel) panel.hidden = true; }

async function load(reset) {
  if (!reset && busy) return;
  const tok = reset ? ++seq : seq;
  busy = true;
  if (reset) { offset = 0; grid.textContent = ""; more.hidden = true; }
  say.textContent = "Yükleniyor…";
  try {
    const u = API + (query ? "search" : "trending") + "?api_key=" + encodeURIComponent(KEY) +
      "&limit=" + LIMIT + "&offset=" + offset + "&rating=pg" +
      (query ? "&lang=tr&q=" + encodeURIComponent(query) : "");
    const r = await fetch(u);
    if (r.status === 429) throw new Error("Çok fazla arama yapıldı. Biraz bekleyip tekrar dene.");
    if (!r.ok) throw new Error("GIF servisi cevap vermedi (" + r.status + ").");
    const j = await r.json();
    if (tok !== seq) return;
    const list = j.data || [];
    let n = 0;
    list.forEach((g) => {
      const im = g.images;
      if (!im || !im.fixed_width_small || !im.fixed_width) return;
      const b = el("button"); b.type = "button";
      const i = el("img"); i.loading = "lazy"; i.alt = g.title || "GIF";
      i.src = im.fixed_width_small.url;
      b.appendChild(i);
      b.onclick = () => pick(im.fixed_width.url);
      grid.appendChild(b); n++;
    });
    offset += list.length;
    more.hidden = list.length < LIMIT;
    say.textContent = grid.childNodes.length ? "" : "Sonuç yok. Başka bir kelime dene.";
  } catch (e) {
    if (tok !== seq) return;
    say.textContent = e && e.message && e.message.indexOf("Failed") < 0 ? e.message : "GIF'ler yüklenemedi. İnternetini kontrol et.";
  } finally {
    if (tok === seq) busy = false;
  }
}

async function pick(url) {
  const f = findFile();
  if (!f) { say.textContent = "Gönderme şu an hazır değil."; return; }
  say.textContent = "GIF indiriliyor…";
  grid.style.opacity = ".4";
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("indirilemedi");
    const blob = await r.blob();
    const file = new File([blob], "giphy.gif", { type: "image/gif" });
    const dt = new DataTransfer();
    dt.items.add(file);
    f.files = dt.files;
    f.dispatchEvent(new Event("change", { bubbles: true }));
    say.textContent = "";
    closePanel();
  } catch (e) {
    say.textContent = "GIF indirilemedi. Başka bir tane dene.";
  } finally {
    grid.style.opacity = "";
  }
}

function search(q) {
  query = q.trim();
  load(true);
}

function build(photoBtn) {
  photoRef = photoBtn;
  const st = el("style");
  st.textContent = "#sf:has(.gifb:not([hidden])){flex-wrap:wrap;gap:8px}#sf:has(.gifb:not([hidden])) #in{flex:1 1 100%;min-width:0}#sf:has(.gifb:not([hidden])) button{flex:1 1 0;min-width:0;padding:10px 0!important}#sf:has(.gifb:not([hidden])) button:last-child{flex:1.6 1 0}.gifb{font-size:14px;font-weight:700}.gifp{position:fixed;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom,0px));background:var(--panel);border:1px solid var(--lamp);border-radius:14px;padding:8px;z-index:22;box-shadow:0 8px 24px rgba(0,0,0,.45)}.gifp input{width:100%;margin-bottom:6px;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:7px 10px;font-size:15px}.gifc{display:flex;gap:6px;overflow-x:auto;margin-bottom:6px;padding-bottom:2px}.gifc button{flex:0 0 auto;background:none;border:1px solid var(--line);color:var(--text);border-radius:14px;padding:4px 10px;font-size:13px;cursor:pointer}.gifg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-height:38vh;overflow:auto}.gifg button{background:var(--bg);border:0;border-radius:8px;padding:0;cursor:pointer;aspect-ratio:1;overflow:hidden}.gifg img{width:100%;height:100%;object-fit:cover;display:block}.gifm{display:block;width:100%;margin-top:6px;background:none;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:7px;cursor:pointer}.gifs{color:var(--mute);font-size:13px;min-height:16px;padding:2px 2px 0}.gifx{text-align:right;color:var(--mute);font-size:11px;margin-top:2px}";
  document.head.appendChild(st);

  btn = el("button", "phb gifb", "GIF");
  btn.type = "button"; btn.title = "GIF ara";
  btn.hidden = photoBtn.hidden;
  photoBtn.parentNode.insertBefore(btn, photoBtn.nextSibling);

  panel = el("div", "gifp");
  panel.hidden = true;
  inp = el("input");
  inp.type = "search"; inp.placeholder = "GIF ara: gülme, alkış, kalp…"; inp.autocomplete = "off";
  const chips = el("div", "gifc");
  CHIPS.forEach((c) => {
    const b = el("button", "", c); b.type = "button";
    b.onclick = () => { inp.value = c; search(c); };
    chips.appendChild(b);
  });
  grid = el("div", "gifg");
  say = el("div", "gifs");
  more = el("button", "gifm", "Daha fazla"); more.type = "button"; more.hidden = true;
  more.onclick = () => load(false);
  const cr = el("div", "gifx", "Powered by GIPHY");
  [inp, chips, grid, say, more, cr].forEach((n) => panel.appendChild(n));
  document.body.appendChild(panel);

  inp.oninput = () => { clearTimeout(timer); timer = setTimeout(() => search(inp.value), 450); };
  btn.onclick = () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      const ep = document.querySelector(".epick");
      if (ep) ep.hidden = true;
      if (!grid.childNodes.length) search(inp.value);
    }
  };
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== btn) closePanel();
  });
  new MutationObserver(() => {
    btn.hidden = photoBtn.hidden;
    if (btn.hidden) closePanel();
  }).observe(photoBtn, { attributes: true, attributeFilter: ["hidden"] });
}

function wait(n) {
  const b = Array.from(document.querySelectorAll("button.phb")).find((x) => x.title === "Fotoğraf veya GIF gönder");
  if (b) build(b);
  else if (n < 60) setTimeout(() => wait(n + 1), 300);
}
wait(0);
