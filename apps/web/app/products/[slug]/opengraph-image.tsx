import { getProduct } from "@/lib/api";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/card";

export const alt = "A termspace listing";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

const CHIP_LABEL_MAX = 34;
const clip = (text: string) => (text.length > CHIP_LABEL_MAX ? `${text.slice(0, CHIP_LABEL_MAX - 1)}…` : text);

/** The listing's card: its name, type, and the same three claims as its page header. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug).catch(() => null);
  if (!product) {
    return renderOgCard({ eyebrow: "termspace", title: "Listing not found", chips: [] });
  }
  return renderOgCard({
    eyebrow: product.compatibility.platforms.slice(0, 3).join(" · "),
    title: product.name,
    pill: product.type,
    chips: [
      product.verified
        ? { label: "Verified", sub: "safety reviewed", tone: "verified" }
        : { label: "Not yet reviewed", sub: "review pending", tone: "muted" },
      { label: clip(product.permissions ?? "Not declared"), sub: "permission scope", tone: "accent" },
      { label: clip(product.license ?? "Not stated"), sub: "licence", tone: "primary" },
    ],
  });
}
