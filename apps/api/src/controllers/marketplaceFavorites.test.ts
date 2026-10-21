import type { Request, Response } from "express";
import { expect, it, vi } from "vitest";

const remove = vi.hoisted(() => vi.fn().mockResolvedValue({ count: 1 }));
vi.mock("../lib/prisma.js", () => ({ prisma: { marketplaceFavorite: { deleteMany: remove } } }));
import { removeMarketplaceFavorite } from "./marketplaceController.js";

it("removes only the current reader's saved record even when its listing is unavailable", async () => {
  const response = { locals: { reader: { id: "reader-1" } }, status: vi.fn().mockReturnThis(), send: vi.fn() };
  await removeMarketplaceFavorite({ params: { slug: "hidden-item" } } as unknown as Request, response as unknown as Response);
  expect(remove).toHaveBeenCalledWith({ where: { userId: "reader-1", product: { slug: "hidden-item" } } });
  expect(response.status).toHaveBeenCalledWith(204);
});
