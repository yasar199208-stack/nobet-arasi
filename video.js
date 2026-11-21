// Mesajdaki video linklerini oynatılabilir karta çevirir:
// YouTube, Vimeo, Dailymotion, TikTok, Instagram, Facebook ve doğrudan .mp4/.webm linkleri.
const U = "[^\\s]*";
const PROV = [
  { n: "YouTube", re: new RegExp("(?:https?:\\/\\/)?(?:www\\.|m\\.|music\\.)?(?:youtube\\.com\\/(?:watch\\?(?:[^\\s]*&)?v=|shorts\\/|embed\\/|live\\/)|youtu\\.be\\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])" + U, "i"),
    src: (m) => "https://www.youtube-nocookie.com/embed/" + m[1] + "?autoplay=1&playsinline=1&rel=0",
    th: (m) => "https://i.ytimg.com/vi/" + m[1] + "/hqdefault.jpg", ar: "16/9", open: (m) => "https://www.youtube.com/watch?v=" + m[1] },
  { n: "Vimeo", re: new RegExp("(?:https?:\\/\\/)?(?:www\\.)?vimeo\\.com\\/(?:video\\/)?(\\d{6,12})(?!\\d)" + U, "i"),
    src: (m) => "https://player.vimeo.com/video/" + m[1] + "?autoplay=1", ar: "16/9", open: (m) => "https://vimeo.com/" + m[1] },
  { n: "Dailymotion", re: new RegExp("(?:https?:\\/\\/)?(?:www\\.)?(?:dailymotion\\.com\\/video\\/|dai\\.ly\\/)([A-Za-z0-9]{5,10})(?![A-Za-z0-9])" + U, "i"),
    src: (m) => "https://www.dailymotion.com/embed/video/" + m[1] + "?autoplay=1",
    th: (m) => "https://www.dailymotion.com/thumbnail/video/" + m[1], ar: "16/9", open: (m) => "https://www.dailymotion.com/video/" + m[1] },
  { n: "TikTok", re: new RegExp("(?:https?:\\/\\/)?(?:www\\.)?tiktok\\.com\\/@[A-Za-z0-9._-]+\\/video\\/(\\d{8,25})(?!\\d)" + U, "i"),
    src: (m) => "https://www.tiktok.com/embed/v2/" + m[1], ar: "9/16", tall: 1, open: (m) => "https://www.tiktok.com/video/" + m[1] },
  { n: "TikTok", re: new RegExp("(?:https?:\\/\\/)?(?:(?:vt|vm)\\.tiktok\\.com\\/|(?:www\\.)?tiktok\\.com\\/t\\/)[A-Za-z0-9_-]{6,15}\\/?(?![A-Za-z0-9_@.-])" + U, "i"),
    short: 1, ar: "9/16", tall: 1, open: (m) => norm(m[0]) },
  { n: "Instagram", re: new RegExp("(?:https?:\\/\\/)?(?:www\\.)?instagram\\.com\\/(p|reel|reels|tv)\\/([A-Za-z0-9_-]{5,20})" + U, "i"),
    src: (m) => "https://www.instagram.com/" + (m[1] === "reels" ? "reel" : m[1]) + "/" + m[2] + "/embed", ar: "9/14", tall: 1,
    open: (m) => "https://www.instagram.com/" + (m[1] === "reels" ? "reel" : m[1]) + "/" + m[2] + "/" },
  { n: "Facebook", re: new RegExp("(?:https?:\\/\\/)?(?:www\\.|m\\.|web\\.)?(?:facebook\\.com\\/(?:watch\\/?\\?v=\\d+|[A-Za-z0-9.]+\\/videos\\/\\d+|reel\\/\\d+|share\\/[vr]\\/[A-Za-z0-9]+)|fb\\.watch\\/[A-Za-z0-9_-]+)" + U, "i"),
    src: (m) => "https://www.facebook.com/plugins/video.php?show_text=false&autoplay=true&href=" + encodeURIComponent(norm(m[0])), ar: "16/9", open: (m) => norm(m[0]) },
  { n: "Video", re: new RegExp("https?:\\/\\/[^\\s\\/]+\\/[^\\s?#]*\\.(?:mp4|webm|mov|m4v)(?:\\?[^\\s#]*)?(?:#\\S*)?", "i"), file: 1, ar: "16/9", open: (m) => m[0] }
];
function norm(u) { return /^https?:\/\//i.test(u) ? u : "https://" + u; }

const st = document.createElement("style");
st.textContent =
  ".vcard{margin-top:6px;width:100%;max-width:300px}" +
  ".vcard .vb{position:relative;display:block;width:100%;padding:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#101820;cursor:pointer}" +
  ".vcard .vb img{width:100%;height:100%;object-fit:cover;display:block}" +
  ".vcard .vn{position:absolute;left:10px;top:8px;font:700 14px var(--head);color:#fff;background:rgba(0,0,0,.55);border-radius:6px;padding:2px 8px}" +
  ".vcard .vp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:54px;height:38px;border-radius:10px;background:rgba(224,40,40,.92);color:#fff;font-size:20px;display:grid;place-items:center}" +
  ".vcard iframe,.vcard video{width:100%;border:0;border-radius:10px;display:block;background:#000}" +
  ".vcard.tall{max-width:260px}" +
  ".vcard .vl{display:inline-block;margin-top:4px;font-size:13px;color:var(--mute)}" +
  ".msg p.vonly{display:none}";
document.head.appendChild(st);

function card(pv, m) {
  const w = document.createElement("div");
  w.className = "vcard" + (pv.tall ? " tall" : "");
  const play = async () => {
    let f;
    if (pv.short) {
      let id = "";
      try {
        const r = await fetch("https://www.tiktok.com/oembed?url=" + encodeURIComponent(norm(m[0])));
        const j = await r.json();
        id = String(j.embed_product_id || (/\/video\/(\d+)/.exec(j.html || "") || [])[1] || "");
      } catch (e) {}
      if (!/^\d{8,25}$/.test(id)) { window.open(norm(m[0]), "_blank", "noopener"); return; }
      f = document.createElement("iframe");
      f.src = "https://www.tiktok.com/embed/v2/" + id;
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.style.aspectRatio = pv.ar;
    } else if (pv.file) {
      f = document.createElement("video");
      f.src = m[0]; f.controls = true; f.autoplay = true; f.playsInline = true; f.preload = "metadata";
      f.style.aspectRatio = pv.ar;
    } else {
      f = document.createElement("iframe");
      f.src = pv.src(m);
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.referrerPolicy = "strict-origin-when-cross-origin";
      f.style.aspectRatio = pv.ar;
    }
    w.replaceChild(f, b);
  };
  const b = document.createElement("button");
  b.type = "button";
  b.className = "vb";
  b.style.aspectRatio = pv.ar;
  b.setAttribute("aria-label", "Videoyu oynat");
  if (pv.th) {
    const im = document.createElement("img");
    im.loading = "lazy"; im.alt = "Video"; im.src = pv.th(m);
    im.onerror = () => im.remove();
    b.appendChild(im);
  }
  const nm = document.createElement("span");
  nm.className = "vn"; nm.textContent = pv.n;
  const pl = document.createElement("span");
  pl.className = "vp"; pl.textContent = "▶";
  b.appendChild(nm); b.appendChild(pl);
  b.onclick = play;
  w.appendChild(b);
  const a = document.createElement("a");
  a.className = "vl";
  a.href = pv.open(m);
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = pv.n + "'da aç";
  w.appendChild(a);
  return w;
}

function scan() {
  document.querySelectorAll(".msg p:not([data-v])").forEach((p) => {
    p.setAttribute("data-v", "1");
    const t = p.textContent || "";
    for (const pv of PROV) {
      const m = pv.re.exec(t);
      if (!m) continue;
      const log = p.closest(".log");
      const near = log ? log.scrollHeight - log.scrollTop - log.clientHeight < 160 : false;
      if (t.trim() === m[0].trim()) p.classList.add("vonly");
      p.after(card(pv, m));
      if (near && log) { log.scrollTop = log.scrollHeight; setTimeout(() => { log.scrollTop = log.scrollHeight; }, 400); }
      return;
    }
  });
}

let tm = 0;
new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(scan, 60); })
  .observe(document.body, { childList: true, subtree: true });
scan();
