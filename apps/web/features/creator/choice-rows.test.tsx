import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChoiceRows } from "./choice-rows";

const choices = [{ value: "filesystem_read", label: "Read files" }, { value: "network_access", label: "Use the network" }];
const extras = [{ cell: 4, label: "Purpose", wide: true }, { cell: 1, label: "Required", type: "checkbox" as const, defaultValue: "true" }, { cell: 2, label: "Scope", optional: true }, { cell: 3, label: "Destinations", optional: true }];
const rows = (container: HTMLElement) => JSON.parse((container.querySelector('input[type="hidden"]') as HTMLInputElement).value) as string[][];

describe("choice rows", () => {
  afterEach(cleanup);

  it("submits ticked options as manifest-ordered rows, with a purpose box per tick", () => {
    const onChange = vi.fn();
    const { container } = render(<form><ChoiceRows name="permissions" label="Permissions" choices={choices} extras={extras} initialRows={[]} messages={{ chooseOne: "Choose one" }} onChange={onChange} /></form>);
    expect(rows(container)).toEqual([]);
    expect(screen.queryByLabelText(/^Purpose/)).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use the network" }));
    expect(rows(container)).toEqual([["network_access", "true", "", "", ""]]);
    fireEvent.change(screen.getByLabelText(/^Purpose/), { target: { value: "Fetch the docs" } });
    fireEvent.change(screen.getByLabelText("Destinations"), { target: { value: "docs.example.com" } });
    expect(rows(container)).toEqual([["network_access", "true", "", "docs.example.com", "Fetch the docs"]]);
    expect(onChange).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Use the network" }));
    expect(rows(container)).toEqual([]);
  });

  it("restores saved rows and keeps options that are no longer offered", () => {
    const { container } = render(<ChoiceRows name="permissions" label="Permissions" choices={choices} extras={extras} initialRows={[["filesystem_read", "false", "", "", "Read the repo"], ["old_option", "true", "", "", "Legacy"]]} messages={{ chooseOne: "Choose one" }} onChange={() => {}} />);
    expect(screen.getByRole("checkbox", { name: "Read files" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "old option" })).toBeChecked();
    expect(rows(container)).toHaveLength(2);
  });

  it("reports an empty required selection on the first box", () => {
    render(<form><ChoiceRows name="compatibility" label="Platforms" required choices={choices} extras={[]} initialRows={[]} messages={{ chooseOne: "Choose one" }} onChange={() => {}} /></form>);
    const first = screen.getByRole("checkbox", { name: "Read files" }) as HTMLInputElement;
    expect(first.validity.valid).toBe(false);
    expect(first.validationMessage).toBe("Choose one");
    fireEvent.click(first);
    expect(first.validity.valid).toBe(true);
  });
});
