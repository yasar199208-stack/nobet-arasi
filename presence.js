// Çevrimiçi / çevrimdışı: giriş yapan herkes uygulama açıkken 90 saniyede bir "presence" kaydını günceller.
// 4 dakikadan taze kayıt = çevrimiçi. Listeyi sadece ekran açıkken canlı dinler.
const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const E = (t, s, x) => { const e = document.createElement(t); if (s) e.style.cssText = s; if (x != null) e.textContent = x; return e; };
const BS = "border:1px solid var(--line,#333);background:transparent;color:inherit;border-radius:12px;padding:10px 14px;font-size:15px;cursor:pointer";
const IS = "box-sizing:border-box;padding:12px;font-size:16px;border-radius:12px;border:1px solid var(--line,#333);background:transparent;color:inherit;width:100%";
const BEAT = 90000, LIVE = 240000;
const fold = (s) => String(s).toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const hid = () => { try { return localStorage.getItem("na_gizli") === "1"; } catch (e) { return false; } };
const ago = (ms) => { const m = Math.floor(ms / 60000); if (m < 1) return "az önce"; if (m < 60) return m + " dk önce"; const h = Math.floor(m / 60); if (h < 24) return h + " sa önce"; const d = Math.floor(h / 24); return d + " gün önce"; };
let A, Au, F, db, auth, me = null, nick = "", hb = null, perm = false;
async function beat() {
  if (!me || !nick || document.visibilityState === "hidden") return;
  try { await F.setDoc(F.doc(db, "presence", me), { nick: nick, at: F.serverTimestamp(), hide: hid() }); perm = false; } catch (e) { perm = true; }
}
function startBeat() { stopBeat(); beat(); hb = setInterval(beat, BEAT); }
function stopBeat() { if (hb) { clearInterval(hb); hb = null; } }
function open() {
  if (document.getElementById("prOv")) return;
  const ov = E("div", "position:fixed;inset:0;z-index:99998;background:var(--bg,#0f1320);color:var(--text,#eee);overflow:auto;padding:14px;font-family:inherit"); ov.id = "prOv";
  const top = E("div", "display:flex;align-items:center;gap:10px"); const bk = E("button", BS, "← Geri"); bk.type = "button"; top.appendChild(bk); top.appendChild(E("b", "font-size:17px", "🟢 Kimler çevrimiçi?")); ov.appendChild(top);
  const body = E("div"); ov.appendChild(body); document.body.appendChild(ov);
  let un = null, tm = null, docs = [], q = "", err = false, sel = "", fr = new Set(), outg = new Set(), inc = new Set(), blk = new Set(), uns = [], msg = "";
  const close = () => { try { un && un(); } catch (e) {} uns.forEach((f) => { try { f(); } catch (e) {} }); clearInterval(tm); try { ov.remove(); } catch (e) {} window.removeEventListener("popstate", close); };
  bk.onclick = () => { close(); try { if (history.state && history.state.pr) history.back(); } catch (e) {} };
  try { history.pushState({ pr: 1, vdb: 1 }, ""); window.addEventListener("popstate", close); } catch (e) {}
  const gz = E("button", BS + ";width:100%;margin-top:12px;font-size:14px", ""); gz.type = "button";
  const gzt = () => { gz.textContent = hid() ? "👁️ Durumum gizli (diğerleri beni göremez). Açmak için dokun" : "👁️ Durumumu gizle (kimse beni çevrimiçi görmesin)"; };
  gz.onclick = () => { try { localStorage.setItem("na_gizli", hid() ? "0" : "1"); } catch (e) {} gzt(); document.visibilityState !== "hidden" && beat().then(() => {}); }; gzt(); body.appendChild(gz);
  const qi = E("input", IS + ";margin-top:12px"); qi.placeholder = "İsimle ara"; qi.oninput = () => { q = qi.value; draw(); }; body.appendChild(qi);
  const info = E("div", "margin-top:10px;font-size:13px;opacity:.8;line-height:1.5"); body.appendChild(info);
  const lw = E("div"); body.appendChild(lw);
  const draw = () => {
    lw.innerHTML = ""; const now = Date.now(), w = fold(q).split(" ").filter(Boolean);
    if (err) { info.textContent = "Liste açılamadı. Firebase'de \"presence\" kuralı eklenmemiş olabilir ya da internet yok."; return; }
    const vis = docs.filter((d) => (!d.hide || d.uid === me) && (!w.length || w.every((x) => fold(d.nick).split(/[^a-z0-9]+/).some((y) => y.indexOf(x) === 0))));
    const on = vis.filter((d) => now - d.at < LIVE).sort((a, b) => fold(a.nick) < fold(b.nick) ? -1 : 1), off = vis.filter((d) => now - d.at >= LIVE).sort((a, b) => b.at - a.at);
    info.textContent = on.length + " kişi çevrimiçi, " + off.length + " kişi çevrimdışı" + (perm ? " (senin durumun yazılamadı: kural eksik)" : "") + ". Liste canlı güncellenir. Birine dokunup arkadaşlık isteği gönderebilirsin.";
    const sec = (t, a, c, on2) => {
      const s = E("div", "margin-top:16px;border:1px solid var(--line,#333);border-radius:14px;padding:10px 12px"); s.appendChild(E("div", "font-weight:700;font-size:16px", t + " · " + a.length));
      a.forEach((d) => {
        const w2 = E("div", "margin-top:10px"), r = E("div", "display:flex;align-items:center;gap:10px;" + (d.uid === me ? "" : "cursor:pointer")); r.appendChild(E("span", "width:10px;height:10px;border-radius:50%;flex:none;background:" + c)); r.appendChild(E("span", "flex:1;font-size:15px;font-weight:600;word-break:break-word", d.nick + (d.uid === me ? " (sen)" : "")));
        const stt = d.uid === me ? "" : fr.has(d.uid) ? "✓ arkadaş" : outg.has(d.uid) ? "⏳ istek gönderildi" : inc.has(d.uid) ? "📩 sana istek gönderdi" : "";
        if (stt) r.appendChild(E("span", "font-size:12px;opacity:.85", stt)); if (!on2) r.appendChild(E("span", "font-size:12px;opacity:.7", ago(now - d.at)));
        if (d.uid !== me) r.onclick = () => { sel = sel === d.uid ? "" : d.uid; msg = ""; draw(); }; w2.appendChild(r);
        if (sel === d.uid) {
          const bx = E("div", "margin-top:8px;padding:10px;border-radius:12px;background:rgba(255,255,255,.07);font-size:14px;line-height:1.5");
          if (fr.has(d.uid)) bx.textContent = "Arkadaşsınız. Özel mesaj için 💌 Özel mesaj sekmesinden yaz.";
          else if (outg.has(d.uid)) bx.textContent = "İstek gönderildi. Karşı taraf kabul edince arkadaş olursunuz.";
          else if (inc.has(d.uid)) bx.textContent = "Bu kişi sana istek göndermiş. 👥 Arkadaşlar bölümünden kabul edebilirsin.";
          else if (blk.has(d.uid)) bx.textContent = "Bu kişiyi engellemişsin.";
          else { const b = E("button", BS + ";width:100%;font-weight:700", "➕ Arkadaşlık isteği gönder"); b.type = "button"; b.onclick = async () => { b.disabled = true; try { await F.setDoc(F.doc(db, "friendRequests", me + "_" + d.uid), { from: me, to: d.uid, fromNick: nick, toNick: d.nick, createdAt: F.serverTimestamp() }); outg.add(d.uid); msg = "İstek gönderildi."; } catch (e) { msg = "İstek gönderilemedi, tekrar dene."; } draw(); }; bx.appendChild(b); }
          if (msg) bx.appendChild(E("div", "margin-top:6px;opacity:.9", msg)); w2.appendChild(bx);
        }
        s.appendChild(w2);
      });
      if (!a.length) s.appendChild(E("div", "margin-top:8px;font-size:13px;opacity:.7", on2 ? "Şu an kimse çevrimiçi değil." : "Kimse yok."));
      lw.appendChild(s);
    };
    sec("🟢 Çevrimiçi", on, "#3ecf6e", true); sec("⚪ Çevrimdışı", off, "#8a94a6", false);
  };
  try {
    un = F.onSnapshot(F.query(F.collection(db, "presence"), F.orderBy("at", "desc"), F.limit(300)), (s) => {
      err = false; docs = s.docs.map((d) => { const x = d.data({ serverTimestamps: "estimate" }); return { uid: d.id, nick: String(x.nick || "?"), at: x.at && x.at.toMillis ? x.at.toMillis() : Date.now(), hide: !!x.hide }; }); draw();
    }, () => { err = true; draw(); });
  } catch (e) { err = true; }
  try {
    uns.push(F.onSnapshot(F.query(F.collection(db, "friendships"), F.where("members", "array-contains", me)), (s) => { fr = new Set(s.docs.map((d) => (d.data().members || []).find((x) => x !== me))); draw(); }, () => {}));
    uns.push(F.onSnapshot(F.query(F.collection(db, "friendRequests"), F.where("from", "==", me)), (s) => { outg = new Set(s.docs.map((d) => d.data().to)); draw(); }, () => {}));
    uns.push(F.onSnapshot(F.query(F.collection(db, "friendRequests"), F.where("to", "==", me)), (s) => { inc = new Set(s.docs.map((d) => d.data().from)); draw(); }, () => {}));
    F.getDocs(F.collection(db, "users", me, "blocks")).then((s) => { blk = new Set(s.docs.map((d) => d.id)); }).catch(() => {});
  } catch (e) {}
  tm = setInterval(draw, 20000); draw();
}
function mount() {
  const w = document.querySelector(".mtabs"); if (!w) return false;
  if (!w.querySelector(".prtab")) { const b = E("button", "", "🟢 Çevrimiçi"); b.className = "prtab"; b.type = "button"; b.onclick = () => { if (!me) return; open(); }; w.appendChild(b); }
  return true;
}
async function init() {
  let n = 0; while (!(A = await import(FB + "firebase-app.js")).getApps().length) { if (++n > 60) return; await new Promise((r) => setTimeout(r, 500)); }
  Au = await import(FB + "firebase-auth.js"); F = await import(FB + "firebase-firestore.js");
  const app = A.getApps()[0]; auth = Au.getAuth(app); db = F.getFirestore(app);
  Au.onAuthStateChanged(auth, async (u) => {
    if (!u) { me = null; nick = ""; stopBeat(); return; }
    me = u.uid; try { const s = await F.getDoc(F.doc(db, "users", u.uid)); nick = s.exists() ? s.data().nick : ""; } catch (e) { nick = ""; }
    if (nick) startBeat();
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") beat(); });
  let k = 0; const iv = setInterval(() => { if (mount() || ++k > 60) clearInterval(iv); }, 300);
}
init().catch(() => {});
