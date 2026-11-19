import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Kullanıcı engelleme (ban): yönetici bir kullanıcıyı banlar; banlı kişi mesaj yazamaz.
const auth = getAuth(), db = getFirestore();
const $ = (i) => document.getElementById(i);
let me = null, admin = false, unBan = null, unList = null, obs = null;
let btn = null, panel = null, listEl = null;

function toast(m) {
  const t = $("toast");
  if (!t) return;
  t.textContent = m; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 3200);
}

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

// Banlı kullanıcı: yazma alanını kapat
function lock(on) {
  const inp = $("in"), f = $("sf");
  if (inp) {
    inp.disabled = on;
    if (on) { inp.dataset.ph = inp.placeholder; inp.placeholder = "Hesabın engellendi, mesaj yazamazsın"; }
    else if (inp.dataset.ph) { inp.placeholder = inp.dataset.ph; }
  }
  if (f) f.querySelectorAll("button").forEach((b) => { b.disabled = on; });
}

function watchMyBan(uid) {
  unBan = onSnapshot(doc(db, "bans", uid), (s) => {
    lock(s.exists());
    if (s.exists()) toast("Hesabın yönetici tarafından engellendi.");
  }, () => {});
}

// Yönetici: sohbetteki her mesaja 🚫 Banla düğmesi
function decorate() {
  const log = $("log");
  if (!log || !admin) return;
  log.querySelectorAll(".row:not(.mine)").forEach((row) => {
    if (row.dataset.ban) return;
    const av = row.querySelector(".av"), msg = row.querySelector(".msg");
    if (!av || !msg || !av.dataset.av) return;
    row.dataset.ban = "1";
    let a = msg.querySelector(".acts");
    if (!a) { a = el("div", "acts"); msg.appendChild(a); }
    const b = el("button", "", "🚫 Banla");
    b.type = "button";
    b.onclick = async () => {
      const nm = av.dataset.nm || "kullanıcı";
      if (!confirm(nm + " banlansın mı? Artık mesaj yazamaz.")) return;
      try {
        await setDoc(doc(db, "bans", av.dataset.av), { nick: nm, createdAt: serverTimestamp() });
        toast(nm + " banlandı.");
      } catch (e) { toast("Banlanamadı."); }
    };
    a.appendChild(b);
  });
}

function closePanel() {
  if (unList) { unList(); unList = null; }
  if (panel) panel.hidden = true;
}

function openPanel() {
  if (!panel) {
    panel = el("div", "panel");
    panel.hidden = true;
    const sheet = el("div", "sheet");
    const head = el("div", "sh");
    head.appendChild(el("h2", "", "Banlılar"));
    const x = el("button", "", "Kapat");
    x.type = "button";
    x.onclick = closePanel;
    head.appendChild(x);
    listEl = el("div");
    sheet.appendChild(head); sheet.appendChild(listEl);
    panel.appendChild(sheet);
    panel.onclick = (e) => { if (e.target === panel) closePanel(); };
    document.body.appendChild(panel);
  }
  panel.hidden = false;
  if (unList) unList();
  unList = onSnapshot(collection(db, "bans"), (s) => {
    listEl.innerHTML = "";
    if (s.empty) { listEl.appendChild(el("div", "empty", "Banlı kullanıcı yok.")); return; }
    s.docs.forEach((d) => {
      const row = el("div", "li");
      row.appendChild(el("span", "", d.data().nick || d.id));
      const w = el("div");
      const u = el("button", "", "Banı kaldır");
      u.type = "button";
      u.onclick = () => deleteDoc(d.ref).then(() => toast("Ban kaldırıldı.")).catch(() => toast("Kaldırılamadı."));
      w.appendChild(u); row.appendChild(w);
      listEl.appendChild(row);
    });
  }, () => toast("Liste okunamadı. Kuralları güncelledin mi?"));
}

function startAdmin() {
  admin = true;
  if (!btn) {
    btn = el("button", "", "🚫 Banlılar");
    btn.type = "button";
    btn.onclick = openPanel;
    const fb = $("fb");
    if (fb) fb.parentNode.insertBefore(btn, fb);
  }
  btn.hidden = false;
  const log = $("log");
  if (log && !obs) {
    obs = new MutationObserver(decorate);
    obs.observe(log, { childList: true });
  }
  decorate();
}

function stop() {
  if (unBan) { unBan(); unBan = null; }
  closePanel();
  admin = false;
  if (btn) btn.hidden = true;
  lock(false);
}

onAuthStateChanged(auth, async (u) => {
  stop();
  me = u;
  if (!u) return;
  watchMyBan(u.uid);
  try {
    const s = await getDoc(doc(db, "config", "admin"));
    if (me && me.uid === u.uid && s.exists() && s.data().uid === u.uid) startAdmin();
  } catch (e) {}
});
