// Create + submit the seed listings as the TermBuddy creator via the public API.
// Env: TERMBUDDY_ORIGIN (e.g. https://termspace.dev), TERMBUDDY_EMAIL, TERMBUDDY_PASSWORD
// Run:  npm exec -w apps/api -- tsx ../../scripts/seed-termbuddy/submit.mts [--only <slug>] [--dry]
// Resumable: progress lives in .state.json (git-ignored); re-running skips finished listings.
// Logs slug/status/latency/request-id only — never bodies or credentials.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateMarketplaceManifest } from "../../apps/api/src/lib/marketplaceManifest.js";

const dir = dirname(fileURLToPath(import.meta.url));
const statePath = join(dir, ".state.json");
const origin = (process.env.TERMBUDDY_ORIGIN ?? "").replace(/\/$/, "");
const email = process.env.TERMBUDDY_EMAIL;
const password = process.env.TERMBUDDY_PASSWORD;
const dry = process.argv.includes("--dry");
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;

if (!dry && (!origin.startsWith("https://") || !email || !password)) {
  console.error("Set TERMBUDDY_ORIGIN (https://…), TERMBUDDY_EMAIL, TERMBUDDY_PASSWORD");
  process.exit(2);
}

type State = Record<string, { id: string; version: number; state: string }>;
const state: State = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : {};
const save = () => writeFileSync(statePath, JSON.stringify(state, null, 2));

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
      console.log(`${label} ${method} ${path.split("?")[0]} → ${res.status} ${Date.now() - started}ms req=${res.headers.get("x-request-id") ?? "-"}`);
      if ((res.status === 429 || res.status >= 500) && attempt < 4) { await sleep(2 ** attempt * 1500); continue; }
      const set = res.headers.getSetCookie?.() ?? [];
      if (set.length) cookie = set.map((c) => c.split(";")[0]).join("; ");
      return { status: res.status, json: await res.json().catch(() => ({})) };
    } catch (error) {
      console.log(`${label} ${method} ${path} → network error (${(error as Error).name}) attempt ${attempt}`);
      if (attempt >= 4) throw error;
      await sleep(2 ** attempt * 1500);
    }
  }
}

const entries = (JSON.parse(readFileSync(join(dir, "listings.json"), "utf8")) as Array<{ manifest: unknown }>)
  .map((entry) => validateMarketplaceManifest(entry.manifest).manifest) // fail before any network call
  .filter((m) => !only || m.listing.slug === only);

if (dry) { console.log(`dry run: ${entries.length} manifests valid, nothing sent`); process.exit(0); }

const login = await call("login", "POST", "/api/readers/login", { email, password });
if (login.status !== 200) { console.error("login failed — stop (check account/verification)"); process.exit(1); }

let failures = 0;
for (const manifest of entries) {
  const slug = manifest.listing.slug;
  try {
    let record = state[slug];
    if (!record) {
      const created = await call(slug, "POST", "/api/marketplace/creator/products", { manifest });
      if (created.status !== 201 && created.status !== 200) throw new Error(`create ${created.status} ${created.json?.error?.code ?? created.json?.code ?? ""}`);
      record = { id: created.json.data.id, version: created.json.data.version, state: String(created.json.data.state).toLowerCase() };
      state[slug] = record; save();
    }
    if (record.state === "draft") {
      const submitted = await call(slug, "POST", `/api/marketplace/creator/products/${record.id}/lifecycle`, { action: "SUBMIT", expectedVersion: record.version });
      if (submitted.status !== 200) throw new Error(`submit ${submitted.status} ${submitted.json?.error?.code ?? submitted.json?.code ?? ""}`);
      record.version = submitted.json.data.version ?? record.version + 1;
      record.state = String(submitted.json.data.state ?? "submitted").toLowerCase();
      console.log(`${slug}: correlation=${submitted.json.data.correlationId ?? "-"}`);
      save();
    }
    console.log(`${slug}: ${record.state}`);
    await sleep(500);
  } catch (error) {
    failures += 1;
    console.error(`${slug}: FAILED ${(error as Error).message}`);
  }
}
console.log(`done: ${entries.length - failures} ok, ${failures} failed`);
process.exit(failures ? 1 : 0);
