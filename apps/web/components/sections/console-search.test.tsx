import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ConsoleSearch } from "./console-search";

function scopeInput(container: HTMLElement) {
  return container.querySelector('input[name="type"]');
}

describe("ConsoleSearch", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("gives the field a stable name rather than the rotating placeholder", () => {
    render(<ConsoleSearch />);
    expect(
      screen.getByRole("combobox", {
        name: "Search community resources by outcome",
      }),
    ).toBeInTheDocument();
  });

  it("scopes the search to a type instead of navigating away", async () => {
    const user = userEvent.setup();
    const { container } = render(<ConsoleSearch />);
    const skills = screen.getByRole("button", { name: /Skills/ });

    expect(skills).toHaveAttribute("aria-pressed", "false");
    expect(scopeInput(container)).toBeNull();

    await user.click(skills);
    expect(skills).toHaveAttribute("aria-pressed", "true");
    expect(scopeInput(container)).toHaveValue("skill");

    await user.click(skills);
    expect(scopeInput(container)).toBeNull();
  });

  it("shows each type's listing count", () => {
    render(
      <ConsoleSearch
        types={[
          { type: "skill", products: 412 },
          { type: "agent", products: 186 },
        ]}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Skills · 412/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Agents · 186/ }),
    ).toBeInTheDocument();
    // A type the catalogue did not report shows no count rather than zero.
    expect(screen.getByRole("button", { name: "Prompts" })).toBeInTheDocument();
  });

  it("offers popular queries on focus and fills the field with one", async () => {
    const user = userEvent.setup();
    render(<ConsoleSearch />);
    const field = screen.getByRole("combobox");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.click(field);

    const listbox = await screen.findByRole("listbox", {
      name: "Popular searches",
    });
    const suggestion = screen.getByText(
      "review my pull request like a staff engineer",
    );
    await user.click(suggestion);

    expect(field).toHaveValue("review my pull request like a staff engineer");
    expect(listbox).not.toBeInTheDocument();
  });

  it("prefers this browser's recent searches over the popular list", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      "termspace:recent-searches",
      JSON.stringify(["audit a migration"]),
    );
    render(<ConsoleSearch />);

    await user.click(screen.getByRole("combobox"));
    expect(
      await screen.findByRole("listbox", { name: "Recent searches" }),
    ).toBeInTheDocument();
    expect(screen.getByText("audit a migration")).toBeInTheDocument();
  });

  it("survives localStorage holding something that is not a list", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("termspace:recent-searches", '{"not":"a list"}');
    render(<ConsoleSearch />);

    await user.click(screen.getByRole("combobox"));
    expect(
      await screen.findByRole("listbox", { name: "Popular searches" }),
    ).toBeInTheDocument();
  });
});
