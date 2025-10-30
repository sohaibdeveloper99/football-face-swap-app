// Simple client-side image normalization utilities for mobile uploads

const HEIC_TYPES = new Set(["image/heic", "image/heif"]);

export function isHeicFile(file) {
  const type = (file && file.type) ? file.type.toLowerCase() : "";
  return HEIC_TYPES.has(type) || /\.(heic|heif)$/i.test(file?.name || "");
}

// Downscale and convert to JPEG if the image is very large
export async function downscaleIfNeeded(file, options = {}) {
  const maxDimension = options.maxDimension || 2000; // px
  const quality = options.quality || 0.9; // 0..1

  // Only attempt to process browser-decodable images
  if (!file || !file.type || !file.type.startsWith("image/")) return file;
  if (isHeicFile(file)) return file; // We don't decode HEIC here

  // Fast path: small file size
  if (file.size <= (options.maxBytes || 8 * 1024 * 1024)) {
    // Still check dimensions to avoid huge dimension images with good compression
    try {
      const img = await loadImageFromFile(file);
      const needsResize = img.width > maxDimension || img.height > maxDimension;
      if (!needsResize) return file;
      const resized = await resizeToJpeg(img, { maxDimension, quality });
      return toFile(resized, file.name.replace(/\.[^.]+$/, "") + ".jpg", "image/jpeg");
    } catch {
      return file;
    }
  }

  // Large file: try to downscale
  try {
    const img = await loadImageFromFile(file);
    const resized = await resizeToJpeg(img, { maxDimension, quality });
    return toFile(resized, file.name.replace(/\.[^.]+$/, "") + ".jpg", "image/jpeg");
  } catch {
    return file;
  }
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function resizeToJpeg(img, { maxDimension, quality }) {
  return new Promise((resolve, reject) => {
    const { width, height } = getFitSize(img.width, img.height, maxDimension);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Failed to create JPEG blob"));
      resolve(blob);
    }, "image/jpeg", quality);
  });
}

function getFitSize(w, h, max) {
  if (w <= max && h <= max) return { width: w, height: h };
  const scale = w > h ? max / w : max / h;
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

function toFile(blob, name, type) {
  return new File([blob], name, { type: type || blob.type });
}

// Main normalization: reject HEIC early, then downscale large images
export async function normalizeImageFile(file, opts = {}) {
  if (!file) return file;
  if (isHeicFile(file)) {
    // We currently do not decode HEIC in-browser; prompt for JPEG/PNG instead
    const error = new Error("HEIC/HEIF images are not supported. Please upload a JPG or PNG.");
    error.code = "UNSUPPORTED_HEIC";
    throw error;
  }
  return await downscaleIfNeeded(file, opts);
}


