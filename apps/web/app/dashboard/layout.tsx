import { DashboardShell } from "@/features/dashboard/dashboard-shell";

/**
 * The dashboard is a workbench, not a page of the marketing site: it trades
 * the site header and footer for its own top bar and sidebar.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
