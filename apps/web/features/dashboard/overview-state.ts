import type { DashboardHome } from "@/lib/dashboard";

/** One fetch feeds every overview panel, so they share one state. */
export type OverviewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; home: DashboardHome };
