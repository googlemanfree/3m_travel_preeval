import { DECLINE_REASONS, type DeclineReason } from "@shared/evaluationDecision";
import { Badge } from "@/components/ui/badge";

export type AccountBilanStatus = {
  sent?: boolean;
  sentAt?: string | Date | null;
  viewedAt?: string | Date | null;
  decision?: string | null;
  declineReason?: string | null;
  openingRequested?: boolean;
  feeXaf?: number | null;
  paid?: boolean;
};

const short = (value: string | Date | null | undefined) => (value ? new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "");
const daysAgo = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  return days <= 0 ? "aujourd'hui" : `il y a ${days} j`;
};
const tone = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

/**
 * Où en est ce compte, d'un coup d'œil : évaluation effectuée, lue, validée ou refusée par le candidat, ouverture demandée, frais fixés et payés,
 * nombre de pièces, dernière connexion. Rien n'est affiché qui ne soit pas réellement arrivé.
 */
export function BilanStatusChips({ accountId, bilan, documentsCount, lastLoginAt }: { accountId: number; bilan?: AccountBilanStatus | null; documentsCount?: number; lastLoginAt?: string | Date | null }) {
  const chips: Array<{ key: string; className: string; text: string; title?: string }> = [];
  if (bilan?.sent) {
    chips.push({ key: "sent", className: tone.green, text: `✓ Évaluation effectuée · ${short(bilan.sentAt)}`, title: "Le bilan a été validé et envoyé au candidat" });
    chips.push(bilan.viewedAt
      ? { key: "viewed", className: tone.sky, text: `Bilan lu · ${short(bilan.viewedAt)}`, title: "Première consultation du bilan (e-mail ou espace client)" }
      : { key: "unread", className: tone.slate, text: "Bilan pas encore lu", title: "Aucune ouverture détectée" });
    if (bilan.decision === "accepted" || bilan.openingRequested) chips.push({ key: "accepted", className: tone.green, text: "✓ Validé par le candidat", title: "« Je valide et j'ouvre mon dossier »" });
    else if (bilan.decision === "declined") chips.push({ key: "declined", className: tone.rose, text: `Refusé : ${bilan.declineReason && bilan.declineReason in DECLINE_REASONS ? DECLINE_REASONS[bilan.declineReason as DeclineReason] : "motif non précisé"}`, title: "À rappeler" });
    else chips.push({ key: "waiting", className: tone.amber, text: `Réponse attendue (${daysAgo(bilan.sentAt) ?? "date inconnue"})`, title: "Le candidat n'a pas encore validé ni refusé" });
    if (bilan.openingRequested && !bilan.paid) chips.push({ key: "opening", className: tone.blue, text: "Ouverture demandée : frais à payer", title: "Aucune activation sans preuve de paiement" });
  }
  if (bilan?.feeXaf && bilan.feeXaf > 0) chips.push({ key: "fee", className: tone.slate, text: `Frais d'ouverture : ${bilan.feeXaf.toLocaleString("fr-FR")} XAF` });
  if (bilan?.paid) chips.push({ key: "paid", className: tone.green, text: "✓ Frais payés" });
  if (typeof documentsCount === "number") chips.push({ key: "docs", className: documentsCount > 0 ? tone.blue : tone.slate, text: documentsCount > 0 ? `${documentsCount} pièce(s) déposée(s)` : "Aucune pièce déposée" });
  const login = daysAgo(lastLoginAt);
  chips.push({ key: "login", className: tone.slate, text: login ? `Dernière connexion ${login}` : "Jamais connecté" });
  return (
    <div className="mt-1 flex flex-wrap gap-1" data-testid={`predossier-chips-${accountId}`}>
      {chips.map((chip) => <Badge key={chip.key} variant="outline" title={chip.title} data-chip={chip.key} className={`text-[11px] font-medium ${chip.className}`}>{chip.text}</Badge>)}
    </div>
  );
}
