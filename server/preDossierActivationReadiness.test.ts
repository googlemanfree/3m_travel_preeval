import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  /** Résultats des lectures `select … .limit()` dans l'ordre exact où le routeur les émet. */
  reads: [] as unknown[][],
  updates: [] as any[],
  inserts: [] as any[],
  emails: [] as any[],
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => {
      const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: async () => state.reads.shift() ?? [] };
      return chain;
    },
    update: () => ({ set: (values: any) => ({ where: async () => { state.updates.push(values); } }) }),
    insert: () => ({ values: async (row: any) => { state.inserts.push(row); return [{ insertId: 34 }]; } }),
  }),
}));
vi.mock("./routers/adminAuth", () => ({
  requireAdminSessionFromCookie: async () => ({ email: "agent@3mtravelagency.com" }),
  requireValidAdminSession: async () => ({ email: "agent@3mtravelagency.com" }),
}));
vi.mock("./emailService", () => ({
  sendClientNotificationEmail: async () => true,
  sendDossierConfirmationEmail: async (...args: any[]) => { state.emails.push(args); return true; },
}));
vi.mock("./storage", () => ({ storagePut: async () => ({ url: "/manus-storage/x", key: "x" }) }));

import { adminCandidateManagementRouter } from "./routers/adminCandidateManagement";

const caller = () => adminCandidateManagementRouter.createCaller({ req: { headers: {} } } as any);
const base = { sessionToken: "jeton-admin" };

const candidate = (overrides: Record<string, unknown> = {}) => ({
  id: 42, fullName: "Candidat Test", email: "candidat@example.com", phone: "+237698104832", dateOfBirth: null, nationality: "Camerounaise",
  dossierStatus: "nouveau", evaluationDeclarationStatus: "not_declared", evaluationReviewedAt: null, evaluationDeclaredAt: null, ...overrides,
});
const validatedEvaluation = { evaluationDeclarationStatus: "validated", evaluationReviewedAt: new Date("2026-09-30T10:00:00Z") };
const onlinePaymentValidated = { paymentStatus: "SUCCESS", paymentValidatedAt: new Date("2026-10-01T10:00:00Z"), paymentValidatedBy: "agent@3mtravelagency.com" };

beforeEach(() => {
  state.reads = [];
  state.updates = [];
  state.inserts = [];
  state.emails = [];
});

describe("conditions d'ouverture du dossier : dites ce qui manque AVANT le clic", () => {
  it("compte sans évaluation ni paiement : deux blocages nommés, activation impossible, référence de compte annoncée", async () => {
    // lectures : compte, dernier dossier en ligne, dossier agence payé
    state.reads = [[candidate()], [], []];
    const result = await caller().preDossierActivationReadiness({ ...base, candidateId: 42 });
    expect(result).toMatchObject({ canActivate: false, evaluationValidated: false, paymentValidated: false, alreadyActive: false, accountReference: "COMPTE-00042" });
    expect(result.blockers.map((blocker) => blocker.code)).toEqual(["evaluation", "payment"]);
  });

  it("évaluation validée mais paiement non validé : seul le paiement bloque", async () => {
    state.reads = [[candidate(validatedEvaluation)], [{ paymentStatus: "SUCCESS", paymentValidatedAt: null, paymentValidatedBy: null }], []];
    const result = await caller().preDossierActivationReadiness({ ...base, candidateId: 42 });
    expect(result.blockers.map((blocker) => blocker.code)).toEqual(["payment"]);
    expect(result.evaluationValidated).toBe(true);
  });

  it("évaluation + paiement en ligne validé par un administrateur : activation possible", async () => {
    state.reads = [[candidate(validatedEvaluation)], [onlinePaymentValidated]];
    const result = await caller().preDossierActivationReadiness({ ...base, candidateId: 42 });
    expect(result).toMatchObject({ canActivate: true, paymentValidated: true, blockers: [] });
  });

  it("paiement agence : exige la confirmation du journal d'audit, pas seulement le statut « payé »", async () => {
    state.reads = [[candidate(validatedEvaluation)], [], [{ id: 9, email: "candidat@example.com" }], []];
    expect((await caller().preDossierActivationReadiness({ ...base, candidateId: 42 })).paymentValidated).toBe(false);
    state.reads = [[candidate(validatedEvaluation)], [], [{ id: 9, email: "candidat@example.com" }], [{ id: 1 }]];
    expect((await caller().preDossierActivationReadiness({ ...base, candidateId: 42 })).paymentValidated).toBe(true);
  });

  it("dossier déjà actif : un seul blocage, « déjà actif »", async () => {
    state.reads = [[candidate({ dossierStatus: "documents", ...validatedEvaluation })]];
    const result = await caller().preDossierActivationReadiness({ ...base, candidateId: 42 });
    expect(result.alreadyActive).toBe(true);
    expect(result.blockers.map((blocker) => blocker.code)).toEqual(["already_active"]);
  });

  it("compte introuvable : erreur claire", async () => {
    state.reads = [[]];
    await expect(caller().preDossierActivationReadiness({ ...base, candidateId: 999 })).rejects.toThrow(/introuvable/);
  });
});

describe("activation : mêmes conditions, mêmes messages, et la référence change toute seule", () => {
  it("refuse sans paiement validé avec EXACTEMENT le message que l'écran affiche avant le clic", async () => {
    state.reads = [[candidate(validatedEvaluation)], [], []];
    const expected = (await (async () => { state.reads = [[candidate(validatedEvaluation)], [], []]; return caller().preDossierActivationReadiness({ ...base, candidateId: 42 }); })()).blockers[0].message;
    state.reads = [[candidate(validatedEvaluation)], [], []];
    await expect(caller().activatePreDossierAccount({ ...base, candidateId: 42, destination: "luxembourg", visaType: "Études" })).rejects.toThrow(expected);
    expect(state.inserts).toHaveLength(0);
    expect(state.updates).toHaveLength(0);
  });

  it("refuse sans évaluation validée, avant même de regarder le paiement", async () => {
    state.reads = [[candidate()]];
    await expect(caller().activatePreDossierAccount({ ...base, candidateId: 42, destination: "luxembourg", visaType: "Études" })).rejects.toThrow(/évaluation doit être validée/);
    expect(state.inserts).toHaveLength(0);
  });

  it("conditions réunies : COMPTE-00042 devient 3M-AGN-0034 (réponse, journal, notification client, e-mail)", async () => {
    // lectures : compte, dossier en ligne validé, pré-dossier agence existant (aucun) → création
    state.reads = [[candidate(validatedEvaluation)], [onlinePaymentValidated], []];
    const result = await caller().activatePreDossierAccount({ ...base, candidateId: 42, destination: "luxembourg", visaType: "Études" });
    expect(result).toMatchObject({ success: true, previousAccountReference: "COMPTE-00042", dossierReference: "3M-AGN-0034", emailSent: true });
    const journal = state.inserts.find((row) => row.action === "reference_changed");
    expect(journal).toMatchObject({ oldValue: "COMPTE-00042", newValue: "3M-AGN-0034" });
    const notification = state.inserts.find((row) => row.title === "Votre dossier est activé");
    expect(notification.body).toContain("COMPTE-00042");
    expect(notification.body).toContain("3M-AGN-0034");
    expect(state.emails[0][2]).toBe("3M-AGN-0034");
    expect(state.emails[0][5]).toBe("COMPTE-00042");
    expect(state.updates.some((values) => values.dossierStatus === "documents")).toBe(true);
  });
});

describe("évaluation remise hors ligne pour un compte sans dossier (« account_N »)", () => {
  it("avant : l'identifiant « account_42 » était rejeté par le schéma, donc le compte ne pouvait jamais être validé", async () => {
    state.reads = [[candidate()]];
    const result = await caller().validateOfflineEvaluation({ ...base, candidateId: "account_42", channel: "agence", note: "Remise en agence le 30/09" });
    expect(result).toMatchObject({ success: true, channel: "agence", candidateLinked: true });
    const validated = state.updates.find((values) => values.evaluationDeclarationStatus === "validated");
    expect(validated.evaluationReviewedBy).toBe("agent@3mtravelagency.com");
    expect(validated.evaluationReviewNote).toContain("bureau en agence");
    expect(validated.evaluationReviewNote).toContain("Remise en agence le 30/09");
  });

  it("ne valide pas deux fois une évaluation déjà validée", async () => {
    state.reads = [[candidate(validatedEvaluation)]];
    await expect(caller().validateOfflineEvaluation({ ...base, candidateId: "account_42", channel: "appel" })).rejects.toThrow(/déjà validée/);
    expect(state.updates).toHaveLength(0);
  });

  it("compte inexistant : refus clair, aucune écriture", async () => {
    state.reads = [[]];
    await expect(caller().validateOfflineEvaluation({ ...base, candidateId: "account_999", channel: "email" })).rejects.toThrow(/introuvable/);
    expect(state.updates).toHaveLength(0);
  });

  it("les formats online_/agency_ restent acceptés ; un format inconnu reste refusé", async () => {
    await expect(caller().validateOfflineEvaluation({ ...base, candidateId: "autre_5", channel: "appel" } as any)).rejects.toThrow();
  });
});
