export const ILLER = "Adana,Adıyaman,Afyonkarahisar,Ağrı,Aksaray,Amasya,Ankara,Antalya,Ardahan,Artvin,Aydın,Balıkesir,Bartın,Batman,Bayburt,Bilecik,Bingöl,Bitlis,Bolu,Burdur,Bursa,Çanakkale,Çankırı,Çorum,Denizli,Diyarbakır,Düzce,Edirne,Elazığ,Erzincan,Erzurum,Eskişehir,Gaziantep,Giresun,Gümüşhane,Hakkâri,Hatay,Iğdır,Isparta,İstanbul,İzmir,Kahramanmaraş,Karabük,Karaman,Kars,Kastamonu,Kayseri,Kırıkkale,Kırklareli,Kırşehir,Kilis,Kocaeli,Konya,Kütahya,Malatya,Manisa,Mardin,Mersin,Muğla,Muş,Nevşehir,Niğde,Ordu,Osmaniye,Rize,Sakarya,Samsun,Siirt,Sinop,Sivas,Şanlıurfa,Şırnak,Tekirdağ,Tokat,Trabzon,Tunceli,Uşak,Van,Yalova,Yozgat,Zonguldak".split(",");
export const ROOMS = [
  { id: "gece", ic: "🌙", n: "Gece vardiyası", d: "Uykusuzluk, soğuk, uzun saatler" },
  { id: "maas", ic: "💰", n: "Maaş ve haklar", d: "Fazla mesai, izin, sözleşme" },
  { id: "moral", ic: "💬", n: "Moral köşesi", d: "Dertleş, rahatla, destek ol" }
].concat(ILLER.map((il, i) => ({ id: "il" + i, ic: "📍", n: il, d: "Şehre özel sohbet" })));
