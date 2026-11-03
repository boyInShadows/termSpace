import { Footer } from "@/components/layout/footer";
import { PasswordReset } from "@/features/account/password-reset";

export default function ResetPasswordPage() {
  return <><main id="content" tabIndex={-1} className="container-page py-16"><PasswordReset /></main><Footer /></>;
}
