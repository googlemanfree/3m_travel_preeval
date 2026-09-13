import { useEffect } from "react";
import { ArrowRight, AlertTriangle, CheckCircle2, ExternalLink, FileText, GraduationCap, HardHat, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const EVAL_LINK = "/evaluation?project=etudes&destination=Allemagne";

const LANGUAGE_CONDITIONS = [
  { label: "Intensité du cours", value: "Minimum 18 heures de cours par semaine" },
  { label: "Durée du séjour", value: "Entre 3 et 12 mois (non renouvelable au-delà)" },
  { label: "Ressources financières", value: "Compte bloqué ou déclaration de prise en charge, montant variable selon la ville d'accueil" },
  { label: "Assurance", value: "Couverture maladie valable pour toute la durée du séjour" },
];

const LANGUAGE_STEPS = [
  "Sélection de l'école de langue et inscription avec paiement des frais de cours (confirmation officielle requise).",
  "Constitution du dossier financier : ouverture d'un compte bloqué ou preuve de prise en charge par un tiers.",
  "Dépôt de la demande au consulat allemand du pays de résidence, jamais depuis l'Allemagne, via le formulaire en ligne VIDEX.",
  "Entretien consulaire et présentation du dossier complet.",
  "Délivrance du visa national (D), valable initialement 3 mois.",
  "Sur place : conversion en titre de séjour (Aufenthaltserlaubnis) auprès du service des étrangers (Ausländerbehörde) de la ville d'accueil.",
];

const LANGUAGE_DOCUMENTS = [
  "Passeport valide couvrant toute la durée du séjour",
  "Confirmation d'inscription et preuve de paiement de l'école de langue",
  "Justificatif de ressources financières (compte bloqué ou garant)",
  "CV chronologique sans lacunes + lettre de motivation",
  "Attestation d'assurance maladie",
  "2 photos biométriques récentes",
  "Formulaire VIDEX complété et signé",
];

const AUSBILDUNG_STEPS = [
  { title: "Ciblage du métier et de la région", desc: "Identification des secteurs porteurs (santé, hôtellerie-restauration, métiers techniques) selon votre profil." },
  { title: "Préparation linguistique", desc: "Atteindre le niveau B1 minimum (B2 recommandé), généralement en 9 à 15 mois de formation intensive." },
  { title: "Reconnaissance des diplômes", desc: "Vérification via les bases officielles allemandes (ANABIN/ZAB) si un équivalent est nécessaire, comptez 2 à 3 mois." },
  { title: "Recherche d'employeur", desc: "Mise en relation avec des entreprises allemandes recrutant des apprentis, jusqu'à la signature de l'Ausbildungsvertrag (contrat d'apprentissage), enregistré auprès de la chambre professionnelle compétente (IHK ou HWK)." },
  { title: "Dépôt du visa national §16a AufenthG", desc: "À l'ambassade allemande du pays de résidence, dossier complet, frais de dossier de 75 €." },
  { title: "Traitement de la demande", desc: "Délai variable selon les postes consulaires, généralement entre 6 et 12 semaines, parfois davantage selon la période." },
  { title: "Installation en Allemagne", desc: "Déclaration de domicile (Anmeldung) sous 14 jours, inscription à la sécurité sociale, ouverture d'un compte bancaire local, puis démarrage effectif de la formation." },
];

const AUSBILDUNG_DOCUMENTS = [
  "Passeport valide au moins 12 mois",
  "2 photos biométriques récentes",
  "Ausbildungsvertrag signé par l'employeur et l'apprenti",
  "Justificatif du niveau de langue (certificat B1 ou B2)",
  "Formulaire VIDEX rempli en ligne",
  "Justificatif de paiement des frais de visa",
  "CV et lettre de motivation",
];

const REMUNERATION = [
  { year: "1ère année", amount: "Environ 724 € à 900 €" },
  { year: "2ème et 3ème année", amount: "Progressive, jusqu'à 1 490 € selon le métier et la branche" },
];

const WHY_3M = [
  "Évaluation de profil personnalisée avant tout engagement, pour vérifier votre éligibilité réelle et éviter les démarches inutiles.",
  "Accompagnement linguistique orienté résultat, avec suivi jusqu'à l'obtention du niveau B1/B2 requis.",
  "Réseau d'employeurs partenaires en Allemagne pour faciliter la mise en relation et la signature du contrat d'Ausbildung.",
  "Constitution de dossier sécurisée, avec vérification de chaque pièce avant dépôt consulaire pour limiter les risques de refus.",
  "Suivi jusqu'à l'installation, y compris les démarches administratives une fois sur place (Anmeldung, sécurité sociale, compte bancaire).",
];

const SOURCES = [
  { label: "Ambassades et consulats d'Allemagne (portail diplo.de)", url: "https://rabat.diplo.de/ma-fr/service/visa-einreise/2732332-2732332" },
  { label: "Make it in Germany — portail officiel du gouvernement fédéral", url: "https://www.make-it-in-germany.com/fr/" },
  { label: "Services des étrangers (Ausländerbehörde) — Munich, Stuttgart", url: "https://www.muenchen.de/en/aliens-registration-office" },
];

export default function ProcedureAllemagneFormation() {
  useEffect(() => {
    document.title = "Allemagne : cours de langue, Ausbildung & visa | 3M Travel & Services";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "Cours de langue intensif ou Ausbildung rémunérée en Allemagne : conditions, étapes du visa et documents requis, avec l'accompagnement 3M Travel & Services depuis Yaoundé.",
    );
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_15%,rgba(96,165,250,.45),transparent_28%),linear-gradient(125deg,#061a36,#0a3264_55%,#0e5b9f)] px-4 pb-16 pt-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-5xl" aria-hidden="true">🇩🇪</p>
          <p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-blue-100">Guide formation · Allemagne</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            L'Allemagne : une porte d'entrée concrète vers l'Europe, sans frais de scolarité
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50">
            L'Allemagne forme aujourd'hui plus de <strong className="text-white">213 000 apprentis étrangers</strong> dans le cadre de son système d'Ausbildung — une formation professionnelle rémunérée, reconnue dans toute l'Union européenne, ouverte à des secteurs en forte tension comme la santé, l'hôtellerie-restauration et l'artisanat technique. Un apprenti perçoit entre <strong className="text-white">724 € et 1 490 € par mois</strong> pendant sa formation : la formation est payante pour l'entreprise, pas pour vous.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-blue-100">
            3M Travel & Services vous accompagne à chaque étape : évaluation de votre profil, préparation linguistique, mise en relation avec des employeurs partenaires, constitution du dossier de visa, et suivi jusqu'à votre installation en Allemagne.
          </p>
          <Link href={EVAL_LINK} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            Démarrer mon évaluation gratuite <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <GraduationCap className="h-6 w-6 text-blue-700" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-black text-slate-950">Volet 1 — Visa pour cours de langue intensif</h2>
          </div>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Pour les candidats qui souhaitent d'abord atteindre le niveau d'allemand requis avant de viser une Ausbildung ou des études supérieures.
          </p>

          <h3 className="mt-8 text-lg font-black text-slate-950">Conditions requises</h3>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Critère</th>
                  <th className="px-4 py-3">Exigence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {LANGUAGE_CONDITIONS.map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-3 align-top font-bold text-slate-800">{row.label}</td>
                    <td className="px-4 py-3 align-top text-slate-600">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-8 text-lg font-black text-slate-950">Étapes de la procédure</h3>
          <ol className="mt-4 grid gap-4 md:grid-cols-2">
            {LANGUAGE_STEPS.map((step, index) => (
              <li key={step} className="rounded-xl border border-slate-200 p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white">{index + 1}</span>
                <p className="mt-3 text-sm leading-6 text-slate-700">{step}</p>
              </li>
            ))}
          </ol>

          <h3 className="mt-8 text-lg font-black text-slate-950">Documents à préparer</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {LANGUAGE_DOCUMENTS.map((doc) => (
              <div key={doc} className="flex gap-3 rounded-xl bg-blue-50 p-4">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-700">{doc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <HardHat className="h-6 w-6 text-amber-700" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-black text-slate-950">Volet 2 — Ausbildung : formation professionnelle en contrat allemand</h2>
          </div>
          <p className="mt-4 text-base leading-7 text-slate-600">
            La voie la plus demandée par nos candidats : une formation en alternance, rémunérée, avec un employeur allemand, débouchant sur un diplôme reconnu et une possibilité de séjour prolongé après la formation.
          </p>

          <h3 className="mt-8 text-lg font-black text-slate-950">Parcours complet, étape par étape</h3>
          <ol className="mt-4 grid gap-4">
            {AUSBILDUNG_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-xl border border-slate-200 p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-sm font-black text-white">{index + 1}</span>
                <div>
                  <p className="font-bold text-slate-900">{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <h3 className="mt-8 text-lg font-black text-slate-950">Documents essentiels du dossier</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {AUSBILDUNG_DOCUMENTS.map((doc) => (
              <div key={doc} className="flex gap-3 rounded-xl bg-amber-50 p-4">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-700">{doc}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-8 text-lg font-black text-slate-950">Rémunération indicative pendant la formation</h3>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Année de formation</th>
                  <th className="px-4 py-3">Rémunération mensuelle brute indicative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {REMUNERATION.map((row) => (
                  <tr key={row.year}>
                    <td className="px-4 py-3 align-top font-bold text-slate-800">{row.year}</td>
                    <td className="px-4 py-3 align-top text-slate-600">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-blue-900 p-6 text-white sm:p-10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-blue-200" aria-hidden="true" />
            <h2 className="text-2xl font-black">Pourquoi passer par 3M Travel & Services</h2>
          </div>
          <div className="mt-6 grid gap-3">
            {WHY_3M.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl bg-white/10 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-200" aria-hidden="true" />
                <p className="text-sm leading-6 text-blue-50">{item}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-blue-100">
            Une fois le niveau B1 ou B2 atteint, nous vous accompagnons activement jusqu'à la signature de votre contrat d'apprentissage, grâce à notre réseau d'employeurs partenaires en Allemagne — un accompagnement complet, de la mise en relation jusqu'au dépôt du dossier de visa.
          </p>
          <Link href={EVAL_LINK} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            Vérifier mon éligibilité gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>

        <section className="mt-8 rounded-2xl bg-amber-50 p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-700" aria-hidden="true" />
            <h2 className="text-xl font-black text-amber-950">Informations à vérifier avant toute démarche</h2>
          </div>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-amber-900">
            <li>Les montants (compte bloqué, rémunération d'Ausbildung) varient selon la ville et le secteur d'activité — les chiffres indiqués sont indicatifs et doivent être confirmés au cas par cas.</li>
            <li>Les délais de traitement consulaire varient fortement selon le pays de résidence et la période de l'année.</li>
            <li>La décision finale de délivrance du visa relève exclusivement des autorités consulaires allemandes ; 3M Travel & Services accompagne la préparation du dossier mais ne garantit pas l'issue de la demande.</li>
            <li>Toute demande doit être déposée depuis le pays de résidence du candidat, et non depuis l'Allemagne.</li>
          </ul>
        </section>

        <footer className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Sources officielles consultées</p>
          <div className="mt-3 flex flex-col gap-2">
            {SOURCES.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900">
                {source.label} <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Dernière vérification des sources : 13 septembre 2026. Les règles d'admission, de visa, de séjour et de rémunération peuvent évoluer. Ce guide est informatif et ne remplace pas les instructions de l'ambassade ou de l'autorité compétente.
          </p>
        </footer>
      </div>
    </main>
  );
}
