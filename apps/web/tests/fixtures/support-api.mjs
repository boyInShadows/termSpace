import { randomUUID } from "node:crypto";

const tickets = new Map();
const images = new Map();

async function readInput(request, readJson, owner) {
  if (!request.headers["content-type"]?.startsWith("multipart/form-data")) return { input: await readJson(request), attachments: [] };
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers["content-type"] } }).formData();
  const attachments = [];
  for (const file of form.getAll("screenshots")) {
    if (typeof file === "string") continue;
    const id = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());
    const png = file.type === "image/png" && buffer.length >= 24;
    images.set(id, { owner, buffer, type: file.type });
    attachments.push({ id, width: png ? buffer.readUInt32BE(16) : 48, height: png ? buffer.readUInt32BE(20) : 32, bytes: file.size });
  }
  return { input: JSON.parse(String(form.get("payload"))), attachments };
}

export async function handleSupportFixture({ request, response, pathname, searchParams, persona, send, readJson }) {
  if (!pathname.startsWith("/api/support/")) return false;
  const admin = pathname.startsWith("/api/support/admin/");
  if (admin && persona !== "admin") {
    send(response, 403, { error: { code: "FORBIDDEN", message: "Administrator access required" } });
    return true;
  }
  const download = /^\/api\/support\/(?:admin\/)?attachments\/([^/]+)$/.exec(pathname);
  if (download) {
    const image = images.get(download[1]);
    if (!image || (!admin && image.owner !== persona)) send(response, 404, { error: { code: "NOT_FOUND", message: "Image not found" } });
    else { response.writeHead(200, { "Content-Type": image.type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }); response.end(image.buffer); }
    return true;
  }
  const base = `/api/support${admin ? "/admin" : ""}/tickets`;
  const match = new RegExp(`^${base}/([^/]+)(?:/(messages|resolve))?$`).exec(pathname);
  const visible = [...tickets.values()].filter(ticket => admin || ticket.ownerId === persona);
  if (pathname === base && request.method === "GET") {
    const status = searchParams.get("status");
    send(response, 200, { data: { tickets: visible.filter(ticket => !status || ticket.status === status), page: 1, hasMore: false } });
  } else if (pathname === base && request.method === "POST" && !admin) {
    const { input, attachments } = await readInput(request, readJson, persona);
    const id = randomUUID();
    const now = new Date().toISOString();
    tickets.set(id, { ...input, id, ownerId: persona, status: "WAITING_FOR_SUPPORT", version: 0, createdAt: now, updatedAt: now,
      messages: [{ id: randomUUID(), body: input.body, authorRole: "MEMBER", createdAt: now, attachments }] });
    send(response, 201, { data: { id } });
  } else if (match) {
    const ticket = visible.find(item => item.id === match[1]);
    if (!ticket) send(response, 404, { error: { code: "NOT_FOUND", message: "Ticket not found" } });
    else if (request.method === "GET") send(response, 200, { data: { ...ticket, page: 1, hasMore: false } });
    else {
      const { input, attachments } = await readInput(request, readJson, ticket.ownerId);
      if (input.expectedVersion !== ticket.version) send(response, 409, { error: { code: "SUPPORT_CONFLICT", message: "Ticket changed" } });
      else {
        ticket.version++;
        ticket.status = match[2] === "resolve" ? "RESOLVED" : admin ? "WAITING_FOR_MEMBER" : "WAITING_FOR_SUPPORT";
        if (match[2] === "messages") ticket.messages.push({ id: randomUUID(), body: input.body, authorRole: admin ? "ADMINISTRATOR" : "MEMBER", createdAt: new Date().toISOString(), attachments });
        send(response, 201, { data: { saved: true } });
      }
    }
  } else send(response, 404, { error: { code: "NOT_FOUND", message: "Fixture route not found" } });
  return true;
}
