import { cn } from "@/lib/utils";

/**
 * A person's or creator's picture. The initials always render; a picture, when present, is laid over them, so
 * a missing or failed image simply leaves the initials showing and nothing shifts. The server only accepts
 * GitHub image hosts (see the creator avatar CHECK in prisma/migrations). Decorative: the name sits beside it.
 */
export function Avatar({
  initials,
  src,
  className,
}: {
  initials: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-serif text-sm font-semibold text-foreground",
        className,
      )}
    >
      {initials}
      {src && (
        // Plain <img> on purpose: next/image would have our server fetch and resize a creator-influenced URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" />
      )}
    </span>
  );
}
