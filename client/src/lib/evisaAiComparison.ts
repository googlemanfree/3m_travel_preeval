export function normaliseEvisaText(value: string): string {
  return value.replace(/\r\n/g, "\n").split("\n").map((item) => item.trim()).filter(Boolean).join("\n").toLocaleLowerCase("fr-FR");
}

export function hasEvisaAiDifference(current: string, proposed: string): boolean {
  return normaliseEvisaText(current) !== normaliseEvisaText(proposed);
}

export function buildSuggestedNotes(currentNotes: string, precautions: string[]): string {
  const header = "Précautions suggérées par l’IA — à vérifier :";
  const existing = currentNotes.trim();
  const proposed = precautions.map((item) => item.trim()).filter(Boolean).join("\n");
  return [existing, header, proposed].filter(Boolean).join("\n");
}
