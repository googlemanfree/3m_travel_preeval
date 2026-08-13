import { useState } from "react";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { Plane, ShieldCheck, Mail, Phone, MessageCircle, ArrowRight, CheckCircle2, User, Globe, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Footer from "@/components/Footer";

function formatXaf(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

export default function FlightBookingCheckout() {
  const [, params] = useRoute<{ flightId: string }>("/flight-booking/:flightId");
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [dossierRef, setDossierRef] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    passportNumber: "",
    passportExpiry: "",
    nationality: "Camerounaise",
    dateOfBirth: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.passportNumber) {
      toast({ title: "Informations incomplètes", description: "Veuillez renseigner votre nom, e-mail et numéro de passeport.", variant: "destructive" });
      return;
    }
    const ref = `3M-FL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setDossierRef(ref);
    setSubmitted(true);
    toast({ title: "Réservation enregistrée", description: `Dossier ${ref} créé avec succès.` });
  };

  const whatsappNumber = "237698104832";
  const agencyEmail = "hello@3mtravelagency.com";
  const agencyPhone = "+237 698 10 48 32";

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Bonjour 3M Travel, je souhaite finaliser ma réservation de vol (Réf: ${dossierRef || 'Nouveau'}). Nom: ${formData.fullName}, Passeport: ${formData.passportNumber}`)}`;
  const mailtoUrl = `mailto:${agencyEmail}?subject=${encodeURIComponent(`Réservation Vol 3M Travel - Réf ${dossierRef || 'En attente'}`)}&body=${encodeURIComponent(`Bonjour,\n\nJe souhaite confirmer mon vol.\n\nNom: ${formData.fullName}\nTéléphone: ${formData.phone}\nE-mail: ${formData.email}\nPasseport: ${formData.passportNumber}\n\nMerci de me contacter.`)}`;
  const telUrl = `tel:${whatsappNumber}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700">
              <ShieldCheck className="h-4 w-4" /> Réservation Sécurisée GDS & Passeport
            </span>
            <h1 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">Finalisation de votre vol</h1>
            <p className="mt-2 text-sm text-slate-600">Renseignez les informations officielles de votre passeport et choisissez votre mode de contact direct avec l'agence.</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" /> Informations du Passager & Passeport
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-600">Nom complet (selon passeport) *</Label>
                    <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Ex : DONFACK AUREOL" required className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-600">Adresse E-mail *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="exemple@gmail.com" required className="h-12 rounded-xl" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-600">Téléphone / WhatsApp *</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+237 6XX XXX XXX" required className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality" className="text-xs font-bold uppercase tracking-wider text-slate-600">Nationalité</Label>
                    <Input id="nationality" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="Camerounaise" className="h-12 rounded-xl" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="passportNumber" className="text-xs font-bold uppercase tracking-wider text-slate-600">N° de Passeport *</Label>
                    <Input id="passportNumber" name="passportNumber" value={formData.passportNumber} onChange={handleChange} placeholder="CC123456" required className="h-12 rounded-xl font-mono uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportExpiry" className="text-xs font-bold uppercase tracking-wider text-slate-600">Expiration Passeport</Label>
                    <Input id="passportExpiry" name="passportExpiry" type="date" value={formData.passportExpiry} onChange={handleChange} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-xs font-bold uppercase tracking-wider text-slate-600">Date de Naissance</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} className="h-12 rounded-xl" />
                  </div>
                </div>

                <Button type="submit" className="h-12 w-full rounded-xl bg-blue-600 font-black text-white hover:bg-blue-700 shadow-md">
                  Enregistrer ma réservation et afficher les options de contact <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="h-fit space-y-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-lg lg:sticky lg:top-24">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Récapitulatif Vol</p>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between"><span>Référence vol :</span><span className="font-mono font-bold text-slate-900">3M-FL-{params && params.flightId ? params.flightId : "REF"}</span></div>
                  <div className="flex justify-between"><span>Classe :</span><span className="font-semibold text-blue-700">Économique GDS</span></div>
                  <div className="flex justify-between"><span>Bagages :</span><span className="font-semibold text-slate-900">23kg inclus</span></div>
                </div>
                <div className="my-4 border-t border-slate-100" />
                <div className="flex items-end justify-between"><span className="text-sm font-semibold text-slate-600">Total estimé</span><span className="text-2xl font-black text-blue-950">450 000 FCFA</span></div>
                <p className="text-[11px] leading-5 text-slate-400">Tarif revalidé en direct par l'agence avant l'émission du billet électronique.</p>
              </div>
            </form>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl">
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-600" />
              <h2 className="text-2xl font-black text-slate-900">Réservation enregistrée avec succès !</h2>
              <p className="mt-2 text-sm text-slate-600">Votre numéro de dossier est le <span className="font-mono font-bold text-blue-700">{dossierRef}</span>. Vos informations de passeport ont été transmises de façon sécurisée à l'équipe de 3M Travel Agency.</p>

              <div className="my-6 rounded-2xl bg-blue-50 p-4 text-left text-xs leading-6 text-blue-900">
                <p className="font-black mb-1">Contactez directement notre agence par le canal de votre choix :</p>
                <p>Nos conseillers sont disponibles pour valider votre PNR, appliquer le meilleur tarif et procéder à l'émission immédiate.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-4 font-bold text-emerald-800 transition hover:bg-emerald-100">
                  <MessageCircle className="mb-2 h-6 w-6 text-emerald-600" /> WhatsApp
                </a>
                <a href={mailtoUrl} className="flex flex-col items-center justify-center rounded-2xl border-2 border-blue-500 bg-blue-50 p-4 font-bold text-blue-800 transition hover:bg-blue-100">
                  <Mail className="mb-2 h-6 w-6 text-blue-600" /> E-mail
                </a>
                <a href={telUrl} className="flex flex-col items-center justify-center rounded-2xl border-2 border-indigo-500 bg-indigo-50 p-4 font-bold text-indigo-800 transition hover:bg-indigo-100">
                  <Phone className="mb-2 h-6 w-6 text-indigo-600" /> Téléphone
                </a>
              </div>

              <div className="mt-8">
                <a href="/" className="text-sm font-bold text-blue-600 hover:underline">← Retour à l'accueil</a>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
