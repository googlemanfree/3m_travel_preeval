import { FormEvent, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { MessageCircle, Plus, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Traveler = { fullName: string; dateOfBirth: string; nationality: string; passportNumber: string };
const blankTraveler = (): Traveler => ({ fullName: "", dateOfBirth: "", nationality: "", passportNumber: "" });

export default function AssuranceInscription() {
  const [extraTravelers, setExtraTravelers] = useState<Traveler[]>([]);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const whatsappWindow = useRef<Window | null>(null);
  const createRequest = trpc.insuranceRequests.create.useMutation({
    onSuccess: ({ reference, whatsappMessage }) => {
      setSubmittedReference(reference);
      const whatsappUrl = `https://wa.me/237698104832?text=${encodeURIComponent(whatsappMessage)}`;
      if (whatsappWindow.current && !whatsappWindow.current.closed) whatsappWindow.current.location.href = whatsappUrl;
      else window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      toast.success("Votre demande d’assurance a été envoyée à notre équipe.");
    },
    onError: error => {
      if (whatsappWindow.current && !whatsappWindow.current.closed) whatsappWindow.current.close();
      toast.error(error.message || "Impossible d’envoyer la demande d’assurance.");
    },
  });

  const updateExtraTraveler = (index: number, field: keyof Traveler, value: string) => {
    setExtraTravelers(current => current.map((traveler, travelerIndex) => travelerIndex === index ? { ...traveler, [field]: value } : traveler));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const primaryTraveler: Traveler = {
      fullName: String(form.get("fullName") || ""),
      dateOfBirth: String(form.get("dateOfBirth") || ""),
      nationality: String(form.get("nationality") || ""),
      passportNumber: String(form.get("passportNumber") || ""),
    };
    if (form.get("acceptedConsent") !== "on") {
      toast.error("Votre consentement est requis pour transmettre la demande.");
      return;
    }
    whatsappWindow.current = window.open("about:blank", "_blank");
    createRequest.mutate({
      fullName: primaryTraveler.fullName,
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      dateOfBirth: primaryTraveler.dateOfBirth,
      nationality: primaryTraveler.nationality,
      passportNumber: primaryTraveler.passportNumber,
      residenceCountry: String(form.get("residenceCountry") || ""),
      destinationCountry: String(form.get("destinationCountry") || ""),
      departureDate: String(form.get("departureDate") || ""),
      returnDate: String(form.get("returnDate") || ""),
      tripPurpose: String(form.get("tripPurpose") || ""),
      coveragePlan: String(form.get("coveragePlan") || ""),
      travelers: [primaryTraveler, ...extraTravelers],
      emergencyContactName: String(form.get("emergencyContactName") || ""),
      emergencyContactPhone: String(form.get("emergencyContactPhone") || ""),
      notes: String(form.get("notes") || "") || undefined,
      acceptedConsent: true,
    });
  };

  if (submittedReference) {
    return <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-24"><Card className="mx-auto max-w-xl p-8 text-center shadow-xl"><Shield className="mx-auto mb-4 h-12 w-12 text-green-600" /><h1 className="text-2xl font-bold text-gray-900">Demande transmise</h1><p className="mt-3 text-gray-600">Votre référence est <strong>{submittedReference}</strong>. Notre équipe reçoit votre dossier et le récapitulatif WhatsApp a été préparé.</p><Link href="/assurance"><Button className="mt-6">Retour à l’assurance voyage</Button></Link></Card></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-16 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
        <div className="mb-8 text-center"><span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700"><Shield className="h-4 w-4" /> Demande d’assurance voyage</span><h1 className="mt-4 text-4xl font-bold text-gray-900">Préparez votre assurance voyage</h1><p className="mt-3 text-gray-600">Complétez les informations nécessaires. La demande est transmise à 3M Travel ; un récapitulatif WhatsApp sans numéro de passeport est ensuite ouvert pour l’agence.</p></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6"><h2 className="text-xl font-bold text-gray-900">1. Voyageur principal</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Nom complet" name="fullName" required /><Field label="E-mail" name="email" type="email" required /><Field label="Téléphone WhatsApp" name="phone" type="tel" required /><Field label="Date de naissance" name="dateOfBirth" type="date" required /><Field label="Nationalité" name="nationality" required /><Field label="Numéro de passeport" name="passportNumber" required /><Field label="Pays de résidence" name="residenceCountry" required /></div></Card>
          <Card className="p-6"><h2 className="text-xl font-bold text-gray-900">2. Informations de voyage</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Pays de destination" name="destinationCountry" required /><Field label="Motif du voyage" name="tripPurpose" required placeholder="Tourisme, études, affaires…" /><Field label="Date de départ" name="departureDate" type="date" required /><Field label="Date de retour" name="returnDate" type="date" required /><div className="md:col-span-2"><Label htmlFor="coveragePlan">Formule souhaitée</Label><select id="coveragePlan" name="coveragePlan" required className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Choisir une formule</option><option>Visa Schengen / couverture 30 000 €</option><option>Voyage international standard</option><option>Études et long séjour</option><option>Sur mesure — à étudier</option></select></div></div></Card>
          <Card className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-gray-900">3. Autres voyageurs</h2><p className="text-sm text-gray-600">Ajoutez les personnes supplémentaires à assurer, le cas échéant.</p></div><Button type="button" variant="outline" onClick={() => setExtraTravelers(current => [...current, blankTraveler()])}><Plus className="mr-2 h-4 w-4" />Ajouter</Button></div>{extraTravelers.map((traveler, index) => <div key={index} className="mt-5 rounded-lg border bg-gray-50 p-4"><div className="mb-3 flex items-center justify-between"><p className="font-semibold">Voyageur {index + 2}</p><Button type="button" variant="ghost" size="sm" onClick={() => setExtraTravelers(current => current.filter((_, travelerIndex) => travelerIndex !== index))}><Trash2 className="h-4 w-4" /></Button></div><div className="grid gap-4 md:grid-cols-2"><Field label="Nom complet" required value={traveler.fullName} onChange={value => updateExtraTraveler(index, "fullName", value)} /><Field label="Date de naissance" type="date" required value={traveler.dateOfBirth} onChange={value => updateExtraTraveler(index, "dateOfBirth", value)} /><Field label="Nationalité" required value={traveler.nationality} onChange={value => updateExtraTraveler(index, "nationality", value)} /><Field label="Numéro de passeport" required value={traveler.passportNumber} onChange={value => updateExtraTraveler(index, "passportNumber", value)} /></div></div>)}</Card>
          <Card className="p-6"><h2 className="text-xl font-bold text-gray-900">4. Contact d’urgence et confirmation</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Nom du contact d’urgence" name="emergencyContactName" required /><Field label="Téléphone du contact d’urgence" name="emergencyContactPhone" type="tel" required /><div className="md:col-span-2"><Label htmlFor="notes">Informations complémentaires (facultatif)</Label><Textarea id="notes" name="notes" className="mt-2" placeholder="Exigence de visa, précision sur le voyage…" maxLength={1500} /></div></div><label className="mt-5 flex items-start gap-3 text-sm text-gray-600"><input name="acceptedConsent" type="checkbox" required className="mt-1" /><span>J’accepte la transmission de ces informations à 3M Travel & Services pour l’étude et l’établissement de ma demande d’assurance voyage.</span></label></Card>
          <div className="flex flex-col items-center gap-3"><Button type="submit" size="lg" disabled={createRequest.isPending} className="bg-blue-600 px-8 hover:bg-blue-700"><MessageCircle className="mr-2 h-5 w-5" />{createRequest.isPending ? "Transmission en cours…" : "Envoyer ma demande et ouvrir WhatsApp"}</Button><p className="text-center text-xs text-gray-500">Le numéro de passeport est conservé uniquement dans votre dossier sécurisé et n’est pas envoyé dans le message WhatsApp.</p></div>
        </form>
      </motion.div>
    </div>
  );
}

function Field({ label, name, type = "text", required, placeholder, value, onChange }: { label: string; name?: string; type?: string; required?: boolean; placeholder?: string; value?: string; onChange?: (value: string) => void }) {
  const inputProps = value !== undefined ? { value, onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value) } : {};
  return <div><Label>{label}</Label><Input name={name} type={type} required={required} placeholder={placeholder} className="mt-2" {...inputProps} /></div>;
}
