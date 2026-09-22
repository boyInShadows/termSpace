import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getReleases = vi.hoisted(() => vi.fn());
const getConnections = vi.hoisted(() => vi.fn());
const copy = {
  back: "Back to dashboard", eyebrow: "Release management", title: "Release history", intro: "Published versions stay immutable.",
  loading: "Loading release history", loadError: "Could not load", retry: "Try again", prepare: "Prepare new release",
  empty: "No releases", current: "Current public release", published: "Published", proposed: "Proposed",
  supersededDraft: "Superseded draft", source: "Source", integrity: "Integrity", acquisitions: "Acquisitions pinned here",
  created: "Created", publishedOn: "Published", unresolved: "Source check pending", ownershipPending: "Ownership check pending",
  immutableNotice: "Published source references are immutable.",
  connectionsTitle: "Provider connections", connectionsIntro: "Connect source owners", tokenLabel: "Access token",
  connect: "Connect and verify", disconnect: "Disconnect", connectionSaved: "Connected", connectionRevoked: "Disconnected",
  actionError: "Failed", verifySource: "Verify source", checkQueued: "Queued", checkStatus: "Source status",
  check_pending: "Pending", check_verified: "Verified", check_stale: "Stale", check_restricted: "Restricted", check_failed: "Failed",
};

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, getCreatorReleases: getReleases, getProviderConnections: getConnections };
});
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: { creatorReleases: copy } }) }));

const { CreatorReleaseManager } = await import("./creator-release-manager");

describe("CreatorReleaseManager", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    getConnections.mockResolvedValue([]);
    getReleases.mockResolvedValue({
      listing: { id: "product-1", slug: "owned-skill", name: "Owned Skill", state: "published", lifecycleVersion: 4, published: true },
      releases: [{
        id: "release-1", productVersionId: "version-1", version: "1.0.0", notes: "Initial release", revision: 1,
        status: "published", source: { kind: "github_repository", url: "https://github.com/example/item", ref: "abc123", path: "skill", integrityDigest: null, artifactSizeBytes: null, installationUrl: null },
        sourceCheckStatus: "verified", sourceCheckedAt: "2026-09-15T00:00:00.000Z", sourceNextCheckAt: null, sourceFailureCount: 0, lastSourceErrorCode: null,
        sourceResolvedAt: "2026-09-15T00:00:00.000Z", ownershipVerifiedAt: "2026-09-15T00:00:00.000Z",
        publishedAt: "2026-09-16T00:00:00.000Z", createdAt: "2026-09-15T00:00:00.000Z", listingRevision: 1,
        isCurrent: true, acquisitionCount: 3,
      }],
    });
  });

  it("shows immutable release provenance and the pinned acquisition count", async () => {
    render(<CreatorReleaseManager productId="product-1" />);

    expect(await screen.findByRole("heading", { name: "Owned Skill" })).toBeInTheDocument();
    expect(screen.getByText("Current public release")).toBeInTheDocument();
    expect(screen.getByText(/Acquisitions pinned here: 3/)).toBeInTheDocument();
    expect(screen.getByText(/github_repository/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Prepare new release/ })).toHaveAttribute("href", "/creator/listings/product-1/edit");
  });
});
