import { describe, expect, it } from "vitest";
import { WORKFLOW_ACTIONS, WORKFLOW_STATUSES, nextWorkflowStatus } from "../shared/evaluationValidation";
import { VALIDATION_FILTERS, VALIDATION_FILTER_LABELS, availabilityFor, clampScore, countByValidationFilter, describeValue, linesToList, listToLines, matchesValidationFilter, parseOptionalTotal, sameVersion } from "../client/src/lib/evaluationValidationForm";
import { blankAdminVersion } from "../shared/evaluationValidation";

describe("utilitaires du formulaire de validation", () => {
  it("convertit un texte en liste (une ligne par élément) et inversement", () => {
    expect(linesToList("  Atout 1\r\n\r\n   \nAtout 2  \n")).toEqual(["Atout 1", "Atout 2"]);
    expect(linesToList("")).toEqual([]);
    expect(listToLines(["a", "b"])).toBe("a\nb");
    expect(linesToList(listToLines(["a", "b"]))).toEqual(["a", "b"]);
  });

  it("borne les notes saisies et remplace une valeur illisible par 0", () => {
    expect(clampScore("12", 15)).toBe(12);
    expect(clampScore("99", 15)).toBe(15);
    expect(clampScore("-3", 15)).toBe(0);
    expect(clampScore("7,6", 15)).toBe(0); // virgule décimale illisible pour Number()
    expect(clampScore("7.6", 15)).toBe(8);
    expect(clampScore("abc", 15)).toBe(0);
    expect(clampScore("", 15)).toBe(0);
  });

  it("lit le score global manuel : vide = calcul automatique, sinon borné à [0, 100]", () => {
    expect(parseOptionalTotal("")).toBeNull();
    expect(parseOptionalTotal("   ")).toBeNull();
    expect(parseOptionalTotal("68")).toBe(68);
    expect(parseOptionalTotal("250")).toBe(100);
    expect(parseOptionalTotal("-4")).toBe(0);
    expect(parseOptionalTotal("abc")).toBeNull();
  });

  it("détecte une modification de la version", () => {
    const a = blankAdminVersion({ priorityCountry: "Canada", candidateName: "A", evaluationDate: "2026-09-21" });
    expect(sameVersion(a, { ...a })).toBe(true);
    expect(sameVersion(a, { ...a, clientRemarks: "x" })).toBe(false);
    expect(sameVersion(null, undefined)).toBe(true);
    expect(sameVersion(a, null)).toBe(false);
  });

  it("n'offre que les actions permises par la matrice de transitions du serveur", () => {
    for (const status of WORKFLOW_STATUSES) {
      const available = availabilityFor(status);
      expect(available.canEdit, status).toBe(nextWorkflowStatus(status, "save_draft") !== null);
      expect(available.canPublish, status).toBe(nextWorkflowStatus(status, "publish") !== null);
      expect(available.canRequestInfo, status).toBe(nextWorkflowStatus(status, "request_info") !== null);
      expect(available.canResendEmail, status).toBe(nextWorkflowStatus(status, "send_notification") !== null);
      expect(available.canReevaluate, status).toBe(nextWorkflowStatus(status, "start_reevaluation") !== null);
    }
    expect(WORKFLOW_ACTIONS).toContain("send_notification");
    expect(availabilityFor("en_revue_admin")).toEqual({ canEdit: true, canRequestInfo: true, canPublish: true, canResendEmail: false, canReevaluate: false });
    expect(availabilityFor("informations_complementaires")).toEqual({ canEdit: true, canRequestInfo: false, canPublish: false, canResendEmail: false, canReevaluate: false });
    expect(availabilityFor("validee_publiee")).toEqual({ canEdit: false, canRequestInfo: false, canPublish: false, canResendEmail: true, canReevaluate: true });
    expect(availabilityFor("validee_publiee_notifiee")).toEqual({ canEdit: false, canRequestInfo: false, canPublish: false, canResendEmail: false, canReevaluate: true });
  });

  it("rend les valeurs d'historique lisibles et tronquées", () => {
    expect(describeValue(null)).toBe("—");
    expect(describeValue("")).toBe("—");
    expect(describeValue(15)).toBe("15");
    expect(describeValue(["a", "b"])).toBe('["a","b"]');
    expect(describeValue("x".repeat(300), 20)).toHaveLength(20);
  });
});

describe("filtre « file d'attente de validation » du tableau de bord", () => {
  it("classe chaque statut du workflow dans exactement un choix (hors « toutes »)", () => {
    for (const status of WORKFLOW_STATUSES) {
      const matching = VALIDATION_FILTERS.filter((filter) => filter !== "all" && matchesValidationFilter(filter, status));
      expect(matching, status).toHaveLength(1);
    }
    expect(WORKFLOW_STATUSES.filter((status) => matchesValidationFilter("to_validate", status))).toEqual(["dossier_recu", "attente_validation_admin", "en_revue_admin"]);
    expect(WORKFLOW_STATUSES.filter((status) => matchesValidationFilter("info_requested", status))).toEqual(["informations_complementaires"]);
    expect(WORKFLOW_STATUSES.filter((status) => matchesValidationFilter("published", status))).toEqual(["validee_publiee", "validee_publiee_notifiee"]);
  });

  it("une évaluation sans dossier structuré n'est « à valider » qu'à l'ancienne façon : seulement dans « sans validation structurée »", () => {
    for (const missing of [undefined, null]) {
      expect(matchesValidationFilter("legacy", missing)).toBe(true);
      expect(matchesValidationFilter("all", missing)).toBe(true);
      for (const filter of ["to_validate", "info_requested", "published"] as const) expect(matchesValidationFilter(filter, missing), filter).toBe(false);
    }
    expect(matchesValidationFilter("legacy", "en_revue_admin")).toBe(false);
  });

  it("compte les évaluations par choix, et la somme des choix (hors « toutes ») égale le total", () => {
    const counts = countByValidationFilter(["dossier_recu", "attente_validation_admin", "en_revue_admin", "informations_complementaires", "validee_publiee", "validee_publiee_notifiee", undefined, undefined, null]);
    expect(counts).toEqual({ all: 9, to_validate: 3, info_requested: 1, published: 2, legacy: 3 });
    expect(counts.to_validate + counts.info_requested + counts.published + counts.legacy).toBe(counts.all);
    expect(countByValidationFilter([])).toEqual({ all: 0, to_validate: 0, info_requested: 0, published: 0, legacy: 0 });
  });

  it("a un libellé français pour chaque choix", () => {
    for (const filter of VALIDATION_FILTERS) expect(VALIDATION_FILTER_LABELS[filter].length, filter).toBeGreaterThan(3);
    expect(VALIDATION_FILTER_LABELS.to_validate).toBe("À valider");
  });
});
