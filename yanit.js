// ↩️ Yanıtla: bir mesaja alıntılı cevap verme. Gönderilen mesaja rep: { id, nick, t } eklenir.

let C = null, bar = null, barWho = null, barTxt = null, rep = null;

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

export function initReply(ctx) {
  C = ctx;
  if (document.getElementById("rpl-bar")) return;
  const st = document.createElement("style");
  st.textContent =
    ".rpl-bar{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--panel);border-top:1px solid var(--line);border-left:4px solid var(--lamp)}" +
    ".rpl-bar .rpl-in{flex:1;min-width:0}" +
    ".rpl-bar .rpl-who{display:block;color:var(--lamp);font-weight:700;font-size:13px}" +
    ".rpl-bar .rpl-txt{display:block;color:var(--mute);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".rpl-bar .rpl-x{flex:0 0 auto;background:none;border:1px solid var(--line);color:var(--text);border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px}" +
    ".rpl-q{display:block;width:100%;text-align:left;margin:4px 0 2px;padding:5px 9px;background:rgba(127,150,180,.14);border:0;border-left:3px solid var(--lamp);border-radius:6px;color:var(--text);cursor:pointer;font:inherit}" +
    ".rpl-q .rpl-who{display:block;color:var(--lamp);font-weight:700;font-size:12px}" +
    ".rpl-q .rpl-txt{display:block;color:var(--mute);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px}" +
    ".rpl-flash{animation:rplflash 1.6s ease}" +
    "@keyframes rplflash{0%,40%{box-shadow:0 0 0 3px var(--lamp)}100%{box-shadow:0 0 0 0 transparent}}";
  document.head.appendChild(st);

  bar = el("div", "rpl-bar");
  bar.id = "rpl-bar";
  bar.hidden = true;
  const inn = el("div", "rpl-in");
  barWho = el("span", "rpl-who", "");
  barTxt = el("span", "rpl-txt", "");
  inn.appendChild(barWho); inn.appendChild(barTxt);
  const x = el("button", "rpl-x", "✖");
  x.type = "button";
  x.setAttribute("aria-label", "Yanıtı iptal et");
  x.onclick = clearRep;
  bar.appendChild(inn); bar.appendChild(x);
  const form = document.getElementById("sf");
  if (form && form.parentNode) form.parentNode.insertBefore(bar, form);
}

// Gönderilecek mesaja eklenecek yanıt bilgisi (yoksa null)
export function getRep() {
  return rep ? { id: rep.id, nick: rep.nick, t: rep.t } : null;
}

export function clearRep() {
  rep = null;
  if (bar) bar.hidden = true;
}

function preview(msgEl, m) {
  if (m.aud) return "🎙️ Sesli mesaj";
  if (m.img) return "📷 Fotoğraf";
  const p = msgEl.querySelector(":scope > p");
  const t = (p && p.textContent) || m.text || "";
  return short(t, 90) || "Mesaj";
}

// Mesajın altına ↩️ Yanıtla düğmesi
export function addReplyBtn(msgEl, m) {
  if (!m || !m.id) return;
  let a = msgEl.querySelector(".acts");
  if (!a) { a = document.createElement("div"); a.className = "acts"; msgEl.appendChild(a); }
  const b = el("button", "", "↩️ Yanıtla");
  b.type = "button";
  b.onclick = () => {
    rep = { id: String(m.id).slice(0, 40), nick: short(m.nick || "kullanıcı", 20), t: preview(msgEl, m) };
    barWho.textContent = "↩️ " + rep.nick + " kişisine yanıt";
    barTxt.textContent = rep.t;
    bar.hidden = false;
    const inp = document.getElementById("in");
    if (inp) { try { inp.focus(); } catch (e) {} }
  };
  a.insertBefore(b, a.firstChild);
}

// Mesajın içine alıntı kutusu. Dokununca asıl mesaja kaydırır.
export function addQuote(msgEl, r) {
  if (!r || typeof r !== "object") return;
  const q = el("button", "rpl-q");
  q.type = "button";
  q.appendChild(el("span", "rpl-who", "↩️ " + short(r.nick || "kullanıcı", 20)));
  q.appendChild(el("span", "rpl-txt", short(r.t || "", 100)));
  q.onclick = () => {
    const row = document.querySelector('.row[data-mid="' + String(r.id || "").replace(/[^A-Za-z0-9_-]/g, "") + '"]');
    if (!row) { if (C) C.toast("Bu mesaj artık görünmüyor (silinmiş ya da çok eski)."); return; }
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    const box = row.querySelector(".msg") || row;
    box.classList.remove("rpl-flash");
    void box.offsetWidth;
    box.classList.add("rpl-flash");
  };
  const who = msgEl.querySelector(".who");
  if (who && who.nextSibling) msgEl.insertBefore(q, who.nextSibling);
  else msgEl.appendChild(q);
}
