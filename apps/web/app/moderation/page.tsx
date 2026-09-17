import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ModerationQueue } from "@/features/moderation/moderation-queue";

export default function ModerationPage() {
  return <><Header /><main className="container-page py-16"><ModerationQueue /></main><Footer /></>;
}
