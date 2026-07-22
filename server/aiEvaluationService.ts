/**
 * Service d'évaluation IA — Analyse de CV avec OpenAI
 * Extraction de texte PDF, analyse IA, génération de rapport personnalisé
 */

// Import dynamique pour éviter les dépendances manquantes

// Types pour l'évaluation IA
export interface AIEvaluationResult {
  success: boolean;
  report?: string;
  scores?: {
    destination: string;
    score: number;
    recommendation: string;
  }[];
  error?: string;
}

/**
 * Extrait le texte d'un fichier PDF
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Import dynamique de pdf-parse
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule as any).default || (pdfParseModule as any);
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (err) {
    console.error("[PDF Extract] Error:", err);
    throw new Error("Impossible d'extraire le texte du PDF");
  }
}

/**
 * Génère un rapport d'évaluation IA basé sur le CV
 * Utilise OpenAI pour analyser le profil et générer des recommandations
 */
export async function generateAIEvaluationReport(
  cvText: string,
  candidateName: string,
  destination: string,
  openaiApiKey?: string
): Promise<string> {
  // Si pas de clé OpenAI, retourner un rapport par défaut
  if (!openaiApiKey) {
    return generateDefaultEvaluationReport(candidateName, destination, cvText);
  }

  try {
    // Importer OpenAI dynamiquement pour éviter les dépendances manquantes
    const { OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const systemPrompt = `Tu es l'ingénieur en évaluation migratoire de 3M Travel & Services SARL (PDG: Aureol DONFACK).
Ta mission est d'analyser le texte du CV fourni et de rédiger le rapport officiel d'évaluation au format TEXTE BRUT (plain text) strict, en séparant chaque section par un tiret (-).

Consignes de notation et de structure :
- Analyse le profil, le nom du candidat et ses compétences.
- Évalue la destination initiale (${destination}) : attribue un score entre 50 et 60/100 en expliquant les blocages légaux/ministériels de 2026 (contingentement, bilinguisme, ADEM, salaire social minimum).
- PRIORITÉ ABSOLUE : Recommande le Canada (Résidence Permanente) en PREMIER avec un score de 95/100, en expliquant Express Entry, PNP, l'avantage bilingue +16 pts CRS, les 500 000 RP/an et les secteurs en tension (santé, BTP, IT, transport). C'est la destination phare de 3M Travel & Services.
- Recommande ensuite la Pologne (88/100) comme alternative rapide.
- Inclus la synthèse des scores visuelle avec barres (████), dans cet ordre : Canada (1er), Pologne (2e), Allemagne (3e), Luxembourg (4e). Le tableau des critères (Formation/25, Expérience/25, Langues/20, Secteur/20, Ajustement/10).
- Mentionne les points forts, points de vigilance, le cadre juridique, les frais d'ouverture obligatoires de 65 000 FCFA non remboursables, la liste des pièces justificatives, le suivi WhatsApp (698 104 832) et les étapes immédiates.
- N'utilise aucun formatage Markdown (pas de **, pas de #, pas de code blocks). Uniquement du texte brut lisible directement dans un e-mail.

Signature obligatoire :
Cordialement,

Aureol DONFACK - PDG
3M Travel & Services SARL
Yaoundé, Cameroun
+237 698 104 832 | hello@3mtravelagency.com
RC/YAO/2019/A/2567 | NIU: M112417203369H

"Votre mobilité, notre expertise. Votre réussite, notre mission."`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Voici le contenu du CV du candidat ${candidateName} à évaluer :\n\n${cvText}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const report = completion.choices[0].message.content;
    if (!report) {
      throw new Error("Pas de réponse de l'IA");
    }

    return report;
  } catch (err) {
    console.error("[AI Evaluation] OpenAI error:", err);
    // Retourner un rapport par défaut en cas d'erreur
    return generateDefaultEvaluationReport(candidateName, destination, cvText);
  }
}

/**
 * Génère un rapport d'évaluation par défaut (sans OpenAI)
 * Basé sur l'analyse simple du CV
 */
function generateDefaultEvaluationReport(
  candidateName: string,
  destination: string,
  cvText: string
): string {
  // Analyser le CV pour extraire des informations
  const hasExperience = /expérience|experience|travail|emploi|poste|position/i.test(cvText);
  const hasLanguages = /langue|language|english|français|french|allemand|german|espagnol|spanish/i.test(cvText);
  const hasEducation = /diplôme|diploma|licence|master|bac|baccalauréat|université|university/i.test(cvText);

  const experienceScore = hasExperience ? 18 : 12;
  const languageScore = hasLanguages ? 16 : 10;
  const educationScore = hasEducation ? 20 : 15;
  const sectorScore = 14;
  const ageScore = 7;
  const totalScore = experienceScore + languageScore + educationScore + sectorScore + ageScore;

  const destinationScore = Math.max(50, Math.min(75, totalScore - 10));

  return `Rapport d'Évaluation Professionnelle — 3M Travel & Services

Bonjour ${candidateName},

Nous avons le plaisir de vous transmettre les conclusions de notre comité d'admission concernant l'analyse approfondie de votre dossier de candidature pour notre programme de mobilité internationale.

---

SYNTHÈSE DES SCORES PAR DESTINATION

🇨🇦 CANADA      |  ████████████████████████████████  |  95 / 100  |  (DOSSIER EXCELLENT) ⭐ RECOMMANDÉ
🇵🇱 POLOGNE     |  ██████████████████████████████  |  88 / 100  |  (DOSSIER RECOMMANDÉ)
🇩🇪 ALLEMAGNE   |  ████████████████████████          |  75 / 100  |  (DOSSIER ADMISSIBLE)
🇱🇺 LUXEMBOURG  |  ████████████████                  |  ${destinationScore} / 100  |  (ÉLIGIBILITÉ MODÉRÉE)

---

TABLEAU ANALYTIQUE DES CRITÈRES DE SÉLECTION

- Formation (/25) : ${educationScore} / 25
- Expérience Professionnelle (/25) : ${experienceScore} / 25
- Compétences Linguistiques (/20) : ${languageScore} / 20
- Secteur en Demande (/20) : ${sectorScore} / 20
- Ajustement Marché & Métier (/10) : ${ageScore} / 10

SCORE TOTAL : ${totalScore} / 100

---

RECOMMANDATION STRATÉGIQUE

Destination recommandée : Canada — Résidence Permanente
Score : 95/100 (DOSSIER EXCELLENT)

Notre analyse stratégique identifie le Canada comme la destination prioritaire pour votre profil. Le programme Express Entry et le Programme des Candidats des Provinces (PNP) offrent une voie directe vers la Résidence Permanente, avec un avantage décisif pour les bilingues français/anglais (+16 pts CRS). Avec 500 000 RP accordées par an et des secteurs en tension (santé, BTP, IT, transport), le Canada représente l'opportunité la plus sécurisée et la plus durable pour votre projet de vie.

---

CADRE JURIDIQUE ET ENGAGEMENT

Nos démarches s'effectuent en stricte conformité avec les lois sur l'immigration. Notre rôle se limite à l'ingénierie documentaire, au conseil technique, à la préparation rigoureuse de votre dossier administratif et à la mise en relation avec les opportunités du marché. L'octroi final des visas et permis de travail reste la compétence souveraine des autorités étatiques.

---

FRAIS D'OUVERTURE DE DOSSIER

Pour acter votre choix d'orientation, initier les démarches de prospection et déclencher le montage technique de votre livret d'immigration par nos experts, le règlement des frais d'ouverture obligatoires de 65 000 FCFA est requis. Ces frais techniques courent l'audit initial, le traitement documentaire et sont non remboursables en toutes circonstances.

---

PIÈCES JUSTIFICATIVES À FOURNIR

1. Copie couleur très lisible du Passeport (validité supérieure à 18 mois) et de la CNI.
2. Diplômes certifiés conformes et relevés de notes universitaires/académiques.
3. Certificats et attestations de travail signés par vos différents employeurs.
4. Extrait de casier judiciaire (de moins de 3 mois) et Acte de naissance.
5. CV actualisé au format international et photos d'identité numériques aux normes.

---

DISPOSITIF DE SUIVI INTERNATIONAL

Grâce à notre infrastructure numérique interconnectée, vous pouvez valider et suivre l'avancement de l'ensemble de vos démarches directement depuis notre plateforme ou à distance via notre canal d'assistance WhatsApp (698 104 832).

---

PROCHAINES ÉTAPES IMMÉDIATES

1. Confirmation de votre stratégie de traitement (Maintien strict sur la destination initiale ou bascule sur les destinations recommandées).
2. Règlement des frais d'ouverture de dossier (65 000 FCFA) directement en ligne sur notre plateforme.
3. Téléversement de vos pièces justificatives numériques pour l'audit de conformité immédiat.

---

Ne laissez pas les barrières administratives ralentir votre potentiel. Fixez votre stratégie là où vos compétences sont attendues au prix fort. Nos équipes sont prêtes à déployer toute notre expertise pour votre succès.

---

Cordialement,

Aureol DONFACK - PDG
3M Travel & Services SARL
Yaoundé, Cameroun
+237 698 104 832 | hello@3mtravelagency.com
RC/YAO/2019/A/2567 | NIU: M112417203369H

"Votre mobilité, notre expertise. Votre réussite, notre mission."`;
}
