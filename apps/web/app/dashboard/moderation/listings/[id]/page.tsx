import { Suspense } from "react";
import { ModerationPreview } from "@/features/moderation/moderation-preview";
import { moderation } from "@/lib/i18n/moderation";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: moderation[await getLocale()].moderation.reviewTitle };
}

export default async function DashboardModerationListingPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);
  return <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">{moderation[locale].moderation.loading}</p>}><ModerationPreview productId={id} /></Suspense>;
}
