// Vardiya takibi 5. parça: PDF'deki gruplar (Metro, Tramvay T1·T2·T3). Aynı gün kim nerede, tüm ay, WhatsApp. Her şey telefonda kalır.
import { getLib, rowsOf, assign, fold, monthOf, guess } from "./vardiya3.js?v=4";
import { ROOMS } from "./rooms.js?v=2";
import { seedTypes, kd, info, offName, codeView } from "./vardiya7.js?v=1";
import("./vardiya6.js?v=1").catch(() => {});
const TK = "na_vardiya_tel";
const tels = () => { try { return JSON.parse(localStorage.getItem(TK)) || {}; } catch (e) { return {}; } };
const nk = (s) => fold(s).split(" ").filter((w) => /^[a-z]{2,}$/.test(w));
const norm = (c) => String(c || "").replace(/\s+/g, " ").trim().toLocaleUpperCase("tr");
const isOff = (c) => fold(c).replace(/ /g, "").length <= 2;
const pre = (c) => { const m = c.match(/^[A-ZÇĞİÖŞÜ]+\d?/); return m ? m[0] : c; };
// Grup sohbet odaları: her gün değişen kodla. Üyeler (anahtarı bilenler) otomatik yeni güne geçer, yeni gelen o günün kodunu kullanır.
const RK = "na_vardiya_odalar", AL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const rk = () => { try { return (JSON.parse(localStorage.getItem(RK)) || []).filter((x) => x && x.t); } catch (e) { return []; } };
const dayN = () => Math.floor((Date.now() + 108e5) / 864e5);
const hb = async (s) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("nobetarasi-vd|" + s)));
const hx = async (s) => Array.from(await hb(s)).map((x) => x.toString(16).padStart(2, "0")).join("");
const dc = async (S, d) => Array.from((await hb("c|" + S + "|" + d)).slice(0, 8)).map((x) => AL[x % 32]).join("");
const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(8))).map((x) => AL[x % 32]).join("");
const rerender = () => { const q = document.getElementById("q"); if (q) q.dispatchEvent(new Event("input")); };
const icon = (g) => (/TRAM/i.test(g) ? "🚋" : /BURSARAY|METRO|İSTASYON/i.test(g) ? "🚇" : "👥");
const title = (n) => n.toLocaleLowerCase("tr").replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toLocaleUpperCase("tr"));
const mk = async (e, C) => { const h = await hx(fold(e.n) + "|" + C); return { id: "vd_" + h.slice(0, 32), ic: icon(e.n), n: title(e.n) + " 🔒" + h.slice(0, 3).toUpperCase(), d: "Özel oda · kod her gün değişir · takma adınla yazarsın", v: 1 }; };
const codeOf = (e) => (e.t === "m" ? dc(e.s, dayN()) : Promise.resolve(e.c));
let lastDay = dayN();
async function refresh() {
  if (!(window.crypto && crypto.subtle)) return;
  const d = dayN(); lastDay = d; const l = rk().filter((e) => e.t === "m" || e.d === d), nr = [];
  try { localStorage.setItem(RK, JSON.stringify(l)); } catch (e) {}
  for (const e of l) nr.push(await mk(e, await codeOf(e)));
  for (let i = ROOMS.length - 1; i >= 0; i--) if (ROOMS[i].v) ROOMS.splice(i, 1);
  nr.forEach((r, i) => ROOMS.splice(3 + i, 0, r)); rerender();
}
refresh(); setTimeout(rerender, 2500); setTimeout(rerender, 6000); setInterval(() => { if (dayN() !== lastDay) refresh(); }, 6e4);
export function gruplar(api) {
  const { el, toast, openSheet, ymd, MON, DS, save, render } = api, now = new Date();
  try { seedTypes(api); } catch (e) {}
  openSheet((sh) => {
    sh.appendChild(el("h3", "", "🗂️ Gruplar · Metro · Tramvay"));
    sh.appendChild(el("div", "vd-tg", "🔒 PDF telefonunda açılır. Okunan liste ve rehber numaraları yalnızca bu telefonda saklanır (uygulamayı kapatsan da kalır), hiçbir yere gönderilmez."));
    const fi = el("input"); fi.type = "file"; fi.accept = ".pdf,application/pdf"; fi.style.marginTop = "12px"; sh.appendChild(fi);
    const go = el("button", "vd-btn p", "📂 Listeyi oku"); go.type = "button"; go.style.cssText = "width:100%;margin-top:10px"; sh.appendChild(go);
    const msg = el("div", "vd-tg"); msg.style.marginTop = "12px"; msg.hidden = true; sh.appendChild(msg);
    const body = el("div"); sh.appendChild(body);
    const GK = "na_vardiya_grup_v1", loadG = () => { try { const x = JSON.parse(localStorage.getItem(GK)); return x && x.people && x.groups && x.groups.length ? x : null; } catch (e) { return null; } };
    const say = (x) => { msg.hidden = !x; msg.textContent = x || ""; };
    let D = null, gi = 0, mode = "find", day = now.getDate(), q = "", open = -1, busy = false;
    const onDuty = (p) => {
      if (!D || D.m !== now.getMonth() || D.y !== now.getFullYear()) return false; const t = new Date();
      for (const dd of [t.getDate() - 1, t.getDate()]) {
        const x = kd(norm(p.out[dd])); if (!x) continue;
        const s = new Date(D.y, D.m, dd, +x[2].slice(0, 2), +x[2].slice(3)); let e = new Date(D.y, D.m, dd, +x[3].slice(0, 2), +x[3].slice(3)); if (e <= s) e = new Date(e.getTime() + 864e5);
        if (t >= s && t < e) return true;
      }
      return false;
    };
    const phone = (p) => tels()[fold(p.name)] || "";
    const hi = (c) => { const x = fold(c).replace(/ /g, ""); return x === "hi" ? "izin" : x === "yi" ? "izin" : x === "r" ? "rapor" : ""; };
    const addFr = (p, quiet) => {
      const f = api.D.fr.find((x) => fold(x.n) === fold(p.name)) || api.newFriend(p.name), t = phone(p); if (t) f.p = t;
      let n = 0; Object.keys(p.out).forEach((d) => { const c = norm(p.out[d]), id = hi(c) || guess(c, api.D.types) || "c:" + c; if (!c || +d > new Date(D.y, D.m + 1, 0).getDate()) return; f.days[ymd(new Date(D.y, D.m, +d))] = { t: id, n: "" }; n++; });
      if (!quiet) { save(); render(); toast(p.name + " takvime eklendi (" + n + " gün). Vardiya ekranında üstteki sekmeden gör."); }
      return n;
    };
    const wbtn = (p) => { const b = el("button", "vd-ib", "💬"); b.type = "button"; b.onclick = (e) => { e.stopPropagation(); api.wa({ p: phone(p) }, "Selam, nöbet arası müsait misin?"); }; return b; };
    const matchTel = async () => {
      if (!(navigator.contacts && navigator.contacts.select)) { toast("Bu telefonda rehber seçimi yok."); return; }
      try {
        const cs = await navigator.contacts.select(["name", "tel"], { multiple: true }), map = tels(); let n = 0;
        D.people.forEach((p) => {
          const pw = nk(p.name); if (pw.length < 2) return;
          const h = cs.find((c) => { const cw = nk((c.name && c.name[0]) || ""); return cw.length >= 2 && (pw.every((w) => cw.indexOf(w) >= 0) || cw.every((w) => pw.indexOf(w) >= 0)); });
          const t = h && h.tel && h.tel[0]; if (t) { map[fold(p.name)] = String(t).replace(/[^\d+]/g, ""); n++; }
        });
        try { localStorage.setItem(TK, JSON.stringify(map)); } catch (e) {}
        toast(n + " kişinin numarası eşleşti."); draw();
      } catch (e) {}
    };
    const enter = async (e) => {
      const key = e.s || e.c;
      if (String(key).length < 6) { toast("Kod en az 6 harf/rakam olsun."); return; }
      if (!(window.crypto && crypto.subtle)) { toast("Bu tarayıcı güvenli kodu desteklemiyor."); return; }
      const l = rk().filter((x) => !(x.t === e.t && fold(x.n) === fold(e.n) && (x.s || x.c) === key)); l.push(e);
      try { localStorage.setItem(RK, JSON.stringify(l)); } catch (er) {}
      await refresh(); const r = await mk(e, await codeOf(e));
      const x = document.querySelector(".vd .vd-h .vd-ib"); if (x) x.click();
      setTimeout(() => { const b = Array.from(document.querySelectorAll("#rooms .room b")).find((y) => y.textContent === r.ic + " " + r.n); if (b && b.parentNode) b.parentNode.click(); else toast("Oda eklendi, Sohbet sekmesinde bul: " + r.n); }, 300);
    };
    const clean = (v) => String(v || "").replace(/\s+/g, "").toLocaleUpperCase("tr");
    const shareCode = async (G, e) => { const k = await codeOf(e), t = "Nöbet Arası'nda \"" + G.n + "\" özel odası. Vardiya > Gruplar > günlük kod (bugün geçerli): " + k; if (navigator.share) navigator.share({ text: t }).catch(() => {}); else { try { navigator.clipboard.writeText(t); toast("Kopyalandı."); } catch (er) { toast("Bugünün kodu: " + k); } } };
    const draw = () => {
      body.innerHTML = ""; const G = D.groups[gi], ps = D.people.filter((p) => p.g === gi);
      const fc = el("div", "vd-fc"); fc.style.marginTop = "12px";
      D.groups.forEach((g, i) => { const b = el("button", i === gi ? "on" : "", icon(g.n) + " " + g.n + " (" + g.c + ")"); b.type = "button"; b.onclick = () => { gi = i; open = -1; draw(); }; fc.appendChild(b); });
      body.appendChild(fc);
      const mc = el("div", "vd-fc");
      [["find", "🔎 Arkadaşım nerede"], ["code", "🔢 Koda göre"], ["day", "📅 Aynı gün"], ["all", "👤 Tüm ay"]].forEach((x) => { const b = el("button", mode === x[0] ? "on" : "", x[1]); b.type = "button"; b.onclick = () => { mode = x[0]; open = -1; q = ""; draw(); }; mc.appendChild(b); });
      body.appendChild(mc);
      say(MON[D.m] + " " + D.y + " · " + G.n + " · " + ps.length + " kişi");
      const cw = el("div", "vd-tg"); cw.style.marginTop = "6px"; cw.appendChild(el("div", "", "🔒 Özel oda: kodu bilmeyen giremez. Kod HER GÜN değişir. Anahtarı bilen üyeler otomatik yeni güne geçer; yeni birini almak için ona bugünün kodunu (📤) gönder. Her gün oda yenilendiği için eski mesajlar görünmez."));
      const ci = el("input"); ci.placeholder = "Anahtar veya günlük kod (en az 6)"; ci.autocapitalize = "characters"; ci.style.marginTop = "8px"; cw.appendChild(ci);
      const rn = el("button", "vd-btn", "✨ Rastgele anahtar üret"); rn.type = "button"; rn.style.cssText = "width:100%;margin-top:6px"; rn.onclick = () => { ci.value = rnd(); }; cw.appendChild(rn);
      const rb = el("button", "vd-btn p", "🔑 Anahtarla gir / oda aç (üye)"); rb.type = "button"; rb.style.cssText = "width:100%;margin-top:6px"; rb.onclick = () => enter({ t: "m", n: G.n, s: clean(ci.value) }); cw.appendChild(rb);
      const gb = el("button", "vd-btn", "📨 Günlük kodla katıl (bugün)"); gb.type = "button"; gb.style.cssText = "width:100%;margin-top:6px"; gb.onclick = () => enter({ t: "g", n: G.n, c: clean(ci.value), d: dayN() }); cw.appendChild(gb);
      rk().filter((x) => fold(x.n) === fold(G.n)).forEach((x) => {
        const l = el("div", ""); l.style.cssText = "display:flex;align-items:center;gap:8px;margin-top:8px;font-size:13px";
        const t = el("span", "", x.t === "m" ? "🔑 " + x.s : "📨 " + x.c + " (bugün)"); t.style.flex = "1"; l.appendChild(t);
        const e1 = el("button", "vd-ib", "Gir"); e1.type = "button"; e1.onclick = () => enter(x); l.appendChild(e1);
        if (x.t === "m") { const e2 = el("button", "vd-ib", "📤"); e2.type = "button"; e2.onclick = () => shareCode(G, x); l.appendChild(e2); codeOf(x).then((k) => { t.textContent = "🔑 " + x.s + " · bugün: " + k; }); }
        cw.appendChild(l);
      });
      if (mode === "find") {
        const ds = el("select"); for (let i = 1; i <= new Date(D.y, D.m + 1, 0).getDate(); i++) ds.appendChild(new Option(i + ". gün · " + DS[(new Date(D.y, D.m, i).getDay() + 6) % 7], i));
        ds.value = day; ds.style.marginTop = "6px"; ds.onchange = () => { day = +ds.value; list(); }; body.appendChild(ds);
        const qi = el("input"); qi.placeholder = "Arkadaşının adını yaz (örn. Ahmet)"; qi.value = q; qi.style.marginTop = "6px"; qi.oninput = () => { q = qi.value; open = -1; list(); }; body.appendChild(qi);
        const lw = el("div"); body.appendChild(lw);
        const list = () => {
          lw.innerHTML = ""; const w = fold(q).split(" ").filter(Boolean); let n = 0;
          if (!w.length) { lw.appendChild(el("div", "vd-tg", "Adını yaz, seçtiğin gün nerede ve hangi saatte olduğunu göstereyim. Üstten günü değiştirebilirsin.")); lw.firstChild.style.marginTop = "8px"; return; }
          D.people.forEach((p, i) => {
            if (!w.every((x) => fold(p.name).split(" ").some((y) => y.indexOf(x) === 0)) || ++n > 30) return;
            const c = norm(p.out[day]), row = el("div", ""); row.style.cssText = "border-bottom:1px solid var(--line);padding:10px 0";
            const h = el("div", ""); h.style.cssText = "display:flex;align-items:center;gap:8px;font-size:15px";
            const nm = el("span", "", p.name); nm.style.cssText = "flex:1;font-weight:700"; h.appendChild(nm); h.appendChild(wbtn(p)); row.appendChild(h);
            const g = el("div", "", (D.groups[p.g] ? D.groups[p.g].n : "") + (onDuty(p) ? " · 🟢 şu an nöbette" : "")); g.style.cssText = "font-size:12px;color:var(--mute);margin-top:2px"; row.appendChild(g);
            const t = el("div", "", c ? (isOff(c) ? "🏖️ " + offName(c) : "📍 " + info(c)) : "Bu gün için kayıt yok"); t.style.cssText = "margin-top:6px;font-size:15px;color:var(--lamp)"; row.appendChild(t);
            const bt = el("button", "vd-btn", open === i ? "▲ Gizle" : "📆 Sonraki günler"); bt.type = "button"; bt.style.cssText = "width:100%;margin-top:8px;padding:8px"; bt.onclick = () => { open = open === i ? -1 : i; list(); }; row.appendChild(bt);
            if (open === i) {
              const bx = el("div", "vd-tg"); bx.style.marginTop = "8px";
              for (let d = day; d <= Math.min(day + 6, new Date(D.y, D.m + 1, 0).getDate()); d++) { const cc = norm(p.out[d]), l = el("div", "", DS[(new Date(D.y, D.m, d).getDay() + 6) % 7] + " " + d + " · " + (cc ? (isOff(cc) ? offName(cc) : info(cc)) : "–")); l.style.cssText = "padding:5px 0;border-bottom:1px solid var(--line);font-size:13px;color:var(--text)"; bx.appendChild(l); }
              row.appendChild(bx);
              const ab = el("button", "vd-btn p", "＋ Takvimime ekle (tüm ay)"); ab.type = "button"; ab.style.cssText = "width:100%;margin-top:8px"; ab.onclick = () => addFr(p); row.appendChild(ab);
            }
            lw.appendChild(row);
          });
          if (!n) { const z = el("div", "vd-tg", "Bu isimde kimse bulunamadı. Adı kısaltıp dene."); z.style.marginTop = "8px"; lw.appendChild(z); }
        };
        list();
      } else if (mode === "code") {
        codeView({ el, body, D, day, setDay: (v) => { day = v; }, q, setQ: (v) => { q = v; }, DS, fold, norm, isOff, wbtn, onDuty, icon });
      } else if (mode === "day") {
        const ds = el("select"); for (let i = 1; i <= new Date(D.y, D.m + 1, 0).getDate(); i++) ds.appendChild(new Option(i + ". gün · " + DS[(new Date(D.y, D.m, i).getDay() + 6) % 7], i));
        ds.value = day; ds.style.marginTop = "6px"; ds.onchange = () => { day = +ds.value; draw(); }; body.appendChild(ds);
        const by = {}; let off = 0;
        ps.forEach((p) => { const c = norm(p.out[day]); if (!c) return; if (isOff(c)) { off++; return; } const k = pre(c); (by[k] = by[k] || []).push([p, c]); });
        const ks = Object.keys(by).sort(); if (!ks.length) body.appendChild(el("div", "vd-tg", "Bu gün çalışan görünmüyor."));
        ks.forEach((k) => {
          body.appendChild(el("label", "", k + " · " + by[k].length + " kişi"));
          const box = el("div", "vd-tg");
          by[k].sort((a, b) => (a[1] < b[1] ? -1 : 1)).forEach((x) => {
            const l = el("div", ""); l.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line);font-size:14px;color:var(--text)";
            const n = el("span", "", x[0].name); n.style.flex = "1"; const c = el("b", "", x[1]); c.style.color = "var(--lamp)";
            l.appendChild(n); l.appendChild(c); l.appendChild(wbtn(x[0])); box.appendChild(l);
          });
          body.appendChild(box);
        });
        if (off) body.appendChild(el("p", "vd-tg", "İzinli / raporlu: " + off + " kişi"));
      } else {
        const qi = el("input"); qi.placeholder = "İsim ara"; qi.value = q; qi.style.marginTop = "6px"; qi.oninput = () => { q = qi.value; open = -1; list(); }; body.appendChild(qi);
        const lw = el("div"); body.appendChild(lw);
        const list = () => {
          lw.innerHTML = ""; const w = fold(q).split(" ").filter(Boolean);
          ps.forEach((p, i) => {
            if (w.length && !w.every((x) => fold(p.name).split(" ").some((y) => y.indexOf(x) === 0))) return;
            const row = el("div", ""); row.style.cssText = "border-bottom:1px solid var(--line);padding:8px 0";
            const h = el("div", ""); h.style.cssText = "display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer";
            const n = el("span", "", p.name); n.style.flex = "1"; const c = el("b", "", norm(p.out[now.getDate()]) || "–"); c.style.color = "var(--lamp)";
            h.appendChild(n); h.appendChild(c); h.appendChild(wbtn(p)); h.onclick = () => { open = open === i ? -1 : i; list(); }; row.appendChild(h);
            if (open === i) {
              const cal = el("div", "vd-cal"); cal.style.margin = "8px 0"; DS.forEach((s) => cal.appendChild(el("div", "w", s)));
              for (let k = 0; k < (new Date(D.y, D.m, 1).getDay() + 6) % 7; k++) cal.appendChild(el("div"));
              for (let d = 1; d <= new Date(D.y, D.m + 1, 0).getDate(); d++) { const x = el("div", "vd-d"), cc = norm(p.out[d]); x.style.cssText = "min-height:40px;font-size:9px;cursor:default"; x.appendChild(el("span", "n", d)); const s = el("span", "", cc || "·"); s.style.cssText = "margin-top:10px;font-weight:700;font-size:10px;word-break:break-all;text-align:center"; x.appendChild(s); if (cc && !isOff(cc)) x.style.borderColor = "var(--lamp)"; cal.appendChild(x); }
              row.appendChild(cal);
              const ab = el("button", "vd-btn p", "＋ Takvimime ekle (arkadaş, tüm ay)"); ab.type = "button"; ab.style.cssText = "width:100%"; ab.onclick = () => addFr(p); row.appendChild(ab);
            }
            lw.appendChild(row);
          });
        };
        list();
      }
      body.appendChild(cw);
      const ga = el("button", "vd-btn p", "👥 " + G.n + " grubunu takvime ekle (" + ps.length + " kişi)"); ga.type = "button"; ga.style.cssText = "width:100%;margin-top:14px"; ga.onclick = () => { ps.forEach((p) => addFr(p, true)); save(); render(); toast(ps.length + " kişi takvime eklendi. Vardiya ekranında arkadaş listesinden seçip gör."); }; body.appendChild(ga);
      const cb = el("button", "vd-btn", "📇 Rehberden eşleştir (WhatsApp otomatik)"); cb.type = "button"; cb.style.cssText = "width:100%;margin-top:8px"; cb.onclick = matchTel; body.appendChild(cb);
      body.appendChild(el("p", "vd-tg", "Rehber ekranında kişileri seç (hepsini seçebilirsin). Adı eşleşenlerin 💬 tuşu doğrudan WhatsApp sohbetini açar."));
      const dl = el("button", "vd-btn", "🗑️ Kayıtlı listeyi sil (yeni PDF seç)"); dl.type = "button"; dl.style.cssText = "width:100%;margin-top:14px"; dl.onclick = () => { try { localStorage.removeItem(GK); } catch (e) {} D = null; body.innerHTML = ""; say("Kayıtlı liste silindi. Yeni PDF seçip 'Listeyi oku'ya bas."); }; body.appendChild(dl);
      const cl = el("button", "vd-btn", "🗑️ Rehber eşleşmelerini sil"); cl.type = "button"; cl.style.cssText = "width:100%;margin-top:4px"; cl.onclick = () => { try { localStorage.removeItem(TK); } catch (e) {} toast("Silindi."); draw(); }; body.appendChild(cl);
    };
    go.onclick = async () => {
      const f = fi.files && fi.files[0]; if (busy) return; if (!f) { say("Önce PDF dosyasını seç."); return; }
      busy = true; body.innerHTML = ""; say("PDF okunuyor, birkaç saniye sürebilir…");
      try {
        const L = await getLib(), doc = await L.getDocument({ data: await f.arrayBuffer() }).promise, people = [], groups = []; let md = now.getMonth(), my = now.getFullYear(), cur = -1;
        for (let p = 1; p <= Math.min(doc.numPages, 40); p++) {
          const rows = rowsOf((await (await doc.getPage(p)).getTextContent()).items), mm = monthOf(rows, md, my); md = mm[0]; my = mm[1];
          rows.forEach((r, i) => {
            const tx = r.t.map((t) => t.s).join(" ");
            if (/GRUBU/i.test(tx) && !/^\d/.test(tx)) { groups.push({ n: tx.replace(/\(.*?\)/g, "").replace(/GRUBU/i, "").replace(/\s+/g, " ").trim(), c: 0 }); cur = groups.length - 1; return; }
            if (r.t.length < 4 || !/^\d{1,3}$/.test(r.t[0].s) || !/^\d{4,6}$/.test(r.t[1].s)) return;
            const a = assign(rows, i, []); if (!a.auto) return;
            if (cur < 0) { groups.push({ n: "Liste", c: 0 }); cur = 0; }
            groups[cur].c++; people.push({ g: cur, name: r.t.slice(2).filter((t) => t.x < a.lo).map((t) => t.s).join(" "), out: a.out });
          });
        }
        if (!people.length) { say("Bu PDF'den liste okuyamadım. Taranmış (fotoğraf) bir PDF olabilir."); busy = false; return; }
        D = { people: people, groups: groups.filter((g) => g.c), m: md, y: my }; const old = D.groups.length; D.people.forEach((p) => { p.g = groups.filter((g) => g.c).indexOf(groups[p.g]); });
        let ok = false; try { localStorage.setItem(GK, JSON.stringify(D)); ok = !!localStorage.getItem(GK); } catch (e) {}
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
        gi = 0; open = -1; if (md !== now.getMonth() || my !== now.getFullYear()) day = 1; if (!old) { say("Grup bulunamadı."); busy = false; return; }
        draw(); toast(ok ? "Liste telefona kaydedildi ✓ Kapatsan da kalır." : "Liste kaydedilemedi: telefon kayda izin vermiyor.");
      } catch (e) { say("PDF okunamadı. İnternet bağlantını kontrol edip tekrar dene. (PDF okuyucu ilk seferde internetten yüklenir.)"); }
      busy = false;
    };
    const sv = loadG(); if (sv) { D = sv; if (D.m !== now.getMonth() || D.y !== now.getFullYear()) day = 1; draw(); }
  });
}
