import { ArrowRight } from "lucide-react";
import { QUICK_ACTIONS } from "@/data/serviceCatalog";
import { useLanguage } from "@/contexts/LanguageContext";

const ACTION_COPY: Record<string, { title: { fr: string; en: string }; hint: { fr: string; en: string } }> = {
  dossier: { title: { fr: "Préparer mon dossier", en: "Prepare my file" }, hint: { fr: "Évaluation, pièces et suivi traçable", en: "Assessment, documents and traceable follow-up" } },
  travailler: { title: { fr: "Travailler à l’étranger", en: "Work abroad" }, hint: { fr: "Profil, employeur et autorisations", en: "Profile, employer and authorisations" } },
  etudier: { title: { fr: "Étudier à l’étranger", en: "Study abroad" }, hint: { fr: "Admission et visa d’études", en: "Admission and study visa" } },
  visa: { title: { fr: "Demander un visa", en: "Apply for a visa" }, hint: { fr: "Checklist et dépôt guidés", en: "Guided checklist and filing" } },
  recrutement: { title: { fr: "Recrutement partenaires", en: "Partner recruitment" }, hint: { fr: "Agences et employeurs vérifiés", en: "Verified agencies and employers" } },
  conseiller: { title: { fr: "Parler à un conseiller", en: "Talk to an advisor" }, hint: { fr: "Échange direct, sans engagement", en: "Direct exchange, no commitment" } },
  vol: { title: { fr: "Réserver un vol", en: "Book a flight" }, hint: { fr: "Après validation du dossier", en: "After file validation" } },
  assurance: { title: { fr: "M’assurer pour voyager", en: "Get travel insurance" }, hint: { fr: "Couverture adaptée au séjour", en: "Coverage suited to your trip" } },
  evisa: { title: { fr: "Obtenir un e-Visa", en: "Get an e-Visa" }, hint: { fr: "Autorisation électronique", en: "Electronic authorisation" } },
  cni: { title: { fr: "Refaire ma CNI ou mon passeport", en: "Renew my ID or passport" }, hint: { fr: "Dossier prêt pour Yaoundé", en: "File ready for Yaoundé" } },
};

/** Grille d'intentions : chaque carte mène directement à l'action, sans passer par un menu. */
export function QuickActionsGrid({ className = "" }: { className?: string }) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "fr";
  return (
    <ul className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className}`} data-testid="quick-actions">
      {QUICK_ACTIONS.map((action) => {
        const copy = ACTION_COPY[action.id];
        return (
          <li key={action.id}>
            <a
              href={action.href}
              className="group flex min-h-14 h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:gap-4 sm:p-4"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-700 group-hover:text-white" aria-hidden="true">
                <action.icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black leading-5 text-slate-950">{copy?.title[lang] ?? action.title}</span>
                <span className="mt-0.5 block text-xs leading-4 text-slate-500">{copy?.hint[lang] ?? action.hint}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export default function QuickActionsSection() {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="quick-actions-title" className="bg-white pb-6 pt-10 md:pt-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 text-center md:mb-8">
          <h2 id="quick-actions-title" className="text-2xl font-black text-slate-950 md:text-3xl">{t("Que voulez-vous accomplir ?", "What do you want to achieve?")}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            {t(
              "Commencez par le dossier ou le recrutement autorisé ; les services de voyage viennent ensuite, avec un conseiller 3M jusqu’au dépôt.",
              "Start with your file or authorised recruitment; travel services come next, with a 3M advisor through filing.",
            )}
          </p>
        </div>
        <QuickActionsGrid />
        <p className="mt-5 text-center text-sm text-slate-600">
          {t("Besoin d’un autre service ?", "Need another service?")}{" "}
          <a href="/services" className="font-bold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            {t("Voir tous nos services", "See all our services")}
          </a>
        </p>
      </div>
    </section>
  );
}
