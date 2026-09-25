import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * The social card, 1200×630: dark canvas, the name in Newsreader, a type
 * pill, the trust chips in the hero's order, and the wordmark bottom-left.
 *
 * Satori, which renders these, reads static TTF/OTF/WOFF files, not the
 * variable WOFF2 the site serves, so lib/og/fonts holds static WOFF cuts of
 * the same faces (SIL OFL; licences beside them).
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// sRGB approximations of the dark theme's oklch tokens (styles/tokens.css).
const COLOR = {
  background: "#0f0e17",
  foreground: "#f3f1f8",
  muted: "#a8a3b8",
  border: "#2d2a3d",
  panel: "#18161f",
  primary: "#a07cf5",
  accent: "#5fd6e6",
  verified: "#5fe39a",
  spark: "#f06bb3",
};

const FONT_DIR = path.join(process.cwd(), "lib", "og", "fonts");

type OgFonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]>;
let fontsPromise: Promise<OgFonts> | null = null;
function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(path.join(FONT_DIR, "newsreader-latin-500-normal.woff")),
    readFile(path.join(FONT_DIR, "geist-sans-latin-400-normal.woff")),
    readFile(path.join(FONT_DIR, "geist-sans-latin-600-normal.woff")),
    readFile(path.join(FONT_DIR, "geist-mono-latin-400-normal.woff")),
  ]).then(([serif, sans, sansBold, mono]) => [
    { name: "Newsreader", data: serif, weight: 500 as const, style: "normal" as const },
    { name: "Geist", data: sans, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: sansBold, weight: 600 as const, style: "normal" as const },
    { name: "Geist Mono", data: mono, weight: 400 as const, style: "normal" as const },
  ]);
  return fontsPromise;
}

export type OgChip = { label: string; sub: string; tone: "verified" | "accent" | "primary" | "muted" };

export async function renderOgCard({ eyebrow, title, pill, chips }: { eyebrow: string; title: string; pill?: string; chips: OgChip[] }) {
  const titleSize = title.length > 34 ? 72 : 92;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          background: COLOR.background,
          backgroundImage: `radial-gradient(60% 70% at 85% 10%, ${COLOR.primary}44, transparent 70%), radial-gradient(50% 60% at 100% 90%, ${COLOR.spark}2e, transparent 70%), radial-gradient(40% 50% at 70% 60%, ${COLOR.accent}22, transparent 70%)`,
          color: COLOR.foreground,
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {pill && (
            <div style={{ display: "flex", padding: "6px 16px", borderRadius: 999, border: `1px solid ${COLOR.accent}66`, color: COLOR.accent, fontSize: 24, fontWeight: 600 }}>
              {pill}
            </div>
          )}
          <div style={{ display: "flex", fontFamily: "Geist Mono", fontSize: 24, color: COLOR.muted, letterSpacing: 2, textTransform: "uppercase" }}>{eyebrow}</div>
        </div>

        <div style={{ display: "flex", marginTop: 40, maxWidth: 1000, fontFamily: "Newsreader", fontSize: titleSize, lineHeight: 1.02, letterSpacing: -2 }}>
          {title}
        </div>

        <div style={{ display: "flex", gap: 18, marginTop: "auto", marginBottom: 56 }}>
          {chips.map((chip) => (
            <div
              key={chip.sub}
              style={{ display: "flex", flexDirection: "column", padding: "14px 20px", borderRadius: 18, background: COLOR.panel, border: `1px solid ${COLOR.border}`, maxWidth: 540 }}
            >
              <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: COLOR[chip.tone === "muted" ? "foreground" : chip.tone] }}>{chip.label}</div>
              <div style={{ display: "flex", marginTop: 4, fontFamily: "Geist Mono", fontSize: 18, color: COLOR.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{chip.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Newsreader", fontSize: 40 }}>
          termspace
          <div style={{ display: "flex", width: 4, height: 36, background: COLOR.primary }} />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
