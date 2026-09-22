import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { NewsletterForm } from "./newsletter-form";

const subscribe = vi.fn();
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, subscribe: (email: string) => subscribe(email) };
});

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email address"), "reader@example.com");
  await user.click(screen.getByRole("button", { name: "Subscribe" }));
}

describe("NewsletterForm", () => {
  beforeEach(() => {
    subscribe.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("states the promise and the way out before you subscribe", () => {
    render(<NewsletterForm />);
    expect(
      screen.getByText("One email a week. Unsubscribe any time."),
    ).toBeInTheDocument();
  });

  it("replaces the form with a confirmation on success", async () => {
    subscribe.mockResolvedValue(undefined);
    render(<NewsletterForm />);
    await fillAndSubmit();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "You are on the list.",
    );
    // The field is gone, so the reader cannot submit the same address twice.
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
  });

  it("keeps the typed address and explains a rejected address", async () => {
    subscribe.mockRejectedValue(new ApiError(400, "VALIDATION", "bad"));
    render(<NewsletterForm />);
    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That does not look like an email address.",
    );
    expect(screen.getByLabelText("Email address")).toHaveValue(
      "reader@example.com",
    );
  });

  it("distinguishes rate limiting from a generic failure", async () => {
    subscribe.mockRejectedValue(new ApiError(429, "RATE_LIMITED", "slow down"));
    render(<NewsletterForm />);
    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts.",
    );
  });

  it("falls back to a generic failure for anything else", async () => {
    subscribe.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "offline"));
    render(<NewsletterForm />);
    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Subscription failed.",
    );
  });
});
