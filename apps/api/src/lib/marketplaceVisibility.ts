import type { Prisma } from "@prisma/client";

export const activeRestrictions = {
  restrictions: { some: { revokedAt: null } },
} as const;
export const publicCreatorWhere: Prisma.MarketplaceCreatorWhereInput = {
  OR: [
    { ownerUserId: null },
    {
      owner: {
        marketplaceTrustCases: {
          none: { targetType: "USER", ...activeRestrictions },
        },
      },
    },
  ],
};
export const publicProductWhere: Prisma.MarketplaceProductWhereInput = {
  published: true,
  classificationRequired: false,
  lifecycleState: { notIn: ["SUSPENDED", "ARCHIVED"] },
  trustCases: { none: { targetType: "PRODUCT", ...activeRestrictions } },
  creator: publicCreatorWhere,
};
export const publicPlacementWhere: Prisma.MarketplaceCommunityPlacementWhereInput =
  {
    approvedSnapshot: { approvedFor: publicProductWhere },
    community: { state: "ACTIVE" },
    trustCases: { none: { targetType: "PLACEMENT", ...activeRestrictions } },
  };

export const publicCreatorSelect = {
  id: true,
  name: true,
  handle: true,
  initials: true,
  verified: true,
  bio: true,
  followers: true,
  _count: { select: { products: { where: publicProductWhere } } },
} as const;
export const publicCommunitySelect = {
  id: true,
  slug: true,
  nameEn: true,
  nameFa: true,
  descriptionEn: true,
  descriptionFa: true,
  primaryPlatform: true,
  rulesEn: true,
  rulesFa: true,
  submissionGuidanceEn: true,
  submissionGuidanceFa: true,
  state: true,
  accentColor: true,
} as const;
