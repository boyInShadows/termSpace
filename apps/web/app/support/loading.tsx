import { getLocale } from "@/lib/serverLocale";
import { supportCopy } from "@/features/support/support-copy";
export default async function SupportLoading() {
  return <p role="status" className="py-8 text-muted-foreground">{supportCopy[await getLocale()].loading}</p>;
}
