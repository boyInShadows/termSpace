import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TicketThread } from "./ticket-thread";

vi.mock("./ticket-composer", () => ({ TicketComposer: () => null }));

it.each([
  ["en", "Message removed after account deletion."],
  ["fa", "این پیام پس از حذف حساب پاک شده است."],
] as const)("explains an erased staff message in %s", (locale, label) => {
  render(<TicketThread locale={locale} ticket={{
    id: "ticket-1", category: "GENERAL", subject: "A retained ticket", status: "WAITING_FOR_MEMBER",
    version: 1, createdAt: "2026-11-09", updatedAt: "2026-11-09", hasMore: false, page: 1,
    messages: [{ id: "message-1", body: "", authorRole: "ADMINISTRATOR", createdAt: "2026-11-09", attachments: [] }],
  }} />);
  expect(screen.getByText(label)).toBeVisible();
});
