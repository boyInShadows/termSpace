import { beforeEach, describe, expect, it, vi } from "vitest";
const files = vi.hoisted(() => ({ readdir: vi.fn(), stat: vi.fn(), unlink: vi.fn(), count: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readdir: files.readdir, stat: files.stat, unlink: files.unlink }));
vi.mock("../lib/prisma.js", () => ({ prisma: { supportAttachment: { count: files.count } } }));
import { cleanupUnreferencedSupportImages, removeSupportImages } from "../lib/supportImageCleanup.js";
const key = "12345678-1234-1234-1234-123456789abc.webp";
describe("retained private image erasure", () => {
  beforeEach(() => { vi.clearAllMocks(); files.unlink.mockResolvedValue(undefined); });
  it("does not allow a retained key to escape its private directory", async () => {
    await expect(removeSupportImages(["../private.webp"])).rejects.toThrow("Invalid retained");
    expect(files.unlink).not.toHaveBeenCalled();
  });
  it("retries old orphan files, leaving referenced images and recent writes alone", async () => {
    files.readdir.mockResolvedValue([key, "unrelated.txt"]);
    files.stat.mockResolvedValue({ mtimeMs: Date.now() - 7_200_000 }); files.count.mockResolvedValue(1);
    expect(await cleanupUnreferencedSupportImages()).toBe(0);
    files.count.mockResolvedValue(0); expect(await cleanupUnreferencedSupportImages()).toBe(1);
    files.stat.mockResolvedValue({ mtimeMs: Date.now() }); expect(await cleanupUnreferencedSupportImages()).toBe(0);
    expect(files.unlink).toHaveBeenCalledTimes(1);
  });
  it("treats missing files as erased and exposes real disk failures for retry", async () => {
    files.unlink.mockRejectedValueOnce({ code: "ENOENT" }); await removeSupportImages([key]);
    files.unlink.mockRejectedValueOnce({ code: "EPERM" }); await expect(removeSupportImages([key])).rejects.toMatchObject({ code: "EPERM" });
  });
});
