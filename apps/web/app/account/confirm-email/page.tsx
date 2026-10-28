import { Footer } from "@/components/layout/footer";
import { EmailChangeConfirmation } from "@/features/account/email-change-confirmation";

// The link carries a single-use token, so keep the page out of search indexes.
export const metadata = { robots: { index: false, follow: false } };

export default function ConfirmEmailPage() {
  return <><main id="content" tabIndex={-1} className="container-page py-16"><EmailChangeConfirmation /></main><Footer /></>;
}
