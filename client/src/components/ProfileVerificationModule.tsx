import { BadgeCheck, BriefcaseBusiness, FileCheck2, Landmark, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import { COMPANY_PROFILE } from "@/lib/companyContacts";
import { useLanguage } from "@/contexts/LanguageContext";

const verificationSteps = {
  fr: [
    { icon: UserCheck, title: "Consentement et projet", text: "Le candidat choisit son projet et autorise explicitement les usages nécessaires à son dossier." },
    { icon: FileCheck2, title: "Pièces documentées", text: "Les documents déposés en ligne ou en agence sont rattachés avec leur origine et leur statut." },
    { icon: BadgeCheck, title: "Évaluation humaine", text: "Un conseiller habilité vérifie l’évaluation avant toute activation ou remise au candidat." },
    { icon: BriefcaseBusiness, title: "Soumission contrôlée", text: "Un profil n’est partagé avec un partenaire ou un employeur vérifié qu’après les validations prévues." },
    { icon: ShieldCheck, title: "Retour et procédure", text: "Les retours sont consignés dans le dossier ; les décisions externes restent indépendantes de 3M Travel & Services." },
  ],
  en: [
    { icon: UserCheck, title: "Consent and project", text: "The candidate chooses a project and explicitly authorises the uses required for the case file." },
    { icon: FileCheck2, title: "Documented documents", text: "Documents submitted online or in an agency are linked with their source and status." },
    { icon: BadgeCheck, title: "Human review", text: "An authorised adviser verifies the assessment before any activation or delivery to the candidate." },
    { icon: BriefcaseBusiness, title: "Controlled submission", text: "A profile is shared with a partner or verified employer only after the required reviews." },
    { icon: ShieldCheck, title: "Feedback and procedure", text: "Feedback is logged in the case file; external decisions remain independent from 3M Travel & Services." },
  ],
} as const;

const spaces = {
  fr: [
    { title: "Espace candidat", text: "Consentement, documents, étapes et retours lisibles.", icon: UsersRound },
    { title: "Espace employeur", text: "Profils anonymisés, uniquement après vérification et autorisation.", icon: BriefcaseBusiness },
    { title: "Espace partenaire", text: "Soumissions suivies, confirmations et éléments de procédure traçables.", icon: Landmark },
    { title: "Espace administration", text: "Contrôles humains, échéances, remises et historique d’actions.", icon: ShieldCheck },
  ],
  en: [
    { title: "Candidate space", text: "Consent, documents, steps and feedback in a clear view.", icon: UsersRound },
    { title: "Employer space", text: "Anonymised profiles, only after verification and authorisation.", icon: BriefcaseBusiness },
    { title: "Partner space", text: "Tracked submissions, confirmations and traceable procedure items.", icon: Landmark },
    { title: "Administration space", text: "Human controls, deadlines, deliveries and action history.", icon: ShieldCheck },
  ],
} as const;

export default function ProfileVerificationModule() {
  const { language, t } = useLanguage();
  const localizedSteps = verificationSteps[language];
  const localizedSpaces = spaces[language];
  return (
    <section aria-labelledby="verification-title" className="bg-[#071b3d] py-14 text-white md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-200">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> {t("Vérification des profils", "Profile verification")}
            </p>
            <h2 id="verification-title" className="mt-5 text-3xl font-black leading-tight sm:text-4xl">{t("Un dossier suivi, pas une promesse automatique.", "A tracked case file, not an automatic promise.")}</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
              {t("Notre parcours relie le candidat, les partenaires de placement et les employeurs dans un cadre traçable. Les sélections, permis, invitations et décisions de visa restent exclusivement du ressort des organismes et autorités compétents.", "Our process connects candidates, placement partners and employers through a traceable framework. Selections, work permits, invitations and visa decisions remain exclusively with the competent organisations and authorities.")}
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="border border-white/15 bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-amber-200">{t("Identité légale", "Legal identity")}</p><p className="mt-2 text-sm font-semibold">{COMPANY_PROFILE.legalIdentifiers.registration}</p><p className="text-sm font-semibold">NIU {COMPANY_PROFILE.legalIdentifiers.taxpayerId}</p></div>
              <div className="border border-white/15 bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-amber-200">{t("Transparence", "Transparency")}</p><a href="/sources-officielles" className="mt-2 inline-block text-sm font-bold text-white underline decoration-amber-300 underline-offset-4">{t("Consulter les sources officielles", "View official sources")}</a></div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">{t("Les indicateurs publics de placement ne sont affichés que lorsqu’une base de calcul vérifiable et une période de référence sont disponibles.", "Public placement indicators are displayed only when a verifiable calculation basis and a reference period are available.")}</p>
          </div>
          <ol className="grid gap-3" aria-label={t("Carnet de vérification en cinq étapes", "Five-step verification record")}>
            {localizedSteps.map((step, index) => {
              const Icon = step.icon;
              return <li key={step.title} className="grid grid-cols-[auto_1fr] gap-4 border border-white/15 bg-white/[0.04] p-4 sm:p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 text-sm font-black text-[#071b3d]">{index + 1}</span>
                <div><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-amber-200" aria-hidden="true" /><h3 className="font-bold">{step.title}</h3></div><p className="mt-1 text-sm leading-6 text-slate-200">{step.text}</p></div>
              </li>;
            })}
          </ol>
        </div>
        <div className="mt-10 border-t border-white/15 pt-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">{t("Les quatre espaces de suivi", "The four tracking spaces")}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {localizedSpaces.map((space) => { const Icon = space.icon; return <div key={space.title} className="border border-white/15 bg-white/[0.04] p-4"><Icon className="h-5 w-5 text-amber-200" aria-hidden="true" /><h3 className="mt-3 font-bold">{space.title}</h3><p className="mt-1 text-sm leading-6 text-slate-200">{space.text}</p></div>; })}
          </div>
        </div>
      </div>
    </section>
  );
}
