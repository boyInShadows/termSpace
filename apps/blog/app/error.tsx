"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const fa = useLocale() === "fa";
  useEffect(() => { console.error("Blog route rendering failed", { digest: error.digest }); }, [error]);
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
      <h1 className="text-2xl font-semibold">{fa ? "این بخش در دسترس نیست" : "This section is unavailable"}</h1>
      <p>{fa ? "دوباره تلاش کنید. اگر مشکل ادامه داشت، شناسهٔ خطا را برای پشتیبانی ارسال کنید." : "Try again. If the problem continues, share the error reference with support."}</p>
      {error.digest ? <p className="font-mono text-xs">{fa ? "شناسهٔ خطا" : "Error reference"}: {error.digest}</p> : null}
      <button className="rounded bg-black px-4 py-2 text-white" onClick={reset}>{fa ? "تلاش دوباره" : "Try again"}</button>
    </main>
  );
}
