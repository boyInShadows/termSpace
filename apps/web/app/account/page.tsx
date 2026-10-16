import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Metadata } from "next";
import { AccountForm } from "@/features/account/account-form";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy[await getLocale()].account };
}

export default function AccountPage() { return <><Header /><main className="container-page py-16"><Suspense><AccountForm /></Suspense></main><Footer /></>; }
