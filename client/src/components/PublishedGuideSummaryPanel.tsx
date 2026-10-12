import { BookOpen, ExternalLink, FileText, ListOrdered } from "lucide-react";

export type PublishedGuideSummaryPanelProps = {
  headline?: string | null;
  overview?: string | null;
  stepHighlights?: string[] | null;
  programLabel?: string | null;
  pdfUrl?: string | null;
  pdfTitle?: string | null;
  officialPortalUrl?: string | null;
  officialPortalLabel?: string | null;
  tone?: "admin" | "client" | "public";
  testId?: string;
};

/** Panneau résumé du guide PDF publié — même structure admin / client / public. */
export function PublishedGuideSummaryPanel({
  headline,
  overview,
  stepHighlights,
  programLabel,
  pdfUrl,
  pdfTitle,
  officialPortalUrl,
  officialPortalLabel,
  tone = "public",
  testId = "published-guide-summary",
}: PublishedGuideSummaryPanelProps) {
  if (!overview && !stepHighlights?.length && !pdfUrl) return null;

  const shell =
    tone === "admin"
      ? "rounded-xl border border-slate-200 bg-slate-50/80 p-3"
      : tone === "client"
        ? "rounded-xl border border-white/20 bg-white/10 p-3 text-blue-50"
        : "rounded-xl border border-blue-100 bg-blue-50/50 p-3";

  const titleClass =
    tone === "client" ? "text-xs font-black uppercase tracking-[0.12em] text-amber-200" : "text-xs font-black uppercase tracking-[0.12em] text-blue-800";
  const bodyClass = tone === "client" ? "text-sm leading-6 text-blue-50" : "text-sm leading-6 text-slate-700";
  const chipClass =
    tone === "client"
      ? "rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white"
      : "rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200";

  return (
    <aside className={shell} data-testid={testId} aria-label="Résumé du guide de procédure publié">
      <p className={`flex items-center gap-1.5 ${titleClass}`}>
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        Résumé du guide PDF
        {headline ? ` · ${headline}` : ""}
      </p>
      {programLabel ? (
        <p className={`mt-1 text-xs font-semibold ${tone === "client" ? "text-white" : "text-slate-900"}`}>
          {programLabel}
        </p>
      ) : null}
      {overview ? <p className={`mt-2 ${bodyClass}`}>{overview}</p> : null}
      {stepHighlights && stepHighlights.length > 0 ? (
        <div className="mt-3">
          <p className={`mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide ${tone === "client" ? "text-blue-200" : "text-slate-500"}`}>
            <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
            Étapes clés du PDF
          </p>
          <ol className="flex flex-wrap gap-1.5">
            {stepHighlights.map((step, index) => (
              <li key={`${index}-${step}`} className={chipClass}>
                {index + 1}. {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className={
              tone === "client"
                ? "inline-flex items-center gap-1 text-amber-200 underline underline-offset-2 hover:text-white"
                : "inline-flex items-center gap-1 text-blue-800 underline underline-offset-2"
            }
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            {pdfTitle ? `Ouvrir « ${pdfTitle} »` : "Ouvrir le PDF publié"}
          </a>
        ) : null}
        {officialPortalUrl ? (
          <a
            href={officialPortalUrl}
            target="_blank"
            rel="noreferrer"
            className={
              tone === "client"
                ? "inline-flex items-center gap-1 text-sky-200 underline underline-offset-2 hover:text-white"
                : "inline-flex items-center gap-1 text-emerald-800 underline underline-offset-2"
            }
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            {officialPortalLabel || "Portail officiel"}
          </a>
        ) : null}
      </div>
    </aside>
  );
}
