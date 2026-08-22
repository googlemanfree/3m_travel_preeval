import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, Download, MessageCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

// ─── Analytics (dégradé gracieux si Google Analytics n'est pas configuré) ───
function trackEvent(eventName: string, params?: Record<string, unknown>) {
  const gtag = (window as any).gtag;
  if (typeof gtag === "function") {
    gtag("event", eventName, params);
  }
}

const SECTORS = [
  { value: "sante", label: "Santé / Nursing" },
  { value: "documentation", label: "Documentation / Archives" },
  { value: "education", label: "Éducation" },
  { value: "finance", label: "Finance" },
  { value: "technologie", label: "Technologie / IT" },
  { value: "administration", label: "Administration" },
  { value: "rh", label: "Ressources Humaines" },
  { value: "metiers_mecanique", label: "Métiers / Mécanique" },
  { value: "autre", label: "Autre" },
];

const SOFT_SKILLS = [
  { value: "leadership", label: "Leadership prouvé" },
  { value: "gestion_stress", label: "Gestion du stress" },
  { value: "adaptabilite", label: "Adaptabilité" },
  { value: "communication", label: "Communication" },
];

const STATUS_COLORS: Record<string, string> = {
  tres_eligible: "text-green-600",
  eligible: "text-green-600",
  moderement_eligible: "text-amber-500",
  non_eligible: "text-red-600",
};

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  yearsExperience: string;
  sector: string;
  educationLevel: string;
  frenchLevel: string;
  englishLevel: string;
  skillsLevel: string;
  softSkills: string[];
}

const initialForm: FormState = {
  fullName: "", email: "", phone: "", jobTitle: "", yearsExperience: "",
  sector: "", educationLevel: "", frenchLevel: "", englishLevel: "", skillsLevel: "",
  softSkills: [],
};

export default function LuxembourgEvaluationForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState("");
  const [hasTrackedStart, setHasTrackedStart] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [pdfExportProgress, setPdfExportProgress] = useState(0);
  const [pdfExportStatus, setPdfExportStatus] = useState("");

  const submitMutation = trpc.luxembourgEvaluation.submit.useMutation();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    if (!hasTrackedStart) {
      trackEvent("evaluation_started");
      setHasTrackedStart(true);
    }
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggleSoftSkill = (skill: string) => {
    setForm((f) => ({
      ...f,
      softSkills: f.softSkills.includes(skill)
        ? f.softSkills.filter((s) => s !== skill)
        : [...f.softSkills, skill],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (form.fullName.trim().length < 3) return setFormError("Le nom complet doit contenir au moins 3 caractères.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setFormError("Adresse email invalide.");
    if (form.jobTitle.trim().length < 3) return setFormError("Le titre professionnel doit contenir au moins 3 caractères.");
    const years = Number(form.yearsExperience);
    if (Number.isNaN(years) || years < 0 || years > 50) return setFormError("Années d'expérience invalides (0 à 50).");
    if (!form.sector) return setFormError("Veuillez sélectionner un secteur professionnel.");
    if (!form.educationLevel) return setFormError("Veuillez sélectionner votre niveau de formation.");
    if (!form.frenchLevel) return setFormError("Veuillez sélectionner votre niveau de français.");
    if (!form.englishLevel) return setFormError("Veuillez sélectionner votre niveau d'anglais.");
    if (!form.skillsLevel) return setFormError("Veuillez sélectionner votre niveau de compétences.");

    submitMutation.mutate(
      {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        jobTitle: form.jobTitle.trim(),
        yearsExperience: years,
        sector: form.sector as any,
        educationLevel: form.educationLevel as any,
        frenchLevel: form.frenchLevel as any,
        englishLevel: form.englishLevel as any,
        skillsLevel: form.skillsLevel as any,
        softSkills: form.softSkills as any,
      },
      {
        onSuccess: (data) => {
          trackEvent("evaluation_completed", { score: data.result.scoreTotal, destination_recommended: data.result.eligibilityStatus });
        },
      }
    );
  };

  const handleDownloadPdf = async () => {
    if (!submitMutation.data || isPdfExporting) return;
    setIsPdfExporting(true);
    setPdfExportProgress(15);
    setPdfExportStatus("Préparation de l’export PDF…");

    try {
      const { result } = submitMutation.data;
      setPdfExportProgress(35);
      setPdfExportStatus("Chargement des dépendances PDF…");
      const { default: JsPDF } = await import("jspdf");
      setPdfExportProgress(60);
      setPdfExportStatus("Génération du document PDF…");
      const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    let y = 20;
    pdf.setFontSize(18);
    pdf.setTextColor(102, 126, 234);
    pdf.text("3M Travel Agency — Évaluation Luxembourg", 15, y);
    y += 10;
    pdf.setFontSize(11);
    pdf.setTextColor(10, 37, 64);
    pdf.text(`Candidat : ${form.fullName}`, 15, y); y += 7;
    pdf.text(`Email : ${form.email}`, 15, y); y += 7;
    pdf.text(`Poste : ${form.jobTitle}`, 15, y); y += 10;

    pdf.setFontSize(24);
    pdf.setTextColor(102, 126, 234);
    pdf.text(`Score : ${result.scoreTotal}/100`, 15, y); y += 10;
    pdf.setFontSize(13);
    pdf.text(result.statusLabel.replace(/[✅🔴🟡]/g, "").trim(), 15, y); y += 12;

    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const rows: [string, number, number][] = [
      ["Formation", result.scoreFormation, 15],
      ["Expérience", result.scoreExperience, 15],
      ["Français", result.scoreFrancais, 15],
      ["Anglais", result.scoreAnglais, 15],
      ["Secteur (Luxembourg)", result.scoreSecteur, 15],
      ["Compétences", result.scoreCompetences, 15],
      ["Bonus soft skills", result.scoreBonus, 10],
    ];
    for (const [label, val, max] of rows) {
      pdf.text(`${label} : ${val}/${max}`, 15, y);
      y += 7;
    }

    y += 5;
    pdf.setTextColor(10, 37, 64);
    const recLines = pdf.splitTextToSize(result.recommendationText, 180);
    pdf.text(recLines, 15, y);
    y += recLines.length * 6 + 10;

    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text("3M Travel Agency SARL — +1 672 897 2999 — hello@3mtravelagency.com", 15, 280);

      setPdfExportProgress(85);
      setPdfExportStatus("Téléchargement du document PDF…");
      pdf.save(`3M_Evaluation_${form.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
      setPdfExportProgress(100);
      setPdfExportStatus("Export PDF terminé");
      toast.success("Export PDF réussi", {
        description: "Votre évaluation a été générée et téléchargée avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de l’export PDF Luxembourg", error);
      setPdfExportStatus("L’export PDF a échoué");
      toast.error("Échec de l’export PDF", {
        description: "Veuillez réessayer ou contacter le support si le problème persiste.",
      });
    } finally {
      setIsPdfExporting(false);
      window.setTimeout(() => {
        setPdfExportProgress(0);
        setPdfExportStatus("");
      }, 800);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setHasTrackedStart(false);
    submitMutation.reset();
  };

  // ─── Écran de résultat ─────────────────────────────────────────────────
  if (submitMutation.data) {
    const { result, alternatives, teamWhatsappUrl } = submitMutation.data;
    const statusColor = STATUS_COLORS[result.eligibilityStatus] || "text-gray-700";
    const scoreBars: [string, number, number][] = [
      ["Formation", result.scoreFormation, 15],
      ["Expérience", result.scoreExperience, 15],
      ["Français", result.scoreFrancais, 15],
      ["Anglais", result.scoreAnglais, 15],
      ["Secteur (Luxembourg)", result.scoreSecteur, 15],
      ["Compétences", result.scoreCompetences, 15],
      ["Bonus soft skills", result.scoreBonus, 10],
    ];

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="text-5xl font-bold" style={{ color: "#667eea" }}>{result.scoreTotal}<span className="text-2xl text-gray-400">/100</span></div>
          <p className={`text-lg font-bold mt-2 ${statusColor}`}>{result.statusLabel}</p>
        </div>

        <div className="space-y-2 mb-6">
          {scoreBars.map(([label, val, max]) => (
            <div key={label}>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>{label}</span>
                <span className="font-semibold">{val}/{max}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full" style={{ width: `${(val / max) * 100}%`, background: "linear-gradient(90deg, #667eea, #764ba2)" }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-6">
          <p className="text-gray-800">{result.recommendationText}</p>
        </div>

        {alternatives.length > 0 && (
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">🌍 Destinations alternatives recommandées</h3>
            <p className="text-sm text-gray-700 mb-4">Votre profil est très attractif pour ces destinations. Explorez les opportunités ci-dessous.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {alternatives.map((alt) => (
                <div key={alt.name} className="bg-white border-l-4 border-indigo-500 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-gray-900 text-lg">{alt.name}</p>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">Score: {alt.estimatedScore}/100</span>
                  </div>
                  <p className="text-sm font-semibold text-green-600 mb-2">{alt.salaryRange}</p>
                  <p className="text-xs text-gray-600 mb-2">⏱️ {alt.timeline}</p>
                  <p className="text-xs text-indigo-600 font-semibold">{alt.advantage}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center italic">Les délais et salaires sont des estimations basées sur les données 2024-2025.</p>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-6 text-center">
          Un email détaillé vient de vous être envoyé à <strong>{form.email}</strong>.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a href={teamWhatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <MessageCircle className="w-4 h-4 mr-2" /> Discuter sur WhatsApp
            </Button>
          </a>
          <div className="flex-1 space-y-2" aria-live="polite">
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isPdfExporting}
              className="w-full"
              aria-busy={isPdfExporting}
              aria-label={isPdfExporting ? "Export PDF en cours" : "Télécharger l’évaluation en PDF"}
            >
              {isPdfExporting ? (
                <><Loader className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> Export en cours…</>
              ) : (
                <><Download className="w-4 h-4 mr-2" aria-hidden="true" /> Télécharger le PDF</>
              )}
            </Button>
            {isPdfExporting && (
              <div className="space-y-1" role="status" aria-label={pdfExportStatus}>
                <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                  <span>{pdfExportStatus}</span>
                  <span>{pdfExportProgress}%</span>
                </div>
                <Progress value={pdfExportProgress} className="h-2" aria-label={`Progression de l’export PDF : ${pdfExportProgress}%`} />
              </div>
            )}
          </div>
        </div>
        <button onClick={handleReset} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-4">
          Faire une nouvelle évaluation
        </button>
      </motion.div>
    );
  }

  // ─── Formulaire ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
      <div className="text-center mb-6">
        <span className="text-3xl">🌍</span>
        <h3 className="text-xl font-bold text-gray-900 mt-2">Système d'Évaluation Candidats</h3>
        <p className="text-sm text-gray-500">Éligibilité Luxembourg — résultat immédiat</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lux-fullName">Nom complet *</Label>
            <Input id="lux-fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Votre nom complet" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="lux-email">Email *</Label>
            <Input id="lux-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="vous@exemple.com" className="mt-1" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lux-phone">Téléphone</Label>
            <Input id="lux-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+237 6XX XXX XXX" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="lux-jobTitle">Titre professionnel *</Label>
            <Input id="lux-jobTitle" value={form.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} placeholder="Ex: Infirmier(ère)" className="mt-1" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lux-years">Années d'expérience *</Label>
            <Input id="lux-years" type="number" min={0} max={50} value={form.yearsExperience} onChange={(e) => update("yearsExperience", e.target.value)} placeholder="0-50" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="lux-sector">Secteur professionnel *</Label>
            <select id="lux-sector" value={form.sector} onChange={(e) => update("sector", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lux-education">Niveau de formation *</Label>
            <select id="lux-education" value={form.educationLevel} onChange={(e) => update("educationLevel", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              <option value="master_dual">Master / double diplôme ou +</option>
              <option value="licence_cert">Licence + certification</option>
              <option value="bac_cqp">Bac / CQP</option>
            </select>
          </div>
          <div>
            <Label htmlFor="lux-skills">Compétences pertinentes *</Label>
            <select id="lux-skills" value={form.skillsLevel} onChange={(e) => update("skillsLevel", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              <option value="excellentes">Excellentes et transférables</option>
              <option value="bonnes">Bonnes</option>
              <option value="basiques">Basiques</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lux-french">Niveau de français *</Label>
            <select id="lux-french" value={form.frenchLevel} onChange={(e) => update("frenchLevel", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              <option value="natif_c2">Natif / C2</option>
              <option value="b2">B2 (bon niveau)</option>
              <option value="b1">B1 (correct)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="lux-english">Niveau d'anglais *</Label>
            <select id="lux-english" value={form.englishLevel} onChange={(e) => update("englishLevel", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              <option value="b2_plus">B2 ou plus</option>
              <option value="b1_b2">B1-B2</option>
              <option value="moins_b1">Moins de B1</option>
              <option value="absent">Aucun</option>
            </select>
          </div>
        </div>

        <div>
          <Label className="block mb-2">Points forts (optionnel, bonus jusqu'à 10 pts)</Label>
          <div className="grid sm:grid-cols-2 gap-2">
            {SOFT_SKILLS.map((skill) => (
              <label key={skill.value} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={form.softSkills.includes(skill.value)} onChange={() => toggleSoftSkill(skill.value)} className="w-4 h-4" />
                <span className="text-sm text-gray-700">{skill.label}</span>
              </label>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {(formError || submitMutation.error) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{formError || submitMutation.error?.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" disabled={submitMutation.isPending} className="w-full py-6 text-base font-semibold" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
          {submitMutation.isPending ? (
            <span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Calcul en cours...</span>
          ) : (
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Évaluer mon éligibilité</span>
          )}
        </Button>
      </form>
    </div>
  );
}
