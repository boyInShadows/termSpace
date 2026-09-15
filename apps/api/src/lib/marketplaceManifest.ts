import { createHash } from "node:crypto";
import { z } from "zod";

export const MARKETPLACE_ITEM_TYPES = [
  "skill", "agent", "mcp_server", "integration", "rule", "prompt", "hook", "template", "workflow",
] as const;
export type MarketplaceItemTypeKey = typeof MARKETPLACE_ITEM_TYPES[number];

export const MARKETPLACE_ITEM_TYPE_REGISTRY: Record<MarketplaceItemTypeKey, { en: string; fa: string; definition: string }> = {
  skill: { en: "Skill", fa: "مهارت", definition: "A packaged capability or instruction set installed into an agent or coding environment." },
  agent: { en: "Agent", fa: "عامل", definition: "An autonomous or delegated agent definition, including primary agents and subagents." },
  mcp_server: { en: "MCP server", fa: "سرور MCP", definition: "A Model Context Protocol server exposing tools, resources, or prompts." },
  integration: { en: "Integration", fa: "یکپارچه‌سازی", definition: "A connector, plugin, or extension joining an agentic platform to another system." },
  rule: { en: "Rule", fa: "قاعده", definition: "Persistent project or user guidance applied by an agentic coding environment." },
  prompt: { en: "Prompt", fa: "پرامپت", definition: "A single prompt or versioned prompt bundle with declared inputs and intended use." },
  hook: { en: "Hook", fa: "هوک", definition: "Event-triggered behavior around supported agent or development lifecycle events." },
  template: { en: "Template", fa: "قالب", definition: "Reusable project, configuration, or artifact scaffolding used as a starting point." },
  workflow: { en: "Workflow", fa: "گردش‌کار", definition: "An ordered process coordinating prompts, agents, tools, or human checkpoints." },
};

export const MARKETPLACE_DATABASE_ITEM_TYPES: Record<MarketplaceItemTypeKey, Uppercase<MarketplaceItemTypeKey>> = {
  skill: "SKILL",
  agent: "AGENT",
  mcp_server: "MCP_SERVER",
  integration: "INTEGRATION",
  rule: "RULE",
  prompt: "PROMPT",
  hook: "HOOK",
  template: "TEMPLATE",
  workflow: "WORKFLOW",
};

export function marketplaceItemTypeKey(value: string | null | undefined): MarketplaceItemTypeKey | null {
  if (!value) return null;
  const entry = Object.entries(MARKETPLACE_DATABASE_ITEM_TYPES).find(([, databaseValue]) => databaseValue === value);
  return entry?.[0] as MarketplaceItemTypeKey | undefined ?? null;
}

export const LEGACY_ITEM_TYPE_MAP: Readonly<Record<string, MarketplaceItemTypeKey | null>> = {
  Skill: "skill",
  Agent: "agent",
  Workflow: "workflow",
  Prompt: "prompt",
  "Prompt pack": "prompt",
  "MCP server": "mcp_server",
  "AI tool": null,
  "Developer utility": null,
};

const boundedText = (min = 1, max = 500) => z.string().trim().min(min).max(max);
const stringList = (maxItems = 50, maxLength = 160) => z.array(boundedText(1, maxLength)).max(maxItems);
const httpsUrl = z.string().url().max(2048).refine((value) => {
  const parsed = new URL(value);
  return parsed.protocol === "https:" && !parsed.username && !parsed.password;
}, "URL must use HTTPS and must not contain credentials");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160);
const platformKey = z.string().regex(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/).max(50);
const repositoryPath = boundedText(1, 500).refine((value) => !value.startsWith("/") && !value.includes("\\") && value.split("/").every((segment) => segment !== "." && segment !== ".."), "Path must be a safe repository-relative path");

const localizedText = z.object({ en: boundedText(), fa: boundedText().optional() }).strict();
const environmentVariable = z.object({
  name: z.string().regex(/^[A-Z_][A-Z0-9_]*$/).max(100),
  purpose: boundedText(3, 300),
  required: z.boolean(),
  sensitive: z.boolean(),
}).strict();

const permissionCapabilities = [
  "filesystem_read", "filesystem_write", "process_execution", "network_access", "environment_access", "secret_access",
  "browser_automation", "external_account_access", "persistent_storage", "background_execution", "code_modification", "telemetry",
] as const;

const listingSchema = z.object({
  slug,
  name: localizedText,
  outcome: localizedText,
  description: localizedText,
  categorySlug: slug,
  communitySlugs: z.array(slug).max(20).default([]),
  tags: z.array(slug).max(20),
  screenshots: z.array(z.object({ url: httpsUrl, alt: localizedText }).strict()).max(12).default([]),
  documentationUrl: httpsUrl.optional(),
  supportUrl: httpsUrl.optional(),
  issueTrackerUrl: httpsUrl.optional(),
}).strict();

const sourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("github_repository"), repositoryUrl: httpsUrl.refine((value) => new URL(value).hostname === "github.com", "Repository must be hosted on github.com"), commitSha: z.string().regex(/^[a-f0-9]{40}$/), path: repositoryPath.optional() }).strict(),
  z.object({ kind: z.literal("github_release"), repositoryUrl: httpsUrl.refine((value) => new URL(value).hostname === "github.com", "Repository must be hosted on github.com"), tag: boundedText(1, 100), releaseCommitSha: z.string().regex(/^[a-f0-9]{40}$/), assetName: boundedText(1, 255).refine((value) => !value.includes("/") && !value.includes("\\"), "Asset name must not contain path separators"), assetDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional() }).strict(),
  z.object({ kind: z.literal("npm"), packageName: z.string().regex(/^(?:@[a-z0-9._~-]+\/)?[a-z0-9._~-]+$/).max(214), version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/), integrity: z.string().regex(/^sha512-[A-Za-z0-9+/]+={0,2}$/) }).strict(),
]);

const releaseSchema = z.object({
  version: boundedText(1, 64),
  source: sourceSchema,
  releaseNotes: boundedText(3, 10_000),
  compatibility: z.array(z.object({ platform: platformKey, models: stringList(30, 100).default([]), notes: boundedText(1, 500).optional() }).strict()).min(1).max(30),
  installation: z.object({ method: z.enum(["manual", "npm", "git", "download", "container", "hosted"]), instructions: stringList(30, 1_000).min(1) }).strict(),
  requirements: z.object({
    runtimes: stringList(30).default([]), accounts: stringList(30).default([]), operatingSystems: stringList(20).default([]),
    dependencies: stringList(100).default([]), environmentVariables: z.array(environmentVariable).max(50).default([]),
  }).strict(),
  permissions: z.array(z.object({
    capability: z.enum(permissionCapabilities), required: z.boolean().default(true), scope: boundedText(1, 500).optional(),
    destinations: stringList(50, 253).default([]), purpose: boundedText(3, 500),
  }).strict()).max(permissionCapabilities.length),
  license: z.object({ identifier: boundedText(1, 100).optional(), customUrl: httpsUrl.optional() }).strict()
    .refine((value) => Boolean(value.identifier) !== Boolean(value.customUrl), "Provide exactly one license identifier or custom license URL"),
  documentationUrl: httpsUrl.optional(),
  supportUrl: httpsUrl.optional(),
}).strict().superRefine((release, ctx) => {
  const uniqueFields: Array<[string, string[]]> = [
    ["compatibility", release.compatibility.map((entry) => entry.platform)],
    ["permissions", release.permissions.map((entry) => entry.capability)],
    ["requirements.environmentVariables", release.requirements.environmentVariables.map((entry) => entry.name)],
  ];
  for (const [path, values] of uniqueFields) {
    if (new Set(values).size !== values.length) {
      ctx.addIssue({ code: "custom", path: path.split("."), message: `${path} entries must be unique` });
    }
  }
});

const skillDetails = z.object({ format: boundedText(1, 100), entryPath: boundedText(1, 500), activation: boundedText(3, 500), bundledExecutables: z.boolean(), inputs: stringList(), outputs: stringList() }).strict();
const agentDetails = z.object({ scope: z.enum(["primary", "subagent"]), entryPath: boundedText(1, 500), invocation: boundedText(3, 500), tools: stringList(), capabilities: stringList(), modelRequirements: stringList(), inputs: stringList(), outputs: stringList() }).strict();
const mcpServerDetails = z.object({ transport: z.enum(["stdio", "streamable_http", "sse"]), connectionMethod: boundedText(3, 500), distributionIdentity: boundedText(3, 500), exposedTools: stringList(200), exposedResources: stringList(200), exposedPrompts: stringList(200), authenticationMethod: boundedText(3, 500), networkDestinations: stringList(100, 253), dataHandling: boundedText(3, 1_000) }).strict();
const integrationDetails = z.object({ integrationKind: z.enum(["connector", "plugin", "extension"]), hostPlatform: platformKey, installationIdentifier: boundedText(1, 300), connectedService: boundedText(2, 200), requestedScopes: stringList(100), authentication: boundedText(3, 500), callback: boundedText(3, 500).optional(), dataFlow: boundedText(3, 1_000) }).strict();
const ruleDetails = z.object({ format: boundedText(1, 100), destinationScope: boundedText(1, 200), entryPath: boundedText(1, 500), activation: boundedText(3, 500), applicablePaths: stringList(100, 500), expectedEffect: boundedText(3, 1_000) }).strict();
const promptDetails = z.object({ format: z.enum(["single", "bundle"]), entryPaths: stringList(100, 500).min(1), variables: stringList(100), requiredInputs: stringList(100), outputContract: boundedText(3, 1_000), intendedModels: stringList(50, 100).min(1) }).strict();
const hookDetails = z.object({ events: stringList(100, 100).min(1), hostPlatform: platformKey, entryPaths: stringList(50, 500).min(1), runtime: boundedText(1, 200), behavior: z.enum(["synchronous", "asynchronous"]), failurePolicy: boundedText(3, 500), effects: z.array(z.enum(permissionCapabilities)).max(permissionCapabilities.length) }).strict();
const templateDetails = z.object({ templateKind: boundedText(1, 100), includedPaths: stringList(200, 500).min(1), outputFormat: boundedText(1, 200), initializationMethod: boundedText(3, 500), replacementVariables: stringList(100), executesScripts: z.boolean() }).strict();
const workflowDetails = z.object({ stages: z.array(z.object({ name: boundedText(1, 100), description: boundedText(3, 500), humanApproval: z.boolean() }).strict()).min(1).max(100), dependencies: stringList(100), executionMethod: boundedText(3, 500), initialInputs: stringList(100), intermediateState: boundedText(3, 1_000), finalOutputs: stringList(100), retryBehavior: boundedText(3, 500), rollbackBehavior: boundedText(3, 500), partialFailureBehavior: boundedText(3, 500) }).strict();

const detailsByType = {
  skill: skillDetails, agent: agentDetails, mcp_server: mcpServerDetails, integration: integrationDetails, rule: ruleDetails,
  prompt: promptDetails, hook: hookDetails, template: templateDetails, workflow: workflowDetails,
} as const;

export const marketplaceManifestV1Schema = z.discriminatedUnion("type", MARKETPLACE_ITEM_TYPES.map((type) =>
  z.object({ manifestVersion: z.literal(1), type: z.literal(type), listing: listingSchema, release: releaseSchema, typeDetails: detailsByType[type] }).strict(),
) as unknown as [z.ZodDiscriminatedUnionOption<"type">, ...z.ZodDiscriminatedUnionOption<"type">[]]);

export type MarketplaceManifestV1 = {
  [Type in MarketplaceItemTypeKey]: {
    manifestVersion: 1;
    type: Type;
    listing: z.infer<typeof listingSchema>;
    release: z.infer<typeof releaseSchema>;
    typeDetails: z.infer<(typeof detailsByType)[Type]>;
  };
}[MarketplaceItemTypeKey];

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonicalize(child)]));
  }
  return value;
}

export function validateMarketplaceManifest(input: unknown): { manifest: MarketplaceManifestV1; snapshot: object; digestSha256: string } {
  const manifest = marketplaceManifestV1Schema.parse(input) as MarketplaceManifestV1;
  const snapshot = canonicalize(manifest) as object;
  const digestSha256 = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  return { manifest, snapshot, digestSha256 };
}
