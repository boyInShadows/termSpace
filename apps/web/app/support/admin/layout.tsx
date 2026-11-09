import { notFound } from "next/navigation";
import { supportSession } from "@/features/support/support-server";
import { canManageSupport } from "@/features/support/support-access";
export default async function SupportAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await supportSession();
  if (!canManageSupport(session.user)) notFound();
  return children;
}
