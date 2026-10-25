import { act, screen } from "@testing-library/react";
import { renderWithLocale as render } from "@/lib/test-render";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "./header";

let pathname = "/";
let session: { marketplaceRoles: string[]; email: string | null; refresh: () => Promise<void> } = {
  marketplaceRoles: [],
  email: null,
  refresh: async () => {},
};
const replace = vi.fn();
const logout = vi.fn(async () => ({}));
let resizeHeader: (height?: number) => void = () => {};

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ replace, refresh: () => {} }),
}));

vi.mock("@/features/account/marketplace-session", () => ({
  useMarketplaceSession: () => session,
}));

vi.mock("@/lib/api", () => ({ logout: () => logout() }));

vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme: () => {} }) }));

describe("Header", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: (entries: Pick<ResizeObserverEntry, "borderBoxSize">[]) => void) {
        resizeHeader = (height) => callback([{ borderBoxSize: height === undefined ? [] : [{ blockSize: height, inlineSize: 0 }] }]);
      }
      observe() {}
      disconnect() {}
    });
    pathname = "/";
    session = { marketplaceRoles: [], email: null, refresh: async () => {} };
    replace.mockClear();
    logout.mockClear();
    window.localStorage.clear();
  });

  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("keeps sticky workspace offsets in sync with the actual header height", () => {
    const bounds = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
    const { unmount } = render(<Header />);
    expect(bounds).not.toHaveBeenCalled();
    act(() => resizeHeader(100));
    expect(document.documentElement.style.getPropertyValue("--site-header-height")).toBe("100px");
    act(() => resizeHeader(64));
    expect(document.documentElement.style.getPropertyValue("--site-header-height")).toBe("64px");
    expect(bounds).not.toHaveBeenCalled();
    unmount();
    expect(document.documentElement.style.getPropertyValue("--site-header-height")).toBe("");
  });

  it("marks the current route for sighted and assistive readers alike", () => {
    pathname = "/explore";
    render(<Header />);
    const explore = screen.getAllByRole("link", { name: "Explore" });
    expect(explore.some((link) => link.getAttribute("aria-current") === "page")).toBe(
      true,
    );
  });

  it("falls back to measured bounds when the browser supplies no border box", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ height: 64 } as DOMRect);
    render(<Header />);
    act(() => resizeHeader());
    expect(document.documentElement.style.getPropertyValue("--site-header-height")).toBe("64px");
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
    // Icon only: the language name is the accessible name, not visible text.
    expect(switcher).toHaveTextContent("");
  });

  it("offers Sign in rather than an account menu to a visitor", () => {
    render(<Header />);
    expect(screen.getAllByRole("link", { name: "Sign in" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Your account" })).not.toBeInTheDocument();
  });

  it("keeps Dashboard out of the nav and shows the email only inside the account menu", async () => {
    const user = userEvent.setup();
    session = { marketplaceRoles: [], email: "ada@example.com", refresh: async () => {} };
    render(<Header />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).not.toHaveTextContent("Dashboard");
    expect(screen.queryByRole("button", { name: "ada@example.com" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Your account" }));
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("signs out from the account menu and returns home", async () => {
    const user = userEvent.setup();
    const refresh = vi.fn(async () => {});
    session = { marketplaceRoles: [], email: "ada@example.com", refresh };
    render(<Header />);

    await user.click(screen.getByRole("button", { name: "Your account" }));
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("closes the account menu on Escape and returns focus to its button", async () => {
    const user = userEvent.setup();
    session = { marketplaceRoles: [], email: "ada@example.com", refresh: async () => {} };
    render(<Header />);

    const trigger = screen.getByRole("button", { name: "Your account" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
  });

  it("closes the account menu when the reader clicks elsewhere", async () => {
    const user = userEvent.setup();
    session = { marketplaceRoles: [], email: "ada@example.com", refresh: async () => {} };
    render(<Header />);

    await user.click(screen.getByRole("button", { name: "Your account" }));
    await user.click(document.body);
    expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
  });

  it("names the theme toggle by where it takes you", () => {
    render(<Header />);
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
  });
});
