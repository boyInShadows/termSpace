import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArticleEngagement } from "./ArticleEngagement";
import { api } from "@/lib/api";
import { NextIntlClientProvider } from "next-intl";

vi.mock("next/navigation", () => ({ usePathname: () => "/blog/test-article" }));

function renderEngagement(locale: "en" | "fa" = "en") {
  return render(<NextIntlClientProvider locale={locale} messages={{}} timeZone="UTC"><ArticleEngagement slug="test-article" title="Test article" /></NextIntlClientProvider>);
}

vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), api: { getReaderLibrary: vi.fn(), setReaderBookmark: vi.fn(), saveReaderProgress: vi.fn() } }));

describe("ArticleEngagement", () => {
  afterEach(cleanup);
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetAllMocks();
    vi.mocked(api.getReaderLibrary).mockRejectedValue(new Error("Signed out"));
    Object.defineProperty(navigator, "share", { configurable: true, writable: true, value: undefined });
  });

  it("uses Persian locale context when the server pathname has been rewritten", () => {
    renderEngagement("fa");
    expect(screen.getByRole("button", { name: "ذخیره" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "اشتراک‌گذاری" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "برای همگام‌سازی وارد شوید" })).toHaveAttribute("href", "/fa/account");
  });

  it("stores and removes browser-local bookmarks", async () => {
    const user = userEvent.setup();
    renderEngagement();
    const button = screen.getByRole("button", { name: "Bookmark" });
    await user.click(button);
    expect(window.localStorage.getItem("termAcademy.bookmarks")).toContain("test-article");
    await user.click(screen.getByRole("button", { name: "Bookmarked" }));
    expect(window.localStorage.getItem("termAcademy.bookmarks")).toBe("[]");
  });

  it("announces a failed synchronized bookmark and restores the previous state", async () => {
    vi.mocked(api.getReaderLibrary).mockResolvedValue({ data: { bookmarks: [], history: [] } });
    vi.mocked(api.setReaderBookmark).mockRejectedValueOnce(new Error("unavailable"));
    const user = userEvent.setup();
    renderEngagement();
    await waitFor(() => expect(screen.queryByText("Sign in to sync")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Bookmark" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save your bookmark");
    expect(screen.getByRole("button", { name: "Bookmark" })).toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem("termAcademy.bookmarks")).toBe("[]");
  });

  it("confirms copying the article link", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderEngagement();
    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Link copied.");
  });

  it("does not announce native share cancellation as a failure", async () => {
    Object.defineProperty(navigator, "share", { configurable: true, value: vi.fn().mockRejectedValue(new DOMException("Canceled", "AbortError")) });
    const user = userEvent.setup();
    renderEngagement();
    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
