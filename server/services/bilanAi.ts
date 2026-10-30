/**
 * Assistant de relecture du bilan (Perplexity). L'administrateur le déclenche, relit la proposition et décide de l'appliquer ou non : rien ne part seul.
 * Avant tout envoi, le nom du candidat est remplacé par {{nom}} / {{prenom}} et les coordonnées sont masquées : le texte transmis ne permet pas d'identifier la personne.
 */
export const BILAN_AI_MODES = {
  correct: { label: "Corriger l'orthographe et la grammaire", instruction: "Corrige uniquement l'orthographe, la grammaire, la ponctuation et la typographie. Ne reformule pas." },
  clarify: { label: "Rendre plus clair et plus professionnel", instruction: "Reformule pour un ton professionnel, chaleureux et clair, avec des phrases courtes. Garde exactement les mêmes informations." },
  shorten: { label: "Raccourcir sans perdre d'information", instruction: "Raccourcis d'environ un quart en supprimant les répétitions. Garde toutes les informations et tous les chiffres." },
  english: { label: "Traduire en anglais", instruction: "Traduis fidèlement en anglais professionnel. Garde la structure et les variables." },
} as const;
export type BilanAiMode = keyof typeof BILAN_AI_MODES;
export const BILAN_AI_MODE_KEYS = Object.keys(BILAN_AI_MODES) as [BilanAiMode, ...BilanAiMode[]];

export const BILAN_AI_MAX_CHARS = 30_000;
export const BILAN_AI_RATE_PER_HOUR = 20;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Remplace le nom complet, puis chaque élément du nom (3 lettres et plus), par {{nom}} / {{prenom}} ; masque e-mails, téléphones et numéros d'identité. */
export function pseudonymizeBilan(text: string, fullName?: string | null): string {
  // Coordonnées d'abord : une adresse comme « prenom.nom@… » doit être masquée en entier avant que le nom ne soit remplacé.
  let out = String(text ?? "")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[e-mail masqué]")
    .replace(/(?:\+?\d[\d .()/-]{7,}\d)/g, "[numéro masqué]")
    .replace(/\b[A-Z]{1,4}[ -]?\d{6,}\b/g, "[identifiant masqué]");
  const name = (fullName ?? "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter((part) => part.length >= 3);
    const first = parts[0];
    out = out.replace(new RegExp(escapeRegExp(name), "gi"), "{{nom}}");
    for (const part of parts.slice(1).sort((a, b) => b.length - a.length)) out = out.replace(new RegExp(`\\b${escapeRegExp(part)}\\b`, "gi"), "{{nom}}");
    if (first) out = out.replace(new RegExp(`\\b${escapeRegExp(first)}\\b`, "gi"), "{{prenom}}");
  }
  return out;
}

export function buildBilanAiMessages(mode: BilanAiMode, pseudonymizedText: string): Array<{ role: "system" | "user"; content: string }> {
  return [
    {
      role: "system",
      content: [
        "Tu es relecteur pour une agence d'accompagnement visa et mobilité internationale. Tu réponds en français sauf demande de traduction.",
        "Règles strictes : n'invente rien (aucun chiffre, date, diplôme, employeur, délai ni montant) ; n'ajoute aucune promesse, garantie ou probabilité de résultat ; n'utilise aucune source externe ni citation ;",
        "conserve tels quels les marqueurs {{...}}, [À CONFIRMER ...] et les montants ; conserve la structure (titres commençant par ##, listes commençant par -, tableaux avec |).",
        "Réponds UNIQUEMENT avec le texte révisé, sans commentaire, sans introduction, sans bloc de code.",
      ].join(" "),
    },
    { role: "user", content: `${BILAN_AI_MODES[mode].instruction}\n\nTexte :\n${pseudonymizedText}` },
  ];
}

/** Retire les renvois de sources « [1] », les clôtures de code et les phrases d'introduction du modèle. */
export function cleanAiOutput(value: string): string {
  return String(value ?? "")
    .replace(/^\s*(?:voici|voilà)[^\n]{0,80}:\s*\n+/i, "")
    .replace(/^\s*```[a-z]*\n?|\n?```\s*$/gi, "")
    .replace(/\s?\[\d{1,2}\](?=[\s.,;:!?]|$)/g, "")
    .trim();
}

const calls = new Map<number, number[]>();
/** Limite d'appels par administrateur et par heure (en mémoire : suffisant contre un emballement, pas un quota comptable). */
export function takeAiSlot(adminId: number, now: number = Date.now()): boolean {
  const recent = (calls.get(adminId) ?? []).filter((time) => now - time < 3_600_000);
  if (recent.length >= BILAN_AI_RATE_PER_HOUR) { calls.set(adminId, recent); return false; }
  calls.set(adminId, [...recent, now]);
  return true;
}
export function resetAiSlots(): void { calls.clear(); }

export const bilanAiAvailable = (): boolean => Boolean(process.env.PERPLEXITY_API_KEY?.trim());

export async function askPerplexity(messages: Array<{ role: string; content: string }>, options: { fetcher?: typeof fetch; timeoutMs?: number } = {}): Promise<string> {
  const key = process.env.PERPLEXITY_API_KEY?.trim();
  if (!key) throw new Error("PERPLEXITY_API_KEY manquante");
  const fetcher = options.fetcher ?? fetch;
  const send = async (extra: Record<string, unknown>) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);
    try {
      return await fetcher("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.PERPLEXITY_MODEL?.trim() || "sonar", messages, temperature: 0.2, max_tokens: 4000, ...extra }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };
  // La recherche web est désactivée : la relecture ne doit apporter aucun fait extérieur. Si l'API refuse ce paramètre, on réessaie sans (les consignes interdisent déjà toute source).
  let response = await send({ disable_search: true });
  if (response.status === 400) response = await send({});
  if (!response.ok) throw new Error(`Perplexity a répondu ${response.status}`);
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content || !content.trim()) throw new Error("Réponse vide de l'assistant");
  return cleanAiOutput(content);
}
