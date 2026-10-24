import { CreatorReleaseManager } from "@/features/creator/creator-release-manager";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: copy[await getLocale()].creatorHub.releases };
}

export default async function CreatorListingReleasesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreatorReleaseManager productId={id} />;
}
