export type EmailDeliverySummary = {
  total: number;
  sent: number;
  failed: number;
  pending: number;
};

export function summarizeEmailDeliveryLogs(logs: Array<{ status: string }>): EmailDeliverySummary {
  return {
    total: logs.length,
    sent: logs.filter((log) => log.status === "sent").length,
    failed: logs.filter((log) => log.status === "failed").length,
    pending: logs.filter((log) => log.status === "pending").length,
  };
}
