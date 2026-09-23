import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/**
 * A section that has loaded successfully and genuinely has nothing to show.
 *
 * Distinct from `SectionNotice`, which means "we could not load this". Both
 * exist because rendering a heading over blank space reads as a bug either
 * way, and the reader deserves to know which of the two it is.
 */
export function SectionEmpty({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-surface/40 px-6 py-14 text-center">
      <Icon size={22} className="mx-auto text-muted-foreground" aria-hidden />
      <h3 className="editorial mt-4 text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {body}
      </p>
      {action && (
        <Link
          href={action.href}
          className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-5`}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
