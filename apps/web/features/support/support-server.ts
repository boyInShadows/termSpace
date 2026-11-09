import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, request } from "@/lib/api";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";

export async function supportSession() {
  const cookie = (await headers()).get("cookie") ?? "";
  const session = cookie ? (await getSession({ headers: { cookie }, cache: "no-store" })).data : null;
  if (!session?.authenticated) {
    const locale = await getLocale();
    redirect(`${localePath("/account", locale)}?next=${encodeURIComponent(localePath("/support", locale))}`);
  }
  return session;
}

export async function supportRead<T>(path: string) {
  const cookie = (await headers()).get("cookie") ?? "";
  return (await request<{ data: T }>(`/api/support${path}`, { headers: { cookie }, cache: "no-store" })).data;
}
