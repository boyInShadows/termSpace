-- Existing members can complete their profile voluntarily; only new accounts enter onboarding.
ALTER TABLE "ReaderUser"
  ADD COLUMN "onboardingRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "onboardingRole" TEXT,
  ADD COLUMN "onboardingGoal" TEXT,
  ADD COLUMN "onboardingTools" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "onboardingIntent" TEXT;

ALTER TABLE "ReaderUser" ALTER COLUMN "onboardingRequired" SET DEFAULT true;
