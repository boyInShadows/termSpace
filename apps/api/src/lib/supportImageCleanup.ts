import { readdir, stat, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { prisma } from "./prisma.js";

const directory = new URL("../../private/support/", import.meta.url);
const imageKey = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export async function removeSupportImages(keys: string[]) {
  for (const key of new Set(keys)) {
    if (!imageKey.test(key)) throw new Error("Invalid retained support image key");
    try { await unlink(new URL(key, directory)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
}

/** Retry post-commit erasure without storing private conversation content in a queue. */
export async function cleanupUnreferencedSupportImages() {
  const keys = await readdir(directory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  let removed = 0;
  for (const key of keys.filter(key => imageKey.test(key))) {
    const file = await stat(fileURLToPath(new URL(key, directory)));
    if (file.mtimeMs > Date.now() - 3_600_000 || await prisma.supportAttachment.count({ where: { storageKey: key } })) continue;
    await removeSupportImages([key]);
    removed += 1;
  }
  return removed;
}
