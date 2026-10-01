import { CreatorReleaseManager } from "@/features/creator/creator-release-manager";

export default async function CreatorListingReleasesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreatorReleaseManager productId={id} />;
}
