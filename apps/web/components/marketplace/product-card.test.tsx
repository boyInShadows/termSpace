import { copy } from "@/lib/i18n";
import { cleanup, screen } from "@testing-library/react";
import { renderWithLocale as render } from "@/lib/test-render";
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

  it("links to the listing once, from its title, and names the card after it", () => {
    render(<ProductCard product={products[0]} />);
    const links = screen.getAllByRole("link", { name: /conversion copywriter/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/products/conversion-copywriter");
    expect(screen.getByRole("article", { name: "Conversion Copywriter" })).toBeInTheDocument();
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
    // The title is the listing link; it must not pick up community context.
    for (const link of screen.getAllByRole("link", { name: /Conversion Copywriter/ })) {
      expect(link).toHaveAttribute("href", "/products/conversion-copywriter");
    }
  });

  it("renders card chrome and community names in Persian, with no English labels", () => {
    const product = { ...products[0], featured: true, trending: true, communities: [{ slug: "codex", nameEn: "Codex", nameFa: "کودکس", primaryPlatform: "codex" }] };
    render(<LocaleProvider locale="fa" messages={copy.fa}><ProductCard product={product} /></LocaleProvider>);
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
    render(<LocaleProvider locale="fa" messages={copy.fa}><ProductCard product={product} /></LocaleProvider>);
    expect(screen.getByRole("link", { name: "Codex" })).toBeInTheDocument();
  });

  it("states what the listing declares as labelled rows: review state, permissions and licence", () => {
    render(<ProductCard product={{ ...products[0], verified: true, license: "MIT", permissions: "Reads the current selection · no network access" }} />);
    const terms = screen.getAllByRole("term").map((term) => term.textContent);
    expect(terms).toEqual(["Review", "Permissions", "Licence"]);
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
    expect(screen.getByText("MIT")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("Reads the current selection · no network access")).toBeInTheDocument();
  });

  it("says so when a listing is unreviewed or declares nothing, and marks undeclared access in red", () => {
    render(<ProductCard product={{ ...products[0], verified: false, license: null, permissions: null }} />);
    expect(screen.getByText("Not yet reviewed")).toBeInTheDocument();
    expect(screen.getByText("Not stated")).toBeInTheDocument();
    expect(screen.getByText("Not declared")).toHaveClass("text-destructive");
    expect(screen.queryByText("Reviewed")).not.toBeInTheDocument();
  });

  it("marks creator identity differently from safety review", () => {
    const { container } = render(<ProductCard product={{ ...products[0], verified: true, creator: { ...products[0].creator, verified: true } }} />);
    const identity = screen.getByLabelText("Verified creator");
    expect(identity).toHaveClass("text-primary");
    expect(container.querySelector("svg.text-verified")).not.toBeNull();
    expect(identity).not.toHaveClass("text-verified");
  });

  it("labels the strip and the creator badge in Persian", () => {
    render(<LocaleProvider locale="fa" messages={copy.fa}><ProductCard product={{ ...products[0], verified: true, permissions: null, creator: { ...products[0].creator, verified: true } }} /></LocaleProvider>);
    expect(screen.getByText("بررسی‌شده")).toBeInTheDocument();
    expect(screen.getByText("اعلام نشده")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "سازندهٔ تأییدشده" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: products[0].creator.name })).toHaveAttribute("href", `/fa/creators/${products[0].creator.handle}`);
  });
});
