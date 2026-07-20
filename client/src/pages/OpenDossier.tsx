import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CheckCircle, ArrowRight, ArrowLeft, User, Globe, CreditCard,
  Phone, Mail, MapPin, Briefcase, GraduationCap, Languages,
  Shield, AlertTriangle, Loader2, Star
} from "lucide-react";

const DESTINATIONS = [
  { value: "canada", label: "🇨🇦 Canada", description: "Permis de travail, RP, Études" },
  { value: "luxembourg", label: "🇱🇺 Luxembourg", description: "Contrat MAEE, 3 165 EUR/mois" },
  { value: "pologne", label: "🇵🇱 Pologne", description: "Travail direct, hébergement inclus" },
  { value: "europe", label: "🇪🇺 Europe Schengen", description: "France, Allemagne, Belgique, Italie..." },
  { value: "golfe", label: "🌍 Golfe & Moyen-Orient", description: "Qatar, EAU, Arabie Saoudite, Koweït" },
  { value: "oceanie", label: "🇦🇺 Océanie", description: "Australie, Nouvelle-Zélande" },
  { value: "caucase", label: "🏔️ Caucase", description: "Arménie, Géorgie, Azerbaïdjan" },
  { value: "autre", label: "🌐 Autre destination", description: "Nous consulter" },
];

const FORMULAS = [
  {
    id: "integral",
    name: "Paiement Intégral",
    price: "65 000 FCFA",
    badge: "Recommandé",
    color: "from-blue-600 to-blue-800",
    features: [
      "Paiement unique en une fois",
      "Traitement prioritaire du dossier",
      "Suivi personnalisé inclus",
      "Accès tableau de bord candidat",
    ],
  },
  {
    id: "echelonne",
    name: "Paiement Échelonné",
    price: "35 000 + 30 000 FCFA",
    badge: "Flexible",
    color: "from-emerald-600 to-emerald-800",
    features: [
      "2 versements espacés de 30 jours",
      "Traitement standard du dossier",
      "Suivi personnalisé inclus",
      "Accès tableau de bord candidat",
    ],
  },
  {
    id: "garanti",
    name: "Permis Garanti",
    price: "Sur devis",
    badge: "Premium",
    color: "from-amber-600 to-amber-800",
    features: [
      "Garantie d'obtention du permis",
      "Accompagnement complet A→Z",
      "Traitement ultra-prioritaire",
      "Conseiller dédié 24h/7j",
    ],
  },
];

const STEPS = [
  { id: 1, title: "Destination & Formule", icon: Globe },
  { id: 2, title: "Informations personnelles", icon: User },
  { id: 3, title: "Profil professionnel", icon: Briefcase },
  { id: 4, title: "Paiement", icon: CreditCard },
];

export default function OpenDossier() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    destination: "",
    formulaChosen: "integral" as "integral" | "echelonne" | "garanti",
    fullName: "",
    email: "",
    whatsappNumber: "",
    age: "",
    nationality: "",
    academicLevel: "",
    experienceYears: "",
    languageSkills: "",
    jobSector: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createApplication = trpc.application.createApplication.useMutation({
    onSuccess: (data) => {
      // Rediriger vers la vérification email (nouveau flux)
      navigate(`/verify-application-email?dossier=${data.dossierNumber}`);
    },
    onError: (err) => {
      setErrors({ submit: err.message });
    },
  });

  const update = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateStep = (s: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (s === 1) {
      if (!formData.destination) newErrors.destination = "Veuillez choisir une destination";
    }
    if (s === 2) {
      if (!formData.fullName.trim()) newErrors.fullName = "Le nom complet est requis";
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email invalide";
      if (!formData.whatsappNumber.trim()) newErrors.whatsappNumber = "Le numéro WhatsApp est requis";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(s => Math.min(s + 1, 4));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = () => {
    if (!validateStep(2)) { setStep(2); return; }
    createApplication.mutate({
      destination: formData.destination as "canada" | "luxembourg" | "pologne" | "europe" | "golfe" | "oceanie" | "caucase" | "autre",
      formulaChosen: formData.formulaChosen,
      fullName: formData.fullName,
      email: formData.email,
      whatsappNumber: formData.whatsappNumber,
      age: formData.age ? parseInt(formData.age) : undefined,
      nationality: formData.nationality || undefined,
      academicLevel: formData.academicLevel || undefined,
      experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
      languageSkills: formData.languageSkills || undefined,
      jobSector: formData.jobSector || undefined,
    });
  };

  const selectedDest = DESTINATIONS.find(d => d.value === formData.destination);
  const selectedFormula = FORMULAS.find(f => f.id === formData.formulaChosen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-8 px-4 text-center">
        <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30 text-sm px-4 py-1">
          Ouverture de dossier d'immigration
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black mb-3">
          Commencer votre <span className="text-blue-400">parcours</span>
        </h1>
        <p className="text-slate-300 text-lg max-w-xl mx-auto">
          Frais d'ouverture de dossier : <strong className="text-yellow-400">65 000 FCFA</strong> — non remboursables
        </p>
      </div>

      {/* Stepper */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isDone ? "bg-green-500 border-green-500" :
                    isActive ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/30" :
                    "bg-slate-800 border-slate-600"
                  }`}>
                    {isDone ? <CheckCircle className="w-5 h-5 text-white" /> : <Icon className="w-5 h-5 text-white" />}
                  </div>
                  <span className={`text-xs mt-1 text-center hidden sm:block ${isActive ? "text-blue-300 font-semibold" : "text-slate-500"}`}>
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${step > s.id ? "bg-green-500" : "bg-slate-700"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenu du formulaire */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">

          {/* Étape 1 — Destination & Formule */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-1">Choisissez votre destination</h2>
                <p className="text-slate-400 text-sm">Vers quel pays souhaitez-vous immigrer ?</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DESTINATIONS.map(dest => (
                  <button
                    key={dest.value}
                    onClick={() => update("destination", dest.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.destination === dest.value
                        ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                        : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <div className="font-semibold text-sm">{dest.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{dest.description}</div>
                  </button>
                ))}
              </div>
              {errors.destination && (
                <p className="text-red-400 text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4" />{errors.destination}</p>
              )}

              <div>
                <h2 className="text-2xl font-bold mb-1">Sélectionnez votre formule</h2>
                <p className="text-slate-400 text-sm">Choisissez le mode de paiement qui vous convient</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FORMULAS.map(formula => (
                  <button
                    key={formula.id}
                    onClick={() => update("formulaChosen", formula.id)}
                    className={`text-left p-5 rounded-xl border-2 transition-all duration-200 relative ${
                      formData.formulaChosen === formula.id
                        ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20 scale-[1.02]"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    }`}
                  >
                    {formula.badge && (
                      <span className={`absolute -top-2 right-3 text-xs px-2 py-0.5 rounded-full font-semibold bg-gradient-to-r ${formula.color} text-white`}>
                        {formula.badge}
                      </span>
                    )}
                    <div className="font-bold text-sm mb-1">{formula.name}</div>
                    <div className="text-yellow-400 font-black text-lg mb-3">{formula.price}</div>
                    <ul className="space-y-1.5">
                      {formula.features.map((f, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {/* Avertissement non-remboursable */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <strong>Important :</strong> Les frais d'ouverture de dossier de <strong>65 000 FCFA</strong> sont <strong>non remboursables</strong> une fois le paiement effectué, conformément aux conditions générales de 3M Travel Agency (RC/YAO/2019/A/2567).
                </div>
              </div>
            </div>
          )}

          {/* Étape 2 — Informations personnelles */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Vos informations personnelles</h2>
                <p className="text-slate-400 text-sm">Ces informations seront utilisées pour votre dossier d'immigration</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-slate-300 mb-1.5 block">Nom complet <span className="text-red-400">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.fullName}
                      onChange={e => update("fullName", e.target.value)}
                      placeholder="Ex: Jean-Baptiste NKOMO"
                      className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 ${errors.fullName ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Adresse email <span className="text-red-400">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={e => update("email", e.target.value)}
                      placeholder="votre@email.com"
                      className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 ${errors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Numéro WhatsApp <span className="text-red-400">*</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.whatsappNumber}
                      onChange={e => update("whatsappNumber", e.target.value)}
                      placeholder="+237 6XX XXX XXX"
                      className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 ${errors.whatsappNumber ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.whatsappNumber && <p className="text-red-400 text-xs mt-1">{errors.whatsappNumber}</p>}
                </div>
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Âge</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={e => update("age", e.target.value)}
                    placeholder="Ex: 28"
                    min={18} max={65}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Nationalité</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.nationality}
                      onChange={e => update("nationality", e.target.value)}
                      placeholder="Ex: Camerounaise"
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3 — Profil professionnel */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Votre profil professionnel</h2>
                <p className="text-slate-400 text-sm">Ces informations nous aident à identifier la meilleure procédure pour vous</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Niveau académique</Label>
                  <Select value={formData.academicLevel} onValueChange={v => update("academicLevel", v)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <GraduationCap className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bac">Baccalauréat</SelectItem>
                      <SelectItem value="bts">BTS / DUT</SelectItem>
                      <SelectItem value="licence">Licence (Bac+3)</SelectItem>
                      <SelectItem value="master">Master (Bac+5)</SelectItem>
                      <SelectItem value="doctorat">Doctorat</SelectItem>
                      <SelectItem value="sans">Sans diplôme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Années d'expérience</Label>
                  <Input
                    type="number"
                    value={formData.experienceYears}
                    onChange={e => update("experienceYears", e.target.value)}
                    placeholder="Ex: 5"
                    min={0} max={50}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Compétences linguistiques</Label>
                  <div className="relative">
                    <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.languageSkills}
                      onChange={e => update("languageSkills", e.target.value)}
                      placeholder="Ex: Français (C2), Anglais (B2)"
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300 mb-1.5 block">Secteur d'activité</Label>
                  <Select value={formData.jobSector} onValueChange={v => update("jobSector", v)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informatique">Informatique / IT</SelectItem>
                      <SelectItem value="sante">Santé / Médical</SelectItem>
                      <SelectItem value="batiment">Bâtiment / BTP</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="commerce">Commerce / Vente</SelectItem>
                      <SelectItem value="transport">Transport / Logistique</SelectItem>
                      <SelectItem value="education">Éducation / Formation</SelectItem>
                      <SelectItem value="finance">Finance / Comptabilité</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200">
                <Star className="w-4 h-4 inline mr-2 text-blue-400" />
                Ces informations sont <strong>optionnelles</strong> mais nous permettent de vous orienter vers la procédure la plus adaptée à votre profil.
              </div>
            </div>
          )}

          {/* Étape 4 — Récapitulatif & Paiement */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Récapitulatif & Paiement</h2>
                <p className="text-slate-400 text-sm">Vérifiez vos informations avant de procéder au paiement</p>
              </div>

              {/* Récap */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Destination</span>
                  <span className="font-semibold">{selectedDest?.label ?? formData.destination}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Formule</span>
                  <span className="font-semibold">{selectedFormula?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Nom complet</span>
                  <span className="font-semibold">{formData.fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Email</span>
                  <span className="font-semibold">{formData.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">WhatsApp</span>
                  <span className="font-semibold">{formData.whatsappNumber}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-slate-300 font-semibold">Montant à payer</span>
                  <span className="text-yellow-400 font-black text-xl">65 000 FCFA</span>
                </div>
              </div>

              {/* Modes de paiement */}
              <div>
                <p className="text-sm text-slate-400 mb-3">Modes de paiement acceptés via CinetPay :</p>
                <div className="flex flex-wrap gap-3">
                  {["MTN MoMo", "Orange Money", "Visa / Mastercard", "Moov Money"].map(mode => (
                    <div key={mode} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm font-medium">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      {mode}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sécurité */}
              <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-sm text-green-200">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  Paiement <strong>100% sécurisé</strong> via CinetPay — certifié PCI DSS. Vos données bancaires ne sont jamais stockées sur nos serveurs.
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.submit}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <Button
              variant="outline"
              onClick={step === 1 ? () => navigate("/") : prevStep}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? "Retour à l'accueil" : "Précédent"}
            </Button>

            {step < 4 ? (
              <Button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
              >
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createApplication.isPending}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 text-base"
              >
                {createApplication.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement...</>
                ) : (
                  <><CreditCard className="w-4 h-4 mr-2" />Payer 65 000 FCFA</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
