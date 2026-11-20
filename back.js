(function () {
  var $ = function (i) { return document.getElementById(i); };
  var top = document.querySelector(".top");
  var title = $("rt");
  var main = document.querySelector("main");
  if (!top || !title || !main) return;

  var st = document.createElement("style");
  st.textContent =
    ".top h2{margin-right:auto}" +
    "#nb,#cx,#cb{flex:none;background:none;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:5px 10px;cursor:pointer;font-size:14px}" +
    "body:not(.chat-closed) #cc{display:none}" +
    "body.chat-closed #cc{display:flex;flex:1;align-items:center;justify-content:center;text-align:center;padding:24px;color:var(--mute);font-size:16px}" +
    "body.chat-closed .log,body.chat-closed form.send,body.chat-closed .desc,body.chat-closed #rt{display:none}";
  document.head.appendChild(st);

  var nb = document.createElement("button");
  nb.id = "nb";
  nb.type = "button";
  nb.textContent = "← Odalar";
  nb.hidden = true;
  top.insertBefore(nb, top.firstChild);

  var cb = document.createElement("button");
  cb.id = "cx";
  cb.type = "button";
  cb.textContent = "✕ Kapat";
  cb.hidden = true;
  top.insertBefore(cb, nb.nextSibling);

  var cc = document.createElement("div");
  cc.id = "cc";
  cc.textContent = "Özel mesaj kapalı. Yukarıdan bir oda ya da özel mesaj seç.";
  main.insertBefore(cc, $("log"));

  var closed = false;
  var pushed = false;
  var ignore = false;
  var lastPublic = "";

  function isDm() {
    return title.textContent.indexOf("💌") === 0;
  }

  function apply() {
    var show = !closed && isDm();
    document.body.classList.toggle("chat-closed", closed);
    nb.hidden = !show;
    cb.hidden = !show;
    if (closed) {
      var list = $("rooms").querySelectorAll(".room");
      for (var i = 0; i < list.length; i++) list[i].setAttribute("aria-current", "false");
    }
  }

  function findPublic() {
    var list = $("rooms").querySelectorAll(".room");
    for (var i = 0; i < list.length; i++) {
      var b = list[i].querySelector("b");
      var t = b ? b.textContent : "";
      if (t.indexOf("💌") === 0) continue;
      if (!lastPublic || t === lastPublic) return list[i];
    }
    return null;
  }

  function goPublic() {
    var q = $("q");
    var target = findPublic();
    if (!target && q.value) {
      q.value = "";
      q.dispatchEvent(new Event("input"));
      target = findPublic();
    }
    if (!target) {
      lastPublic = "";
      target = findPublic();
    }
    if (target) target.click();
  }

  function closeChat() {
    if (closed || !isDm()) return;
    closed = true;
    if (pushed) {
      pushed = false;
      ignore = true;
      history.back();
    }
    apply();
  }

  function onOpen() {
    closed = false;
    var dm = isDm();
    if (!dm) lastPublic = title.textContent;
    if (dm && !pushed) {
      history.pushState({ nb: 1 }, "");
      pushed = true;
    } else if (!dm && pushed) {
      pushed = false;
      ignore = true;
      history.back();
    }
    apply();
  }

  nb.onclick = goPublic;
  cb.onclick = closeChat;

  window.addEventListener("popstate", function () {
    if (ignore) { ignore = false; return; }
    if (pushed) {
      pushed = false;
      if (isDm() && !closed) goPublic();
    }
  });

  new MutationObserver(onOpen).observe(title, { childList: true, characterData: true, subtree: true });
  onOpen();
})();
