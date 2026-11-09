import Link from "next/link";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";
import { supportSession } from "@/features/support/support-server";
import { supportCopy } from "@/features/support/support-copy";
import { canManageSupport } from "@/features/support/support-access";
import { DashboardShell } from "@/features/dashboard/dashboard-shell";

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const session = await supportSession();
  const locale = await getLocale();
  return <DashboardShell allowUnverified>
    <div className="mx-auto max-w-3xl">
      <Link href={localePath("/support", locale)} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">{supportCopy[locale].title}</Link>
      {canManageSupport(session.user) && <Link href={localePath("/support/admin", locale)} className="ms-6 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">{supportCopy[locale].inbox}</Link>}
      {children}
    </div>
  </DashboardShell>;
}
