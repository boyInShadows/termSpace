import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DashboardShell } from "@/features/dashboard/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="container-page py-12 lg:py-16">
        <DashboardShell>{children}</DashboardShell>
      </main>
      <Footer />
    </>
  );
}
