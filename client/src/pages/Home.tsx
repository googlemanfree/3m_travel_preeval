import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plane, Globe, GraduationCap, Briefcase, MapPin, Phone, Mail,
  Upload, CheckCircle2, ArrowRight, Users, FileText,
  Star, Clock, Shield, X, ChevronRight, ChevronLeft, Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────
type DestinationCategory = "schengen" | "canada" | "autre";
type VisaType =
  | "schengen_etude" | "schengen_tourisme" | "schengen_travail"
  | "canada_rp" | "canada_etude" | "canada_tourisme"
  | "autre";

// ─── Schema ───────────────────────────────────────────────────────────────────
const formSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  destinationCategory: z.enum(["schengen", "canada", "autre"]),
  destinationCountry: z.string().optional(),
  visaType: z.enum([
    "schengen_etude", "schengen_tourisme", "schengen_travail",
    "canada_rp", "canada_etude", "canada_tourisme", "autre"
  ]),
  educationLevel: z.string().optional(),
  employmentStatus: z.string().optional(),
  message: z.string().optional(),
  cvBase64: z.string().optional(),
  cvFileName: z.string().optional(),
  cvMimeType: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

// ─── Config ───────────────────────────────────────────────────────────────────
const VISA_OPTIONS: Record<DestinationCategory, { value: VisaType; label: string; desc: string; icon: React.ElementType }[]> = {
  schengen: [
    { value: "schengen_etude",    label: "Visa Étude",    desc: "Études supérieures en Europe",        icon: GraduationCap },
    { value: "schengen_tourisme", label: "Visa Tourisme", desc: "Voyage, vacances, visite familiale",  icon: Globe },
    { value: "schengen_travail",  label: "Visa Travail",  desc: "Emploi, mission professionnelle",     icon: Briefcase },
  ],
  canada: [
    { value: "canada_rp",        label: "Résidence Permanente", desc: "Immigration permanente au Canada", icon: Star },
    { value: "canada_etude",     label: "Visa Étude",           desc: "Études dans une université canadienne", icon: GraduationCap },
    { value: "canada_tourisme",  label: "Visa Tourisme",        desc: "Visite, tourisme, transit",      icon: Globe },
  ],
  autre: [
    { value: "autre", label: "Autre type de visa", desc: "Précisez votre pays de destination", icon: FileText },
  ],
};

const DESTINATION_CATEGORIES = [
  { id: "schengen" as DestinationCategory, label: "Espace Schengen", flag: "🇪🇺", description: "France, Allemagne, Espagne, Italie, Belgique..." },
  { id: "canada"   as DestinationCategory, label: "Canada",          flag: "🇨🇦", description: "Résidence permanente, études, tourisme" },
  { id: "autre"    as DestinationCategory, label: "Autre Pays",      flag: "🌍", description: "USA, Chine, Royaume-Uni, Australie..." },
];

// ─── Variants d'animation ─────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.25, ease: "easeInOut" as const } }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: "easeOut" as const },
  }),
};

// ─── Composant barre de progression ──────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  const steps = [
    { label: "Destination", icon: Globe },
    { label: "Type de visa", icon: FileText },
    { label: "Votre profil", icon: Users },
  ];
  const pct = ((step - 1) / (total - 1)) * 100;

  return (
    <div className="mb-10">
      {/* Barre de fond */}
      <div className="relative flex items-center justify-between mb-4">
        {/* Ligne de fond */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full z-0" />
        {/* Ligne de progression animée */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full z-0" style={{ background: 'linear-gradient(90deg, #7cb9e8, #1e3a8a)' }}
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
        />
        {/* Cercles d'étapes */}
        {steps.map((s, i) => {
          const stepNum = i + 1;
          const isCompleted = step > stepNum;
          const isCurrent  = step === stepNum;
          const Icon = s.icon;
          return (
            <div key={i} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                  backgroundColor: isCompleted ? "#1e3a8a" : isCurrent ? "#2563eb" : "#e5e7eb",
                }}
                transition={{ duration: 0.3, ease: "easeOut" as const }}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </motion.div>
                ) : (
                  <Icon className={`w-5 h-5 ${isCurrent ? "text-white" : "text-gray-400"}`} />
                )}
              </motion.div>
              <span className={`text-xs font-semibold whitespace-nowrap transition-colors duration-300 ${
                isCurrent ? "text-[#1e3a8a]" : isCompleted ? "text-[#2563eb]" : "text-gray-400"
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Pourcentage */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Étape <span className="font-bold text-[#1e3a8a]">{step}</span> sur {total}
        </p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #7cb9e8, #1e3a8a)' }}
              initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
        />
      </div>
          <span className="text-xs font-bold text-[#1e3a8a]">{Math.round(pct)}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<DestinationCategory | null>(null);
  const [selectedVisa, setSelectedVisa] = useState<VisaType | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvBase64, setCvBase64] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evalRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const submitMutation = trpc.evaluation.submit.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      reset();
      setStep(1);
      setDirection(1);
      setSelectedCategory(null);
      setSelectedVisa(null);
      setCvFile(null);
      setCvBase64("");
    },
    onError: (err) => {
      toast.error("Erreur lors de la soumission : " + err.message);
    },
  });

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleCategorySelect = (cat: DestinationCategory) => {
    setSelectedCategory(cat);
    setSelectedVisa(null);
    setValue("destinationCategory", cat);
    setValue("visaType", undefined as any);
    setTimeout(() => goTo(2), 150);
  };

  const handleVisaSelect = (visa: VisaType) => {
    setSelectedVisa(visa);
    setValue("visaType", visa);
    setTimeout(() => {
      goTo(3);
      setTimeout(() => evalRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }, 150);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Le fichier ne doit pas dépasser 5 Mo"); return; }
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) { toast.error("Format accepté : PDF, DOC, DOCX uniquement"); return; }
    setCvFile(file);
    setValue("cvFileName", file.name);
    setValue("cvMimeType", file.type);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setCvBase64(b64);
      setValue("cvBase64", b64);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setCvFile(null); setCvBase64("");
    setValue("cvBase64", ""); setValue("cvFileName", ""); setValue("cvMimeType", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (data: FormValues) => {
    submitMutation.mutate({ ...data, cvBase64: cvBase64 || undefined });
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/97 backdrop-blur-md border-b border-[#dbeafe] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img
              src="/manus-storage/logo_3m_d0e23210.jpeg"
              alt="3M Travel & Services"
              className="w-11 h-11 rounded-full object-cover shadow-md ring-2 ring-[#1e3a8a]/20"
            />
            <div>
              <div className="font-extrabold text-[#1e3a8a] text-base leading-tight">3M Travel & Services</div>
              <div className="text-xs text-[#2563eb] font-semibold">Votre mobilité, notre expertise</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#services" className="text-gray-600 hover:text-[#1e3a8a] font-medium transition-colors text-sm">Services</a>
            <a href="#evaluation" className="text-gray-600 hover:text-[#1e3a8a] font-medium transition-colors text-sm">Pré-évaluation</a>
            <a href="#contact" className="text-gray-600 hover:text-[#1e3a8a] font-medium transition-colors text-sm">Contact</a>
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <a href="tel:+237620996045">
              <Button className="bg-[#1e3a8a] hover:bg-[#2563eb] text-white text-sm font-semibold shadow-md transition-colors">
                <Phone className="w-4 h-4 mr-2" />+237 620-996-045
              </Button>
            </a>
            <a href="tel:+237698104832">
              <Button variant="outline" className="border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#eff6ff] text-sm font-semibold shadow-sm transition-colors">
                <Phone className="w-4 h-4 mr-2" />+237 698-104-832
              </Button>
            </a>
          </div>
          {/* Mobile : un seul bouton */}
          <a href="tel:+237620996045" className="md:hidden">
            <Button className="bg-[#1e3a8a] hover:bg-[#2563eb] text-white text-sm font-semibold shadow-md transition-colors">
              <Phone className="w-4 h-4 mr-2" />Appeler
            </Button>
          </a>
        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f2460 0%, #1e3a8a 40%, #2563eb 75%, #7cb9e8 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#7cb9e8] blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full border border-white/30">
              <Star className="w-4 h-4 text-yellow-300" />
              Évaluation gratuite en 24h
            </motion.div>
            {/* Logo centré dans le hero */}
            <motion.div variants={fadeUp} className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-white/20 blur-xl scale-125" />
                <img
                  src="/manus-storage/logo_3m_d0e23210.jpeg"
                  alt="3M Travel & Services"
                  className="relative w-24 h-24 rounded-full object-cover shadow-2xl ring-4 ring-white/40"
                />
              </div>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Votre Pré-Évaluation<br />
              <span className="text-[#7cb9e8]">Visa & Immigration</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-blue-100 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              Remplissez notre formulaire gratuit. Nos experts analysent votre profil et vous proposent les meilleures options pour réaliser votre projet.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <a href="#evaluation">
                <Button size="lg" className="bg-white hover:bg-[#dbeafe] text-[#1e3a8a] font-bold text-base shadow-xl px-8 active:scale-[0.97] transition-transform">
                  Commencer l'évaluation <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="tel:+237620996045">
                  <Button size="lg" variant="outline" className="border-white/70 text-white hover:bg-white/15 font-semibold text-base px-6 active:scale-[0.97] transition-transform w-full sm:w-auto">
                    <Phone className="w-4 h-4 mr-2" />+237 620-996-045
                  </Button>
                </a>
                <a href="tel:+237698104832">
                  <Button size="lg" variant="outline" className="border-white/70 text-white hover:bg-white/15 font-semibold text-base px-6 active:scale-[0.97] transition-transform w-full sm:w-auto">
                    <Phone className="w-4 h-4 mr-2" />+237 698-104-832
                  </Button>
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ─── SERVICES ────────────────────────────────────────────────────── */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Nos Services</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">3M Travel & Services vous accompagne dans toutes vos démarches de voyage et d'immigration.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Plane,    title: "Billets d'avion",    desc: "Meilleurs tarifs sur tous vols internationaux et domestiques",      color: "bg-[#dbeafe] text-[#1e3a8a]" },
              { icon: FileText, title: "Assistance Visa",    desc: "Accompagnement complet pour vos demandes de visa vers 8 pays",      color: "bg-[#eff6ff] text-[#2563eb]" },
              { icon: Globe,    title: "Tourisme & Hôtels",  desc: "Packages touristiques et réservations d'hôtels personnalisés",      color: "bg-[#e0f2fe] text-[#0369a1]" },
              { icon: Shield,   title: "Assurance Voyage",   desc: "Protection complète pour voyager l'esprit tranquille",              color: "bg-[#f0f9ff] text-[#7cb9e8]" },
            ].map((s, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}>
                <Card className="p-6 hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-blue-200 group h-full">
                  <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION ÉVALUATION ──────────────────────────────────────────── */}
      <section id="evaluation" className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Formulaire Gratuit</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Pré-Évaluation Gratuite</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Suivez les 3 étapes ci-dessous. Nos experts vous répondent sous 24h.
            </p>
          </motion.div>

          {isSubmitted ? (
            <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
            >
              <Card className="p-12 text-center border-green-200 bg-green-50 shadow-xl">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </motion.div>
                <h3 className="text-2xl font-bold text-green-900 mb-3">Demande envoyée avec succès !</h3>
                <p className="text-green-700 mb-6 max-w-md mx-auto">
                  Votre pré-évaluation a été soumise. Nos experts analyseront votre profil et vous contacteront dans les <strong>24 heures</strong>.
                </p>
                <Button onClick={() => setIsSubmitted(false)} className="bg-green-600 hover:bg-green-700 text-white active:scale-[0.97] transition-transform">
                  Faire une nouvelle demande
                </Button>
              </Card>
            </motion.div>
          ) : (
            <Card className="p-6 md:p-10 border-blue-100 shadow-xl overflow-hidden">
              {/* Barre de progression */}
              <ProgressBar step={step} total={3} />

              {/* Contenu animé par étape */}
              <div className="relative overflow-hidden min-h-[320px]">
                <AnimatePresence mode="wait" custom={direction}>

                  {/* ── ÉTAPE 1 : Destination ── */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        Choisissez votre destination
                      </h3>
                      <div className="grid gap-4">
                        {DESTINATION_CATEGORIES.map((cat, i) => (
                          <motion.button
                            key={cat.id}
                            type="button"
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCategorySelect(cat.id)}
                            className={`flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:ring-offset-2 ${
                              selectedCategory === cat.id
                                ? "border-[#1e3a8a] bg-[#eff6ff]"
                                : "border-gray-200 bg-white hover:border-[#7cb9e8]"
                            }`}
                          >
                            <span className="text-4xl leading-none">{cat.flag}</span>
                            <div className="flex-1">
                              <div className="font-bold text-gray-900 text-base">{cat.label}</div>
                              <div className="text-sm text-gray-500 mt-0.5">{cat.description}</div>
                            </div>
                            <ChevronRight className={`w-5 h-5 transition-colors ${selectedCategory === cat.id ? "text-blue-600" : "text-gray-300"}`} />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ── ÉTAPE 2 : Type de visa ── */}
                  {step === 2 && selectedCategory && (
                    <motion.div
                      key="step2"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          Sélectionnez le type de visa
                        </h3>
                        <button
                          type="button"
                          onClick={() => goTo(1)}
                          className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                        >
                          ← Modifier
                        </button>
                      </div>
                      {/* Destination choisie */}
                      <div className="flex items-center gap-2 mb-6 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                        <span className="text-2xl">{DESTINATION_CATEGORIES.find(c => c.id === selectedCategory)?.flag}</span>
                        <span className="font-semibold text-blue-900 text-sm">{DESTINATION_CATEGORIES.find(c => c.id === selectedCategory)?.label}</span>
                      </div>
                      <div className="grid gap-4">
                        {VISA_OPTIONS[selectedCategory].map((visa, i) => {
                          const Icon = visa.icon;
                          return (
                            <motion.button
                              key={visa.value}
                              type="button"
                              custom={i}
                              variants={fadeUp}
                              initial="hidden"
                              animate="visible"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleVisaSelect(visa.value)}
                              className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:ring-offset-2 ${
                                selectedVisa === visa.value
                                  ? "border-[#1e3a8a] bg-[#eff6ff]"
                                  : "border-gray-200 bg-white hover:border-[#7cb9e8]"
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                selectedVisa === visa.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                              }`}>
                                <Icon className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-gray-900">{visa.label}</div>
                                <div className="text-sm text-gray-500 mt-0.5">{visa.desc}</div>
                              </div>
                              <ChevronRight className={`w-5 h-5 transition-colors ${selectedVisa === visa.value ? "text-blue-600" : "text-gray-300"}`} />
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* ── ÉTAPE 3 : Formulaire profil ── */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      ref={evalRef as any}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          Remplissez votre profil
                        </h3>
                        <button
                          type="button"
                          onClick={() => goTo(2)}
                          className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                        >
                          ← Modifier
                        </button>
                      </div>

                      {/* Récapitulatif sélections */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                          {DESTINATION_CATEGORIES.find(c => c.id === selectedCategory)?.flag} {DESTINATION_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-200">
                          {VISA_OPTIONS[selectedCategory!]?.find(v => v.value === selectedVisa)?.label}
                        </span>
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Infos personnelles */}
                        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="fullName" className="text-gray-700 font-semibold text-sm">Nom complet *</Label>
                            <Input id="fullName" placeholder="Jean Dupont" {...register("fullName")} className="border-gray-200 focus:border-blue-500" />
                            {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">Email *</Label>
                            <Input id="email" type="email" placeholder="jean@example.com" {...register("email")} className="border-gray-200 focus:border-blue-500" />
                            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="phone" className="text-gray-700 font-semibold text-sm">Téléphone *</Label>
                            <Input id="phone" placeholder="+237 620-996-045" {...register("phone")} className="border-gray-200 focus:border-blue-500" />
                            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="dateOfBirth" className="text-gray-700 font-semibold text-sm">Date de naissance</Label>
                            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} className="border-gray-200 focus:border-blue-500" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="nationality" className="text-gray-700 font-semibold text-sm">Nationalité</Label>
                            <Input id="nationality" placeholder="Camerounaise" {...register("nationality")} className="border-gray-200 focus:border-blue-500" />
                          </div>
                          {selectedCategory === "autre" && (
                            <div className="space-y-1">
                              <Label htmlFor="destinationCountry" className="text-gray-700 font-semibold text-sm">Pays de destination *</Label>
                              <Input id="destinationCountry" placeholder="Ex: États-Unis, Australie..." {...register("destinationCountry")} className="border-gray-200 focus:border-blue-500" />
                            </div>
                          )}
                        </motion.div>

                        {/* Profil académique */}
                        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-gray-700 font-semibold text-sm">Niveau d'études</Label>
                            <Select onValueChange={(v) => setValue("educationLevel", v)}>
                              <SelectTrigger className="border-gray-200 focus:border-blue-500">
                                <SelectValue placeholder="Sélectionnez votre niveau" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bac">Baccalauréat</SelectItem>
                                <SelectItem value="bac2">Bac+2 (BTS, DUT)</SelectItem>
                                <SelectItem value="bac3">Bac+3 (Licence)</SelectItem>
                                <SelectItem value="bac5">Bac+5 (Master)</SelectItem>
                                <SelectItem value="bac8">Bac+8 (Doctorat)</SelectItem>
                                <SelectItem value="autre">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-gray-700 font-semibold text-sm">Situation professionnelle</Label>
                            <Select onValueChange={(v) => setValue("employmentStatus", v)}>
                              <SelectTrigger className="border-gray-200 focus:border-blue-500">
                                <SelectValue placeholder="Votre situation actuelle" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="etudiant">Étudiant(e)</SelectItem>
                                <SelectItem value="employe">Employé(e)</SelectItem>
                                <SelectItem value="independant">Travailleur indépendant</SelectItem>
                                <SelectItem value="chomeur">En recherche d'emploi</SelectItem>
                                <SelectItem value="retraite">Retraité(e)</SelectItem>
                                <SelectItem value="autre">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </motion.div>

                        {/* Upload CV */}
                        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible">
                          <Label className="text-gray-700 font-semibold text-sm mb-2 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-blue-600" />
                            Pièce jointe (CV)
                          </Label>
                          <div
                            className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer hover:border-blue-400 hover:bg-blue-50 ${
                              cvFile ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50"
                            }`}
                            onClick={() => !cvFile && fileInputRef.current?.click()}
                          >
                            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                            {cvFile ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div className="text-left">
                                    <p className="font-semibold text-green-900 text-sm">{cvFile.name}</p>
                                    <p className="text-xs text-green-600">{(cvFile.size / 1024).toFixed(0)} Ko</p>
                                  </div>
                                </div>
                                <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                  className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors">
                                  <X className="w-3.5 h-3.5 text-red-600" />
                                </button>
                              </div>
                            ) : (
                              <div>
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="font-semibold text-gray-700 text-sm mb-1">Glissez votre CV ici ou cliquez</p>
                                <p className="text-xs text-gray-400">PDF, DOC, DOCX — Max 5 Mo</p>
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* Message */}
                        <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="space-y-1">
                          <Label htmlFor="message" className="text-gray-700 font-semibold text-sm">Message complémentaire</Label>
                          <Textarea
                            id="message"
                            placeholder="Décrivez votre projet, vos motivations ou toute information utile..."
                            {...register("message")}
                            rows={3}
                            className="border-gray-200 focus:border-blue-500 resize-none"
                          />
                        </motion.div>

                        {/* Bouton soumettre */}
                        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible">
                          <Button
                            type="submit"
                            disabled={submitMutation.isPending}
                            className="w-full text-white text-base font-bold py-6 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}
                          >
                            {submitMutation.isPending ? (
                              <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Envoi en cours...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                Soumettre ma pré-évaluation
                              </span>
                            )}
                          </Button>
                          <p className="text-xs text-gray-400 text-center mt-3">
                            * Champs obligatoires. Données traitées de manière confidentielle. Réponse sous 24h.
                          </p>
                        </motion.div>
                      </form>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* ─── POURQUOI NOUS ───────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Pourquoi nous choisir</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">L'expertise à votre service</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield,       title: "Expertise réglementée",      desc: "Professionnels experts en visa et immigration internationale",   color: "text-[#1e3a8a] bg-[#dbeafe]" },
              { icon: Users,        title: "Accompagnement personnalisé", desc: "Analyse de votre profil pour des solutions sur mesure",         color: "text-[#2563eb] bg-[#eff6ff]" },
              { icon: Clock,        title: "Réponse rapide",              desc: "Retour de nos experts sous 24h après soumission",               color: "text-[#0369a1] bg-[#e0f2fe]" },
              { icon: CheckCircle2, title: "Taux de succès élevé",        desc: "Des centaines de dossiers traités avec succès chaque année",    color: "text-[#7cb9e8] bg-[#f0f9ff]" },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} className="text-center p-6">
                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* ─── TÉMOIGNAGES ─────────────────────────────────────────────────── */}
      <TestimonialsSection />

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Prêt à réaliser votre projet ?</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">Contactez nos experts dès aujourd'hui pour une consultation gratuite et personnalisée.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#evaluation">
              <Button size="lg" className="bg-white hover:bg-[#dbeafe] text-[#1e3a8a] font-bold shadow-xl px-8 active:scale-[0.97] transition-transform">
                Pré-évaluation gratuite <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="mailto:hello@3mtravelegency.com">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8 active:scale-[0.97] transition-transform">
                <Mail className="w-4 h-4 mr-2" />Nous écrire
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer id="contact" style={{ background: 'linear-gradient(180deg, #0f1e4a 0%, #0a1230 100%)' }} className="text-gray-400 py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/manus-storage/logo_3m_d0e23210.jpeg"
                  alt="3M Travel & Services"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#7cb9e8]/40 shadow-lg"
                />
                <div>
                  <div className="font-bold text-white text-sm leading-tight">3M Travel & Services</div>
                  <div className="text-xs text-[#7cb9e8]">SARL</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3">Votre partenaire de confiance pour tous vos besoins de voyage et visa.</p>
              <p className="text-xs text-gray-600">RC/YAO/2019/A/2567 | NIU: M112417203369H</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Services</h4>
              <ul className="space-y-2 text-sm">
                {["Visa & Immigration", "Billets d'avion", "Hôtels & Tourisme", "Assurance voyage", "Marketing digital"].map(s => (
                  <li key={s}><a href="#services" className="hover:text-[#7cb9e8] transition-colors">{s}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Destinations</h4>
              <ul className="space-y-2 text-sm">
                {["🇫🇷 France", "🇩🇪 Allemagne", "🇬🇧 Royaume-Uni", "🇨🇦 Canada", "🇧🇪 Belgique", "🇮🇹 Italie"].map(d => (
                  <li key={d}><span className="hover:text-[#7cb9e8] transition-colors cursor-pointer">{d}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Contact</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#7cb9e8] mt-0.5 flex-shrink-0" />
                  <span>Yaoundé Biyem-Assi, Montée chapelle Obili (10m de EHS)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#7cb9e8] flex-shrink-0" />
                  <a href="tel:+237620996045" className="hover:text-[#7cb9e8]">+237 620-996-045</a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#7cb9e8] flex-shrink-0" />
                  <a href="tel:+237698104832" className="hover:text-[#7cb9e8]">+237 698-104-832</a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#7cb9e8] flex-shrink-0" />
                  <a href="mailto:hello@3mtravelegency.com" className="hover:text-[#7cb9e8]">hello@3mtravelegency.com</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
            <p>© 2026 3M Travel & Services SARL. Tous droits réservés.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-[#7cb9e8] transition-colors">Politique de confidentialité</a>
              <a href="#" className="hover:text-[#7cb9e8] transition-colors">Conditions d'utilisation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Composant Témoignages ────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Aminata Diallo",
    country: "France",
    flag: "🇫🇷",
    visa: "Visa Étude",
    rating: 5,
    avatar: "AD",
    color: "bg-[#1e3a8a]",
    text: "Grâce à 3M Travel & Services, j'ai obtenu mon visa étudiant pour la France en seulement 3 semaines. L'équipe m'a accompagnée à chaque étape, de la constitution du dossier jusqu'à l'obtention du visa. Je recommande vivement !",
    date: "Mars 2025",
  },
  {
    name: "Jean-Pierre Mbarga",
    country: "Canada",
    flag: "🇨🇦",
    visa: "Résidence Permanente",
    rating: 5,
    avatar: "JM",
    color: "bg-[#2563eb]",
    text: "Mon dossier de résidence permanente au Canada semblait complexe, mais l'équipe de 3M a su le gérer avec professionnalisme. Aujourd'hui je vis au Canada avec toute ma famille. Merci infiniment !",
    date: "Janvier 2025",
  },
  {
    name: "Fatou Ndiaye",
    country: "Allemagne",
    flag: "🇩🇪",
    visa: "Visa Travail",
    rating: 5,
    avatar: "FN",
    color: "bg-[#0369a1]",
    text: "J'avais essayé seule pendant des mois sans succès. En confiant mon dossier à 3M Travel, j'ai obtenu mon visa de travail pour l'Allemagne en 6 semaines. Service impeccable et très réactif.",
    date: "Février 2025",
  },
  {
    name: "Emmanuel Talla",
    country: "Belgique",
    flag: "🇧🇪",
    visa: "Visa Tourisme",
    rating: 5,
    avatar: "ET",
    color: "bg-[#1e3a8a]",
    text: "Excellente expérience ! 3M Travel a géré mon visa Schengen pour la Belgique avec une rapidité impressionnante. Conseils clairs, suivi régulier et résultat positif. Je ferai appel à eux pour mon prochain voyage.",
    date: "Avril 2025",
  },
  {
    name: "Marie-Claire Essomba",
    country: "Canada",
    flag: "🇨🇦",
    visa: "Visa Étude",
    rating: 5,
    avatar: "ME",
    color: "bg-[#2563eb]",
    text: "Admise dans une université canadienne, j'avais besoin d'un visa rapidement. 3M Travel a monté un dossier solide et j'ai obtenu mon visa en temps record. Professionnalisme et efficacité au rendez-vous !",
    date: "Juin 2025",
  },
  {
    name: "Patrick Nguema",
    country: "Espagne",
    flag: "🇪🇸",
    visa: "Visa Schengen",
    rating: 5,
    avatar: "PN",
    color: "bg-[#0369a1]",
    text: "Après deux refus de visa, j'ai fait appel à 3M Travel & Services. Ils ont analysé mes dossiers précédents, identifié les erreurs et monté un nouveau dossier béton. Résultat : visa accordé du premier coup !",
    date: "Mai 2025",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

function TestimonialsSection() {
  const [active, setActive] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const total = TESTIMONIALS.length;

  // Auto-play every 5s
  React.useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setActive(prev => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [total]);

  const goTo = (idx: number) => {
    setDirection(idx > active ? 1 : -1);
    setActive(idx);
  };
  const prev = () => goTo((active - 1 + total) % total);
  const next = () => goTo((active + 1) % total);

  // Show 3 cards on desktop: active-1, active, active+1
  const visibleIndices = [
    (active - 1 + total) % total,
    active,
    (active + 1) % total,
  ];

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, scale: 0.95 }),
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-[#f0f7ff] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          className="text-center mb-14"
        >
          <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Témoignages</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            Ils ont obtenu leur visa avec 3M Travel
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Des centaines de clients nous font confiance chaque année. Voici ce qu'ils disent de leur expérience.
          </p>
          {/* Stats bar */}
          <div className="flex flex-wrap justify-center gap-8 mt-8">
            {[
              { value: "500+", label: "Visas obtenus" },
              { value: "98%", label: "Taux de succès" },
              { value: "24h", label: "Délai de réponse" },
              { value: "8", label: "Pays couverts" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-extrabold text-[#1e3a8a]">{stat.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Carousel desktop: 3 cards */}
        <div className="hidden md:block relative">
          <div className="grid grid-cols-3 gap-6">
            {visibleIndices.map((idx, pos) => {
              const t = TESTIMONIALS[idx];
              const isCenter = pos === 1;
              return (
                <motion.div
                  key={`${idx}-${active}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className={`relative rounded-3xl p-7 flex flex-col gap-4 transition-all duration-300 ${
                    isCenter
                      ? "bg-white shadow-2xl border-2 border-[#1e3a8a]/20 scale-105 z-10"
                      : "bg-white/70 shadow-md border border-gray-100 opacity-80"
                  }`}
                >
                  {/* Quote icon */}
                  <div className="absolute top-5 right-6 opacity-10">
                    <Quote className="w-12 h-12 text-[#1e3a8a]" />
                  </div>
                  {/* Stars */}
                  <StarRating rating={t.rating} />
                  {/* Text */}
                  <p className="text-gray-700 text-sm leading-relaxed flex-1 italic">"{t.text}"</p>
                  {/* Author */}
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <div className={`w-11 h-11 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}>
                      {t.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-sm truncate">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.date}</div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#eff6ff] rounded-full px-3 py-1">
                      <span className="text-base leading-none">{t.flag}</span>
                      <span className="text-xs font-semibold text-[#1e3a8a] whitespace-nowrap">{t.visa}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Carousel mobile: 1 card */}
        <div className="md:hidden relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-3xl p-6 shadow-xl border border-[#1e3a8a]/10"
            >
              <div className="relative">
                <div className="absolute top-0 right-0 opacity-10">
                  <Quote className="w-10 h-10 text-[#1e3a8a]" />
                </div>
                <StarRating rating={TESTIMONIALS[active].rating} />
                <p className="text-gray-700 text-sm leading-relaxed mt-3 italic">"{TESTIMONIALS[active].text}"</p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                  <div className={`w-11 h-11 rounded-full ${TESTIMONIALS[active].color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {TESTIMONIALS[active].avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-sm">{TESTIMONIALS[active].name}</div>
                    <div className="text-xs text-gray-500">{TESTIMONIALS[active].date}</div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#eff6ff] rounded-full px-2.5 py-1">
                    <span className="text-sm">{TESTIMONIALS[active].flag}</span>
                    <span className="text-xs font-semibold text-[#1e3a8a]">{TESTIMONIALS[active].visa}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border-2 border-[#1e3a8a] text-[#1e3a8a] flex items-center justify-center hover:bg-[#1e3a8a] hover:text-white transition-colors active:scale-95"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === active ? "w-6 h-3 bg-[#1e3a8a]" : "w-3 h-3 bg-gray-300 hover:bg-[#7cb9e8]"
                }`}
                aria-label={`Témoignage ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-10 h-10 rounded-full border-2 border-[#1e3a8a] text-[#1e3a8a] flex items-center justify-center hover:bg-[#1e3a8a] hover:text-white transition-colors active:scale-95"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
