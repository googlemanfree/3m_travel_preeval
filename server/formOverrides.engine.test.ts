import { describe, expect, it } from "vitest";
import {
  allVisibleFields,
  applyFormOverrides,
  buildAiGuidance,
  describeProjectDetails,
  missingRequiredFields,
  parseOverridePayload,
  resolveDynamicForm,
  sanitizeProjectDetails,
  validateOverride,
  type FormOverride,
} from "../shared/dynamicForm";

const keys = (form: ReturnType<typeof resolveDynamicForm>) => form.sections.flatMap((section) => section.fields.map((field) => field.key));
const ctx = { country: "Allemagne", projectType: "etudes" as const, programId: "etudes-professionnelle", domainId: "sante" };
const field = (form: ReturnType<typeof resolveDynamicForm>, key: string) => form.sections.flatMap((section) => section.fields).find((candidate) => candidate.key === key);

describe("questions modifiables par l'administration — moteur", () => {
  it("sans règle, le formulaire est celui du moteur", () => {
    expect(keys(resolveDynamicForm({ ...ctx, overrides: [] }))).toEqual(keys(resolveDynamicForm(ctx)));
    expect(keys(resolveDynamicForm({ ...ctx, overrides: undefined }))).toEqual(keys(resolveDynamicForm(ctx)));
  });

  it("masque une question, rend obligatoire ou facultative, renomme", () => {
    const form = resolveDynamicForm({ ...ctx, overrides: [
      { id: 1, fieldKey: "trainingStart", action: "hide" },
      { id: 2, fieldKey: "trainingFunding", action: "require" },
      { id: 3, fieldKey: "trainingKind", action: "optional" },
      { id: 4, fieldKey: "healthSetting", action: "relabel", payload: { label: "Où avez-vous le plus pratiqué les soins ?", help: "Une réponse suffit." } },
    ] });
    expect(keys(form)).not.toContain("trainingStart");
    expect(field(form, "trainingFunding")?.required).toBe(true);
    expect(field(form, "trainingKind")?.required).toBe(false);
    expect(field(form, "healthSetting")?.label).toBe("Où avez-vous le plus pratiqué les soins ?");
    expect(field(form, "healthSetting")?.help).toBe("Une réponse suffit.");
    expect(missingRequiredFields(form, {}).map((missing) => missing.key)).not.toContain("trainingKind");
    expect(missingRequiredFields(form, {}).map((missing) => missing.key)).toContain("trainingFunding");
  });

  it("ajoute une question, dans la section choisie, avec sa liste de choix", () => {
    const form = resolveDynamicForm({ ...ctx, overrides: [
      { id: 5, fieldKey: "custom_clinique", action: "add", payload: { label: "Avez-vous déjà travaillé dans une clinique ?", kind: "select", options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }], required: true, section: "domain" } },
      { id: 6, fieldKey: "custom_note", action: "add", payload: { label: "Précisions utiles", kind: "textarea" } },
    ] });
    const clinique = field(form, "custom_clinique");
    expect(clinique).toMatchObject({ kind: "select", required: true, storage: "detail" });
    expect(form.sections.find((section) => section.id === "domain")?.fields.map((candidate) => candidate.key)).toContain("custom_clinique");
    expect(form.sections.find((section) => section.id === "program")?.fields.map((candidate) => candidate.key)).toContain("custom_note");
    expect(missingRequiredFields(form, {}).map((missing) => missing.key)).toContain("custom_clinique");
  });

  it("une question ajoutée dans un domaine absent retombe dans la section du visa", () => {
    const form = resolveDynamicForm({ country: "France", projectType: "tourisme", programId: "tourisme-tourisme", overrides: [{ id: 1, fieldKey: "custom_x", action: "add", payload: { label: "Votre question", section: "domain" } }] });
    expect(form.sections.find((section) => section.id === "program")?.fields.map((candidate) => candidate.key)).toContain("custom_x");
  });

  it("une règle ne s'applique qu'à son contexte (type, visa, domaine, pays)", () => {
    const only: FormOverride[] = [{ id: 1, fieldKey: "trainingStart", action: "hide", projectKind: "etudes", programId: "etudes-professionnelle", domainId: "sante", countryCode: "DE" }];
    expect(keys(resolveDynamicForm({ ...ctx, overrides: only }))).not.toContain("trainingStart");
    expect(keys(resolveDynamicForm({ ...ctx, country: "France", overrides: only }))).toContain("trainingStart");
    expect(keys(resolveDynamicForm({ ...ctx, domainId: "btp", overrides: only }))).toContain("trainingStart");
    expect(keys(resolveDynamicForm({ ...ctx, programId: "etudes-cursus", overrides: only }))).not.toContain("trainingStart");
    expect(keys(resolveDynamicForm({ ...ctx, overrides: [{ ...only[0], active: false }] }))).toContain("trainingStart");
  });

  it("applique les règles dans l'ordre de création : la dernière gagne", () => {
    const form = resolveDynamicForm({ ...ctx, overrides: [
      { id: 9, fieldKey: "trainingKind", action: "relabel", payload: { label: "Deuxième libellé" } },
      { id: 3, fieldKey: "trainingKind", action: "relabel", payload: { label: "Premier libellé" } },
    ] });
    expect(field(form, "trainingKind")?.label).toBe("Deuxième libellé");
  });

  it("masquer une question parente retire ses questions de suivi", () => {
    const form = resolveDynamicForm({ ...ctx, overrides: [{ id: 1, fieldKey: "trainingContract", action: "hide" }] });
    expect(allVisibleFields(form, { trainingContract: "signee" }).map((visible) => visible.key)).not.toContain("trainingContractDetail");
  });

  it("n'accepte que des réponses valides pour les questions ajoutées, et ignore les questions masquées", () => {
    const overrides: FormOverride[] = [
      { id: 1, fieldKey: "custom_clinique", action: "add", payload: { label: "Clinique ?", kind: "select", options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }], section: "domain" } },
      { id: 2, fieldKey: "trainingStart", action: "hide" },
    ];
    const clean = sanitizeProjectDetails({ country: "Allemagne", projectType: "etudes", overrides }, { programId: "etudes-professionnelle", domainId: "sante", custom_clinique: "peut_etre", trainingStart: "septembre", trainingKind: "stage" });
    expect(clean.custom_clinique).toBeUndefined();
    expect(clean.trainingStart).toBeUndefined();
    expect(clean.trainingKind).toBe("stage");
    const valid = sanitizeProjectDetails({ country: "Allemagne", projectType: "etudes", overrides }, { programId: "etudes-professionnelle", domainId: "sante", custom_clinique: "oui" });
    expect(valid.custom_clinique).toBe("oui");
    expect(sanitizeProjectDetails({ country: "Allemagne", projectType: "etudes" }, { programId: "etudes-professionnelle", domainId: "sante", custom_clinique: "oui" }).custom_clinique).toBeUndefined();
  });

  it("restitue la question ajoutée et son libellé de réponse au conseiller et à l'IA", () => {
    const overrides: FormOverride[] = [{ id: 1, fieldKey: "custom_clinique", action: "add", payload: { label: "Avez-vous déjà travaillé dans une clinique ?", kind: "select", options: [{ value: "oui", label: "Oui, en clinique privée" }, { value: "non", label: "Non" }], section: "domain" } }];
    const described = describeProjectDetails({ country: "Allemagne", projectType: "etudes", overrides }, { programId: "etudes-professionnelle", domainId: "sante", custom_clinique: "oui" });
    expect(described).toContainEqual({ key: "custom_clinique", question: "Avez-vous déjà travaillé dans une clinique ?", answer: "Oui, en clinique privée" });
    expect(buildAiGuidance(resolveDynamicForm({ ...ctx, overrides }), { custom_clinique: "oui" }).join(" ")).toMatch(/Santé et soins/);
  });
});

describe("questions modifiables — validation des règles", () => {
  it("refuse une promesse de résultat dans un libellé, une aide ou un choix", () => {
    for (const payload of [{ label: "Visa garanti : êtes-vous prêt ?" }, { label: "Votre situation", help: "Vous serez admissible" }]) {
      expect(validateOverride({ fieldKey: "custom_a", action: "add", payload }), JSON.stringify(payload)).toMatch(/promet un résultat/);
    }
    expect(validateOverride({ fieldKey: "custom_a", action: "add", payload: { label: "Choix", kind: "select", options: [{ value: "a", label: "Emploi garanti" }, { value: "b", label: "Autre" }] } })).toMatch(/promet un résultat/);
  });

  it("exige une clé « custom_ » pour une question ajoutée, un libellé, et des choix cohérents", () => {
    expect(validateOverride({ fieldKey: "targetJob", action: "add", payload: { label: "Question" } })).toMatch(/custom_/);
    expect(validateOverride({ fieldKey: "custom_a", action: "add", payload: {} })).toMatch(/libellé/);
    expect(validateOverride({ fieldKey: "custom_a", action: "add", payload: { label: "Question", kind: "select", options: [{ value: "a", label: "A" }] } })).toMatch(/2 et 12/);
    expect(validateOverride({ fieldKey: "custom_a", action: "add", payload: { label: "Question", kind: "select", options: [{ value: "a", label: "A" }, { value: "a", label: "B" }] } })).toMatch(/différentes/);
    expect(validateOverride({ fieldKey: "custom_a", action: "add", payload: { label: "Question", kind: "select", options: [{ value: "Ça va", label: "A" }, { value: "b", label: "B" }] } })).toMatch(/valeur simple/);
    expect(validateOverride({ fieldKey: "custom_a", action: "add", payload: { label: "Question", kind: "select", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] } })).toBeNull();
  });

  it("contrôle la clé, l'action, le pays et la forme d'un renommage", () => {
    expect(validateOverride({ fieldKey: "1mauvais", action: "hide" })).toMatch(/clé/);
    expect(validateOverride({ fieldKey: "targetJob", action: "hide", countryCode: "ALL" })).toMatch(/deux lettres/);
    expect(validateOverride({ fieldKey: "targetJob", action: "relabel", payload: {} })).toMatch(/au moins un nouveau libellé/);
    expect(validateOverride({ fieldKey: "targetJob", action: "relabel", payload: { label: "Poste visé" } })).toBeNull();
    expect(validateOverride({ fieldKey: "targetJob", action: "hide", projectKind: "travail", countryCode: "de" })).toBeNull();
  });

  it("relit une charge utile enregistrée sans jamais lever", () => {
    expect(parseOverridePayload(JSON.stringify({ label: "Test" }))).toEqual({ label: "Test" });
    expect(parseOverridePayload("{pas json")).toBeNull();
    expect(parseOverridePayload(null)).toBeNull();
    expect(parseOverridePayload("[1,2]")).toBeNull();
  });

  it("applyFormOverrides ne modifie pas les sections d'origine", () => {
    const form = resolveDynamicForm(ctx);
    const before = JSON.stringify(form.sections);
    applyFormOverrides(form.sections, [{ id: 1, fieldKey: "trainingKind", action: "hide" }], { kind: "etudes", programId: "etudes-professionnelle", domainId: "sante", countryCode: "DE" });
    expect(JSON.stringify(form.sections)).toBe(before);
  });
});
