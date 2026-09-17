import { describe, expect, it } from "vitest";
import { buildManifest } from "./creator-draft-editor";

describe("creator draft manifest fields", () => {
  it("stores one English name and a Persian-only description", () => {
    const data = new FormData();
    data.set("nameEn", "Review Skill");
    data.set("outcomeEn", "Reviews code");
    data.set("descriptionFa", "کد را با دقت بررسی می‌کند");

    const manifest = buildManifest(data, "skill", "github_repository", false);

    expect(manifest.listing.name).toEqual({ en: "Review Skill" });
    expect(manifest.listing.description).toEqual({ fa: "کد را با دقت بررسی می‌کند" });
  });

  it("stores both descriptions when both are provided", () => {
    const data = new FormData();
    data.set("nameEn", "Review Skill");
    data.set("outcomeEn", "Reviews code");
    data.set("descriptionEn", "Reviews code carefully");
    data.set("descriptionFa", "کد را با دقت بررسی می‌کند");

    const manifest = buildManifest(data, "skill", "github_repository", false);

    expect(manifest.listing.description).toEqual({ en: "Reviews code carefully", fa: "کد را با دقت بررسی می‌کند" });
  });
});
