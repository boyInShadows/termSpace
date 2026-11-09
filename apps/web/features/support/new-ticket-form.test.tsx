import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale-context";
import { sharedMessages } from "@/lib/i18n";
import { ApiError } from "@/lib/api";
import { NewTicketForm } from "./new-ticket-form";
import { supportCopy } from "./support-copy";

const mocks = vi.hoisted(() => ({ create: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/support-api", () => ({ createSupportTicket: mocks.create }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));

describe("new support ticket", () => {
  beforeEach(() => { vi.resetAllMocks(); });
  it.each(["en", "fa"] as const)("retains a %s draft after failure and submits it once on retry", async (locale) => {
    const c = supportCopy[locale];
    mocks.create.mockRejectedValueOnce(new ApiError(503, "UNAVAILABLE", "offline")).mockResolvedValueOnce({ id: "ticket-1" });
    render(<LocaleProvider locale={locale} messages={sharedMessages(locale)}><NewTicketForm /></LocaleProvider>);
    fireEvent.change(screen.getByLabelText(c.subject), { target: { value: "Listing fails" } });
    fireEvent.change(screen.getByLabelText(c.message), { target: { value: "I cannot open the listing from its latest release page." } });
    fireEvent.submit(screen.getByRole("button", { name: c.send }).closest("form")!);
    await screen.findByRole("alert");
    expect(screen.getByLabelText(c.subject)).toHaveValue("Listing fails");
    fireEvent.submit(screen.getByRole("button", { name: c.send }).closest("form")!);
    fireEvent.submit(screen.getByRole("button", { name: c.sending }).closest("form")!);
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(`${locale === "fa" ? "/fa" : ""}/support/ticket-1`));
    expect(mocks.create).toHaveBeenCalledTimes(2);
    expect(mocks.create).toHaveBeenLastCalledWith(expect.objectContaining({ category: "TECHNICAL", subject: "Listing fails" }));
  });
});
