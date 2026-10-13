/**
 * Messages lecture seule pour la sync agence → coffre client (case_documents).
 * Aucun rewrite de statut dossier : uniquement la formulation des retours API.
 */

export type AgencyCoffreSyncReason = "ok" | "no_case" | "no_files" | null | undefined;

export type AgencyCoffreSyncSnapshot = {
  publishedToClient?: number | null;
  updated?: number | null;
  caseNumber?: string | null;
  reason?: AgencyCoffreSyncReason;
};

/** Toast / libellé après un scan ou une sync silencieuse. */
export function agencyCoffreSyncUploadMessage(snapshot: AgencyCoffreSyncSnapshot): {
  tone: "success" | "warning" | "info";
  message: string;
} {
  const published = Math.max(0, Number(snapshot.publishedToClient ?? 0));
  const updated = Math.max(0, Number(snapshot.updated ?? 0));
  const reason = snapshot.reason ?? null;
  const caseLabel = snapshot.caseNumber ? ` (${snapshot.caseNumber})` : "";

  if (reason === "no_case") {
    return {
      tone: "warning",
      message:
        "Document enregistré en agence, mais aucun dossier opérationnel lié : le coffre client n’a pas été mis à jour. Utilisez « Publier vers l’espace client » pour créer le lien.",
    };
  }
  if (reason === "no_files") {
    return { tone: "info", message: "Document enregistré en agence. Aucune pièce à synchroniser vers le coffre." };
  }
  if (published > 0) {
    return {
      tone: "success",
      message: `Document scanné et publié dans l’espace client${caseLabel}.`,
    };
  }
  if (updated > 0) {
    return {
      tone: "success",
      message: `Document enregistré ; statut aligné dans le coffre client${caseLabel}.`,
    };
  }
  if (reason === "ok") {
    return {
      tone: "info",
      message: `Document enregistré. Déjà visible dans le coffre client${caseLabel}.`,
    };
  }
  // reason absent + 0 publié : échec silencieux historique — ne plus prétendre « synchronisé ».
  return {
    tone: "warning",
    message:
      "Document enregistré en agence. La synchronisation du coffre client n’a pas confirmé de mise à jour — utilisez « Publier vers l’espace client ».",
  };
}

/** Toast après « Publier vers l’espace client » (ne jamais célébrer un no_case). */
export function agencyCoffrePublishToastTone(reason: AgencyCoffreSyncReason): "success" | "warning" | "info" {
  if (reason === "no_case") return "warning";
  if (reason === "no_files") return "info";
  return "success";
}
