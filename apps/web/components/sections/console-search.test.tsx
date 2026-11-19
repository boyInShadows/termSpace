import { act, screen } from "@testing-library/react";
import { renderWithLocale as render } from "@/lib/test-render";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConsoleSearch } from "./console-search";

function scopeInput(container: HTMLElement) {
  return container.querySelector('input[name="type"]');
}

describe("ConsoleSearch", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("gives the field a stable name independent of its placeholder", () => {
    render(<ConsoleSearch />);
    expect(
      screen.getByRole("combobox", {
        name: "Search community resources by outcome",
      }),
    ).toBeInTheDocument();
  });

  it("keeps its search prompt readable instead of typing and erasing it", async () => {
    vi.useFakeTimers();
    globalThis.prefersReducedMotion = false;
    try {
      render(<ConsoleSearch />);
      const field = screen.getByRole("combobox");
      const prompt = field.getAttribute("placeholder");
      await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
      expect(field).toHaveAttribute("placeholder", prompt);
    } finally {
      vi.useRealTimers();
    }
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

  it("invents no suggestions: focusing an empty field with no history opens nothing", async () => {
    const user = userEvent.setup();
    render(<ConsoleSearch />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/popular searches/i)).not.toBeInTheDocument();
  });

  it("offers this browser's recent searches on focus and fills the field with one", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("termspace:recent-searches", JSON.stringify(["audit a migration"]));
    render(<ConsoleSearch />);
    const field = screen.getByRole("combobox");
    await user.click(field);
    const listbox = await screen.findByRole("listbox", { name: "Recent searches" });
    await user.click(screen.getByText("audit a migration"));
    expect(field).toHaveValue("audit a migration");
    expect(listbox).not.toBeInTheDocument();
  });

  it("navigates, selects and dismisses recent searches with the keyboard", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("termspace:recent-searches", JSON.stringify(["audit a migration"]));
    render(<ConsoleSearch />);
    const field = screen.getByRole("combobox");
    await user.click(field);
    await user.keyboard("{ArrowDown}");
    const selected = screen.getByRole("option", { selected: true });
    expect(field).toHaveAttribute("aria-activedescendant", selected.id);
    await user.keyboard("{Enter}");
    expect(field).toHaveValue("audit a migration");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.clear(field);
    await user.keyboard("{ArrowDown}{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(field).toHaveFocus();
  });

  it("survives localStorage holding something that is not a list", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("termspace:recent-searches", '{"not":"a list"}');
    render(<ConsoleSearch />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
