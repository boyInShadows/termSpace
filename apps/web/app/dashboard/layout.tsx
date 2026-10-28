import { DashboardShell } from "@/features/dashboard/dashboard-shell";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Add workspace navigation and the session gate below the root site's header.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
