// YouTube linklerini mesajda oynatılabilir video kartına çevirir.
const RE = /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?(?:[^\s]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])[^\s]*/i;

const st = document.createElement("style");
st.textContent =
  ".vcard{margin-top:6px;width:100%;max-width:300px}" +
  ".vcard .vb{position:relative;display:block;width:100%;padding:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#000;cursor:pointer;aspect-ratio:16/9}" +
  ".vcard .vb img{width:100%;height:100%;object-fit:cover;display:block}" +
  ".vcard .vp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:54px;height:38px;border-radius:10px;background:rgba(224,40,40,.92);color:#fff;font-size:20px;display:grid;place-items:center}" +
  ".vcard iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:10px;display:block;background:#000}" +
  ".vcard .vl{display:inline-block;margin-top:4px;font-size:13px;color:var(--mute)}" +
  ".msg p.vonly{display:none}";
document.head.appendChild(st);

function card(id, url) {
  const w = document.createElement("div");
  w.className = "vcard";
  const b = document.createElement("button");
  b.type = "button";
  b.className = "vb";
  b.setAttribute("aria-label", "Videoyu oynat");
  const im = document.createElement("img");
  im.loading = "lazy";
  im.alt = "Video";
  im.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
  const pl = document.createElement("span");
  pl.className = "vp";
  pl.textContent = "▶";
  b.appendChild(im);
  b.appendChild(pl);
  b.onclick = () => {
    const f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&playsinline=1&rel=0";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    f.referrerPolicy = "strict-origin-when-cross-origin";
    w.replaceChild(f, b);
  };
  w.appendChild(b);
  const a = document.createElement("a");
  a.className = "vl";
  a.href = "https://www.youtube.com/watch?v=" + id;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = "YouTube'da aç";
  w.appendChild(a);
  return w;
}

function scan() {
  document.querySelectorAll(".msg p:not([data-v])").forEach((p) => {
    p.setAttribute("data-v", "1");
    const t = p.textContent || "";
    const m = RE.exec(t);
    if (!m) return;
    const log = p.closest(".log");
    const near = log ? log.scrollHeight - log.scrollTop - log.clientHeight < 120 : false;
    if (t.trim() === m[0].trim()) p.classList.add("vonly");
    p.after(card(m[1]));
    if (near && log) log.scrollTop = log.scrollHeight;
  });
}

let tm = 0;
new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(scan, 60); })
  .observe(document.body, { childList: true, subtree: true });
scan();
