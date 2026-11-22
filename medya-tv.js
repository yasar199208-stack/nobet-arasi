// Canlı TV (resmi YouTube canlı yayınları) ve müzik linki çalar
const CH = [
  { n: "TRT Haber", id: "UCBgTP2LOFVPmq15W-RH-WXA" },
  { n: "Habertürk TV", id: "UCn6dNfiRE_Xunu7iMyvD7AA" }
];
function frame(src) {
  const f = document.createElement("iframe");
  f.src = src;
  f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  f.allowFullscreen = true;
  f.referrerPolicy = "strict-origin-when-cross-origin";
  f.style.cssText = "width:100%;aspect-ratio:16/9;border:0;border-radius:10px;background:#000;display:block";
  return f;
}
function link(href, txt, el) {
  const a = el("a", "", txt);
  a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
  a.style.cssText = "display:inline-block;margin:8px 0 0;font-size:14px";
  return a;
}
export function tvView(box, el) {
  box.textContent = "";
  const row = el("div", ""), pl = el("div", "");
  row.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px";
  CH.forEach((c) => {
    const b = el("button", "", "📺 " + c.n);
    b.type = "button"; b.style.cssText = "padding:10px 12px;font-size:15px";
    b.onclick = () => {
      pl.textContent = "";
      pl.appendChild(frame("https://www.youtube.com/embed/live_stream?channel=" + c.id + "&autoplay=1&playsinline=1"));
      pl.appendChild(link("https://www.youtube.com/channel/" + c.id + "/live", "Açılmazsa YouTube'da aç", el));
    };
    row.appendChild(b);
  });
  const note = el("p", "", "Resmi YouTube canlı yayınları. Bir kanal gömülü açılmazsa alttaki bağlantıyla YouTube'da açabilirsin.");
  note.style.cssText = "color:var(--mute);font-size:13px;margin:0 0 10px";
  box.appendChild(row); box.appendChild(note); box.appendChild(pl);
}
function ytId(t) {
  const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|music\.youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/.exec(t);
  const l = /[?&]list=([A-Za-z0-9_-]{10,})/.exec(t);
  return { v: m && m[1], l: l && l[1] };
}
export function musicView(box, el, toast) {
  box.textContent = "";
  const p = el("p", "", "Bir YouTube ya da YouTube Music linki yapıştır, burada çalsın. Uygulamadan çıkınca ya da ekran kapanınca durur.");
  p.style.cssText = "color:var(--mute);font-size:14px;margin:0 0 10px";
  const i = el("input", "");
  i.placeholder = "https://youtube.com/…";
  i.style.cssText = "width:100%;box-sizing:border-box;padding:10px;margin-bottom:8px;font-size:16px";
  const go = el("button", "", "▶ Çal");
  go.type = "button"; go.style.cssText = "width:100%;padding:11px;font-weight:800;margin-bottom:10px";
  const pl = el("div", "");
  go.onclick = () => {
    const r = ytId(i.value);
    if (!r.v && !r.l) { toast("Geçerli bir YouTube linki yapıştır."); return; }
    pl.textContent = "";
    const src = r.v ? "https://www.youtube-nocookie.com/embed/" + r.v + "?autoplay=1&playsinline=1" + (r.l ? "&list=" + r.l : "") : "https://www.youtube-nocookie.com/embed/videoseries?list=" + r.l + "&autoplay=1&playsinline=1";
    pl.appendChild(frame(src));
  };
  box.appendChild(p); box.appendChild(i); box.appendChild(go); box.appendChild(pl);
}
