import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { productDetail } from "@/lib/fixtures";
import { ApiError } from "@/lib/api";
import type { MarketplaceInstallation, ProductDetail } from "@/lib/types";

const acquireProduct = vi.hoisted(() => vi.fn());
const getProductInstallation = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({
  loading: false,
  email: "reader@example.com" as string | null,
  isFavorite: vi.fn(() => false),
  toggleFavorite: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  acquireProduct,
  getProductInstallation,
}));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ fa: false }) }));

const { ProductActions } = await import("./product-actions");

const installation: MarketplaceInstallation = {
  acquisition: { id: "order-1", status: "completed", acquiredAt: "2026-09-18T10:00:00.000Z" },
  product: { slug: productDetail.slug, name: productDetail.name },
  release: {
    id: "release-1", version: "1.0.0",
    source: { kind: "github_repository", url: "https://github.com/example/tool", ref: "a".repeat(40), path: null, integrityDigest: null, artifactSizeBytes: null, status: "verified", checkedAt: "2026-09-18T09:00:00.000Z" },
    installation: { method: "manual", url: `https://github.com/example/tool/archive/${"a".repeat(40)}.tar.gz`, instructions: ["Extract the archive", "Copy the resource directory"] },
    requirements: { runtimes: [], accounts: [], operatingSystems: [], dependencies: [] },
    license: "MIT", documentationUrl: null, supportUrl: null,
  },
};

const acquirable: ProductDetail = {
  ...productDetail,
  release: {
    version: "1.0.0", current: true, source: installation.release.source,
    installation: { method: "manual", url: installation.release.installation.url },
    permissions: [], environment: [], license: "MIT", mcp: null,
  },
};

describe("ProductActions acquisition flow", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.loading = false;
    session.email = "reader@example.com";
    getProductInstallation.mockRejectedValue(new ApiError(404, "ACQUISITION_NOT_FOUND", "Not acquired"));
    acquireProduct.mockResolvedValue({ data: { id: "order-1", status: "completed", releaseManifestId: "release-1", acquiredAt: "2026-09-18T10:00:00.000Z" } });
  });

  it("requires sign-in before acquisition", () => {
    session.email = null;
    render(<ProductActions product={acquirable} />);
    expect(screen.getByRole("button", { name: "Add v1.0.0 to library" })).not.toHaveAttribute("aria-haspopup");
    fireEvent.click(screen.getByRole("button", { name: "Add v1.0.0 to library" }));
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/account\?next=/));
    expect(acquireProduct).not.toHaveBeenCalled();
  });

  it("reveals only the exact acquired release after acquisition", async () => {
    getProductInstallation
      .mockRejectedValueOnce(new ApiError(404, "ACQUISITION_NOT_FOUND", "Not acquired"))
      .mockResolvedValueOnce(installation);
    render(<ProductActions product={acquirable} />);

    fireEvent.click(screen.getByRole("button", { name: "Add v1.0.0 to library" }));

    // Cold lazy-module transformation can exceed Testing Library's one-second default.
    expect(await screen.findByRole("dialog", { name: "Install acquired release" }, { timeout: 5_000 })).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    expect(screen.getByText("Extract the archive")).toBeInTheDocument();
    expect(screen.getByText("a".repeat(40))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open verified package" })).toHaveAttribute("href", installation.release.installation.url);
    await waitFor(() => expect(acquireProduct).toHaveBeenCalledTimes(1));
  });

  it("says there is no release to add, and why, instead of showing a dead button", () => {
    render(<ProductActions product={productDetail} />);
    expect(screen.getByText("No release to add yet")).toBeInTheDocument();
    expect(screen.getByText(/hasn’t published an approved release/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Add/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeEnabled();
    expect(acquireProduct).not.toHaveBeenCalled();
  });

  it("says why when the release disappears between render and click", async () => {
    acquireProduct.mockRejectedValue(new ApiError(409, "RELEASE_UNAVAILABLE", "No approved release"));
    render(<ProductActions product={acquirable} />);
    fireEvent.click(screen.getByRole("button", { name: "Add v1.0.0 to library" }));
    expect(await screen.findByText("This release is no longer available to add.")).toBeInTheDocument();
  });

  it.each([
    [new ApiError(401, "UNAUTHENTICATED", "x"), "Your session has ended. Sign in again to add this."],
    [new ApiError(429, "RATE_LIMITED", "x"), "Too many requests. Wait a minute and try again."],
    [new ApiError(409, "ALREADY_IN_LIBRARY", "x"), "This resource is already in your library."],
    [new ApiError(500, "FAILED", "x"), "Could not add this resource. Check your connection and try again."],
  ])("names the real reason an add failed (%#)", async (error, message) => {
    acquireProduct.mockRejectedValue(error);
    render(<ProductActions product={acquirable} />);
    fireEvent.click(screen.getByRole("button", { name: "Add v1.0.0 to library" }));
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("tells a signed-out visitor what signing in is for, and says nothing once signed in", () => {
    session.email = null;
    const { unmount } = render(<ProductActions product={acquirable} />);
    expect(screen.getByText("Sign in to add or save this listing.")).toBeInTheDocument();
    unmount();
    session.email = "reader@example.com";
    render(<ProductActions product={acquirable} />);
    expect(screen.queryByText("Sign in to add or save this listing.")).not.toBeInTheDocument();
  });

  it("loads an existing entitlement without creating another acquisition", async () => {
    getProductInstallation.mockResolvedValue(installation);
    render(<ProductActions product={acquirable} />);
    const button = await screen.findByRole("button", { name: "View installation" });
    fireEvent.click(button);
    expect(await screen.findByRole("dialog", { name: "Install acquired release" })).toBeInTheDocument();
    expect(acquireProduct).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(button).toHaveFocus());
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the lazy preview and returns focus after Escape", async () => {
    render(<ProductActions product={productDetail} />);
    const button = screen.getByRole("button", { name: "Preview" });
    button.focus();
    fireEvent.click(button);
    const dialog = await screen.findByRole("dialog", { name: `Inside ${productDetail.name}` });
    expect(button).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(button).toHaveFocus());
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
