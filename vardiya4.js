// Vardiya takibi 4. parça: arkadaşlar. Arkadaş vardiyaları yalnızca bu telefonda saklanır.
export function friends(api) {
  const { el, toast, openSheet, closeSheet, render } = api;
  openSheet((sh) => {
    sh.appendChild(el("h3", "", "👥 Arkadaşlar"));
    sh.appendChild(el("div", "vd-tg", "Arkadaşının vardiyasını eklersen takvimde “👥” ile kimin aynı gün nöbette olduğunu görürsün. İsimler, telefon numaraları ve vardiyalar yalnızca bu telefonda kalır. 💬 WhatsApp’ı açar. Arkadaşını PDF’den eklemek için “PDF’den yükle”de onun adını yaz."));
    const list = el("div"); sh.appendChild(list);
    const draw = () => {
      list.innerHTML = "";
      if (!api.D.fr.length) list.appendChild(el("p", "vd-tg", "Henüz arkadaş yok."));
      api.D.fr.forEach((f) => {
        const r = el("div", "vd-r"), nm = el("input"), op = el("button", "vd-btn", "👁️"), dl = el("button", "vd-btn", "🗑️");
        nm.type = "text"; nm.value = f.n; nm.maxLength = 24; op.type = dl.type = "button"; op.style.flex = dl.style.flex = "none"; op.style.padding = dl.style.padding = "10px 12px";
        nm.onchange = () => { const v = nm.value.trim(); if (v) { f.n = v; api.save(); } else nm.value = f.n; };
        op.onclick = () => { api.setSel(f.id); closeSheet(); render(); };
        let sure = 0; dl.onclick = () => { if (!sure) { sure = 1; dl.textContent = "Sil?"; return; } api.delFriend(f.id); api.save(); draw(); render(); toast("Silindi."); };
        r.appendChild(nm); r.appendChild(op); r.appendChild(dl); list.appendChild(r);
        const r3 = el("div", "vd-r"), ph = el("input"), wb = el("button", "vd-btn", "💬"); ph.type = "tel"; ph.maxLength = 16; ph.placeholder = "Telefon (isteğe bağlı) 05xx xxx xx xx"; ph.value = f.p || ""; wb.type = "button"; wb.style.flex = "none"; wb.style.padding = "10px 14px";
        ph.onchange = () => { f.p = ph.value.replace(/[^\d+ ]/g, "").trim(); ph.value = f.p; api.save(); render(); };
        wb.onclick = () => { f.p = ph.value.replace(/[^\d+ ]/g, "").trim(); api.save(); api.wa(f, "Selam, nöbet arası müsait misin?"); };
        r3.appendChild(ph); r3.appendChild(wb); list.appendChild(r3);
      });
    };
    draw();
    sh.appendChild(el("label", "", "Yeni arkadaş (boş takvim, sonra elle doldurursun)"));
    const r2 = el("div", "vd-r"), ni = el("input"), ad = el("button", "vd-btn p", "Ekle"); ni.type = "text"; ni.maxLength = 24; ni.placeholder = "Ad"; ad.type = "button"; ad.style.flex = "none"; ad.style.padding = "10px 16px";
    ad.onclick = () => { const v = ni.value.trim(); if (!v) { toast("Bir ad yaz."); return; } const f = api.newFriend(v); api.save(); api.setSel(f.id); closeSheet(); render(); toast(v + " eklendi. Güne dokunup vardiyasını gir."); };
    r2.appendChild(ni); r2.appendChild(ad); sh.appendChild(r2);
  });
}
