import React, { useState } from "react";
import { Link } from "wouter";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import CanadaScoreSimulator from "@/components/CanadaScoreSimulator";
import { PlaneTakeoff, Building2, MapPinned, BriefcaseBusiness, HeartHandshake, Flag, Target, FileCheck2, Sparkles, UsersRound, Award, AlertCircle, ArrowRight } from "lucide-react";

const pathways = [
  { title: "Entrée express", icon: PlaneTakeoff, text: "Système fédéral de gestion de demandes pour certains travailleurs qualifiés. L’étude tient compte notamment de l’expérience, des études, des langues, de l’âge, de la situation familiale et du score du profil." },
  { title: "Programmes des candidats des provinces", icon: Building2, text: "Chaque province définit ses volets, secteurs recherchés et critères. Une nomination peut être pertinente selon votre profil, mais les exigences et invitations évoluent selon la province." },
  { title: "Programmes régionaux", icon: MapPinned, text: "Certaines voies ciblent les provinces atlantiques, des communautés rurales ou francophones. Elles peuvent exiger un employeur désigné, une offre admissible ou un projet d’établissement dans une zone précise." },
  { title: "Voies liées à l’emploi", icon: BriefcaseBusiness, text: "Un permis de travail et une offre d’emploi sont des démarches distinctes de la résidence permanente. Les exigences liées à l’employeur, au poste et aux autorisations applicables doivent être vérifiées avant toute décision." },
  { title: "Parrainage familial", icon: HeartHandshake, text: "Cette voie concerne certains liens familiaux admissibles. Le parrain et la personne parrainée doivent répondre aux conditions officielles et fournir les preuves du lien demandées." },
  { title: "Québec et autres options", icon: Flag, text: "Le Québec applique une sélection distincte. Selon le profil, une stratégie peut aussi examiner les voies francophones, les besoins régionaux et les programmes actuellement ouverts." },
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
              J’ai vérifié mon score, continuer vers les voies Canada <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </ServiceSection>

      {/* ÉTAPE 2 : VOIES DÉTAILLÉES (ACCESSIBLES OU DÉVERROUILLÉES) */}
      <div id="voies-canada">
        <ServiceSection
          title="Étape 2 : Les principales voies à explorer"
          introduction="Le bon parcours dépend de votre situation réelle. Cette présentation sert à orienter l’évaluation ; elle ne remplace pas les critères officiels ni la décision des autorités."
        >
          {!scoreCompleted && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex items-center justify-between gap-4">
              <p className="text-sm">
                <strong>Conseil :</strong> Nous vous recommandons d’effectuer d’abord le test de score ci-dessus pour identifier les programmes adaptés à vos points.
              </p>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="shrink-0 text-xs font-bold text-blue-700 underline hover:text-blue-900"
              >
                Remonter au simulateur
              </button>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pathways.map((pathway) => {
              const Icon = pathway.icon;
              return (
                <article key={pathway.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <Icon className="h-7 w-7 text-blue-700" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-black text-slate-950">{pathway.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{pathway.text}</p>
                </article>
              );
            })}
          </div>
        </ServiceSection>
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
