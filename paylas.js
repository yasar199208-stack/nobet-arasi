// ↪️ İlet, 🔕 Odayı sessize al, 🆘 Acil durum
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const MUTE_KEY = "na_muted";
let C = null, room = null, muteBtn = null, fwPanel = null, fwList = null, fwTarget = null;
let sosPanel = null, sosLoc = null, sosInfo = null, lastSos = 0;

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

function short(s, n) {
  s = String(s || "").replace(/\s+/g, " ").trim();
  const a = Array.from(s);
  return a.length > n ? a.slice(0, n - 1).join("") + "…" : s;
}

/* ---------- 🔕 Sessize alınan odalar (unread.js de okur) ---------- */
export function mutedList() {
  try { const a = JSON.parse(localStorage.getItem(MUTE_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
function setMuted(a) { try { localStorage.setItem(MUTE_KEY, JSON.stringify(a.slice(0, 300))); } catch (e) {} }
function isMuted(id) { return mutedList().indexOf(id) >= 0; }

function paintMute() {
  if (!muteBtn) return;
  const on = room && isMuted(room.id);
  muteBtn.textContent = on ? "🔕" : "🔔";
  muteBtn.title = on ? "Bu oda sessizde (sesi aç)" : "Bu odayı sessize al";
  muteBtn.setAttribute("aria-pressed", on ? "true" : "false");
  muteBtn.hidden = !room;
}

export function initPaylas(ctx) {
  C = ctx;
  if (document.getElementById("fw-panel")) return;
  const st = document.createElement("style");
  st.textContent =
    "#mtb,#sosb{flex:none;background:none;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:5px 10px;cursor:pointer;font-size:15px}" +
    "#mtb[aria-pressed=true]{border-color:#d9534f;background:rgba(217,83,79,.15)}" +
    "#sosb{border-color:#d9534f;color:#fff;background:#b93a35;font-weight:700}" +
    "body.chat-closed #mtb{display:none!important}" +
    ".fw-panel,.sos-panel{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.55);display:grid;place-items:center;padding:16px}" +
    ".fw-box,.sos-box{width:100%;max-width:400px;max-height:80vh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-top:3px solid var(--lamp);border-radius:12px;padding:16px}" +
    ".sos-box{border-top-color:#d9534f}" +
    ".fw-box h3,.sos-box h3{margin:0 0 6px;font:700 22px var(--head)}" +
    ".fw-prev{color:var(--mute);font-size:13px;margin-bottom:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".fw-item{display:flex;align-items:center;justify-content:space-between;width:100%;margin:0 0 6px;padding:10px 12px;background:var(--bg);border:1px solid var(--line);border-radius:10px;color:var(--text);cursor:pointer;font:inherit;text-align:left}" +
    ".fw-item:disabled{opacity:.6}" +
    ".fw-empty{color:var(--mute);font-size:14px;padding:6px 0}" +
    ".fw-x,.sos-no{width:100%;margin-top:6px;background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:10px;cursor:pointer;font-weight:700}" +
    ".sos-box p{margin:0 0 10px;color:var(--text);font-size:15px}" +
    ".sos-box label{display:flex;align-items:center;gap:8px;margin:8px 0 12px;font-size:15px}" +
    ".sos-box label input{width:20px;height:20px}" +
    ".sos-ok{width:100%;background:#d9534f;color:#fff;border:0;border-radius:10px;padding:12px;cursor:pointer;font-weight:700;font-size:16px}" +
    ".sos-info{color:var(--mute);font-size:13px;min-height:18px;margin-top:6px}" +
    ".msg.sos-msg{border-color:#d9534f!important;background:rgba(217,83,79,.18)!important;box-shadow:0 0 0 2px rgba(217,83,79,.35)}" +
    ".msg.sos-msg > p{font-weight:700}" +
    ".sos-map{display:inline-block;margin-top:6px;background:#d9534f;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-weight:700;font-size:14px;cursor:pointer;text-decoration:none}";
  document.head.appendChild(st);

  // 🔔 / 🔕 ve 🆘 düğmeleri: başlığın yanında
  const rt = document.getElementById("rt");
  const after = document.getElementById("srb") || rt;
  muteBtn = el("button", "", "🔔");
  muteBtn.id = "mtb"; muteBtn.type = "button";
  muteBtn.onclick = () => {
    if (!room) return;
    const a = mutedList(), i = a.indexOf(room.id);
    if (i >= 0) { a.splice(i, 1); C.toast("🔔 Bu odanın sesi açıldı."); }
    else { a.push(room.id); C.toast("🔕 Bu oda sessize alındı."); }
    setMuted(a);
    paintMute();
  };
  const sosBtn = el("button", "", "🆘");
  sosBtn.id = "sosb"; sosBtn.type = "button"; sosBtn.title = "Acil durum: tüm arkadaşlarına haber ver";
  sosBtn.onclick = openSos;
  if (after && after.parentNode) {
    after.parentNode.insertBefore(muteBtn, after.nextSibling);
    after.parentNode.insertBefore(sosBtn, muteBtn.nextSibling);
  }

  // İlet penceresi
  fwPanel = el("div", "fw-panel");
  fwPanel.id = "fw-panel";
  fwPanel.hidden = true;
  const fb = el("div", "fw-box");
  fb.appendChild(el("h3", "", "↪️ Kime iletilsin?"));
  const prev = el("div", "fw-prev", "");
  fb.appendChild(prev);
  fwList = el("div", "");
  fb.appendChild(fwList);
  const fx = el("button", "fw-x", "Vazgeç"); fx.type = "button";
  fx.onclick = () => { fwPanel.hidden = true; };
  fb.appendChild(fx);
  fwPanel.appendChild(fb);
  fwPanel._prev = prev;
  fwPanel.onclick = (e) => { if (e.target === fwPanel) fwPanel.hidden = true; };
  document.body.appendChild(fwPanel);

  // Acil durum penceresi
  sosPanel = el("div", "sos-panel");
  sosPanel.hidden = true;
  const sb = el("div", "sos-box");
  sb.appendChild(el("h3", "", "🆘 Acil durum"));
  sb.appendChild(el("p", "", "Tüm arkadaşlarına özelden \"🆘 ACİL DURUM! Yardıma ihtiyacım var.\" mesajı gidecek."));
  const lab = document.createElement("label");
  sosLoc = document.createElement("input"); sosLoc.type = "checkbox"; sosLoc.checked = true;
  lab.appendChild(sosLoc); lab.appendChild(document.createTextNode("📍 Konumumu da ekle"));
  sb.appendChild(lab);
  const ok = el("button", "sos-ok", "🆘 GÖNDER"); ok.type = "button";
  const no = el("button", "sos-no", "Vazgeç"); no.type = "button";
  sosInfo = el("div", "sos-info", "");
  sb.appendChild(ok); sb.appendChild(no); sb.appendChild(sosInfo);
  sosPanel.appendChild(sb);
  sosPanel.onclick = (e) => { if (e.target === sosPanel) sosPanel.hidden = true; };
  no.onclick = () => { sosPanel.hidden = true; };
  ok.onclick = () => sendSos(ok);
  document.body.appendChild(sosPanel);
}

export function setPaylasRoom(r) {
  room = r;
  paintMute();
}

/* ---------- ↪️ İlet ---------- */
function payloadOf(m) {
  const u = C.user();
  const from = short(m.nick || "kullanıcı", 20);
  const base = { uid: u.uid, nick: C.nick(), createdAt: serverTimestamp() };
  if (m.aud) return Object.assign(base, { text: "↪️ " + from + " kişisinin sesli mesajı", aud: m.aud, dur: m.dur || 1 });
  if (m.img) return Object.assign(base, { text: "↪️ " + from + " kişisinin fotoğrafı", img: m.img });
  const t = "↪️ " + from + ": " + String(m.text || "");
  return Object.assign(base, { text: Array.from(t).slice(0, 400).join("") });
}

function openForward(m) {
  const fr = (C.friends && C.friends()) || [];
  fwTarget = m;
  fwPanel._prev.textContent = m.aud ? "🎙️ Sesli mesaj" : m.img ? "📷 Fotoğraf" : short(m.text, 80);
  fwList.textContent = "";
  if (!fr.length) fwList.appendChild(el("div", "fw-empty", "Henüz arkadaşın yok. Önce 👥 Arkadaşlar'dan birini ekle."));
  fr.forEach((f) => {
    const b = el("button", "fw-item");
    b.type = "button";
    b.appendChild(el("span", "", "💌 " + f.n.slice(1)));
    b.appendChild(el("span", "", "➤"));
    b.onclick = async () => {
      if (!fwTarget) return;
      b.disabled = true;
      try {
        await addDoc(collection(C.db, "dms", f.pairId, "messages"), payloadOf(fwTarget));
        C.toast("↪️ " + f.n.slice(1) + " kişisine iletildi.");
        fwPanel.hidden = true;
      } catch (e) {
        b.disabled = false;
        C.toast(e && e.code === "permission-denied" ? "İletilemedi (izin yok)." : "İletilemedi.");
      }
    };
    fwList.appendChild(b);
  });
  fwPanel.hidden = false;
}

// Mesajın altına ↪️ İlet (anketler hariç)
export function addForwardBtn(msgEl, m) {
  if (!m || !m.id || m.poll || (!m.text && !m.img && !m.aud)) return;
  let a = msgEl.querySelector(".acts");
  if (!a) { a = el("div", "acts"); msgEl.appendChild(a); }
  const b = el("button", "", "↪️ İlet");
  b.type = "button";
  b.onclick = () => openForward(m);
  a.appendChild(b);
}

/* ---------- 🆘 Acil durum ---------- */
function openSos() {
  if (!C.user()) return;
  sosInfo.textContent = "";
  sosPanel.hidden = false;
}

function getPos() {
  return new Promise((res) => {
    if (!navigator.geolocation) { res(null); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => res(p.coords),
      () => res(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

async function sendSos(btn) {
  const u = C.user();
  if (!u) return;
  if (Date.now() - lastSos < 60000) { sosInfo.textContent = "Az önce gönderdin. 1 dakika sonra tekrar deneyebilirsin."; return; }
  const fr = (C.friends && C.friends()) || [];
  if (!fr.length) { sosInfo.textContent = "Arkadaşın yok. Önce 👥 Arkadaşlar'dan birini ekle."; return; }
  btn.disabled = true;
  let text = "🆘 ACİL DURUM! Yardıma ihtiyacım var.";
  if (sosLoc.checked) {
    sosInfo.textContent = "📍 Konum alınıyor…";
    const c = await getPos();
    if (c) text += "\n📍 https://maps.google.com/?q=" + c.latitude.toFixed(5) + "," + c.longitude.toFixed(5);
    else sosInfo.textContent = "Konum alınamadı, konumsuz gönderiliyor…";
  }
  sosInfo.textContent = "Gönderiliyor…";
  let ok = 0;
  await Promise.all(fr.map((f) =>
    addDoc(collection(C.db, "dms", f.pairId, "messages"), { uid: u.uid, nick: C.nick(), text: text, createdAt: serverTimestamp() })
      .then(() => { ok++; }).catch(() => {})
  ));
  btn.disabled = false;
  lastSos = Date.now();
  if (ok) { sosPanel.hidden = true; C.toast("🆘 " + ok + " arkadaşına haber verildi."); if (navigator.vibrate) navigator.vibrate([300, 100, 300]); }
  else sosInfo.textContent = "Gönderilemedi. İnternetini kontrol et.";
}

// Acil mesajını kırmızı göster ve harita düğmesi ekle
export function decorateSos(msgEl, m) {
  const t = String(m.text || "");
  if (t.indexOf("🆘 ACİL DURUM") !== 0) return;
  msgEl.classList.add("sos-msg");
  const mm = t.match(/https:\/\/maps\.google\.com\/\?q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!mm) return;
  const a = document.createElement("a");
  a.className = "sos-map";
  a.href = "https://maps.google.com/?q=" + mm[1] + "," + mm[2];
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = "📍 Haritada aç";
  const acts = msgEl.querySelector(".acts");
  if (acts) msgEl.insertBefore(a, acts); else msgEl.appendChild(a);
}
