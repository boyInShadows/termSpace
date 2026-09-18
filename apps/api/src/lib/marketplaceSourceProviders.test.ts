import { describe, expect, it, vi } from "vitest";
import { ProviderCallError, resolveMarketplaceSource, verifyProviderCredential } from "./marketplaceSourceProviders.js";

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

describe("marketplace source providers", () => {
  it("verifies a GitHub identity", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ id: 42, login: "source-owner" }));
    await expect(verifyProviderCredential("GITHUB", "token", "corr-1", fetchImpl)).resolves.toMatchObject({ accountId: "42", accountLogin: "source-owner" });
    expect(fetchImpl).toHaveBeenCalledWith("https://api.github.com/user", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token" }) }));
  });

  it("resolves an exact GitHub commit only for maintainers", async () => {
    const sha = "a".repeat(40);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json({ private: false, permissions: { maintain: true } }))
      .mockResolvedValueOnce(json({ sha }));
    const result = await resolveMarketplaceSource({
      source: { sourceKind: "GITHUB_REPOSITORY", sourceUrl: "https://github.com/example/tool.git", sourceRef: sha, sourcePath: null, providerIntegrityDigest: null },
      accountLogin: "owner", token: "token", correlationId: "corr-2", fetchImpl,
    });
    expect(result).toMatchObject({ resolvedSourceRef: sha, canonicalSourceUrl: "https://github.com/example/tool" });
  });

  it("rejects GitHub users without maintain permission", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ private: false, permissions: { push: true } }));
    await expect(resolveMarketplaceSource({
      source: { sourceKind: "GITHUB_REPOSITORY", sourceUrl: "https://github.com/example/tool", sourceRef: "a".repeat(40), sourcePath: null, providerIntegrityDigest: null },
      accountLogin: "contributor", token: "token", correlationId: "corr-3", fetchImpl,
    })).rejects.toMatchObject({ kind: "unauthorized", code: "OWNERSHIP_PERMISSION_REQUIRED" } satisfies Partial<ProviderCallError>);
  });

  it("resolves npm metadata and verifies collaborator access and integrity", async () => {
    const integrity = "sha512-example";
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json({ owner: "write" }))
      .mockResolvedValueOnce(json({ name: "@scope/tool", version: "1.2.3", dist: { tarball: "https://registry.npmjs.org/@scope/tool/-/tool-1.2.3.tgz", integrity, unpackedSize: 2048 } }));
    const result = await resolveMarketplaceSource({
      source: { sourceKind: "NPM", sourceUrl: "https://registry.npmjs.org/%40scope%2Ftool", sourceRef: "1.2.3", sourcePath: null, providerIntegrityDigest: integrity },
      accountLogin: "owner", token: "token", correlationId: "corr-4", fetchImpl,
    });
    expect(result).toMatchObject({ provider: "NPM", providerIntegrityDigest: integrity, artifactSizeBytes: 2048 });
  });

  it("retries a transient provider response once", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("temporary", { status: 503 }))
      .mockResolvedValueOnce(json({ username: "owner" }));
    await expect(verifyProviderCredential("NPM", "token", "corr-5", fetchImpl)).resolves.toMatchObject({ accountLogin: "owner" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("classifies GitHub's 403 quota response as rate limiting", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ message: "rate limit" }, 403, { "x-ratelimit-remaining": "0", "retry-after": "30" }));
    await expect(verifyProviderCredential("GITHUB", "token", "corr-6", fetchImpl)).rejects.toMatchObject({
      kind: "rate_limited", statusCode: 403, retryAfterSeconds: 30,
    });
  });
});
