import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import english from "@/messages/en.json";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminShell } from "@/components/admin/AdminShell";

const location = vi.hoisted(() => ({ path: "/blog", search: "q=workflow&page=2" }));
vi.mock("next/navigation", () => ({ usePathname: () => location.path, useSearchParams: () => new URLSearchParams(location.search), useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => english.Navigation[key as keyof typeof english.Navigation] }));
afterEach(() => { cleanup(); location.path = "/blog"; });

it("preserves browse context, marks the current page and labels the reader account honestly", () => {
  render(<SiteHeader />);
  expect(screen.getByRole("link", { name: "فارسی" })).toHaveAttribute("href", "/fa/blog?q=workflow&page=2");
  expect(within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", { current: "page" })).toHaveTextContent("Articles");
  expect(screen.getByRole("link", { name: "Account" })).toBeInTheDocument();
});

it("keeps English-only admin login outside workspace controls", () => {
  location.path = "/admin/login";
  render(<><SiteHeader /><AdminShell><h1>Admin login</h1></AdminShell></>);
  expect(screen.queryByRole("navigation", { name: "Admin" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "فارسی" })).not.toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});

it("updates the active admin section as navigation changes", () => {
  location.path = "/admin/resources";
  const { rerender } = render(<AdminShell>Content</AdminShell>);
  expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("Resources");
  location.path = "/admin/media";
  rerender(<AdminShell>Content</AdminShell>);
  expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("Media");
  location.path = "/admin/articles/article-1/edit";
  rerender(<AdminShell>Content</AdminShell>);
  expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("Articles");
  location.path = "/admin/articles/new";
  rerender(<AdminShell>Content</AdminShell>);
  expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("New article");
});
