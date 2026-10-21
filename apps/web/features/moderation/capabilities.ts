import { capabilityLabel } from "@/features/product/release-provenance";

export { capabilityLabel };

/**
 * Capabilities that read secrets, change the machine, or reach the network.
 * They are flagged for a closer look, never blocked: the list steers a
 * moderator's attention, the decision stays theirs.
 */
const NEEDS_CLOSER_LOOK = new Set(["secret_access", "process_execution", "filesystem_write", "network_access"]);

export const needsCloserLook = (capability: string) => NEEDS_CLOSER_LOOK.has(capability);

export type DeclaredCapability = {
  capability: string;
  required: boolean;
  scope: string | null;
  destinations: string[];
  purpose: string;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The release's declared permissions, read defensively from a stored manifest. Risky ones first. */
export function readCapabilities(content: unknown): DeclaredCapability[] {
  const release = isRecord(content) && isRecord(content.release) ? content.release : null;
  const entries = release && Array.isArray(release.permissions) ? release.permissions : [];
  return entries
    .flatMap((entry): DeclaredCapability[] => isRecord(entry) && typeof entry.capability === "string"
      ? [{
          capability: entry.capability,
          required: entry.required !== false,
          scope: typeof entry.scope === "string" ? entry.scope : null,
          // Sorted, so the same destinations in another order do not read as a change.
          destinations: Array.isArray(entry.destinations) ? entry.destinations.filter((item): item is string => typeof item === "string").sort() : [],
          purpose: typeof entry.purpose === "string" ? entry.purpose : "",
        }]
      : [])
    .sort((a, b) => Number(needsCloserLook(b.capability)) - Number(needsCloserLook(a.capability)));
}

/** What changed in the declared access between the approved version and the proposed one. */
export function diffCapabilities(proposed: DeclaredCapability[], approved: DeclaredCapability[]) {
  const before = new Map(approved.map((entry) => [entry.capability, JSON.stringify(entry)]));
  const after = new Set(proposed.map((entry) => entry.capability));
  const marks = new Map<string, "new" | "changed">();
  for (const entry of proposed) {
    const previous = before.get(entry.capability);
    if (previous === undefined) marks.set(entry.capability, "new");
    else if (previous !== JSON.stringify(entry)) marks.set(entry.capability, "changed");
  }
  return { marks, removed: approved.filter((entry) => !after.has(entry.capability)) };
}

const SECTIONS = ["listing", "compatibility", "installation", "requirements", "permissions", "license", "source", "typeDetails"] as const;
export type ManifestSection = (typeof SECTIONS)[number];

function sectionValue(content: unknown, section: ManifestSection): unknown {
  if (!isRecord(content)) return undefined;
  if (section === "listing" || section === "typeDetails") return content[section];
  return isRecord(content.release) ? content.release[section] : undefined;
}

/** Which parts of a manifest differ between the proposed and the approved version. */
export function changedSections(proposed: unknown, approved: unknown): ManifestSection[] {
  return SECTIONS.filter((section) => JSON.stringify(sectionValue(proposed, section)) !== JSON.stringify(sectionValue(approved, section)));
}
