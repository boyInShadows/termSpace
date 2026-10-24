import { Footer } from "@/components/layout/footer";
import { ModerationCase } from "@/features/reporting/moderation-cases";

export const metadata = { robots: { index: false, follow: false } };

export default async function ReportCasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const reportsPage = Number(query.reportsPage ?? 1);
  const eventsPage = Number(query.eventsPage ?? 1);
  return <><main id="content" tabIndex={-1} className="container-page py-16"><ModerationCase id={id} reportsPage={Number.isInteger(reportsPage) && reportsPage >= 1 && reportsPage <= 1000000 ? reportsPage : 1} eventsPage={Number.isInteger(eventsPage) && eventsPage >= 1 && eventsPage <= 1000000 ? eventsPage : 1} /></main><Footer /></>;
}
