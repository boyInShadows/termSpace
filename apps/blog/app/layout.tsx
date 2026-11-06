import type { Metadata } from "next";
import "@fontsource-variable/estedad";
import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getLocale } from "@/lib/serverLocale";
import {NextIntlClientProvider} from "next-intl";
import {getMessages} from "next-intl/server";
import {
  SITE_DESCRIPTION,
  SITE_DESCRIPTION_FA,
  SITE_NAME,
  SITE_URL,
  localizedAlternates,
  localizedUrl,
} from "@/lib/siteMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isPersian = locale === "fa";
  const title = isPersian
    ? "ترم‌اسپیس — جستارهایی دربارهٔ نرم‌افزار و طراحی"
    : "Termspace — Notes on craft, code, and calm";
  const description = isPersian ? SITE_DESCRIPTION_FA : SITE_DESCRIPTION;

  return {
    metadataBase: SITE_URL,
    title: {
      default: title,
      template: `%s — ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    alternates: localizedAlternates("/", locale),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: localizedUrl("/", locale),
      locale: isPersian ? "fa_IR" : "en_US",
      alternateLocale: isPersian ? ["en_US"] : ["fa_IR"],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}>
      <body className="flex min-h-screen flex-col bg-paper text-ink antialiased">
        <NextIntlClientProvider messages={messages}>
          <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-paper-card focus:px-4 focus:py-3 focus:text-ink">{locale === "fa" ? "رفتن به محتوا" : "Skip to content"}</a>
          <SiteHeader />
          <main id="content" tabIndex={-1} className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
