import type { Metadata } from "next";
import { headers } from "next/headers";
import "@fontsource-variable/estedad";
import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getLocale } from "@/lib/serverLocale";
import {NextIntlClientProvider} from "next-intl";
import {getMessages} from "next-intl/server";
import { AnalyticsConsent } from "../../../shared/analytics/loader";
import { privacySignal, validMeasurementId } from "../../../shared/analytics/policy";
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
  const [locale, messages, requestHeaders] = await Promise.all([getLocale(), getMessages(), headers()]);
  const measurementId = validMeasurementId(process.env.GA4_MEASUREMENT_ID);
  const webUrl = (process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}>
      <body className="flex min-h-screen flex-col bg-paper text-ink antialiased">
        <NextIntlClientProvider messages={messages}>
          <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-paper-card focus:px-4 focus:py-3 focus:text-ink">{locale === "fa" ? "رفتن به محتوا" : "Skip to content"}</a>
          <SiteHeader />
          <main id="content" tabIndex={-1} className="flex-1">{children}</main>
          <SiteFooter analyticsEnabled={Boolean(measurementId)} />
          {measurementId && <AnalyticsConsent site="journal" locale={locale} privacyHref={`${webUrl}${locale === "fa" ? "/fa" : ""}/privacy`} headerSignal={privacySignal(requestHeaders)} measurementId={measurementId} />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
