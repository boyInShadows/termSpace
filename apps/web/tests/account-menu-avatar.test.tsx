import { act, screen, waitFor } from "@testing-library/react";
import { renderWithLocale as render } from "@/lib/test-render";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountMenu } from "@/components/layout/account-menu";
import { ApiError } from "@/lib/api";

const getProfile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  getOwnedCreatorProfile: () => getProfile(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => ({ refresh: vi.fn() }) }));

describe("header account identity", () => {
  beforeEach(() => { getProfile.mockReset(); });

  it.each([["Ada Augusta Lovelace", "AL"], ["علی رضایی", "عر"], ["Ada", "AD"]])("uses public-name initials for %s", async (name, initials) => {
    getProfile.mockResolvedValue({ name, avatarUrl: null });
    render(<AccountMenu email="unrelated@example.com" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Your account" })).toHaveTextContent(initials));
    expect(screen.getByRole("button", { name: "Your account" }).querySelector("svg")).toBeNull();
  });

  it("uses an existing profile image with initials beneath it", async () => {
    getProfile.mockResolvedValue({ name: "Ada Lovelace", avatarUrl: "https://avatars.githubusercontent.com/u/1" });
    render(<AccountMenu email="ada@example.com" />);
    const button = screen.getByRole("button", { name: "Your account" });
    await waitFor(() => expect(button.querySelector("img")).toHaveAttribute("src", "https://avatars.githubusercontent.com/u/1"));
    expect(button).toHaveTextContent("AL");
  });

  it("does not invent initials from an email when no public profile exists", async () => {
    getProfile.mockRejectedValue(new ApiError(404, "CREATOR_PROFILE_NOT_FOUND", "No profile"));
    render(<AccountMenu email="unrelated@example.com" />);
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Your account" })).toHaveTextContent("?");
  });

  it("ignores the previous account's late profile response", async () => {
    let resolveOld!: (profile: { name: string; avatarUrl: null }) => void;
    getProfile.mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve; }));
    getProfile.mockResolvedValueOnce({ name: "Grace Hopper", avatarUrl: null });
    const { rerender } = render(<AccountMenu email="old@example.com" />);
    rerender(<AccountMenu email="new@example.com" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Your account" })).toHaveTextContent("GH"));
    await act(async () => resolveOld({ name: "Old Account", avatarUrl: null }));
    expect(screen.getByRole("button", { name: "Your account" })).toHaveTextContent("GH");
  });
});
