import { useMemo } from "react";
import { CheckCircle2, Circle, Sparkles, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getCandidateToken } from "@/hooks/useCandidateAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { SELECTABLE_STAGE_COPY } from "@shared/talentCorridor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Parcours « profil sélectionnable » — badge + checklist pour l’espace candidat.
 */
export function SelectableProfileCard() {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "fr";
  const candidateToken = useMemo(() => getCandidateToken(), []);
  const statusQuery = trpc.placementPortal.getMySelectableStatus.useQuery(
    { candidateToken: candidateToken ?? "" },
    { enabled: Boolean(candidateToken), retry: false, staleTime: 60_000, refetchOnWindowFocus: false },
  );

  if (!candidateToken || statusQuery.isLoading) return null;
  if (statusQuery.error || !statusQuery.data) return null;

  const { stage, checklist } = statusQuery.data;
  const copy = SELECTABLE_STAGE_COPY[stage][lang];
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
          <Badge className={stage === "selectable" || stage === "shared" ? "bg-emerald-700 text-white" : "bg-slate-800 text-white"}>
            <Sparkles className="mr-1 h-3 w-3" />
            {copy.badge}
          </Badge>
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
      </CardContent>
    </Card>
  );
}
