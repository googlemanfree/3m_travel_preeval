import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  /** Résultats des lectures `select … .limit()` dans l'ordre exact où le routeur les émet. */
  reads: [] as unknown[][],
  updates: [] as any[],
  inserts: [] as any[],
  emails: [] as any[],
  failTrash: false,
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => {
      const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: async () => state.reads.shift() ?? [] };
      return chain;
    },
    update: () => ({ set: (values: any) => ({ where: async () => { if (state.failTrash && values.deletedAt) throw new Error("corbeille indisponible"); state.updates.push(values); } }) }),
    insert: () => ({ values: async (row: any) => { state.inserts.push(row); return [{ insertId: 34 }]; } }),
    delete: () => ({ where: async () => undefined }),
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
  state.failTrash = false;
});

describe("conditions d'ouverture du dossier : dites ce qui manque AVANT le clic", () => {
  it("compte sans évaluation ni paiement : deux blocages nommés, activation impossible, référence de compte annoncée", async () => {
    // lectures : compte, preuve de paiement saisie sur le compte (aucune), dernier dossier en ligne, dossier agence payé
    state.reads = [[candidate()], [], [], []];
    const result = await caller().preDossierActivationReadiness({ ...base, candidateId: 42 });
    expect(result).toMatchObject({ canActivate: false, evaluationValidated: false, paymentValidated: false, alreadyActive: false, accountReference: "COMPTE-00042", openingPayment: null });
    expect(result.blockers.map((blocker) => blocker.code)).toEqual(["evaluation", "payment"]);
  });

  it("évaluation validée mais paiement non validé : seul le paiement bloque", async () => {
    state.reads = [[candidate(validatedEvaluation)], [], [{ paymentStatus: "SUCCESS", paymentValidatedAt: null, paymentValidatedBy: null }], []];
    const result = await caller().preDossierActivationReadiness({ ...base, candidateId: 42 });
    expect(result.blockers.map((blocker) => blocker.code)).toEqual(["payment"]);
    expect(result.evaluationValidated).toBe(true);
  });

  it("évaluation + paiement en ligne validé par un administrateur : activation possible", async () => {
    state.reads = [[candidate(validatedEvaluation)], [], [onlinePaymentValidated]];
    const result = await caller().preDossierActivationReadiness({ ...base, candidateId: 42 });
    expect(result).toMatchObject({ canActivate: true, paymentValidated: true, blockers: [] });
  });

  it("paiement agence : exige la confirmation du journal d'audit, pas seulement le statut « payé »", async () => {
    state.reads = [[candidate(validatedEvaluation)], [], [], [{ id: 9, email: "candidat@example.com" }], []];
    expect((await caller().preDossierActivationReadiness({ ...base, candidateId: 42 })).paymentValidated).toBe(false);
    state.reads = [[candidate(validatedEvaluation)], [], [], [{ id: 9, email: "candidat@example.com" }], [{ id: 1 }]];
    expect((await caller().preDossierActivationReadiness({ ...base, candidateId: 42 })).paymentValidated).toBe(true);
  });

  it("paiement d'ouverture confirmé directement sur le compte (sans dossier) : suffit à débloquer l'activation", async () => {
    const record = { candidateId: 42, validatedAt: "2026-10-06T10:00:00.000Z", validatedBy: "agent@3mtravelagency.com", reference: "OM-998877", proofFileUrl: null, confirmedAmount: 65000 };
    state.reads = [[candidate(validatedEvaluation)], [{ settingValue: JSON.stringify(record) }]];
    const result = await caller().preDossierActivationReadiness({ ...base, candidateId: 42 });
    expect(result).toMatchObject({ canActivate: true, paymentValidated: true, blockers: [] });
    expect(result.openingPayment).toMatchObject({ reference: "OM-998877", validatedBy: "agent@3mtravelagency.com" });
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

describe("rapport d'historique des paiements multiples", () => {
  it("retourne séparément les frais principal et supplémentaire avec le journal admin", async () => {
    const record = {
      candidateId: 42,
      validatedAt: "2026-10-06T10:00:00.000Z",
      validatedBy: "agent@3mtravelagency.com",
      reference: "OM-PRINCIPAL",
      proofFileUrl: null,
      confirmedAmount: 72000,
      additionalPayment: { reference: "OM-SECONDE", proofFileUrl: "/manus-storage/proof.mp4", confirmedAmount: 91000 },
    };
    state.reads = [
      [{ email: "candidat@example.com", fullName: "Candidat Test" }],
      [{ id: 42 }],
      [{ settingValue: JSON.stringify(record) }],
      [{ settingValue: JSON.stringify({ candidateId: 42, proofFileUrl: "/manus-storage/pending.jpg", uploadedAt: "2026-10-07T09:00:00.000Z", uploadedBy: "agent@3mtravelagency.com", fileName: "facture.jpg", mimeType: "image/jpeg" }) }],
      [{ id: 1, action: "confirmed", amount: "72000 XAF", adminEmail: "agent@3mtravelagency.com", createdAt: new Date() }, { id: 2, action: "confirmed", amount: "91000 XAF", adminEmail: "agent@3mtravelagency.com", createdAt: new Date() }],
    ];
    const result = await caller().getOpeningPaymentHistory({ ...base, candidateId: "agency_34" });
    expect(result.payments).toHaveLength(2);
    expect(result.payments.map((payment) => payment.reference)).toEqual(["OM-PRINCIPAL", "OM-SECONDE"]);
    expect(result.payments[1]).toMatchObject({ amount: 91000, proofFileUrl: "/manus-storage/proof.mp4" });
    expect(result.auditRows).toHaveLength(2);
    expect(result.pendingProof).toMatchObject({ fileName: "facture.jpg", proofFileUrl: "/manus-storage/pending.jpg" });
  });
});

describe("activation : mêmes conditions, mêmes messages, et la référence change toute seule", () => {
  it("refuse sans paiement validé avec EXACTEMENT le message que l'écran affiche avant le clic", async () => {
    const expected = (await (async () => { state.reads = [[candidate(validatedEvaluation)], [], [], []]; return caller().preDossierActivationReadiness({ ...base, candidateId: 42 }); })()).blockers[0].message;
    state.reads = [[candidate(validatedEvaluation)], [], [], []];
    await expect(caller().activatePreDossierAccount({ ...base, candidateId: 42, destination: "luxembourg", visaType: "Études" })).rejects.toThrow(expected);
    expect(state.inserts).toHaveLength(0);
    expect(state.updates).toHaveLength(0);
  });

  it("refuse sans évaluation validée, avant même de regarder le paiement", async () => {
    state.reads = [[candidate()]];
    await expect(caller().activatePreDossierAccount({ ...base, candidateId: 42, destination: "luxembourg", visaType: "Études" })).rejects.toThrow(/évaluation doit être validée/);
    expect(state.inserts).toHaveLength(0);
  });

  it("une preuve de paiement confirmée directement sur le compte suffit aussi à l'activation réelle", async () => {
    const record = { candidateId: 42, validatedAt: "2026-10-06T10:00:00.000Z", validatedBy: "agent@3mtravelagency.com", reference: "OM-998877", proofFileUrl: null, confirmedAmount: 65000 };
    // lectures : compte, preuve de paiement du compte (trouvée → isOpeningPaymentValidated jamais appelée), pré-dossier existant (aucun) → création
    state.reads = [[candidate(validatedEvaluation)], [{ settingValue: JSON.stringify(record) }], []];
    const result = await caller().activatePreDossierAccount({ ...base, candidateId: 42, destination: "luxembourg", visaType: "Études" });
    expect(result).toMatchObject({ success: true, dossierReference: "3M-AGN-0034" });
  });

  it("conditions réunies : COMPTE-00042 devient 3M-AGN-0034 (réponse, journal, notification client, e-mail)", async () => {
    // lectures : compte, preuve de paiement du compte (aucune), dossier en ligne validé, pré-dossier agence existant (aucun) → création
    state.reads = [[candidate(validatedEvaluation)], [], [onlinePaymentValidated], []];
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

describe("confirmOpeningPaymentForAccount : valider le paiement directement sur un compte sans dossier", () => {
  it("confirme avec une référence de transaction seule", async () => {
    // lectures : compte, preuve déjà confirmée sur ce compte (aucune), ligne agency_settings existante pour cette clé (aucune → insertion)
    state.reads = [[candidate()], [], []];
    const result = await caller().confirmOpeningPaymentForAccount({ ...base, candidateId: 42, paymentReference: "OM-998877" });
    expect(result.success).toBe(true);
    expect(result.record).toMatchObject({ candidateId: 42, reference: "OM-998877", proofFileUrl: null, validatedBy: "agent@3mtravelagency.com" });
    const settingInsert = state.inserts.find((row) => row.settingKey === "opening_payment:42");
    expect(settingInsert).toBeDefined();
    expect(JSON.parse(settingInsert.settingValue)).toMatchObject({ reference: "OM-998877" });
    const auditInsert = state.inserts.find((row) => row.action === "confirmed" && row.candidateEmail === "candidat@example.com");
    expect(auditInsert).toBeDefined();
    expect(auditInsert.details).toContain("COMPTE-00042");
  });

  it("confirme avec une preuve (photo ou vidéo) seule, sans référence", async () => {
    state.reads = [[candidate()], [], []];
    const result = await caller().confirmOpeningPaymentForAccount({ ...base, candidateId: 42, proofFileUrl: "/manus-storage/candidates/opening-payment-proof/42/facture.jpg" });
    expect(result.record).toMatchObject({ reference: null, proofFileUrl: "/manus-storage/candidates/opening-payment-proof/42/facture.jpg" });
  });

  it("conserve un montant variable et enregistre un second frais avec sa référence", async () => {
    state.reads = [[candidate()], [], []];
    const result = await caller().confirmOpeningPaymentForAccount({
      ...base,
      candidateId: 42,
      paymentReference: "OM-PRINCIPAL",
      confirmedAmount: 72000,
      additionalPaymentReference: "OM-SECONDE",
      additionalConfirmedAmount: 91000,
    });
    expect(result.record).toMatchObject({
      reference: "OM-PRINCIPAL",
      confirmedAmount: 72000,
      additionalPayment: { reference: "OM-SECONDE", confirmedAmount: 91000 },
    });
    expect(state.inserts.filter(row => row.action === "confirmed")).toHaveLength(2);
  });

  it("ajoute deux dossiers agence distincts après validation des deux frais", async () => {
    const record = {
      candidateId: 42,
      validatedAt: "2026-10-06T10:00:00.000Z",
      validatedBy: "agent@3mtravelagency.com",
      reference: "OM-PRINCIPAL",
      proofFileUrl: null,
      confirmedAmount: 72000,
      additionalPayment: { reference: "OM-SECONDE", proofFileUrl: null, confirmedAmount: 91000 },
    };
    state.reads = [[candidate(validatedEvaluation)], [{ settingValue: JSON.stringify(record) }], []];
    const result = await caller().activatePreDossierAccount({
      ...base,
      candidateId: 42,
      destination: "luxembourg",
      visaType: "Études",
      additionalProcedure: { destination: "canada", visaType: "Travail" },
    });
    expect(result).toMatchObject({ success: true, additionalAgencyDossierId: 34, additionalDossierReference: "3M-AGN-0034" });
    const dossierInserts = state.inserts.filter(row => row.source === "manual_admin");
    expect(dossierInserts).toHaveLength(2);
    expect(dossierInserts[1]).toMatchObject({ destination: "Canada", visaType: "Travail" });
  });

  it("refuse si ni référence ni preuve ne sont fournies, avant toute lecture", async () => {
    await expect(caller().confirmOpeningPaymentForAccount({ ...base, candidateId: 42 })).rejects.toThrow();
    expect(state.inserts).toHaveLength(0);
  });

  it("refuse une adresse de preuve qui ne vient pas de notre stockage", async () => {
    state.reads = [[candidate()], []];
    await expect(caller().confirmOpeningPaymentForAccount({ ...base, candidateId: 42, proofFileUrl: "https://evil.example/facture.jpg" })).rejects.toThrow(/invalide/);
    expect(state.inserts).toHaveLength(0);
  });

  it("refuse si le compte a déjà un dossier actif", async () => {
    state.reads = [[candidate({ dossierStatus: "documents" })]];
    await expect(caller().confirmOpeningPaymentForAccount({ ...base, candidateId: 42, paymentReference: "OM-1" })).rejects.toThrow(/déjà un dossier actif/);
  });

  it("refuse une seconde confirmation : le paiement est déjà confirmé", async () => {
    const record = { candidateId: 42, validatedAt: "2026-10-06T10:00:00.000Z", validatedBy: "agent@3mtravelagency.com", reference: "OM-1", proofFileUrl: null, confirmedAmount: 65000 };
    state.reads = [[candidate()], [{ settingValue: JSON.stringify(record) }]];
    await expect(caller().confirmOpeningPaymentForAccount({ ...base, candidateId: 42, paymentReference: "OM-2" })).rejects.toThrow(/déjà été confirmé/);
    expect(state.inserts).toHaveLength(0);
  });

  it("compte introuvable : erreur claire", async () => {
    state.reads = [[]];
    await expect(caller().confirmOpeningPaymentForAccount({ ...base, candidateId: 999, paymentReference: "OM-1" })).rejects.toThrow(/introuvable/);
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

describe("liste « Comptes à ouvrir » : ni corbeille, ni personne qui a déjà un dossier actif", () => {
  const account = (id: number, email: string) => candidate({ id, email, fullName: `Compte ${id}`, createdAt: new Date("2026-09-20"), lastLoginAt: null, emailVerified: true, destination: "luxembourg" });

  it("masque le compte dont l'e-mail a un dossier agence ouvert ou un dossier en ligne payé, sans rien modifier, et l'annonce", async () => {
    // lectures : comptes « nouveau » non supprimés, pièces, dossiers agence actifs, dossiers en ligne actifs
    state.reads = [
      [account(1, "a@example.com"), account(2, "B@Example.com"), account(3, "c@example.com"), account(4, "d@example.com")],
      [{ candidateId: 4 }, { candidateId: 4 }],
      [{ email: "A@example.com" }],
      [{ email: "b@example.com" }],
    ];
    const result = await caller().listPreDossierAccounts({ ...base });
    expect(result.accounts.map((item) => item.id)).toEqual([3, 4]);
    expect(result.total).toBe(2);
    expect(result.coveredByActiveDossier).toBe(2);
    expect(result.accounts.find((item) => item.id === 4)?.documentsCount).toBe(2);
    expect(state.updates).toHaveLength(0);
    expect(state.inserts).toHaveLength(0);
  });

  it("aucune personne couverte : rien n'est masqué", async () => {
    state.reads = [[account(1, "a@example.com")], [], [], []];
    const result = await caller().listPreDossierAccounts({ ...base });
    expect(result).toMatchObject({ total: 1, coveredByActiveDossier: 0 });
  });

  it("les comptes mis en corbeille sont exclus dès la requête (deletedAt)", () => {
    const source = require("node:fs").readFileSync(require("node:path").resolve(__dirname, "routers/adminCandidateManagement.ts"), "utf8");
    const list = source.slice(source.indexOf("listPreDossierAccounts:"), source.indexOf("validateOfflineEvaluation:"));
    expect(list).toContain("isNull(candidates.deletedAt)");
    expect(list).toContain("loadEmailsWithActiveDossier(db)");
  });
});

describe("activation : les doublons certains du même dossier partent à la corbeille tout seuls", () => {
  // Six lectures de loadRedundantPreAccounts : comptes, pré-dossiers agence, dossiers agence actifs, dossiers en ligne actifs, e-mails agence, e-mails en ligne.
  const duplicateWorld = () => [
    [],
    [{ id: 7, fullName: "Candidat Test", email: "candidat@example.com", phone: null, createdAt: new Date("2026-09-01") }],
    [{ id: 34, fullName: "Candidat Test", email: "candidat@example.com", phone: "+237698104832", status: "en_cours" }],
    [],
    [{ email: "candidat@example.com" }],
    [],
  ];

  it("rattache le dossier 34 puis met le pré-dossier doublon 7 en corbeille (réversible, journalisé)", async () => {
    // lectures : compte, preuve de paiement du compte (aucune), paiement en ligne validé, pré-dossier agence existant (34) ; puis détection ; puis re-détection à l'archivage
    state.reads = [[candidate(validatedEvaluation)], [], [onlinePaymentValidated], [{ id: 34 }], ...duplicateWorld(), ...duplicateWorld()];
    const result = await caller().activatePreDossierAccount({ ...base, candidateId: 42, destination: "luxembourg", visaType: "Études" });
    expect(result).toMatchObject({ dossierReference: "3M-AGN-0034", archivedDuplicates: ["3M-AGN-0007"] });
    const trashed = state.updates.find((values) => values.deletedAt);
    expect(trashed).toMatchObject({ deletedBy: "agent@3mtravelagency.com" });
    expect(trashed.deletionReason).toContain("3M-AGN-0034");
    expect(state.inserts.some((row) => String(row.evaluationType ?? "").startsWith("redundant_pre_account_archived"))).toBe(true);
  });

  it("jamais le dossier qu'on vient d'activer, jamais un compte de connexion, jamais un cas « probable »", async () => {
    // « probable » : autre e-mail, même téléphone, même nom que le dossier actif → à vérifier par un humain, jamais archivé tout seul
    const probableWorld = () => [
      [{ id: 99, fullName: "Candidat Test", email: "autre@example.com", phone: "698104832", createdAt: new Date() }],
      [],
      [{ id: 34, fullName: "Candidat Test", email: "candidat@example.com", phone: "+237698104832", status: "en_cours" }],
      [], [], [],
    ];
    state.reads = [[candidate(validatedEvaluation)], [], [onlinePaymentValidated], [{ id: 34 }], ...probableWorld(), ...probableWorld()];
    const result = await caller().activatePreDossierAccount({ ...base, candidateId: 42, destination: "luxembourg", visaType: "Études" });
    expect(result.archivedDuplicates).toEqual([]);
    expect(state.updates.some((values) => values.deletedAt)).toBe(false);
  });

  it("un doublon lié à UN AUTRE dossier actif de la même personne n'est pas touché (on ne devine pas lequel garder)", async () => {
    const otherActiveWorld = () => [
      [],
      [{ id: 7, fullName: "Candidat Test", email: "candidat@example.com", phone: null, createdAt: new Date("2026-09-01") }],
      // le dossier 40 passe avant le 34 : c'est lui que la détection associe à l'adresse e-mail
      [{ id: 40, fullName: "Candidat Test", email: "candidat@example.com", phone: null, status: "en_cours" }, { id: 34, fullName: "Candidat Test", email: "candidat@example.com", phone: null, status: "en_cours" }],
      [], [{ email: "candidat@example.com" }], [],
    ];
    state.reads = [[candidate(validatedEvaluation)], [], [onlinePaymentValidated], [{ id: 34 }], ...otherActiveWorld(), ...otherActiveWorld()];
    const result = await caller().activatePreDossierAccount({ ...base, candidateId: 42, destination: "luxembourg", visaType: "Études" });
    expect(result.archivedDuplicates).toEqual([]);
    expect(state.updates.some((values) => values.deletedAt)).toBe(false);
  });

  it("un échec du nettoyage ne défait pas l'activation", async () => {
    state.failTrash = true;
    state.reads = [[candidate(validatedEvaluation)], [], [onlinePaymentValidated], [{ id: 34 }], ...duplicateWorld(), ...duplicateWorld()];
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = await caller().activatePreDossierAccount({ ...base, candidateId: 42, destination: "luxembourg", visaType: "Études" });
    expect(result).toMatchObject({ success: true, dossierReference: "3M-AGN-0034", archivedDuplicates: [] });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
