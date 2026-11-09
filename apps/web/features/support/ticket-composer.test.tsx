import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale-context";
import { sharedMessages } from "@/lib/i18n";
import { ApiError } from "@/lib/api";
import type { SupportTicket } from "@/lib/support-api";
import { TicketComposer } from "./ticket-composer";
import { supportCopy } from "./support-copy";

const mocks = vi.hoisted(() => ({ reply: vi.fn(), resolve: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/support-api", () => ({ replySupportTicket: mocks.reply, resolveSupportTicket: mocks.resolve }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
const ticket: SupportTicket = { id: "ticket-1", subject: "A problem", category: "TECHNICAL", status: "WAITING_FOR_SUPPORT", version: 2, createdAt: "2026-11-06T00:00:00Z", updatedAt: "2026-11-06T00:00:00Z" };
function view(value = ticket, admin = false) {
  return <LocaleProvider locale="en" messages={sharedMessages("en")}><TicketComposer ticket={value} admin={admin} /></LocaleProvider>;
}

describe("private ticket conversation", () => {
  beforeEach(() => vi.resetAllMocks());
  it("prevents editing a reply while its submitted draft is being saved", async () => {
    let finish!: () => void;
    mocks.reply.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    render(view());
    const field = screen.getByLabelText("Message");
    fireEvent.change(field, { target: { value: "My submitted draft" } });
    fireEvent.submit(screen.getByRole("button", { name: "Send reply" }).closest("form")!);
    expect(field).toBeDisabled();
    finish();
    await waitFor(() => expect(field).not.toBeDisabled());
  });
  it("retains the draft on conflict and retries against the refreshed version", async () => {
    mocks.reply.mockRejectedValueOnce(new ApiError(409, "SUPPORT_CONFLICT", "changed")).mockResolvedValueOnce({});
    const { rerender } = render(view());
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "My unsent answer" } });
    fireEvent.submit(screen.getByRole("button", { name: "Send reply" }).closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(supportCopy.en.conflict);
    expect(screen.getByLabelText("Message")).toHaveValue("My unsent answer");
    expect(mocks.refresh).toHaveBeenCalledOnce();
    rerender(view({ ...ticket, version: 3 }));
    fireEvent.submit(screen.getByRole("button", { name: "Send reply" }).closest("form")!);
    await waitFor(() => expect(mocks.reply).toHaveBeenLastCalledWith("ticket-1", { body: "My unsent answer", expectedVersion: 3 }, false, []));
    await waitFor(() => expect(screen.getByLabelText("Message")).toHaveValue(""));
  });
  it("uses a separate resolve action that preserves the unsent reply", async () => {
    mocks.resolve.mockResolvedValue({});
    render(view());
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Draft answer" } });
    fireEvent.click(screen.getByRole("button", { name: "Mark resolved" }));
    await waitFor(() => expect(mocks.resolve).toHaveBeenCalledWith("ticket-1", 2, false));
    expect(mocks.reply).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Message")).toHaveValue("Draft answer");
  });
  it("allows only a member to reply to a resolved ticket", () => {
    const { rerender } = render(view({ ...ticket, status: "RESOLVED" }));
    expect(screen.getByRole("button", { name: "Send reply" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(supportCopy.en.resolved);
    rerender(view({ ...ticket, status: "RESOLVED" }, true));
    expect(screen.queryByRole("button", { name: "Send reply" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(supportCopy.en.staffResolved);
  });
});
