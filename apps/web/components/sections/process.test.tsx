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

  it("pins one panel state at a time, starting at discover", () => {
    // The bug this guards: the pinned panel showing the discover query while
    // the reader is on step 03.
    render(<Process />);
    const pinned = screen.getByTestId("pinned-panel");
    expect(pinned).toHaveTextContent("discover");
    expect(pinned).toHaveTextContent("ranked by");
    // Lines belonging to the other two panel states must not be pinned.
    expect(pinned).not.toHaveTextContent("none requested");
    expect(pinned).not.toHaveTextContent("termspace add");
  });

  it("gives every step its own panel for narrow screens", () => {
    // Below lg there is no column to pin anything in, so each step carries a
    // copy. All three are in the DOM; CSS decides which set is shown.
    const { container } = render(<Process />);
    expect(container).toHaveTextContent("none requested");
    expect(container).toHaveTextContent(
      "termspace add conversion-copywriter@2.4.0",
    );
  });
});
