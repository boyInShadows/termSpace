import { request } from "./api";

export const onboardingOptions = {
  role: ["developer", "designer", "student", "founder", "other"],
  goal: ["discover", "workflow", "learn", "share"],
  tools: ["claude_code", "codex", "cursor", "vscode", "chatgpt", "gemini", "other", "getting_started"],
  intent: ["explore", "create"],
} as const;

export type OnboardingAnswers = {
  role: typeof onboardingOptions.role[number] | null;
  goal: typeof onboardingOptions.goal[number] | null;
  tools: (typeof onboardingOptions.tools[number])[];
  intent: typeof onboardingOptions.intent[number] | null;
};
export type OnboardingProfile = OnboardingAnswers & { required: boolean };

export async function getOnboarding(signal?: AbortSignal) {
  return (await request<{ data: OnboardingProfile }>("/api/readers/onboarding", { signal })).data;
}

export async function saveOnboarding(answers: OnboardingAnswers) {
  return (await request<{ data: OnboardingProfile }>("/api/readers/onboarding", { method: "PUT", body: JSON.stringify(answers) })).data;
}
