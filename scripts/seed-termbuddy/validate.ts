// Offline check + preview generator for the TermBuddy seed listings. No network, no DB.
// Run: npm exec -w apps/api -- tsx ../../scripts/seed-termbuddy/validate.ts
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateMarketplaceManifest } from "../../apps/api/src/lib/marketplaceManifest.js";

const dir = dirname(fileURLToPath(import.meta.url));
const entries = JSON.parse(readFileSync(join(dir, "listings.json"), "utf8")) as Array<{ sources: string[]; manifest: unknown }>;

const seen = new Set<string>();
const blocks: string[] = [];
let failed = 0;

for (const [index, entry] of entries.entries()) {
  const label = (entry.manifest as { listing?: { slug?: string } })?.listing?.slug ?? `#${index}`;
  try {
    const { manifest } = validateMarketplaceManifest(entry.manifest);
    if (seen.has(manifest.listing.slug)) throw new Error("duplicate slug");
    seen.add(manifest.listing.slug);
    if (entry.sources.length === 0) throw new Error("no sources recorded");
    const r = manifest.release;
    const src = r.source.kind === "external_link" ? r.source : null;
    blocks.push([
      `## ${manifest.listing.name.en}  \`${manifest.type}\` · ${manifest.listing.categorySlug}`,
      `*${manifest.listing.outcome.en}*`,
      "",
      manifest.listing.description.en ?? "",
      "",
      `- slug: \`${manifest.listing.slug}\` · version ${r.version} · licence ${r.license.identifier ?? r.license.customUrl}`,
      `- author: ${src?.originalAuthor ?? "?"} · source: ${src?.url ?? r.source.kind}`,
      `- platforms: ${r.compatibility.map((c) => c.platform).join(", ")}`,
      `- permissions: ${r.permissions.map((p) => p.capability).join(", ") || "none"}`,
      `- tags: ${manifest.listing.tags.join(", ")} · communities: ${manifest.listing.communitySlugs.join(", ") || "none"}`,
      `- checked: ${entry.sources.join(" ")}`,
      "",
    ].join("\n"));
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${label}:`, error instanceof Error ? error.message : error);
  }
}

if (failed) {
  console.error(`${failed} of ${entries.length} manifests invalid`);
  process.exit(1);
}
writeFileSync(join(dir, "preview.md"), `# TermBuddy seed preview (${entries.length} listings)\n\n${blocks.join("\n---\n\n")}`);
console.log(`OK ${entries.length} manifests valid → scripts/seed-termbuddy/preview.md`);
