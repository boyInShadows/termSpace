import { randomUUID } from "node:crypto";

const tickets = new Map();

export async function handleSupportFixture({ request, response, pathname, searchParams, persona, send, readJson }) {
  if (!pathname.startsWith("/api/support/")) return false;
  const admin = pathname.startsWith("/api/support/admin/");
  if (admin && persona !== "admin") {
    send(response, 403, { error: { code: "FORBIDDEN", message: "Administrator access required" } });
    return true;
  }
  const base = `/api/support${admin ? "/admin" : ""}/tickets`;
  const match = new RegExp(`^${base}/([^/]+)(?:/(messages|resolve))?$`).exec(pathname);
  const visible = [...tickets.values()].filter(ticket => admin || ticket.ownerId === persona);
  if (pathname === base && request.method === "GET") {
    const status = searchParams.get("status");
    send(response, 200, { data: { tickets: visible.filter(ticket => !status || ticket.status === status), page: 1, hasMore: false } });
  } else if (pathname === base && request.method === "POST" && !admin) {
    const input = await readJson(request);
    const id = randomUUID();
    const now = new Date().toISOString();
    tickets.set(id, { ...input, id, ownerId: persona, status: "WAITING_FOR_SUPPORT", version: 0, createdAt: now, updatedAt: now,
      messages: [{ id: randomUUID(), body: input.body, authorRole: "MEMBER", createdAt: now }] });
    send(response, 201, { data: { id } });
  } else if (match) {
    const ticket = visible.find(item => item.id === match[1]);
    if (!ticket) send(response, 404, { error: { code: "NOT_FOUND", message: "Ticket not found" } });
    else if (request.method === "GET") send(response, 200, { data: { ...ticket, page: 1, hasMore: false } });
    else {
      const input = await readJson(request);
      if (input.expectedVersion !== ticket.version) send(response, 409, { error: { code: "SUPPORT_CONFLICT", message: "Ticket changed" } });
      else {
        ticket.version++;
        ticket.status = match[2] === "resolve" ? "RESOLVED" : admin ? "WAITING_FOR_MEMBER" : "WAITING_FOR_SUPPORT";
        if (match[2] === "messages") ticket.messages.push({ id: randomUUID(), body: input.body, authorRole: admin ? "ADMINISTRATOR" : "MEMBER", createdAt: new Date().toISOString() });
        send(response, 201, { data: { saved: true } });
      }
    }
  } else send(response, 404, { error: { code: "NOT_FOUND", message: "Fixture route not found" } });
  return true;
}
