import { describe, expect, it } from "vitest";
import { fetchCommand, mcpConfig, sourcePageUrl } from "./install";
import type { ProductRelease } from "./types";

const base: ProductRelease = {
  version: "1.2.3",
  current: true,
  source: { kind: "npm", url: "https://registry.npmjs.org/@acme/tool", ref: "1.2.3", path: null, integrityDigest: "sha512-x", artifactSizeBytes: null, status: "verified", checkedAt: null },
  installation: { method: "npm", url: "https://registry.npmjs.org/@acme/tool/-/tool-1.2.3.tgz" },
  permissions: [],
  environment: [],
  license: "MIT",
  mcp: null,
};
const sha = "a".repeat(40);
const withSource = (source: Partial<ProductRelease["source"]>, rest: Partial<ProductRelease> = {}): ProductRelease => ({ ...base, ...rest, source: { ...base.source, ...source } });

describe("fetchCommand", () => {
  it("pins an npm package to its exact version", () => {
    expect(fetchCommand(base)).toBe("npm install @acme/tool@1.2.3");
  });

  it("clones a repository and checks out the pinned commit", () => {
    const release = withSource({ kind: "github_repository", url: "https://github.com/acme/tool", ref: sha });
    expect(fetchCommand(release)).toBe(`git clone https://github.com/acme/tool.git\ngit -C tool checkout ${sha}`);
  });

  it("downloads a release asset and verifies a sha256 digest when one is declared", () => {
    const release = withSource(
      { kind: "github_release", url: "https://github.com/acme/tool", ref: `v1@${sha}`, path: "tool.zip", integrityDigest: `sha256:${"b".repeat(64)}` },
      { installation: { method: "download", url: "https://github.com/acme/tool/releases/download/v1/tool.zip" } },
    );
    expect(fetchCommand(release)).toBe(
      `curl -fL -o tool.zip https://github.com/acme/tool/releases/download/v1/tool.zip\necho "${"b".repeat(64)}  tool.zip" | sha256sum -c -`,
    );
  });

  it("skips verification rather than invent a digest", () => {
    const release = withSource(
      { kind: "github_release", url: "https://github.com/acme/tool", ref: `v1@${sha}`, path: "tool.zip", integrityDigest: null },
      { installation: { method: "download", url: "https://github.com/acme/tool/releases/download/v1/tool.zip" } },
    );
    expect(fetchCommand(release)).toBe("curl -fL -o tool.zip https://github.com/acme/tool/releases/download/v1/tool.zip");
  });

  it.each([
    ["a shell-metacharacter package name", withSource({ url: "https://registry.npmjs.org/x;rm -rf ~" })],
    ["a non-semver npm ref", withSource({ ref: "1.2.3 && curl evil.example" })],
    ["a non-registry npm host", withSource({ url: "https://evil.example/@acme/tool" })],
    ["a repository ref that is not a commit", withSource({ kind: "github_repository", url: "https://github.com/acme/tool", ref: "main" })],
    ["a repository host other than github.com", withSource({ kind: "github_repository", url: "https://evil.example/acme/tool", ref: sha })],
    ["an asset name with a path or spaces", withSource({ kind: "github_release", url: "https://github.com/acme/tool", ref: `v1@${sha}`, path: "../x y" })],
    ["an unknown source kind", withSource({ kind: "ftp" })],
  ])("returns null for %s", (_label, release) => {
    expect(fetchCommand(release)).toBeNull();
  });
});

describe("mcpConfig", () => {
  const mcp = { transport: "stdio" };

  it("runs a stdio npm server at its pinned version, with placeholders for required env vars", () => {
    const release = {
      ...base,
      mcp,
      environment: [
        { name: "ACME_TOKEN", purpose: "Auth", required: true, sensitive: true },
        { name: "ACME_REGION", purpose: "Region", required: true, sensitive: false },
        { name: "ACME_DEBUG", purpose: "Debug", required: false, sensitive: false },
        { name: "bad name", purpose: "x", required: true, sensitive: false },
      ],
    };
    expect(JSON.parse(mcpConfig(release, "acme-tool")!)).toEqual({
      mcpServers: { "acme-tool": { command: "npx", args: ["-y", "@acme/tool@1.2.3"], env: { ACME_TOKEN: "<your-secret>", ACME_REGION: "<your-value>" } } },
    });
  });

  it("omits env entirely when nothing is required", () => {
    expect(JSON.parse(mcpConfig({ ...base, mcp }, "acme-tool")!).mcpServers["acme-tool"]).toEqual({ command: "npx", args: ["-y", "@acme/tool@1.2.3"] });
  });

  it.each([
    ["not an MCP server", { ...base, mcp: null }],
    ["a remote transport", { ...base, mcp: { transport: "streamable_http" } }],
    ["a non-npm source", withSource({ kind: "github_repository", url: "https://github.com/acme/tool", ref: sha }, { mcp })],
    ["an unsafe package", withSource({ ref: "1.0.0;x" }, { mcp })],
  ])("offers no snippet for %s", (_label, release) => {
    expect(mcpConfig(release, "acme-tool")).toBeNull();
  });

  it("offers no snippet for a slug that is not a plain key", () => {
    expect(mcpConfig({ ...base, mcp }, "Bad Slug")).toBeNull();
  });
});

describe("sourcePageUrl", () => {
  it("links npm to the package page and GitHub to the repository", () => {
    expect(sourcePageUrl(base)).toBe("https://www.npmjs.com/package/@acme/tool");
    expect(sourcePageUrl(withSource({ kind: "github_repository", url: "https://github.com/acme/tool.git", ref: sha }))).toBe("https://github.com/acme/tool");
  });

  it("links nothing for a host it does not recognise", () => {
    expect(sourcePageUrl(withSource({ kind: "github_repository", url: "https://evil.example/acme/tool" }))).toBeNull();
  });
});
