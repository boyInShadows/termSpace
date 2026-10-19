import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { savedCopy } from "./saved-copy";

const mocks = vi.hoisted(() => ({ favorites: vi.fn(), product: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), getFavorites: mocks.favorites, getProduct: mocks.product }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => ({ removeFavorite: mocks.remove }) }));
const { ApiError } = await import("@/lib/api");
const { SavedListings } = await import("./saved-listings");

describe("Saved listings", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.remove.mockResolvedValue(undefined); mocks.product.mockImplementation(async (slug) => ({ name: slug, outcome: "Public summary" })); });

  it("bounds detail reads to a page and removes a saved listing", async () => {
    mocks.favorites.mockResolvedValue(Array.from({ length: 13 }, (_, index) => `item-${index}`));
    render(<SavedListings />);
    expect(await screen.findByRole("heading", { name: "item-0" })).toBeVisible();
    expect(mocks.product).toHaveBeenCalledTimes(12);
    expect(mocks.product).not.toHaveBeenCalledWith("item-12", expect.anything());
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("heading", { name: "item-12" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: savedCopy.en.remove }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("item-12"));
    expect(await screen.findByRole("heading", { name: "item-0" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("isolates hidden items and transient errors while retaining public results", async () => {
    mocks.favorites.mockResolvedValue(["public", "private", "offline"]);
    mocks.product.mockImplementation(async (slug) => {
      if (slug === "private") throw new ApiError(404, "NOT_FOUND", "Private data must not render");
      if (slug === "offline") throw new Error("offline");
      return { name: slug, outcome: "Public summary" };
    });
    render(<SavedListings />);
    expect(await screen.findByRole("heading", { name: "public" })).toBeVisible();
    expect(screen.getByText(savedCopy.en.unavailable)).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(savedCopy.en.itemError);
    expect(screen.queryByText("Private data must not render")).not.toBeInTheDocument();
    mocks.product.mockResolvedValue({ name: "Recovered", outcome: "Public summary" });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findAllByRole("heading", { name: "Recovered" })).toHaveLength(3);
  });

  it("retries a failed collection and shows the real empty state", async () => {
    mocks.favorites.mockRejectedValueOnce(new Error("offline")).mockResolvedValue([]);
    render(<SavedListings />);
    expect(screen.getByRole("status")).toHaveTextContent(savedCopy.en.loading);
    expect(await screen.findByRole("alert")).toHaveTextContent(savedCopy.en.error);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText(savedCopy.en.empty)).toBeVisible();
    expect(mocks.product).not.toHaveBeenCalled();
  });

  it("keeps a saved item when removal fails", async () => {
    mocks.favorites.mockResolvedValue(["keep"]); mocks.remove.mockRejectedValueOnce(new Error("offline"));
    render(<SavedListings />);
    await screen.findByRole("heading", { name: "keep" });
    fireEvent.click(screen.getByRole("button", { name: savedCopy.en.remove }));
    expect(await screen.findByRole("alert")).toHaveTextContent(savedCopy.en.removeError);
    expect(screen.getByRole("heading", { name: "keep" })).toBeVisible();
  });

  it("returns to the last available page when retry finds the collection shrank elsewhere", async () => {
    mocks.favorites.mockResolvedValueOnce(Array.from({ length: 13 }, (_, index) => `item-${index}`)).mockResolvedValue(["remaining"]);
    mocks.product.mockImplementation(async (slug) => {
      if (slug === "item-12") throw new Error("offline");
      return { name: slug, outcome: "Public summary" };
    });
    render(<SavedListings />);
    await screen.findByRole("heading", { name: "item-0" });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "remaining" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });
});
