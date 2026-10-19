import { Footer } from "@/components/layout/footer";
import { ModerationPreview } from "@/features/moderation/moderation-preview";

export default async function ModerationListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><main id="content" tabIndex={-1} className="container-page py-16"><ModerationPreview productId={id} /></main><Footer /></>;
}
