import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

const listReviewsForModeration = vi.hoisted(() => vi.fn());
const setReviewVisibility = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/api")>(), listReviewsForModeration, setReviewVisibility }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en", fa: false }) }));

const { ModerationReviews } = await import("./moderation-reviews");
const visible = { id: "r1", author: "Priya", rating: 4, body: "Solid skill, saved me time.", createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z", hidden: null };
const hidden = { ...visible, id: "r2", author: "Spammer", hidden: { at: "2026-10-02T00:00:00Z", reason: "Spam links" } };

describe("ModerationReviews", () => {
  afterEach(cleanup);
  beforeEach(() => { vi.clearAllMocks(); listReviewsForModeration.mockResolvedValue([visible, hidden]); });

  it("lists visible and hidden reviews", async () => {
    render(<ModerationReviews productId="p1" />);

    expect(await screen.findByText("Priya")).toBeInTheDocument();
    expect(screen.getByText("Spammer")).toBeInTheDocument();
    expect(screen.getByText("Spam links")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
  });

  it("will not hide without a reason of at least five characters", async () => {
    render(<ModerationReviews productId="p1" />);
    const hide = await screen.findByRole("button", { name: "Hide" });
    expect(hide).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Reason shown to the author"), { target: { value: "spam" } });
    expect(hide).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Reason shown to the author"), { target: { value: "Spam links" } });
    expect(hide).toBeEnabled();
  });

  it("hides with the reason, then reflects it without a reload", async () => {
    setReviewVisibility.mockResolvedValue({ id: "r1", hidden: { at: "2026-10-03T00:00:00Z", reason: "Abusive language" } });
    render(<ModerationReviews productId="p1" />);
    fireEvent.change(await screen.findByLabelText("Reason shown to the author"), { target: { value: " Abusive language " } });

    fireEvent.click(screen.getByRole("button", { name: "Hide" }));

    await waitFor(() => expect(setReviewVisibility).toHaveBeenCalledWith("r1", { action: "hide", reason: "Abusive language" }));
    expect(await screen.findByText("Abusive language")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Restore" })).toHaveLength(2);
  });

  it("restores a hidden review", async () => {
    setReviewVisibility.mockResolvedValue({ id: "r2", hidden: null });
    render(<ModerationReviews productId="p1" />);

    fireEvent.click(await screen.findByRole("button", { name: "Restore" }));

    await waitFor(() => expect(setReviewVisibility).toHaveBeenCalledWith("r2", { action: "restore", reason: undefined }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Restore" })).not.toBeInTheDocument());
  });

  it("shows the server's reason when an action fails", async () => {
    setReviewVisibility.mockRejectedValue(new ApiError(403, "SELF_MODERATION_FORBIDDEN", "Staff cannot moderate a listing they own"));
    render(<ModerationReviews productId="p1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Restore" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Staff cannot moderate a listing they own");
  });

  it("says so when the list cannot load", async () => {
    listReviewsForModeration.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "x"));
    render(<ModerationReviews productId="p1" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load the reviews.");
  });
});
