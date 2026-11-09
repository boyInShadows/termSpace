import Link from "next/link";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";
import { supportSession } from "@/features/support/support-server";
import { supportCopy } from "@/features/support/support-copy";

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const session = await supportSession();
  const locale = await getLocale();
  return <main id="content" tabIndex={-1} className="container-page min-h-[60vh] py-8 sm:py-12">
    <div className="mx-auto max-w-3xl">
      <Link href={localePath("/support", locale)} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">{supportCopy[locale].title}</Link>
      {session.user.emailVerified && session.user.marketplaceRoles.includes("administrator") && <Link href={localePath("/support/admin", locale)} className="ms-6 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">{supportCopy[locale].inbox}</Link>}
      {children}
    </div>
  </main>;
}
