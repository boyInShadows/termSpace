import { mkdir, mkdtemp, readdir, rm, utimes, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ supportAttachment: { findMany: vi.fn() } }));
vi.mock("../lib/prisma.js", () => ({ prisma: db }));
import { cleanupSupportImages } from "../lib/supportImageCleanup.js";

const privateRoot = path.resolve("private");
let directory: string;
beforeEach(async () => {
  await mkdir(privateRoot, { recursive: true });
  directory = await mkdtemp(path.join(privateRoot, "cleanup-test-"));
});
afterEach(async () => {
  if (!path.resolve(directory).startsWith(`${privateRoot}${path.sep}cleanup-test-`)) throw new Error("Unsafe test cleanup path");
  await rm(directory, { recursive: true, force: true });
});

it("removes only old unreferenced private images, retaining fresh, referenced and unrelated entries", async () => {
  const orphan = "11111111-1111-4111-8111-111111111111.webp";
  const referenced = "22222222-2222-4222-8222-222222222222.webp";
  const fresh = "33333333-3333-4333-8333-333333333333.webp";
  const old = new Date(Date.now() - 25 * 60 * 60 * 1000);
  for (const name of [orphan, referenced, fresh, "keep.txt"]) await writeFile(path.join(directory, name), "synthetic");
  for (const name of [orphan, referenced, "keep.txt"]) await utimes(path.join(directory, name), old, old);
  db.supportAttachment.findMany.mockResolvedValue([{ storageKey: referenced }]);
  expect(await cleanupSupportImages(directory)).toBe(1);
  expect((await readdir(directory)).sort()).toEqual([referenced, fresh, "keep.txt"].sort());
});

it("keeps files when the reference database cannot be checked", async () => {
  const name = "44444444-4444-4444-8444-444444444444.webp";
  await writeFile(path.join(directory, name), "synthetic");
  const old = new Date(Date.now() - 25 * 60 * 60 * 1000);
  await utimes(path.join(directory, name), old, old);
  db.supportAttachment.findMany.mockRejectedValueOnce(new Error("Database unavailable"));
  await expect(cleanupSupportImages(directory)).rejects.toThrow("Database unavailable");
  expect(await readdir(directory)).toEqual([name]);
});
