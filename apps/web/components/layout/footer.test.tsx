import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { copy, footerLabels, type Locale } from "@/lib/i18n";
import { Footer } from "./footer";

const state = vi.hoisted(() => ({ locale: "en" as Locale }));
vi.mock("@/lib/serverLocale", () => ({ getLocale: async () => state.locale }));

describe("server-rendered footer", () => {
  it.each(["en", "fa"] as const)("renders the request's %s copy and destinations without a client provider", async (locale) => {
    state.locale = locale;
    render(await Footer());
    expect(screen.getByText(copy[locale].footer)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: footerLabels[locale].explore })).toHaveAttribute("href", locale === "fa" ? "/fa/explore" : "/explore");
    expect(screen.getByRole("link", { name: footerLabels[locale].support })).toHaveAttribute("href", locale === "fa" ? "/fa/account" : "/account");
  });
});
