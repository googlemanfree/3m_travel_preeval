import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plane, Globe, GraduationCap, Briefcase, MapPin, Phone, Mail,
  Upload, CheckCircle2, ArrowRight, ChevronDown, Users, FileText,
  Star, Clock, Shield, X
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

// ─── Schema de validation ─────────────────────────────────────────────────────
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

// ─── Données de configuration ─────────────────────────────────────────────────
const VISA_OPTIONS: Record<DestinationCategory, { value: VisaType; label: string; icon: React.ElementType }[]> = {
  schengen: [
    { value: "schengen_etude", label: "Visa Étude", icon: GraduationCap },
    { value: "schengen_tourisme", label: "Visa Tourisme", icon: Globe },
    { value: "schengen_travail", label: "Visa Travail", icon: Briefcase },
  ],
  canada: [
    { value: "canada_rp", label: "Résidence Permanente (RP)", icon: Star },
    { value: "canada_etude", label: "Visa Étude", icon: GraduationCap },
    { value: "canada_tourisme", label: "Visa Tourisme", icon: Globe },
  ],
  autre: [
    { value: "autre", label: "Autre type de visa", icon: FileText },
  ],
};

const DESTINATION_CATEGORIES = [
  {
    id: "schengen" as DestinationCategory,
    label: "Espace Schengen",
    flag: "🇪🇺",
    description: "France, Allemagne, Espagne, Italie, Belgique...",
    color: "from-blue-500 to-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    activeColor: "bg-blue-600 border-blue-600",
  },
  {
    id: "canada" as DestinationCategory,
    label: "Canada",
    flag: "🇨🇦",
    description: "Résidence permanente, études, tourisme",
    color: "from-red-500 to-red-700",
    bgColor: "bg-red-50 border-red-200",
    activeColor: "bg-red-600 border-red-600",
  },
  {
    id: "autre" as DestinationCategory,
    label: "Autre Pays",
    flag: "🌍",
    description: "USA, Chine, Royaume-Uni, Australie...",
    color: "from-emerald-500 to-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    activeColor: "bg-emerald-600 border-emerald-600",
  },
];

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<DestinationCategory | null>(null);
  const [selectedVisa, setSelectedVisa] = useState<VisaType | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvBase64, setCvBase64] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinationCategory: undefined,
      visaType: undefined,
    },
  });

  const submitMutation = trpc.evaluation.submit.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      reset();
      setSelectedCategory(null);
      setSelectedVisa(null);
      setCvFile(null);
      setCvBase64("");
    },
    onError: (err) => {
      toast.error("Erreur lors de la soumission : " + err.message);
    },
  });

  const handleCategorySelect = (cat: DestinationCategory) => {
    setSelectedCategory(cat);
    setSelectedVisa(null);
    setValue("destinationCategory", cat);
    setValue("visaType", undefined as any);
    // Scroll vers le formulaire
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleVisaSelect = (visa: VisaType) => {
    setSelectedVisa(visa);
    setValue("visaType", visa);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      toast.error("Le fichier ne doit pas dépasser 5 Mo");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format accepté : PDF, DOC, DOCX uniquement");
      return;
    }

    setCvFile(file);
    setValue("cvFileName", file.name);
    setValue("cvMimeType", file.type);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setCvBase64(base64);
      setValue("cvBase64", base64);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setCvFile(null);
    setCvBase64("");
    setValue("cvBase64", "");
    setValue("cvFileName", "");
    setValue("cvMimeType", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (data: FormValues) => {
    submitMutation.mutate({
      ...data,
      cvBase64: cvBase64 || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-900 rounded-xl flex items-center justify-center shadow-md">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-blue-900 text-base leading-tight">3M Travel & Services</div>
              <div className="text-xs text-blue-500 font-medium">Votre mobilité, notre expertise</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#services" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Services</a>
            <a href="#evaluation" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Pré-évaluation</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Contact</a>
          </nav>
          <a href="tel:+237620996045">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md">
              <Phone className="w-4 h-4 mr-2" />
              +237 620-996-045
            </Button>
          </a>
        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-300 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full border border-white/30">
              <Star className="w-4 h-4 text-yellow-300" />
              Évaluation gratuite en 24h
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Votre Pré-Évaluation<br />
              <span className="text-yellow-300">Visa & Immigration</span>
            </h1>
            <p className="text-blue-100 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              Remplissez notre formulaire gratuit. Nos experts analysent votre profil et vous proposent les meilleures options pour réaliser votre projet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <a href="#evaluation">
                <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold text-base shadow-xl px-8">
                  Commencer l'évaluation
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <a href="tel:+237620996045">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold text-base px-8">
                  <Phone className="w-4 h-4 mr-2" />
                  Nous appeler
                </Button>
              </a>
            </div>
          </div>
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
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Nos Services</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">3M Travel & Services vous accompagne dans toutes vos démarches de voyage et d'immigration.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Plane, title: "Billets d'avion", desc: "Meilleurs tarifs sur tous vols internationaux et domestiques", color: "bg-blue-100 text-blue-600" },
              { icon: FileText, title: "Assistance Visa", desc: "Accompagnement complet pour vos demandes de visa vers 8 pays", color: "bg-indigo-100 text-indigo-600" },
              { icon: Globe, title: "Tourisme & Hôtels", desc: "Packages touristiques et réservations d'hôtels personnalisés", color: "bg-sky-100 text-sky-600" },
              { icon: Shield, title: "Assurance Voyage", desc: "Protection complète pour voyager l'esprit tranquille", color: "bg-cyan-100 text-cyan-600" },
            ].map((s, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-blue-200 group">
                <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION ÉVALUATION ──────────────────────────────────────────── */}
      <section id="evaluation" className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Formulaire Gratuit</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Pré-Évaluation Gratuite</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Choisissez votre destination, sélectionnez le type de visa, et remplissez le formulaire. Nos experts vous répondent sous 24h.
            </p>
          </div>

          {/* Étape 1 : Choisir la destination */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">1</div>
              <h3 className="text-xl font-bold text-gray-900">Choisissez votre destination</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {DESTINATION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    selectedCategory === cat.id
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg scale-105"
                      : "border-gray-200 bg-white hover:border-blue-300 text-gray-900"
                  }`}
                >
                  <div className="text-4xl mb-3">{cat.flag}</div>
                  <div className="font-bold text-lg mb-1">{cat.label}</div>
                  <div className={`text-sm ${selectedCategory === cat.id ? "text-blue-100" : "text-gray-500"}`}>
                    {cat.description}
                  </div>
                  {selectedCategory === cat.id && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Étape 2 : Choisir le type de visa */}
          {selectedCategory && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                <h3 className="text-xl font-bold text-gray-900">Sélectionnez le type de visa</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {VISA_OPTIONS[selectedCategory].map((visa) => {
                  const Icon = visa.icon;
                  return (
                    <button
                      key={visa.value}
                      type="button"
                      onClick={() => handleVisaSelect(visa.value)}
                      className={`p-5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selectedVisa === visa.value
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-gray-200 bg-white hover:border-blue-300 text-gray-900"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                        selectedVisa === visa.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-sm">{visa.label}</div>
                      {selectedVisa === visa.value && (
                        <div className="mt-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Étape 3 : Formulaire complet */}
          {selectedCategory && selectedVisa && (
            <div ref={formRef} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                <h3 className="text-xl font-bold text-gray-900">Remplissez votre profil</h3>
              </div>

              {isSubmitted ? (
                <Card className="p-12 text-center border-green-200 bg-green-50">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-900 mb-3">Demande envoyée avec succès !</h3>
                  <p className="text-green-700 mb-6 max-w-md mx-auto">
                    Votre pré-évaluation a été soumise. Nos experts analyseront votre profil et vous contacteront dans les <strong>24 heures</strong>.
                  </p>
                  <Button
                    onClick={() => { setIsSubmitted(false); setSelectedCategory(null); setSelectedVisa(null); }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Faire une nouvelle demande
                  </Button>
                </Card>
              ) : (
                <Card className="p-8 md:p-10 border-blue-100 shadow-xl">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Informations personnelles */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Informations personnelles
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
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
                      </div>
                    </div>

                    {/* Profil académique et professionnel */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        Profil académique & professionnel
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
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
                      </div>
                    </div>

                    {/* Upload CV */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-600" />
                        Pièce jointe (CV)
                      </h4>
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer hover:border-blue-400 hover:bg-blue-50 ${
                          cvFile ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50"
                        }`}
                        onClick={() => !cvFile && fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {cvFile ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-green-900 text-sm">{cvFile.name}</p>
                                <p className="text-xs text-green-600">{(cvFile.size / 1024).toFixed(0)} Ko</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeFile(); }}
                              className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <p className="font-semibold text-gray-700 mb-1">Glissez votre CV ici ou cliquez pour parcourir</p>
                            <p className="text-xs text-gray-400">PDF, DOC, DOCX — Max 5 Mo</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1">
                      <Label htmlFor="message" className="text-gray-700 font-semibold text-sm">Message complémentaire</Label>
                      <Textarea
                        id="message"
                        placeholder="Décrivez votre projet, vos motivations ou toute information utile pour notre évaluation..."
                        {...register("message")}
                        rows={4}
                        className="border-gray-200 focus:border-blue-500 resize-none"
                      />
                    </div>

                    {/* Récapitulatif */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Récapitulatif de votre demande :</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {DESTINATION_CATEGORIES.find(c => c.id === selectedCategory)?.flag} {DESTINATION_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-white text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
                          {VISA_OPTIONS[selectedCategory!].find(v => v.value === selectedVisa)?.label}
                        </span>
                      </div>
                    </div>

                    {/* Bouton de soumission */}
                    <Button
                      type="submit"
                      disabled={submitMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base font-bold py-6 shadow-lg hover:shadow-xl transition-all"
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
                    <p className="text-xs text-gray-400 text-center">
                      * Champs obligatoires. Vos données sont traitées de manière confidentielle. Réponse sous 24h.
                    </p>
                  </form>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── POURQUOI NOUS ───────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Pourquoi nous choisir</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">L'expertise à votre service</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Expertise réglementée", desc: "Professionnels experts en visa et immigration internationale", color: "text-blue-600 bg-blue-100" },
              { icon: Users, title: "Accompagnement personnalisé", desc: "Analyse de votre profil pour des solutions sur mesure", color: "text-indigo-600 bg-indigo-100" },
              { icon: Clock, title: "Réponse rapide", desc: "Retour de nos experts sous 24h après soumission", color: "text-sky-600 bg-sky-100" },
              { icon: CheckCircle2, title: "Taux de succès élevé", desc: "Des centaines de dossiers traités avec succès chaque année", color: "text-cyan-600 bg-cyan-100" },
            ].map((item, i) => (
              <div key={i} className="text-center p-6">
                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-blue-700 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Prêt à réaliser votre projet ?
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
            Contactez nos experts dès aujourd'hui pour une consultation gratuite et personnalisée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#evaluation">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold shadow-xl px-8">
                Pré-évaluation gratuite
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="mailto:hello@3mtravelegency.com">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8">
                <Mail className="w-4 h-4 mr-2" />
                Nous écrire
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-gray-950 text-gray-400 py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-white text-sm">3M Travel & Services</div>
              </div>
              <p className="text-sm leading-relaxed mb-3">Votre partenaire de confiance pour tous vos besoins de voyage et visa.</p>
              <p className="text-xs text-gray-600">RC/YAO/2019/A/2567 | NIU: M112417203369H</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Services</h4>
              <ul className="space-y-2 text-sm">
                {["Visa & Immigration", "Billets d'avion", "Hôtels & Tourisme", "Assurance voyage", "Marketing digital"].map(s => (
                  <li key={s}><a href="#services" className="hover:text-blue-400 transition-colors">{s}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Destinations</h4>
              <ul className="space-y-2 text-sm">
                {["🇫🇷 France", "🇩🇪 Allemagne", "🇬🇧 Royaume-Uni", "🇨🇦 Canada", "🇧🇪 Belgique", "🇮🇹 Italie"].map(d => (
                  <li key={d}><span className="hover:text-blue-400 transition-colors cursor-pointer">{d}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Contact</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Yaoundé Biyem-Assi, Montée chapelle Obili (10m de EHS)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <a href="tel:+237620996045" className="hover:text-blue-400">+237 620-996-045</a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <a href="tel:+237698104832" className="hover:text-blue-400">+237 698-104-832</a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <a href="mailto:hello@3mtravelegency.com" className="hover:text-blue-400">hello@3mtravelegency.com</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
            <p>© 2026 3M Travel & Services SARL. Tous droits réservés.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-blue-400 transition-colors">Politique de confidentialité</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Conditions d'utilisation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
