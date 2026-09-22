import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CreatorDraftEditor } from "@/features/creator/creator-draft-editor";

export default async function EditCreatorListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><Header /><main className="container-page py-16"><CreatorDraftEditor productId={id} /></main><Footer /></>;
}
