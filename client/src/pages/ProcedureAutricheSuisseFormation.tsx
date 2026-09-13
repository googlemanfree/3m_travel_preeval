import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { ArrowRight, AlertTriangle, CheckCircle2, ExternalLink, FileText, ShieldCheck } from "lucide-react";

const EVAL_LINK = "/evaluation?project=etudes&destination=Autriche%20%2F%20Suisse";

const AUTRICHE_STEPS = [
  "Préparation linguistique — l'allemand est indispensable ; viser un niveau A1 à B1 minimum avant de candidater.",
  "Ciblage des métiers en pénurie — secteurs prioritaires identifiés par la stratégie autrichienne 2026 (artisanat technique, santé, hôtellerie).",
  "Constitution du dossier candidat — CV au format allemand (Lebenslauf), lettre de motivation en allemand, traductions certifiées des diplômes.",
  "Candidature auprès des entreprises autrichiennes — recherche directe ou via portails spécialisés.",
  "Signature du Lehrvertrag (contrat d'apprentissage) — document central pour la suite du dossier.",
  "Dépôt de la demande de visa national (catégorie D) pour formation professionnelle, ou de la Red-White-Red Card selon le profil, à l'ambassade d'Autriche du pays de résidence.",
  "Enregistrement à l'arrivée — déclaration au Meldeamt local sous 3 jours, puis inscription à la Berufsschule assignée.",
];

const AUTRICHE_DOCUMENTS = [
  "Passeport valide",
  "Lehrvertrag signé par l'entreprise d'accueil",
  "Certificat de langue allemande",
  "Diplômes traduits et certifiés (niveau équivalent à la 10ème/12ème)",
  "Justificatif de logement et assurance maladie complète",
  "Preuve de ressources suffisantes",
];

const SUISSE_CONDITIONS = [
  "Âge généralement compris entre 18 et 35 ans (parfois 30 ans selon la nationalité)",
  "Avoir déjà suivi au moins deux années de formation professionnelle ou détenir des qualifications pertinentes",
  "Disposer d'un contrat d'apprentissage signé avec un employeur suisse, approuvé par le canton",
  "Prouver des moyens de subsistance suffisants, le salaire d'apprenti étant souvent modeste en début de formation",
];

const SUISSE_STEPS = [
  "Évaluation d'admissibilité — âge, nationalité, qualifications et adéquation avec la formation visée.",
  "Recherche d'un organisme d'accueil — obtention d'une offre de formation ou d'un contrat d'apprentissage auprès d'un employeur suisse.",
  "Constitution du dossier — contrat d'apprentissage signé, plan de formation structuré, diplômes/certificats, justificatif de ressources financières.",
  "Approbation cantonale — le contrat d'apprentissage doit être validé par la direction cantonale de la formation professionnelle.",
  "Dépôt de la demande — à l'ambassade ou au consulat suisse du pays de résidence.",
  "Délivrance de l'autorisation de séjour — valable un an, renouvelable tant que les conditions de la formation sont remplies.",
];

const SUISSE_DOCUMENTS = [
  "Passeport valide",
  "Contrat d'apprentissage approuvé par le canton",
  "Plan de formation structuré",
  "Diplômes ou certificats professionnels antérieurs",
  "Preuve de ressources financières suffisantes",
];

const COMPARISON = [
  { label: "Nom du dispositif", allemagne: "Ausbildung", autriche: "Lehre", suisse: "Formation professionnelle initiale" },
  { label: "Rémunération indicative", allemagne: "724 € à 1 490 €/mois", autriche: "Variable selon secteur", suisse: "Souvent plus modeste, variable par canton" },
  { label: "Visa dédié", allemagne: "§16a AufenthG", autriche: "Visa D formation ou Red-White-Red Card", suisse: "Autorisation de séjour formation, approuvée par le canton" },
  { label: "Niveau de langue requis", allemagne: "B1 minimum, B2 recommandé", autriche: "A1 à B1 minimum", suisse: "Allemand, français ou italien selon le canton" },
  { label: "Sélectivité", allemagne: "Modérée, forte demande d'apprentis", autriche: "Modérée, ciblée sur métiers en pénurie", suisse: "Plus sélective" },
];

const WHY_3M = [
  "Orientation comparative : nous évaluons votre profil pour identifier la destination la plus réaliste entre Allemagne, Autriche et Suisse selon votre niveau de langue, votre secteur et votre budget.",
  "Accompagnement jusqu'à la signature du contrat, grâce à notre réseau de contacts dans ces trois pays.",
  "Constitution de dossier rigoureuse, adaptée aux spécificités de chaque administration (fédérale en Allemagne, cantonale en Suisse, ciblée métiers en Autriche).",
  "Suivi post-arrivée pour les démarches d'enregistrement local.",
];

const SOURCES = [
  { label: "SECO / KMU-Portal (Suisse) — conditions d'engagement des apprentis étrangers", url: "https://www.kmu.admin.ch/" },
  { label: "Portail européen de la migration — trainee visa Autriche", url: "https://immigration-portal.ec.europa.eu/" },
  { label: "Ambassade d'Autriche (bmeia.gv.at)", url: "https://www.bmeia.gv.at/" },
];

export default function ProcedureAutricheSuisseFormation() {
  const [isSuisseRoute] = useRoute("/procedures/suisse-formation");

  useEffect(() => {
    document.title = isSuisseRoute
      ? "Suisse : apprentissage (formation professionnelle) & visa | 3M Travel & Services"
      : "Autriche : Lehre (apprentissage) & Red-White-Red Card | 3M Travel & Services";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "Apprentissage rémunéré en Autriche (Lehre) ou en Suisse : conditions, étapes du visa et documents requis, avec l'accompagnement 3M Travel & Services depuis Yaoundé.",
    );
  }, [isSuisseRoute]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_15%,rgba(96,165,250,.45),transparent_28%),linear-gradient(125deg,#061a36,#0a3264_55%,#0e5b9f)] px-4 pb-16 pt-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-5xl" aria-hidden="true">{isSuisseRoute ? "🇨🇭" : "🇦🇹"}</p>
          <p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-blue-100">Guide formation · Autriche &amp; Suisse</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            Au-delà de l'Allemagne : l'Autriche et la Suisse, deux autres portes d'entrée vers l'apprentissage européen
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50">
            Le modèle allemand de formation en alternance (Ausbildung) n'est pas unique : l'Autriche (Lehre) et la Suisse (formation professionnelle initiale) proposent des systèmes structurellement très proches — formation rémunérée en entreprise combinée à l'école professionnelle, diplôme reconnu à la clé, et une vraie voie d'installation durable pour les candidats non-européens qui remplissent les conditions.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-blue-100">
            3M Travel &amp; Services élargit son accompagnement à ces deux destinations : évaluation de votre profil, orientation vers le pays le plus adapté à votre situation, préparation linguistique, et suivi du dossier de visa jusqu'à votre installation.
          </p>
          <Link href={EVAL_LINK} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            Comparer mon profil pour l'Allemagne, l'Autriche et la Suisse <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">🇦🇹</span>
            <h2 className="text-2xl font-black text-slate-950">Volet Autriche — Lehre (apprentissage) &amp; Red-White-Red Card</h2>
          </div>
          <h3 className="mt-6 text-lg font-black text-slate-950">Ce qui distingue l'Autriche</h3>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Le système autrichien (Lehre) fonctionne comme le modèle allemand : formation en entreprise + école professionnelle (Berufsschule). L'accès pour les ressortissants de pays tiers passe soit par la <strong>Red-White-Red Card</strong> (carte à points pour les métiers en pénurie), soit par un <strong>visa national D pour formation</strong>, distinct du visa étudiant. L'Autriche a annoncé en 2026 une stratégie de simplification pour attirer davantage d'apprentis étrangers face à un déficit estimé à 200 000 travailleurs qualifiés.
          </p>

          <h3 className="mt-8 text-lg font-black text-slate-950">Étapes de la procédure</h3>
          <ol className="mt-4 grid gap-4 md:grid-cols-2">
            {AUTRICHE_STEPS.map((step, index) => (
              <li key={step} className="rounded-xl border border-slate-200 p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white">{index + 1}</span>
                <p className="mt-3 text-sm leading-6 text-slate-700">{step}</p>
              </li>
            ))}
          </ol>

          <h3 className="mt-8 text-lg font-black text-slate-950">Documents à préparer</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {AUTRICHE_DOCUMENTS.map((doc) => (
              <div key={doc} className="flex gap-3 rounded-xl bg-red-50 p-4">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-700">{doc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <p className="text-sm leading-6 text-amber-900">
              Contrairement au visa étudiant, le visa de formation professionnelle est une catégorie distincte — ne pas confondre les deux démarches, les conditions et pièces justificatives diffèrent.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">🇨🇭</span>
            <h2 className="text-2xl font-black text-slate-950">Volet Suisse — Formation professionnelle initiale (apprentissage)</h2>
          </div>
          <h3 className="mt-6 text-lg font-black text-slate-950">Ce qui distingue la Suisse</h3>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Le système suisse est réputé pour la qualité de son modèle dual et la reconnaissance internationale du CFC (Certificat Fédéral de Capacité). Pour les ressortissants hors UE/AELE, l'accès est plus sélectif que l'Allemagne ou l'Autriche, mais reste possible sous conditions strictes.
          </p>

          <h3 className="mt-8 text-lg font-black text-slate-950">Conditions clés</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {SUISSE_CONDITIONS.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl bg-blue-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-8 text-lg font-black text-slate-950">Étapes de la procédure</h3>
          <ol className="mt-4 grid gap-4 md:grid-cols-2">
            {SUISSE_STEPS.map((step, index) => (
              <li key={step} className="rounded-xl border border-slate-200 p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white">{index + 1}</span>
                <p className="mt-3 text-sm leading-6 text-slate-700">{step}</p>
              </li>
            ))}
          </ol>

          <h3 className="mt-8 text-lg font-black text-slate-950">Documents essentiels</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {SUISSE_DOCUMENTS.map((doc) => (
              <div key={doc} className="flex gap-3 rounded-xl bg-blue-50 p-4">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-700">{doc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h2 className="text-2xl font-black text-slate-950">Tableau comparatif Allemagne / Autriche / Suisse</h2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Critère</th>
                  <th className="px-4 py-3">🇩🇪 Allemagne</th>
                  <th className="px-4 py-3">🇦🇹 Autriche</th>
                  <th className="px-4 py-3">🇨🇭 Suisse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARISON.map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-3 align-top font-bold text-slate-800">{row.label}</td>
                    <td className="px-4 py-3 align-top text-slate-600">{row.allemagne}</td>
                    <td className="px-4 py-3 align-top text-slate-600">{row.autriche}</td>
                    <td className="px-4 py-3 align-top text-slate-600">{row.suisse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Une page dédiée existe aussi pour l'Allemagne : <Link href="/procedures/allemagne-formation" className="font-black text-blue-700 hover:text-blue-900">cours de langue &amp; Ausbildung</Link>.
          </p>
        </section>

        <section className="mt-8 rounded-2xl bg-blue-900 p-6 text-white sm:p-10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-blue-200" aria-hidden="true" />
            <h2 className="text-2xl font-black">Pourquoi passer par 3M Travel &amp; Services pour ces destinations</h2>
          </div>
          <div className="mt-6 grid gap-3">
            {WHY_3M.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl bg-white/10 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-200" aria-hidden="true" />
                <p className="text-sm leading-6 text-blue-50">{item}</p>
              </div>
            ))}
          </div>
          <Link href={EVAL_LINK} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            Démarrer mon évaluation gratuite <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>

        <section className="mt-8 rounded-2xl bg-amber-50 p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-700" aria-hidden="true" />
            <h2 className="text-xl font-black text-amber-950">Informations à vérifier avant toute démarche</h2>
          </div>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-amber-900">
            <li>Les conditions d'âge, de rémunération et de sélectivité varient selon le canton (Suisse) ou le secteur (Autriche) — les chiffres indiqués sont indicatifs.</li>
            <li>La décision finale de délivrance du visa ou du contrat relève exclusivement des autorités et employeurs concernés ; 3M Travel &amp; Services accompagne la préparation du dossier sans garantir l'issue de la demande.</li>
            <li>La Suisse impose des critères d'âge et d'expérience préalable plus stricts que l'Allemagne ou l'Autriche — une évaluation individuelle est indispensable avant tout engagement.</li>
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
