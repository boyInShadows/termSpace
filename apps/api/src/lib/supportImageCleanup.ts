import { opendir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma.js";
import { supportImageDirectory, supportImageKeyPattern } from "./supportImages.js";

export async function cleanupSupportImages(directory = supportImageDirectory) {
  let entries;
  try { entries = await opendir(directory); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0; throw error; }
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let removed = 0;
  let candidates: string[] = [];
  async function removeUnreferenced() {
    const rows = await prisma.supportAttachment.findMany({ where: { storageKey: { in: candidates } }, select: { storageKey: true } });
    const referenced = new Set(rows.map(row => row.storageKey));
    for (const key of candidates) {
      if (referenced.has(key)) continue;
      try { await unlink(path.join(directory, key)); removed++; }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    candidates = [];
  }
  for await (const entry of entries) {
    if (!entry.isFile() || !supportImageKeyPattern.test(entry.name)) continue;
    try {
      if ((await stat(path.join(directory, entry.name))).mtimeMs >= cutoff) continue;
    } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error; }
    candidates.push(entry.name);
    if (candidates.length === 100) await removeUnreferenced();
  }
  if (candidates.length) await removeUnreferenced();
  return removed;
}
