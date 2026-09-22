import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { productDetail } from "@/lib/fixtures";
import { ApiError } from "@/lib/api";

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

const installation = {
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
    render(<ProductActions product={productDetail} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to library" }));
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/account\?next=/));
    expect(acquireProduct).not.toHaveBeenCalled();
  });

  it("reveals only the exact acquired release after acquisition", async () => {
    getProductInstallation
      .mockRejectedValueOnce(new ApiError(404, "ACQUISITION_NOT_FOUND", "Not acquired"))
      .mockResolvedValueOnce(installation);
    render(<ProductActions product={productDetail} />);

    fireEvent.click(screen.getByRole("button", { name: "Add to library" }));

    expect(await screen.findByRole("dialog", { name: "Install acquired release" })).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    expect(screen.getByText("Extract the archive")).toBeInTheDocument();
    expect(screen.getByText("a".repeat(40))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open verified package" })).toHaveAttribute("href", installation.release.installation.url);
    await waitFor(() => expect(acquireProduct).toHaveBeenCalledTimes(1));
  });

  it("loads an existing entitlement without creating another acquisition", async () => {
    getProductInstallation.mockResolvedValue(installation);
    render(<ProductActions product={productDetail} />);
    const button = await screen.findByRole("button", { name: "View installation" });
    fireEvent.click(button);
    expect(await screen.findByRole("dialog", { name: "Install acquired release" })).toBeInTheDocument();
    expect(acquireProduct).not.toHaveBeenCalled();
  });
});
