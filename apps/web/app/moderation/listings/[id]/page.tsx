import { permanentRedirect } from "next/navigation";
import { localePath } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";

export default async function LegacyModerationListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, locale, rest] = await Promise.all([params, getLocale(), searchParams]);
  const query = new URLSearchParams(Object.entries(rest).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : []));
  permanentRedirect(`${localePath(`/dashboard/moderation/listings/${encodeURIComponent(id)}`, locale)}${query.size ? `?${query}` : ""}`);
}
