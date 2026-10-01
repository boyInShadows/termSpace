import { CreatorDraftEditor } from "@/features/creator/creator-draft-editor";

export default async function EditCreatorListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreatorDraftEditor productId={id} />;
}
