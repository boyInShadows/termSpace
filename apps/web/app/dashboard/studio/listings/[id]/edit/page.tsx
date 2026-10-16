import { CreatorDraftEditor } from "@/features/creator/creator-draft-editor";

export const metadata = { title: "Edit listing" };

export default async function EditCreatorListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreatorDraftEditor productId={id} />;
}
