import { permanentRedirect } from "next/navigation";
import { localePath } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";

// Moderation lives in the dashboard now; this keeps old links and bookmarks working.
export default async function LegacyModerationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = new URLSearchParams(Object.entries(await searchParams).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : []));
  permanentRedirect(`${localePath("/dashboard/moderation", await getLocale())}${query.size ? `?${query}` : ""}`);
}
