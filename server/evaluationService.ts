/**
 * Service d'évaluation automatique des candidats
 * Génère des rapports personnalisés avec scoring multi-destination
 */

import { Application } from "../drizzle/schema";
import { sanitizeClientCommunicationText } from "./clientCommunication";
import { resolveEvaluationProjectKind, type EvaluationProjectKind } from "../shared/evaluationVisaCv";

// Destinations disponibles pour l'évaluation
const DESTINATIONS = {
  pologne: { name: "Pologne", flag: "🇵🇱", code: "PL" },
  canada: { name: "Canada", flag: "🇨🇦", code: "CA" },
  allemagne: { name: "Allemagne", flag: "🇩🇪", code: "DE" },
  luxembourg: { name: "Luxembourg", flag: "🇱🇺", code: "LU" },
  royaume_uni: { name: "Royaume-Uni", flag: "🇬🇧", code: "UK" },
  etats_unis: { name: "États-Unis", flag: "🇺🇸", code: "US" },
};

// Critères de scoring (sur 100 points)
interface ScoringCriteria {
  education: number;      // /25
  experience: number;     // /25
  language: number;       // /20
  sector: number;         // /20
  ageAdjustment: number;  // /10
}

interface DestinationScore {
  destination: string;
  score: number;
  badge: "excellent" | "recommande" | "admissible" | "modere";
  description: string;
}

/**
 * Calcule le score pour une destination spécifique
 * Ajuste les critères selon les exigences du marché du travail
 */
function calculateDestinationScore(
  criteria: ScoringCriteria,
  destination: string
): DestinationScore {
  let baseScore = criteria.education + criteria.experience + criteria.language + criteria.sector + criteria.ageAdjustment;

  // Ajustements par destination (facteurs de marché)
  let adjustedScore = baseScore;
  let adjustmentFactor = 1;

  switch (destination.toLowerCase()) {
    case "pologne":
      // Marché très favorable pour les techniciens et cadres
      adjustmentFactor = 1.05; // +5% bonus
      break;
    case "canada":
      // Marché favorable, critères clairs et objectifs
      adjustmentFactor = 1.02; // +2% bonus
      break;
    case "allemagne":
      // Marché modérément favorable
      adjustmentFactor = 0.95; // -5% pénalité
      break;
    case "luxembourg":
      // Marché très restrictif pour les non-EU
      adjustmentFactor = 0.75; // -25% pénalité importante
      break;
    case "royaume_uni":
      // Marché modérément restrictif (post-Brexit)
      adjustmentFactor = 0.85; // -15% pénalité
      break;
    case "etats_unis":
      // Marché très restrictif (visa H1B limité)
      adjustmentFactor = 0.70; // -30% pénalité
      break;
  }

  adjustedScore = Math.round(baseScore * adjustmentFactor);
  adjustedScore = Math.max(0, Math.min(100, adjustedScore)); // Limiter entre 0 et 100

  // Déterminer le badge
  let badge: "excellent" | "recommande" | "admissible" | "modere";
  if (adjustedScore >= 85) badge = "excellent";
  else if (adjustedScore >= 70) badge = "recommande";
  else if (adjustedScore >= 55) badge = "admissible";
  else badge = "modere";

  return {
    destination,
    score: adjustedScore,
    badge,
    description: getDestinationDescription(destination, adjustedScore),
  };
}

/**
 * Génère une description contextuelle pour chaque destination
 */
function getDestinationDescription(destination: string, score: number): string {
  const descriptions: Record<string, Record<string, string>> = {
    pologne: {
      excellent: "Dossier excellent — Très forte probabilité d'acceptation. Marché très favorable pour votre profil.",
      recommande: "Dossier recommandé — Bonne probabilité d'acceptation. Procédures simplifiées.",
      admissible: "Dossier admissible — Acceptation possible avec documentation complète.",
      modere: "Éligibilité modérée — Risque administratif important. Considérez les alternatives.",
    },
    canada: {
      excellent: "Dossier excellent — Très forte probabilité d'acceptation. Profil hautement recherché.",
      recommande: "Dossier recommandé — Bonne probabilité d'acceptation. Critères objectifs favorables.",
      admissible: "Dossier admissible — Acceptation possible avec documentation complète.",
      modere: "Éligibilité modérée — Risque administratif modéré. Préparation rigoureuse requise.",
    },
    luxembourg: {
      excellent: "Dossier excellent — Très forte probabilité d'acceptation (rare pour non-EU).",
      recommande: "Dossier recommandé — Bonne probabilité d'acceptation. Contingentement ministériel favorable.",
      admissible: "Dossier admissible — Acceptation possible mais contingentement strict.",
      modere: "Éligibilité modérée — Risque administratif important. Contingentement ministériel très restrictif.",
    },
    allemagne: {
      excellent: "Dossier excellent — Très forte probabilité d'acceptation. Marché favorable.",
      recommande: "Dossier recommandé — Bonne probabilité d'acceptation. Procédures claires.",
      admissible: "Dossier admissible — Acceptation possible avec documentation complète.",
      modere: "Éligibilité modérée — Risque administratif modéré. Considérez les alternatives.",
    },
    royaume_uni: {
      excellent: "Dossier excellent — Très forte probabilité d'acceptation (post-Brexit).",
      recommande: "Dossier recommandé — Bonne probabilité d'acceptation. Points system favorable.",
      admissible: "Dossier admissible — Acceptation possible avec documentation complète.",
      modere: "Éligibilité modérée — Risque administratif important. Procédures post-Brexit restrictives.",
    },
    etats_unis: {
      excellent: "Dossier excellent — Très forte probabilité d'acceptation (rare pour H1B).",
      recommande: "Dossier recommandé — Bonne probabilité d'acceptation. Profil très recherché.",
      admissible: "Dossier admissible — Acceptation possible mais contingentement H1B très restrictif.",
      modere: "Éligibilité modérée — Risque administratif très important. Visa H1B très limité.",
    },
  };

  const destDesc = descriptions[destination.toLowerCase()] || descriptions.pologne;
  const badgeKey = score >= 85 ? "excellent" : score >= 70 ? "recommande" : score >= 55 ? "admissible" : "modere";
  return destDesc[badgeKey] || "Évaluation en cours...";
}

/**
 * Extrait les critères de scoring depuis les détails du dossier
 */
function extractScoringCriteria(app: Application): ScoringCriteria {
  const anyApp = app as any;
  // Si les détails de scoring sont absents ou incomplets, on effectue un calcul dynamique basé sur les champs du dossier si disponibles
  let criteria: ScoringCriteria = {
    education: 12,
    experience: 12,
    language: 10,
    sector: 10,
    ageAdjustment: 5,
  };

  if (app.scoringDetails) {
    try {
      const details = JSON.parse(app.scoringDetails);
      criteria = {
        education: details.education ?? criteria.education,
        experience: details.experience ?? criteria.experience,
        language: details.language ?? criteria.language,
        sector: details.sector ?? criteria.sector,
        ageAdjustment: details.age ?? criteria.ageAdjustment,
      };
      return criteria;
    } catch (e) {
      // En cas d'erreur de parsing, on utilise une évaluation rigoureuse minimale au lieu d'un score gonflé arbitraire
    }
  }

  // Calcul dynamique de repli basé sur le niveau d'études et d'expérience stocké
  if (anyApp.educationLevel) {
    const edu = anyApp.educationLevel.toLowerCase();
    if (edu.includes("master") || edu.includes("doctorat") || edu.includes("ingénieur") || edu.includes("bac+5")) {
      criteria.education = 22;
    } else if (edu.includes("licence") || edu.includes("bachelor") || edu.includes("bac+3")) {
      criteria.education = 18;
    } else if (edu.includes("bts") || edu.includes("dut") || edu.includes("bac+2")) {
      criteria.education = 15;
    } else {
      criteria.education = 10;
    }
  }

  if (anyApp.yearsOfExperience) {
    const exp = anyApp.yearsOfExperience.toLowerCase();
    if (exp.includes("5") || exp.includes("plus") || exp.includes("10") || exp.includes("supérieur")) {
      criteria.experience = 24;
    } else if (exp.includes("3") || exp.includes("4")) {
      criteria.experience = 20;
    } else if (exp.includes("1") || exp.includes("2")) {
      criteria.experience = 14;
    } else {
      criteria.experience = 8;
    }
  }

  if (anyApp.frenchLevel || anyApp.englishLevel) {
    const lang = ((anyApp.frenchLevel || "") + " " + (anyApp.englishLevel || "")).toLowerCase();
    if (lang.includes("bilingue") || lang.includes("courant") || lang.includes("avancé") || lang.includes("c1") || lang.includes("c2")) {
      criteria.language = 18;
    } else if (lang.includes("intermédiaire") || lang.includes("b2")) {
      criteria.language = 14;
    } else {
      criteria.language = 9;
    }
  }

  return criteria;
}

/**
 * Génère les scores pour toutes les destinations
 */
export function generateAllDestinationScores(app: Application): DestinationScore[] {
  const criteria = extractScoringCriteria(app);
  const destinations = ["pologne", "canada", "allemagne", "luxembourg", "royaume_uni", "etats_unis"];

  return destinations.map(dest => calculateDestinationScore(criteria, dest)).sort((a, b) => b.score - a.score);
}

function reportProjectKindOf(app: Application): EvaluationProjectKind {
  const anyApp = app as { visaType?: string | null; projectType?: string | null; scoringDetails?: string | null };
  let scoringProject: string | null = null;
  try {
    const parsed = JSON.parse(anyApp.scoringDetails || "{}");
    scoringProject = typeof parsed?.projectType === "string" ? parsed.projectType : typeof parsed?.adminDraft?.projectType === "string" ? parsed.adminDraft.projectType : null;
  } catch {
    scoringProject = null;
  }
  return resolveEvaluationProjectKind(anyApp.projectType, anyApp.visaType, scoringProject);
}

/**
 * Génère des recommandations personnalisées selon le type de projet (travail / études / tourisme).
 */
export function generatePersonalizedRecommendations(criteria: ScoringCriteria, app: Application): string[] {
  const kind = reportProjectKindOf(app);
  const recommendations: string[] = [];
  const anyApp = app as { priorVisaRefusal?: boolean | null };

  if (kind === "etudes") {
    if (criteria.education < 16) {
      recommendations.push("Dossier académique : consolidez diplômes, relevés de notes et, si possible, une lettre d’admission ou de pré-admission de l’établissement visé.");
    } else {
      recommendations.push("Parcours académique solide : vos diplômes constituent une base crédible pour un projet d’études à l’étranger.");
    }
    if (criteria.language < 14) {
      recommendations.push("Langue d’études : un test officiel (IELTS, TOEFL, TCF/TEF) au niveau exigé par l’établissement renforce nettement l’admissibilité.");
    } else {
      recommendations.push("Niveau linguistique favorable pour suivre une formation dans la langue d’enseignement déclarée.");
    }
    recommendations.push("Financement : préparez un plan de ressources (relevés, prise en charge, bourse) cohérent avec les frais de scolarité et de séjour.");
    recommendations.push("Projet d’études : rédigez une lettre de motivation claire (choix de la formation, lien avec votre parcours, intention de retour ou de suite de carrière).");
  } else if (kind === "tourisme") {
    recommendations.push("Itinéraire : précisez dates, hébergement et programme de séjour de façon cohérente et vérifiable.");
    recommendations.push("Attaches au pays de résidence : documents d’emploi, activité, famille ou biens démontrant l’intention de retour.");
    if (criteria.language < 10) {
      recommendations.push("Communication : un niveau de langue suffisant pour le séjour (ou un accompagnement) facilite les contrôles consulaires.");
    }
    recommendations.push("Ressources de voyage : preuves de fonds couvrant transport, hébergement et frais de séjour pour toute la durée déclarée.");
  } else {
    if (criteria.language < 14) {
      recommendations.push("Amélioration linguistique : un test officiel certifié (TCF Canada, IELTS ou TEF) au niveau B2/C1 peut renforcer votre évaluation globale.");
    } else {
      recommendations.push("Compétences linguistiques solides : votre profil linguistique est un atout pour les programmes de mobilité professionnelle.");
    }
    if (criteria.experience < 18) {
      recommendations.push("Expérience professionnelle : consolidez certificats de travail et lettres de recommandation pour valoriser votre parcours auprès des employeurs.");
    } else {
      recommendations.push("Expérience professionnelle confirmée : votre parcours constitue une base solide pour les critères de recrutement internationaux.");
    }
    if (criteria.education < 16) {
      recommendations.push("Évaluation des diplômes (WES / ENIC-NARIC) : une attestation d’équivalence officielle renforce l’admissibilité pour les voies d’immigration qualifiée.");
    } else {
      recommendations.push("Niveau de formation académique compétitif : vos diplômes répondent aux standards des destinations partenaires.");
    }
    recommendations.push("CV à jour : pour un projet travail, un CV détaillé et cohérent avec le métier visé est indispensable au montage du dossier.");
  }

  if (anyApp.priorVisaRefusal) {
    recommendations.push("Antécédents de visa : préparez une lettre explicative factuelle démontrant l’évolution de votre situation depuis le refus.");
  }

  return recommendations;
}

function criteriaRowsForKind(
  kind: EvaluationProjectKind,
  criteria: ScoringCriteria,
  adminDraft: { criteria?: { education?: number; experience?: number; languages?: number; market?: number; profile?: number } },
  hasDestinationModel: boolean,
): Array<[string, number, number]> {
  if (hasDestinationModel) {
    if (kind === "etudes") {
      return [
        ["Formation et diplôme", adminDraft.criteria?.education ?? 0, 25],
        ["Projet d’études / motivation", adminDraft.criteria?.profile ?? 0, 25],
        ["Langues déclarées", adminDraft.criteria?.languages ?? 0, 20],
        ["Financement indicatif", adminDraft.criteria?.market ?? 0, 20],
        ["Cohérence du parcours", adminDraft.criteria?.experience ?? 0, 10],
      ];
    }
    if (kind === "tourisme") {
      return [
        ["Cohérence du séjour", adminDraft.criteria?.profile ?? 0, 25],
        ["Attaches et intention de retour", adminDraft.criteria?.experience ?? 0, 25],
        ["Ressources de voyage", adminDraft.criteria?.market ?? 0, 25],
        ["Langues / autonomie", adminDraft.criteria?.languages ?? 0, 15],
        ["Documents de base", adminDraft.criteria?.education ?? 0, 10],
      ];
    }
    return [
      ["Formation et diplôme", adminDraft.criteria?.education ?? 0, 20],
      ["Expérience professionnelle", adminDraft.criteria?.experience ?? 0, 20],
      ["Langues déclarées", adminDraft.criteria?.languages ?? 0, 15],
      ["Adéquation indicative marché", adminDraft.criteria?.market ?? 0, 30],
      ["Profil et cohérence du projet", adminDraft.criteria?.profile ?? 0, 15],
    ];
  }
  if (kind === "etudes") {
    return [
      ["Formation académique", criteria.education, 30],
      ["Projet d’études", criteria.sector, 25],
      ["Compétences linguistiques", criteria.language, 25],
      ["Capacité de financement", criteria.ageAdjustment, 20],
    ];
  }
  if (kind === "tourisme") {
    return [
      ["Cohérence du séjour", criteria.sector, 30],
      ["Attaches socio-économiques", criteria.experience, 25],
      ["Ressources de voyage", criteria.education, 25],
      ["Autonomie linguistique", criteria.language, 20],
    ];
  }
  return [
    ["Formation académique", criteria.education, 25],
    ["Expérience professionnelle", criteria.experience, 25],
    ["Compétences linguistiques", criteria.language, 20],
    ["Secteur en demande", criteria.sector, 20],
    ["Ajustement marché & métier", criteria.ageAdjustment, 10],
  ];
}

/**
 * Génère le rapport d'évaluation complet en HTML
 */
type EvaluationReportOptions = {
  introMessage?: string | null;
};

function escapeReportHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function generateEvaluationReportHTML(app: Application, options: EvaluationReportOptions = {}): string {
  const scores = generateAllDestinationScores(app);
  const topScore = scores[0];
  const criteria = extractScoringCriteria(app);
  const projectKind = reportProjectKindOf(app);
  const projectKindLabel =
    projectKind === "etudes" ? "Visa études"
      : projectKind === "tourisme" ? "Visa tourisme / visite"
        : projectKind === "travail" ? "Visa travail"
          : "Projet de mobilité";
  let adminDraft: { destination?: string; modelLabel?: string; criteria?: { education?: number; experience?: number; languages?: number; market?: number; profile?: number }; finalScore?: number; verdict?: string; strengths?: string[]; weaknesses?: string[]; recommendations?: string[]; checklist?: string[]; advisorValidated?: boolean } = {};
  try {
    const parsed = JSON.parse(app.scoringDetails || "{}");
    adminDraft = parsed.adminDraft || {};
  } catch {
    adminDraft = {};
  }
  const customIntro = options.introMessage ?? app.evaluationDeliveryMessage;
  const clientText = (value: string) => sanitizeClientCommunicationText(value);
  const recommendations = Array.isArray(adminDraft.recommendations) && adminDraft.recommendations.length
    ? adminDraft.recommendations
    : generatePersonalizedRecommendations(criteria, app);
  const hasDestinationModel = Boolean(adminDraft.criteria && adminDraft.modelLabel);
  const selectedDestination = adminDraft.modelLabel || app.destination || "Évaluation préliminaire";
  const selectedScore = adminDraft.finalScore ?? app.scoringTotal ?? 0;
  const renderedCriteria = criteriaRowsForKind(projectKind, criteria, adminDraft, hasDestinationModel);
  const strategicOrientation =
    projectKind === "etudes"
      ? "Cette orientation études est préliminaire : elle nécessite la vérification de l’admission, du financement et des pièces académiques."
      : projectKind === "tourisme"
        ? "Cette orientation visite/tourisme est préliminaire : elle nécessite un itinéraire cohérent, des preuves d’attaches et de ressources."
        : hasDestinationModel
          ? "Cette orientation est préliminaire et nécessite la vérification des pièces, des conditions de programme et, le cas échéant, d’une offre d’employeur."
          : topScore.description;
  const legalFrame =
    projectKind === "etudes"
      ? "Nos démarches s'effectuent en stricte conformité avec les lois sur l'immigration. Notre rôle se limite à l'ingénierie documentaire, au conseil technique et à la préparation du dossier d’études. L'admission académique et l'octroi du visa restent la compétence souveraine de l’établissement et des autorités étatiques."
      : projectKind === "tourisme"
        ? "Nos démarches s'effectuent en stricte conformité avec les lois sur l'immigration. Notre rôle se limite à l'ingénierie documentaire et à la préparation du dossier de visite. L'octroi du visa ou de l’autorisation de séjour reste la compétence souveraine des autorités étatiques."
        : "Nos démarches s'effectuent en stricte conformité avec les lois sur l'immigration. Notre rôle se limite à l'ingénierie documentaire, au conseil technique, à la préparation rigoureuse de votre dossier administratif et à la mise en relation avec les opportunités du marché. L'octroi final des visas et permis de travail reste la compétence souveraine des autorités étatiques.";

  // Barre de progression visuelle
  const progressBar = (score: number): string => {
    const filled = Math.round(score / 5); // 20 caractères max
    return "█".repeat(filled) + "░".repeat(20 - filled);
  };

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0B1F4B 0%, #1E5AA8 58%, #2D8FC4 100%); color: white; padding: 28px 30px 34px; text-align: center; }
    .brand-logo { display: block; width: 86px; height: 86px; object-fit: contain; margin: 0 auto 14px; border-radius: 50%; background: #ffffff; padding: 6px; }
    .brand-name { margin: 0 0 12px; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #D7F3FF; font-weight: 700; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 40px 30px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: 700; color: #1E3A8A; margin-bottom: 15px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
    .score-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
    .score-row:last-child { border-bottom: none; }
    .destination { font-weight: 600; color: #374151; }
    .score-bar { flex: 1; margin: 0 15px; }
    .bar { background: #E5E7EB; height: 6px; border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #10B981, #059669); border-radius: 3px; }
    .score-value { font-weight: 700; color: #1E3A8A; min-width: 50px; text-align: right; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 10px; }
    .badge-excellent { background: #DCFCE7; color: #166534; }
    .badge-recommande { background: #DBEAFE; color: #0C4A6E; }
    .badge-admissible { background: #FEF3C7; color: #92400E; }
    .badge-modere { background: #FEE2E2; color: #991B1B; }
    .criteria-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .criteria-table td { padding: 10px; border-bottom: 1px solid #E5E7EB; }
    .criteria-table td:first-child { font-weight: 600; color: #374151; width: 50%; }
    .criteria-table td:last-child { text-align: right; color: #1E3A8A; font-weight: 700; }
    .recommendation { background: #EFF6FF; border-left: 4px solid #2563EB; padding: 15px; margin-top: 15px; border-radius: 4px; }
    .recommendation p { margin: 0; color: #1E40AF; font-size: 14px; line-height: 1.6; }
    .cta { background: #1E3A8A; color: white; padding: 15px 30px; border-radius: 6px; text-align: center; margin-top: 20px; font-weight: 600; text-decoration: none; display: inline-block; }
    .footer { background: #F8FAFF; padding: 30px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; }
    .footer p { margin: 8px 0; }
    .footer .brand-signature { color: #1E3A8A; font-weight: 700; letter-spacing: 0.04em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img class="brand-logo" src="https://www.3mtravelagency.com/logo-3m-hd.webp" alt="Logo 3M TRAVEL AGENCY" />
      <p class="brand-name">3M Travel Agency SARL</p>
      <h1>📋 Indice de Faisabilité Préliminaire (IFP 3M)</h1>
      <p>Évaluation indicative d’agence — ${escapeReportHtml(projectKindLabel)} — 3M TRAVEL AGENCY</p>
    </div>
    
    <div class="body">
      <p>Bonjour <strong>${escapeReportHtml(app.fullName)}</strong>,</p>
      <p>Nous vous transmettons les conclusions de notre analyse préliminaire pour votre projet <strong>${escapeReportHtml(projectKindLabel)}</strong>${app.destination ? ` vers <strong>${escapeReportHtml(String(app.destination))}</strong>` : ""}.</p>
      ${customIntro ? `<div class="recommendation"><p>${escapeReportHtml(clientText(customIntro)).replace(/\n/g, "<br/>")}</p></div>` : ""}
      
      <div class="section">
        <div class="section-title">📊 ${hasDestinationModel ? "MODÈLE D’ÉVALUATION SÉLECTIONNÉ" : "SYNTHÈSE DES SCORES PAR DESTINATION"}</div>
        ${hasDestinationModel ? `<div class="recommendation"><p><strong>${escapeReportHtml(selectedDestination)}</strong></p><p>Score interne préliminaire : <strong>${selectedScore}/100</strong>. Ce résultat doit être interprété avec les pièces justificatives et les critères applicables au moment de la demande.</p></div>` : scores
          .map(
            s => `
          <div class="score-row">
            <div class="destination">${DESTINATIONS[s.destination as keyof typeof DESTINATIONS]?.flag || "🌍"} ${DESTINATIONS[s.destination as keyof typeof DESTINATIONS]?.name || escapeReportHtml(s.destination)}</div>
            <div class="score-bar">
              <div class="bar">
                <div class="bar-fill" style="width: ${s.score}%"></div>
              </div>
            </div>
            <div class="score-value">${s.score}/100</div>
            <div class="badge badge-${s.badge}">${s.badge.toUpperCase()}</div>
          </div>
        `
          )
          .join("")}
      </div>
      
      <div class="section">
        <div class="section-title">📈 ANALYSE DE VOS CRITÈRES</div>
        <table class="criteria-table">
          ${renderedCriteria.map(([label, value, maximum]) => `<tr><td>${label}</td><td>${value} / ${maximum}</td></tr>`).join("")}
          ${hasDestinationModel ? `<tr><td><strong>Total de la grille interne</strong></td><td><strong>${selectedScore} / 100</strong></td></tr>` : ""}
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">🎯 RECOMMANDATION STRATÉGIQUE & PLAN D'ACTION</div>
        <div class="recommendation">
          <p><strong>Orientation à examiner (${escapeReportHtml(projectKindLabel)}) :</strong> ${hasDestinationModel ? escapeReportHtml(selectedDestination) : DESTINATIONS[topScore.destination as keyof typeof DESTINATIONS]?.name || escapeReportHtml(topScore.destination)}</p>
          <p>${strategicOrientation}</p>
          <p style="margin-top: 10px;">La décision finale relève toujours de l’autorité compétente et du programme visé. Ce bilan ne constitue pas une garantie de visa, d’emploi, d’admission ou de séjour.</p>
        </div>
        
        <div style="margin-top: 20px;">
          <h4 style="color: #1E3A8A; font-size: 14px; margin-bottom: 10px; font-weight: 700;">💡 Recommandations personnalisées pour optimiser votre score :</h4>
          <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 13px; line-height: 1.6;">
            ${recommendations.map(rec => `<li style="margin-bottom: 8px;">${escapeReportHtml(clientText(rec))}</li>`).join("")}
          </ul>
        </div>
      </div>
      ${adminDraft.verdict || adminDraft.strengths?.length || adminDraft.weaknesses?.length || adminDraft.finalScore !== undefined ? `<div class="section"><div class="section-title">🧭 AVIS PERSONNALISÉ DU CONSEILLER</div>${adminDraft.finalScore !== undefined ? `<p><strong>Indice révisé par l’administration :</strong> ${adminDraft.finalScore}/100</p>` : ""}${adminDraft.verdict ? `<p><strong>Verdict :</strong> ${escapeReportHtml(clientText(adminDraft.verdict))}</p>` : ""}${adminDraft.strengths?.length ? `<p><strong>Points forts :</strong></p><ul>${adminDraft.strengths.map((item) => `<li>${escapeReportHtml(clientText(item))}</li>`).join("")}</ul>` : ""}${adminDraft.weaknesses?.length ? `<p><strong>Axes d’amélioration :</strong></p><ul>${adminDraft.weaknesses.map((item) => `<li>${escapeReportHtml(clientText(item))}</li>`).join("")}</ul>` : ""}${adminDraft.checklist?.length ? `<p><strong>Pièces à vérifier :</strong></p><ul>${adminDraft.checklist.map((item) => `<li>${escapeReportHtml(clientText(item))}</li>`).join("")}</ul>` : ""}</div>` : ""}
      
      <div class="section">
        <div class="section-title">⚙️ CADRE JURIDIQUE</div>
        <p>${legalFrame}</p>
      </div>
      
      <div class="section">
        <div class="section-title">💰 FRAIS D'OUVERTURE DE DOSSIER</div>
        <p>Pour acter votre choix d'orientation, initier les démarches de prospection et déclencher le montage technique de votre livret d'immigration par nos experts, le règlement des frais d'ouverture obligatoires, dont le montant dépend de votre profil et vous est confirmé par écrit avant tout paiement, est requis.</p>
      </div>
      
      <a href="https://www.3mtravelagency.com/verify-application-email?dossier=${app.dossierNumber}" class="cta">Continuer vers le paiement →</a>
    </div>
    
    <div class="footer">
      <p class="brand-signature"><strong>3M Travel Agency SARL</strong></p>
      <p>Yaoundé, Cameroun | +237 698 104 832 | hello@3mtravelagency.com</p>
      <p>RC/YAO/2019/A/2567 | NIU: M112417203369H</p>
      <p style="margin-top: 15px; font-style: italic;">"Votre mobilité, notre expertise. Votre réussite, notre mission."</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Génère le rapport d'évaluation en texte brut (pour email)
 */
export function generateEvaluationReportText(app: Application): string {
  const scores = generateAllDestinationScores(app);
  const topScore = scores[0];
  const criteria = extractScoringCriteria(app);

  return `Rapport d'Évaluation Professionnelle — 3M TRAVEL AGENCY

Bonjour ${app.fullName},

Nous avons le plaisir de vous transmettre les conclusions de notre comité d'admission concernant l'analyse approfondie de votre dossier de candidature pour notre programme de mobilité internationale.

---

📊 SYNTHÈSE DES SCORES PAR DESTINATION

${scores
  .map(
    s =>
      ` ${DESTINATIONS[s.destination as keyof typeof DESTINATIONS]?.flag || "🌍"} ${(DESTINATIONS[s.destination as keyof typeof DESTINATIONS]?.name || s.destination).padEnd(15)} | ${s.score.toString().padStart(3)}/100 | ${s.badge.toUpperCase()}`
  )
  .join("\n")}

---

📈 ANALYSE DE VOS CRITÈRES

- Formation académique (/25) : ${criteria.education} / 25
- Expérience professionnelle (/25) : ${criteria.experience} / 25
- Compétences linguistiques (/20) : ${criteria.language} / 20
- Secteur en demande (/20) : ${criteria.sector} / 20
- Ajustement marché & métier (/10) : ${criteria.ageAdjustment} / 10

SCORE TOTAL : ${criteria.education + criteria.experience + criteria.language + criteria.sector + criteria.ageAdjustment} / 100

---

🎯 RECOMMANDATION STRATÉGIQUE

Destination recommandée : ${DESTINATIONS[topScore.destination as keyof typeof DESTINATIONS]?.name || topScore.destination}
Score : ${topScore.score}/100 (${topScore.badge.toUpperCase()})

${topScore.description}

Notre analyse stratégique identifie cette destination comme offrant les meilleures perspectives pour votre profil, avec des procédures simplifiées et des opportunités réelles d'établissement ou de résidence permanente.

---

⚙️ CADRE JURIDIQUE

Nos démarches s'effectuent en stricte conformité avec les lois sur l'immigration. Notre rôle se limite à l'ingénierie documentaire, au conseil technique, à la préparation rigoureuse de votre dossier administratif et à la mise en relation avec les opportunités du marché. L'octroi final des visas et permis de travail reste la compétence souveraine des autorités étatiques.

---

💰 FRAIS D'OUVERTURE DE DOSSIER

Pour acter votre choix d'orientation, initier les démarches de prospection et déclencher le montage technique de votre livret d'immigration par nos experts, le règlement des frais d'ouverture obligatoires, dont le montant dépend de votre profil et vous est confirmé par écrit avant tout paiement, est requis.

Lien de paiement : https://www.3mtravelagency.com/verify-application-email?dossier=${app.dossierNumber}

---

Cordialement,

Aureol DONFACK - PDG
3M Travel Agency SARL
Yaoundé, Cameroun
+237 698 104 832 | hello@3mtravelagency.com
RC/YAO/2019/A/2567 | NIU: M112417203369H

"Votre mobilité, notre expertise. Votre réussite, notre mission."
  `;
}
