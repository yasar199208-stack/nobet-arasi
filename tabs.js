(function () {
  var $ = function (i) { return document.getElementById(i); };
  var rooms = $("rooms");
  var title = $("rt");
  var q = $("q");
  if (!rooms || !title || !q) return;

  var st = document.createElement("style");
  st.textContent =
    ".mtabs{display:flex;gap:6px;padding:8px 10px 0}" +
    ".mtabs button{flex:1;background:none;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:7px 8px;cursor:pointer;font-size:15px}" +
    ".mtabs button[aria-pressed=\"true\"]{border-color:var(--lamp);background:rgba(127,150,180,.15);font-weight:600}" +
    ".mtabs button:focus-visible{outline:2px solid var(--lamp);outline-offset:2px}" +
    ".mtabs button.mnew{border-color:#e5484d;box-shadow:0 0 0 2px rgba(229,72,77,.35);animation:mpulse 1.4s ease-in-out infinite}" +
    ".mbadge{display:inline-block;min-width:20px;padding:1px 6px;margin-left:6px;border-radius:10px;background:#e5484d;color:#fff;font-size:13px;font-weight:700;line-height:18px;text-align:center}" +
    "@keyframes mpulse{0%,100%{box-shadow:0 0 0 2px rgba(229,72,77,.35)}50%{box-shadow:0 0 0 5px rgba(229,72,77,.15)}}" +
    "#mempty{padding:14px 16px;color:var(--mute);font-size:14px}" +
    "body.mcol #rooms,body.mcol #rooms .room,body.mcol #mempty{display:none!important}";
  document.head.appendChild(st);

  var wrap = document.createElement("div");
  wrap.className = "mtabs";
  var bRooms = document.createElement("button");
  bRooms.type = "button";
  var bDm = document.createElement("button");
  bDm.type = "button";
  wrap.appendChild(bRooms);
  wrap.appendChild(bDm);
  q.parentNode.insertBefore(wrap, q);

  var empty = document.createElement("div");
  empty.id = "mempty";
  empty.hidden = true;
  empty.textContent = "Henüz özel mesajın yok. Arkadaş ekleyince konuşmalar burada görünür.";
  rooms.parentNode.insertBefore(empty, rooms.nextSibling);

  var tab = "rooms";
  var collapsed = false;

  function isDmChip(el) {
    var b = el.querySelector("b");
    return !!b && b.textContent.indexOf("💌") === 0;
  }

  // unread.js okunmamış sohbetin başlığına .ud (🔴) ekler
  function hasUnread(el) {
    return !!el.querySelector(".ud");
  }

  function apply() {
    var list = rooms.querySelectorAll(".room");
    var count = 0;
    var unread = 0;
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      var dm = isDmChip(el);
      if (dm) {
        count++;
        var u = hasUnread(el);
        if (u) unread++;
        el.style.borderColor = u ? "#e5484d" : "";
        var b = el.querySelector("b");
        if (b) b.style.fontWeight = u ? "800" : "";
      }
      el.style.display = ((tab === "dm") === dm) ? "" : "none";
    }
    var mark = function (on) { return on ? (collapsed ? " ▸" : " ▾") : ""; };
    bRooms.textContent = "🏠 Odalar" + mark(tab === "rooms");
    bDm.textContent = "💬 Mesajlar" + (count ? " (" + count + ")" : "") + mark(tab === "dm");
    if (unread) {
      var bd = document.createElement("span");
      bd.className = "mbadge";
      bd.textContent = unread;
      bDm.appendChild(bd);
    }
    bDm.classList.toggle("mnew", unread > 0 && tab !== "dm");
    bRooms.setAttribute("aria-pressed", tab === "rooms");
    bDm.setAttribute("aria-pressed", tab === "dm");
    rooms.hidden = false;
    document.body.classList.toggle("mcol", collapsed);
    empty.hidden = collapsed || !(tab === "dm" && count === 0);
  }

  // Açık sekmeye tekrar basınca liste kapanır/açılır; diğer sekmeye basınca o sekme açılır
  bRooms.onclick = function () { if (tab === "rooms") collapsed = !collapsed; else { tab = "rooms"; collapsed = false; } apply(); };
  bDm.onclick = function () { if (tab === "dm") collapsed = !collapsed; else { tab = "dm"; collapsed = false; } apply(); };

  new MutationObserver(apply).observe(rooms, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class"] });

  new MutationObserver(function () {
    tab = title.textContent.indexOf("💌") === 0 ? "dm" : "rooms";
    apply();
  }).observe(title, { childList: true, characterData: true, subtree: true });

  apply();
})();

(function () {
  var KEYS = [
    ["sikayetler", 0], ["profil resmim", 1], ["banlilar", 2], ["engelleri", 3],
    ["arkadaslar", 4], ["ses", 5], ["sesli", 6], ["cikis", 7]
  ];

  function fold(s) {
    return String(s || "").toLocaleLowerCase("tr")
      .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
      .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
      .replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  }

  // Düğmenin yazısından sırasını bulur; menüye ait değilse -1
  function rank(b) {
    var t = fold(b.textContent);
    if (!t) return -1;
    if (t === "sesli") return 6;
    if (t.indexOf("ses ") === 0 || t === "ses") return 5;
    for (var i = 0; i < KEYS.length; i++) {
      if (KEYS[i][0] === "ses" || KEYS[i][0] === "sesli") continue;
      if (t.indexOf(KEYS[i][0]) === 0) return KEYS[i][1];
    }
    return -1;
  }

  var st = document.createElement("style");
  st.textContent =
    ".mmenu{background:none;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:8px 14px;cursor:pointer;font-size:15px;font-weight:600}" +
    ".mmenu[aria-expanded=\"true\"]{border-color:var(--lamp);background:rgba(127,150,180,.15)}" +
    ".mback{position:fixed;left:0;top:0;right:0;bottom:0;z-index:40;background:rgba(0,0,0,.35)}" +
    ".mpanel{position:fixed;left:12px;right:12px;z-index:41;max-width:340px;margin-left:auto;background:var(--panel);border:1px solid var(--lamp);border-radius:14px;padding:10px;box-shadow:0 10px 28px rgba(0,0,0,.5);overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}" +
    ".mpanel .minfo{padding:4px 6px 10px;border-bottom:1px solid var(--line);margin-bottom:8px}" +
    ".mpanel .minfo b{display:block;font-size:16px}" +
    ".mpanel .minfo span{display:block;color:var(--mute);font-size:13px;margin-top:2px}" +
    ".mpanel button{display:flex!important;align-items:center;gap:8px;width:100%;margin:0 0 6px!important;text-align:left;justify-content:flex-start;padding:9px 12px;font-size:16px;cursor:pointer;background:rgba(127,150,180,.12)!important;color:var(--text)!important;border:1px solid var(--line)!important;border-radius:10px!important}" +
    ".mpanel button[hidden]{display:none!important}";
  document.head.appendChild(st);

  var panel = document.createElement("div");
  panel.className = "mpanel";
  panel.hidden = true;
  var info = document.createElement("div");
  info.className = "minfo";
  var infoT = document.createElement("b");
  var infoD = document.createElement("span");
  info.appendChild(infoT);
  info.appendChild(infoD);
  panel.appendChild(info);
  var back = document.createElement("div");
  back.className = "mback";
  back.hidden = true;
  document.body.appendChild(back);
  document.body.appendChild(panel);

  var menuBtn = document.createElement("button");
  menuBtn.type = "button";
  menuBtn.className = "mmenu";
  menuBtn.textContent = "⚙️ Menü";
  menuBtn.setAttribute("aria-expanded", "false");

  var row = null;      // düğmelerin eski satırı
  var descEl = null;   // oda açıklaması

  function close() {
    panel.hidden = true;
    back.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
  }

  function open() {
    var title = document.getElementById("rt");
    infoT.textContent = title ? title.textContent.trim() : "";
    infoD.textContent = descEl ? descEl.textContent.trim() : "";
    infoD.hidden = !infoD.textContent;
    var r = menuBtn.getBoundingClientRect();
    var top = Math.min(r.bottom + 8, window.innerHeight - 200);
    panel.style.top = top + "px";
    panel.style.maxHeight = Math.max(160, window.innerHeight - top - 28) + "px";
    panel.hidden = false;
    back.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
  }

  menuBtn.onclick = function () { if (panel.hidden) open(); else close(); };
  back.onclick = close;
  // Panelde bir düğmeye basılınca menüyü kapat (düğmenin kendi işi önce çalışır)
  panel.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("button")) setTimeout(close, 0);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  function place(b, rk) {
    b.setAttribute("data-mrank", rk);
    var kids = panel.querySelectorAll("button[data-mrank]");
    for (var i = 0; i < kids.length; i++) {
      if (parseInt(kids[i].getAttribute("data-mrank"), 10) > rk) {
        panel.insertBefore(b, kids[i]);
        return;
      }
    }
    panel.appendChild(b);
  }

  var busy = false;
  function scan() {
    busy = false;
    var all = document.querySelectorAll("button");
    for (var i = 0; i < all.length; i++) {
      var b = all[i];
      if (panel.contains(b) || b === menuBtn) continue;
      if (b.closest(".msg") || b.closest(".mtabs") || b.closest(".epick") || b.closest(".sheet") || b.closest(".panel")) continue;
      var rk = rank(b);
      if (rk < 0) continue;
      if (!row) {
        row = b.parentElement;
        if (row) {
          row.insertBefore(menuBtn, b);
          descEl = document.getElementById("rd");
          if (descEl) descEl.style.display = "none";
        }
      }
      place(b, rk);
    }
    if (descEl && descEl.style.display !== "none") descEl.style.display = "none";
    // Sohbet kapalıyken (başlık yok ya da yazı kutusu gizli) "Sen / Görüntülü ara / Menü" satırını gizle
    if (row) {
      var t = document.getElementById("rt");
      var sf = document.getElementById("sf");
      var closed = !t || !t.textContent.trim() || t.getClientRects().length === 0 || (sf && sf.getClientRects().length === 0);
      var want = closed ? "none" : "";
      if (row.style.display !== want) row.style.display = want;
    }
  }
  function later() {
    if (busy) return;
    busy = true;
    (window.requestAnimationFrame || setTimeout)(scan);
  }

  scan();
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["style", "hidden", "class"] });
})();
