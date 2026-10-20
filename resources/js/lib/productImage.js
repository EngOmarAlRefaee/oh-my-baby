// Product image normalisation.
//
// Every product photo is cut out from its own (random) background and placed
// on ONE unified system background, centred in a fixed 4:5 frame. The cut-out
// works best for photos with a plain/near-plain background (studio shots,
// white/colored walls, soft gradients). When the background is busy or has the
// same colour as the product, we do NOT guess: the image is only centred on the
// unified background (nothing is lost) and `removed` is reported as false.

export const PRODUCT_IMAGE_BG = "#f7f2ea";
export const PRODUCT_IMAGE_SIZE = { width: 1080, height: 1350 };

const dist = (r1, g1, b1, r2, g2, b2) => {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

/**
 * Pure function (no DOM): finds the background connected to the image border.
 * @param {Uint8ClampedArray} data RGBA pixels
 * @returns {{ok:boolean, reason?:string, alpha?:Uint8ClampedArray, bbox?:object, fgFraction?:number}}
 */
export function computeBackgroundMask(data, width, height, options = {}) {
  const tolerance = options.tolerance ?? 36;
  const chainTolerance = options.chainTolerance ?? 70;
  const stepTolerance = options.stepTolerance ?? 9;
  const total = width * height;

  // 1) Already transparent along the border -> trust the existing alpha.
  let transparentBorder = 0;
  let borderCount = 0;
  const ring = Math.max(1, Math.round(Math.min(width, height) * 0.004));
  const isBorder = (x, y) => x < ring || y < ring || x >= width - ring || y >= height - ring;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isBorder(x, y)) continue;
      borderCount += 1;
      if (data[(y * width + x) * 4 + 3] < 200) transparentBorder += 1;
    }
  }
  if (transparentBorder / borderCount > 0.6) {
    return buildResult(data, width, height, (i) => data[i * 4 + 3] >= 20, true);
  }

  // 2) Dominant border colours (up to 4 clusters).
  const buckets = new Map();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isBorder(x, y)) continue;
      const i = (y * width + x) * 4;
      const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
      const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
      b.n += 1;
      b.r += data[i];
      b.g += data[i + 1];
      b.b += data[i + 2];
      buckets.set(key, b);
    }
  }
  const clusters = [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
    .filter((c) => c.n / borderCount >= 0.06)
    .map((c) => ({ r: c.r / c.n, g: c.g / c.n, b: c.b / c.n, n: c.n }));
  const covered = clusters.reduce((sum, c) => sum + c.n, 0) / borderCount;
  if (!clusters.length || covered < 0.55) return { ok: false, reason: "busy-background" };

  const nearest = (i) => {
    let best = Infinity;
    for (const c of clusters) {
      const d = dist(data[i], data[i + 1], data[i + 2], c.r, c.g, c.b);
      if (d < best) best = d;
    }
    return best;
  };

  // 3) Flood fill from the border through background-like pixels.
  const isBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isBorder(x, y)) continue;
      const p = y * width + x;
      if (nearest(p * 4) < tolerance) {
        isBg[p] = 1;
        queue[tail++] = p;
      }
    }
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const y = (p - x) / width;
    const pi = p * 4;
    for (let k = 0; k < 4; k += 1) {
      const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0);
      const ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const q = ny * width + nx;
      if (isBg[q]) continue;
      const qi = q * 4;
      const d = nearest(qi);
      const step = dist(data[pi], data[pi + 1], data[pi + 2], data[qi], data[qi + 1], data[qi + 2]);
      if (d < tolerance || (d < chainTolerance && step < stepTolerance)) {
        isBg[q] = 1;
        queue[tail++] = q;
      }
    }
  }

  return buildResult(data, width, height, (i) => !isBg[i], false);
}

function buildResult(data, width, height, isForeground, alreadyTransparent) {
  const total = width * height;
  let fg = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const mask = new Uint8Array(total);
  for (let p = 0; p < total; p += 1) {
    if (isForeground(p)) {
      mask[p] = 1;
      fg += 1;
      const x = p % width;
      const y = (p - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const fgFraction = fg / total;
  // Nothing removed, or (almost) everything removed: do not trust the result.
  if (!alreadyTransparent && (fgFraction > 0.97 || fgFraction < 0.04)) {
    return { ok: false, reason: fgFraction > 0.97 ? "nothing-removed" : "product-lost", fgFraction };
  }
  if (fg === 0) return { ok: false, reason: "empty", fgFraction };

  // Soft 1px edge (3x3 box blur of the binary mask) to avoid jagged halos.
  const alpha = new Uint8ClampedArray(total);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          sum += mask[yy * width + xx];
          count += 1;
        }
      }
      alpha[y * width + x] = Math.round((sum / count) * 255);
    }
  }
  return { ok: true, alpha, fgFraction, bbox: { minX, minY, maxX, maxY } };
}

// ---------------------------------------------------------------------------
// Free, open-source background removal (U^2-Net "u2netp", Apache-2.0, 4.6 MB),
// run INSIDE the admin's browser through onnxruntime-web (MIT). No API, no key,
// no per-image cost: the model file is served from /models/u2netp.onnx.
// ---------------------------------------------------------------------------
export const SEGMENTER_MODEL_URL = "/models/u2netp.onnx";
export const SEGMENTER_SIZE = 320;
const ORT_VERSION = "1.20.1";
const ORT_WASM_CDN = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
const ORT_MODULE_URL = `${ORT_WASM_CDN}ort.min.mjs`;

/** Pure: RGBA (320x320) -> Float32 NCHW tensor data exactly like rembg/u2net. */
export function rgbaToU2netInput(rgba, size = SEGMENTER_SIZE) {
  const n = size * size;
  let max = 1e-6;
  for (let p = 0; p < n; p += 1) {
    const i = p * 4;
    if (rgba[i] > max) max = rgba[i];
    if (rgba[i + 1] > max) max = rgba[i + 1];
    if (rgba[i + 2] > max) max = rgba[i + 2];
  }
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const out = new Float32Array(3 * n);
  for (let p = 0; p < n; p += 1) {
    for (let c = 0; c < 3; c += 1) {
      out[c * n + p] = (rgba[p * 4 + c] / max - mean[c]) / std[c];
    }
  }
  return out;
}

/** Pure: raw model output -> 0..255 mask (min/max normalised, softened edges). */
export function u2netOutputToMask(raw) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] < min) min = raw[i];
    if (raw[i] > max) max = raw[i];
  }
  const range = max - min || 1;
  const mask = new Uint8ClampedArray(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    const v = (raw[i] - min) / range;
    // Slightly steeper than linear so the product edge is crisp, not ghosted.
    mask[i] = Math.round(Math.min(1, Math.max(0, (v - 0.25) / 0.5)) * 255);
  }
  return mask;
}

/** Pure: alpha (w*h) -> {ok, fgFraction, bbox} with sanity limits. */
export function summarizeAlpha(alpha, width, height) {
  const total = width * height;
  let fg = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let p = 0; p < total; p += 1) {
    if (alpha[p] >= 128) {
      fg += 1;
      const x = p % width;
      const y = (p - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const fgFraction = fg / total;
  if (fgFraction < 0.03 || fgFraction > 0.98) return { ok: false, reason: "implausible-mask", fgFraction };
  return { ok: true, alpha, fgFraction, bbox: { minX, minY, maxX, maxY } };
}

let segmenterPromise = null;
async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      // Loaded at runtime from the CDN (documented ORT ES-module build), so the
      // site does not depend on an npm package and a missing/blocked CDN can never
      // break the build or the storefront: the colour-based fallback takes over.
      const ort = await import(/* @vite-ignore */ ORT_MODULE_URL);
      ort.env.wasm.wasmPaths = ORT_WASM_CDN;
      ort.env.wasm.numThreads = 1; // no SharedArrayBuffer / special headers needed
      const session = await ort.InferenceSession.create(SEGMENTER_MODEL_URL, { executionProviders: ["wasm"] });
      return { ort, session };
    })().catch((error) => {
      segmenterPromise = null; // allow a retry on the next upload
      throw error;
    });
  }
  return segmenterPromise;
}

async function segmentWithModel(work, w, h) {
  const { ort, session } = await getSegmenter();
  const S = SEGMENTER_SIZE;
  const small = document.createElement("canvas");
  small.width = S;
  small.height = S;
  const sctx = small.getContext("2d", { willReadFrequently: true });
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(work, 0, 0, S, S);
  const input = rgbaToU2netInput(sctx.getImageData(0, 0, S, S).data, S);
  const feeds = { [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, S, S]) };
  const results = await session.run(feeds);
  const raw = results[session.outputNames[0]].data;
  const mask = u2netOutputToMask(raw);

  // Upscale the 320x320 mask to the working size with smooth interpolation.
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = S;
  maskCanvas.height = S;
  const mctx = maskCanvas.getContext("2d");
  const maskImage = mctx.createImageData(S, S);
  for (let p = 0; p < S * S; p += 1) {
    maskImage.data[p * 4] = mask[p];
    maskImage.data[p * 4 + 1] = mask[p];
    maskImage.data[p * 4 + 2] = mask[p];
    maskImage.data[p * 4 + 3] = 255;
  }
  mctx.putImageData(maskImage, 0, 0);
  const big = document.createElement("canvas");
  big.width = w;
  big.height = h;
  const bctx = big.getContext("2d", { willReadFrequently: true });
  bctx.imageSmoothingQuality = "high";
  bctx.drawImage(maskCanvas, 0, 0, w, h);
  const bigData = bctx.getImageData(0, 0, w, h).data;
  const alpha = new Uint8ClampedArray(w * h);
  for (let p = 0; p < w * h; p += 1) alpha[p] = bigData[p * 4];
  return summarizeAlpha(alpha, w, h);
}

/** Browser only: returns a JPEG data URL on the unified background. */
export async function unifyProductImage(source, { bg = PRODUCT_IMAGE_BG, size = PRODUCT_IMAGE_SIZE, removeBackground = true } = {}) {
  const img = await loadImage(source);
  const { width: W, height: H } = size;

  // Work at a bounded resolution so large phone photos stay fast.
  const maxSide = 2400;
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * k));
  const h = Math.max(1, Math.round(img.height * k));
  const work = document.createElement("canvas");
  work.width = w;
  work.height = h;
  const wctx = work.getContext("2d", { willReadFrequently: true });
  wctx.drawImage(img, 0, 0, w, h);

  let crop = { x: 0, y: 0, w, h };
  let cutout = work;
  let removed = false;
  let method = "none";
  if (removeBackground) {
    let result = null;
    // 1) Free AI model (works on busy/real-life backgrounds).
    try {
      result = await segmentWithModel(work, w, h);
      if (result.ok) method = "model";
    } catch {
      result = null; // model/runtime not available -> fall back silently
    }
    // 2) Colour-based fallback (plain backgrounds), no model needed.
    if (!result?.ok) {
      const probe = wctx.getImageData(0, 0, w, h);
      const colour = computeBackgroundMask(probe.data, w, h);
      if (colour.ok) {
        result = colour;
        method = "colour";
      }
    }
    if (result?.ok) {
      const imageData = wctx.getImageData(0, 0, w, h);
      const px = imageData.data;
      for (let p = 0; p < w * h; p += 1) {
        // Crisper edges: smoothstep on the mask removes the soft halo of the upscaled model mask.
        const t = Math.min(1, Math.max(0, (result.alpha[p] - 70) / 120));
        const a = Math.round(255 * t * t * (3 - 2 * t));
        px[p * 4 + 3] = Math.min(px[p * 4 + 3], a);
      }
      const cut = document.createElement("canvas");
      cut.width = w;
      cut.height = h;
      cut.getContext("2d").putImageData(imageData, 0, 0);
      cutout = cut;
      const pad = Math.round(Math.max(w, h) * 0.02);
      const { minX, minY, maxX, maxY } = result.bbox;
      const x = Math.max(0, minX - pad);
      const y = Math.max(0, minY - pad);
      crop = { x, y, w: Math.min(w, maxX + pad + 1) - x, h: Math.min(h, maxY + pad + 1) - y };
      removed = true;
    }
  }

  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Cut-out products get a consistent margin; untouched photos fill the frame.
  const fill = removed ? 0.88 : 1;
  // Never blow a small photo up more than 1.5x (that would look blurry).
  const scale = Math.min((W * fill) / crop.w, (H * fill) / crop.h, 1.5);
  const dw = crop.w * scale;
  const dh = crop.h * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // Step-down resize (halving) keeps fine detail much better than one big jump.
  let src = cutout;
  let sx = crop.x, sy = crop.y, sw = crop.w, sh = crop.h;
  while (sw / 2 > dw && sh / 2 > dh) {
    const half = document.createElement("canvas");
    half.width = Math.ceil(sw / 2);
    half.height = Math.ceil(sh / 2);
    const hctx = half.getContext("2d");
    hctx.imageSmoothingQuality = "high";
    hctx.drawImage(src, sx, sy, sw, sh, 0, 0, half.width, half.height);
    src = half; sx = 0; sy = 0; sw = half.width; sh = half.height;
  }
  ctx.drawImage(src, sx, sy, sw, sh, (W - dw) / 2, (H - dh) / 2, dw, dh);
  sharpenCanvas(out, 0.35);
  return { dataUrl: out.toDataURL("image/jpeg", 0.92), removed, method };
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = source;
  });
}

// Light unsharp-style sharpening (amount 0..1) to restore detail lost by resizing.
function sharpenCanvas(canvas, amount) {
  try {
    const { width: w, height: h } = canvas;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const img = ctx.getImageData(0, 0, w, h);
    const src = img.data;
    const copy = new Uint8ClampedArray(src);
    const k = amount;
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c += 1) {
          const v = copy[i + c] * (1 + 4 * k) - k * (copy[i + c - 4] + copy[i + c + 4] + copy[i + c - w * 4] + copy[i + c + w * 4]);
          src[i + c] = v;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  } catch { /* sharpening is optional */ }
}
