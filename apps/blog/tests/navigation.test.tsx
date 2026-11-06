import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import english from "@/messages/en.json";
import persian from "@/messages/fa.json";
import { Hero } from "@/components/Hero";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminShell } from "@/components/admin/AdminShell";

const location = vi.hoisted(() => ({ path: "/blog", search: "q=workflow&page=2", locale: "en" as "en" | "fa" }));
vi.mock("next/navigation", () => ({ usePathname: () => location.path, useSearchParams: () => new URLSearchParams(location.search), useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
function translate(namespace: string) {
  const messages: Record<string, Record<string, string>> = location.locale === "fa" ? persian : english;
  return (key: string) => messages[namespace][key];
}
vi.mock("next-intl", () => ({ useLocale: () => location.locale, useTranslations: (namespace: string) => translate(namespace) }));
vi.mock("next-intl/server", () => ({ getTranslations: async (namespace: string) => translate(namespace) }));
vi.mock("@/lib/serverLocale", () => ({ getLocale: async () => location.locale }));
afterEach(() => { cleanup(); location.path = "/blog"; location.locale = "en"; });

it.each(["en", "fa"] as const)("the %s hero names Termspace and opens the topics directory", async (locale) => {
  location.locale = locale;
  render(await Hero());
  expect(screen.getByText(locale === "fa" ? "Termspace — یک مجلهٔ تحریریه" : english.Hero.eyebrow)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: locale === "fa" ? "کاوش موضوعات" : "Explore topics" })).toHaveAttribute("href", `${locale === "fa" ? "/fa" : ""}/topics`);
});

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
