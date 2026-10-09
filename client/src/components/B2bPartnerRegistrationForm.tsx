import { useState } from "react";
import { Building2, CheckCircle2, IdCard, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export type PartnerOrganizationType = "placement_partner" | "employer";

type Props = {
  defaultOrganizationType?: PartnerOrganizationType;
  lockOrganizationType?: boolean;
  compact?: boolean;
  onSubmitted?: () => void;
};

const emptyForm = (organizationType: PartnerOrganizationType) => ({
  organizationType,
  legalName: "",
  registrationNumber: "",
  country: "",
  city: "",
  website: "",
  contactFullName: "",
  contactEmail: "",
  contactPhone: "",
  contactRole: "",
  sectors: "",
  targetMarkets: "",
  message: "",
  acknowledgeReview: false,
});

export function B2bPartnerRegistrationForm({
  defaultOrganizationType = "employer",
  lockOrganizationType = false,
  compact = false,
  onSubmitted,
}: Props) {
  const [form, setForm] = useState(() => emptyForm(defaultOrganizationType));
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const requestAccess = trpc.placementPortal.requestPartnerAccess.useMutation({
    onSuccess: (result) => {
      setSubmittedId(result.requestId || 1);
      setForm(emptyForm(defaultOrganizationType));
      toast.success("Demande d’accès enregistrée", { description: result.message });
      onSubmitted?.();
    },
    onError: (error) => toast.error("Inscription non enregistrée", { description: error.message }),
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.acknowledgeReview) {
      toast.error("Confirmation requise", { description: "Confirmez que les informations d’identification sont exactes." });
      return;
    }
    requestAccess.mutate({
      organizationType: form.organizationType,
      legalName: form.legalName,
      registrationNumber: form.registrationNumber || undefined,
      country: form.country,
      city: form.city || undefined,
      website: form.website || undefined,
      contactFullName: form.contactFullName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      contactRole: form.contactRole,
      sectors: form.sectors || undefined,
      targetMarkets: form.targetMarkets || undefined,
      message: form.message,
    });
  };

  if (submittedId) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-950" role="status">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <p className="font-black">Identification reçue — examen en cours</p>
            <p className="mt-1 text-sm leading-6 text-emerald-900">
              Votre organisation sera vérifiée manuellement par 3M TRAVEL AGENCY. Les identifiants de connexion sont remis uniquement après validation, par un canal approuvé. Aucun profil candidat n’est visible avant cette étape.
            </p>
            <Button type="button" variant="outline" className="mt-4 border-emerald-300 bg-white" onClick={() => setSubmittedId(null)}>
              Envoyer une autre demande
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" aria-labelledby="b2b-registration-title">
      <div>
        <h2 id="b2b-registration-title" className="flex items-center gap-2 text-xl font-black text-[#071b3d]">
          <IdCard className="h-5 w-5 text-indigo-700" />
          Identification à l’inscription
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Renseignez l’identité légale de votre organisation et le contact responsable. L’accès au portail n’est créé qu’après vérification humaine.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
          <Building2 className="h-4 w-4 text-indigo-700" />
          Organisation
        </legend>
        <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
          <label className="text-sm font-semibold text-slate-800">
            Type d’organisation
            <Select
              value={form.organizationType}
              onValueChange={(value) => update("organizationType", value as PartnerOrganizationType)}
              disabled={lockOrganizationType}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="placement_partner">Agence de placement</SelectItem>
                <SelectItem value="employer">Employeur international</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Raison sociale *
            <Input required maxLength={255} value={form.legalName} onChange={(event) => update("legalName", event.target.value)} className="mt-1" autoComplete="organization" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            N° d’enregistrement / licence
            <Input maxLength={120} value={form.registrationNumber} onChange={(event) => update("registrationNumber", event.target.value)} className="mt-1" placeholder="RCCM, licence, immatriculation…" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Pays d’activité *
            <Input required maxLength={120} value={form.country} onChange={(event) => update("country", event.target.value)} className="mt-1" autoComplete="country-name" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Ville
            <Input maxLength={120} value={form.city} onChange={(event) => update("city", event.target.value)} className="mt-1" autoComplete="address-level2" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Site web
            <Input maxLength={320} value={form.website} onChange={(event) => update("website", event.target.value)} className="mt-1" placeholder="https://" autoComplete="url" />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-slate-700">Contact responsable</legend>
        <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
          <label className="text-sm font-semibold text-slate-800">
            Nom complet *
            <Input required maxLength={255} value={form.contactFullName} onChange={(event) => update("contactFullName", event.target.value)} className="mt-1" autoComplete="name" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Fonction *
            <Input required maxLength={160} value={form.contactRole} onChange={(event) => update("contactRole", event.target.value)} className="mt-1" placeholder="Directeur RH, responsable placement…" autoComplete="organization-title" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            E-mail professionnel *
            <Input required type="email" maxLength={320} value={form.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} className="mt-1" autoComplete="email" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Téléphone professionnel *
            <Input required type="tel" maxLength={64} value={form.contactPhone} onChange={(event) => update("contactPhone", event.target.value)} className="mt-1" autoComplete="tel" />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-slate-700">Besoin de recrutement</legend>
        <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
          <label className="text-sm font-semibold text-slate-800">
            Secteurs / métiers ciblés
            <Input maxLength={255} value={form.sectors} onChange={(event) => update("sectors", event.target.value)} className="mt-1" placeholder="Santé, BTP, hôtellerie…" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Marchés / pays de placement
            <Input maxLength={255} value={form.targetMarkets} onChange={(event) => update("targetMarkets", event.target.value)} className="mt-1" placeholder="Canada, UE, Golfe…" />
          </label>
          <label className={`text-sm font-semibold text-slate-800 ${compact ? "" : "md:col-span-2"}`}>
            Présentation et besoins *
            <Textarea
              required
              minLength={20}
              maxLength={3000}
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              className="mt-1 min-h-28"
              placeholder="Décrivez votre activité, les volumes envisagés et le cadre réglementaire applicable."
            />
          </label>
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={form.acknowledgeReview}
          onChange={(event) => update("acknowledgeReview", event.target.checked)}
        />
        <span>
          Je confirme que les informations d’identification sont exactes et j’accepte que l’accès soit créé uniquement après vérification manuelle par 3M TRAVEL AGENCY. Aucun mot de passe n’est choisi à cette étape.
        </span>
      </label>

      <Button type="submit" disabled={requestAccess.isPending || !form.acknowledgeReview} className="min-h-11 w-full bg-indigo-700 text-white hover:bg-indigo-800">
        <Send className="mr-2 h-4 w-4" />
        {requestAccess.isPending ? "Enregistrement…" : "Soumettre mon identification"}
      </Button>
    </form>
  );
}
