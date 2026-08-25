import { useMemo } from "react";
import { BriefcaseBusiness, CheckCircle2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getCandidateToken } from "@/hooks/useCandidateAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function PlacementConsentCard() {
  const candidateToken = useMemo(() => getCandidateToken(), []);
  const consentQuery = trpc.placementPortal.getMyConsent.useQuery(
    { candidateToken: candidateToken ?? "" },
    { enabled: Boolean(candidateToken) },
  );
  const utils = trpc.useUtils();
  const updateMutation = trpc.placementPortal.setMyConsent.useMutation({
    onSuccess: async ({ status }) => {
      toast.success(status === "granted" ? "Votre accord est enregistré." : "Le partage de profil est retiré.");
      await utils.placementPortal.getMyConsent.invalidate();
    },
    onError: (error) => toast.error("Mise à jour impossible", { description: error.message }),
  });

  const granted = consentQuery.data?.status === "granted";
  return (
    <Card className="border-violet-200 bg-violet-50/50" aria-label="Consentement au partage de profil de placement">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-violet-950"><BriefcaseBusiness className="h-5 w-5 text-violet-700" />Opportunités de placement</CardTitle>
        <CardDescription>Vous gardez le contrôle du partage de votre profil professionnel.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6 text-slate-700">Avec votre accord, l’agence peut préparer un profil professionnel <strong>anonymisé</strong> et le soumettre seulement à des partenaires ou employeurs vérifiés. Aucun CV brut, numéro, adresse, e-mail ou document d’identité n’est affiché dans leur portail.</p>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-200 bg-white p-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-violet-950"><ShieldCheck className="h-4 w-4 text-violet-700" />{granted ? "Partage autorisé" : "Partage non autorisé"}</span>
          <Button type="button" variant={granted ? "outline" : "default"} disabled={!candidateToken || updateMutation.isPending || consentQuery.isLoading} onClick={() => updateMutation.mutate({ candidateToken: candidateToken!, consented: !granted })} className={granted ? "border-violet-300 text-violet-800" : "bg-violet-700 hover:bg-violet-800"}>
            {updateMutation.isPending ? "Mise à jour…" : granted ? "Retirer mon accord" : "Autoriser le partage anonymisé"}
          </Button>
        </div>
        {granted && <p className="flex items-center gap-2 text-xs font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4" />Vous pouvez retirer cet accord à tout moment. L’agence vérifiera tout retour d’employeur avant de vous contacter.</p>}
      </CardContent>
    </Card>
  );
}
