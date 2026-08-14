import { useEffect, useState } from "react";
import { Loader2, Save, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import CandidateAvatar from "@/components/CandidateAvatar";

const destinationOptions = [
  { value: "canada", label: "Canada" },
  { value: "luxembourg", label: "Luxembourg" },
  { value: "pologne", label: "Pologne" },
  { value: "europe", label: "Europe / Schengen" },
  { value: "golfe", label: "Golfe et Moyen-Orient" },
  { value: "autre", label: "Autre destination" },
] as const;

type ProfileForm = {
  fullName: string;
  phone: string;
  nationality: string;
  dateOfBirth: string;
  destination: (typeof destinationOptions)[number]["value"];
  visaType: string;
  educationLevel: string;
  employmentStatus: string;
  languageLevel: string;
};

export default function ClientProfilePanel() {
  const { candidate, isAuthenticated } = useCandidateAuth();
  const utils = trpc.useUtils();
  const profileQuery = trpc.candidate.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 1,
  });
  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    phone: "",
    nationality: "",
    dateOfBirth: "",
    destination: "autre",
    visaType: "",
    educationLevel: "",
    employmentStatus: "",
    languageLevel: "",
  });

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setForm({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
      nationality: profile.nationality ?? "",
      dateOfBirth: profile.dateOfBirth ?? "",
      destination: destinationOptions.some((option) => option.value === profile.destination)
        ? profile.destination as ProfileForm["destination"]
        : "autre",
      visaType: profile.visaType ?? "",
      educationLevel: profile.educationLevel ?? "",
      employmentStatus: profile.employmentStatus ?? "",
      languageLevel: profile.languageLevel ?? "",
    });
  }, [profileQuery.data]);

  const updateMutation = trpc.candidate.updateProfile.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.candidate.getProfile.invalidate(),
        utils.candidate.getMyDossierData.invalidate(),
      ]);
      toast.success("Votre profil a été mis à jour.");
    },
    onError: (error) => toast.error(error.message || "Impossible de mettre à jour le profil."),
  });

  const update = (field: keyof ProfileForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.fullName.trim().length < 2) {
      toast.error("Veuillez renseigner votre nom complet.");
      return;
    }
    updateMutation.mutate(form);
  };

  if (profileQuery.isLoading) {
    return <Card className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Chargement de votre profil…</Card>;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <Card className="p-6 text-sm text-red-700">Votre profil n’est pas disponible pour le moment. Veuillez actualiser la page.</Card>;
  }

  return (
    <Card className="border-blue-100 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="client-profile-title">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
        <CandidateAvatar
          fullName={candidate?.fullName || form.fullName || "Candidat"}
          avatarUrl={profileQuery.data.avatarUrl}
          email={profileQuery.data.email}
          size="lg"
          editable
        />
        <div>
          <h2 id="client-profile-title" className="flex items-center gap-2 text-lg font-black text-slate-900"><UserRound className="h-5 w-5 text-blue-700" /> Mon profil</h2>
          <p className="mt-1 text-sm text-slate-600">Ces informations servent à préparer et suivre votre dossier.</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">E-mail de connexion : {profileQuery.data.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="client-full-name">Nom complet</Label><Input id="client-full-name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="client-phone">Téléphone</Label><Input id="client-phone" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+237 …" /></div>
          <div className="space-y-2"><Label htmlFor="client-nationality">Nationalité</Label><Input id="client-nationality" value={form.nationality} onChange={(event) => update("nationality", event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="client-birth-date">Date de naissance</Label><Input id="client-birth-date" type="date" value={form.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="client-visa-type">Type de visa souhaité</Label><Input id="client-visa-type" value={form.visaType} onChange={(event) => update("visaType", event.target.value)} placeholder="Études, travail, tourisme…" /></div>
          <div className="space-y-2"><Label htmlFor="client-education">Niveau d’études</Label><Input id="client-education" value={form.educationLevel} onChange={(event) => update("educationLevel", event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="client-employment">Situation professionnelle</Label><Input id="client-employment" value={form.employmentStatus} onChange={(event) => update("employmentStatus", event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="client-language">Niveau de langue</Label><Input id="client-language" value={form.languageLevel} onChange={(event) => update("languageLevel", event.target.value)} placeholder="IELTS 7, DELF B2…" /></div>
        </div>
        <div className="space-y-2 sm:max-w-md"><Label>Destination principale</Label><Select value={form.destination} onValueChange={(value) => update("destination", value)}><SelectTrigger><SelectValue placeholder="Choisir une destination" /></SelectTrigger><SelectContent>{destinationOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
        <Button type="submit" disabled={updateMutation.isPending} className="h-11 rounded-xl bg-blue-700 px-5 hover:bg-blue-800"><Save className="mr-2 h-4 w-4" />{updateMutation.isPending ? "Enregistrement…" : "Enregistrer mon profil"}</Button>
      </form>
    </Card>
  );
}
