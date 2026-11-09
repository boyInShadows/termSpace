import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Avatar } from "./avatar";

describe("Avatar", () => {
  afterEach(cleanup);

  it("shows initials alone when there is no picture", () => {
    const { container } = render(<Avatar initials="TB" />);
    expect(container.textContent).toBe("TB");
    expect(container.querySelector("img")).toBeNull();
  });

  it("lays a decorative, referrer-free picture over the initials so a failed load leaves them visible", () => {
    const { container } = render(<Avatar initials="TB" src="https://raw.githubusercontent.com/o/r/x.png" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://raw.githubusercontent.com/o/r/x.png");
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(container.textContent).toBe("TB");
  });
});
