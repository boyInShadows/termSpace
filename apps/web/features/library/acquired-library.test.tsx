import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MarketplaceLibraryEntry } from "@/lib/types";
import { libraryCopy } from "./library-copy";

const getLibrary = vi.hoisted(() => vi.fn());
const nav = vi.hoisted(() => ({ path: "/dashboard/library", query: "", locale: "en" as "en" | "fa" }));
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("@/lib/api", () => ({ getMarketplaceLibrary: getLibrary }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.path, useSearchParams: () => new URLSearchParams(nav.query), useRouter: () => router }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: nav.locale }) }));
const { AcquiredLibrary } = await import("./acquired-library");

const entry: MarketplaceLibraryEntry = {
  acquisitionId: "order-1", acquiredAt: "2026-09-18T10:00:00Z",
  product: { id: "product-1", slug: "owned-skill", name: "Owned Skill", type: "Skill", typeKey: "skill", outcome: "Completes a useful task", creator: { name: "Creator", handle: "creator" } },
  release: { id: "release-1", version: "1.0.0", sourceStatus: "stale" }, installationAvailable: true,
};
function result(entries = [entry], page = 1, totalPages = 1) {
  return { data: entries, meta: { page, limit: 24, total: entries.length, totalPages } };
}
beforeEach(() => {
  vi.clearAllMocks(); getLibrary.mockReset().mockResolvedValue(result());
  nav.path = "/dashboard/library"; nav.query = ""; nav.locale = "en";
});
afterEach(cleanup);

it.each(["en", "fa"] as const)("keeps pinned/legacy/unavailable releases distinct (%s)", async (locale) => {
  nav.locale = locale;
  getLibrary.mockResolvedValue(result([
    entry,
    { ...entry, acquisitionId: "legacy", product: { ...entry.product, name: "Legacy Skill" }, release: null, installationAvailable: false },
    { ...entry, acquisitionId: "restricted", product: { ...entry.product, name: "Restricted Skill" }, installationAvailable: false },
  ]));
  render(<AcquiredLibrary />);
  await screen.findByRole("heading", { name: "Owned Skill" });
  expect(screen.getByRole("heading", { level: 1, name: libraryCopy[locale].title })).toBeInTheDocument();
  expect(screen.getAllByText("v1.0.0")).toHaveLength(2);
  expect(screen.getByText(libraryCopy[locale].legacy)).toBeInTheDocument();
  expect(screen.getAllByText(libraryCopy[locale].unavailable)).toHaveLength(2);
  expect(screen.getAllByRole("link", { name: libraryCopy[locale].install })).toHaveLength(1);
  expect(screen.getByRole("link", { name: libraryCopy[locale].install })).toHaveAttribute("href", `${locale === "fa" ? "/fa" : ""}/products/owned-skill`);
  expect(getLibrary).toHaveBeenCalledExactlyOnceWith(1, 24, expect.any(AbortSignal));
});

it("retries an error without falsely reporting an empty library", async () => {
  getLibrary.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(result());
  render(<AcquiredLibrary embedded />);
  expect(await screen.findByRole("alert")).toHaveTextContent(libraryCopy.en.error);
  expect(screen.queryByText(libraryCopy.en.empty)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: libraryCopy.en.retry }));
  await screen.findByRole("heading", { name: "Owned Skill" });
  expect(screen.getByRole("heading", { level: 2, name: libraryCopy.en.title })).toBeInTheDocument();
  expect(getLibrary).toHaveBeenCalledTimes(2);
});

it("shows a browse link for a genuinely empty library", async () => {
  getLibrary.mockResolvedValue(result([]));
  render(<AcquiredLibrary />);
  await screen.findByText(libraryCopy.en.empty);
  expect(screen.getByRole("link", { name: libraryCopy.en.browse })).toHaveAttribute("href", "/explore");
});

it("pages through URL state, preserves other parameters and hides previous-page rows while loading", async () => {
  nav.query = "source=nav";
  let complete!: (value: ReturnType<typeof result>) => void;
  getLibrary.mockResolvedValueOnce(result([entry], 1, 2)).mockReturnValueOnce(new Promise((resolve) => { complete = resolve; })).mockResolvedValue(result([entry], 1, 2));
  const view = render(<AcquiredLibrary />);
  await screen.findByRole("heading", { name: "Owned Skill" });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(router.push).toHaveBeenCalledWith("/dashboard/library?source=nav&page=2", { scroll: false });
  nav.query = "source=nav&page=2"; view.rerender(<AcquiredLibrary />);
  expect(screen.getByRole("status")).toHaveTextContent(libraryCopy.en.loading);
  expect(screen.queryByRole("heading", { name: "Owned Skill" })).not.toBeInTheDocument();
  complete(result([{ ...entry, product: { ...entry.product, name: "Second Skill" } }], 2, 2));
  await screen.findByRole("heading", { name: "Second Skill" });
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  expect(router.push).toHaveBeenLastCalledWith("/dashboard/library?source=nav", { scroll: false });
  nav.query = "source=nav"; view.rerender(<AcquiredLibrary />);
  await screen.findByRole("heading", { name: "Owned Skill" });
  expect(getLibrary.mock.calls.map(([page]) => page)).toEqual([1, 2, 1]);
});

it("redirects a page past the end to the last real page without a false empty state", async () => {
  nav.query = "page=99";
  getLibrary.mockResolvedValueOnce(result([], 99, 2)).mockResolvedValueOnce(result([entry], 2, 2));
  const view = render(<AcquiredLibrary />);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard/library?page=2", { scroll: false }));
  expect(screen.queryByText(libraryCopy.en.empty)).not.toBeInTheDocument();
  nav.query = "page=2"; view.rerender(<AcquiredLibrary />);
  await screen.findByRole("heading", { name: "Owned Skill" });
});

it.each(["-1", "word", "1.5", "9007199254740992"])("requests page 1 for invalid page=%s", async (page) => {
  nav.query = `page=${page}`;
  render(<AcquiredLibrary />);
  await screen.findByRole("heading", { name: "Owned Skill" });
  expect(getLibrary).toHaveBeenCalledWith(1, 24, expect.any(AbortSignal));
});

it("aborts stale page requests and ignores their late responses", async () => {
  let complete!: (value: ReturnType<typeof result>) => void;
  getLibrary.mockReturnValueOnce(new Promise((resolve) => { complete = resolve; })).mockResolvedValueOnce(result([{ ...entry, product: { ...entry.product, name: "Second Skill" } }], 2, 2));
  const view = render(<AcquiredLibrary />);
  nav.query = "page=2"; view.rerender(<AcquiredLibrary />);
  await screen.findByRole("heading", { name: "Second Skill" });
  expect(getLibrary.mock.calls[0][2].aborted).toBe(true);
  complete(result());
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Owned Skill" })).not.toBeInTheDocument());
  view.unmount();
  expect(getLibrary.mock.calls[1][2].aborted).toBe(true);
});
