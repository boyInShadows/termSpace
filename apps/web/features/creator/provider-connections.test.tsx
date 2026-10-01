import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn(), connect: vi.fn(), revoke: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  getProviderConnections: api.get, connectProvider: api.connect, revokeProvider: api.revoke,
}));
const { ProviderConnections } = await import("./provider-connections");

describe("provider connections dashboard", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue([]);
    api.connect.mockResolvedValue({ provider: "github", accountLogin: "tool-builder", revokedAt: null });
    api.revoke.mockResolvedValue(undefined);
  });

  it("connects and disconnects GitHub without needing a listing, and clears the token", async () => {
    render(<ProviderConnections />);
    await screen.findByRole("heading", { name: "GitHub" });
    const token = screen.getAllByLabelText("Access token")[0];
    fireEvent.change(token, { target: { value: "private-token" } });
    fireEvent.submit(token.closest("form")!);
    await waitFor(() => expect(api.connect).toHaveBeenCalledWith("github", "private-token"));
    expect(await screen.findByText("tool-builder")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    await waitFor(() => expect(api.revoke).toHaveBeenCalledWith("github"));
    expect(await screen.findByLabelText("Access token", { selector: "#github-token" })).toHaveValue("");
  });

  it("keeps failed loads recoverable and clears failed connection credentials", async () => {
    api.get.mockRejectedValueOnce(new Error("Unavailable"));
    api.connect.mockRejectedValueOnce(new Error("Invalid token"));
    render(<ProviderConnections />);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    await screen.findByRole("heading", { name: "GitHub" });
    const token = screen.getAllByLabelText("Access token")[0];
    fireEvent.change(token, { target: { value: "invalid-token" } });
    fireEvent.submit(token.closest("form")!);
    await waitFor(() => expect(token).toHaveValue(""));
    expect(screen.getByRole("status")).toHaveTextContent(/could not|failed|try again/i);
  });
});
