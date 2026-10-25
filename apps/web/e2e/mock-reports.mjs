const runs = new Map();
const createdAt = "2026-10-24T00:00:00.000Z";

export async function handleReportFixture({ request, response, pathname, searchParams, persona, send, readJson }) {
  if (/^\/api\/marketplace\/products\/[^/]+\/reviews\/mine$/.test(pathname) && request.method === "GET") {
    send(response, 200, { data: { eligibility: "not_acquired", review: null } });
    return true;
  }
  if (pathname === "/api/marketplace/moderation/queue" && request.method === "GET" && persona === "staff") {
    send(response, 200, { data: { summary: { submitted: 0, approved: 0, awaitingAction: 0 }, listings: [] }, meta: { page: 1, limit: 24, total: 0, totalPages: 0 } });
    return true;
  }
  const reportRoute = /^\/api\/marketplace\/products\/[^/]+\/reports$/.test(pathname);
  if (!reportRoute && !pathname.startsWith("/api/marketplace/moderation/cases")) return false;
  const reply = (status, body) => { send(response, status, body, { "Cache-Control": "private, no-store" }); return true; };
  if (reportRoute && request.method === "POST") {
    const input = await readJson(request);
    return reply(202, { data: { accepted: true, receiptId: `fixture-receipt-${input.reason}` } });
  }
  if (persona !== "staff") return reply(403, { error: { code: "MARKETPLACE_ROLE_REQUIRED", message: "Staff access required" } });
  const run = /(?:^|;\s*)e2e_reports=([a-z0-9-]+)/.exec(request.headers.cookie ?? "")?.[1] ?? "baseline";
  if (!runs.has(run)) runs.set(run, Array.from({ length: 25 }, (_, index) => ({
    id: `case-fixture-${index + 1}`, productId: "fixture-product", reason: "MALICIOUS", state: "NEW", severity: "STANDARD", version: 0,
    publicReason: null, createdAt, updatedAt: createdAt, product: { name: index === 0 ? "Reported listing with a long name that must wrap on a narrow screen" : `Reported fixture ${index + 1}`, slug: "security-audit-agent" }, _count: { reports: 13 },
    events: Array.from({ length: 13 }, (_, position) => ({ id: `event-${position}`, action: "REPORT_RECEIVED", actorType: "READER", previousState: "NEW", resultingState: "NEW", previousSeverity: "STANDARD", resultingSeverity: "STANDARD", reasonCode: "MALICIOUS", publicReason: null, evidenceReference: null, correlationId: `fixture-correlation-${position}`, createdAt })),
  })));
  const cases = runs.get(run);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(48, Math.max(1, Number(searchParams.get("limit") ?? 24)));
  const paged = (rows) => ({ data: rows.slice((page - 1) * limit, page * limit), meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) } });
  if (pathname === "/api/marketplace/moderation/cases" && request.method === "GET") {
    const state = searchParams.get("state");
    return reply(200, paged(cases.filter((record) => !state || record.state === state).map(({ events, ...record }) => record)));
  }
  const match = /^\/api\/marketplace\/moderation\/cases\/([^/]+)(?:\/(reports|events|triage))?$/.exec(pathname);
  const record = cases.find((value) => value.id === match?.[1]);
  if (!record) return reply(404, { error: { code: "CASE_NOT_FOUND", message: "Case not found" } });
  if (request.method === "GET" && !match[2]) return reply(200, { data: record });
  if (request.method === "GET" && match[2] === "events") return reply(200, paged(record.events));
  if (request.method === "GET" && match[2] === "reports") return reply(200, paged(Array.from({ length: 13 }, (_, index) => ({ id: `fixture-report-${index}`, explanation: index === 0 ? `The installer sends credentials to an unrelated server. <script>untrusted()</script> ${"long-evidence-".repeat(80)}` : `Original evidence ${index + 1}: the published installation behavior differs from the declaration.`, createdAt }))));
  if (request.method === "POST" && match[2] === "triage") {
    const input = await readJson(request);
    if (input.expectedVersion !== record.version) return reply(409, { error: { code: "CASE_VERSION_CONFLICT", message: "Case changed" } });
    if (["DISMISSED", "ACTIONED"].includes(record.state)) return reply(409, { error: { code: "CASE_CLOSED", message: "Case resolved" } });
    const state = input.action === "DISMISS" ? "DISMISSED" : input.action === "INVESTIGATE" ? "INVESTIGATING" : "TRIAGED";
    record.events.unshift({ id: `decision-${record.version}`, action: input.action, actorType: "MODERATOR", previousState: record.state, resultingState: state, previousSeverity: record.severity, resultingSeverity: input.severity, reasonCode: input.reasonCode, publicReason: input.publicReason, evidenceReference: input.evidenceReference ?? null, correlationId: `fixture-decision-${record.version}`, createdAt });
    Object.assign(record, { state, severity: input.severity, version: record.version + 1, publicReason: input.publicReason });
    return reply(200, { data: { id: record.id, state: record.state, severity: record.severity, version: record.version, correlationId: record.events[0].correlationId } });
  }
  return reply(404, { error: { code: "NOT_FOUND", message: "Fixture route not found" } });
}
