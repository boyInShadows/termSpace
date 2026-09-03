import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCard } from "./product-card";
import { products } from "@/lib/fixtures";

describe("ProductCard", () => {
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
});
