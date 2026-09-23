import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProductCard } from "./product-card";
import { products } from "@/lib/fixtures";

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
});
