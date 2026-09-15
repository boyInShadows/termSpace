import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EmailVerification } from "@/features/account/email-verification";

export default function VerifyEmailPage() {
  return <><Header /><main className="container-page py-16"><EmailVerification /></main><Footer /></>;
}
