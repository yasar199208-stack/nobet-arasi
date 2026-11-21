import { getAuth, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, deleteDoc, collection, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Hesabımı sil: kullanıcının kendi verilerini siler, sonra giriş hesabını kaldırır.
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);
let btn = null, panel = null, busy = false;

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

function toast(m) {
  const t = $("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 4500);
}

async function delAll(refs) {
  for (let i = 0; i < refs.length; i += 25) {
    await Promise.all(refs.slice(i, i + 25).map((r) => deleteDoc(r)));
  }
}

async function tryDel(ref) {
  try { await deleteDoc(ref); } catch (e) {}
}

async function wipe(user) {
  const uid = user.uid;
  let nick = "";
  try {
    const s = await getDoc(doc(db, "users", uid));
    if (s.exists()) nick = s.data().nick || "";
  } catch (e) {}

  // Engellediğin kişiler
  const bl = await getDocs(collection(db, "users", uid, "blocks"));
  await delAll(bl.docs.map((d) => d.ref));

  // Arkadaşlıklar: önce kendi özel mesajların, arama kayıtları, sonra arkadaşlık
  const fr = await getDocs(query(collection(db, "friendships"), where("members", "array-contains", uid)));
  for (const f of fr.docs) {
    const ms = await getDocs(query(collection(db, "dms", f.id, "messages"), where("uid", "==", uid)));
    await delAll(ms.docs.map((d) => d.ref));
    try {
      const cs = await getDocs(collection(db, "calls", f.id, "cands"));
      await delAll(cs.docs.map((d) => d.ref));
    } catch (e) {}
    await tryDel(doc(db, "calls", f.id));
    await deleteDoc(f.ref);
  }

  // Arkadaşlık istekleri
  const o = await getDocs(query(collection(db, "friendRequests"), where("from", "==", uid)));
  const i = await getDocs(query(collection(db, "friendRequests"), where("to", "==", uid)));
  await delAll(o.docs.concat(i.docs).map((d) => d.ref));

  // Profil resmi, takma ad, profil
  await tryDel(doc(db, "avatars", uid));
  if (nick) await tryDel(doc(db, "nicks", nick.toLocaleLowerCase("tr")));
  await deleteDoc(doc(db, "users", uid));
}

async function run(pw, msg, go) {
  const user = auth.currentUser;
  if (!user || busy) return;
  if (!pw) { msg.textContent = "Şifreni yaz."; return; }
  busy = true; go.disabled = true; msg.textContent = "Siliniyor, bekle…";
  try {
    // Yönetici hesabı yanlışlıkla silinmesin
    try {
      const a = await getDoc(doc(db, "config", "admin"));
      if (a.exists() && a.data().uid === user.uid) { msg.textContent = "Yönetici hesabı buradan silinemez."; busy = false; go.disabled = false; return; }
    } catch (e) {}

    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, pw));
    await wipe(user);
    await deleteUser(user);
    panel.hidden = true;
    toast("Hesabın ve verilerin silindi.");
  } catch (e) {
    const c = e && e.code;
    if (c === "auth/wrong-password" || c === "auth/invalid-credential") msg.textContent = "Şifre hatalı.";
    else if (c === "auth/too-many-requests") msg.textContent = "Çok fazla deneme. Biraz bekle.";
    else if (c === "auth/network-request-failed") msg.textContent = "İnternet bağlantısı yok.";
    else msg.textContent = "Silme tamamlanamadı. Tekrar dene ya da nobetarasi.destek@gmail.com adresine yaz.";
  }
  busy = false; go.disabled = false;
}

function open() {
  if (!panel) {
    panel = el("div", "panel");
    panel.hidden = true;
    const sheet = el("div", "sheet");
    const head = el("div", "sh");
    head.appendChild(el("h2", "", "Hesabımı sil"));
    const x = el("button", "", "Vazgeç");
    x.type = "button";
    x.onclick = () => { if (!busy) panel.hidden = true; };
    head.appendChild(x);
    sheet.appendChild(head);
    const p = el("p", "", "Hesabın, takma adın, profil resmin, arkadaşlıkların ve özel sohbetlerdeki mesajların kalıcı olarak silinir. Bu işlem geri alınamaz. Herkese açık odalarda yazdığın eski mesajlar kalabilir; silinmesini istersen nobetarasi.destek@gmail.com adresine yaz.");
    p.style.cssText = "margin:0 0 12px;color:var(--mute);font-size:14px";
    sheet.appendChild(p);
    const pw = el("input");
    pw.type = "password";
    pw.placeholder = "Şifreni yaz";
    pw.autocomplete = "current-password";
    pw.style.cssText = "width:100%;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin-bottom:10px";
    sheet.appendChild(pw);
    const msg = el("div", "", "");
    msg.style.cssText = "color:var(--danger);font-size:14px;min-height:20px;margin-bottom:8px";
    sheet.appendChild(msg);
    const go = el("button", "", "Hesabımı kalıcı olarak sil");
    go.type = "button";
    go.style.cssText = "width:100%;background:var(--danger);color:#fff;border:0;font-weight:700;padding:10px";
    go.onclick = () => {
      if (!pw.value) { msg.textContent = "Şifreni yaz."; return; }
      if (!confirm("Hesabın ve tüm verilerin kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misin?")) return;
      const a = prompt("Onaylamak için SİL yaz:");
      if (!a || a.trim().toLocaleUpperCase("tr") !== "SİL") { msg.textContent = "Onay verilmedi, hesap silinmedi."; return; }
      run(pw.value, msg, go);
    };
    sheet.appendChild(go);
    panel.appendChild(sheet);
    panel.onclick = (e) => { if (e.target === panel && !busy) panel.hidden = true; };
    document.body.appendChild(panel);
    panel._pw = pw; panel._msg = msg;
  }
  panel._pw.value = ""; panel._msg.textContent = "";
  panel.hidden = false;
}

function ensureBtn() {
  if (btn && btn.isConnected) { btn.hidden = false; return; }
  const out = $("out");
  if (!out || !out.parentNode) return;
  btn = el("button", "", "🗑️ Hesabımı sil");
  btn.type = "button";
  btn.onclick = open;
  out.parentNode.insertBefore(btn, out);
}

let signedIn = false;
onAuthStateChanged(auth, (u) => {
  signedIn = !!u;
  if (u) ensureBtn();
  else {
    if (btn) btn.hidden = true;
    if (panel) panel.hidden = true;
  }
});
// Düğme sonradan kaybolursa ya da sayfa geç yüklenirse yeniden ekle
setInterval(() => { if (signedIn) ensureBtn(); }, 1500);
