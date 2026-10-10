import { GitBranch, ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { procedureLabelForDossier } from "@shared/clientMultiDossier";

export type SimultaneousProcedureCard = {
  id: string;
  folderCode: string;
  projectType?: string | null;
  destinationCountry?: string | null;
  paymentStatus?: string | null;
  status?: string | null;
  procedureLabel?: string | null;
  /** Prochaine action connue (dossier ouvert) */
  nextActionLabel?: string | null;
  progressPercent?: number | null;
  isCurrent?: boolean;
};

function paymentLabel(status?: string | null): string {
  const value = String(status || "").toUpperCase();
  if (value === "SUCCESS" || value === "PAID" || value === "PAYE") return "Payé";
  if (!value || value === "NOT_PAID" || value === "NON_PAYE") return "Non payé";
  return status || "Paiement";
}

function ProcedureCard({
  card,
  onOpen,
}: {
  card: SimultaneousProcedureCard;
  onOpen?: (id: string) => void;
}) {
  const label = card.procedureLabel
    || procedureLabelForDossier({
      visaType: card.projectType,
      destination: card.destinationCountry,
      dossierNumber: card.folderCode,
    });
  return (
    <article
      className={`flex min-w-0 flex-col rounded-xl border p-3 ${
        card.isCurrent
          ? "border-indigo-300 bg-indigo-50/80 ring-1 ring-indigo-200"
          : "border-slate-200 bg-white"
      }`}
      data-testid={card.isCurrent ? "simultaneous-procedure-current" : "simultaneous-procedure-sibling"}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={card.isCurrent ? "border-indigo-200 bg-white text-indigo-900" : "border-slate-200 bg-slate-50 text-slate-800"}>
          {card.isCurrent ? "En cours de traitement" : "Procédure parallèle"}
        </Badge>
        <Badge variant="outline" className="border-slate-200 bg-white">{label}</Badge>
      </div>
      <h4 className="mt-2 font-mono text-sm font-bold text-slate-950">{card.folderCode}</h4>
      <p className="mt-1 text-sm text-slate-700">
        {[card.destinationCountry, card.projectType].filter(Boolean).join(" · ") || "Pays / visa à préciser"}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-500">Paiement</dt>
          <dd className="mt-0.5 text-slate-800">{paymentLabel(card.paymentStatus)}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-500">Statut</dt>
          <dd className="mt-0.5 text-slate-800">{card.status || "—"}</dd>
        </div>
      </dl>
      {card.nextActionLabel ? (
        <p className="mt-3 rounded-lg bg-white/80 px-2 py-1.5 text-xs font-medium text-slate-800">
          Prochaine action : {card.nextActionLabel}
        </p>
      ) : null}
      {typeof card.progressPercent === "number" ? (
        <p className="mt-1 text-xs text-slate-500">Contrôle {card.progressPercent}%</p>
      ) : null}
      {!card.isCurrent && onOpen ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3 gap-1.5 border-indigo-300 text-indigo-900"
          onClick={() => onOpen(card.id)}
        >
          Traiter cette procédure <ArrowRightLeft className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <p className="mt-3 text-xs font-semibold text-indigo-800">Fiche ouverte — traitez ci-dessous</p>
      )}
    </article>
  );
}

/**
 * Vue simultanée travail + études (ou toute paire) : les deux procédures
 * restent visibles pendant le traitement du dossier courant.
 */
export default function AdminSimultaneousProceduresBoard({
  current,
  siblings,
  onOpen,
  handoffMessage,
}: {
  current: SimultaneousProcedureCard;
  siblings: SimultaneousProcedureCard[];
  onOpen?: (id: string) => void;
  handoffMessage?: string | null;
}) {
  if (siblings.length === 0) return null;
  return (
    <section
      className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 shadow-sm"
      data-testid="simultaneous-procedures-board"
      aria-label="Traitement simultané des procédures liées"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            <GitBranch className="h-3.5 w-3.5" />
            Traitement simultané
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-950">
            {siblings.length + 1} procédures actives pour le même client
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Chaque procédure (ex. visa travail et visa études) a son propre parcours, paiement et checklist — traitez-les en parallèle sans perdre le fil.
          </p>
        </div>
        <Badge className="border-indigo-200 bg-white text-indigo-900">{siblings.length + 1} dossiers</Badge>
      </div>
      {handoffMessage ? (
        <p className="mt-3 rounded-lg border border-indigo-100 bg-white/80 p-2 text-xs leading-5 text-indigo-950">
          {handoffMessage}
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ProcedureCard card={{ ...current, isCurrent: true }} />
        {siblings.map((sibling) => (
          <ProcedureCard key={sibling.id} card={sibling} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
