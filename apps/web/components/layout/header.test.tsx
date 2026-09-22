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
      screen.getByRole("link", { name: "Design system" }),
    ).not.toHaveAttribute("aria-current");
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
