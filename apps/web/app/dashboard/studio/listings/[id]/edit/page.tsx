import { CreatorDraftEditor } from "@/features/creator/creator-draft-editor";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: copy[await getLocale()].creatorHub.editDraft };
}

export default async function EditCreatorListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreatorDraftEditor productId={id} />;
}
