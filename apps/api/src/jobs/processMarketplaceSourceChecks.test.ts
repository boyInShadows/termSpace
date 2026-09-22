import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveMarketplaceSource = vi.hoisted(() => vi.fn());
const decryptProviderToken = vi.hoisted(() => vi.fn(() => "provider-token"));
const prismaMock = vi.hoisted(() => ({
  marketplaceSourceCheckJob: { findUnique: vi.fn(), update: vi.fn() },
  marketplaceSourceCheck: { create: vi.fn() },
  marketplaceReleaseManifest: { update: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../lib/marketplaceProviderToken.js", () => ({ decryptProviderToken }));
vi.mock("../lib/marketplaceSourceProviders.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../lib/marketplaceSourceProviders.js")>(),
  resolveMarketplaceSource,
}));

const { processMarketplaceSourceCheckJob } = await import("./processMarketplaceSourceChecks.js");
const { ProviderCallError } = await import("../lib/marketplaceSourceProviders.js");

const claimed = { id: "job-1", releaseManifestId: "release-1", connectionId: "connection-1", correlationId: "correlation-1", attempts: 1 };

function activeRecord(publishedAt: Date | null = null) {
  return {
    releaseManifest: {
      id: "release-1", sourceKind: "GITHUB_REPOSITORY", sourceUrl: "https://github.com/example/tool",
      sourceRef: "a".repeat(40), sourcePath: null, providerIntegrityDigest: null,
      resolvedInstallationUrl: publishedAt ? `https://github.com/example/tool/archive/${"a".repeat(40)}.tar.gz` : null,
      publishedAt,
    },
    connection: {
      id: "connection-1", provider: "GITHUB", accountLogin: "owner", encryptedToken: "encrypted", tokenIv: "iv", tokenTag: "tag", revokedAt: null,
    },
  };
}

describe("marketplace source reconciliation worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.marketplaceSourceCheckJob.findUnique.mockResolvedValue(activeRecord());
    prismaMock.marketplaceSourceCheck.create.mockResolvedValue({});
    prismaMock.marketplaceReleaseManifest.update.mockResolvedValue({});
    prismaMock.marketplaceSourceCheckJob.update.mockResolvedValue({});
    prismaMock.$transaction.mockResolvedValue([]);
  });

  it("stores verified canonical provenance and completes the job", async () => {
    resolveMarketplaceSource.mockResolvedValue({
      provider: "GITHUB", statusCode: 200, resolvedSourceRef: "a".repeat(40), canonicalSourceUrl: "https://github.com/example/tool",
      resolvedInstallationUrl: `https://github.com/example/tool/archive/${"a".repeat(40)}.tar.gz`, providerIntegrityDigest: null, artifactSizeBytes: null,
    });
    await processMarketplaceSourceCheckJob(claimed);
    expect(prismaMock.marketplaceSourceCheck.create).toHaveBeenCalledWith({ data: expect.objectContaining({ outcome: "VERIFIED", ownershipVerified: true }) });
    expect(prismaMock.marketplaceReleaseManifest.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sourceCheckStatus: "VERIFIED", verifiedConnectionId: "connection-1" }) }));
    expect(prismaMock.marketplaceSourceCheckJob.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "COMPLETED" }) }));
  });

  it("keeps a published release available but stale during a transient outage", async () => {
    prismaMock.marketplaceSourceCheckJob.findUnique.mockResolvedValue(activeRecord(new Date()));
    resolveMarketplaceSource.mockRejectedValue(new ProviderCallError("transient", "HTTP_503", 503));
    await processMarketplaceSourceCheckJob(claimed);
    expect(prismaMock.marketplaceReleaseManifest.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sourceCheckStatus: "STALE" }) }));
    expect(prismaMock.marketplaceSourceCheckJob.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "RETRY", lastErrorCode: "HTTP_503" }) }));
  });

  it("restricts a published release after confirmed ownership loss", async () => {
    prismaMock.marketplaceSourceCheckJob.findUnique.mockResolvedValue(activeRecord(new Date()));
    resolveMarketplaceSource.mockRejectedValue(new ProviderCallError("unauthorized", "OWNERSHIP_PERMISSION_REQUIRED", 403));
    await processMarketplaceSourceCheckJob(claimed);
    expect(prismaMock.marketplaceReleaseManifest.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sourceCheckStatus: "RESTRICTED" }) }));
    expect(prismaMock.marketplaceSourceCheckJob.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }));
  });
});
