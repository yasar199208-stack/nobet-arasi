// Ek modüller: biri yüklenemezse (dosya yoksa) filtre yine de çalışır.
import("./legal.js?v=1").catch(() => {});
import("./hesap.js?v=1").catch(() => {});
import("./yazi.js?v=1").catch(() => {});
import("./video.js?v=1").catch(() => {});
import("./otoban.js?v=1").catch(() => {});
import("./belediye.js?v=1").catch(() => {});

// Küfür filtresi: uygunsuz ifade içeren mesaj gönderilmeden önce engellenir.
const $ = (i) => document.getElementById(i);

// Tam eşleşen kelimeler (kısa köklerin yanlış alarm vermemesi için)
const EXACT = ["am", "amk", "aq", "amq", "sik", "sikim", "siktir", "got", "gotun", "gotu", "pic", "picler", "oc", "ibne", "ibneler",
  "gt", "gtu", "gtun", "gtn", "mk", "mq", "sg", "sktr", "skm", "skim", "skik", "sikm", "yrk", "yrrk", "orspu", "oruspu"];
// Kelimenin başı eşleşenler
const PREFIX = ["orospu", "yarrak", "yarak", "pezevenk", "siktir", "sikeyim", "sikerim", "sikik", "amcik", "amina", "aminako", "gotveren", "ibne", "anani", "kahpe", "pust", "gavat", "surtuk", "orspu", "oruspu", "gtveren", "sktir", "skerim", "skeyim"];

function norm(s) {
  let t = s.normalize("NFKC").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("tr");
  const map = { "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u", "â": "a", "î": "i", "û": "u", "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };
  t = t.replace(/[çğıöşüâîû0134 57@$]/g, (c) => map[c] || c);
  t = t.replace(/[^a-z]+/g, " ");
  t = t.replace(/([a-z])\1+/g, "$1");
  return t.trim();
}

export function isBad(text) {
  const words = norm(text).split(" ").filter(Boolean);
  // "a m k" gibi harf harf yazılanları da yakala
  const singles = words.filter((w) => w.length === 1);
  const glued = singles.length >= 3 ? singles.join("") : "";
  const all = glued ? words.concat([glued]) : words;
  return all.some((w) => EXACT.indexOf(w) >= 0 || PREFIX.some((p) => w.indexOf(p) === 0));
}

function toast(m) {
  const t = $("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 3200);
}

// Gönderim olayını sayfa kodundan önce yakala
document.addEventListener("submit", (e) => {
  if (!e.target || e.target.id !== "sf") return;
  const inp = $("in");
  if (inp && isBad(inp.value)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    toast("Mesajında uygunsuz ifade var, gönderilmedi.");
  }
}, true);
