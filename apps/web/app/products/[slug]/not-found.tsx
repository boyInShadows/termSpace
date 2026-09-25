import { NotFoundView } from "@/components/patterns/status-page";
import { getLocale } from "@/lib/serverLocale";

export default async function ListingNotFound() {
  const locale = await getLocale();
  const fa = locale === "fa";
  return (
    <NotFoundView
      locale={locale}
      eyebrow={fa ? "۴۰۴ · فهرست" : "404 · listing"}
      title={fa ? "این فهرست اینجا نیست." : "This listing isn’t here."}
      body={fa ? "منتشرکننده آن را از انتشار خارج کرده، یا هرگز وجود نداشته است." : "It was unpublished by its creator, or it never existed."}
    />
  );
}
