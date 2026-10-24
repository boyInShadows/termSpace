import { Footer } from "@/components/layout/footer";
import { Skeleton } from "@/components/patterns/skeleton";
import { getLocale } from "@/lib/serverLocale";

/**
 * Explore's layout held empty while a search or filter change is fetched on
 * the server, so a navigation shows the page frame at once instead of the old
 * screen frozen. Not shared with /communities: a loading boundary there would
 * also wrap /communities/[slug] and turn its 404 into a streamed 200.
 */
export default async function ExploreLoading() {
  const fa = (await getLocale()) === "fa";
  return (
    <>
      <main id="content" tabIndex={-1} className="container-page py-8" aria-busy>
        <p role="status" className="sr-only">{fa ? "در حال بارگذاری منابع…" : "Loading resources…"}</p>
        <Skeleton className="h-12 w-72 max-w-full" />
        <Skeleton className="mt-6 h-12 w-full max-w-2xl" />
        <div className="mt-6 flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-9 w-24 rounded-none" />)}
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-64 w-full rounded-xl" />)}
        </div>
      </main>
      <Footer />
    </>
  );
}
