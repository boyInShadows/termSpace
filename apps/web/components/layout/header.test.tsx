import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "./header";

let pathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/features/account/marketplace-session", () => ({
  useMarketplaceSession: () => ({ marketplaceRoles: [], email: null }),
}));

vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme: () => {} }) }));

describe("Header", () => {
  beforeEach(() => {
    pathname = "/";
    window.localStorage.clear();
  });

  it("marks the current route for sighted and assistive readers alike", () => {
    pathname = "/explore";
    render(<Header />);
    const explore = screen.getAllByRole("link", { name: "Explore" });
    expect(explore.some((link) => link.getAttribute("aria-current") === "page")).toBe(
      true,
    );
  });

  it("does not mark a route the reader is not on", () => {
    pathname = "/explore";
    render(<Header />);
    expect(
      screen.getByRole("link", { name: "Share your work" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("points Share your work at the dashboard studio and has no Design system link", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: "Share your work" })).toHaveAttribute(
      "href",
      "/dashboard/studio",
    );
    expect(screen.queryByRole("link", { name: "Design system" })).not.toBeInTheDocument();
  });

  it("closes the mobile menu on Escape and returns focus to its button", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    const closed = screen.getByRole("button", { name: "Open menu" });
    expect(closed).toHaveAttribute("aria-expanded", "false");
    expect(closed).toHaveFocus();
  });

  it("dismisses the announcement and remembers it for next time", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Header />);

    await user.click(
      screen.getByRole("button", { name: "Dismiss announcement" }),
    );
    expect(
      screen.queryByRole("button", { name: "Dismiss announcement" }),
    ).not.toBeInTheDocument();

    unmount();
    render(<Header />);
    expect(
      screen.queryByRole("button", { name: "Dismiss announcement" }),
    ).not.toBeInTheDocument();
  });

  it("shows a fresh announcement to someone who dismissed the previous one", () => {
    window.localStorage.setItem(
      "termspace:announcement-dismissed",
      "some-older-announcement",
    );
    render(<Header />);
    expect(
      screen.getByRole("button", { name: "Dismiss announcement" }),
    ).toBeInTheDocument();
  });

  it("offers the language switch as a labelled control, not bare text", () => {
    render(<Header />);
    const [switcher] = screen.getAllByRole("link", { name: "فارسی" });
    expect(switcher).toHaveAttribute("lang", "fa");
    expect(switcher).toHaveAttribute("href", "/fa");
  });

  it("names the theme toggle by where it takes you", () => {
    render(<Header />);
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
  });
});
