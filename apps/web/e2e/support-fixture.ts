import type { Page } from "@playwright/test";
import type { SupportConversation, SupportTicket, SupportMessage } from "../lib/support-api";

export async function supportFixture(page: Page, options: { staff?: boolean; own?: boolean; empty?: boolean; many?: boolean } = {}) {
  const date = "2026-11-12T08:00:00.000Z";
  let ticket: SupportTicket = {
    id: "ticket-fixture-1", subject: "Help publishing my listing", category: "LISTING", status: "WAITING_FOR_SUPPORT",
    version: 0, createdAt: date, updatedAt: date, isOwner: !options.staff || Boolean(options.own), requester: "Ada Lovelace",
  };
  let messages: SupportMessage[] = [{
    id: "message-1", body: "My listing is ready, but I can’t submit it.\nWhat should I check?", kind: "MESSAGE", createdAt: date,
    isSelf: ticket.isOwner, role: "member", name: "Ada Lovelace", deleted: false,
  }];
  let exists = !options.empty; let writes = 0; let failNext = 0;
  await page.route("**/api/support**", async route => {
    const request = route.request(); const url = new URL(request.url()); const inbox = url.pathname.includes("/inbox");
    const endpoint = url.pathname.replace(/^.*\/api\/support/, "").replace(/^\/inbox/, "");
    const send = (status: number, data: unknown) => route.fulfill({ status, json: data, headers: { "Cache-Control": "no-store" } });
    if (inbox && !options.staff) return send(403, { error: { code: "MARKETPLACE_ROLE_REQUIRED", message: "Role required" } });
    if (request.method() !== "GET") {
      writes += 1;
      if (failNext) { const status = failNext; failNext = 0; return send(status, { error: { code: status === 409 ? "SUPPORT_CONFLICT" : "UNAVAILABLE", message: "Fixture failure" } }); }
      const body = request.postDataJSON();
      if (!endpoint || endpoint === "/") {
        ticket = { ...ticket, subject: body.subject, category: body.category }; exists = true;
        messages = [{ ...messages[0], body: body.message }];
        return send(201, { data: ticket });
      }
      if (body.version !== ticket.version) return send(409, { error: { code: "SUPPORT_CONFLICT", message: "Changed" } });
      const resolve = endpoint.endsWith("/resolve");
      const kind = resolve ? "RESOLVED" : ticket.status === "RESOLVED" ? "REOPENED" : "MESSAGE";
      ticket = { ...ticket, version: ticket.version + 1, status: resolve ? "RESOLVED" : ticket.isOwner ? "WAITING_FOR_SUPPORT" : "WAITING_FOR_MEMBER" };
      messages.push({ id: `message-${messages.length + 1}`, body: resolve ? "" : body.message, kind, createdAt: date,
        isSelf: true, role: ticket.isOwner ? "member" : "support", name: ticket.isOwner ? "Ada Lovelace" : "Support", deleted: false });
      return send(200, { data: ticket });
    }
    if (failNext) { const status = failNext; failNext = 0; return send(status, { error: { code: "UNAVAILABLE", message: "Fixture failure" } }); }
    if (endpoint && endpoint !== "/") return send(200, { data: { ticket, messages, earlierCursor: null } satisfies SupportConversation });
    const q = url.searchParams.get("q")?.toLowerCase(); const category = url.searchParams.get("category"); const status = url.searchParams.get("status");
    const candidates: SupportTicket[] = !exists ? [] : [ticket, ...(options.many ? [
      { ...ticket, id: "ticket-fixture-2", subject: "A question about my account", category: "GENERAL" as const, status: "WAITING_FOR_MEMBER" as const },
      { ...ticket, id: "ticket-fixture-3", subject: "Installation issue on my laptop", category: "TECHNICAL" as const, status: "RESOLVED" as const },
    ] : [])];
    const matches = candidates.filter(item => (!q || item.subject.toLowerCase().includes(q) || item.id.includes(q)) && (!category || category === item.category));
    const counts = { all: matches.length, WAITING_FOR_SUPPORT: 0, WAITING_FOR_MEMBER: 0, RESOLVED: 0 };
    for (const item of matches) counts[item.status] += 1;
    return send(200, { data: { tickets: matches.filter(item => !status || status === item.status).map(item => ({ ...item, preview: messages.findLast(message => message.kind !== "RESOLVED")?.body ?? "" })), counts,
      total: status ? counts[status as keyof typeof counts] : counts.all, page: Number(url.searchParams.get("page") || 1), pageSize: 20 } });
  });
  return { writes: () => writes, fail: (status: number) => { failNext = status; }, ticket: () => ticket };
}
