import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

const getMyReview = vi.hoisted(() => vi.fn());
const saveReview = vi.hoisted(() => vi.fn());
const deleteReview = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ loading: false, email: "reader@example.com" as string | null, emailVerified: true }));
const locale = vi.hoisted(() => ({ value: "en" as "en" | "fa" }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock("@/lib/api", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/api")>(), getMyReview, saveReview, deleteReview }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: locale.value, fa: locale.value === "fa" }) }));

const { ReviewComposer } = await import("./review-composer");

const existing = { id: "review-1", author: "Priya", rating: 4, body: "Caught a migration mistake in its first week.", createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z", hidden: null };

describe("ReviewComposer", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.loading = false; session.email = "reader@example.com"; session.emailVerified = true; locale.value = "en";
    getMyReview.mockResolvedValue({ eligibility: "eligible", review: null });
  });

  it("asks a signed-out visitor to sign in, without calling the API", () => {
    session.email = null;
    render(<ReviewComposer slug="x" />);

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/account?next=%2Fproducts%2Fx");
    expect(getMyReview).not.toHaveBeenCalled();
  });

  it.each([
    ["not_acquired", /Add this listing to your library/],
    ["own_listing", /can't review your own listing/],
  ])("explains why a %s reader cannot review", async (eligibility, message) => {
    getMyReview.mockResolvedValue({ eligibility, review: null });
    render(<ReviewComposer slug="x" />);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Post review" })).not.toBeInTheDocument();
  });

  it("asks for email verification before showing the form", async () => {
    session.emailVerified = false;
    render(<ReviewComposer slug="x" />);

    expect(await screen.findByText(/Verify your email to write a review/)).toBeInTheDocument();
  });

  it("posts a review with the chosen rating and the name the reader typed", async () => {
    saveReview.mockResolvedValue(existing);
    render(<ReviewComposer slug="x" />);

    fireEvent.click(await screen.findByRole("radio", { name: "4 out of 5" }));
    fireEvent.change(screen.getByLabelText("Name shown with your review"), { target: { value: " Priya " } });
    fireEvent.change(screen.getByLabelText("Your review"), { target: { value: " Caught a migration mistake in its first week. " } });
    fireEvent.click(screen.getByRole("button", { name: "Post review" }));

    await waitFor(() => expect(saveReview).toHaveBeenCalledWith("x", { rating: 4, displayName: "Priya", body: "Caught a migration mistake in its first week." }));
    expect(await screen.findByText("Review saved.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Update review" })).toBeInTheDocument();
  });

  it("will not submit without a rating", async () => {
    render(<ReviewComposer slug="x" />);
    fireEvent.change(await screen.findByLabelText("Name shown with your review"), { target: { value: "Priya" } });
    fireEvent.change(screen.getByLabelText("Your review"), { target: { value: "A long enough review body." } });

    fireEvent.click(screen.getByRole("button", { name: "Post review" }));

    expect(await screen.findByText("Choose a rating from 1 to 5.")).toBeInTheDocument();
    expect(saveReview).not.toHaveBeenCalled();
  });

  it("prefills an existing review and lets the reader delete it after confirming", async () => {
    getMyReview.mockResolvedValue({ eligibility: "eligible", review: existing });
    deleteReview.mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, "confirm");
    render(<ReviewComposer slug="x" />);

    expect(await screen.findByDisplayValue("Priya")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "4 out of 5" })).toBeChecked();

    confirm.mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete review" }));
    expect(deleteReview).not.toHaveBeenCalled();

    confirm.mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete review" }));
    await waitFor(() => expect(deleteReview).toHaveBeenCalledWith("x"));
    expect(await screen.findByText("Review deleted.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post review" })).toBeInTheDocument();
    confirm.mockRestore();
  });

  it("shows a moderator's decision and offers no way to edit around it", async () => {
    getMyReview.mockResolvedValue({ eligibility: "eligible", review: { ...existing, hidden: { at: "2026-10-02T00:00:00Z", reason: "Spam links" } } });
    render(<ReviewComposer slug="x" />);

    expect(await screen.findByText(/A moderator hid your review/)).toBeInTheDocument();
    expect(screen.getByText("Spam links")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update review" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete review" })).not.toBeInTheDocument();
  });

  it.each([
    [new ApiError(409, "REVIEW_HIDDEN", "x"), /moderator hid your review/],
    [new ApiError(429, "RATE_LIMITED", "x"), /Too many review changes/],
    [new ApiError(400, "VALIDATION_ERROR", "Review text is too short"), /Review text is too short/],
  ])("names the real reason a save failed (%#)", async (failure, message) => {
    saveReview.mockRejectedValue(failure);
    render(<ReviewComposer slug="x" />);
    fireEvent.click(await screen.findByRole("radio", { name: "5 out of 5" }));
    fireEvent.change(screen.getByLabelText("Name shown with your review"), { target: { value: "Priya" } });
    fireEvent.change(screen.getByLabelText("Your review"), { target: { value: "A long enough review body." } });

    fireEvent.click(screen.getByRole("button", { name: "Post review" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });

  it("reports when the review status cannot be loaded", async () => {
    getMyReview.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "unreachable"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ReviewComposer slug="x" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't check your review status.");
  });

  it("renders in Persian with a /fa sign-in link", () => {
    session.email = null;
    locale.value = "fa";
    render(<ReviewComposer slug="x" />);

    expect(screen.getByText("نقد شما")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ورود" })).toHaveAttribute("href", "/fa/account?next=%2Ffa%2Fproducts%2Fx");
  });
});
