import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader, AlertCircle, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface FormState {
  fullName: string; email: string; phone: string; dateOfBirth: string; nationality: string;
  cityOfResidence: string; maritalStatus: string; numberOfDependents: string;
  educationLevel: string; diplomaTitle: string; graduationYear: string; fieldOfStudy: string;
  employmentStatus: string; currentJobTitle: string; yearsOfExperience: string; industrySector: string; mainTasks: string;
  frenchLevel: string; englishLevel: string; languageTestsTaken: string;
  destinationCategory: string; destinationCountry: string; visaType: string; travelReason: string; availableBudget: string;
  priorVisaRefusal: boolean; priorVisaRefusalCountry: string; criminalRecord: boolean; familyAbroad: boolean;
  message: string;
}

const initialForm: FormState = {
  fullName: '', email: '', phone: '', dateOfBirth: '', nationality: '',
  cityOfResidence: '', maritalStatus: '', numberOfDependents: '',
  educationLevel: '', diplomaTitle: '', graduationYear: '', fieldOfStudy: '',
  employmentStatus: '', currentJobTitle: '', yearsOfExperience: '', industrySector: '', mainTasks: '',
  frenchLevel: '', englishLevel: '', languageTestsTaken: '',
  destinationCategory: 'canada', destinationCountry: '', visaType: 'canada_rp', travelReason: '', availableBudget: '',
  priorVisaRefusal: false, priorVisaRefusalCountry: '', criminalRecord: false, familyAbroad: false,
  message: '',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-blue-900 mb-4 mt-8 first:mt-0 border-b border-blue-100 pb-2">{children}</h2>;
}

export default function Evaluation() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  const submitMutation = trpc.evaluation.submit.useMutation();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (form.fullName.trim().length < 3) return setFormError('Merci d\'indiquer votre nom complet.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setFormError('Adresse email invalide.');
    if (form.phone.trim().length < 8) return setFormError('Numéro de téléphone invalide.');
    if (!form.destinationCategory) return setFormError('Merci de sélectionner une destination.');

    let cvBase64: string | undefined;
    if (cvFile) {
      try {
        cvBase64 = await fileToBase64(cvFile);
      } catch {
        setFormError('Erreur lors de la lecture du CV.');
        return;
      }
    }

    submitMutation.mutate({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      nationality: form.nationality || undefined,
      cityOfResidence: form.cityOfResidence || undefined,
      maritalStatus: form.maritalStatus || undefined,
      numberOfDependents: form.numberOfDependents ? parseInt(form.numberOfDependents) : undefined,
      educationLevel: form.educationLevel || undefined,
      diplomaTitle: form.diplomaTitle || undefined,
      graduationYear: form.graduationYear || undefined,
      fieldOfStudy: form.fieldOfStudy || undefined,
      employmentStatus: form.employmentStatus || undefined,
      currentJobTitle: form.currentJobTitle || undefined,
      yearsOfExperience: form.yearsOfExperience || undefined,
      industrySector: form.industrySector || undefined,
      mainTasks: form.mainTasks || undefined,
      frenchLevel: form.frenchLevel || undefined,
      englishLevel: form.englishLevel || undefined,
      languageTestsTaken: form.languageTestsTaken || undefined,
      destinationCategory: form.destinationCategory as any,
      destinationCountry: form.destinationCountry || undefined,
      visaType: form.visaType as any,
      travelReason: form.travelReason || undefined,
      availableBudget: form.availableBudget || undefined,
      priorVisaRefusal: form.priorVisaRefusal,
      priorVisaRefusalCountry: form.priorVisaRefusalCountry || undefined,
      criminalRecord: form.criminalRecord,
      familyAbroad: form.familyAbroad,
      message: form.message || undefined,
      cvBase64,
      cvFileName: cvFile?.name,
      cvMimeType: cvFile?.type,
    });
  };

  if (submitMutation.data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-blue-50 to-white">
        <Card className="p-8 max-w-lg text-center">
          <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Évaluation envoyée !</h2>
          <p className="text-gray-600 text-sm">
            Notre équipe (assistée par IA) analyse votre profil. Vous recevrez le résultat par email et il sera aussi visible dans votre espace candidat.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3 h-3" /> Analyse assistée par IA
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Évaluation complète de votre profil</h1>
          <p className="text-gray-600">Ces informations nous permettent d'évaluer votre éligibilité pour n'importe quelle destination — Canada RP, Europe, et bien d'autres.</p>
        </div>

        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <SectionTitle>État civil & famille</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Nom complet *</Label><Input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="mt-1" /></div>
              <div><Label>Date de naissance</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} className="mt-1" /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="mt-1" /></div>
              <div><Label>Téléphone *</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+237 6XX XXX XXX" className="mt-1" /></div>
              <div><Label>Nationalité</Label><Input value={form.nationality} onChange={(e) => update('nationality', e.target.value)} className="mt-1" /></div>
              <div><Label>Ville de résidence</Label><Input value={form.cityOfResidence} onChange={(e) => update('cityOfResidence', e.target.value)} className="mt-1" /></div>
              <div>
                <Label>Situation matrimoniale</Label>
                <select value={form.maritalStatus} onChange={(e) => update('maritalStatus', e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  <option value="">Sélectionner...</option>
                  <option value="celibataire">Célibataire</option>
                  <option value="marie">Marié(e)</option>
                  <option value="divorce">Divorcé(e)</option>
                  <option value="veuf">Veuf/Veuve</option>
                </select>
              </div>
              <div><Label>Nombre d'enfants à charge</Label><Input type="number" min="0" value={form.numberOfDependents} onChange={(e) => update('numberOfDependents', e.target.value)} className="mt-1" /></div>
            </div>

            <SectionTitle>Études & académique</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Niveau d'études le plus élevé</Label>
                <select value={form.educationLevel} onChange={(e) => update('educationLevel', e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  <option value="">Sélectionner...</option>
                  <option value="bac">Baccalauréat</option>
                  <option value="bac2">Bac+2 / BTS / DUT</option>
                  <option value="licence">Licence</option>
                  <option value="master">Master ou plus</option>
                  <option value="doctorat">Doctorat</option>
                </select>
              </div>
              <div><Label>Intitulé exact du diplôme</Label><Input value={form.diplomaTitle} onChange={(e) => update('diplomaTitle', e.target.value)} className="mt-1" /></div>
              <div><Label>Année d'obtention</Label><Input value={form.graduationYear} onChange={(e) => update('graduationYear', e.target.value)} placeholder="2022" className="mt-1" /></div>
              <div><Label>Domaine d'études</Label><Input value={form.fieldOfStudy} onChange={(e) => update('fieldOfStudy', e.target.value)} className="mt-1" /></div>
            </div>

            <SectionTitle>Expérience professionnelle</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Situation professionnelle</Label>
                <select value={form.employmentStatus} onChange={(e) => update('employmentStatus', e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  <option value="">Sélectionner...</option>
                  <option value="employe">Employé(e)</option>
                  <option value="independant">Indépendant(e)</option>
                  <option value="sans_emploi">Sans emploi</option>
                  <option value="etudiant">Étudiant(e)</option>
                </select>
              </div>
              <div><Label>Intitulé du poste actuel</Label><Input value={form.currentJobTitle} onChange={(e) => update('currentJobTitle', e.target.value)} className="mt-1" /></div>
              <div>
                <Label>Années d'expérience continue</Label>
                <select value={form.yearsOfExperience} onChange={(e) => update('yearsOfExperience', e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  <option value="">Sélectionner...</option>
                  <option value="0-1">Moins d'1 an</option>
                  <option value="1-3">1 à 3 ans</option>
                  <option value="3-5">3 à 5 ans</option>
                  <option value="5-10">5 à 10 ans</option>
                  <option value="10+">10 ans ou plus</option>
                </select>
              </div>
              <div><Label>Secteur d'activité</Label><Input value={form.industrySector} onChange={(e) => update('industrySector', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Tâches principales</Label><Textarea value={form.mainTasks} onChange={(e) => update('mainTasks', e.target.value)} rows={2} className="mt-1" /></div>

            <SectionTitle>Compétences linguistiques</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Niveau en français</Label>
                <select value={form.frenchLevel} onChange={(e) => update('frenchLevel', e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  <option value="">Sélectionner...</option>
                  <option value="natif">Natif</option>
                  <option value="c1_c2">C1 / C2 (courant)</option>
                  <option value="b2">B2</option>
                  <option value="b1">B1</option>
                  <option value="debutant">Débutant</option>
                </select>
              </div>
              <div>
                <Label>Niveau en anglais</Label>
                <select value={form.englishLevel} onChange={(e) => update('englishLevel', e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  <option value="">Sélectionner...</option>
                  <option value="natif">Natif</option>
                  <option value="c1_c2">C1 / C2 (courant)</option>
                  <option value="b2">B2</option>
                  <option value="b1">B1</option>
                  <option value="debutant">Débutant / Basique</option>
                </select>
              </div>
            </div>
            <div><Label>Tests officiels passés ou à passer</Label><Input value={form.languageTestsTaken} onChange={(e) => update('languageTestsTaken', e.target.value)} placeholder="Ex: TEF, TCF, IELTS..." className="mt-1" /></div>

            <SectionTitle>Projet & pays cible</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Catégorie de destination *</Label>
                <select value={form.destinationCategory} onChange={(e) => update('destinationCategory', e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  <option value="canada">Canada</option>
                  <option value="schengen">Europe / Schengen</option>
                  <option value="autre">Autre destination</option>
                </select>
              </div>
              <div><Label>Pays précis</Label><Input value={form.destinationCountry} onChange={(e) => update('destinationCountry', e.target.value)} placeholder="Ex: Canada, Luxembourg, Pologne..." className="mt-1" /></div>
              <div>
                <Label>Type de visa recherché *</Label>
                <select value={form.visaType} onChange={(e) => update('visaType', e.target.value)} className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md text-sm">
                  <option value="canada_rp">Canada — Résidence Permanente</option>
                  <option value="canada_etude">Canada — Études</option>
                  <option value="canada_tourisme">Canada — Visiteur</option>
                  <option value="schengen_travail">Europe — Travail</option>
                  <option value="schengen_etude">Europe — Études</option>
                  <option value="schengen_tourisme">Europe — Visiteur</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div><Label>Budget disponible (FCFA)</Label><Input value={form.availableBudget} onChange={(e) => update('availableBudget', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Motif du séjour</Label><Input value={form.travelReason} onChange={(e) => update('travelReason', e.target.value)} className="mt-1" /></div>

            <SectionTitle>Historique & antécédents</SectionTitle>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.priorVisaRefusal} onChange={(e) => update('priorVisaRefusal', e.target.checked)} />
                Refus de visa antérieur
              </label>
              {form.priorVisaRefusal && (
                <Input value={form.priorVisaRefusalCountry} onChange={(e) => update('priorVisaRefusalCountry', e.target.value)} placeholder="Préciser le pays" className="ml-6" />
              )}
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.criminalRecord} onChange={(e) => update('criminalRecord', e.target.checked)} />
                Antécédents judiciaires
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.familyAbroad} onChange={(e) => update('familyAbroad', e.target.checked)} />
                Présence de famille à l'étranger
              </label>
            </div>

            <div>
              <Label>CV (PDF, optionnel mais recommandé)</Label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                className="mt-1 w-full text-sm"
              />
            </div>

            <div><Label>Message complémentaire</Label><Textarea value={form.message} onChange={(e) => update('message', e.target.value)} rows={3} className="mt-1" /></div>

            {(formError || submitMutation.error) && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError || submitMutation.error?.message}</span>
              </div>
            )}

            <Button type="submit" disabled={submitMutation.isPending} className="w-full py-6 text-base bg-blue-600 hover:bg-blue-700">
              {submitMutation.isPending ? (
                <span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Envoi en cours...</span>
              ) : (
                'Envoyer mon évaluation'
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center">Limité à 2 évaluations gratuites par personne.</p>
          </form>
        </Card>
      </div>
    </div>
  );
}
