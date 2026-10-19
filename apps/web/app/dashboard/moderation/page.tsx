import { Suspense } from "react";
import { ModerationQueue } from "@/features/moderation/moderation-queue";
import { moderation } from "@/lib/i18n/moderation";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: moderation[await getLocale()].moderation.queueTitle };
}

// `ModerationQueue` reads its filters from the URL, so it sits under Suspense.
export default async function DashboardModerationPage() {
  const { loading } = moderation[await getLocale()].moderation;
  return <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">{loading}</p>}><ModerationQueue /></Suspense>;
}
