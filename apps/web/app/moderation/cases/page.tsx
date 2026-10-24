import { Footer } from "@/components/layout/footer";
import { ModerationCases } from "@/features/reporting/moderation-cases";
import type { ModerationCaseState } from "@/lib/types";

export const metadata = { robots: { index: false, follow: false } };

export default async function ReportCasesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const page = Number(query.page ?? 1);
  const state = typeof query.state === "string" && ["NEW", "TRIAGED", "INVESTIGATING", "ACTIONED", "DISMISSED"].includes(query.state) ? query.state as ModerationCaseState : undefined;
  return <><main id="content" tabIndex={-1} className="container-page py-16"><ModerationCases state={state} page={Number.isInteger(page) && page >= 1 && page <= 1000000 ? page : 1} /></main><Footer /></>;
}
