// Vardiya 8: istasyon telsiz kodları (aranabilir liste). Vardiya ekranına ve Gruplar ekranına "📻 Telsiz kodları" tuşu ekler.
const T = [
  ["Yönetici", [["Genel Müdür", 1610], ["Güvenlik Şefi", 1611], ["OMC Amirlik", 1612], ["Merinos Amirlik", 1613], ["Terminal Amirlik", 1614], ["Nizamiye Giriş", 1615], ["Danışma", 1616]]],
  ["T2 istasyonları ve İpekböceği", [["Kent Meydanı", 2017], ["Genç Osman", 2027], ["Beşyol", 2037], ["Fatih/Altınova", 2047], ["Bölge Adliye", 2057], ["Otokoop", 2067], ["Buttim", 2077], ["Panayır", 2087], ["Yeniceabat", 2097], ["MYO", 2107], ["Terminal", 2117], ["T1 Depo", 1185], ["T2 Depo", 2516], ["T3 Depo", 1180], ["T1 İpek Böceği", 1186], ["TRE 1 Devriye", 1187]]],
  ["Kuzey hattı", [["Karaman", 3105], ["İhsaniye", 3205], ["Esentepe", 3305], ["Hamitler", 3405], ["O. Sanayi", 3505], ["Korupark Doğu", 3605], ["Korupark Batı", 3606], ["Emek", 3705], ["Balat", 3805]]],
  ["Batı hattı", [["Odunluk Doğu", 4005], ["Odunluk Batı", 4006], ["Nilüfer", 4105], ["FSM", 4205], ["Beşevler", 4305], ["Ataevler", 4405], ["K. Sanayi", 4505], ["Altınşehir", 4605], ["Ertuğrul", 4705], ["Özlüce", 4805], ["Yüzüncü Yıl Doğu", 4905], ["Yüzüncü Yıl Batı", 4906], ["Batıkent", 5005], ["Üniversite", 5105]]],
  ["Doğu hattı", [["Acemler", 6105], ["Paşa Çiftliği", 6205], ["Sirameşeler", 6305], ["Kültürpark", 6405], ["Merinos", 6505], ["Osmangazi Doğu", 6605], ["Osmangazi Batı", 6604], ["Şehreküstü", 6705], ["Demirtaşpaşa", 6805], ["Gökdere", 6905], ["Davutdede", 7005], ["Duaçınarı", 7105], ["152 Evler", 7205], ["Arabayatağı", 7305], ["Mimar Sinan", 7405], ["Hacıvat", 7505], ["Şirinevler", 7605], ["Otosansit", 7705], ["Cumalıkızık", 7805], ["Gürsu", 7905], ["Kestel", 8005]]]
];
const fo = (s) => String(s).toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const E = (t, s, x) => { const e = document.createElement(t); if (s) e.style.cssText = s; if (x != null) e.textContent = x; return e; };
function open() {
  const ov = E("div", "position:fixed;inset:0;z-index:99999;background:var(--bg,#0f1320);color:var(--text,#eee);overflow:auto;padding:14px;font-family:inherit");
  const top = E("div", "display:flex;align-items:center;gap:10px"); const bk = E("button", "padding:10px 14px;border-radius:12px;border:1px solid var(--line,#333);background:transparent;color:inherit;font-size:15px", "← Geri");
  bk.type = "button"; top.appendChild(bk); top.appendChild(E("b", "font-size:17px", "📻 Telsiz kodları")); ov.appendChild(top);
  const qi = E("input", "width:100%;box-sizing:border-box;margin-top:12px;padding:12px;font-size:16px;border-radius:12px;border:1px solid var(--line,#333);background:transparent;color:inherit"); qi.placeholder = "İstasyon veya numara ara (örn. Üniversite, 5105)"; ov.appendChild(qi);
  const lw = E("div"); ov.appendChild(lw); document.body.appendChild(ov);
  const close = () => { try { ov.remove(); } catch (e) {} window.removeEventListener("popstate", close); };
  bk.onclick = () => { close(); try { if (history.state && history.state.tz) history.back(); } catch (e) {} };
  try { history.pushState({ tz: 1, vdb: 1 }, ""); window.addEventListener("popstate", close); } catch (e) {}
  const draw = () => {
    lw.innerHTML = ""; const w = fo(qi.value).split(" ").filter(Boolean); let n = 0;
    T.forEach((g) => {
      const rows = g[1].filter((r) => !w.length || w.every((x) => fo(r[0]).indexOf(x) >= 0 || String(r[1]).indexOf(x) >= 0)); if (!rows.length) return;
      lw.appendChild(E("div", "margin-top:16px;font-weight:700;color:var(--lamp,#f0c24b);font-size:14px", g[0] + " (" + rows.length + ")"));
      rows.forEach((r) => { n++; const l = E("div", "display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--line,#2a3045);font-size:16px"); const a = E("span", "flex:1", r[0]); const b = E("b", "font-size:18px;letter-spacing:1px", String(r[1])); l.appendChild(a); l.appendChild(b); lw.appendChild(l); });
    });
    if (!n) lw.appendChild(E("div", "margin-top:16px;opacity:.7", "Bulunamadı. Adı kısaltıp dene."));
  };
  qi.oninput = draw; draw();
}
const mkBtn = (ref) => { const b = document.createElement("button"); b.type = "button"; b.className = ref.className || "vd-btn"; b.dataset.tz = "1"; b.textContent = "📻 Telsiz kodları"; if (ref.tagName === "H3") b.style.cssText = "width:100%;margin-top:10px"; b.onclick = (e) => { e.stopPropagation(); open(); }; return b; };
let pend = false;
const scan = () => {
  pend = false;
  document.querySelectorAll("button").forEach((b) => { if (!b.dataset.tz && /^🗂️ Gruplar/.test(b.textContent) && !(b.nextElementSibling && b.nextElementSibling.dataset.tz)) b.insertAdjacentElement("afterend", mkBtn(b)); });
  document.querySelectorAll("h3").forEach((h) => { if (/^🗂️ Gruplar/.test(h.textContent) && !(h.nextElementSibling && h.nextElementSibling.dataset.tz)) { const nb = mkBtn({ className: "vd-btn", tagName: "H3" }); h.insertAdjacentElement("afterend", nb); } });
};
try { new MutationObserver(() => { if (!pend) { pend = true; setTimeout(scan, 120); } }).observe(document.body, { childList: true, subtree: true }); scan(); } catch (e) {}
