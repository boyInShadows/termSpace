import { Footer } from "@/components/layout/footer";
import { ModerationQueue } from "@/features/moderation/moderation-queue";

export default function ModerationPage() {
  return <><main id="content" tabIndex={-1} className="container-page py-16"><ModerationQueue /></main><Footer /></>;
}
