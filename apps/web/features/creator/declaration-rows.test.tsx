import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";
import { creatorWorkspace } from "./workspace-copy";
import { buildManifest } from "./creator-draft-editor";
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", t: copy.en }) }));
const { DeclarationRows } = await import("./declaration-rows");
const messages = { ...copy.en.creatorDraft, ...creatorWorkspace.en.creatorDraft };

describe("structured declarations", () => {
  afterEach(cleanup);
  it("preserves punctuation and booleans without pipe syntax and removes only the selected row", () => {
    const changed = vi.fn();
    const { container } = render(<form><DeclarationRows messages={messages} name="environmentVariables" label="Environment" onChange={changed} initialRows={[["FIRST", "Read | safely", "true", "true"], ["SECOND", "Other", "false", "false"]]} columns={[{ label: "Name" }, { label: "Purpose" }, { label: "Required", type: "checkbox" }, { label: "Sensitive", type: "checkbox" }]} /></form>);
    fireEvent.change(screen.getAllByLabelText("Purpose")[0], { target: { value: "Read | write, safely" } });
    let manifest = buildManifest(new FormData(container.querySelector("form")!), "skill", "github_repository", false);
    expect(manifest.release.requirements.environmentVariables[0]).toEqual({ name: "FIRST", purpose: "Read | write, safely", required: true, sensitive: true });
    fireEvent.click(screen.getByRole("button", { name: "Remove row 1" }));
    expect(screen.getByLabelText("Name")).toHaveValue("SECOND");
    manifest = buildManifest(new FormData(container.querySelector("form")!), "skill", "github_repository", false);
    expect(manifest.release.requirements.environmentVariables).toEqual([{ name: "SECOND", purpose: "Other", required: false, sensitive: false }]);
    expect(changed).toHaveBeenCalledTimes(2);
  });
  it("requires fields in an added declaration and retains a required group's last row", () => {
    render(<DeclarationRows messages={messages} name="compatibility" label="Compatibility" required initialRows={[]} onChange={() => {}} columns={[{ label: "Platform", options: ["codex"] }, { label: "Models" }]} />);
    expect(screen.getByRole("combobox", { name: "Platform" })).toBeInvalid();
    expect(screen.getByRole("button", { name: "Remove row 1" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Add: Compatibility" }));
    expect(within(screen.getByRole("group", { name: /Compatibility/ })).getAllByRole("combobox")).toHaveLength(2);
  });
});
