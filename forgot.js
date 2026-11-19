import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// "Şifremi unuttum": e-postaya sıfırlama bağlantısı gönderir (giriş ekranında)
const auth = getAuth();
try { auth.languageCode = "tr"; } catch (e) {}
const $ = (i) => document.getElementById(i);

function errText(e) {
  const c = e && e.code;
  if (c === "auth/invalid-email") return "E-posta adresi geçerli görünmüyor.";
  if (c === "auth/too-many-requests") return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.";
  if (c === "auth/network-request-failed") return "İnternet bağlantısı yok gibi görünüyor.";
  return "Gönderilemedi. Biraz sonra tekrar dene.";
}

const go = $("go");
if (go && $("em") && $("err")) {
  const link = document.createElement("button");
  link.type = "button";
  link.id = "forgot";
  link.textContent = "Şifremi unuttum";
  link.style.cssText = "display:block;width:100%;background:none;border:0;color:var(--mute);text-decoration:underline;cursor:pointer;margin-top:12px;font-size:14px;padding:4px";
  const msg = document.createElement("div");
  msg.id = "fmsg";
  msg.style.cssText = "color:var(--lamp);font-size:14px;margin-top:6px;min-height:0";
  go.parentNode.insertBefore(link, $("err"));
  go.parentNode.insertBefore(msg, $("err"));

  link.onclick = async () => {
    const email = $("em").value.trim();
    msg.style.color = "var(--lamp)";
    if (!email) { msg.textContent = "Önce e-posta kutusuna adresini yaz, sonra tekrar dokun."; return; }
    link.disabled = true;
    msg.textContent = "Gönderiliyor…";
    try {
      await sendPasswordResetEmail(auth, email);
      msg.textContent = "Bu e-posta ile bir hesap varsa sıfırlama bağlantısı gönderildi. Gelen kutusuna ve gereksiz (spam) klasörüne bak.";
    } catch (e) {
      msg.style.color = "var(--danger)";
      msg.textContent = errText(e);
    }
    link.disabled = false;
  };

  // Kayıt sekmesinde gizle
  const sync = () => { link.hidden = $("tUp") && $("tUp").getAttribute("aria-pressed") === "true"; msg.textContent = ""; };
  if ($("tIn")) $("tIn").addEventListener("click", sync);
  if ($("tUp")) $("tUp").addEventListener("click", sync);
}
