import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ list: vi.fn(), mark: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/lib/notification-api", () => ({
  getMarketplaceNotifications: mocks.list,
  markMarketplaceNotificationsRead: mocks.mark,
}));
const { NotificationMenu } = await import("./notification-menu");
const { notificationsCopy } = await import("./notifications-copy");
const text = notificationsCopy.en;

const notification = {
  id: "notification-1",
  type: "changes_requested" as const,
  productName: "Owned Skill",
  productSlug: "owned-skill",
  publicReason: "Clarify network access.",
  readAt: null,
  createdAt: "2026-11-01T09:00:00.000Z",
};

describe("NotificationMenu", () => {
  afterEach(cleanup);
  beforeEach(() => vi.clearAllMocks());

  it("routes private support alerts alongside moderation without showing message previews", async () => {
    mocks.list.mockResolvedValue({ unread: 2, notifications: [notification, {
      id: "support-1", type: "support_reply", ticketId: "ticket-1", staff: false,
      readAt: null, createdAt: notification.createdAt, body: "Private message must not be previewed",
    }] });
    render(<NotificationMenu />);
    fireEvent.click(await screen.findByRole("button", { name: `${text.label} (2 unread)` }));
    expect(screen.getByRole("link", { name: /Support ticket/ })).toHaveAttribute("href", "/support/ticket-1");
    expect(screen.getByRole("link", { name: /Owned Skill/ })).toHaveAttribute("href", "/dashboard/studio");
    expect(screen.queryByText("Private message must not be previewed")).not.toBeInTheDocument();
  });

  it("links staff alerts to the protected staff thread", async () => {
    mocks.list.mockResolvedValue({ unread: 1, notifications: [{
      id: "support-2", type: "support_created", ticketId: "ticket-2", staff: true,
      readAt: null, createdAt: notification.createdAt,
    }] });
    render(<NotificationMenu />);
    fireEvent.click(await screen.findByRole("button", { name: `${text.label} (1 unread)` }));
    expect(screen.getByRole("link", { name: /Support ticket/ })).toHaveAttribute("href", "/support/admin/ticket-2");
  });

  it("shows the unread count, the decision and its public reason", async () => {
    mocks.list.mockResolvedValue({ unread: 2, notifications: [notification, { ...notification, id: "notification-2", type: "approved", productName: "Second Skill", productSlug: "second-skill", publicReason: null }] });
    mocks.mark.mockResolvedValue({ updated: 2, unread: 0 });
    render(<NotificationMenu />);

    const trigger = await screen.findByRole("button", { name: `${text.label} (2 unread)` });
    fireEvent.click(trigger);

    expect(screen.getByRole("heading", { name: text.title })).toBeVisible();
    expect(screen.getByText("Owned Skill")).toBeVisible();
    expect(screen.getByText(text.changes_requested)).toBeVisible();
    expect(screen.getByText(`${text.reviewerNote}: Clarify network access.`)).toBeVisible();
    expect(screen.getByRole("link", { name: /Owned Skill/ })).toHaveAttribute("href", "/dashboard/studio");

    fireEvent.click(screen.getByRole("button", { name: text.markAllRead }));

    await waitFor(() => expect(mocks.mark).toHaveBeenCalledWith());
    expect(await screen.findByRole("status")).toHaveTextContent(text.markedAll);
    expect(screen.getByRole("button", { name: text.label })).toBeVisible();
  });

  it("explains an empty feed instead of showing a blank panel", async () => {
    mocks.list.mockResolvedValue({ unread: 0, notifications: [] });
    render(<NotificationMenu />);
    fireEvent.click(await screen.findByRole("button", { name: text.label }));
    expect(screen.getByText(text.empty)).toBeVisible();
    expect(screen.queryByRole("button", { name: text.markAllRead })).not.toBeInTheDocument();
  });

  it("recovers a failed load with Retry", async () => {
    mocks.list.mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ unread: 0, notifications: [] });
    render(<NotificationMenu />);
    fireEvent.click(await screen.findByRole("button", { name: text.label }));
    expect(await screen.findByRole("alert")).toHaveTextContent(text.loadError);

    fireEvent.click(screen.getByRole("button", { name: text.retry }));
    expect(await screen.findByText(text.empty)).toBeVisible();
    expect(mocks.list).toHaveBeenCalledTimes(2);
  });

  it("marks one notification read when its link is used", async () => {
    mocks.list.mockResolvedValue({ unread: 1, notifications: [notification] });
    mocks.mark.mockResolvedValue({ updated: 1, unread: 0 });
    render(<NotificationMenu />);
    fireEvent.click(await screen.findByRole("button", { name: `${text.label} (1 unread)` }));
    const link = screen.getByRole("link", { name: /Owned Skill/ });
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(link);

    await waitFor(() => expect(mocks.mark).toHaveBeenCalledWith(["notification-1"]));
  });
});
