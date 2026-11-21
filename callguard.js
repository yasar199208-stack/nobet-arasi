import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { verdict, thumb } from "./nsfw.js?v=1";

// Görüntülü konuşma denetimi: telefonda çalışan yapay zekâ, kamera görüntüsünden birkaç saniyede bir kare alıp bakar.
// Görüntü hiçbir yere gönderilmez. Karşıdan uygunsuz görüntü gelirse bulanıklaştırır ve görüşmeyi kapatır.
// Kendi kameranda uygunsuz görüntü çıkarsa görüşme kapanır ve hesabın otomatik engellenir.
const EVERY = 2500;
const cnv = document.createElement("canvas");
const bad = { rv: 0, lv: 0 }, good = { rv: 0, lv: 0 };
let busy = false, banned = false, lastCall = null;

function toast(m) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 5000);
}

function frame(v) {
  if (!v || v.readyState < 2 || !v.videoWidth) return "";
  const k = 256 / Math.max(v.videoWidth, v.videoHeight);
  cnv.width = Math.max(1, Math.round(v.videoWidth * k));
  cnv.height = Math.max(1, Math.round(v.videoHeight * k));
  try { cnv.getContext("2d").drawImage(v, 0, 0, cnv.width, cnv.height); return cnv.toDataURL("image/jpeg", 0.7); }
  catch (e) { return ""; }
}

function endCall(o) { const b = o.querySelector(".cbar .end"); if (b) b.click(); }

async function selfBan(src) {
  if (banned || !getApps().length) return;
  banned = true;
  try {
    const u = getAuth().currentUser, db = getFirestore();
    if (!u) return;
    const s = await getDoc(doc(db, "users", u.uid));
    const rec = { nick: s.exists() ? s.data().nick : "", createdAt: serverTimestamp(), reason: "nsfw" };
    const t = await thumb(src);
    if (t) rec.thumb = t;
    await setDoc(doc(db, "bans", u.uid), rec);
  } catch (e) {}
}

async function check(o, kind) {
  const v = o.querySelector("." + kind);
  const f = frame(v);
  if (!f) return;
  const r = await verdict(f);
  if (r.level === "error") return;
  if (kind === "rv") {
    if (r.level !== "ok") { good.rv = 0; v.style.filter = "blur(32px)"; }
    else if (++good.rv >= 2) v.style.filter = "";
    bad.rv = r.level === "hard" ? bad.rv + 1 : 0;
    if (bad.rv >= 2) { toast("Karşıdan uygunsuz görüntü geldi, görüşme kapatıldı."); endCall(o); bad.rv = 0; }
  } else {
    bad.lv = r.level === "hard" ? bad.lv + 1 : 0;
    if (r.level === "soft") toast("Kameranda uygunsuz görüntü algılandı. Lütfen kamerayı düzelt.");
    if (bad.lv >= 2) { bad.lv = 0; toast("Uygunsuz görüntü algılandı. Görüşme kapatıldı ve hesabın engellendi."); endCall(o); selfBan(f); }
  }
}

async function tick() {
  if (busy) return;
  const o = document.querySelector(".call");
  if (!o) { bad.rv = bad.lv = good.rv = good.lv = 0; lastCall = null; return; }
  if (o !== lastCall) { lastCall = o; bad.rv = bad.lv = good.rv = good.lv = 0; }
  busy = true;
  try { await check(o, "rv"); await check(o, "lv"); } catch (e) {}
  busy = false;
}

setInterval(tick, EVERY);
