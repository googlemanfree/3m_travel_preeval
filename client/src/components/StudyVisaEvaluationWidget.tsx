import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, MessageCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

const STATUS_COLORS: Record<string, string> = {
  tres_favorable: "text-green-600",
  favorable: "text-green-600",
  a_renforcer: "text-amber-500",
  risque_eleve: "text-red-600",
};

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  targetCountry: string;
  academicLevel: string;
  gradeLevel: string;
  languageLevel: string;
  admissionStatus: string;
  financialCapacity: string;
  returnTies: string;
}

const initialForm: FormState = {
  fullName: "", email: "", phone: "", targetCountry: "",
  academicLevel: "", gradeLevel: "", languageLevel: "",
  admissionStatus: "", financialCapacity: "", returnTies: "",
};

export default function StudyVisaEvaluationWidget() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState("");

  const submitMutation = trpc.studyVisaEvaluation.submit.useMutation();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (form.fullName.trim().length < 3) return setFormError("Le nom complet doit contenir au moins 3 caractères.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setFormError("Adresse email invalide.");
    if (!form.academicLevel) return setFormError("Veuillez sélectionner votre niveau académique.");
    if (!form.gradeLevel) return setFormError("Veuillez sélectionner votre niveau de résultats scolaires.");
    if (!form.languageLevel) return setFormError("Veuillez sélectionner votre niveau de langue.");
    if (!form.admissionStatus) return setFormError("Veuillez indiquer où vous en êtes dans vos candidatures.");
    if (!form.financialCapacity) return setFormError("Veuillez indiquer votre capacité financière.");
    if (!form.returnTies) return setFormError("Veuillez indiquer vos liens avec votre pays d'origine.");

    submitMutation.mutate({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      targetCountry: form.targetCountry || undefined,
      academicLevel: form.academicLevel as any,
      gradeLevel: form.gradeLevel as any,
      languageLevel: form.languageLevel as any,
      admissionStatus: form.admissionStatus as any,
      financialCapacity: form.financialCapacity as any,
      returnTies: form.returnTies as any,
    });
  };

  const handleReset = () => {
    setForm(initialForm);
    submitMutation.reset();
  };

  if (submitMutation.data) {
    const { result, teamWhatsappUrl } = submitMutation.data;
    const statusColor = STATUS_COLORS[result.eligibilityStatus] || "text-gray-700";
    const bars: [string, number, number][] = [
      ["Niveau académique", result.scoreAcademic, 20],
      ["Résultats scolaires", result.scoreGrades, 15],
      ["Niveau de langue", result.scoreLanguage, 20],
      ["Statut d'admission", result.scoreAdmission, 15],
      ["Capacité financière", result.scoreFinancial, 20],
      ["Projet de retour", result.scoreReturnTies, 10],
    ];

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-blue-700">{result.scoreTotal}<span className="text-2xl text-gray-400">/100</span></div>
          <p className={`text-lg font-bold mt-2 ${statusColor}`}>{result.statusLabel}</p>
        </div>
        <div className="space-y-2 mb-6">
          {bars.map(([label, val, max]) => (
            <div key={label}>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>{label}</span><span className="font-semibold">{val}/{max}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${(val / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <p className="text-gray-800">{result.recommendationText}</p>
        </div>
        <p className="text-sm text-gray-500 mb-6 text-center">Un email détaillé vient de vous être envoyé à <strong>{form.email}</strong>.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a href={teamWhatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full bg-green-600 hover:bg-green-700"><MessageCircle className="w-4 h-4 mr-2" /> Discuter sur WhatsApp</Button>
          </a>
        </div>
        <button onClick={handleReset} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-4">
          Faire une nouvelle évaluation
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
      <div className="text-center mb-6">
        <span className="text-3xl">🎓</span>
        <h3 className="text-xl font-bold text-gray-900 mt-2">Évaluation Visa Études</h3>
        <p className="text-sm text-gray-500">Résultat immédiat, gratuit et sans engagement</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="se-fullName">Nom complet *</Label>
            <Input id="se-fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Votre nom complet" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="se-email">Email *</Label>
            <Input id="se-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="vous@exemple.com" className="mt-1" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="se-phone">Téléphone</Label>
            <Input id="se-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+237 6XX XXX XXX" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="se-country">Destination visée</Label>
            <select id="se-country" value={form.targetCountry} onChange={(e) => update("targetCountry", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              <option value="Canada">Canada</option>
              <option value="France">France</option>
              <option value="Belgique">Belgique</option>
              <option value="Allemagne">Allemagne</option>
              <option value="Pologne">Pologne</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="se-academic">Niveau académique *</Label>
            <select id="se-academic" value={form.academicLevel} onChange={(e) => update("academicLevel", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              <option value="master_mention">Master ou plus, avec mention</option>
              <option value="licence">Licence</option>
              <option value="bac2">Bac+2 / BTS / DUT</option>
              <option value="bac">Baccalauréat</option>
            </select>
          </div>
          <div>
            <Label htmlFor="se-grades">Résultats scolaires *</Label>
            <select id="se-grades" value={form.gradeLevel} onChange={(e) => update("gradeLevel", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              <option value="tres_bien">Très bien</option>
              <option value="bien">Bien</option>
              <option value="assez_bien">Assez bien</option>
              <option value="passable">Passable</option>
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="se-language">Niveau de langue (français ou anglais) *</Label>
            <select id="se-language" value={form.languageLevel} onChange={(e) => update("languageLevel", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              <option value="c1_c2">C1 / C2 (courant)</option>
              <option value="b2">B2 (bon niveau)</option>
              <option value="b1">B1 (correct)</option>
              <option value="moins_b1">Moins de B1</option>
            </select>
          </div>
          <div>
            <Label htmlFor="se-admission">Statut de candidature *</Label>
            <select id="se-admission" value={form.admissionStatus} onChange={(e) => update("admissionStatus", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              <option value="admis">Déjà admis dans un établissement</option>
              <option value="en_cours">Candidatures en cours</option>
              <option value="pas_commence">Pas encore commencé</option>
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="se-financial">Capacité financière démontrable *</Label>
            <select id="se-financial" value={form.financialCapacity} onChange={(e) => update("financialCapacity", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              <option value="complete">Complète et documentée</option>
              <option value="partielle">Partielle</option>
              <option value="incertaine">Incertaine</option>
            </select>
          </div>
          <div>
            <Label htmlFor="se-ties">Liens avec votre pays d'origine *</Label>
            <select id="se-ties" value={form.returnTies} onChange={(e) => update("returnTies", e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
              <option value="">Sélectionner...</option>
              <option value="solide">Solides (famille, bien, projet pro)</option>
              <option value="modere">Modérés</option>
              <option value="faible">Faibles</option>
            </select>
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

        <Button type="submit" disabled={submitMutation.isPending} className="w-full py-6 text-base font-semibold bg-gradient-to-r from-blue-700 to-blue-500">
          {submitMutation.isPending ? (
            <span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Calcul en cours...</span>
          ) : (
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Évaluer mon profil</span>
          )}
        </Button>
      </form>
    </div>
  );
}
