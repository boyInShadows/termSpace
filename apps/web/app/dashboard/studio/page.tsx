import { CreatorDashboard } from "@/features/dashboard/creator-dashboard";
import { StudioNotice } from "./studio-notice";

export const metadata = { title: "Creator studio" };

export default function CreatorStudioPage() {
  return (
    <>
      <StudioNotice />
      <CreatorDashboard />
    </>
  );
}
