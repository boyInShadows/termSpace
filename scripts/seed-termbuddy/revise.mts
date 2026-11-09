// Re-save already-created seed listings with the current listings.json (new platforms, icon), then resubmit.
// Env: TERMBUDDY_ORIGIN, TERMBUDDY_EMAIL, TERMBUDDY_PASSWORD (same as submit.mts)
// Run:  npm exec -w apps/api -- tsx ../../scripts/seed-termbuddy/revise.mts [--status] [--only a,b]
// --status is read-only: prints each listing's live state and exits.
// SUBMITTED listings are withdrawn first (the API only allows edits from DRAFT/CHANGES_REQUESTED/REJECTED/PUBLISHED).
// APPROVED ones are skipped and reported: only staff can send them back, and doing so is the reviewer's call.
// Logs slug/status/latency only — never bodies or credentials.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateMarketplaceManifest } from "../../apps/api/src/lib/marketplaceManifest.js";

const dir = dirname(fileURLToPath(import.meta.url));
const origin = (process.env.TERMBUDDY_ORIGIN ?? "").replace(/\/$/, "");
const email = process.env.TERMBUDDY_EMAIL;
const password = process.env.TERMBUDDY_PASSWORD;
const statusOnly = process.argv.includes("--status");
const onlyArg = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : "";
const only = onlyArg ? new Set(onlyArg.split(",")) : null;

if (!origin.startsWith("https://") || !email || !password) {
  console.error("Set TERMBUDDY_ORIGIN (https://…), TERMBUDDY_EMAIL, TERMBUDDY_PASSWORD");
  process.exit(2);
}

const state = JSON.parse(readFileSync(join(dir, ".state.json"), "utf8")) as Record<string, { id: string }>;
const entries = (JSON.parse(readFileSync(join(dir, "listings.json"), "utf8")) as Array<{ manifest: unknown }>)
  .map((entry) => validateMarketplaceManifest(entry.manifest).manifest) // fail before any network call
  .filter((m) => !only || only.has(m.listing.slug));

let cookie = "";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function call(label: string, method: string, path: string, body?: unknown): Promise<{ status: number; json: any }> {
  for (let attempt = 1; ; attempt += 1) {
    const started = Date.now();
    try {
      const res = await fetch(`${origin}/backend${path}`, {
        method,
        headers: { "content-type": "application/json", origin, ...(cookie ? { cookie } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });
      console.log(`${label} ${method} ${path.split("?")[0].replace(/[a-z0-9]{20,}/g, ":id")} → ${res.status} ${Date.now() - started}ms req=${res.headers.get("x-request-id") ?? "-"}`);
      if ((res.status === 429 || res.status >= 500) && attempt < 4) { await sleep(2 ** attempt * 1500); continue; }
      const set = res.headers.getSetCookie?.() ?? [];
      if (set.length) cookie = set.map((c) => c.split(";")[0]).join("; ");
      return { status: res.status, json: await res.json().catch(() => ({})) };
    } catch (error) {
      console.log(`${label} ${method} → network error (${(error as Error).name}) attempt ${attempt}`);
      if (attempt >= 4) throw error;
      await sleep(2 ** attempt * 1500);
    }
  }
}

const errorCode = (r: { json: any }) => r.json?.error?.code ?? r.json?.code ?? "";

const login = await call("login", "POST", "/api/readers/login", { email, password });
if (login.status !== 200) { console.error("login failed — stop"); process.exit(1); }

const counts: Record<string, number> = {};
let failures = 0;
for (const manifest of entries) {
  const slug = manifest.listing.slug;
  const id = state[slug]?.id;
  try {
    if (!id) throw new Error("no id in .state.json");
    const path = `/api/marketplace/creator/products/${id}`;
    let live = await call(slug, "GET", `${path}/draft`);
    if (live.status !== 200) throw new Error(`read ${live.status} ${errorCode(live)}`);
    let { state: s, version, published } = live.json.data as { state: string; version: number; published: boolean };
    counts[s] = (counts[s] ?? 0) + 1;
    if (statusOnly) { console.log(`${slug}: ${s}${published ? " (published)" : ""}`); continue; }

    if (s === "submitted") {
      const w = await call(slug, "POST", `${path}/lifecycle`, { action: "WITHDRAW", expectedVersion: version });
      if (w.status !== 200) throw new Error(`withdraw ${w.status} ${errorCode(w)}`);
      version = w.json.data.version; s = String(w.json.data.state).toLowerCase();
    }
    if (!["draft", "changes_requested", "rejected", "published"].includes(s)) {
      console.log(`${slug}: SKIPPED in state ${s} (not creator-editable)`);
      continue;
    }
    const saved = await call(slug, "PUT", `${path}/draft`, { manifest, expectedVersion: version });
    if (saved.status !== 200) throw new Error(`save ${saved.status} ${errorCode(saved)}`);
    const sub = await call(slug, "POST", `${path}/lifecycle`, { action: "SUBMIT", expectedVersion: saved.json.data.version });
    if (sub.status !== 200) throw new Error(`submit ${sub.status} ${errorCode(sub)}`);
    console.log(`${slug}: resubmitted → ${sub.json.data.state}`);
    await sleep(500);
  } catch (error) {
    failures += 1;
    console.error(`${slug}: FAILED ${(error as Error).message}`);
  }
}
console.log(`states before: ${JSON.stringify(counts)}; ${entries.length - failures} ok, ${failures} failed`);
process.exit(failures ? 1 : 0);
