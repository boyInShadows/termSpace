import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CreatorDraftEditor } from "@/features/creator/creator-draft-editor";

export default function NewCreatorListingPage() {
  return <><Header /><main className="container-page py-16"><CreatorDraftEditor /></main><Footer /></>;
}
