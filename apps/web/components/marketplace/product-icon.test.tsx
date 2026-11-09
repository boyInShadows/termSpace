import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { listingInitials, ProductIcon } from "./product-icon";

const icon = "https://avatars.githubusercontent.com/u/9919?v=4";

describe("ProductIcon", () => {
  afterEach(cleanup);

  it("derives up to two initials from the listing name", () => {
    expect(listingInitials("GitHub MCP Server")).toBe("GM");
    expect(listingInitials("opencode")).toBe("O");
    expect(listingInitials("  — ")).toBe("·");
  });

  it("shows initials when there is no icon", () => {
    const { container } = render(<ProductIcon name="Spec Kit" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("SK");
  });

  it("loads the icon as a decorative image with no referrer", () => {
    const { container } = render(<ProductIcon name="GitHub MCP Server" iconUrl={icon} size="lg" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", icon);
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(img).toHaveAttribute("width", "56");
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back to initials when the image fails to load, and retries a changed address", () => {
    const { container, rerender } = render(<ProductIcon name="Spec Kit" iconUrl={icon} />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("SK");

    rerender(<ProductIcon name="Spec Kit" iconUrl="https://avatars.githubusercontent.com/u/1?v=4" />);
    expect(container.querySelector("img")).not.toBeNull();
  });
});
