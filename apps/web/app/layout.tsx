import type { Metadata } from "next";
import "@/styles/globals.css";
import { preloadedFonts } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site";
import { Providers } from "@/components/layout/providers";
import { Header } from "@/components/layout/header";
import { SkipLink } from "@/components/layout/skip-link";
import { getLocale } from "@/lib/serverLocale";
import { copy } from "@/lib/i18n";
import { getServerSession } from "@/lib/server-session";
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const fa = locale === "fa";
  return { title: { default: fa ? "ترم‌اسپیس — اجزای هوش مصنوعی" : "termspace — AI building blocks", template: fa ? "%s · ترم‌اسپیس" : "%s · termspace" }, description: fa ? "پرامپت‌ها، مهارت‌ها، عامل‌ها و ابزارهای هوش مصنوعی قابل اعتماد را کشف کنید.": "Discover trusted prompts, skills, agents, MCP servers, and AI tools.", metadataBase: new URL(SITE_URL), openGraph: { siteName: "termspace", type: "website", locale: fa ? "fa_IR" : "en_US" }, twitter: { card: "summary_large_image" } };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, initialSession] = await Promise.all([getLocale(), getServerSession()]);
  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        {preloadedFonts(locale).map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
      </head>
      <body>
        <Providers locale={locale} messages={copy[locale]} initialSession={initialSession}>
          <SkipLink locale={locale} />
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
