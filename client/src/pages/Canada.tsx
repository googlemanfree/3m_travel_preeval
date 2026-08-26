import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import CanadaScoreSimulator from "@/components/CanadaScoreSimulator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlaneTakeoff, Building2, MapPinned, BriefcaseBusiness, HeartHandshake, Flag, Target, FileCheck2, Sparkles, UsersRound, AlertCircle, ArrowRight, CheckCircle2, Unlock, GraduationCap, Plane, Globe2, ExternalLink } from "lucide-react";

const pathways = [
  { title: "Entrée express", icon: PlaneTakeoff, tag: "Résidence permanente", text: "IRCC gère trois programmes : Catégorie de l’expérience canadienne, Programme des travailleurs qualifiés (fédéral) et Programme des travailleurs de métiers spécialisés. Le profil est classé dans un bassin et une invitation dépend des rondes et du classement." },
  { title: "Candidats des provinces", icon: Building2, tag: "Nomination provinciale", text: "Les provinces et territoires définissent leurs propres volets, secteurs et critères. Une nomination peut renforcer une stratégie, mais elle n’est ni automatique ni interchangeable d’une province à l’autre." },
  { title: "Voies régionales", icon: MapPinned, tag: "Projet d’établissement", text: "Certaines voies ciblent des communautés ou régions déterminées et peuvent prévoir un employeur désigné, une offre admissible, une expérience précise ou une intention d’établissement vérifiable." },
  { title: "Permis de travail", icon: BriefcaseBusiness, tag: "Mobilité temporaire", text: "Le permis lié à un employeur et le permis ouvert répondent à des situations différentes. Une offre d’emploi, une étude d’impact ou une exemption peut être nécessaire selon le cas ; la résidence permanente est une démarche distincte." },
  { title: "Études au Canada", icon: GraduationCap, tag: "Permis d’études", text: "Le parcours comprend le choix d’un établissement, la vérification du permis d’études, les conditions de séjour et, selon l’admissibilité, les possibilités de travail ou de permis postdiplôme. L’admission relève de l’établissement." },
  { title: "Visite et séjour temporaire", icon: Plane, tag: "Visa ou AVE/eTA", text: "Selon la nationalité et la situation, un visa de visiteur ou une AVE/eTA peut être requis. Un séjour temporaire ne constitue pas une promesse d’installation ou de travail au Canada." },
  { title: "Parrainage familial", icon: HeartHandshake, tag: "Famille admissible", text: "Le parrain et la personne parrainée doivent répondre à des conditions précises et fournir les preuves demandées. L’éligibilité dépend du lien familial et de la situation de chacun." },
  { title: "Québec et autres options", icon: Flag, tag: "Sélection distincte", text: "Le Québec applique une sélection distincte. Une analyse peut aussi examiner les voies francophones, les programmes régionaux, les études ou d’autres programmes ouverts au moment de l’étude." },
];

const officialResources = [
  { label: "Immigrer au Canada", href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada.html", note: "Vue d’ensemble des programmes de résidence permanente." },
  { label: "Entrée express", href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html", note: "Programmes et étapes du système fédéral." },
  { label: "Travailler temporairement", href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada.html", note: "Types de permis et conditions à vérifier." },
  { label: "Étudier au Canada", href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html", note: "Permis d’études, établissement et après-diplôme." },
  { label: "Visiter le Canada", href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html", note: "Visa de visiteur, AVE/eTA et séjour temporaire." },
];

const canadaFaq = [
  { question: "Quelle est la différence entre Entrée express et une nomination provinciale ?", answer: "Entrée express est un système fédéral qui gère des profils dans un bassin pour certains programmes. Une nomination provinciale relève d’une province ou d’un territoire et suit ses propres critères. Les deux parcours ne sont pas interchangeables et une invitation ou nomination n’est jamais garantie." },
  { question: "Dois-je obligatoirement avoir une offre d’emploi pour immigrer au Canada ?", answer: "Pas nécessairement. Certaines voies peuvent être examinées sans offre d’emploi, tandis que d’autres reposent sur un employeur, un poste admissible ou une désignation. Le programme pertinent dépend de votre profil et des critères en vigueur au moment de l’analyse." },
  { question: "Le test de langue est-il nécessaire ?", answer: "Pour plusieurs programmes économiques, un test de langue reconnu peut être exigé ou fortement déterminant. Le niveau, la validité du résultat et la langue acceptée varient selon le programme ; il faut vérifier les exigences officielles avant de déposer un profil." },
  { question: "Un permis d’études permet-il automatiquement de rester au Canada ?", answer: "Non. Un permis d’études autorise un séjour selon ses conditions et sa durée. L’admission relève de l’établissement et toute possibilité ultérieure de travail ou de résidence permanente dépend de règles et d’une admissibilité distinctes." },
  { question: "Quelle est la différence entre un visa de visiteur et une AVE/eTA ?", answer: "Le document requis dépend notamment de la nationalité, du mode de transport et de la situation du voyageur. Une AVE/eTA n’est pas un visa de visiteur et aucun de ces documents ne garantit l’entrée au Canada, qui est évaluée à la frontière." },
  { question: "Combien coûte une procédure canadienne ?", answer: "Les coûts peuvent comprendre les frais gouvernementaux, les tests de langue, l’évaluation des diplômes, les biométries, les examens médicaux, les traductions et, le cas échéant, l’accompagnement professionnel. Les frais et montants officiels doivent être vérifiés sur Canada.ca avant toute décision." },
  { question: "Que fait 3M Travel dans l’accompagnement ?", answer: "3M Travel aide à structurer les informations, repérer les documents à vérifier, préparer les prochaines étapes et suivre les éléments communiqués dans un espace sécurisé. L’agence ne remplace pas IRCC, les provinces, les établissements ni les autorités frontalières." },
  { question: "Les délais et les résultats sont-ils garantis ?", answer: "Non. Les délais, invitations, admissions, permis, visas et décisions dépendent des autorités ou organismes compétents et peuvent évoluer. 3M Travel ne garantit ni emploi, ni contrat, ni invitation, ni permis, ni résidence permanente." },
];

const profileChecks = [
  "Expérience professionnelle et correspondance avec les catégories de métier",
  "Niveau de français et/ou d’anglais à démontrer par un test reconnu",
  "Diplômes, équivalences et évaluation des études lorsque requise",
  "Projet d’établissement : province, région, famille et éventuelle offre d’emploi",
  "Ressources financières, documents d’identité et cohérence globale du dossier"
];

const supportSteps = [
  "Évaluation structurée du profil et clarification de l’objectif",
  "Orientation vers les parcours à explorer et les critères à confirmer",
  "Préparation du profil professionnel et des documents utiles",
  "Contrôle de cohérence avant les étapes de dépôt applicables",
  "Suivi des informations communiquées par le candidat dans son espace sécurisé"
];

export default function Canada() {
  const [scoreCompleted, setScoreCompleted] = useState(false);

  return (
    <ServicePageShell
      eyebrow="Canada · Résidence permanente et mobilité"
      title="Évaluez votre score et construisez votre stratégie Canada"
      introduction="Pour garantir un accompagnement pertinent, le parcours Canada commence par l’évaluation obligatoire de votre score et de votre profil. Découvrez vos chances indicatives avant d’explorer les programmes officiels."
      primaryHref="/evaluation?destination=canada"
      primaryLabel="Faire évaluer mon profil Canada complet"
      officialHref="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada.html"
      officialLabel="Vérifier les programmes IRCC"
      notice="Les programmes, critères, quotas et délais peuvent évoluer. Aucun emploi, contrat de travail, invitation ou résidence permanente n’est garanti par 3M Travel & Services."
    >
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-xl">
        <div className="grid items-stretch lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative min-h-[330px] overflow-hidden">
            <img src="/manus-storage/canada-hero-original_5fe49ae0.jpg" alt="Skyline de Toronto au bord de l’eau" className="h-full min-h-[330px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/45 to-transparent" aria-hidden="true" />
            <div className="absolute left-6 top-6 rounded-full border border-amber-300/60 bg-slate-950/60 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-200">Cap sur le Canada</div>
            <div className="absolute bottom-7 left-6 max-w-md pr-6 sm:left-8">
              <p className="text-sm font-semibold text-amber-200">Mobilité · études · travail · visite</p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Un projet solide commence par une lecture claire de votre situation.</h2>
            </div>
          </div>
          <div className="flex flex-col justify-center bg-[#102747] p-7 sm:p-9">
            <Globe2 className="h-9 w-9 text-amber-300" aria-hidden="true" />
            <h3 className="mt-5 text-2xl font-black text-white">Comprendre les voies avant de choisir</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">Le Canada propose plusieurs parcours. Le rôle de 3M Travel est de structurer les informations, d’identifier les points à vérifier et de vous orienter vers les sources officielles — jamais de garantir une décision d’IRCC.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="border-l-2 border-amber-300 pl-3"><p className="text-xs font-black uppercase tracking-wide text-amber-200">Repère 01</p><p className="mt-1 text-sm text-white">Profil et projet</p></div>
              <div className="border-l-2 border-amber-300 pl-3"><p className="text-xs font-black uppercase tracking-wide text-amber-200">Repère 02</p><p className="mt-1 text-sm text-white">Programme à confirmer</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <img src="/manus-storage/canada-study-original_87390e3b.jpg" alt="Étudiants internationaux sur un campus canadien" className="h-52 w-full object-cover" />
          <div className="p-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Études et avenir professionnel</p><h3 className="mt-2 text-xl font-black text-slate-950">Préparer un projet cohérent</h3><p className="mt-2 text-sm leading-6 text-slate-600">Établissement, niveau d’études, ressources, projet et conditions du permis doivent être examinés ensemble.</p></div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <img src="/manus-storage/canada-nature-original_f93309aa.jpg" alt="Paysage des montagnes Rocheuses au Canada" className="h-52 w-full object-cover" />
          <div className="p-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Installation et mobilité</p><h3 className="mt-2 text-xl font-black text-slate-950">Choisir selon sa réalité</h3><p className="mt-2 text-sm leading-6 text-slate-600">Province, langue, métier, famille et capacité financière influencent l’orientation, sans remplacer les critères officiels.</p></div>
        </div>
      </section>

      {/* ÉTAPE 1 OBLIGATOIRE : SIMULATEUR DE SCORE AU DÉBUT DE LA SECTION CANADA */}
      <ServiceSection
        tone="blue"
        title="Étape 1 : Évaluez votre score CRS avant de continuer"
        introduction="Avant de vous engager dans une procédure ou de consulter les voies détaillées, calculez votre score indicatif. Cela vous permet de vérifier si votre profil répond aux seuils compétitifs habituels."
      >
        <div className="my-2 rounded-2xl border-2 border-blue-300 bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 p-4 text-blue-900">
            <AlertCircle className="h-5 w-5 shrink-0 text-blue-700" />
            <p className="text-sm font-semibold">
              Règle d’orientation 3M : Aucun candidat ne doit s’engager sans vérifier son score préalable. Utilisez le module ci-dessous pour tester votre éligibilité indicative.
            </p>
          </div>

          <CanadaScoreSimulator />

          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-xl bg-slate-50 p-5 sm:flex-row">
            <div>
              <h4 className="text-sm font-black text-slate-900">Avez-vous complété votre simulation ?</h4>
              <p className="text-xs text-slate-600">Confirmez votre score pour déverrouiller l’accès complet aux programmes provinciaux et fédéraux ci-dessous.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setScoreCompleted(true);
                const el = document.getElementById("voies-canada");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-black text-white shadow transition hover:bg-blue-800"
            >
              J’ai vérifié mon score, déverrouiller les parcours <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </ServiceSection>

      {/* ÉTAPE 2 : VOIES DÉTAILLÉES AVEC ANIMATION FLUIDE DE DÉVERROUILLAGE */}
      <div id="voies-canada" className="scroll-mt-24">
        <AnimatePresence mode="wait">
          {!scoreCompleted ? (
            <motion.div
              key="locked"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="my-8 rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 p-8 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-inner">
                <Unlock className="h-6 w-6 opacity-70" />
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-900">Parcours détaillés verrouillés en attente d’évaluation</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Veuillez effectuer votre simulation de score CRS ci-dessus et cliquer sur le bouton de validation pour déverrouiller instantanément toutes les sections détaillées du Canada.
              </p>
              <button
                type="button"
                onClick={() => {
                  setScoreCompleted(true);
                  const el = document.getElementById("voies-canada");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-md transition hover:bg-blue-800"
              >
                Déverrouiller immédiatement <Sparkles className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="unlocked"
              initial={{ opacity: 0, y: 25, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-12"
            >
              {/* Badge de succès de déverrouillage */}
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-sm">
                <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-600" />
                <div>
                  <h4 className="text-base font-black">Parcours Canada déverrouillés avec succès !</h4>
                  <p className="text-xs leading-5 text-emerald-700">Vous pouvez désormais consulter l’intégralité des voies d’immigration, les critères de vérification et les étapes de l’accompagnement 3M Travel.</p>
                </div>
              </div>

              <ServiceSection
                title="Étape 2 : Les principales voies à explorer"
                introduction="Le bon parcours dépend de votre situation réelle. Cette présentation sert à orienter l’évaluation ; elle ne remplace pas les critères officiels ni la décision des autorités."
              >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pathways.map((pathway) => {
                    const Icon = pathway.icon;
                    return (
                      <article key={pathway.title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
                        <div className="flex items-start justify-between gap-3"><Icon className="h-7 w-7 text-blue-700" aria-hidden="true" /><span className="text-right text-[10px] font-black uppercase tracking-wide text-amber-700">{pathway.tag}</span></div>
                        <h3 className="mt-4 text-lg font-black text-slate-950">{pathway.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{pathway.text}</p>
                      </article>
                    );
                  })}
                </div>
              </ServiceSection>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ServiceSection
        tone="blue"
        title="Ce que l’évaluation de votre profil doit vérifier"
        introduction="Plutôt que de choisir une voie au hasard, nous examinons les informations qui peuvent influencer la pertinence d’un programme."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {profileChecks.map((item) => (
            <div key={item} className="flex gap-3 rounded-xl border border-blue-100 bg-white p-4">
              <Target className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <p className="text-sm leading-6 text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </ServiceSection>

      <ServiceSection
        title="Emploi et contrat de travail : une information à traiter avec rigueur"
        introduction="Nous pouvons vous accompagner dans la préparation de votre profil professionnel et l’orientation vers des pistes à vérifier. Une offre d’emploi doit toujours être confirmée par son employeur, et les exigences d’immigration ou de permis de travail restent à vérifier auprès des autorités compétentes."
      >
        <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-2xl bg-slate-950 p-7 text-white">
            <BriefcaseBusiness className="h-8 w-8 text-blue-300" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-black">Accompagnement professionnel responsable</h3>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Le travail de 3M Travel consiste à organiser les informations, améliorer la présentation du profil lorsque cela est pertinent et aider le candidat à comprendre les étapes de son projet. Il ne constitue pas une promesse d’embauche ni de contrat.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-7">
            <FileCheck2 className="h-8 w-8 text-amber-700" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-black text-amber-950">À vérifier avant toute démarche</h3>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Identité de l’employeur, conditions du poste, autorisations, admissibilité du programme et documents demandés. Ne transmettez jamais de paiement à un tiers sans vérification.
            </p>
          </div>
        </div>
      </ServiceSection>

      <ServiceSection
        tone="slate"
        title="L’accompagnement 3M Travel, étape par étape"
        introduction="Le parcours reste adaptable : les actions dépendent du programme réellement pertinent et des documents disponibles."
      >
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {supportSteps.map((step, index) => (
            <li key={step} className="rounded-2xl border border-slate-200 bg-white p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white">
                {index + 1}
              </span>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-800">{step}</p>
            </li>
          ))}
        </ol>
      </ServiceSection>

      <ServiceSection
        tone="blue"
        title="Les sources officielles à consulter"
        introduction="Les règles, frais, délais et documents sont susceptibles d’évoluer. Consultez toujours IRCC et les autorités compétentes avant toute décision."
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {officialResources.map((resource) => (
            <a key={resource.href} href={resource.href} target="_blank" rel="noreferrer" className="group flex min-h-28 items-start gap-3 rounded-xl border border-blue-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
              <ExternalLink className="mt-1 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <span><span className="block font-black text-slate-950 group-hover:text-blue-800">{resource.label}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{resource.note}</span></span>
            </a>
          ))}
        </div>
      </ServiceSection>

      <ServiceSection
        tone="slate"
        title="Questions fréquentes sur les procédures canadiennes"
        introduction="Cette FAQ donne des repères généraux. Les exigences applicables doivent toujours être confirmées dans les sources officielles, car elles peuvent changer."
      >
        <Accordion type="single" collapsible className="mx-auto max-w-4xl divide-y divide-blue-100 rounded-2xl border border-blue-100 bg-white px-5 shadow-sm">
          {canadaFaq.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`} className="border-blue-100">
              <AccordionTrigger className="py-5 text-left text-base font-black text-slate-950 hover:no-underline focus-visible:ring-2 focus-visible:ring-amber-500 [&>svg]:text-blue-700">{item.question}</AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-7 text-slate-700">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ServiceSection>

      <ServiceSection
        title="Préparer votre prochaine action"
        introduction="Une évaluation permet d’ordonner les informations avant de choisir une procédure. Vous pouvez aussi consulter notre centre de ressources ou contacter l’agence."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/evaluation?destination=canada"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />Évaluer mon profil Canada
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
          >
            <UsersRound className="h-4 w-4" aria-hidden="true" />Contacter 3M Travel
          </Link>
        </div>
      </ServiceSection>
    </ServicePageShell>
  );
}
