import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";
import { creatorWorkspace } from "./workspace-copy";

const api = vi.hoisted(() => ({ get: vi.fn(), connect: vi.fn(), revoke: vi.fn() }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), getProviderConnections: api.get, connectProvider: api.connect, revokeProvider: api.revoke }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: copy.en }) }));
const { ProviderConnections } = await import("./provider-connections");
const text = creatorWorkspace.en.creatorReleases;

describe("Provider connections", () => {
  beforeEach(() => { vi.clearAllMocks(); api.get.mockResolvedValue([]); api.connect.mockResolvedValue({ provider: "github", accountLogin: "source-owner", revokedAt: null }); api.revoke.mockResolvedValue(undefined); });

  it("connects and revokes without a listing, clearing credentials after submission", async () => {
    render(<ProviderConnections />);
    const input = (await screen.findAllByLabelText(text.tokenLabel))[0];
    fireEvent.change(input, { target: { value: "test-only-credential" } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByText("source-owner")).toBeVisible();
    expect(api.connect).toHaveBeenCalledWith("github", "test-only-credential");
    fireEvent.click(screen.getByRole("button", { name: text.disconnect }));
    await waitFor(() => expect(api.revoke).toHaveBeenCalledWith("github"));
    const cleared = (await screen.findAllByLabelText(text.tokenLabel))[0];
    expect(cleared).toHaveValue("");
    expect(screen.queryByText("source-owner")).not.toBeInTheDocument();
  });

  it("retries a provider load and clears a rejected token while retaining other connections", async () => {
    api.get.mockRejectedValueOnce(new Error("offline")).mockResolvedValue([{ provider: "npm", accountLogin: "npm-owner", revokedAt: null }]);
    api.connect.mockRejectedValue(new Error("rejected"));
    render(<ProviderConnections />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Provider connections could not be loaded.");
    fireEvent.click(screen.getByRole("button", { name: text.retry }));
    const input = await screen.findByLabelText(text.tokenLabel);
    fireEvent.change(input, { target: { value: "rejected-test-token" } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(text.actionError);
    expect(input).toHaveValue("");
    expect(screen.getByText("npm-owner")).toBeVisible();
  });

  it("keeps a connection when revocation fails", async () => {
    api.get.mockResolvedValue([{ provider: "github", accountLogin: "keep-owner", revokedAt: null }]);
    api.revoke.mockRejectedValue(new Error("offline"));
    render(<ProviderConnections />);
    const region = screen.getByRole("region", { name: text.connectionsTitle });
    fireEvent.click(await within(region).findByRole("button", { name: text.disconnect }));
    expect(await screen.findByRole("alert")).toHaveTextContent(text.actionError);
    expect(screen.getByText("keep-owner")).toBeVisible();
  });
});
