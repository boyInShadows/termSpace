import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ArticleForm } from "./ArticleForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

it("inserts a safe editorial block and limits the Signal format", () => {
  const { container } = render(<ArticleForm authors={[]} categories={[]} tags={[]} series={[]} media={[]} />);
  fireEvent.change(screen.getByLabelText("Insert editorial format block"), { target: { value: "timeline" } });
  const body = screen.getByLabelText("Content (markdown)") as HTMLTextAreaElement;
  expect(body.value).toContain(":::timeline");
  expect(container.querySelector(".editorial-timeline")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Editorial format"), { target: { value: "SIGNAL" } });
  expect(body.maxLength).toBe(1200);
});
