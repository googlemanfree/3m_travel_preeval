export type ConsularRevalidationState = "current" | "due_soon" | "overdue" | "missing_deadline" | "control_required";

type RevalidationEntry = {
  verificationStatus: "verifie" | "a_completer";
  revalidateDueAt?: string | Date | null;
};

export function getConsularRevalidationState(
  entry: RevalidationEntry,
  referenceDate = new Date(),
  daysAhead = 30,
): ConsularRevalidationState {
  if (entry.verificationStatus === "a_completer") return "control_required";
  if (!entry.revalidateDueAt) return "missing_deadline";

  const dueAt = new Date(entry.revalidateDueAt).getTime();
  if (!Number.isFinite(dueAt)) return "missing_deadline";

  const now = referenceDate.getTime();
  if (dueAt < now) return "overdue";
  if (dueAt <= now + daysAhead * 24 * 60 * 60 * 1000) return "due_soon";
  return "current";
}

export function needsConsularRevalidation(entry: RevalidationEntry, referenceDate = new Date()): boolean {
  return getConsularRevalidationState(entry, referenceDate) !== "current";
}
