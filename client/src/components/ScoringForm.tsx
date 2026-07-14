/**
 * ScoringForm — Étapes 2 & 3 du tunnel de conversion
 * Formulaire multi-étapes avec :
 *  - Étape 1 : Informations personnelles
 *  - Étape 2 : Profil professionnel + calcul de score en temps réel
 *  - Étape 3 : Upload de documents (passeport, CV, diplôme)
 *  - Étape 4 : Résultat du scoring + paiement CinetPay 65 000 FCFA
 */

import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  User, Briefcase, Upload, CreditCard, CheckCircle, ArrowRight, ArrowLeft,
  FileText, AlertTriangle, Shield, Loader2, X, Eye, Star, TrendingUp
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  calculateScore, ACADEMIC_LEVELS, LANGUAGE_LEVELS, JOB_SECTORS,
  type ScoringInput, type ScoringResult
} from "@/lib/scoring";
import type { ProcedureInfo } from "./ProcedureDetailModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UploadedFile {
  url: string;
  key: string;
  name: string;
  type: "passeport" | "cv" | "diplome";
}

interface FormData {
  // Étape 1 — Informations personnelles
  fullName: string;
  email: string;
  whatsappNumber: string;
  age: string;
  nationality: string;
  // Étape 2 — Profil professionnel
  academicLevel: string;
  experienceYears: string;
  languageLevel: string;
  jobSector: string;
  // Étape 3 — Documents
  passportFile: UploadedFile | null;
  cvFile: UploadedFile | null;
  diplomaFile: UploadedFile | null;
}

const STEPS = [
  { id: 1, label: "Informations", icon: User },
  { id: 2, label: "Profil",       icon: Briefcase },
  { id: 3, label: "Documents",    icon: Upload },
  { id: 4, label: "Résultat",     icon: Star },
];

const DESTINATION_MAP: Record<string, "canada" | "luxembourg" | "pologne" | "europe" | "golfe" | "oceanie" | "caucase" | "autre"> = {
  "Canada": "canada",
  "Luxembourg": "luxembourg",
  "Pologne": "pologne",
  "Europe Schengen": "europe",
  "Golfe & Moyen-Orient": "golfe",
  "Océanie": "oceanie",
  "Caucase": "caucase",
};

// ─── Composant de progression circulaire ─────────────────────────────────────
function CircularScore({ score, badge }: { score: number; badge: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const strokeColor = badge === "eligible" ? "#16a34a" : badge === "admissible" ? "#ca8a04" : "#dc2626";

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="64" cy="64" r={radius} fill="none"
          stroke={strokeColor} strokeWidth="10"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-gray-900">{score}</span>
        <span className="text-xs text-gray-500 font-medium">/100</span>
      </div>
    </div>
  );
}

// ─── Composant Upload de fichier ──────────────────────────────────────────────
function FileUploadZone({
  label, accept, required, uploaded, onUpload, onRemove, uploading
}: {
  label: string;
  accept: string;
  required?: boolean;
  uploaded: UploadedFile | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  }, [onUpload]);

  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {uploaded ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700 flex-1 truncate">{uploaded.name}</span>
          <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg p-4 text-center cursor-pointer transition-colors group"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Téléversement en cours...</span>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mx-auto mb-1 transition-colors" />
              <p className="text-xs text-gray-500">Cliquez ou glissez-déposez votre fichier</p>
              <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG — Max 5 Mo</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────────────────────
interface ScoringFormProps {
  procedure: ProcedureInfo | null;
  open: boolean;
  onClose: () => void;
}

export default function ScoringForm({ procedure, open, onClose }: ScoringFormProps) {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormData>({
    fullName: "", email: "", whatsappNumber: "", age: "", nationality: "",
    academicLevel: "", experienceYears: "", languageLevel: "", jobSector: "",
    passportFile: null, cvFile: null, diplomaFile: null,
  });

  const createApplication = trpc.application.createApplication.useMutation();

  const set = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Calcul du score en temps réel dès que les 5 critères sont remplis
  const computeScore = useCallback(() => {
    if (!form.academicLevel || !form.experienceYears || !form.languageLevel || !form.jobSector || !form.age) {
      return null;
    }
    const input: ScoringInput = {
      academicLevel: form.academicLevel,
      experienceYears: parseInt(form.experienceYears) || 0,
      languageLevel: form.languageLevel,
      jobSector: form.jobSector,
      age: parseInt(form.age) || 0,
    };
    return calculateScore(input);
  }, [form.academicLevel, form.experienceYears, form.languageLevel, form.jobSector, form.age]);

  // Upload d'un fichier vers S3 via l'API candidate/upload
  const uploadFile = async (file: File, type: "passeport" | "cv" | "diplome") => {
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [type]: "Le fichier dépasse 5 Mo" }));
      return;
    }
    setUploadingType(type);
    setErrors(prev => ({ ...prev, [type]: "" }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", type);

      const res = await fetch("/api/candidate/upload-public", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Échec du téléversement");
      const data = await res.json() as { fileUrl: string; fileKey: string; fileName: string };

      const uploaded: UploadedFile = {
        url: data.fileUrl,
        key: data.fileKey,
        name: data.fileName || file.name,
        type,
      };

      setForm(prev => ({
        ...prev,
        passportFile: type === "passeport" ? uploaded : prev.passportFile,
        cvFile: type === "cv" ? uploaded : prev.cvFile,
        diplomaFile: type === "diplome" ? uploaded : prev.diplomaFile,
      }));
    } catch (err) {
      setErrors(prev => ({ ...prev, [type]: "Erreur lors du téléversement. Réessayez." }));
    } finally {
      setUploadingType(null);
    }
  };

  const removeFile = (type: "passeport" | "cv" | "diplome") => {
    setForm(prev => ({
      ...prev,
      passportFile: type === "passeport" ? null : prev.passportFile,
      cvFile: type === "cv" ? null : prev.cvFile,
      diplomaFile: type === "diplome" ? null : prev.diplomaFile,
    }));
  };

  // Validation par étape
  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.fullName.trim()) errs.fullName = "Nom requis";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email invalide";
      if (!form.whatsappNumber.trim() || form.whatsappNumber.length < 8) errs.whatsappNumber = "Numéro requis (min. 8 chiffres)";
      if (!form.age || parseInt(form.age) < 18 || parseInt(form.age) > 65) errs.age = "Âge entre 18 et 65 ans requis";
    }
    if (s === 2) {
      if (!form.academicLevel) errs.academicLevel = "Niveau d'études requis";
      if (!form.experienceYears) errs.experienceYears = "Années d'expérience requises";
      if (!form.languageLevel) errs.languageLevel = "Niveau de langue requis";
      if (!form.jobSector) errs.jobSector = "Secteur d'activité requis";
    }
    if (s === 3) {
      if (!form.passportFile) errs.passeport = "Le passeport est obligatoire";
      if (!form.cvFile) errs.cv = "Le CV est obligatoire";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step === 2) {
      const result = computeScore();
      setScoringResult(result);
    }
    setStep(s => s + 1);
  };

  const goPrev = () => setStep(s => s - 1);

  // Soumission finale
  const handleSubmit = async () => {
    if (!procedure) return;
    setSubmitting(true);

    const score = scoringResult ?? computeScore();
    const destKey = DESTINATION_MAP[procedure.destination] ?? "autre";

    try {
      const result = await createApplication.mutateAsync({
        fullName: form.fullName,
        email: form.email,
        whatsappNumber: form.whatsappNumber,
        age: parseInt(form.age) || undefined,
        nationality: form.nationality || undefined,
        academicLevel: form.academicLevel || undefined,
        experienceYears: parseInt(form.experienceYears) || undefined,
        languageSkills: form.languageLevel || undefined,
        jobSector: form.jobSector || undefined,
        destination: destKey,
        formulaChosen: "integral",
        passportUrl: form.passportFile?.url,
        cvUrl: form.cvFile?.url,
        diplomaUrl: form.diplomaFile?.url,
        scoringTotal: score?.total,
        scoringDetails: score ? JSON.stringify(score.details) : undefined,
        scoringBadge: score?.badge,
        procedureId: procedure.id,
        procedureTitle: procedure.title,
      });

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        navigate(`/payment-success?dossier=${result.dossierNumber}&demo=1`);
      }
    } catch (err) {
      setErrors({ submit: "Une erreur est survenue. Veuillez réessayer." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!procedure) return null;

  const liveScore = step >= 2 ? computeScore() : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-5 rounded-t-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{procedure.flag}</span>
            <span className="text-xs text-blue-200">{procedure.destination}</span>
          </div>
          <h2 className="font-black text-base leading-tight">{procedure.title}</h2>

          {/* Stepper */}
          <div className="flex items-center gap-1 mt-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              const done = step > s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                    active ? "bg-white text-blue-800" :
                    done ? "bg-blue-500 text-white" :
                    "bg-blue-800/50 text-blue-300"
                  }`}>
                    {done ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    <span className="hidden sm:block">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${done ? "bg-blue-400" : "bg-blue-800/50"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* ── ÉTAPE 1 : Informations personnelles ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">Vos informations personnelles</h3>
              <div className="space-y-3">
                <div>
                  <Label>Nom complet <span className="text-red-500">*</span></Label>
                  <Input value={form.fullName} onChange={e => set("fullName", e.target.value)}
                    placeholder="Ex : Jean-Pierre Mbarga" className="mt-1" />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <Label>Adresse e-mail <span className="text-red-500">*</span></Label>
                  <Input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                    placeholder="votre@email.com" className="mt-1" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label>Numéro WhatsApp <span className="text-red-500">*</span></Label>
                  <Input value={form.whatsappNumber} onChange={e => set("whatsappNumber", e.target.value)}
                    placeholder="+237 6XX XXX XXX" className="mt-1" />
                  {errors.whatsappNumber && <p className="text-xs text-red-500 mt-1">{errors.whatsappNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Âge <span className="text-red-500">*</span></Label>
                    <Input type="number" min={18} max={65} value={form.age}
                      onChange={e => set("age", e.target.value)} placeholder="Ex : 28" className="mt-1" />
                    {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
                  </div>
                  <div>
                    <Label>Nationalité</Label>
                    <Input value={form.nationality} onChange={e => set("nationality", e.target.value)}
                      placeholder="Camerounaise" className="mt-1" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Profil professionnel + Scoring ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">Votre profil professionnel</h3>

              {/* Score en temps réel */}
              {liveScore && (
                <div className={`p-3 rounded-xl border-2 ${
                  liveScore.badge === "eligible" ? "border-green-200 bg-green-50" :
                  liveScore.badge === "admissible" ? "border-yellow-200 bg-yellow-50" :
                  "border-red-200 bg-red-50"
                }`}>
                  <div className="flex items-center gap-3">
                    <CircularScore score={liveScore.total} badge={liveScore.badge} />
                    <div>
                      <p className={`font-bold text-sm ${liveScore.color}`}>{liveScore.label}</p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{liveScore.description}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label>Niveau d'études <span className="text-red-500">*</span></Label>
                  <Select value={form.academicLevel} onValueChange={v => set("academicLevel", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez votre diplôme" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_LEVELS.map(l => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label} <span className="text-gray-400 text-xs">({l.points} pts)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.academicLevel && <p className="text-xs text-red-500 mt-1">{errors.academicLevel}</p>}
                </div>

                <div>
                  <Label>Années d'expérience professionnelle <span className="text-red-500">*</span></Label>
                  <Select value={form.experienceYears} onValueChange={v => set("experienceYears", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez votre expérience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Moins d'un an (0 pt)</SelectItem>
                      <SelectItem value="1">1 à 2 ans (10 pts)</SelectItem>
                      <SelectItem value="3">3 à 4 ans (15 pts)</SelectItem>
                      <SelectItem value="5">5 à 7 ans (20 pts)</SelectItem>
                      <SelectItem value="9">Plus de 8 ans (25 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.experienceYears && <p className="text-xs text-red-500 mt-1">{errors.experienceYears}</p>}
                </div>

                <div>
                  <Label>Compétences linguistiques <span className="text-red-500">*</span></Label>
                  <Select value={form.languageLevel} onValueChange={v => set("languageLevel", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez votre niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_LEVELS.map(l => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label} <span className="text-gray-400 text-xs">({l.points} pts)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.languageLevel && <p className="text-xs text-red-500 mt-1">{errors.languageLevel}</p>}
                </div>

                <div>
                  <Label>Secteur d'activité <span className="text-red-500">*</span></Label>
                  <Select value={form.jobSector} onValueChange={v => set("jobSector", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez votre secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>── Secteurs prioritaires (20 pts) ──</SelectItem>
                      {JOB_SECTORS.filter(s => s.category === "prioritaire").map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                      <SelectItem value="" disabled>── Secteurs secondaires (12 pts) ──</SelectItem>
                      {JOB_SECTORS.filter(s => s.category === "secondaire").map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                      <SelectItem value="" disabled>── Autres (5 pts) ──</SelectItem>
                      {JOB_SECTORS.filter(s => s.category === "autre").map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.jobSector && <p className="text-xs text-red-500 mt-1">{errors.jobSector}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Upload de documents ── */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">Téléversement de vos documents</h3>
              <p className="text-sm text-gray-500">
                Vos documents sont stockés de manière sécurisée et ne seront consultés que par nos conseillers.
              </p>

              <div className="space-y-4">
                <FileUploadZone
                  label="📁 Passeport en cours de validité"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  uploaded={form.passportFile}
                  onUpload={(file) => uploadFile(file, "passeport")}
                  onRemove={() => removeFile("passeport")}
                  uploading={uploadingType === "passeport"}
                />
                {errors.passeport && <p className="text-xs text-red-500">{errors.passeport}</p>}

                <FileUploadZone
                  label="📁 Curriculum Vitae (CV) mis à jour"
                  accept=".pdf,.doc,.docx"
                  required
                  uploaded={form.cvFile}
                  onUpload={(file) => uploadFile(file, "cv")}
                  onRemove={() => removeFile("cv")}
                  uploading={uploadingType === "cv"}
                />
                {errors.cv && <p className="text-xs text-red-500">{errors.cv}</p>}

                <FileUploadZone
                  label="📁 Diplôme le plus élevé (optionnel)"
                  accept=".pdf,.jpg,.jpeg,.png"
                  uploaded={form.diplomaFile}
                  onUpload={(file) => uploadFile(file, "diplome")}
                  onRemove={() => removeFile("diplome")}
                  uploading={uploadingType === "diplome"}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Vos documents sont chiffrés et stockés sur des serveurs sécurisés. Ils ne seront partagés avec aucun tiers sans votre consentement explicite.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 : Résultat du scoring + Paiement ── */}
          {step === 4 && scoringResult && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-center">Votre rapport d'éligibilité</h3>

              {/* Score circulaire */}
              <CircularScore score={scoringResult.total} badge={scoringResult.badge} />

              {/* Badge de résultat */}
              <div className={`text-center p-3 rounded-xl border-2 ${
                scoringResult.badge === "eligible" ? "border-green-200 bg-green-50" :
                scoringResult.badge === "admissible" ? "border-yellow-200 bg-yellow-50" :
                "border-red-200 bg-red-50"
              }`}>
                <p className={`font-black text-lg ${scoringResult.color}`}>{scoringResult.label}</p>
                <p className="text-sm text-gray-600 mt-1">{scoringResult.description}</p>
              </div>

              {/* Détail des critères */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-700 text-sm">Détail par critère</h4>
                {[
                  { label: "Formation & Diplômes", score: scoringResult.details.education, max: 25 },
                  { label: "Expérience professionnelle", score: scoringResult.details.experience, max: 25 },
                  { label: "Compétences linguistiques", score: scoringResult.details.language, max: 20 },
                  { label: "Secteur d'activité", score: scoringResult.details.sector, max: 20 },
                  { label: "Âge & Adaptabilité", score: scoringResult.details.age, max: 10 },
                ].map(({ label, score, max }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 flex-1">{label}</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-700"
                        style={{ width: `${(score / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-12 text-right">{score}/{max}</span>
                  </div>
                ))}
              </div>

              {/* Rappel verrouillage rapport */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Rapport officiel verrouillé</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Pour recevoir votre attestation de scoring PDF officielle, accéder à votre espace candidat et fixer votre rendez-vous d'ouverture de dossier, réglez les frais d'ouverture de <strong>65 000 FCFA</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <p className="text-sm text-red-600 text-center">{errors.submit}</p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 text-base rounded-xl shadow-lg"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement en cours...</>
                ) : (
                  <><CreditCard className="w-4 h-4 mr-2" />Soumettre & Payer 65 000 FCFA</>
                )}
              </Button>
              <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                MTN MoMo · Orange Money · Visa/Mastercard · Paiement sécurisé
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button variant="outline" onClick={goPrev} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour
              </Button>
            )}
            {step < 4 && (
              <Button
                onClick={goNext}
                disabled={uploadingType !== null}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
              >
                {step === 3 ? "Voir mon score" : "Continuer"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
