import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SectionNotice } from "./section-notice";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

describe("SectionNotice", () => {
  it("explains the degraded catalogue without claiming the page failed", () => {
    render(<SectionNotice />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing an example catalogue.",
    );
  });

  it("re-runs the server render when retried", async () => {
    const user = userEvent.setup();
    render(<SectionNotice />);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
