"use client";

import { ErrorView } from "@/components/patterns/error-view";
import { useLocale } from "@/lib/locale-context";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { fa } = useLocale();
  return (
    <main>
      <ErrorView error={error} reset={reset} fa={fa} />
    </main>
  );
}
