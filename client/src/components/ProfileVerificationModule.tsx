import { BadgeCheck, BriefcaseBusiness, FileCheck2, Landmark, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import { COMPANY_PROFILE } from "@/lib/companyContacts";

const verificationSteps = [
  { icon: UserCheck, title: "Consentement et projet", text: "Le candidat choisit son projet et autorise explicitement les usages nécessaires à son dossier." },
  { icon: FileCheck2, title: "Pièces documentées", text: "Les documents déposés en ligne ou en agence sont rattachés avec leur origine et leur statut." },
  { icon: BadgeCheck, title: "Évaluation humaine", text: "Un conseiller habilité vérifie l’évaluation avant toute activation ou remise au candidat." },
  { icon: BriefcaseBusiness, title: "Soumission contrôlée", text: "Un profil n’est partagé avec un partenaire ou un employeur vérifié qu’après les validations prévues." },
  { icon: ShieldCheck, title: "Retour et procédure", text: "Les retours sont consignés dans le dossier ; les décisions externes restent indépendantes de 3M Travel & Services." },
];

const spaces = [
  { title: "Espace candidat", text: "Consentement, documents, étapes et retours lisibles.", icon: UsersRound },
  { title: "Espace employeur", text: "Profils anonymisés, uniquement après vérification et autorisation.", icon: BriefcaseBusiness },
  { title: "Espace partenaire", text: "Soumissions suivies, confirmations et éléments de procédure traçables.", icon: Landmark },
  { title: "Espace administration", text: "Contrôles humains, échéances, remises et historique d’actions.", icon: ShieldCheck },
];

export default function ProfileVerificationModule() {
  return (
    <section aria-labelledby="verification-title" className="bg-[#071b3d] py-14 text-white md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-200">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Vérification des profils
            </p>
            <h2 id="verification-title" className="mt-5 text-3xl font-black leading-tight sm:text-4xl">Un dossier suivi, pas une promesse automatique.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
              Notre parcours relie le candidat, les partenaires de placement et les employeurs dans un cadre traçable. Les sélections, permis, invitations et décisions de visa restent exclusivement du ressort des organismes et autorités compétents.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="border border-white/15 bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-amber-200">Identité légale</p><p className="mt-2 text-sm font-semibold">{COMPANY_PROFILE.legalIdentifiers.registration}</p><p className="text-sm font-semibold">NIU {COMPANY_PROFILE.legalIdentifiers.taxpayerId}</p></div>
              <div className="border border-white/15 bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-amber-200">Transparence</p><a href="/sources-officielles" className="mt-2 inline-block text-sm font-bold text-white underline decoration-amber-300 underline-offset-4">Consulter les sources officielles</a></div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">Les indicateurs publics de placement ne sont affichés que lorsqu’une base de calcul vérifiable et une période de référence sont disponibles.</p>
          </div>
          <ol className="grid gap-3" aria-label="Carnet de vérification en cinq étapes">
            {verificationSteps.map((step, index) => {
              const Icon = step.icon;
              return <li key={step.title} className="grid grid-cols-[auto_1fr] gap-4 border border-white/15 bg-white/[0.04] p-4 sm:p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 text-sm font-black text-[#071b3d]">{index + 1}</span>
                <div><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-amber-200" aria-hidden="true" /><h3 className="font-bold">{step.title}</h3></div><p className="mt-1 text-sm leading-6 text-slate-200">{step.text}</p></div>
              </li>;
            })}
          </ol>
        </div>
        <div className="mt-10 border-t border-white/15 pt-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">Les quatre espaces de suivi</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {spaces.map((space) => { const Icon = space.icon; return <div key={space.title} className="border border-white/15 bg-white/[0.04] p-4"><Icon className="h-5 w-5 text-amber-200" aria-hidden="true" /><h3 className="mt-3 font-bold">{space.title}</h3><p className="mt-1 text-sm leading-6 text-slate-200">{space.text}</p></div>; })}
          </div>
        </div>
      </div>
    </section>
  );
}
