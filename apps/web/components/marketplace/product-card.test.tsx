import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductCard } from "./product-card";

// The title link drives a view transition through the router.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { products } from "@/lib/fixtures";
import { LocaleProvider } from "@/lib/locale-context";

describe("ProductCard", () => {
  afterEach(cleanup);
  it("presents product and favorite control", () => {
    render(<ProductCard product={products[0]} />);
    expect(
      screen.getByRole("heading", { name: "Conversion Copywriter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /favorites/i }),
    ).toBeInTheDocument();
  });

  it("links to the product detail page from a labelled call to action", () => {
    render(<ProductCard product={products[0]} />);
    const cta = screen.getByRole("link", {
      name: /view details: conversion copywriter/i,
    });
    expect(cta).toHaveAttribute("href", "/products/conversion-copywriter");
  });

  it("shows the outcome as the only body copy, never the long description", () => {
    render(<ProductCard product={products[0]} />);
    expect(screen.getByText(products[0].outcome)).toBeInTheDocument();
    expect(screen.queryByText(products[0].description)).not.toBeInTheDocument();
  });

  it("does not render legacy commerce metadata", () => {
    render(<ProductCard product={{ ...products[0], pricing: { amountMinor: 3800, currency: "USD", model: "one-time" } }} />);
    expect(screen.queryByText(/\$38|buy|purchase/i)).not.toBeInTheDocument();
  });

  it("links approved community context without changing the canonical listing link", () => {
    render(<ProductCard product={{ ...products[0], communities: [{ slug: "codex", nameEn: "Codex", nameFa: "کودکس", primaryPlatform: "codex" }] }} />);
    expect(screen.getByRole("link", { name: "Codex" })).toHaveAttribute("href", "/communities/codex");
    // The title and the "View details" button both link to the listing; neither may pick up community context.
    for (const link of screen.getAllByRole("link", { name: /Conversion Copywriter/ })) {
      expect(link).toHaveAttribute("href", "/products/conversion-copywriter");
    }
  });

  it("renders card chrome and community names in Persian, with no English labels", () => {
    const product = { ...products[0], featured: true, trending: true, communities: [{ slug: "codex", nameEn: "Codex", nameFa: "کودکس", primaryPlatform: "codex" }] };
    render(<LocaleProvider locale="fa"><ProductCard product={product} /></LocaleProvider>);
    expect(screen.getByText("انتخاب سردبیر")).toBeInTheDocument();
    expect(screen.getByText("پرطرفدار")).toBeInTheDocument();
    expect(screen.getByText("مهارت")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "کودکس" })).toHaveAttribute("href", "/fa/communities/codex");
    expect(screen.getAllByRole("link").some((link) => link.getAttribute("href") === `/fa/products/${product.slug}`)).toBe(true);
    expect(screen.getByRole("button", { name: /علاقه‌مندی‌ها/ })).toBeInTheDocument();
    expect(screen.queryByText(/Editor’s pick|Trending|uses|favorites|^Skill$/)).not.toBeInTheDocument();
  });

  it("falls back to the English community name when no Persian name exists", () => {
    const product = { ...products[0], communities: [{ slug: "codex", nameEn: "Codex", nameFa: null, primaryPlatform: "codex" }] };
    render(<LocaleProvider locale="fa"><ProductCard product={product} /></LocaleProvider>);
    expect(screen.getByRole("link", { name: "Codex" })).toBeInTheDocument();
  });

  it("states what the listing declares: review state, licence and permissions", () => {
    render(<ProductCard product={{ ...products[0], verified: true, license: "MIT", permissions: "Reads the current selection · no network access" }} />);
    expect(screen.getByText("Safety reviewed")).toBeInTheDocument();
    expect(screen.getByText("MIT")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("Reads the current selection · no network access")).toBeInTheDocument();
  });

  it("says so when a listing is unreviewed or declares nothing, instead of leaving a gap", () => {
    render(<ProductCard product={{ ...products[0], verified: false, license: null, permissions: null }} />);
    expect(screen.getByText("Not yet reviewed")).toBeInTheDocument();
    expect(screen.getByText("Licence not stated")).toBeInTheDocument();
    expect(screen.getByText("Permissions not declared")).toBeInTheDocument();
    expect(screen.queryByText("Safety reviewed")).not.toBeInTheDocument();
  });

  it("marks creator identity differently from safety review", () => {
    const { container } = render(<ProductCard product={{ ...products[0], verified: true, creator: { ...products[0].creator, verified: true } }} />);
    const identity = screen.getByLabelText("Verified creator");
    expect(identity).toHaveClass("text-primary");
    expect(container.querySelector("svg.text-verified")).not.toBeNull();
    expect(identity).not.toHaveClass("text-verified");
  });

  it("labels the strip in Persian", () => {
    render(<LocaleProvider locale="fa"><ProductCard product={{ ...products[0], verified: true }} /></LocaleProvider>);
    expect(screen.getByText("ایمنی بررسی شده")).toBeInTheDocument();
    expect(screen.getByText("مجوزها اعلام نشده")).toBeInTheDocument();
  });
});
