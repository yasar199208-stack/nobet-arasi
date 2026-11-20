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
    "#mempty{padding:14px 16px;color:var(--mute);font-size:14px}";
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
    bRooms.textContent = "🏠 Odalar";
    bDm.textContent = "💬 Mesajlar" + (count ? " (" + count + ")" : "");
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
    empty.hidden = !(tab === "dm" && count === 0);
  }

  bRooms.onclick = function () { tab = "rooms"; apply(); };
  bDm.onclick = function () { tab = "dm"; apply(); };

  new MutationObserver(apply).observe(rooms, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class"] });

  new MutationObserver(function () {
    tab = title.textContent.indexOf("💌") === 0 ? "dm" : "rooms";
    apply();
  }).observe(title, { childList: true, characterData: true, subtree: true });

  apply();
})();
