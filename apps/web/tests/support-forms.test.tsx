import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithLocale as render } from "@/lib/test-render";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { NewTicket } from "@/features/support/new-ticket";
import { TicketThread } from "@/features/support/ticket-thread";
import type { SupportConversation } from "@/lib/support-api";

const api = vi.hoisted(() => ({ create: vi.fn(), get: vi.fn(), change: vi.fn(), push: vi.fn(), staff: false }));
vi.mock("@/lib/support-api", () => ({ createSupportTicket: api.create, getSupportTicket: api.get, changeSupportTicket: api.change }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: api.push }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => ({ emailVerified: true, marketplaceRoles: api.staff ? ["moderator"] : [] }) }));
const conversation: SupportConversation = {
  ticket: { id: "ticket-1", subject: "A question", category: "GENERAL", status: "WAITING_FOR_SUPPORT", version: 0, createdAt: "2026-11-01T12:00:00Z", updatedAt: "2026-11-01T12:00:00Z", requester: "Member", isOwner: true },
  messages: [{ id: "message-1", body: "<script>alert('unsafe')</script>\nSecond line", kind: "MESSAGE", createdAt: "2026-11-01T12:00:00Z", role: "member", isSelf: true, name: "Member", deleted: false }], earlierCursor: null,
};
beforeEach(() => { vi.clearAllMocks(); api.staff = false; api.get.mockResolvedValue(conversation); });

describe("support drafts", () => {
  function fillNew() {
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: " My question " } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: " Details " } });
  }
  it("preserves failed new-ticket text and blocks a second in-flight submission", async () => {
    let reject!: (error: Error) => void;
    api.create.mockReturnValue(new Promise((_resolve, fail) => { reject = fail; }));
    render(<NewTicket />); fillNew();
    fireEvent.click(screen.getByRole("button", { name: "Create ticket" }));
    fireEvent.submit(screen.getByLabelText("Subject").closest("form")!);
    expect(api.create).toHaveBeenCalledTimes(1);
    expect(api.create).toHaveBeenCalledWith({ category: "GENERAL", subject: "My question", message: "Details" });
    await act(async () => reject(new ApiError(503, "UNAVAILABLE", "Unavailable")));
    expect(screen.getByLabelText("Subject")).toHaveValue(" My question ");
    expect(screen.getByRole("alert")).toHaveTextContent("wasn’t sent");
  });
  it("warns on cancelled navigation and opens the saved thread on success", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    api.create.mockResolvedValue({ id: "saved-ticket" });
    render(<NewTicket />); fillNew();
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    screen.getByRole("link", { name: "Cancel" }).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true); expect(confirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Create ticket" }));
    await waitFor(() => expect(api.push).toHaveBeenCalledWith("/dashboard/tickets/saved-ticket?created=1"));
    confirm.mockRestore();
  });
  it("renders message content as text and Enter does not send", async () => {
    render(<TicketThread ticketId="ticket-1" />);
    await screen.findByRole("heading", { name: "A question" });
    expect(screen.getByText(/<script>/).querySelector("script")).toBeNull();
    const reply = screen.getByLabelText("Your reply"); fireEvent.change(reply, { target: { value: "Draft\nSecond line" } });
    fireEvent.keyDown(reply, { key: "Enter" });
    expect(api.change).not.toHaveBeenCalled();
  });
  it("refreshes a stale thread without sending the draft automatically", async () => {
    api.change.mockRejectedValue(new ApiError(409, "SUPPORT_CONFLICT", "Changed"));
    render(<TicketThread ticketId="ticket-1" />);
    await screen.findByRole("heading", { name: "A question" });
    api.get.mockResolvedValue({ ...conversation, ticket: { ...conversation.ticket, version: 1 } });
    fireEvent.change(screen.getByLabelText("Your reply"), { target: { value: "Keep my draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText("Your reply")).toHaveValue("Keep my draft");
    expect(api.change).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("conversation changed");
  });
  it("blocks staff replies after a concurrent resolution while retaining the draft", async () => {
    api.staff = true;
    api.get.mockResolvedValue({ ...conversation, ticket: { ...conversation.ticket, isOwner: false } });
    api.change.mockRejectedValue(new ApiError(409, "SUPPORT_RESOLVED", "Resolved"));
    render(<TicketThread inbox ticketId="ticket-1" />);
    await screen.findByRole("heading", { name: "A question" });
    fireEvent.change(screen.getByLabelText("Your reply"), { target: { value: "Unsent staff response" } });
    api.get.mockResolvedValue({ ...conversation, ticket: { ...conversation.ticket, isOwner: false, status: "RESOLVED", version: 1 } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => expect(screen.getByLabelText("Your reply")).toBeDisabled());
    expect(screen.getByLabelText("Your reply")).toHaveValue("Unsent staff response");
    expect(api.change).toHaveBeenCalledTimes(1);
  });
  it("hides private history on access loss and retains unsent text", async () => {
    api.change.mockRejectedValue(new ApiError(403, "MARKETPLACE_ROLE_REQUIRED", "Revoked"));
    render(<TicketThread ticketId="ticket-1" />);
    await screen.findByRole("heading", { name: "A question" });
    fireEvent.change(screen.getByLabelText("Your reply"), { target: { value: "Draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await screen.findByRole("alert");
    expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Your reply")).toHaveValue("Draft");
    expect(screen.getByLabelText("Your reply")).toBeDisabled();
  });
});
