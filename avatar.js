import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Profil resimleri küçük (128x128) JPEG olarak Firestore'da "avatars" koleksiyonunda tutulur.
const AV_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;
const cache = new Map(), pending = new Set();
let db = null, colorOf = null, toast = null, onLoad = null, target = null;

export function initAvatars(database, colorFn, toastFn, loadedFn) {
  db = database; colorOf = colorFn; toast = toastFn; onLoad = loadedFn;
  const f = document.createElement("input");
  f.type = "file"; f.accept = "image/*"; f.hidden = true; f.id = "avfile";
  document.body.appendChild(f);
  f.onchange = () => {
    const file = f.files && f.files[0];
    f.value = "";
    if (file) save(file, target);
  };
}

export function hasAv(uid) { return !!cache.get(uid); }

export function paintAv(el, uid, nm) {
  const img = cache.get(uid);
  if (img) {
    el.style.background = "center / cover no-repeat url(\"" + img + "\")";
    el.textContent = "";
  } else {
    el.style.background = colorOf(nm || "");
    el.textContent = (nm || "?").charAt(0).toLocaleUpperCase("tr");
  }
}

export function refreshAvs(uid) {
  document.querySelectorAll(".av[data-av]").forEach((el) => {
    if (el.dataset.av === uid) paintAv(el, uid, el.dataset.nm);
  });
  if (onLoad) onLoad();
}

export async function loadAv(uid) {
  if (cache.has(uid) || pending.has(uid)) return;
  pending.add(uid);
  let img = "";
  try {
    const s = await getDoc(doc(db, "avatars", uid));
    const v = s.exists() ? s.data().img : "";
    if (typeof v === "string" && AV_RE.test(v)) img = v;
  } catch (e) { img = ""; }
  cache.set(uid, img);
  pending.delete(uid);
  refreshAvs(uid);
}

function toSquareJpeg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const S = 128, c = document.createElement("canvas");
      c.width = S; c.height = S;
      const g = c.getContext("2d");
      const side = Math.min(im.width, im.height);
      g.drawImage(im, (im.width - side) / 2, (im.height - side) / 2, side, side, 0, 0, S, S);
      URL.revokeObjectURL(url);
      let q = 0.8, data = c.toDataURL("image/jpeg", q);
      while (data.length > 38000 && q > 0.3) { q -= 0.1; data = c.toDataURL("image/jpeg", q); }
      resolve(data);
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad-image")); };
    im.src = url;
  });
}

async function save(file, uid) {
  if (!uid) return;
  if (!/^image\//.test(file.type)) { toast("Lütfen bir resim seç."); return; }
  try {
    const data = await toSquareJpeg(file);
    await setDoc(doc(db, "avatars", uid), { img: data, updatedAt: serverTimestamp() });
    cache.set(uid, data);
    refreshAvs(uid);
    toast("Profil resmin güncellendi.");
  } catch (e) {
    toast(e && e.code === "permission-denied" ? "İşlem reddedildi. Güvenlik kurallarını güncelledin mi?" : "Resim kaydedilemedi. Başka bir resim dene.");
  }
}

export function pickPhoto(uid) {
  target = uid;
  document.getElementById("avfile").click();
}

export async function removePhoto(uid) {
  try {
    await deleteDoc(doc(db, "avatars", uid));
    cache.set(uid, "");
    refreshAvs(uid);
    toast("Profil resmin kaldırıldı.");
  } catch (e) { toast("Resim kaldırılamadı."); }
}
