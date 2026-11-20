import { setAvatarData } from "./avatar.js?v=2";
import { GROUPS, SEARCH, fold } from "./emodata.js?v=1";

const $ = (i) => document.getElementById(i);

const AVATARS = [
  ["🛡️", "#c99a12"], ["👮", "#2f6fb0"], ["🚓", "#c0392b"], ["🔦", "#d9822b"],
  ["🦅", "#8a6a4f"], ["🐺", "#5d6d7e"], ["🦁", "#c9a227"], ["🐻", "#7b4b2a"],
  ["🐯", "#e08e0b"], ["🦊", "#d35400"], ["🐼", "#566573"], ["🦉", "#6c5b7b"],
  ["🌙", "#2c3e75"], ["⭐", "#b9770e"], ["🔥", "#c0392b"], ["⚡", "#8e44ad"],
  ["🌲", "#1e8449"], ["🏔️", "#2874a6"], ["🎯", "#a93226"], ["💪", "#17806d"],
  ["😎", "#2e86c1"], ["🤠", "#a04000"], ["🥷", "#212f3d"], ["👑", "#b7950b"]
];

let toast = null, picker = null;

// Sadece emojiden oluşan kısa mesajlar büyük gösterilir
export function isBigEmoji(t) {
  return !!t && t.length <= 24
    && /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|\u200d|\ufe0f|\s)+$/u.test(t)
    && /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(t);
}

function insert(e) {
  const i = $("in");
  if (i.value.length + e.length > 400) return;
  const s = i.selectionStart == null ? i.value.length : i.selectionStart;
  const t = i.selectionEnd == null ? s : i.selectionEnd;
  i.value = i.value.slice(0, s) + e + i.value.slice(t);
  const p = s + e.length;
  i.setSelectionRange(p, p);
}

function makeAvatar(e, c) {
  const S = 128, cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const g = cv.getContext("2d");
  g.fillStyle = c; g.fillRect(0, 0, S, S);
  const gr = g.createRadialGradient(40, 34, 4, 64, 64, 100);
  gr.addColorStop(0, "rgba(255,255,255,.38)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.font = "72px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(e, S / 2, S / 2 + 4);
  return cv.toDataURL("image/jpeg", 0.85);
}

export function openAvatarPicker(uid) {
  let p = $("ap");
  if (!p) {
    p = document.createElement("div");
    p.className = "panel"; p.id = "ap"; p.hidden = true;
    const sheet = document.createElement("div"); sheet.className = "sheet";
    const head = document.createElement("div"); head.className = "sh";
    const h = document.createElement("h2"); h.textContent = "Hazır avatar seç";
    const x = document.createElement("button"); x.type = "button"; x.textContent = "Kapat";
    x.onclick = () => { p.hidden = true; };
    head.appendChild(h); head.appendChild(x);
    const grid = document.createElement("div"); grid.className = "agrid";
    AVATARS.forEach((a) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "ao"; b.textContent = a[0];
      b.style.background = "radial-gradient(circle at 30% 25%, rgba(255,255,255,.4), rgba(255,255,255,0) 70%), " + a[1];
      b.onclick = () => { p.hidden = true; setAvatarData(p.dataset.uid, makeAvatar(a[0], a[1])); };
      grid.appendChild(b);
    });
    sheet.appendChild(head); sheet.appendChild(grid);
    p.appendChild(sheet);
    p.onclick = (e) => { if (e.target === p) p.hidden = true; };
    document.body.appendChild(p);
  }
  p.dataset.uid = uid;
  p.hidden = false;
}

/* ---------- Son kullanılan emojiler ---------- */
const RKEY = "na_recent_emoji";
function getRecent() {
  try {
    const v = JSON.parse(localStorage.getItem(RKEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
function addRecent(e) {
  try {
    const v = getRecent().filter((x) => x !== e);
    v.unshift(e);
    localStorage.setItem(RKEY, JSON.stringify(v.slice(0, 32)));
  } catch (e2) { /* sorun değil */ }
}

function buildPicker() {
  const p = document.createElement("div");
  p.className = "epick"; p.hidden = true;
  const sr = document.createElement("input");
  sr.type = "search"; sr.className = "esearch"; sr.autocomplete = "off";
  sr.placeholder = "Ara: çay, gece, nöbet, kalp…";
  sr.setAttribute("aria-label", "Emoji ara");
  const tabs = document.createElement("div"); tabs.className = "etabs";
  const grid = document.createElement("div"); grid.className = "egrid";
  p.appendChild(sr); p.appendChild(tabs); p.appendChild(grid);

  let cur = 0;
  function fillGrid(list, emptyText) {
    if (!list.length) {
      grid.innerHTML = "";
      const d = document.createElement("div");
      d.className = "eempty"; d.textContent = emptyText;
      grid.appendChild(d);
      return;
    }
    grid.innerHTML = list.map((e) => '<button type="button">' + e + "</button>").join("");
  }
  function show(idx) {
    cur = idx;
    sr.value = "";
    const tbs = Array.from(tabs.children);
    tbs.forEach((t, i) => t.classList.toggle("on", i === idx));
    if (idx === 0) {
      fillGrid(getRecent(), "Henüz kullandığın emoji yok. Bir emoji seçince burada görünür.");
    } else {
      fillGrid(GROUPS[idx - 1][2].split(" "), "");
    }
    grid.scrollTop = 0;
  }
  function search(q) {
    const w = fold(q.trim());
    if (!w) { show(cur); return; }
    Array.from(tabs.children).forEach((t) => t.classList.remove("on"));
    const found = [];
    SEARCH.forEach((s) => {
      if (fold(s[0]).split(" ").some((k) => k.indexOf(w) === 0)) {
        s[1].split(" ").forEach((e) => { if (found.indexOf(e) < 0) found.push(e); });
      }
    });
    fillGrid(found, "Sonuç yok. Başka bir kelime dene.");
  }

  const rt = document.createElement("button");
  rt.type = "button"; rt.textContent = "🕘"; rt.title = "Son kullanılanlar";
  rt.onclick = () => show(0);
  tabs.appendChild(rt);
  GROUPS.forEach((g, i) => {
    const t = document.createElement("button");
    t.type = "button"; t.textContent = g[0]; t.title = g[1];
    t.onclick = () => show(i + 1);
    tabs.appendChild(t);
  });
  grid.onclick = (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    const e = b.textContent;
    insert(e);
    addRecent(e);
  };
  sr.oninput = () => search(sr.value);

  document.body.appendChild(p);
  p.show = () => { const r = getRecent(); show(r.length ? 0 : 1); };
  p.show();
  return p;
}

/* ---------- Hareketli büyük emoji ---------- */
const ANIMS = [
  ["beat", "❤💕💖💗💓💘💝💞🧡💛💚💙💜🖤🤍🤎😍🥰😘😻"],
  ["flame", "🔥"],
  ["shake", "😂🤣😆😹😅"],
  ["wave", "👋🙋🤚🖐✋"],
  ["clap", "👏🙌👍💪👌🙏"],
  ["pop", "🎉🎊🥳🎈🎂🎁🏆🥇"],
  ["float", "😴💤🌙☁"],
  ["shiver", "😱😨😰🥶😬"],
  ["blink", "🚨🔔📣"],
  ["spin", "⭐🌟✨💫🌀"]
];
const ANIM_MAP = {};
ANIMS.forEach((a) => Array.from(a[1]).forEach((c) => { ANIM_MAP[c] = a[0]; }));

function animKind(t) {
  const first = Array.from(t.replace(/[\ufe0f\s]/g, ""))[0] || "";
  return ANIM_MAP[first] || "bounce";
}

function setupAnim() {
  const st = document.createElement("style");
  st.textContent =
    ".msg p.big{display:inline-block;transform-origin:50% 65%;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
    ".msg p.big.go.a-beat{animation:ea-beat .7s ease-in-out 4}" +
    ".msg p.big.go.a-flame{animation:ea-flame .35s ease-in-out 8}" +
    ".msg p.big.go.a-shake{animation:ea-shake .5s ease-in-out 3}" +
    ".msg p.big.go.a-wave{animation:ea-wave .6s ease-in-out 4}" +
    ".msg p.big.go.a-clap{animation:ea-clap .35s ease-in-out 6}" +
    ".msg p.big.go.a-pop{animation:ea-pop .9s cubic-bezier(.3,1.6,.5,1) 2}" +
    ".msg p.big.go.a-float{animation:ea-float 1.6s ease-in-out 3}" +
    ".msg p.big.go.a-shiver{animation:ea-shiver .12s linear 14}" +
    ".msg p.big.go.a-blink{animation:ea-blink .5s steps(2,end) 6}" +
    ".msg p.big.go.a-spin{animation:ea-spin 1.2s ease-in-out 2}" +
    ".msg p.big.go.a-bounce{animation:ea-bounce .8s cubic-bezier(.3,1.6,.5,1) 1}" +
    "@keyframes ea-beat{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}" +
    "@keyframes ea-flame{0%,100%{transform:scale(1) rotate(-3deg)}50%{transform:scale(1.18,1.3) rotate(3deg)}}" +
    "@keyframes ea-shake{0%,100%{transform:rotate(0)}25%{transform:rotate(-14deg) translateY(-3px)}75%{transform:rotate(14deg) translateY(-3px)}}" +
    "@keyframes ea-wave{0%,100%{transform:rotate(0)}30%{transform:rotate(22deg)}70%{transform:rotate(-18deg)}}" +
    "@keyframes ea-clap{0%,100%{transform:scale(1)}50%{transform:scale(1.3) rotate(-6deg)}}" +
    "@keyframes ea-pop{0%{transform:scale(.3) rotate(-15deg)}60%{transform:scale(1.35) rotate(8deg)}100%{transform:scale(1) rotate(0)}}" +
    "@keyframes ea-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}" +
    "@keyframes ea-shiver{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}" +
    "@keyframes ea-blink{0%{opacity:1}100%{opacity:.15}}" +
    "@keyframes ea-spin{0%{transform:rotate(0) scale(1)}50%{transform:rotate(180deg) scale(1.3)}100%{transform:rotate(360deg) scale(1)}}" +
    "@keyframes ea-bounce{0%{transform:scale(.4) translateY(8px)}60%{transform:scale(1.25)}100%{transform:scale(1)}}" +
    "@media (prefers-reduced-motion:reduce){.msg p.big.go{animation:none!important}}";
  document.head.appendChild(st);

  let io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (en.isIntersecting && !en.target.dataset.played) {
          en.target.dataset.played = "1";
          en.target.classList.add("go");
        }
      });
    }, { threshold: 0.6 });
  }

  function prep(p) {
    if (p.dataset.an) return;
    const t = (p.textContent || "").trim();
    if (!isBigEmoji(t)) return;
    p.dataset.an = "1";
    p.classList.add("big", "a-" + animKind(t));
    if (io) io.observe(p); else { p.classList.add("go"); p.dataset.played = "1"; }
  }
  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches(".msg p")) prep(root);
    if (root.querySelectorAll) root.querySelectorAll(".msg p").forEach(prep);
  }
  scan(document.body);
  new MutationObserver((ms) => {
    ms.forEach((m) => m.addedNodes.forEach(scan));
  }).observe(document.body, { childList: true, subtree: true });

  // Dokununca tekrar oynat
  document.addEventListener("click", (e) => {
    const p = e.target.closest && e.target.closest(".msg p.big");
    if (!p) return;
    p.classList.remove("go");
    void p.offsetWidth;
    p.classList.add("go");
  });
}

export function initFun(ctx) {
  toast = ctx.toast;
  const st = document.createElement("style");
  st.textContent = ".epick{position:fixed;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom,0px));background:var(--panel);border:1px solid var(--lamp);border-radius:14px;padding:8px;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.45)}.esearch{width:100%;margin-bottom:6px;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:7px 10px;font-size:15px}.etabs{display:flex;gap:1px;margin-bottom:6px}.etabs button,.egrid button{background:none;border:0;cursor:pointer;border-radius:8px;color:inherit}.etabs button{font-size:19px;padding:5px 0;flex:1 1 0;min-width:0}.etabs button.on{background:rgba(240,194,75,.25)}.egrid{display:grid;grid-template-columns:repeat(8,1fr);gap:2px;max-height:42vh;overflow:auto}.egrid button{font-size:26px;padding:4px 0}.egrid button:active{background:rgba(127,150,180,.25)}.eempty{grid-column:1/-1;color:var(--mute);font-size:14px;padding:10px 6px}.ebtn{background:none;border:1px solid var(--line);border-radius:10px;padding:0 12px;cursor:pointer;font-size:20px}.agrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.sheet .ao{aspect-ratio:1;border-radius:50%;border:2px solid var(--line);font-size:34px;padding:0;cursor:pointer;display:grid;place-items:center}.sheet .ao:active{transform:scale(.93)}.msg p.big{font-size:40px;line-height:1.1}.row.mine .av{box-shadow:0 0 0 2px var(--lamp)}";
  document.head.appendChild(st);

  const labels = { out: "🚪 Çıkış yap", unb: "🚫 Engelleri kaldır", cb: "📞 Görüntülü ara" };
  Object.keys(labels).forEach((k) => { if ($(k)) $(k).textContent = labels[k]; });
  $("q").placeholder = "🔎 İl veya oda ara…";

  setupAnim();

  picker = buildPicker();
  const eb = document.createElement("button");
  eb.type = "button"; eb.className = "ebtn"; eb.textContent = "😊"; eb.title = "Emoji";
  const inp = $("in");
  inp.parentNode.insertBefore(eb, inp.nextSibling);
  eb.onclick = () => {
    picker.hidden = !picker.hidden;
    if (!picker.hidden) picker.show();
  };
  document.addEventListener("click", (e) => {
    if (!picker.hidden && !picker.contains(e.target) && e.target !== eb) picker.hidden = true;
  });
}
