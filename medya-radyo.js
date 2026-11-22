// Radyo: Türkiye radyoları (radio-browser.info listesi, yalnızca https yayınlar)
const HOSTS = ["https://de1.api.radio-browser.info", "https://nl1.api.radio-browser.info", "https://at1.api.radio-browser.info"];
const KEY = "nb_radio_v1";
let audio = null, cur = null, onState = () => {};
export function setOnState(f) { onState = f; }
export function playing() { return cur; }
async function load() {
  try { const c = JSON.parse(localStorage.getItem(KEY) || "null"); if (c && Date.now() - c.t < 864e5 && c.l.length) return c.l; } catch (e) {}
  const q = "/json/stations/search?countrycode=TR&hidebroken=true&order=clickcount&reverse=true&limit=250";
  for (const h of HOSTS) {
    try {
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(h + q, { signal: ctl.signal });
      clearTimeout(tm);
      const a = await r.json(), seen = {}, l = [];
      a.forEach((s) => {
        const u = s.url_resolved || "", n = (s.name || "").trim(), k = n.toLowerCase();
        if (!n || !/^https:\/\//i.test(u) || s.hls || seen[k]) return;
        seen[k] = 1; l.push({ n: n, u: u });
      });
      const out = l.slice(0, 80);
      if (out.length) { try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), l: out })); } catch (e) {} return out; }
    } catch (e) {}
  }
  return [];
}
export function stop() {
  if (audio) { try { audio.pause(); audio.removeAttribute("src"); audio.load(); } catch (e) {} }
  cur = null; onState();
}
function play(s, toast) {
  if (!audio) audio = new Audio();
  audio.src = s.u; cur = s;
  audio.onerror = () => { toast("Bu radyo şu an açılmıyor, başka birini dene."); cur = null; onState(); };
  const p = audio.play();
  if (p && p.catch) p.catch(() => { toast("Radyo başlatılamadı."); cur = null; onState(); });
  try { if (navigator.mediaSession) navigator.mediaSession.metadata = new MediaMetadata({ title: s.n, artist: "Nöbet Arası Radyo" }); } catch (e) {}
  onState();
}
export async function view(box, el, toast) {
  box.textContent = "";
  const msg = el("p", "", "Radyolar yükleniyor…");
  msg.style.cssText = "color:var(--mute);font-size:14px";
  box.appendChild(msg);
  const list = await load();
  box.textContent = "";
  if (!list.length) { msg.textContent = "Radyo listesi alınamadı. İnternetini kontrol edip tekrar dene."; box.appendChild(msg); return; }
  const q = el("input", "");
  q.placeholder = "Radyo ara…";
  q.style.cssText = "width:100%;box-sizing:border-box;padding:10px;margin-bottom:8px;font-size:16px";
  const st = el("button", "", "⏹ Radyoyu durdur");
  st.type = "button"; st.style.cssText = "width:100%;padding:10px;margin-bottom:8px;font-weight:700";
  st.onclick = stop;
  const box2 = el("div", "");
  box.appendChild(q); box.appendChild(st); box.appendChild(box2);
  function draw() {
    box2.textContent = "";
    const f = q.value.trim().toLocaleLowerCase("tr");
    list.filter((s) => !f || s.n.toLocaleLowerCase("tr").indexOf(f) >= 0).forEach((s) => {
      const b = el("button", "", (cur && cur.u === s.u ? "🔊 " : "📻 ") + s.n);
      b.type = "button";
      b.style.cssText = "display:block;width:100%;text-align:left;padding:11px;margin-bottom:6px;font-size:16px" + (cur && cur.u === s.u ? ";border-color:var(--lamp);font-weight:700" : "");
      b.onclick = () => { play(s, toast); draw(); };
      box2.appendChild(b);
    });
  }
  q.oninput = draw; draw();
}
