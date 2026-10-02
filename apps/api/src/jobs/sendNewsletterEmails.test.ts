import { beforeEach, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  newsletterDelivery: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
  newsletterCampaign: { updateMany: vi.fn() },
}));
const sendEmail = vi.hoisted(() => vi.fn());
vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../lib/cloudflareEmail.js", () => ({ sendEmail }));
const { processNewsletterBatch } = await import("./sendNewsletterEmails.js");

beforeEach(() => { vi.clearAllMocks(); });

it("cancels a queued email after unsubscribe without contacting the provider", async () => {
  prismaMock.$queryRaw.mockResolvedValue([{ id: "delivery-1", campaignId: "campaign-1", attempts: 1 }]);
  prismaMock.newsletterDelivery.findUnique.mockResolvedValue({ subscriber: { active: false }, campaign: { status: "QUEUED", article: null } });
  prismaMock.newsletterDelivery.count.mockResolvedValue(0);
  expect(await processNewsletterBatch()).toBe(1);
  expect(sendEmail).not.toHaveBeenCalled();
  expect(prismaMock.newsletterDelivery.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED" }) }));
  expect(prismaMock.newsletterCampaign.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "COMPLETE" } }));
});

it("sends only escaped editorial content with article and unsubscribe links", async () => {
  process.env.BLOG_PUBLIC_URL = "https://blog.example.test";
  prismaMock.$queryRaw.mockResolvedValue([{ id: "delivery-2", campaignId: "campaign-2", attempts: 1 }]);
  prismaMock.newsletterDelivery.findUnique.mockResolvedValue({
    subscriber: { active: true, email: "reader@example.test", unsubscribeToken: "token-123" },
    campaign: { status: "QUEUED", subject: "News", previewText: "Preview", body: "<script>alert(1)</script>", article: { published: true, slug: "new-article" } },
  });
  prismaMock.newsletterDelivery.count.mockResolvedValue(0);
  sendEmail.mockResolvedValue({ outcome: "sent", statusCode: 200 });
  expect(await processNewsletterBatch()).toBe(1);
  expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
    to: "reader@example.test",
    html: expect.stringContaining("&lt;script&gt;"),
    text: expect.stringContaining("https://blog.example.test/unsubscribe?token=token-123"),
  }));
  expect(sendEmail.mock.calls[0][0].html).not.toContain("<script>");
  expect(prismaMock.newsletterDelivery.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "SENT" }) }));
});
