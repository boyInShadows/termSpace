import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProductRelease } from "@/lib/types";
import { ReleaseFacts } from "./release-facts";

const release: ProductRelease = {
  version: "2.3.0", current: false,
  source: { kind: "npm", url: "https://registry.npmjs.org/@acme/tool", ref: "2.3.0", path: null, integrityDigest: "sha512-abc", artifactSizeBytes: null, status: "verified", checkedAt: null },
  installation: { method: "npm", url: "https://registry.npmjs.org/@acme/tool/-/tool-2.3.0.tgz" },
  permissions: [
    { capability: "filesystem_read", required: true, scope: null, destinations: [], purpose: "Reads files" },
    { capability: "network_access", required: false, scope: null, destinations: ["api.acme.test"], purpose: "Fetches data" },
  ],
  environment: [], license: "MIT", mcp: null,
};

describe("ReleaseFacts", () => {
  it("describes an earlier release from its own declarations", () => {
    render(<dl><ReleaseFacts release={release} locale="en" /></dl>);

    expect(screen.getByText("Read files · Network access")).toBeInTheDocument();
    expect(screen.getByText("MIT")).toBeInTheDocument();
    expect(screen.getByText("v2.3.0")).toBeInTheDocument();
    expect(screen.getByText("2.3.0")).toBeInTheDocument();
    expect(screen.getByText("sha512-abc")).toBeInTheDocument();
  });

  it("uses the listing's own summaries for the current release", () => {
    render(<dl><ReleaseFacts release={{ ...release, current: true }} locale="en" summary={{ permissions: "Reads the diff · no network access", license: "Apache-2.0" }} /></dl>);

    expect(screen.getByText("Reads the diff · no network access")).toBeInTheDocument();
    expect(screen.getByText("Apache-2.0")).toBeInTheDocument();
  });

  it("prints what is not declared instead of hiding the row", () => {
    render(<dl><ReleaseFacts release={{ ...release, permissions: [], license: null, source: { ...release.source, integrityDigest: null, status: "stale" } }} locale="en" /></dl>);

    expect(screen.getByText("Not declared")).toBeInTheDocument();
    expect(screen.getByText("Not stated")).toBeInTheDocument();
    expect(screen.getByText("Not provided by the source")).toBeInTheDocument();
    expect(screen.getByText(/source check overdue/)).toBeInTheDocument();
  });

  it("renders in Persian without English chrome", () => {
    render(<dl><ReleaseFacts release={release} locale="fa" /></dl>);

    expect(screen.getByText("خواندن فایل‌ها · دسترسی به شبکه")).toBeInTheDocument();
    expect(screen.queryByText("Permissions")).not.toBeInTheDocument();
  });
});
