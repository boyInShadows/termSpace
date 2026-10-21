import { beforeEach, expect, it, vi } from "vitest";

const request = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ request }));

const { transitionCreatorListing } = await import("./creator-api");

beforeEach(() => request.mockReset());

it("submits the current lifecycle version for moderation", async () => {
  request.mockResolvedValue({ data: { state: "submitted", version: 4, published: false } });

  await expect(transitionCreatorListing("listing/1", 3, "SUBMIT")).resolves.toEqual({ state: "submitted", version: 4, published: false });
  expect(request).toHaveBeenCalledWith(
    "/api/marketplace/creator/products/listing%2F1/lifecycle",
    { method: "POST", body: JSON.stringify({ action: "SUBMIT", expectedVersion: 3 }) },
  );
});

it("withdraws using the current lifecycle version and returns API failures", async () => {
  request.mockResolvedValueOnce({ data: { state: "draft", version: 5, published: true } });
  await expect(transitionCreatorListing("listing/1", 4, "WITHDRAW")).resolves.toEqual({ state: "draft", version: 5, published: true });
  expect(request).toHaveBeenLastCalledWith(
    "/api/marketplace/creator/products/listing%2F1/lifecycle",
    { method: "POST", body: JSON.stringify({ action: "WITHDRAW", expectedVersion: 4 }) },
  );
  const conflict = new Error("Version conflict");
  request.mockRejectedValueOnce(conflict);
  await expect(transitionCreatorListing("listing/1", 4, "WITHDRAW")).rejects.toBe(conflict);
});

it.each(["ARCHIVE", "RESTORE"] as const)("sends %s with the expected version and returns visibility", async (action) => {
  const data = { state: action === "ARCHIVE" ? "archived" : "published", version: 5, published: action === "RESTORE" };
  request.mockResolvedValue({ data });
  await expect(transitionCreatorListing("listing-1", 4, action)).resolves.toEqual(data);
  expect(request).toHaveBeenLastCalledWith("/api/marketplace/creator/products/listing-1/lifecycle", {
    method: "POST", body: JSON.stringify({ action, expectedVersion: 4 }),
  });
});
