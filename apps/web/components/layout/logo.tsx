import Link from "next/link";

export function Logo({
  concept = "cursor",
}: {
  concept?: "pure" | "cursor" | "block" | "mark";
}) {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center gap-2 text-xl font-semibold tracking-[-.04em]"
      aria-label="termspace home"
    >
      {concept === "block" && (
        <span className="grid size-5 grid-cols-2 gap-0.5" aria-hidden>
          <i className="bg-primary" />
          <i className="border border-foreground" />
          <i className="col-span-2 bg-foreground" />
        </span>
      )}
      {concept === "mark" ? (
        <BrandMark />
      ) : (
        <span className="editorial text-2xl">termspace</span>
      )}
      {concept === "cursor" && (
        <span className="ts-caret h-5 w-[2px] bg-primary" aria-hidden />
      )}
    </Link>
  );
}

/**
 * The owner's modular mark: a filled blue tile, an outlined tile and a
 * full-width bar. The outline and bar follow the theme ink, so the mark reads
 * on paper and on the dark ground.
 */
function BrandMark() {
  return (
    <svg
      viewBox="277 292 446 416"
      className="h-8 w-auto text-foreground"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="277" y="292" width="210" height="210" rx="24" fill="#2051CE" />
      <rect x="522" y="301" width="192" height="192" rx="15" fill="none" stroke="currentColor" strokeWidth="18" />
      <rect x="277" y="528" width="446" height="180" rx="24" fill="currentColor" />
    </svg>
  );
}
