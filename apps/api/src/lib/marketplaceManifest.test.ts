import { describe, expect, it } from "vitest";
import {
  LEGACY_ITEM_TYPE_MAP,
  MARKETPLACE_ITEM_TYPES,
  marketplaceManifestV1Schema,
  validateMarketplaceManifest,
} from "./marketplaceManifest.js";

const typeDetails = {
  skill: { format: "SKILL.md", entryPath: "SKILL.md", activation: "Install in the skills directory", bundledExecutables: false, inputs: [], outputs: [] },
  agent: { scope: "subagent", entryPath: "agent.md", invocation: "Delegate a review", tools: [], capabilities: ["review"], modelRequirements: [], inputs: [], outputs: ["report"] },
  mcp_server: { transport: "stdio", connectionMethod: "Run the package", distributionIdentity: "@termspace/server", exposedTools: ["search"], exposedResources: [], exposedPrompts: [], authenticationMethod: "Environment token", networkDestinations: ["api.example.com"], dataHandling: "Queries are not retained" },
  integration: { integrationKind: "connector", hostPlatform: "codex", installationIdentifier: "termspace", connectedService: "TermSpace", requestedScopes: ["read:items"], authentication: "OAuth 2.0", dataFlow: "Reads public item metadata" },
  rule: { format: "RULE.md", destinationScope: "repository", entryPath: ".codex/rules/RULE.md", activation: "Loaded for TypeScript files", applicablePaths: ["**/*.ts"], expectedEffect: "Enforces project conventions" },
  prompt: { format: "bundle", entryPaths: ["prompts/review.md"], variables: ["diff"], requiredInputs: ["diff"], outputContract: "A prioritized review", intendedModels: ["model-agnostic"] },
  hook: { events: ["after_file_edit"], hostPlatform: "codex", entryPaths: ["hooks/check.mjs"], runtime: "Node.js 22", behavior: "synchronous", failurePolicy: "Fail the operation", effects: ["process_execution"] },
  template: { templateKind: "project", includedPaths: ["src/index.ts"], outputFormat: "TypeScript project", initializationMethod: "Copy and replace variables", replacementVariables: ["PROJECT_NAME"], executesScripts: false },
  workflow: { stages: [{ name: "Review", description: "Review the proposed change", humanApproval: true }], dependencies: [], executionMethod: "Run stages in order", initialInputs: ["change"], intermediateState: "Review notes", finalOutputs: ["approved change"], retryBehavior: "Retry once", rollbackBehavior: "Restore the prior revision", partialFailureBehavior: "Stop and report" },
} as const;

function manifest(type: keyof typeof typeDetails) {
  return {
    manifestVersion: 1,
    type,
    listing: {
      slug: `example-${type.replace("_", "-")}`,
      name: { en: `Example ${type}` },
      outcome: { en: "Completes a useful task" },
      description: { en: "A complete marketplace test item." },
      categorySlug: "developer-tools",
      communitySlugs: ["codex"],
      tags: ["testing"],
      screenshots: [],
    },
    release: {
      version: "1.0.0",
      source: { kind: "github_repository", repositoryUrl: "https://github.com/example/item", commitSha: "a".repeat(40) },
      releaseNotes: "Initial release",
      compatibility: [{ platform: "codex", models: [] }],
      installation: { method: "manual", instructions: ["Copy the files"] },
      requirements: { runtimes: [], accounts: [], operatingSystems: [], dependencies: [], environmentVariables: [] },
      permissions: [],
      license: { identifier: "MIT" },
    },
    typeDetails: typeDetails[type],
  };
}

describe("marketplace manifest v1", () => {
  it.each(MARKETPLACE_ITEM_TYPES)("accepts a complete %s manifest", (type) => {
    expect(marketplaceManifestV1Schema.safeParse(manifest(type)).success).toBe(true);
  });

  it("rejects unsupported versions, types, and undeclared fields", () => {
    expect(marketplaceManifestV1Schema.safeParse({ ...manifest("skill"), manifestVersion: 2 }).success).toBe(false);
    expect(marketplaceManifestV1Schema.safeParse({ ...manifest("skill"), type: "utility" }).success).toBe(false);
    expect(marketplaceManifestV1Schema.safeParse({ ...manifest("skill"), secretValue: "must-not-be-stored" }).success).toBe(false);
    const environmentInput = manifest("skill");
    environmentInput.release.requirements.environmentVariables = [{ name: "API_TOKEN", purpose: "Authenticate", required: true, sensitive: true, value: "secret" } as never];
    expect(marketplaceManifestV1Schema.safeParse(environmentInput).success).toBe(false);
  });

  it("requires exact immutable source references", () => {
    const input = manifest("skill");
    input.release.source.commitSha = "main";
    expect(marketplaceManifestV1Schema.safeParse(input).success).toBe(false);
    const releaseInput = manifest("skill");
    releaseInput.release.source = { kind: "github_release", repositoryUrl: "https://github.com/example/item", tag: "v1.0.0", assetName: "item.zip" } as never;
    expect(marketplaceManifestV1Schema.safeParse(releaseInput).success).toBe(false);
  });

  it("requires English-only listing names", () => {
    const localizedName = structuredClone(manifest("skill"));
    localizedName.listing.name = { en: "Example Skill", fa: "مهارت نمونه" } as never;
    expect(marketplaceManifestV1Schema.safeParse(localizedName).success).toBe(false);

    const persianName = structuredClone(manifest("skill"));
    persianName.listing.name = { en: "مهارت نمونه" };
    expect(marketplaceManifestV1Schema.safeParse(persianName).success).toBe(false);
  });

  it("accepts either or both listing-description languages", () => {
    const persianOnly = structuredClone(manifest("skill"));
    persianOnly.listing.description = { fa: "توضیح کامل مورد" } as never;
    expect(marketplaceManifestV1Schema.safeParse(persianOnly).success).toBe(true);

    const bilingual = structuredClone(manifest("skill"));
    bilingual.listing.description = { en: "A complete item.", fa: "توضیح کامل مورد" } as never;
    expect(marketplaceManifestV1Schema.safeParse(bilingual).success).toBe(true);

    const missing = structuredClone(manifest("skill"));
    missing.listing.description = {} as never;
    expect(marketplaceManifestV1Schema.safeParse(missing).success).toBe(false);
  });

  it("produces a deterministic canonical digest", () => {
    const first = manifest("prompt");
    const second = { typeDetails: first.typeDetails, release: first.release, listing: first.listing, type: first.type, manifestVersion: first.manifestVersion };
    expect(validateMarketplaceManifest(first).digestSha256).toBe(validateMarketplaceManifest(second).digestSha256);
  });

  it("maps prompt packs without guessing ambiguous legacy types", () => {
    expect(LEGACY_ITEM_TYPE_MAP["Prompt pack"]).toBe("prompt");
    expect(LEGACY_ITEM_TYPE_MAP["AI tool"]).toBeNull();
    expect(LEGACY_ITEM_TYPE_MAP["Developer utility"]).toBeNull();
  });
});
