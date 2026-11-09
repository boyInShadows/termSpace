import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ScreenshotPicker } from "./screenshot-picker";

it("rejects excessive files without replacing the draft's screenshots", () => {
  const change = vi.fn();
  render(<ScreenshotPicker locale="en" files={[]} onChange={change} disabled={false} />);
  const files = Array.from({ length: 4 }, (_, index) => new File(["image"], `${index}.png`, { type: "image/png" }));
  fireEvent.change(screen.getByLabelText("Screenshots (optional)"), { target: { files } });
  expect(screen.getByRole("alert")).toHaveTextContent("at most 3");
  expect(change).not.toHaveBeenCalled();
});

it("revokes local previews when removed and freezes selection while sending", () => {
  const create = vi.fn(() => "blob:private-preview");
  const revoke = vi.fn();
  vi.stubGlobal("URL", class extends URL { static createObjectURL = create; static revokeObjectURL = revoke; });
  const file = new File(["image"], "screen.png", { type: "image/png" });
  const change = vi.fn();
  const { rerender } = render(<ScreenshotPicker locale="en" files={[file]} onChange={change} disabled />);
  expect(screen.getByLabelText("Screenshots (optional)")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Remove screenshot 1" })).toBeDisabled();
  rerender(<ScreenshotPicker locale="en" files={[]} onChange={change} disabled={false} />);
  expect(revoke).toHaveBeenCalledWith("blob:private-preview");
  vi.unstubAllGlobals();
});
