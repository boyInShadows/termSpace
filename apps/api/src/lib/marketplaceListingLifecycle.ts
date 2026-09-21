import { MARKETPLACE_DATABASE_ITEM_TYPES, MARKETPLACE_ITEM_TYPE_REGISTRY, validateMarketplaceManifest, type MarketplaceManifestV1 } from "./marketplaceManifest.js";

export const MARKETPLACE_LISTING_STATES = [
  "DRAFT", "SUBMITTED", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED", "REJECTED", "SUSPENDED", "ARCHIVED",
] as const;
export type MarketplaceListingStateValue = typeof MARKETPLACE_LISTING_STATES[number];

export const MARKETPLACE_LISTING_ACTIONS = [
  "SUBMIT", "WITHDRAW", "REQUEST_CHANGES", "APPROVE", "PUBLISH", "REJECT", "SUSPEND", "REINSTATE", "ARCHIVE", "RESTORE",
] as const;
export type MarketplaceListingAction = typeof MARKETPLACE_LISTING_ACTIONS[number];
export type MarketplaceLifecycleActor = "CREATOR" | "MODERATOR" | "ADMINISTRATOR";

export class MarketplaceLifecycleError extends Error {
  constructor(public readonly code: "INVALID_LISTING_TRANSITION" | "PROPOSED_SNAPSHOT_REQUIRED" | "APPROVED_SNAPSHOT_REQUIRED" | "RESUME_STATE_REQUIRED", message: string) {
    super(message);
  }
}

export interface MarketplaceListingLifecycleContext {
  state: MarketplaceListingStateValue;
  published: boolean;
  hasApprovedSnapshot: boolean;
  hasProposedSnapshot: boolean;
  resumeState: MarketplaceListingStateValue | null;
  resumePublished: boolean | null;
  archivedBy: MarketplaceLifecycleActor | "SYSTEM" | null;
}

export interface MarketplaceListingTransitionResult {
  state: MarketplaceListingStateValue;
  published: boolean;
  approvedSnapshot: "keep" | "promote-proposed";
  proposedSnapshot: "keep" | "clear";
  resumeState: MarketplaceListingStateValue | null;
  resumePublished: boolean | null;
  eventAction: "SUBMITTED" | "WITHDRAWN" | "CHANGES_REQUESTED" | "APPROVED" | "PUBLISHED" | "REJECTED" | "SUSPENDED" | "REINSTATED" | "ARCHIVED" | "RESTORED";
}

const creatorActions = new Set<MarketplaceListingAction>(["SUBMIT", "WITHDRAW", "ARCHIVE", "RESTORE"]);
const staffActions = new Set<MarketplaceListingAction>(["REQUEST_CHANGES", "APPROVE", "PUBLISH", "REJECT", "SUSPEND", "REINSTATE", "ARCHIVE", "RESTORE"]);

function invalid(state: MarketplaceListingStateValue, action: MarketplaceListingAction): never {
  throw new MarketplaceLifecycleError("INVALID_LISTING_TRANSITION", `Cannot ${action.toLowerCase().replace("_", " ")} a listing in ${state.toLowerCase()} state`);
}

export function resolveMarketplaceListingTransition(
  context: MarketplaceListingLifecycleContext,
  action: MarketplaceListingAction,
  actor: MarketplaceLifecycleActor,
): MarketplaceListingTransitionResult {
  if (actor === "CREATOR" ? !creatorActions.has(action) : !staffActions.has(action)) invalid(context.state, action);

  const unchanged = {
    published: context.published,
    approvedSnapshot: "keep" as const,
    proposedSnapshot: "keep" as const,
    resumeState: context.resumeState,
    resumePublished: context.resumePublished,
  };

  if (action === "SUBMIT") {
    if (!["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(context.state)) invalid(context.state, action);
    if (!context.hasProposedSnapshot) throw new MarketplaceLifecycleError("PROPOSED_SNAPSHOT_REQUIRED", "Save a proposed listing snapshot before submission");
    return { ...unchanged, state: "SUBMITTED", eventAction: "SUBMITTED" };
  }
  if (action === "WITHDRAW") {
    if (context.state !== "SUBMITTED") invalid(context.state, action);
    return { ...unchanged, state: "DRAFT", eventAction: "WITHDRAWN" };
  }
  if (action === "REQUEST_CHANGES") {
    if (!["SUBMITTED", "APPROVED"].includes(context.state)) invalid(context.state, action);
    return { ...unchanged, state: "CHANGES_REQUESTED", eventAction: "CHANGES_REQUESTED" };
  }
  if (action === "REJECT") {
    if (!["SUBMITTED", "APPROVED"].includes(context.state)) invalid(context.state, action);
    return { ...unchanged, state: "REJECTED", eventAction: "REJECTED" };
  }
  if (action === "APPROVE") {
    if (context.state !== "SUBMITTED") invalid(context.state, action);
    if (!context.hasProposedSnapshot) throw new MarketplaceLifecycleError("PROPOSED_SNAPSHOT_REQUIRED", "A proposed snapshot is required for approval");
    return { ...unchanged, state: "APPROVED", eventAction: "APPROVED" };
  }
  if (action === "PUBLISH") {
    if (context.state !== "APPROVED") invalid(context.state, action);
    if (!context.hasProposedSnapshot) throw new MarketplaceLifecycleError("APPROVED_SNAPSHOT_REQUIRED", "An approved publication candidate is required for publication");
    return { ...unchanged, state: "PUBLISHED", published: true, approvedSnapshot: "promote-proposed", proposedSnapshot: "clear", eventAction: "PUBLISHED" };
  }
  if (action === "SUSPEND") {
    if (!context.published || context.state === "SUSPENDED" || context.state === "ARCHIVED") invalid(context.state, action);
    return { ...unchanged, state: "SUSPENDED", published: false, resumeState: context.state, resumePublished: context.published, eventAction: "SUSPENDED" };
  }
  if (action === "REINSTATE") {
    if (context.state !== "SUSPENDED") invalid(context.state, action);
    if (!context.resumeState || context.resumePublished === null) throw new MarketplaceLifecycleError("RESUME_STATE_REQUIRED", "Suspended listing has no recoverable prior state");
    return { ...unchanged, state: context.resumeState, published: context.resumePublished, resumeState: null, resumePublished: null, eventAction: "REINSTATED" };
  }
  if (action === "ARCHIVE") {
    if (context.state === "ARCHIVED" || context.state === "SUSPENDED") invalid(context.state, action);
    return { ...unchanged, state: "ARCHIVED", published: false, resumeState: context.state, resumePublished: context.published, eventAction: "ARCHIVED" };
  }
  if (action === "RESTORE") {
    if (context.state !== "ARCHIVED") invalid(context.state, action);
    if (actor === "CREATOR" && context.archivedBy !== "CREATOR") {
      throw new MarketplaceLifecycleError("INVALID_LISTING_TRANSITION", "Only marketplace staff can restore a staff-archived listing");
    }
    if (!context.resumeState || context.resumePublished === null) throw new MarketplaceLifecycleError("RESUME_STATE_REQUIRED", "Archived listing has no recoverable prior state");
    return { ...unchanged, state: context.resumeState, published: context.resumePublished, resumeState: null, resumePublished: null, eventAction: "RESTORED" };
  }
  return invalid(context.state, action);
}

export function listingSnapshotFromManifest(input: unknown) {
  const { manifest, snapshot, digestSha256 } = validateMarketplaceManifest(input);
  return { schemaVersion: manifest.manifestVersion, itemType: manifest.type, content: snapshot, digestSha256 };
}

export function marketplaceProductProjectionFromManifest(manifest: MarketplaceManifestV1, categoryId: string) {
  const platformKeys = manifest.release.compatibility.map(({ platform }) => platform);
  const requirementLabels = [
    ...manifest.release.requirements.runtimes,
    ...manifest.release.requirements.accounts,
    ...manifest.release.requirements.operatingSystems,
    ...manifest.release.requirements.dependencies,
    ...manifest.release.requirements.environmentVariables.map(({ name }) => name),
  ];
  return {
    slug: manifest.listing.slug,
    name: manifest.listing.name.en,
    type: MARKETPLACE_ITEM_TYPE_REGISTRY[manifest.type].en,
    itemType: MARKETPLACE_DATABASE_ITEM_TYPES[manifest.type],
    classificationRequired: false,
    outcome: manifest.listing.outcome.en,
    description: manifest.listing.description.en ?? manifest.listing.description.fa!,
    categoryId,
    tags: manifest.listing.tags,
    platforms: platformKeys,
    compatibility: {
      deleteMany: {},
      create: platformKeys.map((platformKey) => ({ platformKey })),
    },
    models: [...new Set(manifest.release.compatibility.flatMap(({ models }) => models))],
    version: manifest.release.version,
    installationSteps: manifest.release.installation.instructions,
    requirements: requirementLabels.length ? requirementLabels.join(" · ") : null,
    permissions: manifest.release.permissions.length
      ? manifest.release.permissions.map(({ capability, purpose }) => `${capability}: ${purpose}`).join(" · ")
      : "No declared elevated capabilities",
    license: manifest.release.license.identifier ?? manifest.release.license.customUrl ?? null,
  };
}

export function publicMarketplaceListingState(state: MarketplaceListingStateValue): string {
  return state.toLowerCase();
}
