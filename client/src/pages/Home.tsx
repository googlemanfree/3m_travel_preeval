import React, { useRef, useState } from "react";
import { useLocation } from 'wouter';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plane, Globe, GraduationCap, Briefcase, MapPin, Phone, Mail,
  Upload, CheckCircle2, ArrowRight, Users, FileText,
  Star, Clock, Shield, X, ChevronRight, ChevronLeft, Quote,
  CheckCircle, AlertCircle, Info, BookOpen, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

import ServicesSection from "@/components/ServicesSection";
import HeroSection from "@/components/HeroSection";
import { SimpleMultiProjectForm } from "@/components/SimpleMultiProjectForm";
import { CredibilityBadge } from "@/components/CredibilityBadge";

import { EvaluationFormModal } from "@/components/EvaluationFormModal";
import { VisasCarousel } from "@/components/VisasCarousel";
import { SimulatorExpress } from "@/components/SimulatorExpress";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { FooterLegal } from "@/components/FooterLegal";

// ─── Composant Barre de Recherche avec Auto-complétion ────────────────────────
import { searchCountries, countriesData } from '@/data/countriesData';
import CountrySearchResults from '@/components/CountrySearchResults';

// ─── Constantes ───────────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = "237698104832";

const SearchBarWithAutocomplete = () => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState(countriesData.slice(0, 0));

  const destinations = [
    { emoji: '🇨🇦', name: 'Canada', type: 'destination' },
    { emoji: '🇫🇷', name: 'France', type: 'destination' },
    { emoji: '🇦🇪', name: 'Dubaï', type: 'destination' },
    { emoji: '🇩🇪', name: 'Allemagne', type: 'destination' },
    { emoji: '🇬🇧', name: 'Royaume-Uni', type: 'destination' },
    { emoji: '🇦🇺', name: 'Australie', type: 'destination' },
    { emoji: '🇧🇪', name: 'Belgique', type: 'destination' },
    { emoji: '🇵🇱', name: 'Pologne', type: 'destination' },
  ];

  const procedures = [
    { emoji: '🎓', name: 'Visa Étudiant', type: 'procedure' },
    { emoji: '💼', name: 'Permis de Travail', type: 'procedure' },
    { emoji: '🏠', name: 'Résidence Permanente', type: 'procedure' },
    { emoji: '✈️', name: 'Visa Visiteur', type: 'procedure' },
  ];

  const allItems = [...destinations, ...procedures];
  const filteredItems = query.length > 0 
    ? allItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
    : [];
  
  // Résultats détaillés des pays
  const detailedResults = query.length > 2 ? searchCountries(query) : [];

  return (
    <div className="relative">
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Cherchez un pays, une procédure..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onFocus={() => setShowSuggestions(query.length > 0)}
          className="w-full px-5 py-3 rounded-lg bg-white/15 backdrop-blur-md border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:bg-white/20 transition-all duration-300 font-medium"
        />
        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Résultats détaillés des pays */}
      {detailedResults.length > 0 && (
        <CountrySearchResults countries={detailedResults} />
      )}

      {/* Menu déroulant d'auto-complétion */}
      <AnimatePresence>
        {showSuggestions && filteredItems.length > 0 && detailedResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0f1e4a]/95 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl z-50 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {/* Destinations */}
              {filteredItems.some(item => item.type === 'destination') && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-white/60 bg-white/5 border-b border-white/10">
                    🌍 Destinations
                  </div>
                  {filteredItems.filter(item => item.type === 'destination').map((item, idx) => (
                    <motion.a
                      key={idx}
                      href="/procedures"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.02 * idx }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors cursor-pointer border-b border-white/5 last:border-b-0"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-white font-medium">{item.name}</span>
                    </motion.a>
                  ))}
                </>
              )}

              {/* Procédures */}
              {filteredItems.some(item => item.type === 'procedure') && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-white/60 bg-white/5 border-b border-white/10">
                    📋 Procédures
                  </div>
                  {filteredItems.filter(item => item.type === 'procedure').map((item, idx) => (
                    <motion.a
                      key={idx}
                      href="/procedures"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.02 * idx }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors cursor-pointer border-b border-white/5 last:border-b-0"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-white font-medium">{item.name}</span>
                    </motion.a>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags de destinations populaires */}
      <div className="flex flex-wrap gap-2">
        {[
          { emoji: '🇨🇦', name: 'Canada', href: '/procedures' },
          { emoji: '🇫🇷', name: 'France', href: '/procedures' },
          { emoji: '🇦🇪', name: 'Dubaï', href: '/procedures' },
          { emoji: '🇩🇪', name: 'Allemagne', href: '/procedures' },
          { emoji: '🇬🇧', name: 'UK', href: '/procedures' },
          { emoji: '🇦🇺', name: 'Australie', href: '/procedures' },
        ].map((dest, idx) => (
          <motion.a
            key={idx}
            href={dest.href}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * idx }}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/30 text-white text-xs font-semibold hover:bg-white/20 transition-all duration-200 cursor-pointer"
          >
            <span>{dest.emoji}</span>
            <span>{dest.name}</span>
          </motion.a>
        ))}
      </div>
    </div>
  );
};

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
/** Popup de contact du concepteur — CTA discret dans le footer */
function DevContactPopup() {
  const [open, setOpen] = useState(false);
  const WA_URL = "https://wa.me/237694292843?text=Bonjour%20M.%20Aureol%20Donfack%2C%20j%27ai%20visit%C3%A9%20le%20site%203M%20Travel%20et%20je%20suis%20tr%C3%A8s%20int%C3%A9ress%C3%A9%20par%20vos%20services%20de%20d%C3%A9veloppement%20pour%20mon%20projet.";
  const MAIL_URL = "mailto:aureoldonfack@gmail.com?subject=Demande%20de%20cr%C3%A9ation%20de%20site%20web%20similaire%20%C3%A0%203M%20Travel";

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 text-[#7cb9e8] font-semibold hover:text-white transition-colors duration-300 underline-offset-2 hover:underline"
      >
        🚀 Obtenir un site similaire
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Pop-up */}
          <div className="fixed z-50 left-1/2 bottom-20 -translate-x-1/2 w-[90vw] max-w-sm bg-[#0f1e4a] border border-white/10 rounded-2xl shadow-2xl p-6 text-left">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-white text-lg leading-none"
              aria-label="Fermer"
            >×</button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7cb9e8] to-[#2563eb] flex items-center justify-center text-white font-black text-lg">
                AD
              </div>
              <div>
                <p className="text-white font-bold text-sm">Aureol Donfack</p>
                <p className="text-gray-400 text-xs">Développeur Full-Stack • IT Engineer</p>
              </div>
            </div>

            <p className="text-gray-300 text-xs leading-relaxed mb-5">
              Vous souhaitez un site web professionnel, moderne et performant comme celui-ci ? Contactez-moi directement :
            </p>

            <div className="flex flex-col gap-3">
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors duration-200"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contacter sur WhatsApp
              </a>
              <a
                href={MAIL_URL}
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-gray-200 text-sm font-semibold px-4 py-3 rounded-xl transition-colors duration-200 border border-white/10"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Envoyer un email
              </a>
            </div>

            <p className="text-gray-600 text-xs text-center mt-4">
              aureoldonfack@gmail.com
            </p>
          </div>
        </>
      )}
    </>
  );
}

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
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<DestinationCategory | null>(null);
  const [selectedVisa, setSelectedVisa] = useState<VisaType | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvBase64, setCvBase64] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evalRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    trigger,
    formState: { errors, touchedFields, dirtyFields, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // Surveiller les champs obligatoires pour la complétion
  const watchedName  = watch("fullName");
  const watchedEmail = watch("email");
  const watchedPhone = watch("phone");
  const watchedMsg   = watch("message") ?? "";

  // Calcul du % de complétion de l'étape 3
  const requiredFilled = [
    watchedName && watchedName.length >= 2,
    watchedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail),
    watchedPhone && watchedPhone.length >= 8,
  ];
  const completionPct = Math.round((requiredFilled.filter(Boolean).length / requiredFilled.length) * 100);

  // Helper : état d'un champ (idle | valid | error)
  const fieldState = (name: keyof FormValues): "idle" | "valid" | "error" => {
    const touched = touchedFields[name] || dirtyFields[name];
    if (!touched) return "idle";
    return errors[name] ? "error" : "valid";
  };

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

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <HeroSection
        onEvalClick={() => setShowEvalModal(true)}
        logoUrl="/manus-storage/logo_3m_d0e23210.jpeg"
        whatsappNumber={WHATSAPP_NUMBER}
      />

      {/* ─── SERVICES ────────────────────────────────────────────────────── */}
      <section id="services" className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <p className="text-xs md:text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Nos Services</p>
            <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-3 md:mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto">3M Travel & Services vous accompagne dans toutes vos démarches de voyage et d'immigration.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Plane,    title: "Billets d'avion",    desc: "Meilleurs tarifs sur tous vols internationaux et domestiques",      color: "bg-[#dbeafe] text-[#1e3a8a]", href: "/flights" },
              { icon: FileText, title: "Assistance Visa",    desc: "Accompagnement complet pour vos demandes de visa vers 8 pays",      color: "bg-[#eff6ff] text-[#2563eb]", href: "/procedures" },
              { icon: Globe,    title: "Tourisme & Hôtels",  desc: "Packages touristiques et réservations d'hôtels personnalisés",      color: "bg-[#e0f2fe] text-[#0369a1]", href: "#" },
              { icon: Shield,   title: "Assurance Voyage",   desc: "Protection complète pour voyager l'esprit tranquille",              color: "bg-[#f0f9ff] text-[#7cb9e8]", href: "/assurance" },
            ].map((s, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}>
                <a href={s.href} className="block h-full group">
                  <Card className="p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-blue-200 h-full cursor-pointer">
                    <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <s.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">{s.desc}</p>
                    <div className="mt-4 flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-semibold">En savoir plus</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </Card>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION NOS DOMAINES D'EXPERTISE ──────────────────────────── */}
      <ServicesSection />

      {/* ─── SECTION ÉVALUATION ──────────────────────────────────────────── */}
      <section id="evaluation" className="py-12 md:py-20 bg-gradient-to-b from-blue-50 to-white">
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

                      {/* Indicateur de complétion */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-gray-500">Complétion du formulaire</span>
                          <span className={`text-xs font-bold ${
                            completionPct === 100 ? "text-green-600" : completionPct >= 66 ? "text-blue-600" : "text-orange-500"
                          }`}>{completionPct}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full transition-all"
                            style={{ background: completionPct === 100 ? "#16a34a" : completionPct >= 66 ? "linear-gradient(90deg,#7cb9e8,#1e3a8a)" : "#f97316" }}
                            animate={{ width: `${completionPct}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" as const }}
                          />
                        </div>
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Infos personnelles */}
                        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-4">
                          {/* Nom complet */}
                          <div className="space-y-1">
                            <Label htmlFor="fullName" className="text-gray-700 font-semibold text-sm flex items-center gap-1">
                              Nom complet <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="fullName"
                                placeholder="Jean Dupont"
                                {...register("fullName")}
                                aria-invalid={fieldState("fullName") === "error"}
                                className={`pr-9 transition-colors ${
                                  fieldState("fullName") === "valid" ? "border-green-500 focus:border-green-500 bg-green-50/30" :
                                  fieldState("fullName") === "error" ? "border-red-400 focus:border-red-400 bg-red-50/30" :
                                  "border-gray-200 focus:border-blue-500"
                                }`}
                              />
                              <AnimatePresence mode="wait">
                                {fieldState("fullName") === "valid" && (
                                  <motion.span key="ok" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </motion.span>
                                )}
                                {fieldState("fullName") === "error" && (
                                  <motion.span key="err" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                            <AnimatePresence>
                              {fieldState("fullName") === "error" && (
                                <motion.p key="msg" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="text-red-500 text-xs flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />{errors.fullName?.message}
                                </motion.p>
                              )}
                              {fieldState("fullName") === "valid" && (
                                <motion.p key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="text-green-600 text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />Parfait !
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Email */}
                          <div className="space-y-1">
                            <Label htmlFor="email" className="text-gray-700 font-semibold text-sm flex items-center gap-1">
                              Email <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="email"
                                type="email"
                                placeholder="jean@example.com"
                                {...register("email")}
                                aria-invalid={fieldState("email") === "error"}
                                className={`pr-9 transition-colors ${
                                  fieldState("email") === "valid" ? "border-green-500 focus:border-green-500 bg-green-50/30" :
                                  fieldState("email") === "error" ? "border-red-400 focus:border-red-400 bg-red-50/30" :
                                  "border-gray-200 focus:border-blue-500"
                                }`}
                              />
                              <AnimatePresence mode="wait">
                                {fieldState("email") === "valid" && (
                                  <motion.span key="ok" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </motion.span>
                                )}
                                {fieldState("email") === "error" && (
                                  <motion.span key="err" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                            <AnimatePresence>
                              {fieldState("email") === "error" && (
                                <motion.p key="msg" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="text-red-500 text-xs flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />{errors.email?.message}
                                </motion.p>
                              )}
                              {fieldState("email") === "valid" && (
                                <motion.p key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="text-green-600 text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />Adresse email valide
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Téléphone */}
                          <div className="space-y-1">
                            <Label htmlFor="phone" className="text-gray-700 font-semibold text-sm flex items-center gap-1">
                              Téléphone <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="phone"
                                placeholder="+237 620-996-045"
                                {...register("phone")}
                                aria-invalid={fieldState("phone") === "error"}
                                className={`pr-9 transition-colors ${
                                  fieldState("phone") === "valid" ? "border-green-500 focus:border-green-500 bg-green-50/30" :
                                  fieldState("phone") === "error" ? "border-red-400 focus:border-red-400 bg-red-50/30" :
                                  "border-gray-200 focus:border-blue-500"
                                }`}
                              />
                              <AnimatePresence mode="wait">
                                {fieldState("phone") === "valid" && (
                                  <motion.span key="ok" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </motion.span>
                                )}
                                {fieldState("phone") === "error" && (
                                  <motion.span key="err" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                            <AnimatePresence>
                              {fieldState("phone") === "error" && (
                                <motion.p key="msg" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="text-red-500 text-xs flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />{errors.phone?.message}
                                </motion.p>
                              )}
                              {fieldState("phone") === "valid" && (
                                <motion.p key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="text-green-600 text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />Numéro valide
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Date de naissance */}
                          <div className="space-y-1">
                            <Label htmlFor="dateOfBirth" className="text-gray-700 font-semibold text-sm">Date de naissance</Label>
                            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} className="border-gray-200 focus:border-blue-500" />
                          </div>

                          {/* Nationalité */}
                          <div className="space-y-1">
                            <Label htmlFor="nationality" className="text-gray-700 font-semibold text-sm">Nationalité</Label>
                            <Input id="nationality" placeholder="Camerounaise" {...register("nationality")} className="border-gray-200 focus:border-blue-500" />
                          </div>

                          {/* Pays de destination (Autre) */}
                          {selectedCategory === "autre" && (
                            <div className="space-y-1">
                              <Label htmlFor="destinationCountry" className="text-gray-700 font-semibold text-sm flex items-center gap-1">
                                Pays de destination <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  id="destinationCountry"
                                  placeholder="Ex: États-Unis, Australie..."
                                  {...register("destinationCountry")}
                                  className="border-gray-200 focus:border-blue-500"
                                />
                              </div>
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
                          <div className="flex items-center justify-between">
                            <Label htmlFor="message" className="text-gray-700 font-semibold text-sm flex items-center gap-1">
                              <Info className="w-3.5 h-3.5 text-blue-400" />
                              Message complémentaire
                            </Label>
                            <span className={`text-xs font-medium tabular-nums ${
                              watchedMsg.length > 450 ? "text-red-500" :
                              watchedMsg.length > 300 ? "text-orange-500" :
                              watchedMsg.length > 0 ? "text-blue-500" : "text-gray-400"
                            }`}>{watchedMsg.length}/500</span>
                          </div>
                          <Textarea
                            id="message"
                            placeholder="Décrivez votre projet, vos motivations, votre situation actuelle ou toute information utile pour notre équipe..."
                            {...register("message", { maxLength: { value: 500, message: "500 caractères maximum" } })}
                            rows={4}
                            maxLength={500}
                            className={`resize-none transition-colors ${
                              watchedMsg.length > 450 ? "border-red-400 focus:border-red-400" :
                              watchedMsg.length > 0 ? "border-blue-300 focus:border-blue-500" :
                              "border-gray-200 focus:border-blue-500"
                            }`}
                          />
                          {watchedMsg.length > 450 && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />{500 - watchedMsg.length} caractères restants
                            </motion.p>
                          )}
                          {watchedMsg.length > 0 && watchedMsg.length <= 450 && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Info className="w-3 h-3" />Plus votre message est détaillé, meilleure sera notre analyse
                            </p>
                          )}
                        </motion.div>

                        {/* Bouton soumettre */}
                        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible">
                          {/* Avertissement si champs manquants */}
                          <AnimatePresence>
                            {completionPct < 100 && (touchedFields.fullName || touchedFields.email || touchedFields.phone) && (
                              <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.25 }}
                                className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4"
                              >
                                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-orange-700">
                                  Veuillez remplir tous les champs obligatoires (<span className="font-semibold">*</span>) avant de soumettre.
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <Button
                            type="submit"
                            disabled={submitMutation.isPending}
                            className={`w-full text-white text-base font-bold py-6 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] ${
                              completionPct === 100 ? "" : "opacity-80"
                            }`}
                            style={{ background: completionPct === 100
                              ? 'linear-gradient(135deg, #15803d, #16a34a)'
                              : 'linear-gradient(135deg, #1e3a8a, #2563eb)'
                            }}
                          >
                            {submitMutation.isPending ? (
                              <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Envoi en cours...
                              </span>
                            ) : completionPct === 100 ? (
                              <span className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Soumettre ma pré-évaluation
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                Soumettre ma pré-évaluation
                              </span>
                            )}
                          </Button>
                          <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                            <Shield className="w-3 h-3" />
                            Champs <span className="font-semibold text-red-400">*</span> obligatoires — Données confidentielles — Réponse sous 24h
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

      {/* --- TARIFS & GARANTIES --- */}
      <PricingSection />

      {/* --- CTA --- */}
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
            <a href="mailto:hello@3mtravelagency.com">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8 active:scale-[0.97] transition-transform">
                <Mail className="w-4 h-4 mr-2" />Nous écrire
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── FORMULAIRE MULTI-PROJETS SIMPLIFIÉ ─────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Nouvelle Évaluation</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Évaluation Multi-Projets</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choisissez votre type de projet (Travail, Études, Tourisme) et obtenez une évaluation personnalisée en 24h.
            </p>
          </motion.div>
          <SimpleMultiProjectForm />
        </div>
      </section>

      {/* ─── SECTION CRÉDIBILITÉ & LOCALISATION ──────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Confiance & Transparence</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Nous Sommes Officiellement Enregistrés</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              3M Travel & Services est une agence officielle certifiée et transparente. Découvrez nos certifications, notre localisation et nos coordonnées.
            </p>
          </motion.div>

          {/* Badge de crédibilité */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <CredibilityBadge />
          </motion.div>


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
                <li><a href="/procedures" className="hover:text-[#7cb9e8] transition-colors font-semibold text-[#7cb9e8]/80">📚 Procédures & Guides</a></li>
                <li><a href="/flights" className="hover:text-[#7cb9e8] transition-colors font-semibold text-[#7cb9e8]/80">✈️ Recherche de Vols</a></li>
                <li><a href="/traduction/order" className="hover:text-[#7cb9e8] transition-colors font-semibold text-[#7cb9e8]/80">📄 Traduction Assermentée</a></li>
                <li><a href="/assurance" className="hover:text-[#7cb9e8] transition-colors font-semibold text-[#7cb9e8]/80">🛡️ Assurance Voyage</a></li>
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
                  <a href="mailto:hello@3mtravelagency.com" className="hover:text-[#7cb9e8]">hello@3mtravelagency.com</a>
                </div>
              </div>
            </div>
          </div>
          {/* Bloc légal & Charte de Transparence */}
          <div className="border-t border-gray-800 pt-8 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2563eb]/20 border border-[#7cb9e8]/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#7cb9e8]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">
                  3M Travel & Services SARL
                  <span className="ml-2 text-xs font-normal text-[#7cb9e8] bg-[#2563eb]/20 px-2 py-0.5 rounded-full">Agence officielle</span>
                </p>
                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                  Enregistrée sous le numéro <span className="text-gray-300 font-medium">RC/YAO/2019/A/2567</span> (NIU : <span className="text-gray-300 font-medium">M112417203369H</span>).
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="text-[#7cb9e8] font-semibold">Charte de Transparence :</span> Notre rôle est d’accompagner la recherche d’employeur, la préparation technique du dossier et le suivi administratif. Nous ne délivrons pas nous-mêmes de visa ou de permis de travail — cette décision appartient exclusivement aux autorités compétentes de chaque pays d’accueil.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
            <p>© 2026 3M Travel & Services SARL. Tous droits réservés.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="/politique-confidentialite" className="hover:text-[#7cb9e8] transition-colors">Politique de confidentialité</a>
              <a href="/conditions-utilisation" className="hover:text-[#7cb9e8] transition-colors">Conditions d'utilisation</a>
            </div>
          </div>
        </div>

        {/* ─── SIGNATURE CONCEPTEUR ─────────────────────────────────────── */}
        <div style={{ background: "rgba(0,0,0,0.35)" }} className="border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-5 text-center">
            {/* Ligne principale */}
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="mr-1">💻</span>
              Conçu &amp; Développé par{" "}
              <span className="text-gray-300 font-semibold">Aureol Donfack</span>
              {" "}|{" "}
              <span className="text-gray-500">Ingénieur Administration Réseaux • Développeur Full-Stack • IT Support • Community Manager</span>
            </p>

            {/* Sous-texte CTA */}
            <p className="text-xs text-gray-600 mt-2">
              Vous souhaitez un site web moderne et performant pour votre entreprise ?{" "}
              <DevContactPopup />
            </p>
          </div>
        </div>
      </footer>

      {/* ─── CARROUSEL VISAS ACCORDÉS (Preuve Sociale) ────────────────────────── */}
      <VisasCarousel />

      {/* ─── SIMULATEUR EXPRESS 30 SECONDES ────────────────────────────────────── */}
      <SimulatorExpress />

      {/* ─── FOOTER LÉGAL & INSTITUTIONNEL ─────────────────────────────────────── */}
      <FooterLegal />

      {/* ─── MODAL AUTO-ÉVALUATION EXPRESS ────────────────────────── */}
      <EvaluationFormModal isOpen={showEvalModal} onClose={() => setShowEvalModal(false)} />

      {/* ─── WIDGET WHATSAPP FLOTTANT ─────────────────────────────────────── */}
      <WhatsAppWidget />

      {/* ─── BOUTON WHATSAPP FLOTTANT (Legacy) ─────────────────────────────────────── */}
      <WhatsAppButton />
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

// ─── Bouton WhatsApp Flottant ─────────────────────────────────────────────────
function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Arrêter le pulse après 5 secondes
  React.useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const phoneNumber = "237698104832";
  const message = encodeURIComponent(
    "Bonjour 3M Travel & Services ! Je souhaite obtenir des informations sur vos services de visa et immigration. Pouvez-vous m'aider ?"
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Tooltip / bulle de message */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" as const }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 max-w-[220px] text-right"
          >
            <p className="text-sm font-bold text-gray-800 mb-0.5">Besoin d'aide ?</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Contactez-nous directement sur WhatsApp, nous répondons en moins de 30 min !
            </p>
            {/* Petite flèche */}
            <div className="absolute bottom-[-6px] right-5 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton principal */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter 3M Travel sur WhatsApp"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}
      >
        {/* Cercle de pulse */}
        {pulse && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ background: "rgba(37,211,102,0.4)" }}
            animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" as const }}
          />
        )}
        {/* Icône WhatsApp SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-7 h-7 fill-white"
          aria-hidden="true"
        >
          <path d="M16.003 2.667C8.638 2.667 2.667 8.637 2.667 16c0 2.344.635 4.61 1.84 6.594L2.667 29.333l6.9-1.81A13.267 13.267 0 0 0 16.003 29.333c7.364 0 13.33-5.97 13.33-13.333S23.367 2.667 16.003 2.667zm0 24.267a11.02 11.02 0 0 1-5.617-1.538l-.403-.24-4.094 1.074 1.09-3.984-.263-.41A10.977 10.977 0 0 1 5.003 16c0-6.066 4.934-11 11-11s11 4.934 11 11-4.934 11-11 11zm6.03-8.23c-.33-.165-1.953-.963-2.256-1.073-.303-.11-.524-.165-.744.165-.22.33-.854 1.073-1.047 1.293-.193.22-.386.248-.716.083-.33-.165-1.394-.514-2.655-1.638-.982-.875-1.645-1.956-1.838-2.286-.193-.33-.02-.508.145-.672.149-.148.33-.386.495-.58.165-.193.22-.33.33-.55.11-.22.055-.413-.027-.578-.083-.165-.744-1.793-1.02-2.455-.268-.644-.54-.557-.744-.567l-.633-.011c-.22 0-.578.083-.881.413-.303.33-1.155 1.128-1.155 2.75s1.183 3.19 1.348 3.41c.165.22 2.328 3.556 5.642 4.988.789.34 1.404.543 1.884.695.79.252 1.51.216 2.079.131.634-.095 1.953-.798 2.228-1.568.275-.77.275-1.43.193-1.568-.083-.138-.303-.22-.633-.386z" />
        </svg>
      </motion.a>

      {/* Label sous le bouton */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="text-xs font-semibold text-gray-600 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm border border-gray-100"
      >
        WhatsApp
      </motion.span>
    </div>
  );
}

// ─── Section Tarifs & Garanties ───────────────────────────────────────────────
function PricingSection() {
  const plans = [
    {
      id: "integral",
      icon: <Plane className="w-7 h-7" />,
      badge: null,
      title: "Règlement Intégral",
      subtitle: "Traitement accéléré",
      color: "from-[#1e3a8a] to-[#2563eb]",
      borderColor: "border-[#2563eb]/30",
      badgeBg: "",
      textAccent: "text-[#7cb9e8]",
      description: "Payez en une seule fois et bénéficiez d'un traitement prioritaire de votre dossier, sans frais supplémentaires.",
      features: [
        "Traitement prioritaire du dossier",
        "Suivi personnalisé dédié",
        "Réponse sous 24h garantie",
        "Accompagnement complet",
        "Sans frais supplémentaires",
      ],
      cta: "Choisir cette option",
      highlight: false,
    },
    {
      id: "echelonne",
      icon: <Clock className="w-7 h-7" />,
      badge: "Le plus choisi",
      title: "Échelonné Flexible",
      subtitle: "4 à 5 mois",
      color: "from-[#2563eb] to-[#1d4ed8]",
      borderColor: "border-[#2563eb]",
      badgeBg: "bg-yellow-400 text-yellow-900",
      textAccent: "text-yellow-300",
      description: "Un paiement structuré et modulable sur 4 à 5 mois pour adapter nos honoraires à votre situation.",
      features: [
        "Paiement sur 4 à 5 mensualités",
        "Plan personnalisé selon votre budget",
        "Suivi régulier de votre dossier",
        "Flexibilité des échéances",
        "Accompagnement complet inclus",
      ],
      cta: "Choisir cette option",
      highlight: true,
    },
    {
      id: "garanti",
      icon: <Shield className="w-7 h-7" />,
      badge: "Zéro risque",
      title: "Permis Garanti",
      subtitle: "Paiement après succès",
      color: "from-[#059669] to-[#047857]",
      borderColor: "border-emerald-500/40",
      badgeBg: "bg-emerald-400 text-emerald-900",
      textAccent: "text-emerald-300",
      description: "Réglez nos honoraires d'agence UNIQUEMENT après succès et obtention effective de votre visa.",
      features: [
        "Honoraires payés après obtention du visa",
        "Zéro risque financier pour vous",
        "Engagement total de notre équipe",
        "Suivi jusqu'à l'obtention du visa",
        "Conditions d'éligibilité à vérifier",
      ],
      cta: "Vérifier mon éligibilité",
      highlight: false,
    },
  ];

  const phoneNumber = "237698104832";

  return (
    <section id="tarifs" className="py-12 md:py-20 bg-gradient-to-b from-white to-[#f0f6ff]">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2"
          >
            Nos formules
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-extrabold text-[#1e3a8a] mb-4"
          >
            Tarifs & Garanties
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 max-w-2xl mx-auto text-base"
          >
            Choisissez la formule qui correspond à votre situation. Transparence totale, aucun frais caché.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className={`relative rounded-3xl border-2 ${plan.borderColor} flex flex-col overflow-hidden shadow-lg ${plan.highlight ? "scale-[1.03] shadow-2xl ring-2 ring-[#2563eb]/40" : ""}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full ${plan.badgeBg}`}>
                  {plan.badge}
                </div>
              )}

              {/* Header coloré */}
              <div className={`bg-gradient-to-br ${plan.color} p-7 text-white`}>
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-extrabold mb-1">{plan.title}</h3>
                <p className={`text-sm font-semibold ${plan.textAccent}`}>{plan.subtitle}</p>
              </div>

              {/* Corps */}
              <div className="bg-white flex flex-col flex-1 p-7">
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{plan.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-[#2563eb] flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(`Bonjour 3M Travel & Services ! Je suis intéressé(e) par la formule "${plan.title}". Pouvez-vous me donner plus d'informations ?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3 rounded-xl font-bold text-sm text-center transition-all active:scale-[0.97] block ${
                    plan.highlight
                      ? "bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-blue-200"
                      : plan.id === "garanti"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
                  }`}
                >
                  {plan.cta} →
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note légale */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-gray-400 mt-8 max-w-2xl mx-auto"
        >
          <Info className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
          Les honoraires d'agence couvrent l'accompagnement, la préparation du dossier et le suivi administratif. La décision d'octroi du visa appartient exclusivement aux autorités compétentes.
        </motion.p>
      </div>
    </section>
  );
}

// ─── Modal Auto-Évaluation Express ───────────────────────────────────────────
type EvalFormData = {
  nom: string;
  ville: string;
  diplome: string;
  experience: string;
  langues: string[];
  secteur: string;
};

const LANGUES_OPTIONS = ["Français", "Anglais", "Allemand"];

function EligibilityModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = React.useState<EvalFormData>({
    nom: "", ville: "", diplome: "", experience: "", langues: [], secteur: "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof EvalFormData, string>>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const validate = (): boolean => {
    const e: Partial<Record<keyof EvalFormData, string>> = {};
    if (!form.nom.trim() || form.nom.trim().length < 2) e.nom = "Veuillez entrer votre nom complet (min. 2 caractères)";
    if (!form.ville) e.ville = "Veuillez sélectionner votre ville";
    if (!form.diplome) e.diplome = "Veuillez sélectionner votre niveau d'études";
    if (!form.experience) e.experience = "Veuillez sélectionner votre niveau d'expérience";
    if (form.langues.length === 0) e.langues = "Veuillez sélectionner au moins une langue";
    if (!form.secteur) e.secteur = "Veuillez sélectionner votre secteur d'activité";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const phoneNumber = "237698104832";
    const message = `Bonjour 3M Travel, je viens de faire mon auto-évaluation sur le site. Voici mes informations :
- Nom : ${form.nom}
- Ville : ${form.ville}
- Diplôme : ${form.diplome}
- Expérience : ${form.experience}
- Langues : ${form.langues.join(", ")}
- Secteur : ${form.secteur}
Je souhaite recevoir mon rapport de scoring officiel.`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    setSubmitted(true);
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      onClose();
      setSubmitted(false);
      setForm({ nom: "", ville: "", diplome: "", experience: "", langues: [], secteur: "" });
      setErrors({});
    }, 1200);
  };

  const toggleLangue = (lang: string) => {
    setForm(prev => ({
      ...prev,
      langues: prev.langues.includes(lang)
        ? prev.langues.filter(l => l !== lang)
        : [...prev.langues, lang],
    }));
    if (errors.langues) setErrors(prev => ({ ...prev, langues: undefined }));
  };

  const fieldClass = (name: keyof EvalFormData) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[name]
        ? "border-red-400 focus:ring-red-200 bg-red-50"
        : "border-gray-200 focus:ring-[#2563eb]/30 bg-white"
    }`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg w-full rounded-3xl p-0 overflow-hidden">
        {/* En-tête coloré */}
        <div className="bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] px-6 pt-6 pb-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-white">Auto-Évaluation Express</DialogTitle>
              <DialogDescription className="text-blue-200 text-xs">Résultat en 2 minutes · Gratuit</DialogDescription>
            </div>
          </div>
          <p className="text-sm text-blue-100 leading-relaxed">
            Remplissez ce formulaire rapide. Nous analyserons votre profil et vous enverrons votre rapport de scoring sur WhatsApp.
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-bold text-gray-800 text-lg">Profil envoyé !</p>
              <p className="text-sm text-gray-500">Redirection vers WhatsApp en cours...</p>
            </motion.div>
          ) : (
            <>
              {/* Nom & Prénom */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">Nom & Prénom <span className="text-red-500">*</span></Label>
                <input
                  type="text"
                  placeholder="Ex: Jean Dupont"
                  value={form.nom}
                  onChange={e => { setForm(p => ({ ...p, nom: e.target.value })); if (errors.nom) setErrors(p => ({ ...p, nom: undefined })); }}
                  className={fieldClass("nom")}
                />
                {errors.nom && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.nom}</p>}
              </div>

              {/* Ville */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">Ville actuelle <span className="text-red-500">*</span></Label>
                <Select value={form.ville} onValueChange={v => { setForm(p => ({ ...p, ville: v })); setErrors(p => ({ ...p, ville: undefined })); }}>
                  <SelectTrigger className={errors.ville ? "border-red-400 bg-red-50" : ""}>
                    <SelectValue placeholder="Sélectionner votre ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Yaoundé", "Douala", "Hors-Cameroun"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.ville && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.ville}</p>}
              </div>

              {/* Diplôme */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">Dernier diplôme <span className="text-red-500">*</span></Label>
                <Select value={form.diplome} onValueChange={v => { setForm(p => ({ ...p, diplome: v })); setErrors(p => ({ ...p, diplome: undefined })); }}>
                  <SelectTrigger className={errors.diplome ? "border-red-400 bg-red-50" : ""}>
                    <SelectValue placeholder="Sélectionner votre diplôme" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Bac", "Licence", "Master ou plus"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.diplome && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.diplome}</p>}
              </div>

              {/* Expérience */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">Années d'expérience <span className="text-red-500">*</span></Label>
                <Select value={form.experience} onValueChange={v => { setForm(p => ({ ...p, experience: v })); setErrors(p => ({ ...p, experience: undefined })); }}>
                  <SelectTrigger className={errors.experience ? "border-red-400 bg-red-50" : ""}>
                    <SelectValue placeholder="Sélectionner votre niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Junior (0-2 ans)", "Intermédiaire (3-7 ans)", "Expert (8 ans et plus)"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.experience && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.experience}</p>}
              </div>

              {/* Langues */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-2 block">Langues maîtrisées <span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap gap-3">
                  {LANGUES_OPTIONS.map(lang => (
                    <label key={lang} className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={form.langues.includes(lang)}
                        onCheckedChange={() => toggleLangue(lang)}
                        className="border-[#2563eb] data-[state=checked]:bg-[#2563eb]"
                      />
                      <span className="text-sm text-gray-700">{lang}</span>
                    </label>
                  ))}
                </div>
                {errors.langues && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.langues}</p>}
              </div>

              {/* Secteur */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">Secteur d'activité <span className="text-red-500">*</span></Label>
                <Select value={form.secteur} onValueChange={v => { setForm(p => ({ ...p, secteur: v })); setErrors(p => ({ ...p, secteur: undefined })); }}>
                  <SelectTrigger className={errors.secteur ? "border-red-400 bg-red-50" : ""}>
                    <SelectValue placeholder="Sélectionner votre secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Métiers techniques", "Santé", "Enseignement", "Assurances", "Autre"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.secteur && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.secteur}</p>}
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#128c7e] hover:to-[#0a6b5e] text-white shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-5 h-5 fill-white" aria-hidden="true">
                  <path d="M16.003 2.667C8.638 2.667 2.667 8.637 2.667 16c0 2.344.635 4.61 1.84 6.594L2.667 29.333l6.9-1.81A13.267 13.267 0 0 0 16.003 29.333c7.364 0 13.33-5.97 13.33-13.333S23.367 2.667 16.003 2.667zm0 24.267a11.02 11.02 0 0 1-5.617-1.538l-.403-.24-4.094 1.074 1.09-3.984-.263-.41A10.977 10.977 0 0 1 5.003 16c0-6.066 4.934-11 11-11s11 4.934 11 11-4.934 11-11 11zm6.03-8.23c-.33-.165-1.953-.963-2.256-1.073-.303-.11-.524-.165-.744.165-.22.33-.854 1.073-1.047 1.293-.193.22-.386.248-.716.083-.33-.165-1.394-.514-2.655-1.638-.982-.875-1.645-1.956-1.838-2.286-.193-.33-.02-.508.145-.672.149-.148.33-.386.495-.58.165-.193.22-.33.33-.55.11-.22.055-.413-.027-.578-.083-.165-.744-1.793-1.02-2.455-.268-.644-.54-.557-.744-.567l-.633-.011c-.22 0-.578.083-.881.413-.303.33-1.155 1.128-1.155 2.75s1.183 3.19 1.348 3.41c.165.22 2.328 3.556 5.642 4.988.789.34 1.404.543 1.884.695.79.252 1.51.216 2.079.131.634-.095 1.953-.798 2.228-1.568.275-.77.275-1.43.193-1.568-.083-.138-.303-.22-.633-.386z" />
                </svg>
                Envoyer mon profil sur WhatsApp
              </button>

              <p className="text-center text-xs text-gray-400">
                <Shield className="w-3 h-3 inline mr-1" />
                Vos données sont confidentielles et utilisées uniquement pour votre évaluation.
              </p>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
