import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

const api = vi.hoisted(() => ({ report: vi.fn(), cases: vi.fn(), detail: vi.fn(), reports: vi.fn(), events: vi.fn(), triage: vi.fn() }));
const session = vi.hoisted(() => ({ identityLoading: false, email: "reader@example.test" as string | null, emailVerified: true, marketplaceRoles: ["moderator"] }));
const locale = vi.hoisted(() => ({ value: "en" as "en" | "fa" }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), reportListing: api.report, getReportCases: api.cases, getReportCase: api.detail, getCaseReports: api.reports, getCaseEvents: api.events, triageReportCase: api.triage }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: locale.value }) }));
import { ListingReportForm } from "./listing-report-form";
import { ModerationCase, ModerationCases } from "./moderation-cases";

const record = { id: "case-1", productId: "product-1", reason: "MALICIOUS", state: "NEW", severity: "STANDARD", version: 0, publicReason: null, createdAt: "2026-10-24T00:00:00Z", updatedAt: "2026-10-24T00:00:00Z", product: { name: "Reported Skill", slug: "reported-skill" }, _count: { reports: 2 } };
const meta = { page: 1, limit: 12, total: 1, totalPages: 1 };
const explanation = "The installer sends credentials to an unrelated server.";

beforeEach(() => {
  vi.clearAllMocks();
  session.identityLoading = false; session.email = "reader@example.test"; session.emailVerified = true; session.marketplaceRoles = ["moderator"]; locale.value = "en";
  api.report.mockResolvedValue({ accepted: true, receiptId: "receipt-opaque" });
  api.cases.mockResolvedValue({ data: [record], meta });
  api.detail.mockResolvedValue({ ...record, events: [] });
  api.reports.mockResolvedValue({ data: [{ id: "report-1", explanation, createdAt: record.createdAt }], meta });
  api.events.mockResolvedValue({ data: [], meta: { ...meta, total: 0, totalPages: 0 } });
  api.triage.mockResolvedValue({ id: "case-1", state: "INVESTIGATING", severity: "HIGH", version: 1 });
});
afterEach(cleanup);

describe("listing report form", () => {
  it("links signed-out readers back to the same localized listing", () => {
    session.email = null; locale.value = "fa";
    render(<ListingReportForm slug="reported-skill" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/fa/account?next=%2Ffa%2Fproducts%2Freported-skill");
    expect(api.report).not.toHaveBeenCalled();
  });

  it("allows an unverified reader to submit bounded evidence and shows an opaque receipt", async () => {
    session.emailVerified = false;
    render(<ListingReportForm slug="reported-skill" />);
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "BROKEN_OR_ABANDONED" } });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: `  ${explanation}  ` } });
    fireEvent.click(screen.getByRole("button", { name: "Send report" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Report received");
    expect(api.report).toHaveBeenCalledWith("reported-skill", { reason: "BROKEN_OR_ABANDONED", explanation });
    expect(screen.getByText("receipt-opaque")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it.each([
    [429, "REPORT_RATE_LIMITED", "reporting limit"], [503, "REPORT_SERVICE_BUSY", "busy"],
    [0, "NETWORK_ERROR", "connection"], [504, "CLIENT_TIMEOUT", "timed out"], [404, "LISTING_NOT_FOUND", "unavailable"],
  ])("keeps evidence and explains %s failures", async (status, code, message) => {
    api.report.mockRejectedValue(new ApiError(status, code, "Raw server text"));
    render(<ListingReportForm slug="reported-skill" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: explanation } });
    fireEvent.click(screen.getByRole("button", { name: "Send report" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("textbox")).toHaveValue(explanation);
    expect(screen.getByRole("button", { name: "Send report" })).toBeEnabled();
  });

  it("provides a sign-in recovery action when the session expires during submission", async () => {
    api.report.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "Session expired"));
    render(<ListingReportForm slug="reported-skill" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: explanation } });
    fireEvent.click(screen.getByRole("button", { name: "Send report" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("session has ended");
    expect(screen.getByRole("link")).toHaveAttribute("href", "/account?next=%2Fproducts%2Freported-skill");
  });
});

describe("staff report cases", () => {
  it("does not fetch private evidence without a verified staff role", () => {
    session.marketplaceRoles = ["creator"];
    render(<ModerationCase id="case-1" reportsPage={1} eventsPage={1} />);
    expect(screen.getByRole("alert")).toHaveTextContent("verified moderator");
    expect(api.detail).not.toHaveBeenCalled();
    expect(api.reports).not.toHaveBeenCalled();
    expect(api.events).not.toHaveBeenCalled();
  });

  it("describes a failed queue read without claiming that a report was submitted", async () => {
    api.cases.mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "Unavailable"));
    render(<ModerationCases page={1} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Reporting could not be loaded");
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });

  it("keeps queue state and pagination in locale-preserving URLs", async () => {
    locale.value = "fa";
    api.cases.mockResolvedValue({ data: [record], meta: { ...meta, page: 2, totalPages: 3 } });
    render(<ModerationCases state="NEW" page={2} />);
    await screen.findByRole("heading", { name: "Reported Skill" });
    expect(api.cases).toHaveBeenCalledWith("NEW", 2, expect.any(AbortSignal));
    expect(screen.getByRole("link", { name: "بعدی" })).toHaveAttribute("href", "/fa/moderation/cases?page=3&state=NEW");
    expect(screen.getByRole("link", { name: "بررسی پرونده" })).toHaveAttribute("href", "/fa/moderation/cases/case-1");
  });

  it("renders private explanations as plain text and pages reports separately from history", async () => {
    api.reports.mockResolvedValue({ data: [{ id: "report-1", explanation: "<script>untrusted()</script>", createdAt: record.createdAt }], meta: { ...meta, totalPages: 2 } });
    render(<ModerationCase id="case-1" reportsPage={1} eventsPage={3} />);
    expect(await screen.findByText("<script>untrusted()</script>")).toBeVisible();
    expect(document.querySelector("script")).not.toBeInTheDocument();
    const evidence = screen.getByRole("region", { name: "Original reports" });
    expect(within(evidence).getByRole("link", { name: "Next" })).toHaveAttribute("href", "/moderation/cases/case-1?reportsPage=2&eventsPage=3");
  });

  it("requires explicit reload after a stale decision and preserves the staff explanation", async () => {
    api.triage.mockRejectedValueOnce(new ApiError(409, "CASE_VERSION_CONFLICT", "Changed"));
    render(<ModerationCase id="case-1" reportsPage={1} eventsPage={1} />);
    await screen.findByRole("heading", { name: "Reported Skill" });
    const reason = screen.getByLabelText(/^Reason code/);
    const publicReason = screen.getByLabelText(/^Public-safe explanation/);
    fireEvent.change(reason, { target: { value: "SOURCE_REVIEW" } });
    fireEvent.change(publicReason, { target: { value: "The source is being investigated." } });
    fireEvent.click(screen.getByRole("button", { name: "Save decision" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("case changed");
    expect(screen.getByRole("button", { name: "Save decision" })).toBeDisabled();
    expect(publicReason).toHaveValue("The source is being investigated.");
    api.detail.mockResolvedValue({ ...record, state: "TRIAGED", version: 1, events: [] });
    fireEvent.click(screen.getByRole("button", { name: "Reload case" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save decision" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Save decision" }));
    await screen.findByText("Decision saved to the audit history.");
    expect(api.triage.mock.calls[1][1]).toMatchObject({ expectedVersion: 1, publicReason: "The source is being investigated." });
  });

  it("keeps a resolved case readable without offering to overwrite its decision", async () => {
    api.detail.mockResolvedValue({ ...record, state: "DISMISSED", events: [] });
    render(<ModerationCase id="case-1" reportsPage={1} eventsPage={1} />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("case is resolved"));
    expect(screen.queryByRole("button", { name: "Save decision" })).not.toBeInTheDocument();
    expect(await screen.findByText(explanation)).toBeVisible();
  });

  it("clears private case content when the account changes", async () => {
    const { rerender } = render(<ModerationCase id="case-1" reportsPage={1} eventsPage={1} />);
    await screen.findByText(explanation);
    session.email = "different@example.test"; session.marketplaceRoles = [];
    rerender(<ModerationCase id="case-1" reportsPage={1} eventsPage={1} />);
    expect(screen.queryByText(explanation)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("verified moderator");
  });

  it("clears private evidence immediately when a write reveals revoked staff access", async () => {
    api.triage.mockRejectedValue(new ApiError(403, "MARKETPLACE_ROLE_REQUIRED", "Revoked"));
    render(<ModerationCase id="case-1" reportsPage={1} eventsPage={1} />);
    await screen.findByText(explanation);
    fireEvent.change(screen.getByLabelText(/^Reason code/), { target: { value: "SOURCE_REVIEW" } });
    fireEvent.change(screen.getByLabelText(/^Public-safe explanation/), { target: { value: "The source is being investigated." } });
    fireEvent.click(screen.getByRole("button", { name: "Save decision" }));
    await screen.findByRole("alert");
    expect(screen.queryByText(explanation)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
