import { ArrowRight, BriefcaseBusiness, Building2, Download, Globe2, ShieldCheck, UsersRound } from "lucide-react";
import { FaqSection } from "@/components/PageEnrichment";
import { PARTNERS_FAQ } from "@/data/pageEnrichment";

import { useLanguage } from "@/contexts/LanguageContext";
import { CORRIDOR_REGIONS, CORRIDOR_ROUTES } from "@shared/talentCorridor";
import { Button } from "@/components/ui/button";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { getServiceVisual } from "@/data/premiumVisuals";
import { INTERNATIONAL_BRAND } from "@/data/internationalBrand";

/**
 * Hub public des 4 interfaces — porte d’entrée internationale pour recruteurs
 * et orientation claire vers client / agences / employeurs.
 */
export default function PartnersHub() {
  const { language } = useLanguage();
  const en = language === "en";
  const visual = getServiceVisual("recrutement");

  const exportAnonymisedProfile = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFillColor(7, 27, 61);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("3M TRAVEL AGENCY", 18, 13);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(en ? "Anonymised partner profile — fictitious sample" : "Fiche partenaire anonymisée — exemple fictif", 18, 20);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(en ? "Anonymised profile" : "Fiche anonymisée", 18, 43);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(en ? "Fictitious data shared only as a layout example." : "Données fictives présentées uniquement comme exemple de format.", 18, 50);

    const rows: Array<[string, string]> = en
      ? [["Code", "PRF-3M-4821"], ["Sector", "Healthcare — nursing"], ["Experience", "4–6 years"], ["Languages", "French · English B1"], ["Target region", "Europe"], ["Availability", "Within 3 months"]]
      : [["Code", "PRF-3M-4821"], ["Secteur", "Santé — soins infirmiers"], ["Expérience", "4–6 ans"], ["Langues", "Français · anglais B1"], ["Région cible", "Europe"], ["Disponibilité", "Sous 3 mois"]];
    let y = 66;
    rows.forEach(([label, value]) => {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(18, y - 6, 174, 12, 2, 2, "F");
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.text(label.toUpperCase(), 24, y + 1);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.text(value, 82, y + 1);
      y += 16;
    });
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    const privacy = en
      ? "Hidden by default: full name, phone, email, passport number, raw CV and address. Contact goes through 3M after candidate consent."
      : "Masqués par défaut : nom complet, téléphone, e-mail, passeport, CV brut et adresse. Le contact passe par 3M après consentement du candidat.";
    doc.text(doc.splitTextToSize(privacy, 174), 18, y + 8);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(en ? "Illustrative document — not a candidate record." : "Document illustratif — ne constitue pas un dossier candidat.", 18, 280);
    doc.save("3m-fiche-anonymisee-exemple.pdf");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(135,185,255,0.25),_transparent_28rem),linear-gradient(160deg,_#071b3d_0%,_#0b2f6f_55%,_#1463ff_120%)]">
      <section className="relative mx-auto max-w-6xl overflow-hidden px-4 pb-10 pt-14 sm:pt-20" data-testid="partners-hub-hero">
        <PremiumCoverImage visual={visual} priority className="absolute inset-0" imgClassName="h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#071b3d]/70 via-[#0b2f6f]/80 to-[#0b2f6f]/95" />
        <div className="relative z-10">
        <p className="font-[Georgia,Cambria,'Times_New_Roman',serif] text-2xl font-normal tracking-tight text-amber-200 sm:text-3xl">
          {INTERNATIONAL_BRAND.publicName}
        </p>
        <p className="mt-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200">
          <Globe2 className="h-4 w-4" aria-hidden="true" />
          {en ? "Africa → Europe · Americas · Asia" : "Afrique → Europe · Amériques · Asie"}
        </p>
        <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
          {en ? "International talent corridor" : "Corridor de talents international"}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-sky-100 sm:text-lg">
          {en
            ? "Candidates across Africa register and build a selectable profile. Verified placement agencies and employers shortlist anonymised profiles. 3M TRAVEL AGENCY then handles the administrative procedure once contract and invitation letter are approved — no job or visa is promised."
            : "Les candidats d’Afrique s’inscrivent et construisent un profil sélectionnable. Les agences de placement et employeurs vérifiés présélectionnent des profils anonymisés. 3M TRAVEL AGENCY gère ensuite la procédure administrative une fois le contrat et la lettre d’invitation approuvés — aucun emploi ni visa n’est promis."}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {CORRIDOR_REGIONS.map((region) => (
            <span key={region.id} className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
              {en ? region.en : region.fr}
            </span>
          ))}
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            {en ? INTERNATIONAL_BRAND.cta.space.en : "Créer mon espace candidat"}
          </a>
          <a href="/consultation" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-amber-300/50 bg-amber-400/15 px-5 py-3 text-sm font-bold text-amber-50 hover:bg-amber-400/25">
            {en ? INTERNATIONAL_BRAND.cta.advisor.en : INTERNATIONAL_BRAND.cta.advisor.fr}
          </a>
        </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="four-interfaces-title">
        <h2 id="four-interfaces-title" className="text-sm font-black uppercase tracking-[0.18em] text-amber-200">
          {en ? "Four interfaces · one corridor" : "Quatre interfaces · un corridor"}
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <a href="/register" className="group rounded-2xl border border-white/20 bg-white/95 p-6 transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b3d]" data-testid="partners-hub-client">
            <UsersRound className="h-8 w-8 text-[#0f2460]" aria-hidden="true" />
            <p className="mt-4 text-lg font-black text-slate-950">{en ? "1. Candidate space" : "1. Espace candidat"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {en
                ? "Create an account, complete the assessment, consent to anonymised sharing, and become selectable."
                : "Créer un compte, compléter l’évaluation, consentir au partage anonymisé et devenir sélectionnable."}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1463ff]">
              {en ? "Register / sign in" : "S’inscrire / se connecter"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </a>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-white transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-1 hover:bg-white/15 hover:shadow-2xl" data-testid="partners-hub-admin">
            <ShieldCheck className="h-8 w-8 text-amber-300" aria-hidden="true" />
            <p className="mt-4 text-lg font-black">{en ? "2. 3M operations" : "2. Pilotage 3M"}</p>
            <p className="mt-2 text-sm leading-6 text-sky-100">
              {en
                ? "Our team verifies organisations, prepares anonymised profiles and follows the administrative procedure after a selection — internal tools only."
                : "Notre équipe vérifie les organisations, prépare les profils anonymisés et suit la procédure administrative après une sélection — outils internes uniquement."}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-sky-200">
              {en ? "Internal access only" : "Accès interne uniquement"}
            </p>
          </div>

          <div className="group rounded-2xl border border-white/20 bg-white/95 p-6 transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-1 hover:shadow-2xl" data-testid="partners-hub-agencies">
            <BriefcaseBusiness className="h-8 w-8 text-[#0f2460]" aria-hidden="true" />
            <p className="mt-4 text-lg font-black text-slate-950">{en ? "3. Placement agencies" : "3. Agences de placement"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {en
                ? "Access eligible candidates from the 3M evaluation pipeline. Human verification before any credentials."
                : "Accéder aux candidats éligibles issus de l’évaluation 3M. Vérification humaine avant tout identifiant."}
            </p>
            <a href={CORRIDOR_ROUTES.agencies} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1463ff] underline-offset-4 transition-[color,transform] duration-200 hover:text-[#0f2460] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1463ff] focus-visible:ring-offset-2">
              {en ? "Agency portal" : "Portail agences"} <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
            <p className="mt-3 text-xs text-slate-500">
              <a href={CORRIDOR_ROUTES.agenciesLogin} className="font-semibold text-indigo-700 underline-offset-2 transition-colors duration-200 hover:text-[#0f2460] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2">
                {en ? "Already verified? Sign in to the agency workspace" : "Déjà vérifié ? Ouvrir l’espace agence"}
              </a>
            </p>
          </div>

          <a href={CORRIDOR_ROUTES.employers} className="group rounded-2xl border border-white/20 bg-white/95 p-6 transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b3d]" data-testid="partners-hub-employers">
            <Building2 className="h-8 w-8 text-[#0f2460]" aria-hidden="true" />
            <p className="mt-4 text-lg font-black text-slate-950">{en ? "4. Direct employers" : "4. Employeurs directs"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {en
                ? "Review top anonymised profiles for Europe, the Americas and Asia. Select, then 3M handles admin follow-up."
                : "Examiner les meilleurs profils anonymisés pour l’Europe, les Amériques et l’Asie. Sélectionner, puis 3M gère le suivi admin."}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1463ff]">
              {en ? "Employer portal" : "Portail employeurs"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </a>
        </div>

        <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-6 text-sky-50">
          <p className="font-black text-white">{en ? "Our sharing rules" : "Nos règles de partage"}</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 sm:grid-cols-2">
            <li>· {en ? "Organisation verification is mandatory" : "Vérification d’organisation obligatoire"}</li>
            <li>· {en ? "Candidate consent + anonymised profiles only" : "Consentement candidat + profils anonymisés uniquement"}</li>
            <li>· {en ? "No automatic access or hiring decision" : "Aucun accès automatique ni décision d’embauche"}</li>
            <li>· {en ? "Immigration outcome remains with authorities" : "La décision d’immigration reste aux autorités"}</li>
          </ul>
          <p className="mt-4 text-sm font-semibold text-amber-100" data-testid="partners-access-terms">
            {en
              ? "Partner access: no registration fee · manual verification within a few business days (confirmed in writing)."
              : "Accès partenaires : sans frais d’inscription · vérification manuelle sous quelques jours ouvrés (confirmée par écrit)."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-[#071b3d] hover:bg-sky-50">
              <a href="/?project=travail#evaluation-multi">{en ? "Candidate assessment" : "Évaluation candidat"}</a>
            </Button>
            <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <a href={CORRIDOR_ROUTES.agenciesRegister}>{en ? "Request agency access" : "Demander un accès agence"}</a>
            </Button>
            <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <a href={CORRIDOR_ROUTES.employersRegister}>{en ? "Request employer access" : "Demander un accès employeur"}</a>
            </Button>
          </div>
        </div>

        <aside className="mt-8 rounded-2xl border border-white/20 bg-white/95 p-6 text-slate-900" data-testid="anonymised-profile-sample" aria-labelledby="anonymised-sample-title">
          <h2 id="anonymised-sample-title" className="text-lg font-black text-slate-950">
            {en ? "Example of an anonymised profile" : "Exemple de fiche anonymisée"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {en
              ? "Fictitious data — what a verified agency or employer sees before any contact through 3M."
              : "Données fictives — ce qu’une agence ou un employeur vérifié voit avant tout contact via 3M."}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[7rem_1fr]">
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 text-center text-xs font-bold uppercase tracking-wide text-slate-600" aria-hidden="true">
              <span>{en ? "Photo" : "Photo"}</span>
              <span>{en ? "hidden" : "masquée"}</span>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{en ? "Code" : "Code"}</dt><dd className="font-semibold">PRF-3M-4821</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{en ? "Sector" : "Secteur"}</dt><dd className="font-semibold">{en ? "Healthcare — nursing" : "Santé — soins infirmiers"}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{en ? "Experience" : "Expérience"}</dt><dd className="font-semibold">{en ? "4–6 years" : "4–6 ans"}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{en ? "Languages" : "Langues"}</dt><dd className="font-semibold">{en ? "French · English B1" : "Français · anglais B1"}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{en ? "Target region" : "Région cible"}</dt><dd className="font-semibold">{en ? "Europe" : "Europe"}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{en ? "Availability" : "Disponibilité"}</dt><dd className="font-semibold">{en ? "Within 3 months" : "Sous 3 mois"}</dd></div>
            </dl>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            {en
              ? "Hidden by default: full name, phone, email, passport number, raw CV and address. Contact always goes through 3M after candidate consent."
              : "Masqués par défaut : nom complet, téléphone, e-mail, n° de passeport, CV brut et adresse. Le contact passe toujours par 3M après consentement du candidat."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={exportAnonymisedProfile}
            className="mt-5 min-h-11 border-indigo-200 bg-white text-indigo-900 hover:bg-indigo-50"
            data-testid="export-anonymised-profile-pdf"
            aria-label={en ? "Download the anonymised profile example as PDF" : "Télécharger l’exemple de fiche anonymisée en PDF"}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            {en ? "Download PDF example" : "Télécharger l’exemple PDF"}
          </Button>
        </aside>
      </section>
      <FaqSection title={en ? "Frequently asked questions" : "Questions fréquentes"} introduction={en ? "How candidate profiles are shared, and who decides what." : "Comment les profils candidats sont partagés, et qui décide de quoi."} items={en ? PARTNERS_FAQ.en : PARTNERS_FAQ.fr} tone="slate" testId="partners-faq" />
    </main>
  );
}
