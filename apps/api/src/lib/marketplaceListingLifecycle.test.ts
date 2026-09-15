import { describe, expect, it } from "vitest";
import type { MarketplaceManifestV1 } from "./marketplaceManifest.js";
import { MarketplaceLifecycleError, marketplaceProductProjectionFromManifest, resolveMarketplaceListingTransition } from "./marketplaceListingLifecycle.js";

function context(overrides: Partial<Parameters<typeof resolveMarketplaceListingTransition>[0]> = {}) {
  return { state: "DRAFT" as const, published: false, hasApprovedSnapshot: false, hasProposedSnapshot: true, resumeState: null, resumePublished: null, ...overrides };
}

describe("marketplace listing lifecycle", () => {
  it("submits a saved proposal and supports actionable review outcomes", () => {
    expect(resolveMarketplaceListingTransition(context(), "SUBMIT", "CREATOR").state).toBe("SUBMITTED");
    expect(resolveMarketplaceListingTransition(context({ state: "SUBMITTED" }), "REQUEST_CHANGES", "MODERATOR").state).toBe("CHANGES_REQUESTED");
    expect(resolveMarketplaceListingTransition(context({ state: "SUBMITTED" }), "REJECT", "MODERATOR").state).toBe("REJECTED");
  });

  it("locks approval to the proposal and promotes that exact snapshot on publication", () => {
    const approved = resolveMarketplaceListingTransition(context({ state: "SUBMITTED" }), "APPROVE", "MODERATOR");
    expect(approved).toEqual(expect.objectContaining({ state: "APPROVED", approvedSnapshot: "keep", proposedSnapshot: "keep" }));
    const published = resolveMarketplaceListingTransition(context({ state: "APPROVED" }), "PUBLISH", "MODERATOR");
    expect(published).toEqual(expect.objectContaining({ state: "PUBLISHED", approvedSnapshot: "promote-proposed", proposedSnapshot: "clear", published: true }));
  });

  it("keeps an approved public listing visible while an edit is reviewed or rejected", () => {
    const submitted = context({ state: "SUBMITTED", published: true, hasApprovedSnapshot: true });
    expect(resolveMarketplaceListingTransition(submitted, "REJECT", "MODERATOR").published).toBe(true);
    expect(resolveMarketplaceListingTransition(submitted, "REQUEST_CHANGES", "MODERATOR").published).toBe(true);
  });

  it("round-trips suspension without losing the active review state", () => {
    const suspended = resolveMarketplaceListingTransition(context({ state: "SUBMITTED", published: true, hasApprovedSnapshot: true }), "SUSPEND", "ADMINISTRATOR");
    expect(suspended).toEqual(expect.objectContaining({ state: "SUSPENDED", published: false, resumeState: "SUBMITTED", resumePublished: true }));
    const restored = resolveMarketplaceListingTransition(context({ state: "SUSPENDED", published: false, resumeState: suspended.resumeState, resumePublished: suspended.resumePublished }), "REINSTATE", "MODERATOR");
    expect(restored).toEqual(expect.objectContaining({ state: "SUBMITTED", published: true, resumeState: null, resumePublished: null }));
  });

  it("prevents creators from approving and rejects invalid transitions", () => {
    expect(() => resolveMarketplaceListingTransition(context({ state: "SUBMITTED" }), "APPROVE", "CREATOR")).toThrow(MarketplaceLifecycleError);
    expect(() => resolveMarketplaceListingTransition(context({ hasProposedSnapshot: false }), "SUBMIT", "CREATOR")).toThrowError(expect.objectContaining({ code: "PROPOSED_SNAPSHOT_REQUIRED" }));
    expect(() => resolveMarketplaceListingTransition(context(), "PUBLISH", "ADMINISTRATOR")).toThrowError(expect.objectContaining({ code: "INVALID_LISTING_TRANSITION" }));
  });

  it("projects the approved manifest into the public product record", () => {
    const manifest = {
      type: "prompt",
      listing: { slug: "review-prompt", name: { en: "Review Prompt" }, outcome: { en: "Reviews code" }, description: { en: "A careful reviewer" }, tags: ["review"] },
      release: {
        version: "2.0",
        compatibility: [{ platform: "codex", models: ["gpt-5"] }, { platform: "cursor", models: ["gpt-5"] }],
        installation: { instructions: ["Copy prompt.md"] },
        requirements: { runtimes: [], accounts: [], operatingSystems: [], dependencies: [], environmentVariables: [{ name: "API_TOKEN" }] },
        permissions: [{ capability: "network_access", purpose: "Fetch pull requests" }],
        license: { identifier: "MIT" },
      },
    } as unknown as MarketplaceManifestV1;

    expect(marketplaceProductProjectionFromManifest(manifest, "category-1")).toEqual(expect.objectContaining({
      slug: "review-prompt", name: "Review Prompt", type: "Prompt", itemType: "PROMPT", categoryId: "category-1",
      platforms: ["codex", "cursor"], models: ["gpt-5"], version: "2.0", requirements: "API_TOKEN",
      permissions: "network_access: Fetch pull requests", license: "MIT",
    }));
  });
});
