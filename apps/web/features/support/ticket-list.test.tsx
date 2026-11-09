import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TicketList } from "./ticket-list";

it("labels a waiting member from the staff perspective", () => {
  render(<TicketList locale="en" admin result={{ page: 1, hasMore: false, tickets: [{
    id: "ticket-1", category: "GENERAL", subject: "A question", status: "WAITING_FOR_MEMBER",
    version: 1, createdAt: "2026-11-06", updatedAt: "2026-11-06",
  }] }} />);
  expect(screen.getByText("Waiting for member")).toBeInTheDocument();
});
