import { notFound } from "next/navigation";
import { supportSession } from "@/features/support/support-server";
export default async function SupportAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await supportSession();
  if (!session.user.emailVerified || !session.user.marketplaceRoles.includes("administrator")) notFound();
  return children;
}
