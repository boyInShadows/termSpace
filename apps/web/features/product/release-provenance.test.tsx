import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReleaseProvenance } from "./release-provenance";
import type { ProductRelease } from "@/lib/types";

const release: ProductRelease = {
  version: "1.2.3",
  current: true,
  source: { kind: "npm", url: "https://registry.npmjs.org/@acme/tool", ref: "1.2.3", path: null, integrityDigest: "sha512-abc", artifactSizeBytes: null, status: "verified", checkedAt: "2026-10-01T00:00:00Z" },
  installation: { method: "npm", url: "https://registry.npmjs.org/@acme/tool/-/tool-1.2.3.tgz" },
  permissions: [{ capability: "network_access", required: true, scope: null, destinations: ["api.acme.test"], purpose: "Calls the Acme API" }],
  environment: [{ name: "ACME_TOKEN", purpose: "Auth", required: true, sensitive: true }],
  license: "MIT",
  mcp: { transport: "stdio" },
};

describe("ReleaseProvenance", () => {
  it("shows the pinned source, declared permissions and the fetch command", () => {
    render(<ReleaseProvenance release={release} slug="acme-tool" locale="en" />);

    expect(screen.getByText(/npm package/)).toBeInTheDocument();
    expect(screen.getByText("sha512-abc")).toBeInTheDocument();
    expect(screen.getByText(/Network access/)).toBeInTheDocument();
    expect(screen.getByText("api.acme.test")).toBeInTheDocument();
    expect(screen.getByText("ACME_TOKEN")).toBeInTheDocument();
    expect(screen.getByText("npm install @acme/tool@1.2.3")).toBeInTheDocument();
    expect(screen.getByText(/not a guarantee of safety/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /npmjs\.com\/package\/@acme\/tool/ })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("offers an MCP config only for a stdio npm server", () => {
    const { rerender } = render(<ReleaseProvenance release={release} slug="acme-tool" locale="en" />);
    expect(screen.getByText("MCP client config")).toBeInTheDocument();

    rerender(<ReleaseProvenance release={{ ...release, mcp: null }} slug="acme-tool" locale="en" />);
    expect(screen.queryByText("MCP client config")).not.toBeInTheDocument();
  });

  it("flags an overdue source check and says when there is no digest", () => {
    render(<ReleaseProvenance release={{ ...release, source: { ...release.source, status: "stale", integrityDigest: null } }} slug="acme-tool" locale="en" />);

    expect(screen.getByText(/last source check is overdue/)).toBeInTheDocument();
    expect(screen.getByText("The source did not provide one")).toBeInTheDocument();
  });

  it("renders in Persian without English chrome", () => {
    render(<ReleaseProvenance release={release} slug="acme-tool" locale="fa" />);

    expect(screen.getByText(/بستهٔ npm/)).toBeInTheDocument();
    expect(screen.getByText(/دسترسی به شبکه/)).toBeInTheDocument();
    expect(screen.queryByText("Declared permissions")).not.toBeInTheDocument();
  });
});
