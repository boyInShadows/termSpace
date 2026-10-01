import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DashboardShell } from "@/features/dashboard/dashboard-shell";

export const metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <><Header /><main className="container-page py-10"><Suspense><DashboardShell>{children}</DashboardShell></Suspense></main><Footer /></>;
}
