import { Resend } from "resend";
import { getDb } from "../db";
import { emailDeliveryLogs } from "../../drizzle/schema";

const resendApiKey = process.env.RESEND_API_KEY;

export function normalizeResendSender(value: string | undefined): string {
  const normalized = value?.trim().replace(/^mailto:/i, "").toLowerCase();
  return normalized === "hello@3mtravelagency.com" ? normalized : "hello@3mtravelagency.com";
}

const resendFromEmail = normalizeResendSender(process.env.RESEND_FROM_EMAIL);

if (!resendApiKey) {
  console.warn("[Email] RESEND_API_KEY not configured. Email sending will fail.");
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Envoyer un email via Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!resend) {
    throw new Error("Email service not configured. Please set RESEND_API_KEY.");
  }

  try {
    const result = await resend.emails.send({
      from: resendFromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    console.log(`[Email] Sent successfully to ${options.to}`, result.data?.id);
    try {
      const db = await getDb();
      if (db) {
        await db.insert(emailDeliveryLogs).values({
          recipientEmail: options.to,
          subject: options.subject,
          status: "sent",
          providerMessageId: result.data?.id || null,
        });
      }
    } catch (logErr) {
      console.error("Failed to log email success:", logErr);
    }
  } catch (error: any) {
    console.error("[Email] Send failed:", error);
    try {
      const db = await getDb();
      if (db) {
        await db.insert(emailDeliveryLogs).values({
          recipientEmail: options.to,
          subject: options.subject,
          status: "failed",
          errorDetails: error?.message || String(error),
        });
      }
    } catch (logErr) {
      console.error("Failed to log email exception:", logErr);
    }
    throw error;
  }
}
