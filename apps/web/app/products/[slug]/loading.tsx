import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/patterns/skeleton";

/**
 * The detail page's layout, held empty: same grid, same rail width, and the
 * header blocks at the heights the real header renders (type row, 60px
 * title, two-line outcome, identity row, trust chips), so nothing jumps when
 * the listing arrives.
 */
export default function ProductLoading() {
  return (
    <>
      <Header />
      <main className="container-page py-8" aria-busy>
        <p role="status" className="sr-only">Loading listing…</p>
        <Skeleton className="h-4 w-56" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_21rem]">
          <div className="min-w-0">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="mt-5 h-12 w-3/4 sm:h-[3.75rem]" />
            <Skeleton className="mt-5 h-8 w-full max-w-2xl" />
            <Skeleton className="mt-2 h-8 w-2/3 max-w-xl" />
            <div className="mt-7 flex gap-5">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Skeleton className="h-10 w-36 rounded-xl" />
              <Skeleton className="h-10 w-56 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
            <div className="mt-9 border-t border-border pt-9">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="mt-5 h-24 w-full" />
            </div>
          </div>
          <aside>
            <div className="space-y-5 rounded-xl border border-border-strong bg-surface-raised p-5 shadow-soft">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
