import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { encodeSupportImage, prepareSupportImages, readSupportImage, removeSupportImages, SUPPORT_IMAGE_BYTES } from "../lib/supportImages.js";

describe("private screenshot validation", () => {
  it("writes and reads a validated private image", async () => {
    const buffer = await sharp({ create: { width: 8, height: 8, channels: 3, background: "blue" } }).png().toBuffer();
    const images = await prepareSupportImages([{ buffer, size: buffer.length, mimetype: "image/png" } as Express.Multer.File]);
    try {
      const stored = await readSupportImage(images[0]!.storageKey);
      expect((await sharp(stored).metadata()).format).toBe("webp");
    } finally { await removeSupportImages(images.map(image => image.storageKey)); }
  });
  it("decodes/re-encodes a screenshot as WebP and strips metadata", async () => {
    const buffer = await sharp({ create: { width: 48, height: 32, channels: 3, background: "blue" } }).png().withMetadata().toBuffer();
    const result = await encodeSupportImage({ buffer, mimetype: "image/png", size: buffer.length });
    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
    expect(result.width).toBe(48);
    expect(result.height).toBe(32);
  });
  it("rejects corrupt, disguised and unsupported content", async () => {
    await expect(encodeSupportImage({ buffer: Buffer.from("not an image"), mimetype: "image/png", size: 12 })).rejects.toMatchObject({ code: "INVALID_IMAGE" });
    const buffer = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).png().toBuffer();
    await expect(encodeSupportImage({ buffer, mimetype: "image/jpeg", size: buffer.length })).rejects.toMatchObject({ code: "INVALID_IMAGE" });
    await expect(encodeSupportImage({ buffer, mimetype: "image/svg+xml", size: buffer.length })).rejects.toMatchObject({ code: "INVALID_IMAGE" });
  });
  it("enforces per-file and aggregate limits before writing files", async () => {
    const file = { buffer: Buffer.alloc(0), mimetype: "image/png", size: SUPPORT_IMAGE_BYTES + 1 } as Express.Multer.File;
    await expect(encodeSupportImage(file)).rejects.toMatchObject({ status: 413 });
    await expect(prepareSupportImages([file, file])).rejects.toMatchObject({ status: 413 });
    await expect(prepareSupportImages([file, file, file, file])).rejects.toMatchObject({ status: 413 });
  });
  it("refuses storage paths supplied as keys", () => {
    expect(() => readSupportImage("../../uploads/article.webp")).toThrow("Invalid private screenshot key");
  });
});
