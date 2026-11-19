// Giriş ekranının altına Gizlilik ve Kullanım Şartları bağlantıları ekler.
function add() {
  const card = document.querySelector("#auth .card");
  if (!card || document.getElementById("legal")) return;
  const p = document.createElement("p");
  p.id = "legal";
  p.style.cssText = "margin:16px 0 0;font-size:13px;line-height:1.5;color:var(--mute);text-align:center";
  p.appendChild(document.createTextNode("Devam ederek "));
  const a = document.createElement("a");
  a.href = "sartlar.html"; a.target = "_blank"; a.rel = "noopener";
  a.textContent = "Kullanım Şartları";
  const b = document.createElement("a");
  b.href = "gizlilik.html"; b.target = "_blank"; b.rel = "noopener";
  b.textContent = "Gizlilik Politikası";
  [a, b].forEach((x) => { x.style.color = "var(--lamp)"; });
  p.appendChild(a);
  p.appendChild(document.createTextNode(" ve "));
  p.appendChild(b);
  p.appendChild(document.createTextNode("'nı kabul etmiş olursun."));
  card.appendChild(p);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add);
else add();
