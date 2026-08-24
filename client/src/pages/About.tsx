import { CheckCircle2, FileSearch, Globe2, ShieldCheck, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PublicEvaluationCTA } from "@/components/PublicEvaluationCTA";

const OPERATING_PRINCIPLES = [
  {
    icon: FileSearch,
    title: "Information expliquée",
    text: "Les étapes, documents et frais applicables sont précisés pour votre situation avant toute décision de votre part.",
  },
  {
    icon: UsersRound,
    title: "Suivi humain",
    text: "Un conseiller traite le dossier et confirme les prochaines actions ; aucune décision administrative sensible n’est automatisée.",
  },
  {
    icon: ShieldCheck,
    title: "Données protégées",
    text: "Les informations transmises sont utilisées pour le traitement demandé et les documents restent soumis à des contrôles d’accès.",
  },
  {
    icon: Globe2,
    title: "Sources à confirmer",
    text: "Les exigences et délais peuvent évoluer. Les éléments déterminants sont vérifiés auprès des sources officielles concernées avant soumission.",
  },
];

const PROCESS = [
  "Vous présentez votre projet par le formulaire gratuit ou à l’agence.",
  "L’équipe confirme le périmètre, les documents attendus et les honoraires applicables à votre cas.",
  "Vous choisissez de poursuivre uniquement après avoir reçu les informations nécessaires.",
  "Les décisions de visa, permis, admission, assurance ou fournisseur restent prises par les autorités ou organismes compétents.",
];

export default function About() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50">
      <section className="px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">3M Travel &amp; Services</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Qui sommes-nous&nbsp;?</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            3M Travel &amp; Services accompagne les particuliers, entreprises et professionnels dans la préparation de projets de mobilité internationale&nbsp;: procédures, visas, eVisas, voyages, documents et services connexes.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-slate-500">
            Nous présentons ici notre mode d’accompagnement, et non des résultats garantis. Chaque dossier est examiné selon sa situation, les exigences applicables et les décisions des organismes compétents.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {OPERATING_PRINCIPLES.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-slate-200 p-6 shadow-sm">
                  <Icon className="h-7 w-7 text-blue-700" aria-hidden="true" />
                  <h2 className="mt-4 text-lg font-black text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Notre manière de travailler</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Un accompagnement clair, étape par étape</h2>
            <ol className="mt-8 space-y-4">
              {PROCESS.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-black text-white">{index + 1}</span>
                  <span className="text-sm leading-6 text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <Card className="border-blue-100 bg-blue-950 p-8 text-white shadow-xl">
            <h2 className="text-2xl font-black">Engagement de transparence</h2>
            <p className="mt-4 text-sm leading-7 text-blue-100">
              Nous ne présentons pas de certification, agrément, partenariat institutionnel, volume de dossiers, note client ou taux de réussite sans source vérifiable et autorisation adaptée. Les autorités consulaires, établissements et fournisseurs conservent leurs décisions indépendantes.
            </p>
            <div className="mt-6 border-t border-white/15 pt-6">
              <p className="text-sm font-bold text-white">Ce qui est confirmé avant toute démarche</p>
              <ul className="mt-3 space-y-2 text-sm text-blue-100">
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Le service demandé et les documents attendus.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Les honoraires d’agence, les frais tiers éventuels et leurs conditions.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Les limites de l’accompagnement et la responsabilité des autorités compétentes.</li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black text-white">Parlons de votre projet</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300">Commencez par une évaluation gratuite. Elle n’engage aucune procédure et permet de recevoir une première orientation humaine.</p>
        <PublicEvaluationCTA className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
          Commencer l’évaluation gratuite
        </PublicEvaluationCTA>
      </section>
    </main>
  );
}
