import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import type { CreatorDashboardListing } from "@/lib/types";

const getProfile = vi.hoisted(() => vi.fn());
const getDashboard = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, getOwnedCreatorProfile: getProfile, getCreatorDashboard: getDashboard };
});

const {
  activityTone,
  collectActivity,
  formatRelative,
  getDashboardHome,
  greetingPeriod,
  listingTone,
  OVERVIEW_LISTING_LIMIT,
} = await import("./dashboard");

function listing(id: string, events: Array<[string, string]>): CreatorDashboardListing {
  return {
    id, slug: id, name: `Listing ${id}`, type: "Skill", typeKey: "skill", state: "published",
    lifecycleVersion: 1, published: true, rating: 0, reviewCount: 0, acquisitionCount: 0,
    currentVersion: "1.0.0", releaseCount: 1, latestRelease: null, moderationFeedback: null,
    recentUpdates: events.map(([eventId, createdAt]) => ({ id: eventId, action: "published", state: "published", message: null, createdAt })),
    updatedAt: "2026-09-20T00:00:00.000Z",
  };
}

describe("getDashboardHome", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the profile and the first page of listings for a creator", async () => {
    const profile = { id: "c1", name: "Kasra" };
    const data = { summary: { totalListings: 0, publishedListings: 0, inReviewListings: 0, totalAcquisitions: 0, acquisitionsLast7Days: 0, acquisitionsPrevious7Days: 0, averageRating: null, ratedReviewCount: 0 }, listings: [] };
    getProfile.mockResolvedValue(profile);
    getDashboard.mockResolvedValue({ data, meta: {} });

    await expect(getDashboardHome()).resolves.toEqual({ kind: "creator", profile, dashboard: data });
    expect(getDashboard).toHaveBeenCalledWith(1, OVERVIEW_LISTING_LIMIT, undefined);
  });

  it.each([403, 404])("treats a %i as a reader without a creator workspace", async (status) => {
    getProfile.mockRejectedValue(new ApiError(status, "X", "no"));
    getDashboard.mockResolvedValue({ data: {}, meta: {} });

    await expect(getDashboardHome()).resolves.toEqual({ kind: "no-profile" });
  });

  it("propagates real failures so the page can offer a retry", async () => {
    getProfile.mockResolvedValue({});
    getDashboard.mockRejectedValue(new ApiError(500, "INTERNAL", "boom"));

    await expect(getDashboardHome()).rejects.toThrow("boom");
  });
});

describe("collectActivity", () => {
  it("merges every listing's events newest first and caps the feed", () => {
    const listings = [
      listing("a", [["a1", "2026-09-10T00:00:00Z"], ["a2", "2026-09-01T00:00:00Z"]]),
      listing("b", [["b1", "2026-09-12T00:00:00Z"]]),
    ];

    const feed = collectActivity(listings, 2);

    expect(feed.map((item) => item.id)).toEqual(["b1", "a1"]);
    expect(feed[0]).toMatchObject({ listingId: "b", listingName: "Listing b" });
  });
});

describe("tones", () => {
  it("maps lifecycle states to four listing tones", () => {
    expect(listingTone("published")).toBe("live");
    expect(listingTone("submitted")).toBe("review");
    expect(listingTone("approved")).toBe("review");
    expect(listingTone("changes_requested")).toBe("attention");
    expect(listingTone("draft")).toBe("draft");
    expect(listingTone("archived")).toBe("draft");
  });

  it("maps lifecycle actions to activity tones", () => {
    expect(activityTone("published")).toBe("positive");
    expect(activityTone("rejected")).toBe("attention");
    expect(activityTone("submitted")).toBe("progress");
    expect(activityTone("archived")).toBe("neutral");
  });
});

describe("greetingPeriod", () => {
  it("splits the day at noon and 6pm", () => {
    expect(greetingPeriod(0)).toBe("morning");
    expect(greetingPeriod(11)).toBe("morning");
    expect(greetingPeriod(12)).toBe("afternoon");
    expect(greetingPeriod(17)).toBe("afternoon");
    expect(greetingPeriod(18)).toBe("evening");
  });
});

describe("formatRelative", () => {
  const now = Date.parse("2026-09-23T12:00:00Z");

  it("picks the largest whole unit", () => {
    expect(formatRelative("2026-09-20T12:00:00Z", now, "en-US")).toBe("3 days ago");
    expect(formatRelative("2026-09-23T09:00:00Z", now, "en-US")).toBe("3 hours ago");
    expect(formatRelative("2026-09-22T12:00:00Z", now, "en-US")).toBe("yesterday");
  });

  it("says now for anything under a minute", () => {
    expect(formatRelative("2026-09-23T11:59:30Z", now, "en-US")).toBe("now");
  });
});
