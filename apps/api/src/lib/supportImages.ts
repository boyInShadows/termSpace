import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export const supportImageDirectory = fileURLToPath(new URL("../../private/support/", import.meta.url));
export const SUPPORT_IMAGE_BYTES = 5 * 1024 * 1024;
const formats: Record<string, string> = { "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp" };
export const supportImageKeyPattern = /^[0-9a-f-]{36}\.webp$/;
export class SupportImageError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}

export async function encodeSupportImage(file: Pick<Express.Multer.File, "buffer" | "mimetype" | "size">) {
  if (!formats[file.mimetype]) throw new SupportImageError("INVALID_IMAGE", "Choose a PNG, JPEG or WebP screenshot");
  if (file.size > SUPPORT_IMAGE_BYTES) throw new SupportImageError("FILE_TOO_LARGE", "Each screenshot must be at most 5 MB", 413);
  try {
    const image = sharp(file.buffer, { limitInputPixels: 16_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (metadata.format !== formats[file.mimetype] || (metadata.pages ?? 1) > 1) throw new Error("Unsupported image content");
    const { data, info } = await image.rotate().resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
    if (data.length > SUPPORT_IMAGE_BYTES) throw new Error("Encoded image too large");
    return { buffer: data, bytes: data.length, width: info.width, height: info.height };
  } catch {
    throw new SupportImageError("INVALID_IMAGE", "This screenshot could not be read. Choose a still PNG, JPEG or WebP image under 16 million pixels.");
  }
}

function imagePath(key: string) {
  if (!supportImageKeyPattern.test(key)) throw new Error("Invalid private screenshot key");
  return path.join(supportImageDirectory, key);
}

export async function removeSupportImages(keys: string[]) {
  const results = await Promise.allSettled(keys.map(async key => {
    try { await unlink(imagePath(key)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }));
  const failed = results.find(result => result.status === "rejected");
  if (failed?.status === "rejected") throw failed.reason;
}

export function readSupportImage(key: string) { return readFile(imagePath(key)); }

export async function prepareSupportImages(files: Express.Multer.File[] = []) {
  if (files.length > 3 || files.reduce((total, file) => total + file.size, 0) > 10 * 1024 * 1024) {
    throw new SupportImageError("SCREENSHOTS_TOO_LARGE", "Use at most 3 screenshots and 10 MB combined", 413);
  }
  const images: { storageKey: string; bytes: number; width: number; height: number }[] = [];
  try {
    for (const file of files) {
      const { buffer, ...metadata } = await encodeSupportImage(file);
      const storageKey = `${randomUUID()}.webp`;
      await mkdir(supportImageDirectory, { recursive: true, mode: 0o700 });
      const handle = await open(imagePath(storageKey), "wx", 0o600);
      images.push({ storageKey, ...metadata });
      try { await handle.writeFile(buffer); }
      finally { await handle.close(); }
    }
    return images;
  } catch (error) { await removeSupportImages(images.map(image => image.storageKey)); throw error; }
}
