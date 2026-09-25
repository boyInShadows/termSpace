import { CreatorHub } from "@/features/creator/creator-hub";
import { StudioNotice } from "./studio-notice";

export const metadata = { title: "Creator studio" };

export default function CreatorStudioPage() {
  return (
    <>
      <StudioNotice />
      <CreatorHub />
    </>
  );
}
