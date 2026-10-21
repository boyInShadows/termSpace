import { DashboardOverview } from "@/features/dashboard/overview";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: copy[await getLocale()].navOverview };
}

export default function DashboardPage() {
  return <DashboardOverview />;
}
