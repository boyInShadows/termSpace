import type { MarketplaceItemTypeKey } from "@/lib/types";

export type DraftCheckpoint = {
  version: number | null;
  step: number;
  type: MarketplaceItemTypeKey;
  sourceKind: "github_repository" | "github_release" | "npm";
  customLicense: boolean;
  fields: [string, string][];
};

// Browser checkpoints are untrusted input, just like imported declarations.
export function parseDraftCheckpoint(raw: string): DraftCheckpoint {
  const value = JSON.parse(raw) as DraftCheckpoint;
  if (!value || (value.version !== null && (!Number.isInteger(value.version) || value.version < 1))
    || !Number.isInteger(value.step) || value.step < 0 || value.step > 4
    || !["skill", "agent", "mcp_server", "integration", "rule", "prompt", "hook", "template", "workflow"].includes(value.type)
    || !["github_repository", "github_release", "npm"].includes(value.sourceKind)
    || typeof value.customLicense !== "boolean"
    || !Array.isArray(value.fields) || !value.fields.every((field) => Array.isArray(field) && field.length === 2 && field.every((cell) => typeof cell === "string"))) {
    throw new Error("Invalid draft checkpoint");
  }
  const rowWidths: Record<string, number> = { screenshots: 3, compatibility: 3, environmentVariables: 4, permissions: 5, detail_stages: 3 };
  for (const [name, field] of value.fields) {
    if (!Object.hasOwn(rowWidths, name)) continue;
    const rows: unknown = JSON.parse(field);
    if (!Array.isArray(rows) || !rows.every((row) => Array.isArray(row) && row.length === rowWidths[name] && row.every((cell) => typeof cell === "string"))) {
      throw new Error("Invalid draft rows");
    }
  }
  return value;
}
