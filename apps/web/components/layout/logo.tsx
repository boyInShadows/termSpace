import Link from "next/link";
export function Logo({
  concept = "cursor",
}: {
  concept?: "pure" | "cursor" | "block";
}) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-xl font-semibold tracking-[-.04em]"
      aria-label="termspace home"
    >
      {concept === "block" && (
        <span className="grid size-5 grid-cols-2 gap-0.5" aria-hidden>
          <i className="bg-primary" />
          <i className="border border-foreground" />
          <i className="col-span-2 bg-foreground" />
        </span>
      )}
      <span className="editorial text-2xl">termspace</span>
      {concept === "cursor" && (
        <span className="ts-caret h-5 w-[2px] bg-primary" aria-hidden />
      )}
    </Link>
  );
}
