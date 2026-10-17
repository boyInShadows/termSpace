import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { productDetail } from "@/lib/fixtures";
import { ApiError } from "@/lib/api";
import type { ProductRelease, ProductVersion } from "@/lib/types";

const acquireProduct = vi.hoisted(() => vi.fn());
const getProductInstallation = vi.hoisted(() => vi.fn());
const getProductRelease = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ loading: false, email: "reader@example.com" as string | null, isFavorite: vi.fn(() => false), toggleFavorite: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  acquireProduct,
  getProductInstallation,
  getProductRelease,
}));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ fa: false, locale: "en" }) }));

const { ReleaseSelectionProvider, SelectedProvenance } = await import("./release-selection");
const { ProductActions } = await import("./product-actions");
const { VersionPicker } = await import("@/components/catalog/version-picker");

const versions: ProductVersion[] = [
  { id: "v3", version: "2.4.0", releasedAt: "2026-10-01T00:00:00.000Z", notes: "Newest notes." },
  { id: "v2", version: "2.3.0", releasedAt: "2026-09-01T00:00:00.000Z", notes: "Older notes." },
];

function release(version: string, ref: string, current: boolean): ProductRelease {
  return {
    version,
    current,
    source: { kind: "github_repository", url: "https://github.com/example/tool", ref, path: null, integrityDigest: null, artifactSizeBytes: null, status: "verified", checkedAt: "2026-10-01T00:00:00.000Z" },
    installation: { method: "git", url: `https://github.com/example/tool/archive/${ref}.tar.gz` },
    permissions: [], environment: [], license: "MIT", mcp: null,
  };
}

const latest = release("2.4.0", "a".repeat(40), true);
const product = { ...productDetail, versions, release: latest };

function renderPage() {
  return render(
    <ReleaseSelectionProvider slug={product.slug} versions={versions} release={latest}>
      <VersionPicker />
      <ProductActions product={product} />
      <SelectedProvenance slug={product.slug} locale="en"><p>current provenance</p></SelectedProvenance>
    </ReleaseSelectionProvider>,
  );
}

describe("release selection", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.email = "reader@example.com";
    getProductInstallation.mockRejectedValue(new ApiError(404, "ACQUISITION_NOT_FOUND", "Not acquired"));
    acquireProduct.mockResolvedValue({ data: { id: "order-1", status: "completed", releaseManifestId: "release-1", acquiredAt: "2026-10-02T00:00:00.000Z" } });
  });

  it("starts on the release the page was rendered with and adds that exact version", async () => {
    renderPage();

    expect(screen.getByText("current provenance")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add v2.4.0 to library" }));

    await waitFor(() => expect(acquireProduct).toHaveBeenCalledWith(product.slug, expect.any(String), "2.4.0"));
    expect(getProductRelease).not.toHaveBeenCalled();
  });

  it("loads the chosen version's own facts and adds that version, not the latest", async () => {
    getProductRelease.mockResolvedValue(release("2.3.0", "b".repeat(40), false));
    renderPage();

    fireEvent.change(screen.getByLabelText("Version"), { target: { value: "v2" } });

    expect(screen.getByRole("button", { name: "Loading release…" })).toBeDisabled();
    expect(await screen.findByText("b".repeat(40))).toBeInTheDocument();
    expect(screen.getByText(/release, not the latest/)).toBeInTheDocument();
    expect(screen.queryByText("current provenance")).not.toBeInTheDocument();
    expect(getProductRelease).toHaveBeenCalledWith(product.slug, "2.3.0", expect.any(AbortSignal));

    fireEvent.click(screen.getByRole("button", { name: "Add v2.3.0 to library" }));
    await waitFor(() => expect(acquireProduct).toHaveBeenCalledWith(product.slug, expect.any(String), "2.3.0"));
  });

  it("will not add a version whose facts could not be loaded, and retries when picked again", async () => {
    getProductRelease.mockRejectedValueOnce(new ApiError(500, "FAILED", "boom")).mockResolvedValueOnce(release("2.3.0", "c".repeat(40), false));
    renderPage();

    fireEvent.change(screen.getByLabelText("Version"), { target: { value: "v2" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn’t load this release");
    expect(screen.getByRole("button", { name: "Couldn’t load this release." })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Version"), { target: { value: "v3" } });
    fireEvent.change(screen.getByLabelText("Version"), { target: { value: "v2" } });
    expect(await screen.findByText("c".repeat(40))).toBeInTheDocument();
    expect(getProductRelease).toHaveBeenCalledTimes(2);
  });

  it("goes back to the page's own release without another request", async () => {
    getProductRelease.mockResolvedValue(release("2.3.0", "b".repeat(40), false));
    renderPage();

    fireEvent.change(screen.getByLabelText("Version"), { target: { value: "v2" } });
    await screen.findByText("b".repeat(40));
    fireEvent.change(screen.getByLabelText("Version"), { target: { value: "v3" } });

    expect(screen.getByText("current provenance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add v2.4.0 to library" })).toBeEnabled();
    expect(getProductRelease).toHaveBeenCalledTimes(1);
  });
});
