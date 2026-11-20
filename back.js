(function () {
  var $ = function (i) { return document.getElementById(i); };
  var top = document.querySelector(".top");
  var title = $("rt");
  if (!top || !title) return;

  var st = document.createElement("style");
  st.textContent = ".top h2{margin-right:auto}#nb{flex:none;background:none;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:5px 10px;cursor:pointer;font-size:14px}";
  document.head.appendChild(st);

  var nb = document.createElement("button");
  nb.id = "nb";
  nb.type = "button";
  nb.textContent = "← Odalar";
  nb.hidden = true;
  top.insertBefore(nb, top.firstChild);

  var lastPublic = "";
  var pushed = false;
  var ignore = false;

  function isDm() {
    return title.textContent.indexOf("💌") === 0;
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

  function update() {
    var dm = isDm();
    nb.hidden = !dm;
    if (!dm) lastPublic = title.textContent;
    if (dm && !pushed) {
      history.pushState({ nb: 1 }, "");
      pushed = true;
    } else if (!dm && pushed) {
      pushed = false;
      ignore = true;
      history.back();
    }
  }

  nb.onclick = goPublic;

  window.addEventListener("popstate", function () {
    if (ignore) { ignore = false; return; }
    if (pushed) {
      pushed = false;
      if (isDm()) goPublic();
    }
  });

  new MutationObserver(update).observe(title, { childList: true, characterData: true, subtree: true });
  update();
})();
