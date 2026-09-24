"use client";

import { ErrorView } from "@/components/patterns/error-view";
import { useLocale } from "@/lib/locale-context";

/** Inside the dashboard frame: the shell stays, only the page area fails. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { fa } = useLocale();
  return <ErrorView error={error} reset={reset} fa={fa} />;
}
