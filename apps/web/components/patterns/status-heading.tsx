import type { ReactNode } from "react";

/**
 * Eyebrow, headline and one sentence: the top of the 404 and error pages.
 * Its own module, with no imports worth the name, because the error
 * boundaries that use it ship on every route.
 */
export function StatusHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground rtl:font-sans rtl:normal-case rtl:tracking-normal">{eyebrow}</p>
      <h1 className="editorial mt-4 text-[clamp(2.4rem,1.4rem+4vw,4rem)] font-medium leading-[1.02]">{title}</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{children}</p>
    </div>
  );
}
