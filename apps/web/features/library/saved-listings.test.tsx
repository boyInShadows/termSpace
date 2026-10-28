import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { savedCopy } from "./saved-copy";

const mocks = vi.hoisted(() => ({ favorites: vi.fn(), products: vi.fn(), remove: vi.fn(), loading: false }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), getFavorites: mocks.favorites }));
vi.mock("@/lib/account-api", () => ({ getProductsBySlugs: mocks.products }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => ({ loading: mocks.loading, removeFavorite: mocks.remove }) }));
const { SavedListings } = await import("./saved-listings");

const published = (slugs: string[]) => slugs.map((slug) => ({ slug, name: slug, outcome: "Public summary" }));

describe("Saved listings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loading = false;
    mocks.remove.mockResolvedValue(undefined);
    mocks.products.mockImplementation(async (slugs: string[]) => published(slugs));
  });

  it("waits for the session snapshot before reading or removing saved items, including refresh", async () => {
    mocks.loading = true;
    mocks.favorites.mockResolvedValue(["saved"]);
    const { rerender } = render(<SavedListings />);
    expect(screen.getByRole("status")).toHaveTextContent(savedCopy.en.loading);
    expect(mocks.favorites).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: savedCopy.en.remove })).not.toBeInTheDocument();
    mocks.loading = false;
    rerender(<SavedListings />);
    expect(await screen.findByRole("heading", { name: "saved" })).toBeVisible();
    mocks.loading = true;
    rerender(<SavedListings />);
    expect(screen.queryByRole("button", { name: savedCopy.en.remove })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(savedCopy.en.loading);
  });

  it("resolves a page of saved listings in one request and removes a saved listing", async () => {
    const slugs = Array.from({ length: 13 }, (_, index) => `item-${index}`);
    mocks.favorites.mockResolvedValue(slugs);
    render(<SavedListings />);
    expect(await screen.findByRole("heading", { name: "item-0" })).toBeVisible();
    expect(mocks.products).toHaveBeenCalledOnce();
    expect(mocks.products).toHaveBeenCalledWith(slugs.slice(0, 12), expect.any(AbortSignal));
    expect(screen.queryByRole("heading", { name: "item-12" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("heading", { name: "item-12" })).toBeVisible();
    expect(mocks.products).toHaveBeenLastCalledWith(["item-12"], expect.any(AbortSignal));
    fireEvent.click(screen.getByRole("button", { name: savedCopy.en.remove }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("item-12"));
    expect(await screen.findByRole("heading", { name: "item-0" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("marks a listing that is no longer published as unavailable without rendering its data", async () => {
    mocks.favorites.mockResolvedValue(["public", "private"]);
    mocks.products.mockResolvedValue(published(["public"]));
    render(<SavedListings />);
    expect(await screen.findByRole("heading", { name: "public" })).toBeVisible();
    expect(screen.getByText(savedCopy.en.unavailable)).toBeVisible();
    expect(screen.queryByRole("heading", { name: "private" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: savedCopy.en.remove })).toHaveLength(2);
  });

  it("shows a retryable error when the page of listings cannot be loaded", async () => {
    mocks.favorites.mockResolvedValue(["one", "two"]);
    mocks.products.mockRejectedValueOnce(new Error("offline"));
    render(<SavedListings />);
    expect(await screen.findByRole("alert")).toHaveTextContent(savedCopy.en.error);
    expect(screen.queryByRole("heading", { name: "one" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "one" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "two" })).toBeVisible();
  });

  it("retries a failed collection and shows the real empty state", async () => {
    mocks.favorites.mockRejectedValueOnce(new Error("offline")).mockResolvedValue([]);
    render(<SavedListings />);
    expect(screen.getByRole("status")).toHaveTextContent(savedCopy.en.loading);
    expect(await screen.findByRole("alert")).toHaveTextContent(savedCopy.en.error);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText(savedCopy.en.empty)).toBeVisible();
    expect(mocks.products).not.toHaveBeenCalled();
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
    mocks.products.mockImplementation(async (slugs: string[]) => {
      if (slugs.includes("item-12")) throw new Error("offline");
      return published(slugs);
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
