import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Comments } from "@/components/Comments";

const submitComment = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: { submitComment } }));
afterEach(() => { cleanup(); submitComment.mockReset(); });

it.each([
  ["en", { message: "Comment submitted for moderation" }, "Comment submitted for moderation"],
  ["fa", { message: "Comment submitted for moderation" }, "دیدگاه برای بررسی ارسال شد."],
  ["en", {}, "Comment submitted for moderation"],
  ["fa", {}, "دیدگاه برای بررسی ارسال شد."],
] as const)("announces %s success without exposing filtering (%j)", async (locale, data, message) => {
  submitComment.mockResolvedValueOnce({ data });
  render(<Comments slug="article" initialComments={[]} locale={locale} />);
  fireEvent.submit(screen.getByRole("button", { name: locale === "fa" ? "ارسال برای بررسی" : "Submit for review" }).closest("form")!);
  expect(await screen.findByRole("status")).toHaveTextContent(message);
});

it("blocks duplicate pending comments and retains the text on failure", async () => {
  let reject!: (error: Error) => void;
  submitComment.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
  render(<Comments slug="article" initialComments={[]} />);
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Reader" } });
  fireEvent.change(screen.getByLabelText("Email (not published)"), { target: { value: "reader@example.com" } });
  const body = screen.getByLabelText("Your comment");
  fireEvent.change(body, { target: { value: "A careful comment that should survive a failed request." } });
  const button = screen.getByRole("button", { name: "Submit for review" });
  const form = button.closest("form")!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(submitComment).toHaveBeenCalledOnce();
  expect(button).toBeDisabled();
  await act(async () => { reject(new Error("Comments temporarily unavailable")); });
  expect(await screen.findByRole("alert")).toHaveTextContent("Comments temporarily unavailable");
  expect(body).toHaveValue("A careful comment that should survive a failed request.");
  expect(button).toBeEnabled();
});
