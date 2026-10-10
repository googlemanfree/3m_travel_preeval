import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Info, Sparkles, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getCandidateToken } from "@/hooks/useCandidateAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { SELECTABLE_STAGE_COPY } from "@shared/talentCorridor";
import { clientSpacePolling } from "@/lib/clientSpaceSync";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Parcours « profil sélectionnable » — badge + checklist pour l’espace candidat.
 */
export function SelectableProfileCard() {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "fr";
  const candidateToken = useMemo(() => getCandidateToken(), []);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const statusQuery = trpc.placementPortal.getMySelectableStatus.useQuery(
    { candidateToken: candidateToken ?? "" },
    { enabled: Boolean(candidateToken), retry: false, ...clientSpacePolling() },
  );

  if (!candidateToken || statusQuery.isLoading) return null;
  if (statusQuery.error || !statusQuery.data) return null;

  const { stage, checklist, opportunity } = statusQuery.data;
  const copy = SELECTABLE_STAGE_COPY[stage][lang];
  const opportunityLabel = opportunity?.postSelectionLabel
    ? (lang === "en" ? opportunity.postSelectionLabel.en : opportunity.postSelectionLabel.fr)
    : null;
  const items = [
    {
      ok: checklist.evaluationValidated,
      fr: "Évaluation validée par 3M",
      en: "Assessment validated by 3M",
    },
    {
      ok: checklist.destinationSet,
      fr: "Destination / projet renseigné",
      en: "Destination / project set",
    },
    {
      ok: checklist.identityComplete,
      fr: "Identité de base complète",
      en: "Basic identity complete",
    },
    {
      ok: checklist.consentGranted,
      fr: "Consentement au partage anonymisé",
      en: "Consent to anonymised sharing",
    },
  ];
  const tone = stage === "selectable" || stage === "shared"
    ? "border-emerald-200 bg-emerald-50/60"
    : stage === "awaiting_consent"
      ? "border-amber-200 bg-amber-50/60"
      : "border-slate-200 bg-slate-50/80";

  return (
    <Card className={tone} aria-label={lang === "en" ? "Selectable profile status" : "Statut de profil sélectionnable"} data-testid="selectable-profile-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base text-slate-950">
            <Target className="h-5 w-5 text-indigo-700" />
            {lang === "en" ? "International selection readiness" : "Prêt pour la sélection internationale"}
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={() => setDetailsOpen(true)} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" aria-label={lang === "en" ? "Open profile preparation steps" : "Ouvrir les prochaines étapes du profil"}>
              <Badge tabIndex={0} className={`cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${stage === "selectable" || stage === "shared" ? "bg-emerald-700 text-white" : "bg-slate-800 text-white"}`}>
                <Sparkles className="mr-1 h-3 w-3" />
                {copy.badge}
                <Info className="ml-1 h-3 w-3 opacity-80" aria-hidden="true" />
              </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-sm leading-5">
              {lang === "en"
                ? "This badge reflects the current readiness of your anonymised professional profile. 3M validates the assessment, destination, identity and consent before sharing a profile with a verified organisation."
                : "Ce badge indique l’état actuel de préparation de votre profil professionnel anonymisé. 3M vérifie l’évaluation, la destination, l’identité et votre consentement avant tout partage avec une organisation vérifiée."}
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>{copy.hint}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.fr} className="flex items-center gap-2 text-sm text-slate-800">
              {item.ok
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                : <Circle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />}
              <span className={item.ok ? "font-medium" : "text-slate-600"}>{lang === "en" ? item.en : item.fr}</span>
            </li>
          ))}
        </ul>
        {(stage === "selectable" || stage === "shared") && (
          <p className="mt-3 text-xs leading-5 text-emerald-900">
            {lang === "en"
              ? "Agencies and employers only see anonymised profiles prepared by 3M after verification. No direct contact is shared."
              : "Les agences et employeurs ne voient que des profils anonymisés préparés par 3M après vérification. Aucun contact direct n’est partagé."}
          </p>
        )}
        {opportunity && (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3" data-testid="selectable-opportunity-live">
            <p className="text-xs font-black uppercase tracking-wide text-indigo-800">
              {lang === "en" ? "Live opportunity status" : "Statut opportunité (temps réel)"}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {opportunityLabel || opportunity.status}
              {opportunity.profileCode ? ` · ${opportunity.profileCode}` : ""}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {[opportunity.organizationName, opportunity.targetDestination, opportunity.targetProcedure].filter(Boolean).join(" · ")
                || (lang === "en" ? "Updated by the 3M team." : "Mis à jour par l’équipe 3M.")}
            </p>
            {opportunity.postSelectionLabel?.hint && (
              <p className="mt-2 text-xs leading-5 text-indigo-900">{opportunity.postSelectionLabel.hint}</p>
            )}
          </div>
        )}
      </CardContent>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{lang === "en" ? "Next steps for your international profile" : "Prochaines étapes de votre profil international"}</DialogTitle>
            <DialogDescription>{lang === "en" ? "Your profile remains under your control. Complete the missing items below so 3M can review it safely." : "Votre profil reste sous votre contrôle. Complétez les éléments ci-dessous afin que 3M puisse l’examiner en toute sécurité."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-700">
            <ol className="list-decimal space-y-2 pl-5">
              <li className={checklist.evaluationValidated ? "text-emerald-700" : "font-semibold text-amber-800"}>{checklist.evaluationValidated ? (lang === "en" ? "Assessment validated by 3M." : "Évaluation validée par 3M.") : (lang === "en" ? "Finish or submit assessment details for verification." : "Terminer ou transmettre les informations d’évaluation pour vérification.")}</li>
              <li className={checklist.destinationSet ? "text-emerald-700" : "font-semibold text-amber-800"}>{checklist.destinationSet ? (lang === "en" ? "Destination and project recorded." : "Destination et projet enregistrés.") : (lang === "en" ? "Specify the target destination and professional project." : "Préciser la destination et le projet professionnel visé.")}</li>
              <li className={checklist.identityComplete ? "text-emerald-700" : "font-semibold text-amber-800"}>{checklist.identityComplete ? (lang === "en" ? "Basic identity details complete." : "Informations d’identité de base complètes.") : (lang === "en" ? "Complete the identity details requested in your space." : "Compléter les informations d’identité demandées dans votre espace.")}</li>
              <li className={checklist.consentGranted ? "text-emerald-700" : "font-semibold text-amber-800"}>{checklist.consentGranted ? (lang === "en" ? "Anonymised sharing consent is active." : "Consentement au partage anonymisé actif.") : (lang === "en" ? "Read and confirm consent before any sharing." : "Lire et confirmer le consentement avant tout partage.")}</li>
            </ol>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 leading-6">
              <strong>{lang === "en" ? "Preparation tip:" : "Conseil de préparation :"}</strong>{" "}
              {lang === "en"
                ? "Keep your professional information consistent, check dates, and never send sensitive documents through an unapproved channel. Partner organisations only receive an anonymised profile after human review."
                : "gardez vos informations professionnelles cohérentes, vérifiez les dates et ne transmettez jamais de document sensible par un canal non approuvé. Les organisations partenaires ne reçoivent qu’un profil anonymisé après contrôle humain."}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
