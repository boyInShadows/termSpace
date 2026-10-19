import { AccountSettings } from "@/features/dashboard/account-settings";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: copy[await getLocale()].profile };
}

export default function DashboardSettingsPage() {
  return <AccountSettings />;
}
