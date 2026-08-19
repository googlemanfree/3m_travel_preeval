import { useState } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, ShieldCheck, Mail, Phone, MessageCircle, ArrowRight, CheckCircle2, User, Globe, Calendar, CreditCard, X, Check, Download, Loader, Share2, CalendarPlus, Copy, Link2, Hotel, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useMultiServiceCart } from "@/contexts/MultiServiceCartContext";
import Footer from "@/components/Footer";
import PassportScanUploader from "@/components/PassportScanUploader";
import { trpc } from "@/lib/trpc";

function formatXaf(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

function toCalendarStamp(date: string, time: string) {
  const safeDate = date.replace(/-/g, "");
  const safeTime = time.replace(/:/g, "").slice(0, 4).padEnd(4, "0");
  return `${safeDate}T${safeTime}00`;
}

const bookingSteps = [
  { label: "Vol sélectionné", shortLabel: "Vol" },
  { label: "Informations passager", shortLabel: "Passager" },
  { label: "Confirmation finale", shortLabel: "Confirmation" },
  { label: "Demande préparée", shortLabel: "Préparée" },
] as const;

type CheckoutFlight = {
  id: string;
  airline: { name: string; code: string };
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  cabinClass: string;
  totalPrice: number;
  currency: string;
  baggage: string;
  pnrRef: string;
};

type CheckoutSelection = {
  flight: CheckoutFlight;
  searchParams: { adults: number; children: number; infants: number };
  isSimulated: boolean;
  selectedAt: number;
};

export default function FlightBookingCheckout() {
  const [, params] = useRoute<{ flightId: string }>("/flight-booking/:flightId");
  const { toast } = useToast();
  const { addItem } = useMultiServiceCart();
  const [selection] = useState<CheckoutSelection | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("3m-selected-flight");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CheckoutSelection;
      const isRecent = Number.isFinite(parsed.selectedAt) && Date.now() - parsed.selectedAt < 30 * 60 * 1000;
      return parsed.flight?.id === params?.flightId && isRecent ? parsed : null;
    } catch {
      return null;
    }
  });
  const selectedFlight = selection?.flight;
  const hasSelectedFlight = Boolean(selectedFlight);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dossierRef, setDossierRef] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isTicketExporting, setIsTicketExporting] = useState(false);
  const [passportScanId, setPassportScanId] = useState<number | null>(null);
  const [bookingSubmitError, setBookingSubmitError] = useState<string | null>(null);
  const createRequestMutation = trpc.flightBooking.createRequest.useMutation({
    onSuccess: (result) => {
      setDossierRef(result.requestRef);
      setBookingSubmitError(null);
      setShowConfirmModal(false);
      setSubmitted(true);
      toast({ title: "Demande transmise à l'agence", description: `${result.requiresAccountActivation ? "Votre demande est enregistrée. Créez ou activez votre espace client pour suivre son évolution. " : ""}Référence ${result.requestRef}. Le tarif et la disponibilité seront revalidés par un agent.` });
    },
    onError: (error) => {
      const message = error.message || "Réessayez ou contactez l'agence.";
      setBookingSubmitError(message);
      toast({ title: "Transmission impossible", description: message, variant: "destructive" });
    },
  });
  const currentStep = submitted ? 4 : showConfirmModal ? 3 : 2;
  const progressPercent = ((currentStep - 1) / (bookingSteps.length - 1)) * 100;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    passportNumber: "",
    passportExpiry: "",
    nationality: "Camerounaise",
    dateOfBirth: "",
    seatPreference: "Hublot",
    mealPreference: "Standard",
    frequentFlyer: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSelectedFlight) {
      toast({ title: "Vol introuvable", description: "Retournez aux résultats et sélectionnez un vol avant de continuer.", variant: "destructive" });
      return;
    }
    if (!formData.fullName || !formData.email || !formData.passportNumber) {
      toast({ title: "Informations incomplètes", description: "Veuillez renseigner votre nom, e-mail et numéro de passeport.", variant: "destructive" });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = () => {
    if (!selectedFlight) {
      toast({ title: "Vol introuvable", description: "Retournez aux résultats et sélectionnez un vol.", variant: "destructive" });
      return;
    }
    setBookingSubmitError(null);
    createRequestMutation.mutate({
      flightId: selectedFlight.id,
      flightData: selectedFlight as unknown as Record<string, unknown>,
      passengerData: [{ ...(formData as unknown as Record<string, unknown>), passportScanId }],
    });
  };

  const whatsappNumber = "237698104832";
  const agencyEmail = "hello@3mtravelagency.com";
  const agencyPhone = "+237 698 10 48 32";
  const destinationLabel = selectedFlight?.destinationCity || (typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("destination") || "votre destination"
    : "votre destination");
  const destinationKey = destinationLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "destination";
  const shareLink = typeof window !== "undefined" ? window.location.href : "https://www.3mtravelagency.com/flights";

  const shareText = `✈️ Ma demande de réservation 3M Travel Agency\nRéf Dossier: ${dossierRef}\nPassager: ${formData.fullName}\nPasseport: ${formData.passportNumber}\nVol: ${selectedFlight?.flightNumber || params?.flightId || "REF"}\nItinéraire: ${selectedFlight?.originCity || selectedFlight?.origin || "Départ"} → ${selectedFlight?.destinationCity || selectedFlight?.destination || "Destination"}\nPrix indicatif: ${selectedFlight ? formatXaf(selectedFlight.totalPrice) : "à confirmer"}\nContact Agence: +237 698 10 48 32`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent("https://www.3mtravelagency.com")}&text=${encodeURIComponent(shareText)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`;
  const mailtoUrl = `mailto:${agencyEmail}?subject=${encodeURIComponent(`Réservation Vol 3M Travel - Réf ${dossierRef}`)}&body=${encodeURIComponent(shareText)}`;
  const telUrl = `tel:${whatsappNumber}`;

  const handleSendRecapToFriend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const recipient = friendEmail.trim();
    if (!recipient) return;
    const subject = `Récapitulatif de vol 3M Travel - ${dossierRef}`;
    const body = `${shareText}\n\nLien de l’itinéraire : ${shareLink}`;
    window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast({ title: "E-mail préparé", description: "Votre application de messagerie va ouvrir le récapitulatif pour votre proche." });
  };

  const handleCopyItineraryLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setIsLinkCopied(true);
      toast({ title: "Lien copié", description: "Le lien de votre itinéraire est prêt à être partagé." });
      window.setTimeout(() => setIsLinkCopied(false), 2200);
    } catch {
      toast({ title: "Copie impossible", description: "Utilisez le partage WhatsApp, Telegram ou SMS pour transmettre l’itinéraire.", variant: "destructive" });
    }
  };

  const handleAddHotelSuggestion = () => {
    addItem({ id: `hotel-${destinationKey}`, serviceType: "hotel", title: `Hôtel à ${destinationLabel}`, subtitle: "Recherche d’hébergement selon vos dates", price: 0, currency: "FCFA", priceStatus: "on_request", metadata: { destination: destinationLabel, dossierRef } });
    toast({ title: "Hôtel ajouté", description: `La recherche d’un hôtel à ${destinationLabel} a été ajoutée au panier.` });
  };

  const handleAddVehicleSuggestion = () => {
    addItem({ id: `vehicle-${destinationKey}`, serviceType: "vehicle", title: `Véhicule à ${destinationLabel}`, subtitle: "Location avec retrait à organiser", price: 0, currency: "FCFA", priceStatus: "on_request", metadata: { destination: destinationLabel, dossierRef } });
    toast({ title: "Location ajoutée", description: `La recherche d’un véhicule à ${destinationLabel} a été ajoutée au panier.` });
  };

  const handleAddToGoogleCalendar = () => {
    if (!selectedFlight) {
      toast({ title: "Vol introuvable", description: "Sélectionnez un vol avant d’ajouter un événement au calendrier.", variant: "destructive" });
      return;
    }
    const title = encodeURIComponent(`Vol ${selectedFlight.airline.name} — ${selectedFlight.flightNumber}`);
    const details = encodeURIComponent(`Demande de réservation 3M Travel Agency.\nPassager: ${formData.fullName}\nPasseport: ${formData.passportNumber}\nRéférence: ${dossierRef}`);
    const location = encodeURIComponent(`${selectedFlight.originCity} → ${selectedFlight.destinationCity}`);
    const dates = `${toCalendarStamp(selectedFlight.departureDate, selectedFlight.departureTime)}/${toCalendarStamp(selectedFlight.departureDate, selectedFlight.arrivalTime)}`;
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
    window.open(googleUrl, "_blank");
  };

  const handleDownloadIcs = () => {
    if (!selectedFlight) {
      toast({ title: "Vol introuvable", description: "Sélectionnez un vol avant de télécharger l’événement calendrier.", variant: "destructive" });
      return;
    }
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//3M Travel Agency//Vol Confirme//FR",
      "BEGIN:VEVENT",
      `SUMMARY:Vol ${selectedFlight.airline.name} - ${selectedFlight.flightNumber}`,
      `DESCRIPTION:Demande de réservation pour ${formData.fullName} (Passeport: ${formData.passportNumber}, Réf: ${dossierRef}).`,
      `LOCATION:${selectedFlight.originCity} → ${selectedFlight.destinationCity}`,
      `DTSTART:${toCalendarStamp(selectedFlight.departureDate, selectedFlight.departureTime)}`,
      `DTEND:${toCalendarStamp(selectedFlight.departureDate, selectedFlight.arrivalTime)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Vol_3M_Travel_${dossierRef}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Calendrier téléchargé", description: "Le fichier .ics a été enregistré pour votre application de calendrier." });
  };

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletType, setWalletType] = useState<"apple" | "google">("apple");

  const handleWalletAction = (type: "apple" | "google") => {
    setWalletType(type);
    setShowWalletModal(true);
  };

  const handleDownloadTicketPdf = async () => {
    if (!selectedFlight || isTicketExporting) return;
    setIsTicketExporting(true);
    try {
      const { default: JsPDF } = await import("jspdf");
      const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const lines = [
        "3M TRAVEL AGENCY",
        "RÉCAPITULATIF PROVISOIRE DE DEMANDE DE VOL",
        `Référence : ${dossierRef}`,
        `Émis le : ${new Date().toLocaleDateString("fr-FR")}`,
        "",
        "PASSAGER",
        `Nom complet : ${formData.fullName}`,
        `E-mail : ${formData.email}`,
        `Téléphone : ${formData.phone}`,
        `Passeport : ${formData.passportNumber}`,
        `Nationalité : ${formData.nationality}`,
        `Date de naissance : ${formData.dateOfBirth || "Non renseignée"}`,
        "",
        "VOL SÉLECTIONNÉ",
        `Compagnie / vol : ${selectedFlight.airline.name} — ${selectedFlight.flightNumber}`,
        `Itinéraire : ${selectedFlight.originCity} (${selectedFlight.origin}) → ${selectedFlight.destinationCity} (${selectedFlight.destination})`,
        `Départ : ${selectedFlight.departureDate} à ${selectedFlight.departureTime}`,
        `Arrivée : ${selectedFlight.arrivalTime} · Durée : ${selectedFlight.duration}`,
        `Escales : ${selectedFlight.stops === 0 ? "Vol direct" : `${selectedFlight.stops} escale(s)`}`,
        `Classe : ${selectedFlight.cabinClass}`,
        `Bagages : ${selectedFlight.baggage}`,
        `Prix ${selection?.isSimulated ? "indicatif" : "estimé"} : ${formatXaf(selectedFlight.totalPrice)}`,
        "",
        "VALIDATION",
        "Le tarif, les places et l’émission doivent être revalidés par 3M Travel Agency avant tout paiement ou émission définitive.",
        "Contact : hello@3mtravelagency.com · +237 698 10 48 32",
      ];

      pdf.setTextColor(25, 55, 109);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(lines[0], 15, 20);
      pdf.setFontSize(11);
      pdf.text(lines[1], 15, 28);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(35, 45, 60);
      pdf.setFontSize(10);
      const body = pdf.splitTextToSize(lines.slice(2).join("\n"), 180);
      pdf.text(body, 15, 40);
      pdf.save(`Billet_3M_Travel_${dossierRef}.pdf`);
      toast({ title: "PDF téléchargé", description: "Votre récapitulatif provisoire a été généré avec succès." });
    } catch (error) {
      console.error("Erreur lors du téléchargement du billet PDF", error);
      toast({ title: "Téléchargement impossible", description: "Veuillez réessayer ou contacter l’agence.", variant: "destructive" });
    } finally {
      setIsTicketExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700">
              <ShieldCheck className="h-4 w-4" /> Réservation Sécurisée GDS & Passeport
            </span>
            <h1 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">Finalisation de votre vol</h1>
              <p className="mt-2 text-sm text-slate-600">Renseignez les informations officielles de votre passeport et préparez votre demande de réservation.</p>
              {!hasSelectedFlight && (
                <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900" role="alert">
                  Aucun vol sélectionné n’a été retrouvé sur cet appareil. <a href="/flights" className="underline">Retourner aux résultats</a> pour choisir un vol.
                </div>
              )}
          </div>

          <section aria-label="Progression de la réservation" className="mb-8 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Étape {currentStep} sur {bookingSteps.length}</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{bookingSteps[currentStep - 1].label}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{Math.round(progressPercent)} %</span>
            </div>
            <div
              role="progressbar"
              aria-label={`Progression de la réservation : ${bookingSteps[currentStep - 1].label}`}
              aria-valuemin={1}
              aria-valuemax={bookingSteps.length}
              aria-valuenow={currentStep}
              className="relative h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <motion.div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-700 to-sky-400" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.35, ease: "easeOut" }} />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {bookingSteps.map((step, index) => {
                const stepNumber = index + 1;
                const isCurrent = stepNumber === currentStep;
                const isComplete = stepNumber < currentStep;
                return (
                  <div key={step.label} className={`text-center ${isCurrent ? "text-blue-700" : isComplete ? "text-emerald-700" : "text-slate-400"}`}>
                    <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100" : isComplete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                      {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : stepNumber}
                    </div>
                    <span className="mt-2 block text-[10px] font-bold leading-tight sm:text-xs">{step.shortLabel}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {!submitted ? (
            <form onSubmit={handleOpenConfirm} className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className={`space-y-6 rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm ${!hasSelectedFlight ? "opacity-70" : ""}`}>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" /> Informations du Passager & Passeport
                </h2>

                <PassportScanUploader onExtractedData={(data, scanId) => {
                  setFormData((previous) => ({
                    ...previous,
                    fullName: [data.givenNames, data.surname].filter(Boolean).join(" ").trim() || previous.fullName,
                    passportNumber: data.passportNumber || previous.passportNumber,
                    nationality: data.nationality || previous.nationality,
                    dateOfBirth: data.dateOfBirth || previous.dateOfBirth,
                    passportExpiry: data.expiryDate || previous.passportExpiry,
                  }));
                  setPassportScanId(scanId);
                }} />

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

                <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <Label htmlFor="seatPreference" className="text-xs font-bold uppercase tracking-wider text-slate-600">Préférence de siège</Label>
                    <select id="seatPreference" name="seatPreference" value={formData.seatPreference} onChange={(e) => setFormData({ ...formData, seatPreference: e.target.value })} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
                      <option value="Hublot">Hublot</option>
                      <option value="Couloir">Couloir</option>
                      <option value="Milieu">Milieu</option>
                      <option value="Sortie de secours">Sortie de secours (+ espace jambes)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mealPreference" className="text-xs font-bold uppercase tracking-wider text-slate-600">Préférence de repas</Label>
                    <select id="mealPreference" name="mealPreference" value={formData.mealPreference} onChange={(e) => setFormData({ ...formData, mealPreference: e.target.value })} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
                      <option value="Standard">Standard</option>
                      <option value="Halal">Halal</option>
                      <option value="Végétarien">Végétarien</option>
                      <option value="Kasher">Kasher</option>
                      <option value="Diététique / Sans sel">Diététique / Sans sel</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequentFlyer" className="text-xs font-bold uppercase tracking-wider text-slate-600">Programme de fidélité (SkyTeam / Autre)</Label>
                    <Input id="frequentFlyer" name="frequentFlyer" value={formData.frequentFlyer} onChange={handleChange} placeholder="Ex : AF123456789" className="h-12 rounded-xl font-mono" />
                  </div>
                </div>

                <Button type="submit" disabled={!hasSelectedFlight} className="h-12 w-full rounded-xl bg-blue-600 font-black text-white hover:bg-blue-700 shadow-md disabled:cursor-not-allowed disabled:opacity-50">
                  Vérifier et confirmer la réservation <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="h-fit space-y-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-lg lg:sticky lg:top-24">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Récapitulatif Vol</p>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between gap-3"><span>Vol :</span><span className="font-mono text-right font-bold text-slate-900">{selectedFlight?.flightNumber || "Non sélectionné"}</span></div>
                  <div className="flex justify-between gap-3"><span>Itinéraire :</span><span className="text-right font-semibold text-slate-900">{selectedFlight ? `${selectedFlight.origin} → ${selectedFlight.destination}` : "À sélectionner"}</span></div>
                  <div className="flex justify-between gap-3"><span>Classe :</span><span className="font-semibold text-blue-700">{selectedFlight?.cabinClass || "À confirmer"}</span></div>
                  <div className="flex justify-between gap-3"><span>Bagages :</span><span className="text-right font-semibold text-slate-900">{selectedFlight?.baggage || "À confirmer"}</span></div>
                </div>
                <div className="my-4 border-t border-slate-100" />
                <div className="flex items-end justify-between gap-3"><span className="text-sm font-semibold text-slate-600">Total {selection?.isSimulated ? "indicatif" : "estimé"}</span><span className="text-right text-2xl font-black text-blue-950">{selectedFlight ? formatXaf(selectedFlight.totalPrice) : "À confirmer"}</span></div>
                <p className="text-[11px] leading-5 text-slate-400">Le tarif affiché doit être revalidé par l’agence avant l’émission du billet électronique.</p>
              </div>
            </form>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl">
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-600" />
              <h2 className="text-2xl font-black text-slate-900">Demande de réservation préparée</h2>
              <p className="mt-2 text-sm text-slate-600">Votre référence provisoire est <span className="font-mono font-bold text-blue-700">{dossierRef}</span>. Contactez l’agence pour revalider le tarif, les places et finaliser l’émission.</p>

              <div className="my-6 rounded-2xl bg-blue-50 p-4 text-left text-xs leading-6 text-blue-900">
                <p className="font-black mb-1">Dernière étape : validation par l’agence</p>
                <p>Les coordonnées du vol sélectionné et vos informations de passeport sont prêtes à être vérifiées par nos conseillers avant toute émission.</p>
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

              <div className="mt-6 space-y-3">
                <Button onClick={handleDownloadTicketPdf} disabled={isTicketExporting} className="h-12 w-full rounded-2xl bg-blue-600 font-black text-white hover:bg-blue-700 shadow-md disabled:cursor-not-allowed disabled:opacity-60" aria-busy={isTicketExporting}>
                  {isTicketExporting ? <Loader className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="mr-2 h-4 w-4" aria-hidden="true" />}
                  {isTicketExporting ? "Génération du PDF…" : "Télécharger mon billet électronique (PDF)"}
                </Button>

                {/* Boutons Wallet alignés et optimisés mobile */}
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => handleWalletAction("apple")} variant="outline" className="h-11 rounded-xl border-slate-300 font-bold text-slate-800 hover:bg-slate-100 text-xs sm:text-sm">
                     Apple Wallet
                  </Button>
                  <Button onClick={() => handleWalletAction("google")} variant="outline" className="h-11 rounded-xl border-slate-300 font-bold text-slate-800 hover:bg-slate-100 text-xs sm:text-sm">
                    G Pay Google Wallet
                  </Button>
                </div>

                {/* Section Partage social direct */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-center gap-1.5">
                    <Share2 className="h-3.5 w-3.5 text-blue-600" /> Partager mon récapitulatif
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700">
                      WhatsApp
                    </a>
                    <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-xl bg-sky-500 py-2.5 text-xs font-bold text-white shadow hover:bg-sky-600">
                      Telegram
                    </a>
                    <a href={smsUrl} className="flex items-center justify-center rounded-xl bg-slate-700 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800">
                      SMS
                    </a>
                  </div>
                </div>

                {/* Envoi du récapitulatif à un proche */}
                <form onSubmit={handleSendRecapToFriend} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-left">
                  <Label htmlFor="friendEmail" className="mb-2 block text-xs font-black uppercase tracking-wider text-blue-900">Envoyer le récapitulatif à un proche</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input id="friendEmail" type="email" value={friendEmail} onChange={(event) => setFriendEmail(event.target.value)} placeholder="proche@exemple.com" required className="h-11 min-w-0 flex-1 rounded-xl border-blue-200 bg-white" />
                    <Button type="submit" className="h-11 rounded-xl bg-blue-700 px-4 font-bold text-white hover:bg-blue-800 sm:shrink-0">
                      <Mail className="mr-2 h-4 w-4" /> Envoyer
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-blue-800">Votre application e-mail s’ouvrira avec le récapitulatif et le lien de l’itinéraire préremplis.</p>
                </form>

                {/* Suggestions auxiliaires adaptées à la destination */}
                <section className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-left" aria-labelledby="auxiliary-suggestions-title">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p id="auxiliary-suggestions-title" className="text-xs font-black uppercase tracking-wider text-amber-900">Complétez votre voyage</p>
                      <p className="mt-1 text-xs text-amber-800">Options auxiliaires pour {destinationLabel}, à confirmer par l’agence.</p>
                    </div>
                    <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-amber-900">Sur demande</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button type="button" variant="outline" onClick={handleAddHotelSuggestion} className="h-auto min-h-16 justify-start rounded-xl border-amber-200 bg-white px-3 py-2 text-left text-xs font-bold text-amber-950 hover:bg-amber-100">
                      <Hotel className="mr-2 h-5 w-5 shrink-0 text-amber-700" />
                      <span><span className="block">Hôtel à {destinationLabel}</span><span className="mt-0.5 block text-[10px] font-medium text-amber-700">Demander une disponibilité</span></span>
                    </Button>
                    <Button type="button" variant="outline" onClick={handleAddVehicleSuggestion} className="h-auto min-h-16 justify-start rounded-xl border-amber-200 bg-white px-3 py-2 text-left text-xs font-bold text-amber-950 hover:bg-amber-100">
                      <Car className="mr-2 h-5 w-5 shrink-0 text-amber-700" />
                      <span><span className="block">Véhicule à {destinationLabel}</span><span className="mt-0.5 block text-[10px] font-medium text-amber-700">Demander une disponibilité</span></span>
                    </Button>
                  </div>
                </section>

                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Button type="button" variant="outline" onClick={handleCopyItineraryLink} className="h-11 rounded-xl border-slate-300 font-bold text-slate-800 hover:bg-slate-100">
                    {isLinkCopied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4 text-blue-600" />}
                    {isLinkCopied ? "Lien copié" : "Copier le lien"}
                  </Button>
                  <span className="flex items-center justify-center rounded-xl bg-emerald-50 px-3 text-center text-[11px] font-semibold text-emerald-800" aria-live="polite">
                    {isLinkCopied ? "Prêt à partager" : "Partage rapide de l’itinéraire"}
                  </span>
                </div>

                {/* Section Ajout au calendrier */}
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleAddToGoogleCalendar} variant="outline" className="h-11 rounded-xl border-slate-300 font-bold text-slate-800 hover:bg-slate-100 text-xs sm:text-sm">
                    <CalendarPlus className="mr-1.5 h-4 w-4 text-blue-600" /> Google Agenda
                  </Button>
                  <Button onClick={handleDownloadIcs} variant="outline" className="h-11 rounded-xl border-slate-300 font-bold text-slate-800 hover:bg-slate-100 text-xs sm:text-sm">
                    <CalendarPlus className="mr-1.5 h-4 w-4 text-slate-700" /> Apple Calendar
                  </Button>
                </div>

                <div className="pt-2">
                  <a href="/" className="text-sm font-bold text-blue-600 hover:underline">← Retour à l'accueil</a>
                </div>
              </div>
            </motion.div>
          )}

          {/* Modale d'information Wallet */}
          <AnimatePresence>
            {showWalletModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation">
                <motion.div role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl md:p-8" initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 id="wallet-modal-title" className="text-lg font-black text-slate-900">
                      {walletType === "apple" ? "Ajouter à Apple Wallet" : "Ajouter à Google Wallet"}
                    </h3>
                    <button type="button" aria-label="Fermer" onClick={() => setShowWalletModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="my-5 space-y-3 text-sm text-slate-600">
                    <p>Le pass pour {walletType === "apple" ? "Apple Wallet" : "Google Wallet"} nécessite l’émission définitive de votre billet par l’agence 3M Travel.</p>
                    <div className="rounded-2xl bg-amber-50 p-4 text-xs font-medium text-amber-900">
                      <p className="font-bold">Pass provisoire sécurisé :</p>
                      <p className="mt-1">Votre dossier <strong>{dossierRef}</strong> est enregistré. Téléchargez votre reçu PDF ci-dessous ou contactez notre agence pour recevoir votre pass portefeuille officiel directement par e-mail ou WhatsApp.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => { setShowWalletModal(false); handleDownloadTicketPdf(); }} className="h-12 flex-1 rounded-xl bg-blue-600 font-black text-white hover:bg-blue-700">
                      Télécharger le PDF
                    </Button>
                    <Button onClick={() => setShowWalletModal(false)} variant="outline" className="h-12 rounded-xl border-slate-300 font-bold">
                      Fermer
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Fenêtre modale de confirmation */}
          <AnimatePresence>
            {showConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation">
                <motion.div role="dialog" aria-modal="true" aria-labelledby="booking-confirmation-title" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl md:p-8" initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 id="booking-confirmation-title" className="text-lg font-black text-slate-900">Récapitulatif de votre réservation</h3>
                    <button type="button" aria-label="Fermer le récapitulatif" onClick={() => setShowConfirmModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="my-5 space-y-4 text-sm text-slate-600">
                    <div className="rounded-2xl bg-blue-50/70 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Passager principal</p>
                      <p className="mt-1 text-base font-black text-slate-900">{formData.fullName}</p>
                      <p className="text-xs text-slate-500">{formData.email} · {formData.phone}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[11px] font-bold uppercase text-slate-400">N° de Passeport</p>
                        <p className="font-mono font-bold text-slate-800">{formData.passportNumber}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[11px] font-bold uppercase text-slate-400">Nationalité</p>
                        <p className="font-semibold text-slate-800">{formData.nationality}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex justify-between text-xs text-slate-500"><span>Prestation :</span><span className="font-bold text-slate-800">Vol GDS international</span></div>
                       <div className="mt-2 flex justify-between gap-3 text-base font-black text-blue-900"><span>Montant {selection?.isSimulated ? "indicatif" : "estimé"} :</span><span className="text-right">{selectedFlight ? formatXaf(selectedFlight.totalPrice) : "À confirmer"}</span></div>
                     </div>
                     <p className="text-xs text-slate-500">En confirmant, vous préparez votre demande. L’agence doit revalider le tarif et les disponibilités avant toute émission.</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => { setBookingSubmitError(null); setShowConfirmModal(false); }} className="flex-1 h-12 rounded-xl border-slate-200">Modifier</Button>
                    <Button type="button" onClick={handleFinalSubmit} disabled={createRequestMutation.isPending} className="flex-1 h-12 rounded-xl bg-blue-600 font-black text-white hover:bg-blue-700 disabled:opacity-60">
                      {createRequestMutation.isPending ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      {createRequestMutation.isPending ? "Transmission…" : "Confirmer"}
                    </Button>
                  </div>
                  {bookingSubmitError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{bookingSubmitError}</p>}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
