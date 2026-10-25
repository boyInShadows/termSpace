import { DashboardOverview } from "@/features/dashboard/overview";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";
import { getServerDashboardHome } from "@/lib/server-session";

export async function generateMetadata() {
  return { title: copy[await getLocale()].navOverview };
}

export default async function DashboardPage() {
  return <DashboardOverview initialHome={await getServerDashboardHome()} />;
}
