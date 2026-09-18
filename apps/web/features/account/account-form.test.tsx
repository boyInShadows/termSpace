import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getMarketplaceLibrary = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ email: "reader@example.com", refresh: vi.fn() }));
const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  getMarketplaceLibrary,
}));
vi.mock("./marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: { account: "Your account", signedInAs: "Signed in as", signOut: "Sign out" } }) }));

const { AccountForm } = await import("./account-form");

describe("marketplace account library", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    getMarketplaceLibrary.mockResolvedValue({
      data: [{
        acquisitionId: "order-1", acquiredAt: "2026-09-18T10:00:00.000Z",
        product: { id: "product-1", slug: "owned-skill", name: "Owned Skill", type: "Skill", typeKey: "skill", outcome: "Completes a useful task", creator: { name: "Creator", handle: "creator" } },
        release: { id: "release-1", version: "1.0.0", sourceStatus: "verified" }, installationAvailable: true,
      }],
      meta: { page: 1, limit: 24, total: 1, totalPages: 1 },
    });
  });

  it("shows acquired resources and links back to their gated installation", async () => {
    render(<AccountForm />);
    expect(await screen.findByRole("heading", { name: "Owned Skill" })).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View installation" })).toHaveAttribute("href", "/products/owned-skill");
  });
});
