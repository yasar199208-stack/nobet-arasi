import { setAvatarData } from "./avatar.js?v=2";

const $ = (i) => document.getElementById(i);

const GROUPS = [
  ["😀", "😀 😃 😄 😁 😆 😅 😂 🤣 🙂 😉 😊 😇 🥰 😍 😘 😋 😎 🤩 🥳 😏 😴 🤔 🫡 😬 🙄 😢 😭 😤 😡 🤯 😱 🤗"],
  ["👍", "👍 👎 👏 🙌 🙏 💪 🤝 ✌️ 🤞 👌 👋 🫶 ❤️ 🧡 💛 💚 💙 💜 🖤 💯 ✅ ❌ ⚠️ ❓ ❗ 🔥 ⭐ ✨ 🎉 🎊 🏆"],
  ["🛡️", "🛡️ 👮 🚓 🚨 🔦 🔑 🔒 📞 📱 🎧 📻 🕶️ 🧤 🥾 🏢 🚪 🅿️ 🚧 🧯 📹 🪪 ⏰ 🌙 ☀️"],
  ["🐺", "🐺 🦅 🦁 🐻 🐯 🦊 🐼 🦉 🐶 🐱 🐴 🦄 🐢 🐍 🦈 🐬 🦋 🐝 🌲 🌊 🏔️ 🌧️ ⛈️ ❄️"],
  ["☕", "☕ 🍵 🥤 🍔 🍕 🌭 🥪 🍳 🥙 🍞 🧀 🍎 🍌 🍇 🍪 🍫 🍰 🍉 🍊 🥛 🍿 🥜 🍬 🍦"],
  ["⚽", "⚽ 🏀 🏈 🎮 🎲 🎵 🎸 🚗 ✈️ 🚌 🏠 📍 🗺️ 🕐 💼 💰 📚 💡 🔧 🧰 📅 ✉️ 🎁 🎂"]
];

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
    && /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\u200d|\ufe0f|\s)+$/u.test(t)
    && /\p{Extended_Pictographic}/u.test(t);
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

function buildPicker() {
  const p = document.createElement("div");
  p.className = "epick"; p.hidden = true;
  const tabs = document.createElement("div"); tabs.className = "etabs";
  const grid = document.createElement("div"); grid.className = "egrid";
  p.appendChild(tabs); p.appendChild(grid);
  function show(idx) {
    grid.innerHTML = "";
    GROUPS[idx][1].split(" ").forEach((e) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = e; b.onclick = () => insert(e);
      grid.appendChild(b);
    });
    Array.from(tabs.children).forEach((t, i) => t.classList.toggle("on", i === idx));
  }
  GROUPS.forEach((g, i) => {
    const t = document.createElement("button");
    t.type = "button"; t.textContent = g[0]; t.onclick = () => show(i);
    tabs.appendChild(t);
  });
  document.body.appendChild(p);
  show(0);
  return p;
}

export function initFun(ctx) {
  toast = ctx.toast;
  const st = document.createElement("style");
  st.textContent = ".epick{position:fixed;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom,0px));background:var(--panel);border:1px solid var(--lamp);border-radius:14px;padding:8px;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.45)}.etabs{display:flex;gap:4px;margin-bottom:6px;overflow-x:auto}.etabs button,.egrid button{background:none;border:0;cursor:pointer;border-radius:8px;color:inherit}.etabs button{font-size:22px;padding:4px 10px}.etabs button.on{background:rgba(240,194,75,.25)}.egrid{display:grid;grid-template-columns:repeat(8,1fr);gap:2px;max-height:32vh;overflow:auto}.egrid button{font-size:26px;padding:4px 0}.egrid button:active{background:rgba(127,150,180,.25)}.ebtn{background:none;border:1px solid var(--line);border-radius:10px;padding:0 12px;cursor:pointer;font-size:20px}.agrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.sheet .ao{aspect-ratio:1;border-radius:50%;border:2px solid var(--line);font-size:34px;padding:0;cursor:pointer;display:grid;place-items:center}.sheet .ao:active{transform:scale(.93)}.msg p.big{font-size:40px;line-height:1.1}.row.mine .av{box-shadow:0 0 0 2px var(--lamp)}";
  document.head.appendChild(st);

  const labels = { out: "🚪 Çıkış yap", unb: "🚫 Engelleri kaldır", cb: "📞 Görüntülü ara" };
  Object.keys(labels).forEach((k) => { if ($(k)) $(k).textContent = labels[k]; });
  $("q").placeholder = "🔎 İl veya oda ara…";

  picker = buildPicker();
  const eb = document.createElement("button");
  eb.type = "button"; eb.className = "ebtn"; eb.textContent = "😊"; eb.title = "Emoji";
  const inp = $("in");
  inp.parentNode.insertBefore(eb, inp.nextSibling);
  eb.onclick = () => { picker.hidden = !picker.hidden; };
  document.addEventListener("click", (e) => {
    if (!picker.hidden && !picker.contains(e.target) && e.target !== eb) picker.hidden = true;
  });
}
