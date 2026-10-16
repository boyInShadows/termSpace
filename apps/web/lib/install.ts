import type { ProductRelease } from "@/lib/types";

/**
 * Commands and config a reader pastes into a terminal or an MCP client. Every
 * value comes from creator-submitted data, so each one is checked against a
 * strict pattern first and the builder returns null rather than guess. The API
 * validates the same fields; this is the last line before a shell.
 */
const NPM_PACKAGE = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const COMMIT = /^[0-9a-f]{40}$/;
const GITHUB_REPO = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/;
const GITHUB_URL = /^https:\/\/github\.com\/[A-Za-z0-9_./%@:+~=-]+$/;
const ASSET_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SHA256 = /^sha256:([0-9a-f]{64})$/;
const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

function npmPackage(release: ProductRelease): { name: string; version: string } | null {
  let name: string;
  try {
    const url = new URL(release.source.url);
    if (url.protocol !== "https:" || url.hostname !== "registry.npmjs.org") return null;
    name = decodeURIComponent(url.pathname.slice(1));
  } catch {
    return null;
  }
  const version = release.source.ref;
  return NPM_PACKAGE.test(name) && SEMVER.test(version) ? { name, version } : null;
}

/** The human-facing page for a release's source, or null if it is not a recognised host. */
export function sourcePageUrl(release: ProductRelease): string | null {
  if (release.source.kind === "npm") {
    const pkg = npmPackage(release);
    return pkg ? `https://www.npmjs.com/package/${pkg.name}` : null;
  }
  const repo = GITHUB_REPO.exec(release.source.url);
  return repo ? `https://github.com/${repo[1]}/${repo[2]}` : null;
}

/** The commands that fetch the exact pinned artifact, or null if any input looks unsafe. */
export function fetchCommand(release: ProductRelease): string | null {
  const { kind, url, ref, path, integrityDigest } = release.source;
  if (kind === "npm") {
    const pkg = npmPackage(release);
    return pkg ? `npm install ${pkg.name}@${pkg.version}` : null;
  }
  if (kind === "github_repository") {
    const repo = GITHUB_REPO.exec(url);
    if (!repo || !COMMIT.test(ref)) return null;
    return [`git clone https://github.com/${repo[1]}/${repo[2]}.git`, `git -C ${repo[2]} checkout ${ref}`].join("\n");
  }
  if (kind === "github_release") {
    if (!path || !ASSET_NAME.test(path) || !GITHUB_URL.test(release.installation.url)) return null;
    const lines = [`curl -fL -o ${path} ${release.installation.url}`];
    const digest = integrityDigest ? SHA256.exec(integrityDigest) : null;
    if (digest) lines.push(`echo "${digest[1]}  ${path}" | sha256sum -c -`);
    return lines.join("\n");
  }
  return null;
}

/**
 * An `mcpServers` entry, only where it can be derived without guessing: a stdio
 * server published on npm, run at its pinned version. Other transports and
 * sources have free-text connection details, so no snippet is offered.
 */
export function mcpConfig(release: ProductRelease, slug: string): string | null {
  if (release.mcp?.transport !== "stdio" || release.source.kind !== "npm" || !SLUG.test(slug)) return null;
  const pkg = npmPackage(release);
  if (!pkg) return null;
  const env = Object.fromEntries(
    release.environment
      .filter((variable) => variable.required && ENV_NAME.test(variable.name))
      .map((variable) => [variable.name, variable.sensitive ? "<your-secret>" : "<your-value>"]),
  );
  return JSON.stringify({
    mcpServers: { [slug]: { command: "npx", args: ["-y", `${pkg.name}@${pkg.version}`], ...(Object.keys(env).length ? { env } : {}) } },
  }, null, 2);
}
