// Duyuru panosu (yönetici yazar, herkes okur) ve Şikayet / İstek kutusu (sadece yönetici görür).
import { EXTRA } from "./tones.js?v=1";
const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const E = (t, s, x) => { const e = document.createElement(t); if (s) e.style.cssText = s; if (x != null) e.textContent = x; return e; };
const IS = "box-sizing:border-box;width:100%;padding:12px;font-size:16px;border-radius:10px;border:1px solid var(--line,#333);background:var(--bg,#111);color:var(--text,inherit);font-family:inherit";
const note = (t) => { const e = E("div", "position:fixed;left:12px;right:12px;bottom:24px;z-index:99999;padding:12px 14px;border-radius:12px;background:rgba(20,24,36,.96);color:#fff;font-size:14px;text-align:center;border:1px solid rgba(255,255,255,.2)", t); document.body.appendChild(e); setTimeout(() => { try { e.remove(); } catch (x) {} }, 4500); };
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
const KINDS = [["sikayet", "\u{1F6A9} Şikayet"], ["istek", "\u{1F4A1} İstek"], ["oneri", "\u{1F4AC} Öneri"]];
const when = (ms) => new Date(ms).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
let A, Au, F, db, auth, me = null, nick = "", adm = false, unA = null, unF = null;
let ann = [], fbs = [], redraw = null;
const tms = (d) => { const t = d.data({ serverTimestamps: "estimate" }).createdAt; return t && t.toMillis ? t.toMillis() : Date.now(); };

/* ---------- Bildirim sesi (odalardaki ses ayarıyla aynı: 🔔 Ses düğmesi ve seçilen ses) ---------- */
const TONES = {
  bip: { n: "Bip", w: "square", v: 0.45, d: 0.16, s: [[880, 0], [1175, 0.16]] },
  zil: { n: "Zil", w: "square", v: 0.4, d: 0.11, s: [[1319, 0], [1568, 0.13], [1319, 0.26], [1568, 0.39], [1319, 0.52], [1568, 0.65]] },
  melodi: { n: "Melodi", w: "triangle", v: 0.9, d: 0.22, s: [[523, 0], [659, 0.2], [784, 0.4], [1047, 0.6], [784, 0.9], [1047, 1.1]] },
  sesli: { n: "Sesli", w: "square", v: 0.4, d: 0.12, s: [[1175, 0], [1568, 0.13]], say: 1 }
};
Object.assign(TONES, EXTRA);
let ac = null, lastDing = 0;
const audio = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch (e) {} };
document.addEventListener("pointerdown", audio, { once: true });
const speak = (text) => { try { if (!("speechSynthesis" in window)) return; const u = new SpeechSynthesisUtterance(text); const v = (speechSynthesis.getVoices() || []).find((x) => /^tr/i.test(x.lang)); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "tr-TR"; speechSynthesis.resume(); speechSynthesis.speak(u); } catch (e) {} };
function ding(text) {
  if (ls("snd") === "0") return;
  const now = Date.now(); if (now - lastDing < 2500) return; lastDing = now;
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]); } catch (e) {}
  const k = ls("tone"), T = (k && TONES[k]) || TONES.sesli;
  try {
    audio();
    if (ac) {
      const t0 = ac.currentTime + 0.02;
      T.s.forEach((nt) => {
        const o = ac.createOscillator(), g = ac.createGain(), t = t0 + nt[1];
        o.type = T.w; o.frequency.setValueAtTime(nt[0], t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(T.v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + T.d);
        o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + T.d + 0.05);
      });
    }
  } catch (e) {}
  if (T.say && text) setTimeout(() => speak(text), 300);
}
let annReady = false, annPrev = 0, fbReady = false, fbPrev = 0;

function sheet(title, onClose) {
  const p = E("div"); p.className = "panel";
  const s = E("div"); s.className = "sheet";
  const h = E("div"); h.className = "sh";
  const x = E("button", "", "Kapat"); x.type = "button";
  const close = () => { redraw = null; try { p.remove(); } catch (e) {} if (onClose) onClose(); };
  x.onclick = close; p.onclick = (ev) => { if (ev.target === p) close(); };
  h.appendChild(E("h2", "", title)); h.appendChild(x); s.appendChild(h); p.appendChild(s); document.body.appendChild(p);
  return { p: p, s: s, close: close };
}

/* ---------- Duyurular ---------- */
function annSeen() { const t = ann.length ? ann[0].at : 0; ls("na_pano_gor", String(t)); badges(); }
function openPano() {
  if (!me) return;
  const w = sheet("\u{1F4E2} Duyurular", () => badges());
  if (adm) {
    const ta = E("textarea", IS + ";min-height:90px;resize:vertical"); ta.maxLength = 1000; ta.placeholder = "Yeni duyuru yaz (herkes görür)…";
    const go = E("button", "margin-top:8px;background:var(--lamp,#f0c24b);color:var(--lamp-ink,#000);border:0;font-weight:700;padding:10px 14px", "Yayınla"); go.type = "button";
    go.onclick = async () => {
      const t = ta.value.trim(); if (!t) return; go.disabled = true;
      try { await F.addDoc(F.collection(db, "announcements"), { text: t, createdAt: F.serverTimestamp() }); ta.value = ""; note("Duyuru yayınlandı."); }
      catch (e) { note("Yayınlanamadı. Firebase kurallarına \"announcements\" eklenmemiş olabilir."); }
      go.disabled = false;
    };
    w.s.appendChild(ta); w.s.appendChild(go);
  }
  const list = E("div"); w.s.appendChild(list);
  const fbk = E("button", "margin-top:14px;width:100%;padding:12px", "\u{1F4E8} Şikayet / istek gönder"); fbk.type = "button"; fbk.onclick = () => { w.close(); openForm(); };
  w.s.appendChild(fbk);
  redraw = () => {
    list.textContent = "";
    if (!ann.length) { list.appendChild(E("p", "color:var(--mute,#999);margin:14px 0", "Henüz duyuru yok.")); return; }
    ann.forEach((a) => {
      const c = E("div", "margin-top:10px;padding:12px;border:1px solid var(--line,#333);border-radius:12px");
      c.appendChild(E("div", "font-size:12px;color:var(--mute,#999);margin-bottom:6px", when(a.at)));
      c.appendChild(E("div", "white-space:pre-wrap;word-break:break-word;font-size:16px;line-height:1.4", a.text));
      if (adm) { const d = E("button", "margin-top:8px;color:var(--danger,#e0786a)", "Sil"); d.type = "button"; d.onclick = async () => { if (!confirm("Bu duyuru silinsin mi?")) return; try { await F.deleteDoc(F.doc(db, "announcements", a.id)); } catch (e) { note("Silinemedi."); } }; c.appendChild(d); }
      list.appendChild(c);
    });
  };
  redraw(); annSeen();
}

/* ---------- Şikayet / İstek gönder ---------- */
function openForm() {
  if (!me) return;
  const w = sheet("\u{1F4E8} Şikayet / İstek");
  w.s.appendChild(E("p", "margin:0 0 10px;color:var(--mute,#999);font-size:14px;line-height:1.4", "Mesajın sadece yöneticiye gider, başka kimse görmez. Takma adın mesajla birlikte iletilir."));
  let kind = "sikayet"; const row = E("div", "display:flex;gap:6px;margin-bottom:10px"); const bs = [];
  KINDS.forEach((k) => { const b = E("button", "flex:1;padding:10px 4px", k[1]); b.type = "button"; b.onclick = () => { kind = k[0]; bs.forEach((x, i) => { x.style.borderColor = KINDS[i][0] === kind ? "var(--lamp,#f0c24b)" : ""; x.style.fontWeight = KINDS[i][0] === kind ? "700" : ""; }); }; bs.push(b); row.appendChild(b); });
  bs[0].style.borderColor = "var(--lamp,#f0c24b)"; bs[0].style.fontWeight = "700";
  const ta = E("textarea", IS + ";min-height:140px;resize:vertical"); ta.maxLength = 1000; ta.placeholder = "Ne olduğunu ya da ne istediğini yaz…";
  const cnt = E("div", "text-align:right;font-size:12px;color:var(--mute,#999);margin-top:4px", "0 / 1000"); ta.oninput = () => { cnt.textContent = ta.value.length + " / 1000"; };
  const go = E("button", "margin-top:10px;width:100%;background:var(--lamp,#f0c24b);color:var(--lamp-ink,#000);border:0;font-weight:700;padding:12px", "Gönder"); go.type = "button";
  go.onclick = async () => {
    const t = ta.value.trim(); if (t.length < 3) { note("Biraz daha ayrıntı yaz."); return; }
    const last = Number(ls("na_fb_son") || 0); if (Date.now() - last < 60000) { note("Biraz bekle, bir dakikada bir mesaj gönderebilirsin."); return; }
    go.disabled = true;
    try { await F.addDoc(F.collection(db, "feedback"), { uid: me, nick: nick, kind: kind, text: t, createdAt: F.serverTimestamp() }); ls("na_fb_son", String(Date.now())); w.close(); note("Mesajın yöneticiye iletildi. Teşekkürler."); }
    catch (e) { note("Gönderilemedi. Biraz sonra tekrar dene."); go.disabled = false; }
  };
  w.s.appendChild(row); w.s.appendChild(ta); w.s.appendChild(cnt); w.s.appendChild(go);
  w.s.appendChild(E("p", "margin:14px 0 0;color:var(--mute,#999);font-size:13px;line-height:1.4", "Acil bir durumda bu kutuyu değil 112'yi ara."));
}

/* ---------- Yönetici gelen kutusu ---------- */
function fbSeen() { const t = fbs.length ? fbs[0].at : 0; ls("na_fb_gor", String(t)); badges(); }
function openInbox() {
  if (!me || !adm) return;
  const w = sheet("\u{1F4E5} Gelen kutusu", () => badges());
  const list = E("div"); w.s.appendChild(list);
  redraw = () => {
    list.textContent = "";
    if (!fbs.length) { list.appendChild(E("p", "color:var(--mute,#999);margin:14px 0", "Gelen mesaj yok.")); return; }
    fbs.forEach((m) => {
      const c = E("div", "margin-top:10px;padding:12px;border:1px solid var(--line,#333);border-radius:12px");
      const kd = (KINDS.find((k) => k[0] === m.kind) || [0, m.kind])[1];
      c.appendChild(E("div", "font-size:13px;color:var(--lamp,#f0c24b);margin-bottom:4px", kd + " · " + m.nick + " · " + when(m.at)));
      c.appendChild(E("div", "white-space:pre-wrap;word-break:break-word;font-size:16px;line-height:1.4", m.text));
      const d = E("button", "margin-top:8px;color:var(--danger,#e0786a)", "Sil"); d.type = "button";
      d.onclick = async () => { if (!confirm("Bu mesaj silinsin mi?")) return; try { await F.deleteDoc(F.doc(db, "feedback", m.id)); } catch (e) { note("Silinemedi."); } };
      c.appendChild(d); list.appendChild(c);
    });
  };
  redraw(); fbSeen();
}

/* ---------- Düğmeler ve rozetler ---------- */
function badges() {
  const seenA = Number(ls("na_pano_gor") || 0), nA = ann.filter((a) => a.at > seenA).length;
  document.querySelectorAll(".pntab").forEach((b) => { b.textContent = "\u{1F4E2} Duyurular" + (nA ? " \u{1F534}" : ""); });
  const seenF = Number(ls("na_fb_gor") || 0), nF = fbs.filter((m) => m.at > seenF).length;
  document.querySelectorAll(".fbtab").forEach((b) => { b.textContent = "\u{1F4E5} Gelen kutusu" + (nF ? " (" + nF + ")" : ""); });
}
function mount() {
  const w = document.querySelector(".mtabs"); if (!w) return false;
  if (!w.querySelector(".pntab")) { const b = E("button", "", "\u{1F4E2} Duyurular"); b.className = "pntab"; b.type = "button"; b.onclick = openPano; w.appendChild(b); }
  if (adm && !w.querySelector(".fbtab")) { const b = E("button", "", "\u{1F4E5} Gelen kutusu"); b.className = "fbtab"; b.type = "button"; b.onclick = openInbox; w.appendChild(b); }
  if (!adm) { const o = w.querySelector(".fbtab"); if (o) o.remove(); }
  badges(); return true;
}
function mountMenu() {
  const pn = document.querySelector(".mpanel"); if (!pn) return false;
  if (!pn.querySelector(".fbmenu")) { const b = E("button", "", "\u{1F4E8} Şikayet / istek gönder"); b.className = "fbmenu"; b.type = "button"; b.setAttribute("data-mrank", "9"); b.onclick = openForm; pn.appendChild(b); }
  return true;
}
function stop() { if (unA) { try { unA(); } catch (e) {} unA = null; } if (unF) { try { unF(); } catch (e) {} unF = null; } ann = []; fbs = []; adm = false; annReady = false; annPrev = 0; fbReady = false; fbPrev = 0; }
async function start(u) {
  me = u.uid;
  try { const s = await F.getDoc(F.doc(db, "users", u.uid)); nick = s.exists() ? s.data().nick : ""; } catch (e) { nick = ""; }
  try { const s = await F.getDoc(F.doc(db, "config", "admin")); adm = s.exists() && s.data().uid === u.uid; } catch (e) { adm = false; }
  unA = F.onSnapshot(F.query(F.collection(db, "announcements"), F.orderBy("createdAt", "desc"), F.limit(30)), { includeMetadataChanges: true }, (s) => {
    ann = s.docs.map((d) => ({ id: d.id, text: String(d.data().text || ""), at: tms(d) })); badges();
    const top = ann.length ? ann[0].at : 0;
    if (!s.metadata.fromCache) { if (annReady && top > annPrev && !adm && !s.metadata.hasPendingWrites) ding("Yeni duyuru var"); annReady = true; }
    annPrev = Math.max(annPrev, top);
    if (redraw && document.querySelector(".panel .sheet")) { redraw(); if (document.querySelector(".pntab") && !adm) annSeen(); }
  }, () => {});
  if (adm) unF = F.onSnapshot(F.query(F.collection(db, "feedback"), F.orderBy("createdAt", "desc"), F.limit(100)), { includeMetadataChanges: true }, (s) => {
    fbs = s.docs.map((d) => ({ id: d.id, nick: String(d.data().nick || "?"), kind: d.data().kind, text: String(d.data().text || ""), at: tms(d) })); badges();
    const top = fbs.length ? fbs[0].at : 0;
    if (!s.metadata.fromCache) { if (fbReady && top > fbPrev && !s.metadata.hasPendingWrites) ding("Yeni mesaj var"); fbReady = true; }
    fbPrev = Math.max(fbPrev, top);
    if (redraw && document.querySelector(".panel .sheet")) redraw();
  }, () => {});
  mount();
}
async function init() {
  let n = 0; while (!(A = await import(FB + "firebase-app.js")).getApps().length) { if (++n > 60) return; await new Promise((r) => setTimeout(r, 500)); }
  Au = await import(FB + "firebase-auth.js"); F = await import(FB + "firebase-firestore.js");
  const app = A.getApps()[0]; auth = Au.getAuth(app); db = F.getFirestore(app);
  Au.onAuthStateChanged(auth, (u) => { stop(); if (!u) { me = null; nick = ""; return; } start(u).catch(() => {}); });
  let k = 0; const iv = setInterval(() => { mount(); if (++k > 80) clearInterval(iv); }, 500);
  let k2 = 0; const iv2 = setInterval(() => { if (mountMenu() || ++k2 > 60) clearInterval(iv2); }, 300);
}
init().catch(() => {});
