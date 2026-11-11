import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { productDetail } from "@/lib/fixtures";
import { ApiError } from "@/lib/api";
import type { MarketplaceInstallation, ProductDetail } from "@/lib/types";

const acquireProduct = vi.hoisted(() => vi.fn());
const getProductInstallation = vi.hoisted(() => vi.fn());
const getProductRelease = vi.hoisted(() => vi.fn());
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
  getProductRelease,
}));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ fa: false }) }));

const { ProductActions } = await import("./product-actions");
const { ReleaseSelectionProvider } = await import("./release-selection");

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
    version: "1.0.0", reviewedAt: "2026-10-01T00:00:00.000Z", current: true, source: installation.release.source,
    installation: installation.release.installation,
    permissions: [], environment: [], license: "MIT", mcp: null,
  },
};

describe("ProductActions install and library flow", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.loading = false;
    session.email = "reader@example.com";
    getProductInstallation.mockRejectedValue(new ApiError(404, "ACQUISITION_NOT_FOUND", "Not acquired"));
    acquireProduct.mockResolvedValue({ data: { id: "order-1", status: "completed", releaseManifestId: "release-1", acquiredAt: "2026-09-18T10:00:00.000Z" } });
  });

  it("lets a visitor with no account install the inspected release", async () => {
    session.email = null;
    render(<ProductActions product={acquirable} />);
    const install = screen.getByRole("button", { name: "Install v1.0.0" });
    expect(install).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(install);

    expect(await screen.findByRole("dialog", { name: "Install this release" }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    expect(screen.getByText("Extract the archive")).toBeInTheDocument();
    expect(screen.getByText("a".repeat(40))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open verified package" })).toHaveAttribute("href", installation.release.installation.url);
    expect(getProductInstallation).not.toHaveBeenCalled();
    expect(acquireProduct).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(install).toHaveFocus());
    expect(install).toHaveAttribute("aria-expanded", "false");
  });

  it("still asks a signed-out visitor to log in before adding to the library", () => {
    session.email = null;
    render(<ProductActions product={acquirable} />);
    fireEvent.click(screen.getByRole("button", { name: "Add v1.0.0 to library" }));
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/account\?next=/));
    expect(acquireProduct).not.toHaveBeenCalled();
    expect(screen.getByText("Log in to add this to your library or save it.")).toBeInTheDocument();
  });

  it("adds the inspected release to the library without opening the installation", async () => {
    getProductInstallation
      .mockRejectedValueOnce(new ApiError(404, "ACQUISITION_NOT_FOUND", "Not acquired"))
      .mockResolvedValueOnce(installation);
    render(<ProductActions product={acquirable} />);
    fireEvent.click(screen.getByRole("button", { name: "Add v1.0.0 to library" }));
    const entry = await screen.findByRole("link", { name: "In your library · v1.0.0" });
    expect(entry).toHaveAttribute("href", "/dashboard/library");
    expect(acquireProduct).toHaveBeenCalledWith(productDetail.slug, expect.any(String), "1.0.0");
    expect(screen.getByText("Added to your library.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Log in to add this to your library or save it.")).not.toBeInTheDocument();
    // The entry just added is the pinned acquisition.
    fireEvent.click(screen.getByRole("button", { name: "Install v1.0.0" }));
    expect(await screen.findByRole("dialog", { name: "Install acquired release" }, { timeout: 5000 })).toBeInTheDocument();
  });

  it("opens a held listing on the reader's library version, so the facts and Install agree", async () => {
    // The listing has moved on to 2.0.0; the reader's library entry stays on 1.0.0.
    getProductInstallation.mockResolvedValue(installation);
    getProductRelease.mockResolvedValue({ ...acquirable.release, current: false });
    const current = { ...acquirable, release: { ...acquirable.release!, version: "2.0.0" } };
    const versions = [
      { id: "v2", version: "2.0.0", releasedAt: "2026-10-01T00:00:00.000Z", notes: "" },
      { id: "v1", version: "1.0.0", releasedAt: "2026-09-01T00:00:00.000Z", notes: "" },
    ];
    render(<ReleaseSelectionProvider slug={current.slug} versions={versions} release={current.release}><ProductActions product={current} /></ReleaseSelectionProvider>);
    expect(await screen.findByRole("link", { name: "In your library · v1.0.0" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /to library$/ })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Install v1.0.0" }));
    expect(await screen.findByRole("dialog", { name: "Install acquired release" }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    expect(acquireProduct).not.toHaveBeenCalled();
  });

  it("drops the previous account's library entry when the session changes", async () => {
    getProductInstallation.mockResolvedValueOnce(installation);
    const { rerender } = render(<ProductActions product={acquirable} />);
    expect(await screen.findByRole("link", { name: "In your library · v1.0.0" })).toBeInTheDocument();
    session.email = "someone-else@example.com";
    rerender(<ProductActions product={acquirable} />);
    expect(screen.queryByRole("link", { name: /In your library/ })).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Add v1.0.0 to library" })).toBeEnabled();
  });

  it("logs a library lookup that failed for a reason other than not holding it", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    getProductInstallation.mockRejectedValue(new ApiError(503, "UNAVAILABLE", "down"));
    render(<ProductActions product={acquirable} />);
    await waitFor(() => expect(error).toHaveBeenCalledWith("Library entry could not be loaded", expect.any(ApiError)));
    error.mockRestore();
  });

  it("keeps a restricted library entry marked as held", async () => {
    getProductInstallation.mockRejectedValue(new ApiError(409, "INSTALLATION_UNAVAILABLE", "Restricted"));
    render(<ProductActions product={acquirable} />);
    expect(await screen.findByRole("link", { name: "In your library" })).toBeInTheDocument();
  });

  it("says there is no release to install, and why, instead of showing dead buttons", () => {
    render(<ProductActions product={productDetail} />);
    expect(screen.getByText("No release to install yet")).toBeInTheDocument();
    expect(screen.getByText(/hasn’t published an approved release/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^(Install|Add)/ })).not.toBeInTheDocument();
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
    [new ApiError(401, "UNAUTHENTICATED", "x"), "Your session has ended. Log in again to add this."],
    [new ApiError(429, "RATE_LIMITED", "x"), "Too many requests. Wait a minute and try again."],
    [new ApiError(409, "ALREADY_IN_LIBRARY", "x"), "This resource is already in your library."],
    [new ApiError(500, "FAILED", "x"), "Could not add this resource. Check your connection and try again."],
  ])("names the real reason an add failed (%#)", async (error, message) => {
    acquireProduct.mockRejectedValue(error);
    render(<ProductActions product={acquirable} />);
    fireEvent.click(screen.getByRole("button", { name: "Add v1.0.0 to library" }));
    expect(await screen.findByText(message)).toBeInTheDocument();
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
