export type PaymentAuditRecord = {
  createdAt?: Date | string | null;
  adminName?: string | null;
  adminEmail?: string | null;
  action?: string | null;
  paymentId?: number | null;
  candidateEmail?: string | null;
  amount?: string | null;
  details?: string | null;
};

const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export function paymentAuditLogsToCsv(logs: PaymentAuditRecord[]): string {
  const headers = ["Date", "Administrateur", "Email admin", "Action", "ID paiement", "Email candidat", "Montant", "Détails"];
  const rows = logs.map((log) => [
    log.createdAt ? new Date(log.createdAt).toLocaleString("fr-FR") : "",
    log.adminName || "",
    log.adminEmail || "",
    log.action || "",
    log.paymentId ?? "",
    log.candidateEmail || "",
    log.amount || "",
    log.details || "",
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}
