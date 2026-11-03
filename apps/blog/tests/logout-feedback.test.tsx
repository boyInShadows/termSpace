import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ReaderAccount } from "@/components/ReaderAccount";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

const mocks = vi.hoisted(() => ({
  logoutReader: vi.fn(), logoutAdmin: vi.fn(), replace: vi.fn(), refresh: vi.fn(),
  getReaderProfile: vi.fn(), getReaderLibrary: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ api: mocks }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it("keeps the reader signed in after failed logout and allows a retry", async () => {
  mocks.getReaderProfile.mockResolvedValue({ data: { email: "reader@example.test", createdAt: "2026-01-01", hasPassword: false } });
  mocks.getReaderLibrary.mockResolvedValue({ data: { bookmarks: [], history: [] } });
  mocks.logoutReader.mockRejectedValueOnce(new Error("Service unavailable")).mockResolvedValueOnce({});
  const user = userEvent.setup();
  render(<ReaderAccount />);
  await user.click(await screen.findByRole("button", { name: "Sign out" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
  expect(screen.getByRole("heading", { name: "reader@example.test" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findByRole("heading", { name: "Sync your library" })).toBeInTheDocument();
});

it("only leaves the admin workspace after successful logout", async () => {
  mocks.logoutAdmin.mockRejectedValueOnce(new Error("Service unavailable")).mockResolvedValueOnce({});
  const user = userEvent.setup();
  render(<AdminLogoutButton />);
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
  expect(mocks.replace).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(mocks.replace).toHaveBeenCalledWith("/admin/login");
  expect(mocks.refresh).toHaveBeenCalledOnce();
});
