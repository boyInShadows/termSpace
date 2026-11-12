import { describe, expect, it } from "vitest";
import { buildManifest } from "./creator-draft-editor";
import { marketplaceManifestV1Schema } from "../../../api/src/lib/marketplaceManifest";

describe("creator draft manifest fields", () => {
  it("omits blank optional scalar details while retaining false declarations", () => {
    const data = new FormData();
    data.set("detail_callback", "   ");
    const integration = buildManifest(data, "integration", "external_link", false);
    expect(integration.typeDetails).not.toHaveProperty("callback");
    expect(buildManifest(data, "skill", "external_link", false).typeDetails).toHaveProperty("bundledExecutables", false);
  });
  it("saves an integration with an omitted optional callback under the real API contract", () => {
    const data = new FormData();
    for (const [key, value] of Object.entries({ nameEn: "Review Tool", slug: "review-tool", categorySlug: "development", outcomeEn: "Review code safely", descriptionEn: "Explains code changes.", releaseVersion: "1.0.0", releaseNotes: "Initial release", projectUrl: "https://example.com/tool", authorship: "own", installationMethod: "manual", installationInstructions: "Read the installation guide", license: "MIT", compatibility: '[["codex","",""]]', detail_integrationKind: "connector", detail_hostPlatform: "codex", detail_installationIdentifier: "example-tool", detail_connectedService: "GitHub", detail_authentication: "Uses the member account", detail_dataFlow: "Reads pull request metadata", detail_callback: " " })) data.set(key, value);
    const manifest = buildManifest(data, "integration", "external_link", false);
    expect(marketplaceManifestV1Schema.safeParse(manifest).success).toBe(true);
  });
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
