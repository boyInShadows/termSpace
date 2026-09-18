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

  it("does not render legacy commerce metadata", () => {
    render(<ProductCard product={{ ...products[0], pricing: { amountMinor: 3800, currency: "USD", model: "one-time" } }} />);
    expect(screen.queryByText(/\$38|buy|purchase/i)).not.toBeInTheDocument();
  });
});
