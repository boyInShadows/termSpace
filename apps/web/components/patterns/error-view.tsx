"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatusHeading } from "./status-heading";

/**
 * What an error boundary shows: calm, inline, one action. No red banner: the
 * reader did nothing wrong, and alarm does not help them retry. The digest is
 * the reference support needs, so it is shown, small, in mono.
 */
export function ErrorView({ error, reset, fa }: { error: Error & { digest?: string }; reset: () => void; fa: boolean }) {
  useEffect(() => {
    console.error("Route rendering failed", { digest: error.digest });
  }, [error]);
  return (
    <div role="alert" className="container-page flex min-h-[60vh] flex-col justify-center py-16">
      <a href={fa ? "/fa" : "/"} className="editorial mb-10 self-start text-2xl font-semibold" dir="ltr">
        termspace<span className="ms-0.5 text-primary">|</span>
      </a>
      <StatusHeading eyebrow={fa ? "خطا · این بخش بارگذاری نشد" : "Error · this part did not load"} title={fa ? "چیزی درست پیش نرفت." : "Something went wrong here."}>
        {fa ? "دوباره تلاش کنید. اگر مشکل ادامه داشت، شناسهٔ خطا را برای پشتیبانی بفرستید." : "Try again. If it keeps happening, send the reference below to support."}
      </StatusHeading>
      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Button onClick={reset}>
          {fa ? "تلاش دوباره" : "Try again"}
        </Button>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground" dir="ltr">
            {fa ? "شناسه" : "ref"} {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
