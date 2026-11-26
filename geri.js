// Geri tuşu: açık olan paneli/sayfayı kapatır (Tema, Profil kartı, Avatar seçici, Menü paneli, Mesajlar sekmesi).
// Sırayla: 1) açık panel kapanır 2) Mesajlar sekmesi, Odalar sekmesine döner. Gerisini (özel sohbet, oda geçmişi, çıkış uyarısı) mevcut kodlar yapar.
(function () {
  var pushed = false, ignore = false, busy = false;
  var vis = function (el) { return !!el && !el.hidden && el.getClientRects().length > 0; };
  function layers() {
    var out = [], q = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
    q(".mback").forEach(function (e) { if (vis(e)) out.push({ el: e, close: function () { e.click(); } }); });
    q(".thp").forEach(function (e) { if (vis(e)) out.push({ el: e, close: function () { var b = e.querySelector("button"); if (b) b.click(); else e.remove(); } }); });
    q("body > .panel").forEach(function (e) { if (vis(e)) out.push({ el: e, close: function () { e.click(); if (vis(e)) { var b = e.querySelector("button"); if (b) b.click(); } } }); });
    return out;
  }
  function dmTabOn() {
    var b = document.querySelector(".mtabs button[aria-pressed='true']");
    var first = document.querySelector(".mtabs button");
    return b && first && b !== first && b.textContent.indexOf("Mesajlar") >= 0 ? first : null;
  }
  function dmChatOpen() {
    var t = document.getElementById("rt");
    return !!t && t.textContent.indexOf("\u{1F48C}") === 0 && !document.body.classList.contains("chat-closed");
  }
  function want() { return layers().length > 0 || (!!dmTabOn() && !dmChatOpen()); }
  function sync() {
    busy = false;
    var w = want();
    if (w && !pushed) { try { history.pushState({ gb: 1 }, ""); pushed = true; } catch (e) {} }
    else if (!w && pushed) {
      pushed = false;
      if (history.state && history.state.gb) { ignore = true; try { history.back(); } catch (e) { ignore = false; } }
    }
  }
  function sched() { if (busy) return; busy = true; (window.requestAnimationFrame || setTimeout)(sync); }
  new MutationObserver(sched).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class", "style", "aria-pressed"] });
  window.addEventListener("popstate", function (ev) {
    if (ignore) { ignore = false; ev.stopImmediatePropagation(); return; }
    if (!pushed) return;
    pushed = false;
    var l = layers();
    if (l.length) { ev.stopImmediatePropagation(); l[l.length - 1].close(); }
    else { var tab = dmTabOn(); if (tab && !dmChatOpen()) { ev.stopImmediatePropagation(); tab.click(); } }
    setTimeout(sync, 60);
  }, true);
  sync();
})();
