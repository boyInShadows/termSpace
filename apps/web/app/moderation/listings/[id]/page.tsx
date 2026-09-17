import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ModerationPreview } from "@/features/moderation/moderation-preview";

export default async function ModerationListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><Header /><main className="container-page py-16"><ModerationPreview productId={id} /></main><Footer /></>;
}
