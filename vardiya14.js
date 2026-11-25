// Vardiya 14: vardiya paylaşım linki. Seçtiğin ayların vardiyası linkin içine sıkıştırılır (sunucuya gitmez), linki açan kişi görür ve arkadaş olarak ekleyebilir.
const E = (t, s, x) => { const e = document.createElement(t); if (s) e.style.cssText = s; if (x != null) e.textContent = x; return e; };
const BS = "border:1px solid var(--line,#333);background:transparent;color:inherit;border-radius:12px;padding:10px 14px;font-size:15px;cursor:pointer";
const IS = "box-sizing:border-box;padding:12px;font-size:16px;border-radius:12px;border:1px solid var(--line,#333);background:transparent;color:inherit;width:100%";
const p2 = (n) => String(n).padStart(2, "0");
const fold = (s) => String(s).toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const b64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64 = (s) => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const r = atob(s), u = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) u[i] = r.charCodeAt(i); return u; };
const pipe = async (u8, S) => { const st = new Blob([u8]).stream().pipeThrough(new S("deflate-raw")); return new Uint8Array(await new Response(st).arrayBuffer()); };
export async function enc(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === "function") { try { return "z" + b64(await pipe(raw, CompressionStream)); } catch (e) {} }
  return "j" + b64(raw);
}
export async function dec(s) {
  const k = s[0], u = unb64(s.slice(1)); let raw = u;
  if (k === "z") raw = await pipe(u, DecompressionStream); else if (k !== "j") throw new Error("fmt");
  return JSON.parse(new TextDecoder().decode(raw));
}
export function pack(D, name, months) {
  const T = {}; (D.types || []).forEach((t) => { T[t.id] = t; }); const ti = [], tl = [], d = {};
  Object.keys(D.days || {}).sort().forEach((k) => {
    if (months.indexOf(k.slice(0, 7)) < 0) return; const v = D.days[k]; let t = T[v && v.t]; if (!t && v && typeof v.t === "string" && v.t.slice(0, 2) === "c:") t = { id: v.t, n: v.t.slice(2), ic: "📍", c: "#8a94a6", cd: 1 }; if (!t) return;
    let i = ti.indexOf(t.id); if (i < 0) { i = ti.length; ti.push(t.id); tl.push([t.n || "", t.ic || "", t.c || "", t.s || "", t.e || "", t.off ? 1 : 0, t.cd ? 1 : 0]); } d[k] = i;
  });
  return { v: 1, n: String(name || "").slice(0, 30), t: tl, d: d };
}
export function clean(o) {
  if (!o || o.v !== 1 || !Array.isArray(o.t) || !o.d || typeof o.d !== "object" || o.t.length > 40) return null;
  const hh = (x) => (/^\d{2}:\d{2}$/.test(x) ? x : ""), t = o.t.map((a) => ({ n: String(a[0] || "").slice(0, 40), ic: String(a[1] || "").slice(0, 4), c: /^#[0-9a-fA-F]{6}$/.test(a[2]) ? a[2] : "#8a94a6", s: hh(a[3]), e: hh(a[4]), off: a[5] ? 1 : 0, cd: a[6] ? 1 : 0 })), d = {};
  Object.keys(o.d).slice(0, 200).forEach((k) => { const i = o.d[k]; if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isInteger(i) && i >= 0 && i < t.length) d[k] = i; });
  return { n: String(o.n || "").slice(0, 30), t: t, d: d };
}
export function addFriend(D, c) {
  D.types = D.types || []; D.fr = D.fr || []; const map = c.t.map((t) => {
    if (t.cd && t.n) return "c:" + t.n;
    const same = D.types.find((x) => x.n === t.n && (x.s || "") === t.s && (x.e || "") === t.e && !!x.off === !!t.off && !!x.cd === !!t.cd); if (same) return same.id;
    let id = "p" + (fold(t.n + t.s + t.e + t.off + t.cd).replace(/[^a-z0-9]/g, "") || "x"); if (D.types.some((x) => x.id === id)) return id;
    const nt = { id: id, n: t.n, ic: t.ic || "📍", c: t.c }; if (t.off) nt.off = 1; if (t.cd) nt.cd = 1; if (t.s) nt.s = t.s; if (t.e) nt.e = t.e; D.types.push(nt); return id;
  });
  const nm = c.n || "Arkadaş"; let f = D.fr.find((x) => fold(x.n) === fold(nm)); if (!f) { f = { id: "f" + Date.now().toString(36), n: nm, days: {} }; D.fr.push(f); } f.days = f.days || {};
  Object.keys(c.d).forEach((k) => { f.days[k] = { t: map[c.d[k]], n: "" }; }); return Object.keys(c.d).length;
}
const ovBase = (title, tag) => {
  const ov = E("div", "position:fixed;inset:0;z-index:99999;background:var(--bg,#0f1320);color:var(--text,#eee);overflow:auto;padding:14px;font-family:inherit");
  const top = E("div", "display:flex;align-items:center;gap:10px"); const bk = E("button", BS, "← Geri"); bk.type = "button"; top.appendChild(bk); top.appendChild(E("b", "font-size:17px", title)); ov.appendChild(top);
  const body = E("div"); ov.appendChild(body); document.body.appendChild(ov);
  const close = () => { try { ov.remove(); } catch (e) {} window.removeEventListener("popstate", close); };
  bk.onclick = () => { close(); try { if (history.state && history.state[tag]) history.back(); } catch (e) {} };
  try { const st = { vdb: 1 }; st[tag] = 1; history.pushState(st, ""); window.addEventListener("popstate", close); } catch (e) {}
  return body;
};
const getD = () => { try { return JSON.parse(localStorage.getItem("na_vardiya_v1")) || {}; } catch (e) { return {}; } };
const MN = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
function openShare() {
  const body = ovBase("🔗 Vardiyayı link ile paylaş", "lk"), D = getD(), now = new Date(), m0 = now.getFullYear() + "-" + p2(now.getMonth() + 1), nx = new Date(now.getFullYear(), now.getMonth() + 1, 1), m1 = nx.getFullYear() + "-" + p2(nx.getMonth() + 1);
  body.appendChild(E("div", "margin-top:12px;font-size:14px;opacity:.9;line-height:1.55", "Vardiyalarını tek bir linke çevirir. Linki WhatsApp'tan gönderdiğin kişi açınca vardiyanı görür ve arkadaş olarak ekleyebilir. Vardiya bilgisi linkin içindedir, sunucuya kaydedilmez. Linke sahip olan herkes görebilir, o yüzden sadece güvendiğin kişilere gönder."));
  body.appendChild(E("div", "margin-top:14px;font-size:14px", "Adın (karşı taraf bu adla görür)"));
  const ni = E("input", IS + ";margin-top:6px"); ni.placeholder = "örn. Ahmet"; try { ni.value = localStorage.getItem("na_vardiya_ad") || ""; } catch (e) {} ni.maxLength = 30; body.appendChild(ni);
  body.appendChild(E("div", "margin-top:14px;font-size:14px", "Hangi aylar paylaşılsın?"));
  const sl = E("select", IS + ";margin-top:6px"); [["a", MN[now.getMonth()] + " (bu ay)"], ["b", MN[nx.getMonth()] + " (gelecek ay)"], ["ab", "İkisi birlikte"]].forEach((x) => sl.appendChild(new Option(x[1], x[0]))); sl.value = "ab"; body.appendChild(sl);
  const go = E("button", BS + ";width:100%;margin-top:16px;background:var(--lamp,#f0c24b);color:#000;font-weight:700", "🔗 Link oluştur"); go.type = "button"; body.appendChild(go);
  const out = E("div", "margin-top:14px"); body.appendChild(out);
  go.onclick = async () => {
    out.innerHTML = ""; const nm = ni.value.trim(); if (!nm) { out.appendChild(E("div", "font-size:14px;color:#ff8a8a", "Önce bir ad yaz.")); return; }
    const mo = sl.value === "a" ? [m0] : sl.value === "b" ? [m1] : [m0, m1], pk = pack(D, nm, mo), n = Object.keys(pk.d).length;
    if (!n) { out.appendChild(E("div", "font-size:14px;color:#ff8a8a", "Seçtiğin aylarda vardiya yok. Önce takvime vardiya ekle.")); return; }
    try { localStorage.setItem("na_vardiya_ad", nm); } catch (e) {}
    const link = location.origin + location.pathname + "#vp=" + (await enc(pk));
    out.appendChild(E("div", "font-size:14px;font-weight:700", n + " günlük vardiya linke eklendi."));
    const ta = E("textarea", IS + ";margin-top:8px;height:90px;font-size:12px;word-break:break-all"); ta.readOnly = true; ta.value = link; out.appendChild(ta);
    const msg = E("div", "margin-top:8px;font-size:14px;min-height:18px");
    const sh = E("button", BS + ";width:100%;margin-top:8px;font-weight:700", "📤 Gönder (WhatsApp vb.)"); sh.type = "button";
    sh.onclick = async () => { try { if (navigator.share) { await navigator.share({ title: "Vardiyam", text: nm + " vardiyasını paylaştı:", url: link }); return; } } catch (e) { if (e && e.name === "AbortError") return; } try { await navigator.clipboard.writeText(link); msg.textContent = "Paylaşım menüsü yok, link kopyalandı. İstediğin yere yapıştır."; } catch (e) { ta.select(); msg.textContent = "Linki seçtim, uzun basıp kopyala."; } };
    const cp = E("button", BS + ";width:100%;margin-top:8px", "📋 Linki kopyala"); cp.type = "button";
    cp.onclick = async () => { try { await navigator.clipboard.writeText(link); msg.textContent = "Kopyalandı."; } catch (e) { ta.select(); msg.textContent = "Linki seçtim, uzun basıp kopyala."; } };
    out.appendChild(sh); out.appendChild(cp); out.appendChild(msg);
    if (link.length > 6000) out.appendChild(E("div", "margin-top:8px;font-size:12px;opacity:.8", "Link uzun, bazı uygulamalar kesebilir. Tek ay seçmeyi dene."));
  };
}
function openView(c) {
  const body = ovBase("📅 Paylaşılan vardiya", "lv"), nm = c.n || "Arkadaş", ks = Object.keys(c.d).sort();
  body.appendChild(E("div", "margin-top:12px;font-size:17px;font-weight:700", nm + " vardiyasını paylaştı"));
  body.appendChild(E("div", "margin-top:4px;font-size:13px;opacity:.8", ks.length + " gün · sadece sen görüyorsun, eklersen Vardiya → Arkadaşlar'da çıkar"));
  const add = E("button", BS + ";width:100%;margin-top:14px;background:var(--lamp,#f0c24b);color:#000;font-weight:700", "👥 Arkadaş olarak ekle"); add.type = "button"; body.appendChild(add);
  const msg = E("div", "margin-top:10px;font-size:14px;line-height:1.5;min-height:18px"); body.appendChild(msg);
  add.onclick = () => { try { const D = getD(), n = addFriend(D, c); localStorage.setItem("na_vardiya_v1", JSON.stringify(D)); add.disabled = true; msg.textContent = "✓ " + nm + " arkadaş olarak eklendi (" + n + " gün). Vardiya → Arkadaşlar bölümünde görürsün. Uygulama yenileniyor…"; setTimeout(() => location.reload(), 1500); } catch (e) { msg.textContent = "Eklenemedi, tekrar dene."; } };
  let last = ""; ks.forEach((k) => {
    const mk = k.slice(0, 7); if (mk !== last) { last = mk; body.appendChild(E("div", "margin-top:16px;font-weight:700;font-size:15px", MN[+mk.slice(5) - 1] + " " + mk.slice(0, 4))); }
    const t = c.t[c.d[k]], d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8)), r = E("div", "display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line,#333);font-size:15px");
    r.appendChild(E("span", "width:92px;flex:none;opacity:.85", d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" }))); r.appendChild(E("span", "flex:1", (t.ic ? t.ic + " " : "") + t.n)); if (t.s && t.e && !t.off) r.appendChild(E("span", "font-size:13px;opacity:.8", t.s + "–" + t.e)); body.appendChild(r);
  });
  body.appendChild(E("div", "height:24px"));
}
async function checkHash() {
  const m = location.hash.match(/^#vp=([A-Za-z0-9_-]+)$/); if (!m) return;
  try { const c = clean(await dec(m[1])); try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} if (c && Object.keys(c.d).length) openView(c); } catch (e) {}
}
let pend = false;
const scan = () => {
  pend = false;
  document.querySelectorAll(".vd-act").forEach((ac) => { if (ac.querySelector("[data-lk]")) return; const b = E("button", "", "🔗 Link ile paylaş"); b.type = "button"; b.dataset.lk = "1"; b.onclick = (e) => { e.stopPropagation(); openShare(); }; ac.appendChild(b); });
};
try { new MutationObserver(() => { if (!pend) { pend = true; setTimeout(scan, 200); } }).observe(document.body, { childList: true, subtree: true }); scan(); } catch (e) {}
checkHash();
