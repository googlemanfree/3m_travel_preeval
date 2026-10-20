import type { DynamicField, FieldCondition, FieldOption } from "./types";

export const opts = (...pairs: Array<[string, string]>): FieldOption[] => pairs.map(([value, label]) => ({ value, label }));

type FieldExtras = Partial<Pick<DynamicField, "placeholder" | "help" | "required" | "showIf" | "wide" | "maxLength">>;

export const sel = (key: string, label: string, options: FieldOption[], extras: FieldExtras = {}): DynamicField => ({ key, label, kind: "select", options, storage: "detail", ...extras });
export const txt = (key: string, label: string, extras: FieldExtras = {}): DynamicField => ({ key, label, kind: "text", storage: "detail", maxLength: 255, ...extras });
export const area = (key: string, label: string, extras: FieldExtras = {}): DynamicField => ({ key, label, kind: "textarea", storage: "detail", wide: true, maxLength: 1000, ...extras });
export const day = (key: string, label: string, extras: FieldExtras = {}): DynamicField => ({ key, label, kind: "date", storage: "detail", ...extras });
export const col = (field: DynamicField): DynamicField => ({ ...field, storage: "column" });

export const when = (key: string, ...values: string[]): FieldCondition[] => [{ key, in: values }];
export const whenNot = (key: string, ...values: string[]): FieldCondition[] => [{ key, notIn: values }];

export const YES_NO = opts(["oui", "Oui"], ["non", "Non"]);
export const YES_NO_UNSURE = opts(["oui", "Oui"], ["non", "Non"], ["inconnu", "Je ne sais pas"]);
export const YES_NO_PENDING = opts(["oui", "Oui"], ["non", "Non"], ["en_cours", "En cours"]);
export const OFFER_STATUS = opts(["signee", "Signée"], ["en_discussion", "En discussion"], ["aucune", "Aucune"]);
export const RECEIVED_STATUS = opts(["recue", "Reçue"], ["en_cours", "Demande en cours"], ["non", "Pas encore"]);
export const RECOGNITION_STATUS = opts(["non_commencee", "Pas encore commencée"], ["preparation", "Documents en préparation"], ["deposee", "Démarche déposée"], ["obtenue", "Obtenue"], ["inconnu", "Je ne sais pas"]);
export const DURATION_BANDS = opts(["moins_3_mois", "Moins de 3 mois"], ["3_6_mois", "3 à 6 mois"], ["6_12_mois", "6 à 12 mois"], ["plus_12_mois", "Plus de 12 mois"], ["a_definir", "À définir"]);
export const EXPERIENCE_BANDS = opts(["aucune", "Aucune"], ["0_1", "Moins d’un an"], ["1_3", "1 à 3 ans"], ["3_5", "3 à 5 ans"], ["5_plus", "Plus de 5 ans"]);
export const FUNDING_SOURCES = opts(["personnel", "Fonds personnels"], ["famille", "Soutien familial"], ["bourse", "Bourse"], ["employeur", "Employeur ou organisme"], ["mixte", "Plusieurs sources"], ["a_preciser", "À préciser"]);

/** Niveaux de langue (échelle européenne) : le même vocabulaire pour toutes les langues. */
export const LANGUAGE_LEVELS = opts(["aucun", "Aucun"], ["a1_a2", "A1 – A2 (débutant)"], ["b1", "B1"], ["b2", "B2"], ["c1_c2", "C1 – C2 (courant)"], ["natif", "Langue maternelle"]);

export const EDUCATION_LEVELS = opts(["avant_bac", "Niveau inférieur au baccalauréat"], ["bac", "Baccalauréat"], ["bac2", "Bac+2 / BTS / DUT"], ["licence", "Licence"], ["master", "Master ou plus"], ["doctorat", "Doctorat"]);
export const EDUCATION_LEVELS_STANDARD = EDUCATION_LEVELS.filter((option) => option.value !== "avant_bac");
export const EMPLOYMENT_STATUSES = opts(["employe", "Employé(e)"], ["independant", "Indépendant(e)"], ["sans_emploi", "Sans emploi"], ["etudiant", "Étudiant(e)"]);
export const YEARS_OF_EXPERIENCE = opts(["0-1", "Moins d’1 an"], ["1-3", "1 à 3 ans"], ["3-5", "3 à 5 ans"], ["5-10", "5 à 10 ans"], ["10+", "10 ans ou plus"]);
