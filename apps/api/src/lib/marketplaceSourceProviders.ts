import type { MarketplaceProvider, MarketplaceSourceKind } from "@prisma/client";

const PROVIDER_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 1_000_000;
const GITHUB_API_VERSION = "2026-03-10";

type FetchLike = typeof fetch;
type ProviderFailureKind = "unauthorized" | "not_found" | "rate_limited" | "transient" | "invalid_response";

export class ProviderCallError extends Error {
  constructor(
    public readonly kind: ProviderFailureKind,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(code);
  }
}

type ProviderRequestInput = {
  provider: MarketplaceProvider;
  operation: string;
  url: string;
  token: string;
  correlationId: string;
  fetchImpl?: FetchLike;
};

async function readBoundedJson(response: Response, required: boolean): Promise<unknown> {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_RESPONSE_BYTES) throw new ProviderCallError("invalid_response", "RESPONSE_TOO_LARGE", response.status);
  const chunks: Buffer[] = [];
  let received = 0;
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new ProviderCallError("invalid_response", "RESPONSE_TOO_LARGE", response.status);
      }
      chunks.push(Buffer.from(value));
    }
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text && !required) return null;
  try { return JSON.parse(text) as unknown; } catch {
    if (!required) return null;
    throw new ProviderCallError("invalid_response", "INVALID_JSON", response.status);
  }
}

async function providerRequest(input: ProviderRequestInput): Promise<{ body: any; statusCode: number }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const startedAt = Date.now();
    try {
      const response = await fetchImpl(input.url, {
        headers: input.provider === "GITHUB" ? {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${input.token}`,
          "X-GitHub-Api-Version": GITHUB_API_VERSION,
          "User-Agent": "TermSpace-Source-Verification",
        } : {
          Accept: "application/json",
          Authorization: `Bearer ${input.token}`,
          "User-Agent": "TermSpace-Source-Verification",
        },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
      const body = await readBoundedJson(response, response.ok);
      console.info(JSON.stringify({
        event: "marketplace_provider_call",
        provider: input.provider.toLowerCase(),
        operation: input.operation,
        correlationId: input.correlationId,
        attempt,
        statusCode: response.status,
        latencyMs: Date.now() - startedAt,
      }));
      if (response.ok) return { body, statusCode: response.status };
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      const providerRateLimited = response.status === 429
        || (response.status === 403 && (response.headers.get("x-ratelimit-remaining") === "0" || retryAfter > 0));
      if (providerRateLimited) {
        throw new ProviderCallError("rate_limited", `HTTP_${response.status}`, response.status, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined);
      }
      if (response.status === 401 || response.status === 403) throw new ProviderCallError("unauthorized", `HTTP_${response.status}`, response.status);
      if (response.status === 404) throw new ProviderCallError("not_found", "HTTP_404", response.status);
      if (response.status >= 500 && attempt < 2) continue;
      if (response.status >= 500) throw new ProviderCallError("transient", `HTTP_${response.status}`, response.status);
      throw new ProviderCallError("invalid_response", `HTTP_${response.status}`, response.status);
    } catch (error) {
      if (error instanceof ProviderCallError) {
        if (error.kind === "transient" && attempt < 2) continue;
        throw error;
      }
      const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      console.warn(JSON.stringify({
        event: "marketplace_provider_call",
        provider: input.provider.toLowerCase(),
        operation: input.operation,
        correlationId: input.correlationId,
        attempt,
        outcome: timeout ? "timeout" : "network_error",
        latencyMs: Date.now() - startedAt,
      }));
      if (attempt < 2) continue;
      throw new ProviderCallError("transient", timeout ? "TIMEOUT" : "NETWORK_ERROR");
    }
  }
  throw new ProviderCallError("transient", "RETRY_EXHAUSTED");
}

export async function verifyProviderCredential(
  provider: MarketplaceProvider,
  token: string,
  correlationId: string,
  fetchImpl?: FetchLike,
) {
  const result = await providerRequest({
    provider,
    token,
    correlationId,
    operation: "verify_identity",
    url: provider === "GITHUB" ? "https://api.github.com/user" : "https://registry.npmjs.org/-/whoami",
    fetchImpl,
  });
  const accountLogin = provider === "GITHUB" ? result.body?.login : result.body?.username;
  const accountId = provider === "GITHUB" ? result.body?.id : accountLogin;
  if ((typeof accountId !== "number" && typeof accountId !== "string") || typeof accountLogin !== "string" || !accountLogin) {
    throw new ProviderCallError("invalid_response", "IDENTITY_RESPONSE_INVALID", result.statusCode);
  }
  return { accountId: String(accountId), accountLogin, statusCode: result.statusCode };
}

export type SourceResolutionInput = {
  sourceKind: MarketplaceSourceKind;
  sourceUrl: string;
  sourceRef: string;
  sourcePath: string | null;
  providerIntegrityDigest: string | null;
};

export type SourceResolution = {
  provider: MarketplaceProvider;
  statusCode: number;
  resolvedSourceRef: string;
  canonicalSourceUrl: string;
  resolvedInstallationUrl: string;
  providerIntegrityDigest: string | null;
  artifactSizeBytes: number | null;
};

function githubRepositoryIdentity(sourceUrl: string) {
  const url = new URL(sourceUrl);
  const segments = url.pathname.replace(/\.git$/u, "").split("/").filter(Boolean);
  if (url.protocol !== "https:" || url.hostname !== "github.com" || segments.length !== 2) {
    throw new ProviderCallError("invalid_response", "GITHUB_REPOSITORY_INVALID");
  }
  return { owner: segments[0], repo: segments[1], canonicalUrl: `https://github.com/${segments[0]}/${segments[1]}` };
}

function npmPackageIdentity(sourceUrl: string) {
  const url = new URL(sourceUrl);
  if (url.protocol !== "https:" || url.hostname !== "registry.npmjs.org") {
    throw new ProviderCallError("invalid_response", "NPM_PACKAGE_INVALID");
  }
  const packageName = decodeURIComponent(url.pathname.slice(1));
  if (!packageName) throw new ProviderCallError("invalid_response", "NPM_PACKAGE_INVALID");
  return packageName;
}

export function providerForSourceKind(sourceKind: MarketplaceSourceKind): MarketplaceProvider {
  return sourceKind === "NPM" ? "NPM" : "GITHUB";
}

export async function resolveMarketplaceSource(input: {
  source: SourceResolutionInput;
  accountLogin: string;
  token: string;
  correlationId: string;
  fetchImpl?: FetchLike;
}): Promise<SourceResolution> {
  const provider = providerForSourceKind(input.source.sourceKind);
  if (provider === "NPM") return resolveNpmSource({ ...input, provider });
  return resolveGitHubSource({ ...input, provider });
}

async function resolveGitHubSource(input: {
  source: SourceResolutionInput;
  accountLogin: string;
  token: string;
  correlationId: string;
  provider: "GITHUB";
  fetchImpl?: FetchLike;
}): Promise<SourceResolution> {
  const repository = githubRepositoryIdentity(input.source.sourceUrl);
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}`;
  const repoResult = await providerRequest({ ...input, operation: "repository_permissions", url: apiBase });
  if (repoResult.body?.private) throw new ProviderCallError("invalid_response", "PRIVATE_SOURCE_FORBIDDEN", repoResult.statusCode);
  if (!repoResult.body?.permissions?.admin && !repoResult.body?.permissions?.maintain) {
    throw new ProviderCallError("unauthorized", "OWNERSHIP_PERMISSION_REQUIRED", repoResult.statusCode);
  }

  if (input.source.sourceKind === "GITHUB_REPOSITORY") {
    const [commit] = await Promise.all([
      providerRequest({ ...input, operation: "resolve_commit", url: `${apiBase}/commits/${encodeURIComponent(input.source.sourceRef)}` }),
      input.source.sourcePath
        ? providerRequest({
          ...input,
          operation: "resolve_repository_path",
          url: `${apiBase}/contents/${input.source.sourcePath.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(input.source.sourceRef)}`,
        })
        : Promise.resolve(null),
    ]);
    if (commit.body?.sha !== input.source.sourceRef) throw new ProviderCallError("invalid_response", "SOURCE_REF_MISMATCH", commit.statusCode);
    return {
      provider: "GITHUB",
      statusCode: commit.statusCode,
      resolvedSourceRef: commit.body.sha,
      canonicalSourceUrl: repository.canonicalUrl,
      resolvedInstallationUrl: `${repository.canonicalUrl}/archive/${commit.body.sha}.tar.gz`,
      providerIntegrityDigest: null,
      artifactSizeBytes: null,
    };
  }

  const separator = input.source.sourceRef.lastIndexOf("@");
  const tag = input.source.sourceRef.slice(0, separator);
  const expectedCommit = input.source.sourceRef.slice(separator + 1);
  if (!tag || !/^[a-f0-9]{40}$/u.test(expectedCommit) || !input.source.sourcePath) {
    throw new ProviderCallError("invalid_response", "GITHUB_RELEASE_IDENTITY_INVALID");
  }
  const [release, tagCommit] = await Promise.all([
    providerRequest({ ...input, operation: "resolve_release", url: `${apiBase}/releases/tags/${encodeURIComponent(tag)}` }),
    providerRequest({ ...input, operation: "resolve_release_commit", url: `${apiBase}/commits/${encodeURIComponent(tag)}` }),
  ]);
  if (release.body?.draft || tagCommit.body?.sha !== expectedCommit) throw new ProviderCallError("invalid_response", "SOURCE_REF_MISMATCH", release.statusCode);
  const asset = Array.isArray(release.body?.assets) ? release.body.assets.find((item: any) => item?.name === input.source.sourcePath && item?.state === "uploaded") : undefined;
  if (!asset || typeof asset.browser_download_url !== "string" || typeof asset.size !== "number") {
    throw new ProviderCallError("not_found", "RELEASE_ASSET_NOT_FOUND", release.statusCode);
  }
  const digest = typeof asset.digest === "string" ? asset.digest : null;
  if (input.source.providerIntegrityDigest && digest !== input.source.providerIntegrityDigest) {
    throw new ProviderCallError("invalid_response", "INTEGRITY_MISMATCH", release.statusCode);
  }
  return {
    provider: "GITHUB",
    statusCode: release.statusCode,
    resolvedSourceRef: `${tag}@${expectedCommit}`,
    canonicalSourceUrl: repository.canonicalUrl,
    resolvedInstallationUrl: asset.browser_download_url,
    providerIntegrityDigest: digest,
    artifactSizeBytes: asset.size,
  };
}

async function resolveNpmSource(input: {
  source: SourceResolutionInput;
  accountLogin: string;
  token: string;
  correlationId: string;
  provider: "NPM";
  fetchImpl?: FetchLike;
}): Promise<SourceResolution> {
  const packageName = npmPackageIdentity(input.source.sourceUrl);
  const escapedPackage = encodeURIComponent(packageName);
  const [collaborators, version] = await Promise.all([
    providerRequest({ ...input, operation: "package_collaborators", url: `https://registry.npmjs.org/-/package/${escapedPackage}/collaborators` }),
    providerRequest({ ...input, operation: "resolve_package_version", url: `https://registry.npmjs.org/${escapedPackage}/${encodeURIComponent(input.source.sourceRef)}` }),
  ]);
  const permission = collaborators.body?.[input.accountLogin];
  if (permission !== "write" && permission !== "read-write") {
    throw new ProviderCallError("unauthorized", "OWNERSHIP_PERMISSION_REQUIRED", collaborators.statusCode);
  }
  const dist = version.body?.dist;
  if (version.body?.name !== packageName || version.body?.version !== input.source.sourceRef || typeof dist?.tarball !== "string" || typeof dist?.integrity !== "string") {
    throw new ProviderCallError("invalid_response", "PACKAGE_VERSION_INVALID", version.statusCode);
  }
  if (dist.integrity !== input.source.providerIntegrityDigest) {
    throw new ProviderCallError("invalid_response", "INTEGRITY_MISMATCH", version.statusCode);
  }
  const unpackedSize = typeof dist.unpackedSize === "number" ? dist.unpackedSize : null;
  return {
    provider: "NPM",
    statusCode: version.statusCode,
    resolvedSourceRef: version.body.version,
    canonicalSourceUrl: `https://registry.npmjs.org/${packageName}`,
    resolvedInstallationUrl: dist.tarball,
    providerIntegrityDigest: dist.integrity,
    artifactSizeBytes: unpackedSize,
  };
}
