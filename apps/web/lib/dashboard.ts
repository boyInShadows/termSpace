import { ApiError, getCreatorDashboard, getOwnedCreatorProfile } from "@/lib/api";
import type { CreatorDashboard, CreatorDashboardListing, OwnedCreatorProfile } from "@/lib/types";

/** The overview table shows at most this many listings, newest first. */
export const OVERVIEW_LISTING_LIMIT = 8;
/** The overview activity feed shows at most this many events. */
export const OVERVIEW_ACTIVITY_LIMIT = 6;

export type DashboardHome =
  | { kind: "creator"; profile: OwnedCreatorProfile; dashboard: CreatorDashboard }
  | { kind: "no-profile" };

/**
 * Everything the dashboard overview renders, from the owner-scoped creator
 * API. A reader without a creator workspace is a normal state, not a failure:
 * the profile endpoint answers 404 and the dashboard endpoint 403, and both
 * collapse to `no-profile`. Anything else propagates so the page can offer a
 * retry.
 */
export async function getDashboardHome(signal?: AbortSignal): Promise<DashboardHome> {
  try {
    const [profile, result] = await Promise.all([
      getOwnedCreatorProfile(),
      getCreatorDashboard(1, OVERVIEW_LISTING_LIMIT, signal),
    ]);
    return { kind: "creator", profile, dashboard: result.data };
  } catch (cause) {
    if (cause instanceof ApiError && (cause.status === 403 || cause.status === 404)) {
      return { kind: "no-profile" };
    }
    throw cause;
  }
}

export type ListingTone = "live" | "review" | "attention" | "draft";

/** Four visual tones for the eight lifecycle states. */
export function listingTone(state: string): ListingTone {
  if (state === "published") return "live";
  if (state === "submitted" || state === "approved") return "review";
  if (state === "changes_requested" || state === "rejected" || state === "suspended") return "attention";
  return "draft";
}

export type ActivityTone = "positive" | "attention" | "progress" | "neutral";

export function activityTone(action: string): ActivityTone {
  if (action === "approved" || action === "published" || action === "reinstated" || action === "restored") return "positive";
  if (action === "changes_requested" || action === "rejected" || action === "suspended") return "attention";
  if (action === "archived") return "neutral";
  return "progress";
}

export type DashboardActivity = {
  id: string;
  action: string;
  listingId: string;
  listingName: string;
  createdAt: string;
};

/**
 * Merges each listing's recent lifecycle events into one newest-first feed.
 *
 * The API returns the three latest events per listing for the most recently
 * updated listings, and a lifecycle event updates its listing, so the newest
 * events overall are always among them.
 */
export function collectActivity(
  listings: CreatorDashboardListing[],
  limit = OVERVIEW_ACTIVITY_LIMIT,
): DashboardActivity[] {
  return listings
    .flatMap((listing) =>
      listing.recentUpdates.map((event) => ({
        id: event.id,
        action: event.action,
        listingId: listing.id,
        listingName: listing.name,
        createdAt: event.createdAt,
      })),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

export type GreetingPeriod = "morning" | "afternoon" | "evening";

export function greetingPeriod(hour: number): GreetingPeriod {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "3 days ago", "yesterday", "now" — in the reader's locale. */
export function formatRelative(iso: string, now: number, locale: string): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(0, "second");
}
