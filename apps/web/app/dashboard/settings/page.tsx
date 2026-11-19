import { Suspense } from "react";
import { AccountSettings } from "@/features/dashboard/account-settings";
import { accountSettingsCopy } from "@/features/dashboard/account-settings-copy";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: copy[await getLocale()].profile };
}

// The active section lives in the query string (?section=), read with useSearchParams.
export default async function DashboardSettingsPage() {
  const locale = await getLocale();
  return <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">{accountSettingsCopy[locale].loading}</p>}><AccountSettings /></Suspense>;
}
