import { type CrsAbility, type CrsLanguageTest } from "../../shared/crsLanguageTests";
import { EMPTY_CRS_ANSWERS, type CrsOfficialAnswers } from "../../shared/crsOfficialAnswers";

/**
 * Profils de test confrontés à l'outil officiel d'IRCC. Ils couvrent chaque barème, chaque seuil de conversion linguistique (une valeur juste
 * en dessous et une valeur au seuil), les règles de plafond et les cas particuliers du conjoint. Aucun n'est un profil de client.
 */
export type TestProfile = { id: string; group: string; label: string; answers: CrsOfficialAnswers };

/** Même rang de tranche (0 = CLB 10 ou plus … 6 = CLB 4, 7 = moins de CLB 4) pour les quatre compétences. */
const uniform = (rank: number): Record<CrsAbility, string> => ({ speaking: String(rank), listening: String(rank), reading: String(rank), writing: String(rank) });
const ranks = (speaking: number, listening: number, reading: number, writing: number): Record<CrsAbility, string> => ({ speaking: String(speaking), listening: String(listening), reading: String(reading), writing: String(writing) });

const base = (patch: Partial<CrsOfficialAnswers>): CrsOfficialAnswers => ({
  ...EMPTY_CRS_ANSWERS, maritalStatus: "single", age: "29", education: "bachelor_or_three_year", canadianCredential: "no", languageTestRecent: "yes", secondTest: "none",
  firstTest: "celpip", firstBands: uniform(1), canadianWorkYears: "0", highWageExperience: "no", foreignWorkYears: "0", certificate: "no", jobOffer: "no", nomination: "no", sibling: "no", ...patch,
});
const married = (patch: Partial<CrsOfficialAnswers>) => base({ maritalStatus: "married", spouseCitizenOrPr: "no", spouseAccompanies: "yes", spouseEducation: "secondary", spouseCanadianWorkYears: "0", spouseTest: "not_applicable", ...patch });

export function buildProfiles(): TestProfile[] {
  const list: TestProfile[] = [];
  const add = (group: string, label: string, answers: CrsOfficialAnswers) => list.push({ id: `${group}-${list.filter((p) => p.group === group).length + 1}`, group, label, answers });

  for (const age of [17, 18, 19, 20, 29, 30, 31, 35, 40, 41, 44, 45]) add("age", `Âge ${age}, sans conjoint`, base({ age: String(age) }));
  for (const age of [18, 30, 44]) add("age", `Âge ${age}, avec conjoint`, married({ age: String(age) }));

  for (const education of ["less_than_secondary", "secondary", "one_year_postsecondary", "two_year_postsecondary", "bachelor_or_three_year", "two_or_more_credentials", "master_or_professional", "doctoral"]) add("etudes", `Études : ${education}, CLB 9`, base({ education }));
  for (const education of ["bachelor_or_three_year", "doctoral"]) add("etudes", `Études : ${education}, avec conjoint`, married({ education }));

  for (const [rank, name] of [[0, "CLB 10"], [1, "CLB 9"], [2, "CLB 8"], [3, "CLB 7"], [4, "CLB 6"], [5, "CLB 5"], [6, "CLB 4"], [7, "< CLB 4"]] as Array<[number, string]>) add("celpip", `CELPIP ${name} partout`, base({ firstBands: uniform(rank) }));
  for (const test of ["ielts", "pte_core", "tef_canada", "tcf_canada"] as CrsLanguageTest[]) for (const [rank, name] of [[0, "CLB 10"], [1, "CLB 9"], [2, "CLB 8"], [3, "CLB 7"], [4, "CLB 6"], [6, "CLB 4"]] as Array<[number, string]>) add("seuils", `${test} ${name} partout`, base({ firstTest: test, firstBands: uniform(rank) }));
  // Chaque tranche de chaque compétence de chaque test : 8 profils par test, la tranche de la compétence i valant (2·i + k) mod 8.
  for (const test of ["celpip", "ielts", "pte_core", "tef_canada", "tcf_canada"] as CrsLanguageTest[]) for (let k = 0; k < 8; k += 1) add("tranches", `${test} : tranches (${[0, 1, 2, 3].map((i) => (2 * i + k) % 8).join("/")}) oral/écoute/lecture/écrit`, base({ firstTest: test, firstBands: ranks(k % 8, (2 + k) % 8, (4 + k) % 8, (6 + k) % 8) }));

  // français et seconde langue
  add("francais", "TEF NCLC 7 seul (pas d'anglais) → bonus 25", base({ firstTest: "tef_canada", firstBands: uniform(3) }));
  add("francais", "TEF NCLC 7 + IELTS CLB 5 partout → bonus 50", base({ firstTest: "tef_canada", firstBands: uniform(3), secondTest: "ielts", secondBands: uniform(5) }));
  add("francais", "TEF NCLC 7 + IELTS CLB 5/5/5/4 (mixte)", base({ firstTest: "tef_canada", firstBands: uniform(3), secondTest: "ielts", secondBands: ranks(5, 5, 5, 6) }));
  add("francais", "TEF NCLC 7 + IELTS CLB 4 partout → bonus 25", base({ firstTest: "tef_canada", firstBands: uniform(3), secondTest: "ielts", secondBands: uniform(6) }));
  add("francais", "TEF NCLC 7/7/7/6 → aucun bonus", base({ firstTest: "tef_canada", firstBands: { speaking: "3", listening: "3", reading: "3", writing: "4" } }));
  add("francais", "CELPIP 9 + TCF NCLC 7 (seconde langue) → bonus 50", base({ secondTest: "tcf_canada", secondBands: uniform(3) }));
  add("francais", "CELPIP 9 + TCF NCLC 9 (seconde langue : points + bonus)", base({ secondTest: "tcf_canada", secondBands: uniform(1) }));
  add("francais", "CELPIP 9 + TCF NCLC 7/7/7/6 (seconde langue, pas de bonus)", base({ secondTest: "tcf_canada", secondBands: { speaking: "3", listening: "3", reading: "3", writing: "4" } }));
  add("francais", "CELPIP 9 + TEF NCLC 5 (seconde langue, 1 pt/compétence)", base({ secondTest: "tef_canada", secondBands: uniform(5) }));
  add("francais", "TEF NCLC 9 + CELPIP 9 (français d'abord)", base({ firstTest: "tef_canada", firstBands: uniform(1), secondTest: "celpip", secondBands: uniform(1) }));
  add("francais", "TCF NCLC 7 + PTE CLB 7 + 2 ans au Canada", base({ firstTest: "tcf_canada", firstBands: uniform(3), secondTest: "pte_core", secondBands: uniform(3), canadianWorkYears: "2" }));

  for (const years of ["0", "1", "2", "3", "4", "5"]) add("experience-canada", `${years} an(s) d'expérience canadienne, CLB 7`, base({ education: "secondary", firstBands: uniform(3), canadianWorkYears: years }));
  for (const level of ["2", "1.5", "1.3"]) add("salaire-eleve", `3 ans au Canada + salaire élevé ×${level}`, base({ education: "secondary", firstBands: uniform(3), canadianWorkYears: "3", highWageExperience: "yes", highWage2x: level === "2" ? "yes" : "no", highWage15x: level === "1.5" ? "yes" : level === "1.3" ? "no" : "" }));
  for (const level of ["2", "1.5", "1.3"]) add("offre", `Offre d'emploi à salaire élevé ×${level} seule`, base({ education: "secondary", firstBands: uniform(3), jobOffer: "yes", jobOfferLevel: level }));
  add("offre", "1 an + salaire élevé ×1,3 (60) contre offre ×2 (100) → l'offre l'emporte", base({ education: "secondary", firstBands: uniform(3), canadianWorkYears: "1", highWageExperience: "yes", highWage2x: "no", highWage15x: "no", jobOffer: "yes", jobOfferLevel: "2" }));
  add("offre", "5 ans + salaire élevé ×2 (150) contre offre ×2 (100) → l'expérience l'emporte", base({ education: "secondary", firstBands: uniform(3), canadianWorkYears: "5", highWageExperience: "yes", highWage2x: "yes", jobOffer: "yes", jobOfferLevel: "2" }));
  add("offre", "avec conjoint : 5 ans + salaire élevé ×2", married({ education: "secondary", firstBands: uniform(3), canadianWorkYears: "5", highWageExperience: "yes", highWage2x: "yes" }));
  add("offre", "avec conjoint : offre ×2 seule", married({ education: "secondary", firstBands: uniform(3), jobOffer: "yes", jobOfferLevel: "2" }));

  for (const years of ["0", "1", "2", "3"]) for (const [rank, name] of [[3, "CLB 7"], [1, "CLB 9"]] as Array<[number, string]>) add("experience-etrangere", `${years} an(s) à l'étranger, ${name}`, base({ education: "master_or_professional", firstBands: uniform(rank), foreignWorkYears: years }));
  add("experience-etrangere", "3 ans à l'étranger + 1 an au Canada", base({ education: "secondary", firstBands: uniform(4), foreignWorkYears: "3", canadianWorkYears: "1" }));
  add("experience-etrangere", "3 ans à l'étranger + 2 ans au Canada", base({ education: "secondary", firstBands: uniform(4), foreignWorkYears: "3", canadianWorkYears: "2" }));
  add("experience-etrangere", "2 ans à l'étranger + 2 ans au Canada + CLB 9 + maîtrise (plafonds)", base({ education: "master_or_professional", firstBands: uniform(1), foreignWorkYears: "2", canadianWorkYears: "2" }));

  for (const [rank, name] of [[5, "CLB 5"], [4, "CLB 6"], [3, "CLB 7"], [1, "CLB 9"]] as Array<[number, string]>) add("certificat", `Certificat de qualification, ${name}`, base({ education: "secondary", firstBands: uniform(rank), certificate: "yes" }));
  add("certificat", "Certificat + CLB 5/5/5/4 (mixte)", base({ education: "secondary", certificate: "yes", firstBands: { speaking: "5", listening: "5", reading: "5", writing: "6" } }));

  for (const level of ["one_two_year", "three_year_or_more", "secondary_or_less"]) add("supplementaires", `Diplôme canadien : ${level}`, base({ canadianCredential: "yes", canadianCredentialLevel: level }));
  add("supplementaires", "Frère ou sœur au Canada", base({ sibling: "yes" }));
  add("supplementaires", "Désignation provinciale seule", base({ nomination: "yes" }));
  add("supplementaires", "Désignation + français + diplôme canadien + fratrie (plafond 600)", base({ nomination: "yes", sibling: "yes", canadianCredential: "yes", canadianCredentialLevel: "three_year_or_more", firstTest: "tef_canada", firstBands: uniform(1), secondTest: "ielts", secondBands: uniform(1) }));

  add("conjoint", "Conjoint : études secondaires, aucun test, 0 an", married({}));
  for (const [education, name] of [["bachelor_or_three_year", "licence"], ["master_or_professional", "maîtrise"], ["doctoral", "doctorat"]] as Array<[string, string]>) add("conjoint", `Conjoint : ${name}`, married({ spouseEducation: education }));
  for (const [rank, name] of [[1, "CLB 9"], [3, "CLB 7"], [5, "CLB 5"], [6, "CLB 4"]] as Array<[number, string]>) add("conjoint", `Conjoint : CELPIP ${name}`, married({ spouseTest: "celpip", spouseBands: uniform(rank) }));
  add("conjoint", "Conjoint : TEF NCLC 9", married({ spouseTest: "tef_canada", spouseBands: uniform(1) }));
  for (const years of ["1", "3", "5"]) add("conjoint", `Conjoint : ${years} an(s) au Canada`, married({ spouseCanadianWorkYears: years }));
  add("conjoint", "Conjoint citoyen ou résident permanent → barème « sans conjoint »", base({ maritalStatus: "married", spouseCitizenOrPr: "yes", spouseEducation: "doctoral" }));
  add("conjoint", "Conjoint qui ne vous accompagne pas → barème « sans conjoint »", base({ maritalStatus: "married", spouseCitizenOrPr: "no", spouseAccompanies: "no" }));
  add("conjoint", "Conjoint de fait avec conjoint complet (études, langue, expérience)", married({ maritalStatus: "common_law", spouseEducation: "master_or_professional", spouseCanadianWorkYears: "5", spouseTest: "celpip", spouseBands: uniform(0) }));
  for (const status of ["divorced", "widowed", "annulled", "legally_separated"]) add("conjoint", `État matrimonial : ${status}`, base({ maritalStatus: status }));

  // Mode « Comparer deux scénarios » : le profil A, puis le même profil dont seule la note d'expression orale du TCF Canada change (NCLC 9 → NCLC 10, puis → NCLC 7).
  const scenarioBase = { education: "master_or_professional", firstTest: "tcf_canada" } as const;
  add("scenario", "Scénario A : TCF Canada NCLC 9 partout, maîtrise, 29 ans", base({ ...scenarioBase, firstBands: ranks(1, 1, 1, 1) }));
  add("scenario", "Scénario B1 : seule l'expression orale passe à NCLC 10", base({ ...scenarioBase, firstBands: ranks(0, 1, 1, 1) }));
  add("scenario", "Scénario B2 : seule l'expression orale tombe à NCLC 7", base({ ...scenarioBase, firstBands: ranks(3, 1, 1, 1) }));
  // Tous les âges du barème, avec et sans conjoint (ceux déjà ci-dessus sont repris : l'outil officiel est interrogé deux fois, ce qui sert aussi de contrôle de stabilité).
  for (let age = 17; age <= 45; age += 1) { add("tous-ages", `Âge ${age}, sans conjoint`, base({ age: String(age) })); add("tous-ages", `Âge ${age}, avec conjoint`, married({ age: String(age) })); }
  add("extremes", "Profil maximal (doctorat, 25 ans, CELPIP 10 + TEF NCLC 10, 5 ans + salaire ×2, certificat, désignation…)", base({
    age: "25", education: "doctoral", firstBands: uniform(0), secondTest: "tef_canada", secondBands: uniform(0), canadianWorkYears: "5", highWageExperience: "yes", highWage2x: "yes", foreignWorkYears: "3", certificate: "yes",
    canadianCredential: "yes", canadianCredentialLevel: "three_year_or_more", sibling: "yes", nomination: "yes",
  }));
  add("extremes", "Profil maximal avec conjoint", married({
    age: "25", education: "doctoral", firstBands: uniform(0), secondTest: "tef_canada", secondBands: uniform(0), canadianWorkYears: "5", highWageExperience: "yes", highWage2x: "yes", foreignWorkYears: "3", certificate: "yes",
    canadianCredential: "yes", canadianCredentialLevel: "three_year_or_more", sibling: "yes", nomination: "yes", spouseEducation: "doctoral", spouseCanadianWorkYears: "5", spouseTest: "celpip", spouseBands: uniform(0),
  }));
  add("extremes", "Profil le plus faible (< CLB 4, sans diplôme, 45 ans)", base({ age: "45", education: "less_than_secondary", firstBands: uniform(7) }));
  return list;
}
