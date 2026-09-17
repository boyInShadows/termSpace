import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), update: vi.fn() }));
const refresh = vi.hoisted(() => vi.fn());
const sessionState = vi.hoisted(() => ({ loading: false, email: "reader@example.com" as string | null, emailVerified: true, marketplaceRoles: [] as string[], refresh }));

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, getOwnedCreatorProfile: apiMocks.get, createCreatorProfile: apiMocks.create, updateCreatorProfile: apiMocks.update };
});
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => sessionState }));
vi.mock("@/lib/locale-context", () => ({
  useLocale: () => ({ locale: "en", t: {
    signIn: "Sign in", verifyEmail: "Verify your email", wait: "Please wait…",
    creatorHub: {
      title: "Become a TermSpace creator", intro: "Create your identity", onboardingEyebrow: "Creator onboarding",
      profileEyebrow: "Creator profile", editTitle: "Your creator profile", editIntro: "Keep it current",
      name: "Public name", nameHelp: "Use English characters", handle: "Creator handle", handleHelp: "Handle help", handleLocked: "Handle locked",
      bio: "Biography", create: "Create creator profile", save: "Save profile", saved: "Creator profile saved.",
      loading: "Loading", signInRequired: "Sign in required", verifyRequired: "Verify required",
      handleTaken: "Handle taken", accessRevoked: "Access revoked", loadError: "Load failed", saveError: "Save failed",
    },
  } }),
}));

const { ApiError } = await import("@/lib/api");
const { CreatorHub } = await import("./creator-hub");

describe("CreatorHub", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    sessionState.loading = false;
    sessionState.email = "reader@example.com";
    sessionState.emailVerified = true;
    apiMocks.get.mockRejectedValue(new ApiError(404, "CREATOR_PROFILE_NOT_FOUND", "Not found"));
    refresh.mockResolvedValue(undefined);
  });

  it("gates onboarding behind email verification", () => {
    sessionState.emailVerified = false;
    render(<CreatorHub />);
    expect(screen.getByText("Verify required")).toBeInTheDocument();
    expect(apiMocks.get).not.toHaveBeenCalled();
  });

  it("creates a creator profile from the onboarding form", async () => {
    apiMocks.create.mockResolvedValue({
      id: "creator-1", name: "Tool Builder", handle: "tool-builder", initials: "TB", verified: false,
      bio: "I build dependable agentic coding tools for teams.", followers: 0, products: 0,
      createdAt: "2026-09-15T00:00:00.000Z", updatedAt: "2026-09-15T00:00:00.000Z", accessActive: true,
    });
    render(<CreatorHub />);
    await screen.findByLabelText("Public name");
    fireEvent.change(screen.getByLabelText("Public name"), { target: { value: "Tool Builder" } });
    fireEvent.change(screen.getByLabelText("Creator handle"), { target: { value: "tool-builder" } });
    fireEvent.change(screen.getByLabelText("Biography"), { target: { value: "I build dependable agentic coding tools for teams." } });
    fireEvent.click(screen.getByRole("button", { name: "Create creator profile" }));

    await waitFor(() => expect(apiMocks.create).toHaveBeenCalledWith({ name: "Tool Builder", handle: "tool-builder", bio: "I build dependable agentic coding tools for teams." }));
    expect(await screen.findByText("Creator profile saved.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("marks creator public names as English-only", async () => {
    render(<CreatorHub />);
    const input = await screen.findByLabelText("Public name");
    expect(input).toHaveAttribute("lang", "en");
    expect(input).toHaveAttribute("dir", "ltr");
    expect(input).toHaveAttribute("pattern", "(?=.*[A-Za-z])[\\x20-\\x7E]+");
    expect(screen.getByText("Use English characters")).toBeInTheDocument();
  });
});
