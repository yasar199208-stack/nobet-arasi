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
    ".mpanel{position:fixed;left:12px;right:12px;z-index:41;max-width:340px;margin-left:auto;background:var(--panel);border:1px solid var(--lamp);border-radius:14px;padding:10px;box-shadow:0 10px 28px rgba(0,0,0,.5);max-height:80vh;overflow:auto}" +
    ".mpanel .minfo{padding:4px 6px 10px;border-bottom:1px solid var(--line);margin-bottom:8px}" +
    ".mpanel .minfo b{display:block;font-size:16px}" +
    ".mpanel .minfo span{display:block;color:var(--mute);font-size:13px;margin-top:2px}" +
    ".mpanel button{display:flex!important;align-items:center;gap:8px;width:100%;margin:0 0 6px!important;text-align:left;justify-content:flex-start;padding:11px 12px;font-size:16px}" +
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
    panel.style.top = Math.min(r.bottom + 8, window.innerHeight - 120) + "px";
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

  function findDesc(fromRow) {
    var el = fromRow.nextElementSibling;
    var n = 0;
    while (el && n < 3) {
      if (!el.querySelector("button,input,textarea") && el.tagName !== "BUTTON" &&
          (el.textContent || "").trim().length > 0 && el.textContent.length < 240) return el;
      el = el.nextElementSibling;
      n++;
    }
    return null;
  }

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
          descEl = findDesc(row);
          if (descEl) descEl.hidden = true;
        }
      }
      place(b, rk);
    }
    if (descEl && !descEl.hidden) descEl.hidden = true;
  }
  function later() {
    if (busy) return;
    busy = true;
    (window.requestAnimationFrame || setTimeout)(scan);
  }

  scan();
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
})();
