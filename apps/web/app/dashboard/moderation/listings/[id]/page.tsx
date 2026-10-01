import { ModerationPreview } from "@/features/moderation/moderation-preview";

export default async function ModerationListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModerationPreview productId={id} />;
}
