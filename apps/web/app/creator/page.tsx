import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CreatorHub } from "@/features/creator/creator-hub";

export default function CreatorPage() {
  return <><Header /><main className="container-page py-16"><CreatorHub /></main><Footer /></>;
}
