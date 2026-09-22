"use client";

import { useEffect, useRef, useState } from "react";
import { Compass, FileCheck2, Download, ShieldCheck, Lock, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  icon: typeof Compass;
  title: string;
  copy: string;
  /** Terminal lines shown in the pinned panel while this step is active. */
  lines: ReadonlyArray<{ label: string; value: string; tone?: "verified" | "accent" }>;
};

const STEPS: readonly Step[] = [
  {
    id: "discover",
    icon: Compass,
    title: "Search by outcome",
    copy: "Describe the job, not the file format. Results rank on whether the thing actually does what you asked, and compare across platforms and models before you commit.",
    lines: [
      { label: "query", value: "review my PR like a staff engineer" },
      { label: "matches", value: "34 across 6 platforms", tone: "accent" },
      { label: "ranked by", value: "outcome fit, not download count" },
    ],
  },
  {
    id: "verify",
    icon: FileCheck2,
    title: "Read what it touches",
    copy: "Contents, permissions, requirements, licence and update history are separate fields on every listing — not paragraphs in a README you have to trust.",
    lines: [
      { label: "reads", value: "current selection only" },
      { label: "network", value: "none requested", tone: "verified" },
      { label: "licence", value: "MIT" },
      { label: "safety", value: "reviewed 2 days ago", tone: "verified" },
    ],
  },
  {
    id: "install",
    icon: Download,
    title: "Put it to work",
    copy: "One command, the exact version you inspected, and updates that arrive with notes from the person who wrote them.",
    lines: [
      { label: "$", value: "termspace add conversion-copywriter" },
      { label: "resolved", value: "v2.4.0 (pinned)", tone: "accent" },
      { label: "ready", value: "installed in 1.8s", tone: "verified" },
    ],
  },
];

const PANEL_ICONS = [Boxes, Lock, ShieldCheck] as const;

/**
 * The three-step story, told as a pinned panel that re-renders as you scroll
 * past each step.
 *
 * A normal three-column feature row asks the reader to hold all three ideas
 * at once and rewards them for none. Pinning one panel and swapping its
 * contents means the page is always showing exactly the thing being
 * described, and the reader's scroll is what advances it — the reason to keep
 * going is built into the layout rather than promised by a CTA.
 *
 * The panel is decorative reinforcement: each step's full text is already in
 * the scrolling column, so nothing is lost if the observer never fires.
 */
export function Process() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const nodes = stepRefs.current.filter(Boolean) as HTMLDivElement[];
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = nodes.indexOf(entry.target as HTMLDivElement);
          if (index !== -1) setActive(index);
        }
      },
      // A narrow band across the middle of the viewport: whichever step is
      // sitting in it owns the panel.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const current = STEPS[active];
  const PanelIcon = PANEL_ICONS[active];

  return (
    <section className="border-y border-border bg-surface/40">
      <div className="container-page section-y">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="editorial mt-3 text-[clamp(2rem,1.2rem+2.4vw,3.2rem)] leading-[1.05]">
            From need to useful, without the leap of faith.
          </h2>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          {/* --- scrolling steps ------------------------------------------ */}
          <ol className="relative">
            {/* The rail the active marker travels down. */}
            <span
              aria-hidden
              className="absolute left-[15px] top-2 bottom-2 w-px bg-border"
            />
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === active;
              return (
                <li key={step.id}>
                  <div
                    ref={(node) => {
                      stepRefs.current[index] = node;
                    }}
                    className="relative py-8 pl-12 lg:py-12"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-0 top-8 grid size-8 place-items-center rounded-full border transition-all duration-500 lg:top-12",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-plasma"
                          : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      <Icon size={15} />
                    </span>

                    <p
                      className={cn(
                        "font-mono text-xs transition-colors duration-500",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3
                      className={cn(
                        "editorial mt-2 text-2xl transition-colors duration-500 sm:text-3xl",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-md leading-7 text-muted-foreground">
                      {step.copy}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* --- pinned panel --------------------------------------------- */}
          <div className="hidden lg:block">
            <div className="sticky top-28" aria-hidden>
              <div className="panel overflow-hidden rounded-2xl shadow-lift">
                <div className="flex items-center gap-2.5 border-b border-border/80 bg-surface-raised/60 px-4 py-3">
                  <PanelIcon size={14} className="text-primary" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    {current.id}
                  </span>
                  <span className="ml-auto flex gap-1">
                    {STEPS.map((step, index) => (
                      <span
                        key={step.id}
                        className={cn(
                          "h-1 rounded-full transition-all duration-500",
                          index === active
                            ? "w-6 bg-primary"
                            : "w-1.5 bg-border-strong",
                        )}
                      />
                    ))}
                  </span>
                </div>

                <div className="min-h-56 p-5 font-mono text-[13px] leading-7">
                  {current.lines.map((line, index) => (
                    <div
                      key={line.label + line.value}
                      className="ts-panel-line flex gap-4"
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <span className="w-24 shrink-0 text-muted-foreground">
                        {line.label}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1",
                          line.tone === "verified" && "text-verified",
                          line.tone === "accent" && "text-accent",
                        )}
                      >
                        {line.value}
                      </span>
                    </div>
                  ))}
                  <span className="mt-2 inline-block h-4 w-2 animate-pulse bg-accent align-middle" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
