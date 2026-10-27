import { and, eq } from "drizzle-orm";
import { countryPathways, countrySources, countryVisaPrograms, procedureSteps } from "../drizzle/schema";
import { getDb } from "../server/db";

const checkedAt = new Date();
const checkedByLabel = "Seed sources officielles — 2026-10-27";

type Pathway = "work" | "study" | "visit";
type Actor = "employer" | "candidate" | "authority" | "agency" | "institution";

type ProgramSeed = {
  countryCode: string;
  pathway: Pathway;
  officialName: string;
  nameFr: string;
  programRef: string;
  routeType: "employer" | "qualified" | null;
  offerRequired: "yes" | "no";
  summary: string;
  officialUrl: string;
  steps: Array<{ actor: Actor; title: string; description: string; documents: string[]; officialUrl: string }>;
};

type SourceSeed = { countryCode: string; pathway: Pathway; label: string; url: string; authority: "immigration" | "ministry" | "education"; note: string };

const sourceSeeds: SourceSeed[] = [
  { countryCode: "CA", pathway: "work", label: "IRCC — Work in Canada temporarily", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada.html", authority: "immigration", note: "Page officielle IRCC sur les permis de travail temporaires, dont les permis liés à un employeur et les permis ouverts." },
  { countryCode: "CA", pathway: "study", label: "IRCC — Study permit: how to apply", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/apply.html", authority: "immigration", note: "Page officielle IRCC sur la demande de permis d’études, les documents, la demande en ligne et les biométries." },
  { countryCode: "CA", pathway: "visit", label: "IRCC — Visit Canada", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html", authority: "immigration", note: "Page officielle IRCC sur le visa de visiteur, l’AVE et la vérification du besoin de visa." },
  { countryCode: "FR", pathway: "work", label: "France-Visas — Activité salariée", url: "https://france-visas.gouv.fr/activite-salariee", authority: "ministry", note: "Portail officiel France-Visas : autorisation de travail, visa adapté à la durée et justificatifs selon la situation." },
  { countryCode: "FR", pathway: "study", label: "France-Visas — Étudiant", url: "https://france-visas.gouv.fr/etudiant", authority: "education", note: "Portail officiel France-Visas : admission, dispositif Études en France/Campus France selon le pays et visa étudiant." },
  { countryCode: "FR", pathway: "visit", label: "Service-Public — Visa de court séjour Schengen", url: "https://www.service-public.fr/particuliers/vosdroits/F16146", authority: "ministry", note: "Source officielle de l’administration française : court séjour, motifs, 90 jours sur 180 et dépôt en ligne." },
];

const programs: ProgramSeed[] = [
  {
    countryCode: "CA", pathway: "work", officialName: "Employer-specific work permit", nameFr: "Permis de travail lié à un employeur", programRef: "ca-work-employer-specific", routeType: "employer", offerRequired: "yes",
    summary: "Le permis lié à un employeur exige une offre d’emploi ; le type de permis et les instructions doivent être confirmés dans l’outil officiel IRCC.", officialUrl: sourceSeeds[0].url,
    steps: [
      { actor: "candidate", title: "Identifier le type de permis", description: "Répondre aux questions officielles pour confirmer le type de permis et les instructions applicables à la situation.", documents: ["Passeport ou document de voyage", "Informations sur l’emploi proposé"], officialUrl: sourceSeeds[0].url },
      { actor: "employer", title: "Préparer les éléments de l’offre", description: "L’employeur prépare les éléments requis pour une demande de permis lié à un employeur, selon les instructions IRCC.", documents: ["Offre d’emploi et éléments employeur selon le portail officiel"], officialUrl: sourceSeeds[0].url },
      { actor: "candidate", title: "Déposer la demande selon les instructions IRCC", description: "Compléter la demande officielle et joindre uniquement la liste de pièces générée par IRCC pour le profil.", documents: ["Formulaires et pièces de la liste personnalisée IRCC"], officialUrl: sourceSeeds[0].url },
    ],
  },
  {
    countryCode: "CA", pathway: "study", officialName: "Study permit", nameFr: "Permis d’études", programRef: "ca-study-permit", routeType: "qualified", offerRequired: "yes",
    summary: "Le permis d’études se prépare avec une lettre d’acceptation d’un établissement d’enseignement désigné et, selon le cas, une attestation provinciale ou territoriale.", officialUrl: sourceSeeds[1].url,
    steps: [
      { actor: "institution", title: "Obtenir la lettre d’acceptation", description: "Obtenir la lettre d’acceptation de l’établissement d’enseignement désigné au Canada.", documents: ["Lettre d’acceptation de l’établissement désigné"], officialUrl: sourceSeeds[1].url },
      { actor: "candidate", title: "Préparer l’attestation requise", description: "Ajouter l’attestation provinciale ou territoriale (PAL/TAL), sauf exception documentée dans la demande.", documents: ["PAL/TAL ou preuve d’exception, selon le cas"], officialUrl: sourceSeeds[1].url },
      { actor: "candidate", title: "Préparer la demande complète", description: "Réunir les documents demandés par l’outil officiel ; une demande incomplète peut retarder la finalisation.", documents: ["Documents de la liste personnalisée IRCC", "Passeport ou document de voyage"], officialUrl: sourceSeeds[1].url },
      { actor: "candidate", title: "Déposer et suivre la demande en ligne", description: "Créer ou utiliser le compte officiel, payer les frais demandés, fournir les biométries si elles sont requises et suivre l’état du dossier.", documents: ["Compte IRCC", "Moyen de paiement", "Biométries si requises"], officialUrl: sourceSeeds[1].url },
    ],
  },
  {
    countryCode: "CA", pathway: "visit", officialName: "Visitor visa or electronic travel authorization (eTA)", nameFr: "Visa de visiteur ou autorisation de voyage électronique (AVE)", programRef: "ca-visit-visitor-visa-eta", routeType: null, offerRequired: "no",
    summary: "Pour visiter le Canada, vérifier d’abord avec l’outil officiel si une AVE ou un visa est nécessaire.", officialUrl: sourceSeeds[2].url,
    steps: [
      { actor: "candidate", title: "Vérifier le document de voyage requis", description: "Répondre aux questions officielles afin de déterminer si une AVE ou un visa de visiteur est nécessaire.", documents: ["Passeport ou document de voyage", "Informations sur le voyage"], officialUrl: sourceSeeds[2].url },
      { actor: "candidate", title: "Préparer la demande officielle", description: "Suivre les instructions IRCC correspondant au document requis et préparer les justificatifs demandés.", documents: ["Pièces de la liste personnalisée IRCC"], officialUrl: sourceSeeds[2].url },
      { actor: "candidate", title: "Déposer et suivre la demande", description: "Déposer la demande selon le portail officiel, puis suivre les instructions après le dépôt.", documents: ["Confirmation de dépôt", "Biométries si requises"], officialUrl: sourceSeeds[2].url },
    ],
  },
  {
    countryCode: "FR", pathway: "work", officialName: "Long-stay visa — salarié / travailleur temporaire", nameFr: "Visa de long séjour — salarié / travailleur temporaire", programRef: "fr-work-salarie-temporaire", routeType: "employer", offerRequired: "yes",
    summary: "Le recrutement salarié implique une autorisation de travail préalable de l’employeur, puis un visa adapté à la durée et au contrat.", officialUrl: sourceSeeds[3].url,
    steps: [
      { actor: "employer", title: "Obtenir l’autorisation de travail", description: "L’employeur ou l’entreprise française demande l’autorisation de travail lorsque celle-ci est requise.", documents: ["Autorisation de travail accordée", "Contrat ou éléments du recrutement"], officialUrl: sourceSeeds[3].url },
      { actor: "candidate", title: "Utiliser l’assistant France-Visas", description: "Renseigner la situation et le contrat dans l’assistant officiel pour déterminer le visa et les justificatifs adaptés.", documents: ["Passeport", "Justificatifs personnels et professionnels demandés par l’assistant"], officialUrl: sourceSeeds[3].url },
      { actor: "candidate", title: "Déposer la demande de visa", description: "Remplir la demande en ligne, prendre rendez-vous si nécessaire et déposer le dossier auprès du canal indiqué.", documents: ["Formulaire France-Visas", "Autorisation de travail", "Pièces de l’assistant"], officialUrl: sourceSeeds[3].url },
      { actor: "candidate", title: "Valider le séjour lorsque requis", description: "Pour un visa de long séjour valant titre de séjour, effectuer la validation dans le délai indiqué par France-Visas.", documents: ["Visa délivré", "Pièces demandées pour la validation"], officialUrl: sourceSeeds[3].url },
    ],
  },
  {
    countryCode: "FR", pathway: "study", officialName: "Long-stay visa — student", nameFr: "Visa de long séjour — étudiant", programRef: "fr-study-etudiant", routeType: "qualified", offerRequired: "yes",
    summary: "Le parcours étudiant repose sur une admission dans un établissement et, pour les pays concernés, la procédure Études en France/Campus France.", officialUrl: sourceSeeds[4].url,
    steps: [
      { actor: "institution", title: "Choisir une formation et obtenir l’admission", description: "Choisir la formation ou le cursus et obtenir l’acceptation de l’établissement d’enseignement supérieur.", documents: ["Attestation ou lettre d’inscription/admission"], officialUrl: sourceSeeds[4].url },
      { actor: "candidate", title: "Vérifier la procédure Études en France", description: "Vérifier si le pays de résidence est couvert par la procédure Études en France et suivre les modalités Campus France lorsque c’est le cas.", documents: ["Dossier d’inscription ou pièces Campus France selon le pays"], officialUrl: sourceSeeds[4].url },
      { actor: "candidate", title: "Renseigner l’assistant visa", description: "Utiliser l’assistant France-Visas pour obtenir la liste des justificatifs correspondant à la situation.", documents: ["Passeport", "Justificatifs listés par l’assistant visa"], officialUrl: sourceSeeds[4].url },
      { actor: "candidate", title: "Déposer la demande et préparer l’arrivée", description: "Remplir la demande en ligne, déposer les justificatifs et suivre les formalités d’arrivée indiquées pour le visa délivré.", documents: ["Demande France-Visas", "Justificatif d’hébergement ou adresse selon la situation"], officialUrl: sourceSeeds[4].url },
    ],
  },
  {
    countryCode: "FR", pathway: "visit", officialName: "Schengen short-stay visa (type C)", nameFr: "Visa Schengen de court séjour (type C)", programRef: "fr-visit-schengen-court-sejour", routeType: null, offerRequired: "no",
    summary: "Le visa de court séjour permet au maximum 90 jours sur une période de 180 jours, sous réserve des règles applicables et de la décision consulaire.", officialUrl: sourceSeeds[5].url,
    steps: [
      { actor: "candidate", title: "Vérifier le besoin de visa", description: "Vérifier selon la nationalité, le passeport et le motif si un visa est nécessaire avec l’assistant France-Visas.", documents: ["Passeport", "Informations sur le motif et les dates du séjour"], officialUrl: sourceSeeds[5].url },
      { actor: "candidate", title: "Préparer les justificatifs", description: "Rassembler les justificatifs de séjour, d’hébergement, de ressources, d’assurance et les pièces demandées par l’assistant officiel.", documents: ["Justificatifs de séjour et d’hébergement", "Justificatifs de ressources", "Assurance médicale", "Pièces de l’assistant France-Visas"], officialUrl: sourceSeeds[5].url },
      { actor: "candidate", title: "Remplir la demande et prendre rendez-vous", description: "Remplir la demande en ligne puis prendre rendez-vous auprès du consulat ou du prestataire indiqué dans le pays de résidence.", documents: ["Formulaire en ligne", "Confirmation de rendez-vous"], officialUrl: sourceSeeds[5].url },
      { actor: "authority", title: "Respecter la durée autorisée", description: "Un court séjour Schengen ne permet pas de s’installer en France et est limité à 90 jours sur 180 selon les conditions applicables.", documents: ["Visa délivré ou preuve d’exemption", "Justificatifs de voyage"], officialUrl: sourceSeeds[5].url },
    ],
  },
];

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL absent ou base indisponible.");
  let pathways = 0;
  let programsAdded = 0;
  let sourcesAdded = 0;
  let stepsAdded = 0;

  for (const code of ["CA", "FR"]) {
    for (const pathway of ["work", "study", "visit"] as const) {
      const program = programs.find((item) => item.countryCode === code && item.pathway === pathway)!;
      await db.insert(countryPathways).values({
        countryCode: code,
        pathway,
        coverage: "named",
        summary: program.summary,
        status: "published",
        schemaVersion: 1,
        checkedAt,
        checkedByLabel,
      }).onDuplicateKeyUpdate({ set: { coverage: "named", summary: program.summary, status: "published", checkedAt, checkedByLabel } });
      pathways += 1;

      const existingProgram = (await db.select().from(countryVisaPrograms).where(and(eq(countryVisaPrograms.countryCode, code), eq(countryVisaPrograms.pathway, pathway), eq(countryVisaPrograms.officialName, program.officialName))).limit(1))[0];
      let programId = existingProgram?.id;
      if (!programId) {
        const result = await db.insert(countryVisaPrograms).values({ countryCode: code, pathway, programRef: program.programRef, officialName: program.officialName, nameFr: program.nameFr, routeType: program.routeType, offerRequired: program.offerRequired, status: "published", processingNote: "Consulter la source officielle avant toute démarche.", checkedAt });
        programId = Number((result as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
        programsAdded += 1;
      } else {
        await db.update(countryVisaPrograms).set({ programRef: program.programRef, nameFr: program.nameFr, routeType: program.routeType, offerRequired: program.offerRequired, status: "published", processingNote: "Consulter la source officielle avant toute démarche.", checkedAt }).where(eq(countryVisaPrograms.id, programId));
      }
      if (!programId) throw new Error(`Impossible de récupérer le programme ${code}/${pathway}.`);

      for (const [index, step] of program.steps.entries()) {
        const stepNo = index + 1;
        const existingStep = (await db.select().from(procedureSteps).where(and(eq(procedureSteps.programId, programId), eq(procedureSteps.stepNo, stepNo))).limit(1))[0];
        const values = { programId, stepNo, actor: step.actor, title: step.title, description: step.description, documentsJson: step.documents, officialUrl: step.officialUrl, status: "published" as const, checkedAt };
        if (existingStep) await db.update(procedureSteps).set(values).where(eq(procedureSteps.id, existingStep.id));
        else { await db.insert(procedureSteps).values(values); stepsAdded += 1; }
      }
    }
  }

  for (const source of sourceSeeds) {
    const existing = (await db.select().from(countrySources).where(and(eq(countrySources.countryCode, source.countryCode), eq(countrySources.pathway, source.pathway), eq(countrySources.url, source.url))).limit(1))[0];
    const values = { ...source, status: "verified" as const, checkedAt, checkedByLabel };
    if (existing) await db.update(countrySources).set(values).where(eq(countrySources.id, existing.id));
    else { await db.insert(countrySources).values(values); sourcesAdded += 1; }
  }

  console.log(JSON.stringify({ ok: true, pathways, programsAdded, sourcesAdded, stepsAdded, checkedAt: checkedAt.toISOString() }));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
