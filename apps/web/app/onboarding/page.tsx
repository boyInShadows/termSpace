import { AccountOnboarding } from "@/features/account/account-onboarding";
import { onboardingCopy } from "@/features/account/onboarding-copy";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata() {
  return { title: onboardingCopy[await getLocale()].title, robots: { index: false, follow: false } };
}

export default function OnboardingPage() {
  return <main id="content" tabIndex={-1} className="container-page py-8 sm:py-12"><div className="mx-auto max-w-2xl"><AccountOnboarding setup /></div></main>;
}
