import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RISK_LEVEL_LABELS, type ClientReport, type DocumentStatus, type SuggestedStatus } from "@shared/evaluationValidation";

const STATUS_TONE: Record<SuggestedStatus, string> = {
  tres_favorable: "bg-emerald-100 text-emerald-900",
  favorable: "bg-green-100 text-green-900",
  moderement_favorable: "bg-amber-100 text-amber-900",
  a_renforcer: "bg-orange-100 text-orange-900",
  preparation_recommandee: "bg-slate-200 text-slate-900",
};

const DOCUMENT_TONE: Record<DocumentStatus, string> = {
  recu: "bg-emerald-100 text-emerald-900",
  a_fournir: "bg-amber-100 text-amber-900",
  a_mettre_a_jour: "bg-orange-100 text-orange-900",
  a_verifier: "bg-blue-100 text-blue-900",
};

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value.length <= 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR", { dateStyle: "long", timeZone: "UTC" });
}

/**
 * Rapport d'évaluation VALIDÉ par un administrateur. Le même composant sert au candidat (rapport publié)
 * et à l'aperçu administrateur : ce que l'administrateur relit est exactement ce que voit le candidat.
 */
export default function EvaluationReportView({ report, headingId = "evaluation-report-title" }: { report: ClientReport; headingId?: string }) {
  const validatedOn = formatDate(report.validatedAt);
  const validUntil = formatDate(report.validUntil);
  return (
    <article className="space-y-5" aria-labelledby={headingId}>
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Évaluation validée par 3M Travel &amp; Services</p>
        <h2 id={headingId} className="mt-1 text-2xl font-black text-slate-950">Votre évaluation professionnelle</h2>
        <p className="mt-1 text-sm text-slate-600">
          {report.candidateName} · pays prioritaire : <strong>{report.priorityCountry}</strong>
          {validatedOn ? ` · validée le ${validatedOn}` : ""}
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-4">
          <p className="text-5xl font-black text-[#0B2A52]" aria-label={`Score validé : ${report.score} sur ${report.scoreMax}`}>
            {report.score}
            <span className="text-2xl font-bold text-slate-500">/{report.scoreMax}</span>
          </p>
          <Badge className={STATUS_TONE[report.status]}>{report.statusLabel}</Badge>
          {report.riskLevel && <Badge className="bg-slate-100 text-slate-800">Niveau de risque : {RISK_LEVEL_LABELS[report.riskLevel]}</Badge>}
        </div>
        {report.route && (
          <p className="mt-4 text-sm text-slate-800">
            Voie principale recommandée : <strong>{report.route.label}</strong>
          </p>
        )}
        <ul className="mt-5 grid gap-2 sm:grid-cols-2" aria-label="Détail du score par critère">
          {report.scoreBreakdown.map((criterion) => (
            <li key={criterion.key} className="text-xs text-slate-700">
              <div className="flex justify-between gap-2">
                <span>{criterion.label}</span>
                <span className="font-semibold">
                  {criterion.score}/{criterion.max}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-200" aria-hidden="true">
                <div className="h-full rounded bg-[#0B2A52]" style={{ width: `${criterion.max ? Math.round((criterion.score / criterion.max) * 100) : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {report.profileSummary && (
        <Card className="p-5">
          <h3 className="text-base font-bold text-slate-950">Analyse de votre projet</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{report.profileSummary}</p>
        </Card>
      )}

      {(report.strengths.length > 0 || report.improvements.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {report.strengths.length > 0 && (
            <Card className="p-5">
              <h3 className="text-base font-bold text-emerald-900">Atouts</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {report.strengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </Card>
          )}
          {report.improvements.length > 0 && (
            <Card className="p-5">
              <h3 className="text-base font-bold text-amber-900">Points à renforcer</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {report.improvements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {report.actionPlan.length > 0 && (
        <Card className="p-5">
          <h3 className="text-base font-bold text-slate-950">Prochaines étapes recommandées</h3>
          <ol className="mt-2 space-y-3 text-sm text-slate-700">
            {report.actionPlan.map((step, index) => (
              <li key={index} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">
                  {index + 1}. {step.title}
                  {step.horizon ? <span className="ml-2 text-xs font-normal text-slate-500">({step.horizon})</span> : null}
                </p>
                {step.detail && <p className="mt-1 text-xs leading-5 text-slate-600">{step.detail}</p>}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {report.documents.length > 0 && (
        <Card className="p-5">
          <h3 className="text-base font-bold text-slate-950">Documents</h3>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {report.documents.map((document, index) => (
              <li key={index} className="flex items-center justify-between gap-3 py-2">
                <span className="text-slate-800">{document.label}</span>
                <Badge className={DOCUMENT_TONE[document.status]}>{document.statusLabel}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {report.alternatives.length > 0 && (
        <Card className="p-5">
          <h3 className="text-base font-bold text-slate-950">Pistes complémentaires à étudier</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {report.alternatives.map((alternative, index) => (
              <li key={index}>
                <strong>{alternative.country}</strong>
                {alternative.rationale ? ` — ${alternative.rationale}` : ""}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(report.remarks || validUntil) && (
        <Card className="p-5">
          {report.remarks && <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{report.remarks}</p>}
          {validUntil && <p className="mt-2 text-xs text-slate-500">Évaluation valable jusqu’au {validUntil}.</p>}
        </Card>
      )}

      <p className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-xs leading-5 text-slate-600" role="note">
        {report.legalDisclaimer}
      </p>
    </article>
  );
}
