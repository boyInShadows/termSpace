import { Prisma } from "@prisma/client";
import { MARKETPLACE_DATABASE_ITEM_TYPES, type MarketplaceManifestV1 } from "./marketplaceManifest.js";

const upper = <Value extends string>(value: Value) => value.toUpperCase() as Uppercase<Value>;

function normalizedSource(source: MarketplaceManifestV1["release"]["source"]) {
  if (source.kind === "github_repository") return {
    sourceKind: "GITHUB_REPOSITORY" as const,
    sourceUrl: source.repositoryUrl,
    sourceRef: source.commitSha,
    sourcePath: source.path ?? null,
    providerIntegrityDigest: null,
  };
  if (source.kind === "github_release") return {
    sourceKind: "GITHUB_RELEASE" as const,
    sourceUrl: source.repositoryUrl,
    sourceRef: `${source.tag}@${source.releaseCommitSha}`,
    sourcePath: source.assetName,
    providerIntegrityDigest: source.assetDigest ?? null,
  };
  return {
    sourceKind: "NPM" as const,
    sourceUrl: `https://registry.npmjs.org/${source.packageName}`,
    sourceRef: source.version,
    sourcePath: null,
    providerIntegrityDigest: source.integrity,
  };
}

export async function createDraftReleaseManifest(
  tx: Prisma.TransactionClient,
  productId: string,
  manifest: MarketplaceManifestV1,
) {
  const existingVersion = await tx.marketplaceProductVersion.findUnique({
    where: { productId_version: { productId, version: manifest.release.version } },
    select: {
      id: true,
      releaseManifests: { where: { publishedAt: { not: null } }, select: { id: true }, take: 1 },
      _count: { select: { releaseManifests: true } },
    },
  });
  if (existingVersion?.releaseManifests.length) {
    throw new PublishedVersionConflictError();
  }
  const productVersion = existingVersion
    ? await tx.marketplaceProductVersion.update({
      where: { id: existingVersion.id },
      data: { notes: manifest.release.releaseNotes },
      select: { id: true },
    })
    : await tx.marketplaceProductVersion.create({
      data: { productId, version: manifest.release.version, notes: manifest.release.releaseNotes, releasedAt: new Date() },
      select: { id: true },
    });
  const revision = (existingVersion?._count.releaseManifests ?? 0) + 1;
  const source = normalizedSource(manifest.release.source);
  const release = await tx.marketplaceReleaseManifest.create({
    data: {
      productVersionId: productVersion.id,
      revision,
      manifestVersion: manifest.manifestVersion,
      itemType: MARKETPLACE_DATABASE_ITEM_TYPES[manifest.type],
      ...source,
      installationMethod: upper(manifest.release.installation.method),
      installationInstructions: manifest.release.installation.instructions,
      runtimeRequirements: manifest.release.requirements.runtimes,
      accountRequirements: manifest.release.requirements.accounts,
      operatingSystems: manifest.release.requirements.operatingSystems,
      dependencyRequirements: manifest.release.requirements.dependencies,
      licenseIdentifier: manifest.release.license.identifier ?? null,
      customLicenseUrl: manifest.release.license.customUrl ?? null,
      documentationUrl: manifest.release.documentationUrl ?? manifest.listing.documentationUrl ?? null,
      supportUrl: manifest.release.supportUrl ?? manifest.listing.supportUrl ?? null,
      releaseNotes: manifest.release.releaseNotes,
      compatibility: { create: manifest.release.compatibility.map((item) => ({ platformKey: item.platform, models: item.models, notes: item.notes })) },
      permissions: { create: manifest.release.permissions.map((item) => ({
        capability: upper(item.capability), required: item.required, scope: item.scope, destinations: item.destinations, purpose: item.purpose,
      })) },
      environmentVariables: { create: manifest.release.requirements.environmentVariables },
    },
    select: { id: true },
  });

  await createTypeDetails(tx, release.id, manifest);
  return release.id;
}

async function createTypeDetails(tx: Prisma.TransactionClient, releaseManifestId: string, manifest: MarketplaceManifestV1) {
  switch (manifest.type) {
    case "skill": await tx.marketplaceSkillReleaseDetails.create({ data: { releaseManifestId, ...manifest.typeDetails } }); break;
    case "agent": await tx.marketplaceAgentReleaseDetails.create({ data: { releaseManifestId, ...manifest.typeDetails } }); break;
    case "mcp_server": await tx.marketplaceMcpServerReleaseDetails.create({ data: { releaseManifestId, ...manifest.typeDetails } }); break;
    case "integration": await tx.marketplaceIntegrationReleaseDetails.create({ data: { releaseManifestId, ...manifest.typeDetails } }); break;
    case "rule": await tx.marketplaceRuleReleaseDetails.create({ data: { releaseManifestId, ...manifest.typeDetails } }); break;
    case "prompt": await tx.marketplacePromptReleaseDetails.create({ data: { releaseManifestId, ...manifest.typeDetails } }); break;
    case "hook": await tx.marketplaceHookReleaseDetails.create({ data: { releaseManifestId, ...manifest.typeDetails, effects: manifest.typeDetails.effects.map(upper) } }); break;
    case "template": await tx.marketplaceTemplateReleaseDetails.create({ data: { releaseManifestId, ...manifest.typeDetails } }); break;
    case "workflow": await tx.marketplaceWorkflowReleaseDetails.create({ data: { releaseManifestId, ...manifest.typeDetails, stages: manifest.typeDetails.stages } }); break;
  }
}

export class PublishedVersionConflictError extends Error {}
