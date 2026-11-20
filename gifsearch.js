// Hareketli GIF'i küçültür: ortak (uyarlanır) 255 renk paleti, 255 = saydam
function lzwEncode(px) {
  const out = [];
  let cur = 0, bits = 0, size = 9, next = 258;
  const dict = new Map();
  function emit(c) {
    cur |= c << bits; bits += size;
    while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; }
  }
  emit(256);
  let prefix = px[0];
  for (let i = 1; i < px.length; i++) {
    const k = px[i], key = prefix * 256 + k, code = dict.get(key);
    if (code !== undefined) { prefix = code; continue; }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      if (next - 1 > (1 << size) - 1 + 0 && size < 12) size++;
    } else {
      emit(256); dict.clear(); next = 258; size = 9;
    }
    prefix = k;
  }
  emit(prefix);
  emit(257);
  if (bits > 0) out.push(cur & 255);
  return out;
}

function gifBytes(frames, w, h, pal) {
  const o = [];
  const w16 = (n) => { o.push(n & 255, (n >> 8) & 255); };
  "GIF89a".split("").forEach((c) => o.push(c.charCodeAt(0)));
  w16(w); w16(h); o.push(0xf7, 0, 0);
  for (let i = 0; i < 768; i++) o.push(pal[i]);
  o.push(0x21, 0xff, 0x0b);
  "NETSCAPE2.0".split("").forEach((c) => o.push(c.charCodeAt(0)));
  o.push(3, 1, 0, 0, 0);
  frames.forEach((f) => {
    o.push(0x21, 0xf9, 4, f.flag); w16(f.delay); o.push(255, 0);
    o.push(0x2c); w16(f.x); w16(f.y); w16(f.w); w16(f.h); o.push(0);
    o.push(8);
    const d = lzwEncode(f.px);
    for (let i = 0; i < d.length; i += 255) {
      const n = Math.min(255, d.length - i);
      o.push(n);
      for (let j = 0; j < n; j++) o.push(d[i + j]);
    }
    o.push(0);
  });
  o.push(0x3b);
  return new Uint8Array(o);
}

// Kare farkı: yalnızca değişen dikdörtgeni yazar, değişmeyen pikseller saydam (255)
function deltaFrames(full, w, h, pal) {
  const out = [];
  let prev = null;
  full.forEach((f) => {
    if (!prev) {
      out.push({ px: f.px, x: 0, y: 0, w: w, h: h, delay: f.delay, flag: 0x04 });
      prev = Uint8Array.from(f.px);
      return;
    }
    const keep = new Uint8Array(w * h);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
      const a = f.px[i], b = prev[i];
      let same = a === b;
      if (!same) {
        const dr = pal[a * 3] - pal[b * 3], dg = pal[a * 3 + 1] - pal[b * 3 + 1], db = pal[a * 3 + 2] - pal[b * 3 + 2];
        same = 2 * dr * dr + 4 * dg * dg + 3 * db * db < 260;
      }
      if (same) { keep[i] = 1; continue; }
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) {
      // değişiklik yok: önceki kareyi uzat
      const last = out[out.length - 1];
      last.delay = Math.min(500, last.delay + f.delay);
      return;
    }
    const rw = x1 - x0 + 1, rh = y1 - y0 + 1;
    const px = new Uint8Array(rw * rh);
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
      const i = (y0 + y) * w + (x0 + x);
      if (keep[i]) px[y * rw + x] = 255;
      else { px[y * rw + x] = f.px[i]; prev[i] = f.px[i]; }
    }
    out.push({ px: px, x: x0, y: y0, w: rw, h: rh, delay: f.delay, flag: 0x05 });
  });
  return out;
}

function toB64(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
  return btoa(s);
}

// Median cut: örnek piksellerden 255 renklik palet (768 bayt)
function makePalette(samples) {
  // samples: Uint8Array [r,g,b,r,g,b...]
  const n = samples.length / 3;
  const idx = new Uint32Array(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  let boxes = [{ a: 0, b: n }];
  function range(bx) {
    let r0 = 255, r1 = 0, g0 = 255, g1 = 0, b0 = 255, b1 = 0;
    for (let i = bx.a; i < bx.b; i++) {
      const p = idx[i] * 3, r = samples[p], g = samples[p + 1], b = samples[p + 2];
      if (r < r0) r0 = r; if (r > r1) r1 = r;
      if (g < g0) g0 = g; if (g > g1) g1 = g;
      if (b < b0) b0 = b; if (b > b1) b1 = b;
    }
    const dr = r1 - r0, dg = g1 - g0, db = b1 - b0;
    bx.ch = dr >= dg && dr >= db ? 0 : dg >= db ? 1 : 2;
    bx.sz = (bx.b - bx.a) * Math.max(dr, dg, db);
  }
  range(boxes[0]);
  while (boxes.length < 255) {
    let bi = -1, best = 0;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].b - boxes[i].a > 1 && boxes[i].sz > best) { best = boxes[i].sz; bi = i; }
    }
    if (bi < 0) break;
    const bx = boxes[bi], ch = bx.ch;
    const part = Array.prototype.slice.call(idx.subarray(bx.a, bx.b));
    part.sort((x, y) => samples[x * 3 + ch] - samples[y * 3 + ch]);
    for (let i = 0; i < part.length; i++) idx[bx.a + i] = part[i];
    const mid = bx.a + ((bx.b - bx.a) >> 1);
    const nb = { a: mid, b: bx.b };
    bx.b = mid;
    range(bx); range(nb);
    boxes.push(nb);
  }
  const pal = new Uint8Array(768);
  boxes.forEach((bx, k) => {
    let r = 0, g = 0, b = 0;
    for (let i = bx.a; i < bx.b; i++) {
      const p = idx[i] * 3; r += samples[p]; g += samples[p + 1]; b += samples[p + 2];
    }
    const c = Math.max(1, bx.b - bx.a);
    pal[k * 3] = Math.round(r / c); pal[k * 3 + 1] = Math.round(g / c); pal[k * 3 + 2] = Math.round(b / c);
  });
  return { pal: pal, count: boxes.length };
}

// 15 bit renk -> en yakın palet sırası (tembel önbellek)
function makeLookup(pal, count) {
  const cache = new Int16Array(32768).fill(-1);
  return function (r, g, b) {
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let v = cache[key];
    if (v >= 0) return v;
    const rr = (r & 0xf8) | 4, gg = (g & 0xf8) | 4, bb = (b & 0xf8) | 4;
    let best = 0, bd = 1e9;
    for (let i = 0; i < count; i++) {
      const dr = pal[i * 3] - rr, dg = pal[i * 3 + 1] - gg, db = pal[i * 3 + 2] - bb;
      const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (d < bd) { bd = d; best = i; }
    }
    cache[key] = best;
    return best;
  };
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

async function gifFrames(file, maxDim, maxFrames) {
  const dec = new ImageDecoder({ data: await file.arrayBuffer(), type: "image/gif" });
  await dec.tracks.ready;
  const n = dec.tracks.selectedTrack.frameCount;
  if (n < 2) return null;
  const take = Math.min(n, maxFrames), list = [];
  for (let j = 0; j < take; j++) {
    const idx = Math.floor((j * n) / take);
    const r = await dec.decode({ frameIndex: idx });
    const im = r.image;
    const k = Math.min(1, maxDim / Math.max(im.displayWidth, im.displayHeight));
    const w = Math.max(1, Math.round(im.displayWidth * k)), h = Math.max(1, Math.round(im.displayHeight * k));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(im, 0, 0, w, h);
    const dur = im.duration ? im.duration / 10000 : 10; // 1/100 sn
    im.close();
    list.push({ c: c, w: w, h: h, d: Math.max(2, Math.round(dur * (n / take))) });
  }
  try { dec.close(); } catch (e) {}
  return list;
}

// Renkleri canlandırır: doygunluk +%30, hafif kontrast
function boost(d) {
  for (let p = 0; p < d.length; p += 4) {
    const r = d[p], g = d[p + 1], b = d[p + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    const v = [r, g, b];
    for (let c = 0; c < 3; c++) {
      let x = l + (v[c] - l) * 1.3;
      x = (x - 128) * 1.06 + 128;
      d[p + c] = x < 0 ? 0 : x > 255 ? 255 : x;
    }
  }
}

function gifBuild(list, dim, count) {
  const base = list[0];
  const k = Math.min(1, dim / Math.max(base.w, base.h));
  const w = Math.max(1, Math.round(base.w * k)), h = Math.max(1, Math.round(base.h * k));
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d", { willReadFrequently: true });
  const raws = [], delays = [];
  const smp = [];
  const step = Math.max(1, Math.floor((w * h * count) / 60000));
  let seen = 0;
  for (let j = 0; j < count; j++) {
    const a = Math.floor((j * list.length) / count);
    const b = Math.floor(((j + 1) * list.length) / count);
    let delay = 0;
    for (let i = a; i < Math.max(b, a + 1); i++) delay += list[i].d;
    g.clearRect(0, 0, w, h);
    g.drawImage(list[a].c, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    boost(d);
    raws.push(d); delays.push(delay);
    for (let p = 0; p < d.length; p += 4) {
      if (d[p + 3] < 128) continue;
      if (seen++ % step === 0) smp.push(d[p], d[p + 1], d[p + 2]);
    }
  }
  const mp = makePalette(new Uint8Array(smp.length ? smp : [0, 0, 0]));
  const pal = mp.pal, near = makeLookup(pal, mp.count);
  const frames = raws.map((d, j) => {
    const px = new Uint8Array(w * h);
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
      const p = i * 4;
      if (d[p + 3] < 128) { px[i] = 255; continue; }
      const t = (BAYER[(y & 3) * 4 + (x & 3)] - 7.5) * 0.6;
      const cl = (v) => v + t < 0 ? 0 : v + t > 255 ? 255 : (v + t) | 0;
      px[i] = near(cl(d[p]), cl(d[p + 1]), cl(d[p + 2]));
    }
    return { px: px, delay: Math.min(500, Math.max(2, delays[j])) };
  });
  let hasAlpha = false;
  for (let j = 0; j < frames.length && !hasAlpha; j++) if (frames[j].px.indexOf(255) >= 0) hasAlpha = true;
  if (hasAlpha) {
    return gifBytes(frames.map((f) => ({ px: f.px, x: 0, y: 0, w: w, h: h, delay: f.delay, flag: 0x09 })), w, h, pal);
  }
  const fullB = gifBytes(frames.map((f) => ({ px: f.px, x: 0, y: 0, w: w, h: h, delay: f.delay, flag: 0x04 })), w, h, pal);
  const deltaB = gifBytes(deltaFrames(frames, w, h, pal), w, h, pal);
  return deltaB.length < fullB.length ? deltaB : fullB;
}

// Sığmazsa "big", desteklenmiyorsa null
export async function shrinkGif(file, limitChars) {
  if (typeof ImageDecoder === "undefined") return null;
  const list = await gifFrames(file, 360, 60);
  if (!list) return null;
  const tries = [[360, 60], [360, 45], [320, 45], [320, 36], [280, 36], [240, 30], [200, 26], [170, 20], [140, 14], [110, 10], [90, 7]];
  for (let i = 0; i < tries.length; i++) {
    const cnt = Math.min(tries[i][1], list.length);
    const d = "data:image/gif;base64," + toB64(gifBuild(list, tries[i][0], cnt));
    if (d.length <= limitChars) return d;
  }
  return "big";
                       }
