export type EmailDeliverySummary = {
  total: number;
  sent: number;
  failed: number;
  pending: number;
};

export type EmailErrorType = "invalid_recipient" | "domain_unverified" | "rate_limit" | "configuration";

export const emailErrorPatterns: Record<EmailErrorType, string[]> = {
  invalid_recipient: ["Invalid `to`", "invalid email", "recipient"],
  domain_unverified: ["domain", "verify", "verified"],
  rate_limit: ["rate limit", "too many"],
  configuration: ["api key", "unauthorized", "authentication"],
};

export function summarizeEmailDeliveryLogs(logs: Array<{ status: string }>): EmailDeliverySummary {
  return {
    total: logs.length,
    sent: logs.filter((log) => log.status === "sent").length,
    failed: logs.filter((log) => log.status === "failed").length,
    pending: logs.filter((log) => log.status === "pending").length,
  };
}
