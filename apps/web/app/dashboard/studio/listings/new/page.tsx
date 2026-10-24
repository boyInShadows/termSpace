import { CreatorDraftEditor } from "@/features/creator/creator-draft-editor";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: copy[await getLocale()].creatorHub.newListing };
}

export default async function NewCreatorListingPage() {
  return <CreatorDraftEditor messages={copy[await getLocale()].creatorDraft} />;
}
