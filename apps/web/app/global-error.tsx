"use client";

import "@/styles/globals.css";
import { ErrorView } from "@/components/patterns/error-view";

/**
 * Replaces the root layout when it fails, so there is no locale context and
 * no providers: the locale is read from the address, after mount.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const fa = typeof window !== "undefined" && (window.location.pathname === "/fa" || window.location.pathname.startsWith("/fa/"));
  return (
    <html lang={fa ? "fa" : "en"} dir={fa ? "rtl" : "ltr"}>
      <body>
        <main>
          <ErrorView error={error} reset={reset} fa={fa} />
        </main>
      </body>
    </html>
  );
}
