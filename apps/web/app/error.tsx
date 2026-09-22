"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/locale-context";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { fa } = useLocale();
  useEffect(() => { console.error("Route rendering failed", { digest: error.digest }); }, [error]);
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
      <h1 className="text-2xl font-semibold">{fa ? "این بخش در دسترس نیست" : "This section is unavailable"}</h1>
      <p className="text-muted-foreground">{fa ? "دوباره تلاش کنید. اگر مشکل ادامه داشت، شناسهٔ خطا را برای پشتیبانی ارسال کنید." : "Try again. If the problem continues, share the error reference with support."}</p>
      {error.digest ? <p className="font-mono text-xs text-muted-foreground">{fa ? "شناسهٔ خطا" : "Error reference"}: {error.digest}</p> : null}
      <button className="rounded-md bg-foreground px-4 py-2 text-background" onClick={reset}>{fa ? "تلاش دوباره" : "Try again"}</button>
    </main>
  );
}
