// 🎤 Sesle yazma: mesaj kutusunun yanına mikrofon düğmesi ekler (Türkçe)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const $ = (i) => document.getElementById(i);

function note(t) {
  const el = $("toast");
  if (!el) return;
  el.textContent = t;
  el.hidden = false;
  clearTimeout(note.t);
  note.t = setTimeout(() => { el.hidden = true; }, 3500);
}

function init() {
  const form = $("sf"), input = $("in");
  if (!form || !input || $("mic")) return;

  const b = document.createElement("button");
  b.id = "mic";
  b.type = "button";
  b.textContent = "🎤";
  b.setAttribute("aria-label", "Sesle yaz");
  b.style.cssText = "background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:0 14px;font-size:20px;cursor:pointer";
  const send = form.querySelector("button:not(#mic)");
  form.insertBefore(b, send);

  let rec = null, on = false, base = "";

  function stopUi() {
    on = false;
    b.textContent = "🎤";
    b.style.borderColor = "var(--line)";
  }

  b.onclick = () => {
    if (!SR) { note("Bu tarayıcı sesle yazmayı desteklemiyor"); return; }
    if (on && rec) { try { rec.stop(); } catch (e) {} return; }
    try {
      rec = new SR();
      rec.lang = "tr-TR";
      rec.interimResults = true;
      rec.continuous = false;
      base = input.value ? input.value.replace(/\s+$/, "") + " " : "";
      rec.onresult = (e) => {
        let t = "";
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        input.value = (base + t).slice(0, input.maxLength > 0 ? input.maxLength : 400);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      };
      rec.onerror = (e) => {
        const m = {
          "not-allowed": "Mikrofon izni ver (adres çubuğundaki kilit simgesi)",
          "service-not-allowed": "Mikrofon izni ver (adres çubuğundaki kilit simgesi)",
          "no-speech": "Ses duymadım, tekrar dene",
          "audio-capture": "Mikrofon bulunamadı",
          "network": "İnternet bağlantısı gerekli"
        };
        note(m[e.error] || "Sesle yazma çalışmadı");
        stopUi();
      };
      rec.onend = () => { stopUi(); input.focus(); };
      rec.start();
      on = true;
      b.textContent = "⏹️";
      b.style.borderColor = "var(--lamp)";
      note("Dinliyorum, konuş…");
    } catch (e) {
      note("Sesle yazma başlatılamadı");
      stopUi();
    }
  };
}

init();
