import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextHelp } from "./context-help";
import { helpCopy } from "./context-help-copy";
import { helpHints } from "./context-help-hints";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "fa" }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => state }));

describe("contextual help", () => {
  beforeEach(() => {
    state.locale = "en";
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("opens on focus with a descriptive relationship and dismisses with Escape", async () => {
    render(<ContextHelp label="Permissions" topic="permissions" />);
    const button = screen.getByRole("button", { name: "Help: Permissions" });
    await act(async () => { button.focus(); await vi.dynamicImportSettled(); });
    const tooltip = screen.getByRole("tooltip");
    expect(button).toHaveAttribute("aria-describedby", tooltip.id);
    expect(tooltip).toHaveTextContent(helpCopy.en.permissions.body);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("lets the pointer cross to the bubble and keeps clicked help until dismissal", () => {
    render(<ContextHelp label="Source" topic="source" />);
    const button = screen.getByRole("button");
    fireEvent.pointerEnter(button, { pointerType: "mouse" });
    // jsdom does not preserve PointerEvent.pointerType; focus uses the same open path.
    fireEvent.focus(button);
    fireEvent.pointerLeave(button);
    fireEvent.pointerEnter(screen.getByRole("tooltip"));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.click(button);
    fireEvent.pointerLeave(screen.getByRole("tooltip"));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.click(button);
    fireEvent.click(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not submit its form or change input, and isolates examples in Persian", async () => {
    state.locale = "fa";
    const submit = vi.fn((event) => event.preventDefault());
    render(<form onSubmit={submit}><input aria-label="Draft" defaultValue="keep-me" /><ContextHelp label="ذخیره" topic="saves" /></form>);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "راهنما: ذخیره" })); await vi.dynamicImportSettled(); });
    expect(screen.getByRole("tooltip")).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("tooltip").querySelector("bdi")).toHaveTextContent(helpCopy.fa.saves.example);
    expect(screen.getByRole("textbox")).toHaveValue("keep-me");
    expect(submit).not.toHaveBeenCalled();
  });

  it("keeps Persian hints readable after text processing", () => {
    for (const hint of Object.values(helpHints.fa)) {
      expect(hint).toMatch(/\p{Script=Arabic}/u);
      expect(hint).not.toMatch(/\?{2}|\ufffd/u);
    }
  });

  it("waits for the touch click before opening so focus cannot intercept the first tap", () => {
    render(<ContextHelp label="Item type" topic="itemType" />);
    const button = screen.getByRole("button");
    const pointer = new Event("pointerdown", { bubbles: true });
    Object.defineProperty(pointer, "pointerType", { value: "touch" });
    fireEvent(button, pointer);
    fireEvent.focus(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
