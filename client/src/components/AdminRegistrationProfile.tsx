import React, { useMemo, useState } from "react";
import { Download, FileText, Loader2, Mail, Send } from "lucide-react";
import CountryFlag from "@/components/CountryFlag";
import { Button } from "@/components/ui/button";
import { getCandidateDestinationOption } from "@shared/candidateDestinationOptions";
import { buildRegistrationInfoRequest, registrationProfileDownloadText } from "@shared/registrationInfoRequest";
import { evaluationRequiresCv } from "@shared/evaluationVisaCv";

export type RegistrationProfile = {
  preferredDestinations?: string[] | null;
  visaType?: string | null;
  educationLevel?: string | null;
  employmentStatus?: string | null;
  languageLevel?: string | null;
  nationality?: string | null;
};

type CvDocument = {
  fileName?: string | null;
  documentUrl?: string | null;
} | null;

type Props = {
  profile?: RegistrationProfile | null;
  fullName?: string | null;
  email?: string | null;
  cvDocument?: CvDocument;
  hasCv?: boolean;
  infoRequestAlreadySent?: boolean;
  onRequestInfo?: (payload: { destination: string; visaType: string }) => void;
  isRequestingInfo?: boolean;
};

/** Ce que le candidat a déclaré à l'inscription, tel que l'équipe doit le voir dans le back-office. */
export default function AdminRegistrationProfile({
  profile,
  fullName,
  email,
  cvDocument,
  hasCv = false,
  infoRequestAlreadySent = false,
  onRequestInfo,
  isRequestingInfo = false,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  if (!profile) return null;

  const destinations = profile.preferredDestinations ?? [];
  const primaryDestination = destinations[0] || "";
  const visaType = profile.visaType || "";
  const cvRequired = evaluationRequiresCv(visaType, visaType);
  const effectiveHasCv = hasCv || Boolean(cvDocument?.documentUrl);

  const infoRequest = useMemo(
    () =>
      buildRegistrationInfoRequest({
        destination: primaryDestination || null,
        visaType: visaType || null,
        hasCv: effectiveHasCv,
      }),
    [primaryDestination, visaType, effectiveHasCv],
  );

  const rows: Array<[string, string | null | undefined]> = [
    ["Type de projet", profile.visaType],
    ["Niveau d’études", profile.educationLevel],
    ["Situation professionnelle", profile.employmentStatus],
    ["Niveau de langue", profile.languageLevel],
    ["Nationalité", profile.nationality],
  ];

  const downloadProfile = () => {
    const text = registrationProfileDownloadText({
      fullName,
      email,
      preferredDestinations: destinations,
      visaType: profile.visaType,
      educationLevel: profile.educationLevel,
      employmentStatus: profile.employmentStatus,
      languageLevel: profile.languageLevel,
      nationality: profile.nationality,
    });
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    const safeName = String(fullName || "candidat").replace(/[^\w.-]+/g, "_").slice(0, 40);
    anchor.href = url;
    anchor.download = `projet-inscription-${safeName}-${stamp}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = 18;
    const write = (line: string, bold = false) => {
      if (y > 280) {
        doc.addPage();
        y = 18;
      }
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(bold ? 12 : 10);
      const lines = doc.splitTextToSize(line, 180) as string[];
      doc.text(lines, 15, y);
      y += lines.length * 6 + (bold ? 2 : 0);
    };
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("3M TRAVEL AGENCY — Projet à l’inscription", 15, 14);
    doc.setTextColor(15, 23, 42);
    y = 32;
    write(`Candidat : ${fullName || "—"}`, true);
    write(`E-mail : ${email || "—"}`);
    write(`Généré le ${new Date().toLocaleString("fr-FR")}`);
    y += 4;
    write("Destinations", true);
    if (!destinations.length) write("Aucune destination précise déclarée.");
    destinations.forEach((name, index) => write(`${index + 1}. ${name}${index === 0 ? " (principale)" : ""}`));
    y += 2;
    rows.forEach(([label, value]) => write(`${label} : ${value || "Non renseigné"}`));
    y += 4;
    write("Informations à demander (pays + visa)", true);
    infoRequest.items.slice(0, 10).forEach((item) => write(`• ${item.label}${item.priority === "required" ? " [prioritaire]" : ""}`));
    const stamp = new Date().toISOString().slice(0, 10);
    const safeName = String(fullName || "candidat").replace(/[^\w.-]+/g, "_").slice(0, 40);
    doc.save(`projet-inscription-${safeName}-${stamp}.pdf`);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-sm" aria-labelledby="registration-profile-title" data-testid="admin-registration-profile">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p id="registration-profile-title" className="text-xs font-bold uppercase tracking-wider text-blue-800">Projet déclaré à l’inscription</p>
            <p className="mt-1 text-sm text-slate-600">Synthèse téléchargeable pour le conseiller, puis demande d’infos adaptée au pays et au visa.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={downloadProfile} data-testid="registration-download-txt">
              <Download className="mr-1.5 h-3.5 w-3.5" />TXT
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void downloadPdf()} data-testid="registration-download-pdf">
              <FileText className="mr-1.5 h-3.5 w-3.5" />PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Destinations{destinations.length > 1 ? " (la première est la principale)" : ""}</p>
          {destinations.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">Aucune destination précise déclarée.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2" aria-label="Destinations déclarées">
              {destinations.map((name, index) => {
                const option = getCandidateDestinationOption(name);
                return (
                  <li key={name} className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-950">
                    {option && <CountryFlag flag={option.flag} />}
                    {option?.name ?? name}
                    {index === 0 && <span className="rounded-full bg-blue-700 px-1.5 text-[10px] font-black uppercase leading-4 text-white">Principale</span>}
                    {option && !option.hasGuide && <span className="text-[10px] font-medium text-amber-700">sans guide</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">{value || <span className="font-normal text-slate-400">Non renseigné</span>}</dd>
            </div>
          ))}
        </dl>

        <div className={`rounded-xl border px-3 py-3 text-sm ${effectiveHasCv ? "border-emerald-200 bg-emerald-50 text-emerald-950" : cvRequired ? "border-amber-200 bg-amber-50 text-amber-950" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
          <p className="font-semibold">{effectiveHasCv ? "CV disponible pour l’évaluation" : cvRequired ? "CV manquant — obligatoire pour visa travail" : "CV non requis pour ce type de visa"}</p>
          <p className="mt-1 text-xs leading-5">
            {effectiveHasCv
              ? "Le conseiller peut ouvrir le CV depuis la fiche documents / évaluation."
              : cvRequired
                ? "Relancez le client pour qu’il dépose son CV avant de finaliser le bilan."
                : "L’évaluation peut se faire intelligemment à partir du formulaire et des pièces demandées pour ce visa."}
          </p>
          {cvDocument?.documentUrl && (
            <a href={cvDocument.documentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-800 underline">
              <FileText className="h-3.5 w-3.5" />{cvDocument.fileName || "Ouvrir le CV"}
            </a>
          )}
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-indigo-950">Demande d’informations — {infoRequest.destination} · {infoRequest.visaType}</p>
              <p className="mt-1 text-xs leading-5 text-indigo-900">
                {infoRequestAlreadySent
                  ? "Une demande standard a déjà été envoyée (e-mail + espace client). Vous pouvez la renvoyer si besoin."
                  : "Envoi automatique possible : e-mail + notification dans l’espace candidat, selon le pays et le type de visa."}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" className="border-indigo-200 bg-white" onClick={() => setPreviewOpen((open) => !open)}>
              {previewOpen ? "Masquer la liste" : `Voir ${infoRequest.items.length} élément(s)`}
            </Button>
          </div>
          {previewOpen && (
            <ul className="mt-3 space-y-2 text-xs text-indigo-950">
              {infoRequest.items.map((item) => (
                <li key={item.label} className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                  <strong>{item.label}</strong>
                  {item.priority === "required" && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">Prioritaire</span>}
                  <p className="mt-0.5 text-slate-600">{item.detail}</p>
                </li>
              ))}
            </ul>
          )}
          {onRequestInfo && (
            <Button
              type="button"
              className="mt-3 w-full bg-indigo-700 hover:bg-indigo-800"
              disabled={isRequestingInfo || !primaryDestination || !visaType}
              onClick={() => onRequestInfo({ destination: primaryDestination, visaType })}
              data-testid="registration-request-info"
            >
              {isRequestingInfo ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi…</> : <><Send className="mr-2 h-4 w-4" /><Mail className="mr-2 h-4 w-4" />{infoRequestAlreadySent ? "Renvoyer la demande (mail + espace)" : "Envoyer la demande (mail + espace)"}</>}
            </Button>
          )}
          {(!primaryDestination || !visaType) && (
            <p className="mt-2 text-xs text-amber-800">Renseignez une destination et un type de projet pour activer l’envoi.</p>
          )}
        </div>
      </div>
    </section>
  );
}
