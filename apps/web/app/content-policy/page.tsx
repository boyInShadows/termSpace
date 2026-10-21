import { LegalPage, legalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = () => legalMetadata("content-policy");
export default function ContentPolicyPage() { return <LegalPage slug="content-policy" />; }
