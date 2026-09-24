import type { Metadata } from "next";
import { NotFoundView } from "@/components/patterns/status-page";
import { getLocale } from "@/lib/serverLocale";

export const metadata: Metadata = { title: "Not found" };

export default async function NotFound() {
  const locale = await getLocale();
  const fa = locale === "fa";
  return (
    <NotFoundView
      locale={locale}
      eyebrow={fa ? "۴۰۴ · در قفسه نیست" : "404 · not on the shelf"}
      title={fa ? "این صفحه اینجا نیست." : "Nothing on this shelf."}
      body={fa ? "نشانی ممکن است اشتباه باشد یا صفحه جابه‌جا شده باشد. آنچه را می‌خواستید جست‌وجو کنید." : "The address may be mistyped, or the page has moved. Search for what you came for."}
    />
  );
}
