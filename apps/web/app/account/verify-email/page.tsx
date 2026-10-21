import { Footer } from "@/components/layout/footer";
import { EmailVerification } from "@/features/account/email-verification";

export default function VerifyEmailPage() {
  return <><main id="content" tabIndex={-1} className="container-page py-16"><EmailVerification /></main><Footer /></>;
}
