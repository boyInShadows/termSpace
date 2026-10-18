import { beforeEach, expect, it, vi } from "vitest";

const request = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ request }));

const { transitionCreatorListing } = await import("./creator-api");

beforeEach(() => request.mockReset());

it("submits the current lifecycle version for moderation", async () => {
  request.mockResolvedValue({ data: { state: "submitted", version: 4 } });

  await expect(transitionCreatorListing("listing/1", 3)).resolves.toEqual({ state: "submitted", version: 4 });
  expect(request).toHaveBeenCalledWith(
    "/api/marketplace/creator/products/listing%2F1/lifecycle",
    { method: "POST", body: JSON.stringify({ action: "SUBMIT", expectedVersion: 3 }) },
  );
});
