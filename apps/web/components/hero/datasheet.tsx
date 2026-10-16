import { cn } from "@/lib/utils";
import type { HomeSections } from "@/lib/i18n/home-sections";

export type DatasheetCopy = HomeSections["datasheet"];

/** Strong rules, ink on the ground; light rules inside a table use `border-border`. */
const RULE = "border-foreground/60";
/** Datasheet labels. Persian drops the tracking and capitals globally (globals.css). */
const LABEL = "text-[11px] font-semibold uppercase tracking-[0.08em]";

/**
 * The revision table beside the headline: the example listing's identity as a
 * datasheet title block. Hidden on a phone, where the example below carries
 * the same facts.
 */
export function TitleBlock({ sheet }: { sheet: DatasheetCopy }) {
  const b = sheet.titleBlock;
  const rows = [
    { label: b.document, value: b.documentValue, code: true },
    { label: b.revision, value: b.revisionValue, code: true },
    { label: b.review, value: b.reviewValue, code: false },
    { label: b.pinned, value: b.pinnedValue, code: true },
  ];
  return (
    <div className={cn("border text-xs", RULE)}>
      <p className={cn("flex justify-between bg-foreground px-2.5 py-1.5 text-background", LABEL)}>
        <span>{b.heading}</span>
        <span dir="ltr">{b.page}</span>
      </p>
      <dl>
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3 border-t border-border px-2.5 py-1.5">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className={row.code ? "font-mono" : undefined}>
              {row.code ? <bdi dir="ltr">{row.value}</bdi> : row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SectionHeading({ id, number, children }: { id: string; number: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className={cn("mb-2", LABEL)}>
      {/* The margin sits on a wrapper: logical margins resolve against the
          element's own direction, and the number itself is left-to-right. */}
      <span className="me-2"><bdi dir="ltr" className="font-mono font-medium text-primary">{number}</bdi></span>
      {children}
    </h3>
  );
}

/** Pin diagram: one listing as a part, each pin a platform it works with. Plain lines, no fills. */
function PinDiagram({ sheet }: { sheet: DatasheetCopy }) {
  const pins = [
    { y: 40, name: "Claude" },
    { y: 72, name: "Cursor" },
    { y: 104, name: "VS Code" },
  ];
  return (
    <svg viewBox="0 0 258 150" role="img" aria-label={sheet.compatLabel} className="[direction:ltr] h-auto w-full max-w-[17rem] font-mono text-foreground">
      <g stroke="currentColor" fill="none" strokeWidth="1.2">
        <rect x="112" y="14" width="64" height="116" />
        <path d="M134 14a10 10 0 0 0 20 0" />
        {pins.map((pin) => <path key={pin.name} d={`M84 ${pin.y}h28`} />)}
      </g>
      <g stroke="currentColor" strokeOpacity=".4" fill="none" strokeWidth="1.2" strokeDasharray="3 3">
        {pins.map((pin) => <path key={pin.name} d={`M176 ${pin.y}h28`} />)}
      </g>
      <g fill="currentColor" fontSize="12" textAnchor="end">
        {pins.map((pin) => <text key={pin.name} x="78" y={pin.y + 4}>{pin.name}</text>)}
      </g>
      <g fill="currentColor" fillOpacity=".6" fontSize="10" textAnchor="middle">
        {pins.map((pin, index) => <text key={pin.name} x="104" y={pin.y - 4}>{index + 1}</text>)}
      </g>
      <g fill="currentColor" fillOpacity=".6" fontSize="10">
        {pins.map((pin) => <text key={pin.name} x="208" y={pin.y + 4}>{sheet.notConnected}</text>)}
      </g>
      <text x="144" y="78" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-primary" transform="rotate(-90 144 78)">
        {`SKILL v${sheet.titleBlock.revisionValue}`}
      </text>
    </svg>
  );
}

/**
 * One example listing, set as a component datasheet: the product's claim (a
 * listing states what it reads, writes and calls out to) shown rather than
 * told. Synthetic, and labelled so twice. Static markup, no script.
 */
export function Datasheet({ sheet }: { sheet: DatasheetCopy }) {
  const b = sheet.titleBlock;
  return (
    <article aria-labelledby="sheet-title" className={cn("mt-10 border", RULE)}>
      <div className={cn("grid grid-cols-[auto_1fr] border-b-[3px] border-double sm:grid-cols-[auto_1fr_auto]", RULE)}>
        <p className={cn("flex items-center bg-foreground px-4 text-background", LABEL)}>{sheet.exampleTag}</p>
        <div className="min-w-0 px-4 py-3">
          <h2 id="sheet-title" className="text-xl font-bold leading-tight tracking-tight sm:text-2xl"><bdi dir="ltr">{sheet.name}</bdi></h2>
          <p className="ts-bidi mt-1 text-xs text-muted-foreground">{sheet.meta}</p>
        </div>
        <div className={cn("hidden flex-col justify-center border-s px-4 text-end sm:flex", RULE)}>
          <span className="text-xs text-muted-foreground">{sheet.revisionLabel}</span>
          <b className="font-mono text-xl" dir="ltr">v{b.revisionValue}</b>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.55fr_1fr]">
        <section aria-labelledby="sheet-features" className="p-4">
          <SectionHeading id="sheet-features" number="1">{sheet.featuresHeading}</SectionHeading>
          <ul className="text-sm">
            {sheet.features.map((feature) => (
              <li key={feature} className="ts-bidi relative border-b border-border py-1.5 ps-4 last:border-0 before:absolute before:start-0 before:top-3 before:size-1.5 before:border before:border-foreground before:content-['']">
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="sheet-ratings" className={cn("border-t p-4 lg:border-s lg:border-t-0", RULE)}>
          <SectionHeading id="sheet-ratings" number="2">{sheet.ratingsHeading}</SectionHeading>
          <table className="w-full text-[13px]">
            <caption className="sr-only">{sheet.ratingsHeading}</caption>
            <thead>
              <tr>
                {sheet.ratingsColumns.map((column) => (
                  <th key={column} scope="col" className={cn("border-b-2 border-primary px-2 py-1.5 text-start text-primary", LABEL)}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.ratingRows.map((row) => (
                <tr key={row.parameter} className="border-b border-border last:border-0">
                  <th scope="row" className="px-2 py-2 text-start font-semibold">{row.parameter}</th>
                  <td className="ts-bidi px-2 py-2 font-mono text-xs rtl:font-sans">
                    {row.value ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-2 py-2 text-xs">
                    {row.tone === "warn" ? (
                      <span className="whitespace-nowrap border border-destructive px-1.5 py-0.5 font-bold text-destructive">{row.status}</span>
                    ) : row.status ? (
                      <span className="font-mono rtl:font-sans">{row.status}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="sheet-compat" className={cn("border-t p-4 lg:border-s lg:border-t-0", RULE)}>
          <SectionHeading id="sheet-compat" number="3">{sheet.compatHeading}</SectionHeading>
          <PinDiagram sheet={sheet} />
        </section>
      </div>

      <div className={cn("grid border-t text-sm sm:grid-cols-[auto_auto_1fr]", RULE)}>
        <h3 className={cn("bg-muted px-4 py-2.5 text-primary", LABEL)}>
          <span className="me-2"><bdi dir="ltr" className="font-mono font-medium">4</bdi></span>
          {sheet.orderHeading}
        </h3>
        <p className={cn("flex items-center gap-2 border-t px-4 py-2.5 sm:border-s sm:border-t-0", RULE)}>
          <span className={cn("text-muted-foreground", LABEL)}>{sheet.pinnedLabel}</span>
          <b className="font-mono" dir="ltr">{b.pinnedValue}</b>
        </p>
        <p dir="ltr" className={cn("overflow-x-auto whitespace-pre-wrap break-all border-t bg-foreground px-4 py-2.5 font-mono text-[11px] text-background sm:whitespace-nowrap sm:break-normal sm:text-[13px] sm:border-s sm:border-t-0", RULE)}>
          <span className="opacity-60">$ </span>{sheet.command}
        </p>
      </div>

      <p className={cn("flex flex-wrap justify-between gap-x-4 gap-y-1 border-t px-4 py-2 text-xs text-muted-foreground", RULE)}>
        <span>{sheet.footer}</span>
        <span>{sheet.pageLabel}</span>
      </p>
    </article>
  );
}
