import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";

const mocks = vi.hoisted(() => ({ exportData: vi.fn(), remove: vi.fn(), assign: vi.fn(), roles: [] as string[] }));
vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "test-client");
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: copy.en }) }));
vi.mock("@/features/account/marketplace-session", () => ({
  useMarketplaceSession: () => ({ email: "Member@Example.test", marketplaceRoles: mocks.roles, refresh: vi.fn() }),
}));
vi.mock("@/features/account/google-sign-in", () => ({
  GoogleSignIn: ({ onCredential }: { onCredential: (credential: string) => Promise<void> }) => <button type="button" onClick={() => void onCredential("fresh-google-credential")}>Continue with Google</button>,
}));
vi.mock("@/lib/api", async (original) => ({
  ...await original<typeof import("@/lib/api")>(),
  exportAccountData: mocks.exportData, deleteAccount: mocks.remove,
}));
const { ApiError } = await import("@/lib/api");
const { AccountData } = await import("./account-data");
const { accountDataCopy } = await import("./account-data-copy");
const { accountSecurityCopy } = await import("./account-security-copy");
const text = accountDataCopy.en;
const account = { email: "member@example.test", createdAt: "2026-01-01T00:00:00Z", emailVerified: true };
const withPassword = { status: "ready", profile: { ...account, hasPassword: true, connectedGoogle: false } } as const;
const googleOnly = { status: "ready", profile: { ...account, hasPassword: false, connectedGoogle: true } } as const;
const readBlob = (blob: Blob) => new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsText(blob); });

describe("account data and deletion", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.roles = [];
    vi.stubGlobal("location", { assign: mocks.assign });
    URL.createObjectURL = vi.fn(() => "blob:export");
    URL.revokeObjectURL = vi.fn();
  });

  describe("export", () => {
    it("downloads the account data as a JSON file", async () => {
      mocks.exportData.mockResolvedValue({ account: { email: "member@example.test" } });
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
      render(<AccountData profile={withPassword} />);
      fireEvent.click(screen.getByRole("button", { name: text.exportButton }));
      expect(await screen.findByText(text.exported)).toBeVisible();
      expect(click).toHaveBeenCalledOnce();
      const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
      expect(JSON.parse(await readBlob(blob))).toEqual({ account: { email: "member@example.test" } });
      click.mockRestore();
    });

    it.each([
      ["an unreachable server", new TypeError("Failed to fetch"), text.offline],
      ["a rate limit", new ApiError(429, "RATE_LIMITED", "slow"), accountSecurityCopy.en.rateLimited],
      ["a server failure", new ApiError(503, "API_ERROR", "down"), copy.en.serviceError],
      ["another rejection", new ApiError(403, "FORBIDDEN", "no"), text.exportFailed],
    ])("names the cause of %s", async (_name, failure, message) => {
      mocks.exportData.mockRejectedValue(failure);
      render(<AccountData profile={withPassword} />);
      fireEvent.click(screen.getByRole("button", { name: text.exportButton }));
      expect(await screen.findByRole("alert")).toHaveTextContent(message);
    });
  });

  describe("password account", () => {
    async function ready() {
      render(<AccountData profile={withPassword} />);
      await screen.findByLabelText(text.passwordLabel);
    }
    const confirmEmail = () => fireEvent.change(screen.getByLabelText(text.confirmLabel), { target: { value: "member@example.test" } });

    it("keeps deletion disabled until the typed email matches, ignoring case", async () => {
      await ready();
      const button = screen.getByRole("button", { name: text.deleteButton });
      expect(button).toBeDisabled();
      fireEvent.change(screen.getByLabelText(text.confirmLabel), { target: { value: "someone@else.test" } });
      expect(button).toBeDisabled();
      confirmEmail();
      expect(button).toBeEnabled();
    });

    it("deletes with the password and leaves for the home page with a full load", async () => {
      mocks.remove.mockResolvedValue(undefined);
      await ready();
      confirmEmail();
      fireEvent.change(screen.getByLabelText(text.passwordLabel), { target: { value: "correct-password" } });
      fireEvent.click(screen.getByRole("button", { name: text.deleteButton }));
      await waitFor(() => expect(mocks.assign).toHaveBeenCalledWith("/"));
      expect(mocks.remove).toHaveBeenCalledWith({ currentPassword: "correct-password" });
    });

    it.each([
      ["a wrong password", new ApiError(401, "INVALID_CURRENT_PASSWORD", "no"), text.invalidPassword],
      ["a rate limit", new ApiError(429, "RATE_LIMITED", "slow"), accountSecurityCopy.en.rateLimited],
      ["a server failure", new ApiError(500, "API_ERROR", "down"), copy.en.serviceError],
      ["an unreachable server", new TypeError("Failed to fetch"), text.offline],
      ["another rejection", new ApiError(403, "FORBIDDEN", "no"), text.deleteFailed],
    ])("names the cause of %s and keeps the account", async (_name, failure, message) => {
      mocks.remove.mockRejectedValue(failure);
      await ready();
      confirmEmail();
      fireEvent.change(screen.getByLabelText(text.passwordLabel), { target: { value: "whatever-password" } });
      fireEvent.click(screen.getByRole("button", { name: text.deleteButton }));
      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(mocks.assign).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: text.deleteButton })).toBeEnabled();
    });

    it("tells a creator with live listings to archive them and links to the studio", async () => {
      mocks.roles = ["creator"];
      mocks.remove.mockRejectedValue(new ApiError(409, "CREATOR_LISTINGS_ACTIVE", "blocked"));
      await ready();
      expect(screen.getByText(text.creatorNote)).toBeVisible();
      confirmEmail();
      fireEvent.change(screen.getByLabelText(text.passwordLabel), { target: { value: "correct-password" } });
      fireEvent.click(screen.getByRole("button", { name: text.deleteButton }));
      expect(await screen.findByRole("alert")).toHaveTextContent(text.creatorBlocked);
      expect(screen.getByRole("link", { name: text.studioLink })).toHaveAttribute("href", "/dashboard/studio");
      expect(mocks.assign).not.toHaveBeenCalled();
    });

    it("waits for the profile and explains a failed load without offering a second retry", () => {
      const { rerender } = render(<AccountData profile={{ status: "loading" }} />);
      expect(screen.getByText(text.loading)).toBeVisible();
      expect(screen.queryByLabelText(text.passwordLabel)).not.toBeInTheDocument();
      rerender(<AccountData profile={{ status: "error" }} />);
      expect(screen.getByText(text.loadError)).toBeVisible();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: copy.en.dashboardHome.retry })).not.toBeInTheDocument();
    });
  });

  describe("Google-only account", () => {

    it("asks for a fresh Google credential only after the email is confirmed", async () => {
      mocks.remove.mockResolvedValue(undefined);
      render(<AccountData profile={googleOnly} />);
      await screen.findByText(text.googleConfirm);
      expect(screen.queryByLabelText(text.passwordLabel)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(text.confirmLabel), { target: { value: "member@example.test" } });
      fireEvent.click(await screen.findByRole("button", { name: "Continue with Google" }));
      await waitFor(() => expect(mocks.assign).toHaveBeenCalledWith("/"));
      expect(mocks.remove).toHaveBeenCalledWith({ credential: "fresh-google-credential" });
    });

    it("explains a credential from the wrong Google account", async () => {
      mocks.remove.mockRejectedValue(new ApiError(401, "INVALID_GOOGLE_CREDENTIAL", "no"));
      render(<AccountData profile={googleOnly} />);
      await screen.findByText(text.googleConfirm);
      fireEvent.change(screen.getByLabelText(text.confirmLabel), { target: { value: "member@example.test" } });
      fireEvent.click(await screen.findByRole("button", { name: "Continue with Google" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(text.googleRejected);
      expect(mocks.assign).not.toHaveBeenCalled();
    });
  });
});
