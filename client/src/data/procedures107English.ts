// English-language content for the first bilingual launch slice.
// Each entry pairs an English URL slug with adapted (human-written, not
// machine-translated) content for one existing French procedure entry in
// procedures107Complete.ts / evisasDatabaseComplete.ts. Only the display
// text is translated here — structural fields (id, visaType, difficulty,
// pdfUrl, flag, etc.) continue to come from the French source record.

export type ProcedureEnglishContent = {
  frId: string;
  enSlug: string;
  name: string;
  regionLabel: string;
  difficultyLabel: string;
  description: string;
  detailedDescription: string;
  highlights: string[];
  steps: string[];
  requiredDocuments: { category: string; documents: string[] }[];
};

export const PROCEDURES_ENGLISH_CONTENT: ProcedureEnglishContent[] = [
  {
    frId: "canada-travail",
    enSlug: "canada-work",
    name: "Canada",
    regionLabel: "North America",
    difficultyLabel: "Medium",
    description: "Work visa for Canada — opportunities across the North American job market",
    detailedDescription:
      "Canada offers a stable economy, universal healthcare, and a high standard of living, with competitive salaries (CAD 3,000–5,000/month). The process is transparent, with a possible pathway toward permanent residence.",
    highlights: ["Stable economy", "Universal healthcare", "High quality of life", "Tech & services sector", "Permanent residence pathway"],
    steps: ["Job offer", "LMIA if applicable", "Work permit application", "Medical exam", "Approval"],
    requiredDocuments: [
      { category: "Identity", documents: ["Valid passport", "Copy", "Birth certificate"] },
      { category: "Professional", documents: ["Job offer", "Contract", "CV", "Diplomas", "Reference letters"] },
      { category: "Financial", documents: ["Proof of funds", "Bank statements", "Solvency"] },
      { category: "Security", documents: ["Medical certificate", "Police certificate", "Background check"] },
    ],
  },
  {
    frId: "france-etudes",
    enSlug: "france-study",
    name: "France",
    regionLabel: "Europe",
    difficultyLabel: "Easy",
    description: "Study visa for France — world-renowned universities",
    detailedDescription:
      "France offers internationally renowned universities with very moderate tuition fees (EUR 200–600/year) and a good quality of life. Cost of living is reasonable (EUR 900–1,300/month).",
    highlights: ["Renowned universities", "Very moderate tuition", "Quality of life", "Culture", "Gastronomy"],
    steps: ["Admission", "Documents", "Application", "Interview", "Visa issuance"],
    requiredDocuments: [
      { category: "Identity", documents: ["Valid passport", "Copy"] },
      { category: "Academic", documents: ["Admission letter", "Diplomas", "Transcripts"] },
      { category: "Financial", documents: ["Proof of funds", "Bank statements"] },
    ],
  },
  {
    frId: "allemagne-travail",
    enSlug: "germany-work",
    name: "Germany",
    regionLabel: "Europe",
    difficultyLabel: "Medium",
    description: "Work visa for Germany — access to the European job market",
    detailedDescription:
      "Germany offers strong opportunities for qualified professionals. It's a dynamic market with high demand in technology, engineering, and healthcare. Salaries are competitive (EUR 2,500–4,500/month), with an excellent social protection system.",
    highlights: ["Dynamic market", "Competitive salaries", "Healthcare system", "Tech & engineering", "EU access"],
    steps: ["Job offer", "Agentur für Arbeit authorization", "Embassy file", "Interview", "Visa issuance"],
    requiredDocuments: [
      { category: "Identity", documents: ["Valid passport", "Certified copy", "Birth certificate"] },
      { category: "Professional", documents: ["Job offer", "Contract", "CV", "Diplomas", "Reference letters"] },
      { category: "Financial", documents: ["3-month bank statements", "Employer letter", "2 years of tax records"] },
      { category: "Health", documents: ["Medical certificate", "X-ray", "Vaccination record", "Insurance", "Police certificate"] },
    ],
  },
  {
    frId: "dubai-evisa",
    enSlug: "dubai-evisa",
    name: "Dubai (UAE)",
    regionLabel: "Asia",
    difficultyLabel: "Medium",
    description: "Tourist e-Visa for Dubai — fast-track processing",
    detailedDescription:
      "A symbol of striking modernity, Dubai combines futuristic skyscrapers, international luxury, and warm Arab traditions. Indicative processing time: 24–48h, via our licensed UAE partner agency.",
    highlights: ["Burj Khalifa", "The Palm Jumeirah", "Dubai Marina & JBR", "Desert safari"],
    steps: ["Document submission", "Application review", "Fast-track processing", "e-Visa issuance"],
    requiredDocuments: [
      { category: "Identity", documents: ["High-resolution passport scan (valid 6+ months)", "Color passport-style photo, white background"] },
    ],
  },
];

export const getEnglishContentByFrId = (frId: string) =>
  PROCEDURES_ENGLISH_CONTENT.find((entry) => entry.frId === frId);

export const getEnglishContentByEnSlug = (enSlug: string) =>
  PROCEDURES_ENGLISH_CONTENT.find((entry) => entry.enSlug === enSlug);
