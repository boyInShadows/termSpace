import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CreatorReleaseManager } from "@/features/creator/creator-release-manager";

export default async function CreatorListingReleasesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><Header /><main className="container-page py-16"><CreatorReleaseManager productId={id} /></main><Footer /></>;
}
