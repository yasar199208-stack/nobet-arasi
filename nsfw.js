// Resim denetimi: telefonda çalışan yapay zekâ modeli (NSFWJS MobileNetV2, 5 sınıf).
// Model ve TensorFlow.js ilk resimde internetten indirilir; resimler hiçbir yere gönderilmez.
const TF = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
const MODEL = "https://cdn.jsdelivr.net/gh/infinitered/nsfwjs@2286f17b7efee1558356dc8736391e63c6959a6e/models/mobilenet_v2/model.json";
const HARD = 0.9;   // porn+hentai bu değerin üstündeyse: kesin uygunsuz (otomatik ban)
const SOFT = 0.55;  // porn+hentai bu değerin üstündeyse: şüpheli (gönderme / bulanık göster)
const SEXY = 0.92;  // yalnızca "sexy" çok yüksekse: şüpheli

let modelP = null, failAt = 0, queue = Promise.resolve();
const cache = new Map();

function loadScript(src) {
  return new Promise((res, rej) => {
    if (window.tf) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => res();
    s.onerror = () => rej(new Error("tf"));
    document.head.appendChild(s);
  });
}

function getModel() {
  if (modelP) return modelP;
  if (Date.now() - failAt < 20000) return Promise.reject(new Error("recent-fail"));
  modelP = loadScript(TF).then(() => window.tf.loadLayersModel(MODEL)).catch((e) => {
    modelP = null; failAt = Date.now(); throw e;
  });
  return modelP;
}

function loadImg(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error("img"));
    im.src = src;
  });
}

async function run(src) {
  const model = await getModel();
  const im = await loadImg(src);
  const tf = window.tf;
  const out = tf.tidy(() => {
    const x = tf.browser.fromPixels(im).toFloat().div(255);
    const r = tf.image.resizeBilinear(x, [224, 224], true);
    return model.predict(r.reshape([1, 224, 224, 3]));
  });
  const d = await out.data();
  out.dispose();
  return { drawing: d[0], hentai: d[1], neutral: d[2], porn: d[3], sexy: d[4] };
}

function judge(p) {
  const bad = p.porn + p.hentai;
  const level = bad >= HARD ? "hard" : (bad >= SOFT || p.sexy >= SEXY) ? "soft" : "ok";
  return { level: level, p: p };
}

// Sonuç: { level: "ok" | "soft" | "hard" | "error" }
export function verdict(src) {
  const key = src.length + ":" + src.slice(30, 90) + src.slice(-60);
  if (cache.has(key)) return cache.get(key);
  const job = queue.then(() => run(src)).then(judge).catch(() => ({ level: "error" }));
  queue = job.then(() => {}, () => {});
  const keep = job.then((r) => { if (r.level === "error") cache.delete(key); return r; });
  cache.set(key, keep);
  return keep;
}

// Yönetici incelemesi için küçük (yaklaşık 72 px) önizleme
export async function thumb(src) {
  try {
    const im = await loadImg(src);
    const k = 72 / Math.max(im.width, im.height, 1);
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    let q = 0.5, d = c.toDataURL("image/jpeg", q);
    while (d.length > 7000 && q > 0.2) { q -= 0.1; d = c.toDataURL("image/jpeg", q); }
    return d.length <= 7500 ? d : "";
  } catch (e) { return ""; }
}
