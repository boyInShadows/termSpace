import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The moderation screens' shared frame, in the dashboard's ruled, square
 * vocabulary: a strong rule around each section and a header cell, never a
 * floating rounded card. Colour only ever sits on a border or a mark, so text
 * keeps the contrast of the theme's ink in both themes.
 */
export function Panel({ id, title, aside, children, className }: { id: string; title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("border border-foreground/60 bg-surface", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/60 bg-muted/60 px-4 py-2.5">
        <h2 id={id} className="text-sm font-semibold">{title}</h2>
        {aside}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const STATE_TONE: Record<string, string> = {
  published: "border-verified/60 [--dot:var(--verified)]",
  submitted: "border-info/60 [--dot:var(--info)]",
  approved: "border-info/60 [--dot:var(--info)]",
  changes_requested: "border-warning/60 [--dot:var(--warning)]",
  rejected: "border-warning/60 [--dot:var(--warning)]",
  suspended: "border-warning/60 [--dot:var(--warning)]",
};

/** A listing's lifecycle state as a square mark: coloured edge and dot, ink text. */
export function StateMark({ state, label }: { state: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-semibold", STATE_TONE[state] ?? "border-border [--dot:var(--muted-foreground)]")}>
      <span aria-hidden className="size-1.5 bg-[var(--dot)]" />
      {label}
    </span>
  );
}

/** The marker for a capability that needs a closer look; the words carry it, the icon only echoes. */
export function CloserLook({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 border border-warning/60 px-1.5 py-0.5 text-xs font-semibold">
      <ShieldAlert aria-hidden className="size-3.5 text-warning" />
      {label}
    </span>
  );
}

export function listingStateLabel(state: string, labels: Record<string, string>) {
  const key = state.toLowerCase();
  const options: Record<string, string> = {
    draft: labels.statusDraft, submitted: labels.statusSubmitted, changes_requested: labels.statusChangesRequested,
    approved: labels.statusApproved, published: labels.statusPublished, rejected: labels.statusRejected,
    suspended: labels.statusSuspended, archived: labels.statusArchived,
  };
  return options[key] ?? key.replaceAll("_", " ");
}
