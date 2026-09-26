/**
 * Clients à inviter à donner leur avis : ceux dont le visa est accordé, qui n'ont pas déjà déposé d'avis et qu'on n'a pas déjà
 * invités. L'invitation reste envoyée par l'équipe (WhatsApp) et l'avis n'est publié qu'avec l'accord du client, après modération.
 */

export const REVIEW_INVITED_KEY_PREFIX = "review_invited:";
export const reviewInvitedKey = (reference: string): string => `${REVIEW_INVITED_KEY_PREFIX}${reference}`.slice(0, 100);

/** Service du formulaire d'avis correspondant au type de visa du dossier (vide si aucun ne correspond franchement). */
export function reviewServiceFor(visaType: string | null | undefined): "Visa Travail" | "Visa Études" | "Visa Visiteur" | "E-Visa" | "" {
  const text = String(visaType ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/(^|\W)(e-?visa|evisa)(\W|$)/.test(text)) return "E-Visa";
  if (text.includes("etude") || text.includes("student") || text.includes("formation")) return "Visa Études";
  if (text.includes("travail") || text.includes("work") || text.includes("emploi")) return "Visa Travail";
  if (text.includes("touris") || text.includes("visit")) return "Visa Visiteur";
  return "";
}

export type InviteCandidate = { key: string; email: string; fullName: string; phone: string; destination: string; visaType: string; approvedAt: Date | null };

/** Retire les clients déjà invités ou qui ont déjà déposé un avis (par e-mail), puis classe les visas les plus récents d'abord. */
export function pickClientsToInvite(candidates: InviteCandidate[], invitedKeys: Set<string>, reviewerEmails: Set<string>): InviteCandidate[] {
  const seenEmails = new Set<string>();
  return candidates
    .filter((candidate) => {
      const email = candidate.email.trim().toLowerCase();
      if (!candidate.fullName.trim() || invitedKeys.has(reviewInvitedKey(candidate.key)) || reviewerEmails.has(email) || seenEmails.has(email)) return false;
      seenEmails.add(email);
      return true;
    })
    .sort((left, right) => (right.approvedAt?.getTime() ?? 0) - (left.approvedAt?.getTime() ?? 0));
}
