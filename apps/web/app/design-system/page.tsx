import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Logo } from "@/components/layout/logo";
import { Showroom } from "./showroom";
export const metadata: Metadata = { title: "Design system" };
const colors = [
  ["Void", "bg-background", "oklch(14.5% .022 286)"],
  ["Surface", "bg-surface", "oklch(18.5% .026 286)"],
  ["Raised", "bg-surface-raised", "oklch(23% .03 288)"],
  ["Foreground", "bg-foreground", "oklch(96% .01 286)"],
  ["Muted", "bg-muted", "oklch(26% .026 286)"],
  ["Plasma / primary", "bg-primary", "oklch(68% .195 292)"],
  ["Signal / accent", "bg-accent", "oklch(80% .135 196)"],
  ["Ion / spark", "bg-spark", "oklch(72% .215 340)"],
  ["Verified", "bg-success", "oklch(82% .175 152)"],
  ["Caution", "bg-warning", "oklch(83% .15 85)"],
  ["Alert", "bg-destructive", "oklch(66% .205 22)"],
];
const checks = [
  "Brand fit",
  "Community-library clarity",
  "Product-card quality",
  "Trust",
  "Creator appeal",
  "User appeal",
  "Mobile quality",
  "Accessibility",
  "Originality",
  "Readiness to continue",
];
export default function DesignSystemPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16">
          <p className="eyebrow">termspace design language · signal &amp; void</p>
          <div className="mt-5 grid gap-8 md:grid-cols-[1fr_.7fr]">
            <h1 className="editorial text-5xl font-medium leading-[1.02] sm:text-6xl">
              Signal for the craft.
              <br />
              Clarity for the choice.
            </h1>
            <p className="self-end text-base leading-7 text-muted-foreground">
              An editorial community-library system built to make technical resources
              understandable, comparable, and worthy of trust — on a
              violet-cast void that reads as emission rather than paint.
            </p>
          </div>
        </section>
        <section className="border-y bg-surface">
          <div className="container-page py-12">
            <p className="eyebrow">Wordmark studies</p>
            <div className="mt-7 grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-3">
              <div className="bg-background p-8">
                <Logo concept="pure" />
                <p className="mt-10 text-xs text-muted-foreground">
                  01 · Pure editorial
                </p>
              </div>
              <div className="bg-background p-8">
                <Logo concept="cursor" />
                <p className="mt-10 text-xs text-muted-foreground">
                  02 · Terminal cursor
                </p>
              </div>
              <div className="bg-background p-8">
                <Logo concept="block" />
                <p className="mt-10 text-xs text-muted-foreground">
                  03 · Modular space
                </p>
              </div>
            </div>
          </div>
        </section>
        <div className="container-page py-16">
          <section>
            <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
              <div>
                <p className="eyebrow">Foundation</p>
                <h2 className="editorial mt-2 text-3xl">Semantic color</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {colors.map(([name, bg, val]) => (
                  <div key={name}>
                    <div className={`aspect-square rounded-md border ${bg}`} />
                    <p className="mt-2 text-xs font-semibold">{name}</p>
                    <code className="mt-1 block text-[9px] text-muted-foreground">
                      {val}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="mt-16 border-t border-border-strong pt-7">
            <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
              <div>
                <p className="eyebrow">Typography</p>
                <h2 className="editorial mt-2 text-3xl">Three voices</h2>
              </div>
              <div className="space-y-8">
                <div>
                  <p className="eyebrow">Newsreader · editorial display</p>
                  <p className="editorial mt-2 text-5xl leading-none">
                    Useful things, beautifully explained.
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Geist Sans · interface</p>
                  <p className="mt-2 max-w-xl text-lg">
                    Technical enough for product detail. Calm enough for careful
                    reading. Clear enough for every control.
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Geist Mono · technical metadata</p>
                  <code className="mt-2 block rounded-md bg-foreground p-4 font-mono text-sm text-background">
                    compatible: claude-4 · gpt-5 / version: 2.4.0
                  </code>
                </div>
              </div>
            </div>
          </section>
          <section className="my-16 border-y py-10">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <p className="eyebrow">Spacing</p>
                <div className="mt-5 flex items-end gap-2">
                  {[4, 8, 12, 16, 24, 32, 48].map((x) => (
                    <span
                      key={x}
                      style={{ height: x }}
                      className="w-5 bg-primary"
                      title={`${x}px`}
                    />
                  ))}
                </div>
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  4 · 8 · 12 · 16 · 24 · 32 · 48
                </p>
              </div>
              <div>
                <p className="eyebrow">Radius</p>
                <div className="mt-5 flex gap-3">
                  {["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl"].map(
                    (x) => (
                      <span
                        key={x}
                        className={`size-14 border-2 border-primary ${x}`}
                      />
                    ),
                  )}
                </div>
              </div>
              <div>
                <p className="eyebrow">Elevation</p>
                <div className="mt-5 flex gap-4">
                  <span className="size-14 rounded-md bg-surface shadow-soft" />
                  <span className="size-14 rounded-md bg-surface shadow-lift" />
                </div>
              </div>
            </div>
          </section>
          <Showroom />
          <section className="mt-20 border-t-2 border-foreground pt-10">
            <p className="eyebrow">Concept decision</p>
            <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="editorial text-4xl">
                  Is this the right shelf for the work?
                </h2>
                <p className="mt-5 leading-7 text-muted-foreground">
                  The concept is distinctive through its editorial serif, a
                  disciplined plasma accent, technical mono details, and
                  product-information-first composition. Trust comes from
                  explicit compatibility, permissions, versioning, and scan
                  status—not decorative security claims.
                </p>
                <p className="mt-4 leading-7 text-muted-foreground">
                  Colour is used semantically rather than decoratively. Plasma
                  is the only hue permitted to cover large areas, Signal stays
                  on technical metadata, Ion exists only inside gradients, and
                  Verified green is reserved for trust claims — if something is
                  green here, it is an assertion about safety, never a garnish.
                </p>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Decision
                    title="Strengths"
                    items={[
                      "Recognizable editorial voice",
                      "Trust metadata is first-class",
                      "Cards scale across asset types",
                      "Strong creator craft signal",
                    ]}
                  />
                  <Decision
                    title="Risks to test"
                    items={[
                      "Serif density on small screens",
                      "How much metadata users need",
                      "Terracotta action salience",
                      "Meaning of verified status",
                    ]}
                  />
                  <Decision
                    title="User tests"
                    items={[
                      "Can users judge compatibility?",
                      "Can creators imagine publishing?",
                      "Is the free-sharing model obvious?",
                      "Can users explain safety status?",
                    ]}
                  />
                  <Decision
                    title="Next phase"
                    items={[
                      "Creator publishing flow",
                      "Install and library flow",
                      "Search relevance model",
                      "Moderation and review operations",
                    ]}
                  />
                </div>
              </div>
              <div className="rounded-xl border bg-surface p-6">
                <h3 className="editorial text-2xl">
                  Visual evaluation checklist
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use these prototype controls during a stakeholder review.
                </p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {checks.map((x) => (
                    <label
                      key={x}
                      className="flex min-h-11 cursor-pointer items-center gap-3 border-b text-sm"
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--primary)]"
                      />
                      {x}
                    </label>
                  ))}
                </div>
                <label className="mt-6 block text-sm font-semibold">
                  Decision notes
                  <textarea
                    className="mt-2 min-h-28 w-full rounded-md border bg-background p-3 font-normal"
                    placeholder="What feels ownable? What still feels uncertain?"
                  />
                </label>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
function Decision({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {items.map((x) => (
          <li key={x}>— {x}</li>
        ))}
      </ul>
    </div>
  );
}
