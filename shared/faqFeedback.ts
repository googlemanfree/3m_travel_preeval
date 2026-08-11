export type FaqFeedbackValue = "helpful" | "notHelpful";

export const FAQ_FEEDBACK_STORAGE_KEY = "3m-faq-feedback";

export function parseStoredFaqFeedback(raw: string | null): Record<string, FaqFeedbackValue> {
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) => value === "helpful" || value === "notHelpful"
      )
    ) as Record<string, FaqFeedbackValue>;
  } catch {
    return {};
  }
}

export function canSubmitFaqFeedback(
  feedback: Record<string, FaqFeedbackValue>,
  questionKey: string
): boolean {
  return questionKey.trim().length > 0 && !feedback[questionKey];
}
