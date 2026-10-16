import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyBlock } from "./copy-block";

const labels = { label: "Command", copyLabel: "Copy", copiedLabel: "Copied", failedLabel: "Couldn't copy" };

afterEach(() => vi.unstubAllGlobals());

describe("CopyBlock", () => {
  it("copies the text and confirms", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<CopyBlock {...labels} text="npm install x@1.0.0" />);

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith("npm install x@1.0.0");
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("says so when the clipboard is denied instead of pretending it worked", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    render(<CopyBlock {...labels} text="npm install x@1.0.0" />);

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Couldn't copy"));
    expect(screen.queryByRole("button", { name: "Copied" })).not.toBeInTheDocument();
  });

  it("says so when there is no clipboard API at all", async () => {
    vi.stubGlobal("navigator", {});
    render(<CopyBlock {...labels} text="x" />);

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Couldn't copy"));
  });
});
