import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getMarketplaceLibrary = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => ({ login: vi.fn(), register: vi.fn() }));
const session = vi.hoisted(() => ({ loading: false, email: "reader@example.com" as string | null, emailVerified: true, refresh: vi.fn() }));
const replace = vi.hoisted(() => vi.fn());
const navigation = vi.hoisted(() => ({ search: "" }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }), useSearchParams: () => new URLSearchParams(navigation.search) }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  getMarketplaceLibrary,
  login: auth.login, register: auth.register,
}));
vi.mock("./marketplace-session", () => ({ useMarketplaceSession: () => session }));

const { AccountForm, DashboardAccount } = await import("./account-form");

describe("marketplace account library", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.email = "reader@example.com";
    session.emailVerified = true;
    navigation.search = "";
    auth.login.mockResolvedValue(undefined);
    auth.register.mockResolvedValue(undefined);
    session.refresh.mockResolvedValue(undefined);
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
    render(<DashboardAccount />);
    expect(await screen.findByRole("heading", { name: "Owned Skill" })).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View installation" })).toHaveAttribute("href", "/products/owned-skill");
    expect(screen.getByText("Email verified")).toBeInTheDocument();
  });

  it("sends signed-in visitors from the old account page into the dashboard", () => {
    render(<AccountForm />);
    expect(replace).toHaveBeenCalledWith("/dashboard");
    expect(getMarketplaceLibrary).not.toHaveBeenCalled();
  });

  it("keeps a local dashboard return path and rejects external or sign-in loops", () => {
    navigation.search = "next=%2Ffa%2Fdashboard%2Fcreator%3Ftab%3Ddrafts";
    const { unmount } = render(<AccountForm />);
    expect(replace).toHaveBeenCalledWith("/fa/dashboard/creator?tab=drafts");
    unmount();
    for (const next of ["//example.com", "/\\example.com", "/account?next=/account"]) {
      navigation.search = new URLSearchParams({ next }).toString();
      const view = render(<AccountForm />);
      expect(replace).toHaveBeenLastCalledWith("/dashboard");
      view.unmount();
    }
  });

  it.each(["login", "register"])("keeps the %s flow working after the account move", async (mode) => {
    session.email = null;
    render(<AccountForm />);
    if (mode === "register") fireEvent.click(screen.getByRole("button", { name: "Need an account? Register" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "reader@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "example-password" } });
    fireEvent.click(screen.getByRole("button", { name: mode === "login" ? "Sign in" : "Create account" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith(mode === "login" ? "/dashboard" : "/account/verify-email"));
    expect(mode === "login" ? auth.login : auth.register).toHaveBeenCalledWith("reader@example.com", "example-password");
  });
});
