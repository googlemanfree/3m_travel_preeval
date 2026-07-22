/**
 * Service d'évaluation automatique des candidats
 * Génère des rapports personnalisés avec scoring multi-destination
 */

import { Application } from "../drizzle/schema";

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
  let criteria: ScoringCriteria = {
    education: 15,
    experience: 15,
    language: 12,
    sector: 12,
    ageAdjustment: 6,
  };

  // Parser les détails du scoring s'ils existent
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
    } catch (e) {
      // Garder les valeurs par défaut
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

/**
 * Génère le rapport d'évaluation complet en HTML
 */
export function generateEvaluationReportHTML(app: Application): string {
  const scores = generateAllDestinationScores(app);
  const topScore = scores[0];
  const criteria = extractScoringCriteria(app);

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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; color: #333; }
    .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: white; padding: 50px 40px; text-align: center; position: relative; }
    .logo { width: 80px; height: 80px; margin: 0 auto 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: bold; color: #1E3A8A; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 15px; opacity: 0.95; font-weight: 500; }
    .body { padding: 50px 40px; }
    .intro { margin-bottom: 35px; line-height: 1.8; color: #374151; }
    .intro strong { color: #1E3A8A; }
    .section { margin-bottom: 40px; }
    .section-title { font-size: 18px; font-weight: 700; color: #1E3A8A; margin-bottom: 20px; border-bottom: 3px solid #2563EB; padding-bottom: 12px; display: flex; align-items: center; gap: 10px; }
    .score-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid #E5E7EB; }
    .score-row:last-child { border-bottom: none; }
    .destination { font-weight: 600; color: #1E3A8A; font-size: 15px; min-width: 150px; }
    .score-bar { flex: 1; margin: 0 20px; }
    .bar { background: #E5E7EB; height: 8px; border-radius: 4px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #10B981, #059669); border-radius: 4px; transition: width 0.3s ease; }
    .score-value { font-weight: 800; color: #1E3A8A; min-width: 60px; text-align: right; font-size: 16px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-left: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-excellent { background: #DCFCE7; color: #166534; }
    .badge-recommande { background: #DBEAFE; color: #0C4A6E; }
    .badge-admissible { background: #FEF3C7; color: #92400E; }
    .badge-modere { background: #FEE2E2; color: #991B1B; }
    .criteria-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .criteria-table tr { border-bottom: 1px solid #E5E7EB; }
    .criteria-table tr:last-child { border-bottom: none; }
    .criteria-table td { padding: 14px 0; }
    .criteria-table td:first-child { font-weight: 600; color: #374151; width: 60%; }
    .criteria-table td:last-child { text-align: right; color: #1E3A8A; font-weight: 800; font-size: 16px; }
    .recommendation { background: linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%); border-left: 5px solid #2563EB; padding: 20px; margin-top: 15px; border-radius: 6px; }
    .recommendation p { margin: 10px 0; color: #1E40AF; font-size: 15px; line-height: 1.7; }
    .recommendation p:first-child { margin-top: 0; font-weight: 700; }
    .cta { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: white; padding: 16px 32px; border-radius: 6px; text-align: center; margin-top: 30px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 15px; transition: transform 0.2s; }
    .cta:hover { transform: translateY(-2px); }
    .legal { background: #F9FAFB; padding: 20px; border-radius: 6px; margin-top: 15px; font-size: 14px; color: #6B7280; line-height: 1.7; }
    .footer { background: #F8FAFF; padding: 40px; text-align: center; font-size: 13px; color: #6B7280; border-top: 2px solid #E5E7EB; }
    .footer p { margin: 8px 0; }
    .footer strong { color: #1E3A8A; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">3M</div>
      <h1>Rapport d'Évaluation Professionnelle</h1>
      <p>Analyse approfondie de votre profil — 3M Travel & Services</p>
    </div>
    
    <div class="body">
      <div class="intro">
        <p>Bonjour <strong>${app.fullName}</strong>,</p>
        <p style="margin-top: 12px;">Nous avons le plaisir de vous transmettre les conclusions de notre comité d'admission concernant l'analyse approfondie de votre dossier de candidature pour notre programme de mobilité internationale.</p>
      </div>
      
      <div class="section">
        <div class="section-title">📊 SYNTHÈSE DES SCORES PAR DESTINATION</div>
        ${scores
          .map(
            s => `
          <div class="score-row">
            <div class="destination">${DESTINATIONS[s.destination as keyof typeof DESTINATIONS]?.flag || "🌍"} ${DESTINATIONS[s.destination as keyof typeof DESTINATIONS]?.name || s.destination}</div>
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
          <tr>
            <td>Formation académique</td>
            <td>${criteria.education} / 25</td>
          </tr>
          <tr>
            <td>Expérience professionnelle</td>
            <td>${criteria.experience} / 25</td>
          </tr>
          <tr>
            <td>Compétences linguistiques</td>
            <td>${criteria.language} / 20</td>
          </tr>
          <tr>
            <td>Secteur en demande</td>
            <td>${criteria.sector} / 20</td>
          </tr>
          <tr>
            <td>Ajustement marché & métier</td>
            <td>${criteria.ageAdjustment} / 10</td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">🎯 RECOMMANDATION STRATÉGIQUE</div>
        <div class="recommendation">
          <p><strong>Destination recommandée :</strong> ${DESTINATIONS[topScore.destination as keyof typeof DESTINATIONS]?.name || topScore.destination}</p>
          <p>${topScore.description}</p>
          <p style="margin-top: 10px;">Notre analyse stratégique identifie cette destination comme offrant les meilleures perspectives pour votre profil, avec des procédures simplifiées et des opportunités réelles d'établissement ou de résidence permanente.</p>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">⚙️ CADRE JURIDIQUE</div>
        <div class="legal">
          <p>Nos démarches s'effectuent en stricte conformité avec les lois sur l'immigration. Notre rôle se limite à l'ingénierie documentaire, au conseil technique, à la préparation rigoureuse de votre dossier administratif et à la mise en relation avec les opportunités du marché. L'octroi final des visas et permis de travail reste la compétence souveraine des autorités étatiques.</p>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">💰 FRAIS D'OUVERTURE DE DOSSIER</div>
        <p style="font-size: 15px; line-height: 1.8; color: #374151;">Pour acter votre choix d'orientation, initier les démarches de prospection et déclencher le montage technique de votre livret d'immigration par nos experts, le règlement des frais d'ouverture obligatoires de <strong style="color: #1E3A8A; font-size: 18px;">65 000 FCFA</strong> est requis.</p>
      </div>
      
      <a href="https://3mtravelagency.click/verify-application-email?dossier=${app.dossierNumber}" class="cta">Continuer vers le paiement →</a>
    </div>
    
    <div class="footer">
      <p><strong>3M Travel & Services SARL</strong></p>
      <p>Yaoundé, Cameroun</p>
      <p>Tél : +237 698 104 832 | Email : hello@3mtravelagency.com</p>
      <p style="margin-top: 15px; font-style: italic; font-weight: 600;">&quot;Votre mobilité, notre expertise. Votre réussite, notre mission.&quot;</p>
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

  return `Rapport d'Évaluation Professionnelle — 3M Travel & Services

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

Pour acter votre choix d'orientation, initier les démarches de prospection et déclencher le montage technique de votre livret d'immigration par nos experts, le règlement des frais d'ouverture obligatoires de 65 000 FCFA est requis.

Lien de paiement : https://3mtravelagency.click/verify-application-email?dossier=${app.dossierNumber}

---

Cordialement,

Aureol DONFACK - PDG
3M Travel & Services SARL
Yaoundé, Cameroun
+237 698 104 832 | hello@3mtravelagency.com
RC/YAO/2019/A/2567 | NIU: M112417203369H

"Votre mobilité, notre expertise. Votre réussite, notre mission."
  `;
}
