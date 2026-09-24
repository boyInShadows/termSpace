import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/card";

export const alt = "termspace — the community library for agentic coding tools";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

export default function Image() {
  return renderOgCard({
    eyebrow: "The community library for agentic coding tools",
    title: "Stop prompting from scratch. Start from what works.",
    chips: [
      { label: "Reviewed", sub: "safety pass", tone: "verified" },
      { label: "Scoped", sub: "permissions declared", tone: "accent" },
      { label: "Versioned", sub: "pinned releases", tone: "primary" },
    ],
  });
}
