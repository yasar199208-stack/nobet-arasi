// Telefonda sohbet alanını büyütür: bir oda ya da özel sohbet açılınca üstteki menü, arama kutusu ve oda listesi gizlenir.
// Üstteki "Odalar" düğmesi menüyü geri getirir. Geniş ekranda (bilgisayar) hiçbir şey değişmez.
(function () {
  var $ = function (i) { return document.getElementById(i); };
  var hold = 0, n = 0;
  var st = document.createElement("style");
  st.textContent =
    "#tmb{display:none;flex:none;background:none;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:5px 10px;cursor:pointer;font-size:14px}" +
    "@media (max-width:760px){" +
    "#tmb{display:inline-block}" +
    "body.tam:not(.mclosed) aside{display:none!important}" +
    "body.tam:not(.mclosed) .app{grid-template-rows:minmax(0,1fr)!important}" +
    "}";
  document.head.appendChild(st);
  function label(b) { b.textContent = document.body.classList.contains("tam") ? "\u{1F3E0} Odalar" : "\u2B06 Sohbeti b\u00FCy\u00FCt"; }
  function setTam(v, b) { document.body.classList.toggle("tam", !!v); if (b) label(b); }
  function init() {
    var top = document.querySelector(".top"), rt = $("rt");
    if (!top || !rt) return false;
    var b = document.createElement("button");
    b.id = "tmb"; b.type = "button";
    b.onclick = function () { setTam(!document.body.classList.contains("tam"), b); };
    top.insertBefore(b, top.firstChild);
    new MutationObserver(function () {
      if (Date.now() < hold || !rt.textContent.trim()) return;
      setTam(true, b);
    }).observe(rt, { childList: true, characterData: true, subtree: true });
    document.addEventListener("click", function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest(".top button") : null;
      if (!t || t === b) return;
      if (t.textContent.replace(/\s+/g, " ").trim() === "\u2190 Odalar") {
        hold = Date.now() + 700;
        setTimeout(function () { setTam(false, b); }, 0);
        setTimeout(function () { setTam(false, b); }, 350);
      }
    }, true);
    if (rt.textContent.trim()) setTam(true, b); else label(b);
    return true;
  }
  var iv = setInterval(function () { if (init() || ++n > 60) clearInterval(iv); }, 300);
})();
