/** Gouvernance du contenu : fraîcheur des pages, messages à partager, mise en forme du « Quoi de neuf ». Calculs purs. */

/** Une page non relue depuis ce délai est « à relire » : les règles de visa changent. */
export const REVIEW_STALE_DAYS = 180;
export type ReviewState = "never" | "ok" | "stale";

export function reviewState(reviewedAt: Date | string | null | undefined, now: Date = new Date()): ReviewState {
  if (!reviewedAt) return "never";
  return now.getTime() - new Date(reviewedAt).getTime() > REVIEW_STALE_DAYS * 24 * 60 * 60 * 1000 ? "stale" : "ok";
}

export const REVIEW_STATE_LABELS: Record<ReviewState, string> = { never: "Jamais relue", stale: "À relire", ok: "À jour" };

export const SITE_ORIGIN = "https://www.3mtravelagency.com";

/** « (Canada) » après le nom du projet : le nom du pays est saisi tel quel, sans article à accorder. */
const suffix = (destination: string) => (destination.trim() ? ` (${destination.trim()})` : "");

export type ShareTemplate = { id: string; label: string; body: (destination: string) => string };

/** Messages à partager (WhatsApp, Facebook) : aucune promesse, aucun chiffre, aucun faux témoignage ; seulement des outils gratuits réels. */
export const SHARE_TEMPLATES: ReadonlyArray<ShareTemplate> = [
  { id: "tool", label: "Outil gratuit : quel parcours pour mon projet ?", body: (destination) => `Un projet de mobilité${suffix(destination)} pour travailler, étudier ou voyager ? Répondez à cinq questions pour savoir quelle voie correspond à votre projet et par quoi commencer. Gratuit, sans compte : ${SITE_ORIGIN}/outils/parcours-mobilite` },
  { id: "pieces", label: "Liste des pièces à préparer", body: (destination) => `Avant de déposer un dossier${suffix(destination)}, vérifiez vos pièces. La liste est gratuite, sans compte, et vous pouvez la cocher et l'imprimer : ${SITE_ORIGIN}/outils/liste-de-pieces` },
  { id: "budget", label: "Simulateur de budget", body: (destination) => `Combien prévoir pour votre projet${suffix(destination)} ? Saisissez vos propres montants (visa, billet, logement, fonds à justifier) et obtenez votre total par devise : ${SITE_ORIGIN}/outils/budget-mobilite` },
  { id: "scam", label: "Prudence : vérifier une agence", body: () => `Avant de payer une agence de visa, d'études ou d'emploi, vérifiez-la. Voici les signaux d'alerte et les vérifications à faire : ${SITE_ORIGIN}/verifier-une-agence` },
  { id: "evaluation", label: "Évaluation gratuite de profil", body: (destination) => `Envie de savoir où vous en êtes pour votre projet${suffix(destination)} ? Demandez une évaluation de profil : elle est relue par un conseiller et ne garantit ni visa ni emploi. ${SITE_ORIGIN}/#evaluation-multi` },
];

export function buildShareMessage(templateId: string, destination: string): string {
  const template = SHARE_TEMPLATES.find((item) => item.id === templateId) ?? SHARE_TEMPLATES[0];
  return template.body(destination.trim());
}

export function shareLinks(message: string): { whatsapp: string; facebook: string } {
  const url = /(https:\/\/\S+)/.exec(message)?.[1] ?? SITE_ORIGIN;
  return { whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}` };
}

const normalize = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Regroupe les questions identiques (casse, accents, ponctuation) : le même besoin posé de trois façons compte pour un. */
export function groupQuestions<T extends { question: string }>(rows: T[]): Array<{ key: string; sample: string; count: number; items: T[] }> {
  const groups = new Map<string, { key: string; sample: string; count: number; items: T[] }>();
  for (const row of rows) {
    const key = normalize(row.question).slice(0, 120);
    if (key.length < 8) continue;
    const group = groups.get(key) ?? { key, sample: row.question.trim().slice(0, 200), count: 0, items: [] };
    group.count += 1;
    group.items.push(row);
    groups.set(key, group);
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

/** Nom de pays saisi par les candidats → code ISO (nom français exact, sans accents ni casse) ; null si inconnu. */
export function countryCodeFromName(name: string, rows: ReadonlyArray<readonly [string, string, string]>): string | null {
  const wanted = normalize(name);
  if (!wanted) return null;
  return rows.find((row) => normalize(row[1]) === wanted)?.[0] ?? null;
}
