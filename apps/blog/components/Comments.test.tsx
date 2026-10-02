import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Comments } from "./Comments";

const submitComment = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { message: "Submitted for moderation" } }));
vi.mock("@/lib/api", () => ({ api: { submitComment } }));

it("submits replies with the selected parent and clears reply context", async () => {
  render(<Comments slug="article" initialComments={[{ id: "parent", name: "Ava", body: "Thought", createdAt: "2026-10-01T00:00:00.000Z", parentId: null, curated: false }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Reply" }));
  expect(screen.getByText("Reply to Ava")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Sam" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Email" }), { target: { value: "sam@example.com" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Your comment" }), { target: { value: "A reply" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
  await waitFor(() => expect(submitComment).toHaveBeenCalledWith("article", expect.objectContaining({ parentId: "parent", body: "A reply" })));
  expect(screen.getByText("Leave a comment")).toBeInTheDocument();
});
