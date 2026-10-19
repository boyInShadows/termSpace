import { LegalPage, legalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = () => legalMetadata("privacy");
export default function PrivacyPage() { return <LegalPage slug="privacy" />; }
