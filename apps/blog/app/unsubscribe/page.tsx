import { UnsubscribeForm } from "@/components/UnsubscribeForm";

export const metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className="mx-auto max-w-xl px-6 py-20"><h1 className="font-serif text-3xl font-semibold">Leave the newsletter</h1><p className="mt-3 text-ink-soft">Confirm below to stop editorial campaign emails.</p><UnsubscribeForm token={token ?? ""} /></main>;
}
