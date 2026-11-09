import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithLocale } from "@/lib/test-render";
import type { MarketplaceInstallation } from "@/lib/types";
import { InstallDialogContent } from "./install-dialog";

const installation = (commands?: NonNullable<MarketplaceInstallation["release"]["installation"]["commands"]>): MarketplaceInstallation => ({
  acquisition: { id: "order-1", status: "completed", acquiredAt: "2026-09-18T10:00:00.000Z" },
  product: { slug: "tool", name: "Tool" },
  release: {
    id: "release-1", version: "1.0.0",
    source: { kind: "external_link", url: "https://example.com/tool", ref: "", path: null, integrityDigest: null, artifactSizeBytes: null, status: "link_only", checkedAt: null },
    installation: { method: "npm", url: "https://example.com/tool", instructions: ["Run a command"], commands },
    requirements: { runtimes: [], accounts: [], operatingSystems: [], dependencies: [] },
    license: "MIT", documentationUrl: null, supportUrl: null,
  },
});

const renderDialog = (data: MarketplaceInstallation) => renderWithLocale(
  <InstallDialogContent installation={data} onOpenChange={() => {}} trigger={{ current: null }} />,
);

describe("InstallDialogContent commands", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("shows no command section when the release declares none", () => {
    renderDialog(installation());
    expect(screen.queryByText("Install commands")).not.toBeInTheDocument();
  });

  it("groups commands by system, opens the reader's own system first and switches on demand", () => {
    vi.stubGlobal("navigator", { ...navigator, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)" });
    renderDialog(installation([
      { os: "macos", label: "Homebrew", command: "brew install tool" },
      { os: "linux", command: "curl -fsSL https://example.com/install.sh | sh" },
      { os: "any", label: "npm", command: "npm install -g tool" },
    ]));
    expect(screen.getByRole("button", { name: "macOS" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("brew install tool")).toBeInTheDocument();
    expect(screen.queryByText("npm install -g tool")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Copy" })).toHaveLength(2); // the command and the source link

    fireEvent.click(screen.getByRole("button", { name: "Linux" }));
    expect(screen.getByRole("button", { name: "Linux" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("curl -fsSL https://example.com/install.sh | sh").closest("pre")).toHaveAttribute("dir", "ltr");
    expect(screen.queryByText("brew install tool")).not.toBeInTheDocument();
  });

  it("skips the system switch when every command applies to any system", () => {
    renderDialog(installation([{ os: "any", command: "npx tool@latest" }]));
    expect(screen.getByText("npx tool@latest")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Operating system" })).not.toBeInTheDocument();
  });
});
