import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Process } from "./process";

describe("Process", () => {
  it("names the three stages of the story", () => {
    render(<Process />);
    expect(
      screen.getByRole("heading", { name: "Search by outcome" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Read what it touches" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Put it to work" }),
    ).toBeInTheDocument();
  });

  it("shows one panel state at a time, starting at discover", () => {
    // The bug this guards: the panel rendering the discover query while the
    // reader is on step 03. Only the active step's contents may be present.
    const { container } = render(<Process />);
    expect(container).toHaveTextContent("discover");
    expect(container).toHaveTextContent("ranked by");
    // Lines belonging to the other two panel states must be absent.
    expect(container).not.toHaveTextContent("none requested");
    expect(container).not.toHaveTextContent("termspace add");
  });
});
