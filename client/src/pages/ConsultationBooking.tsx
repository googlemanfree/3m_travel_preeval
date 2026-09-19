import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader, Plane, Globe, Briefcase, GraduationCap, Users, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";

const SERVICE_OPTIONS = [
  { id: "immigration", icon: Globe, label: "Immigration & Résidence permanente", desc: "Canada, Europe, Golfe — procédures et critères d'éligibilité" },
  { id: "visa", icon: Plane, label: "Visa de voyage ou de transit", desc: "Tourisme, affaires, transit, regroupement familial" },
  { id: "education", icon: GraduationCap, label: "Études à l'étranger", desc: "Admission, bourse, permis étudiant" },
  { id: "work", icon: Briefcase, label: "Permis de travail", desc: "EIMT, permis ouvert, entrepreneur" },
  { id: "family", icon: Users, label: "Regroupement familial", desc: "Conjoint, enfants, parents — parrainage" },
  { id: "other", icon: MapPin, label: "Autre projet", desc: "Mobilité internationale ou question générale" },
];

const COUNTRIES = ["Canada", "France", "Belgique", "Portugal", "Espagne", "Allemagne", "Italie", "UAE / Dubaï", "Qatar", "Arabie Saoudite", "Royaume-Uni", "États-Unis", "Australie", "Autre"];

interface FormData {
  service: string;
  targetCountry: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

const empty: FormData = { service: "", targetCountry: "", fullName: "", email: "", phone: "", message: "" };

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i + 1 === step ? "w-8 bg-blue-600" : i + 1 < step ? "w-4 bg-blue-300" : "w-4 bg-slate-200"}`} />
      ))}
    </div>
  );
}

export default function ConsultationBooking() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(empty);
  const [error, setError] = useState("");

  const submitMutation = trpc.consultationRequest.submit.useMutation();

  const update = (key: keyof FormData, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const goNext = () => {
    setError("");
    if (step === 1 && !form.service) { setError("Merci de choisir le type de consultation."); return; }
    if (step === 2 && !form.targetCountry) { setError("Merci d'indiquer votre pays cible."); return; }
    if (step === 3) {
      if (form.fullName.trim().length < 3) { setError("Merci d'indiquer votre nom complet."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Adresse email invalide."); return; }
      if (form.phone.trim().length < 8) { setError("Numéro de téléphone invalide."); return; }
      submitMutation.mutate({ fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), targetCountry: `${form.service} — ${form.targetCountry}`, message: form.message || undefined });
      return;
    }
    setStep((s) => s + 1);
  };

  const selectedService = SERVICE_OPTIONS.find((s) => s.id === form.service);

  if (submitMutation.data) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-16">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-950">Demande envoyée !</h1>
            <p className="mt-4 text-slate-600">Votre demande de consultation a été reçue. Un conseiller 3M Travel vous contactera à <strong>{form.email}</strong> dans les 24-48 heures ouvrées.</p>
            <a href="/" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800">
              Retour à l'accueil
            </a>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
        <div className="mx-auto max-w-xl">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Prise de rendez-vous gratuite</span>
            <h1 className="mt-3 text-3xl font-black text-slate-950">Consultation personnalisée</h1>
            <p className="mt-2 text-slate-500">Un conseiller 3M Travel analysera votre projet et vous guidera vers les meilleures options.</p>
          </div>

          <StepIndicator step={step} total={3} />

          <Card className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="mb-1 text-xl font-black text-slate-950">Type de consultation</h2>
                  <p className="mb-5 text-sm text-slate-500">Quel est l'objet principal de votre projet ?</p>
                  <div className="grid gap-3">
                    {SERVICE_OPTIONS.map(({ id, icon: Icon, label, desc }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => update("service", id)}
                        className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition ${form.service === id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}
                      >
                        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${form.service === id ? "text-blue-600" : "text-slate-400"}`} />
                        <div>
                          <p className={`font-bold ${form.service === id ? "text-blue-900" : "text-slate-800"}`}>{label}</p>
                          <p className="text-xs text-slate-500">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="mb-1 text-xl font-black text-slate-950">Pays cible</h2>
                  <p className="mb-5 text-sm text-slate-500">
                    {selectedService ? `${selectedService.label} — quel pays vous intéresse ?` : "Dans quel pays se déroule votre projet ?"}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => update("targetCountry", country)}
                        className={`rounded-xl border-2 py-3 px-2 text-sm font-semibold transition ${form.targetCountry === country ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50"}`}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="mb-1 text-xl font-black text-slate-950">Vos informations</h2>
                  <p className="mb-5 text-sm text-slate-500">Pour vous recontacter et personnaliser votre accompagnement.</p>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="cb-name">Nom complet *</Label>
                        <Input id="cb-name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Jean Dupont" className="mt-1" maxLength={200} />
                      </div>
                      <div>
                        <Label htmlFor="cb-phone">Téléphone *</Label>
                        <Input id="cb-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+237 6XX XXX XXX" className="mt-1" maxLength={30} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="cb-email">Email *</Label>
                      <Input id="cb-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="vous@exemple.com" className="mt-1" maxLength={320} />
                    </div>
                    <div>
                      <Label htmlFor="cb-message">Message complémentaire (optionnel)</Label>
                      <Textarea id="cb-message" value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Décrivez brièvement votre situation ou vos questions…" rows={3} className="mt-1" maxLength={2000} />
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                      <p className="font-bold">Récapitulatif</p>
                      <p className="mt-1">{selectedService?.label} → {form.targetCountry}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            {submitMutation.error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitMutation.error.message}</p>
            )}

            <div className={`mt-6 flex ${step > 1 ? "justify-between" : "justify-end"}`}>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => { setError(""); setStep((s) => s - 1); }} className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Retour
                </Button>
              )}
              <Button type="button" onClick={goNext} disabled={submitMutation.isPending} className="gap-1.5 bg-blue-700 hover:bg-blue-800">
                {submitMutation.isPending ? (
                  <><Loader className="h-4 w-4 animate-spin" /> Envoi…</>
                ) : step === 3 ? (
                  <><CheckCircle2 className="h-4 w-4" /> Envoyer ma demande</>
                ) : (
                  <>Suivant <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </Card>

          <p className="mt-6 text-center text-xs text-slate-400">
            Service gratuit · Aucun engagement · Réponse sous 24-48 h ouvrées
          </p>
        </div>
      </div>
    </>
  );
}
