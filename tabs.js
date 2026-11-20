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

  function hasUnread(el) {
    var b = el.querySelector("b");
    var clean = /^💌 @[\p{L}0-9_]+$/u.test(b.textContent.trim());
    return !clean || el.className.trim() !== "room" || el.children.length > 2;
  }

  function apply() {
    var list = rooms.querySelectorAll(".room");
    var count = 0;
    var unread = false;
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      var dm = isDmChip(el);
      if (dm) {
        count++;
        if (hasUnread(el)) unread = true;
      }
      el.style.display = ((tab === "dm") === dm) ? "" : "none";
    }
    bRooms.textContent = "🏠 Odalar";
    bDm.textContent = "💬 Mesajlar" + (count ? " (" + count + ")" : "") + (unread ? " ●" : "");
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
