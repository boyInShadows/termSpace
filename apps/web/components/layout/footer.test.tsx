import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { copy, footerLabels, type Locale } from "@/lib/i18n";
import { legalLabels } from "@/lib/legal";
import { Footer } from "./footer";

const state = vi.hoisted(() => ({ locale: "en" as Locale }));
vi.mock("@/lib/serverLocale", () => ({ getLocale: async () => state.locale }));

describe("server-rendered footer", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("omits Journal while the blog is not deployed", async () => {
    state.locale = "en";
    vi.stubEnv("NEXT_PUBLIC_BLOG_URL", "");
    render(await Footer());
    expect(screen.queryByRole("link", { name: footerLabels.en.journal })).not.toBeInTheDocument();
  });

  it("links the configured blog", async () => {
    state.locale = "fa";
    vi.stubEnv("NEXT_PUBLIC_BLOG_URL", "https://journal.example.org/");
    render(await Footer());
    expect(screen.getByRole("link", { name: footerLabels.fa.journal })).toHaveAttribute("href", "https://journal.example.org/fa/blog");
  });
  it.each(["en", "fa"] as const)("renders the request's %s copy and destinations without a client provider", async (locale) => {
    state.locale = locale;
    render(await Footer());
    expect(screen.getByText(copy[locale].footer)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: footerLabels[locale].explore })).toHaveAttribute("href", locale === "fa" ? "/fa/explore" : "/explore");
    expect(screen.getByRole("link", { name: footerLabels[locale].support })).toHaveAttribute("href", locale === "fa" ? "/fa/account" : "/account");
    for (const slug of ["privacy", "terms", "content-policy"] as const) {
      expect(screen.getByRole("link", { name: legalLabels[locale][slug] })).toHaveAttribute("href", `${locale === "fa" ? "/fa" : ""}/${slug}`);
    }
  });
});
