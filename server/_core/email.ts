import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

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
      from: "onboarding@resend.dev",
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    console.log(`[Email] Sent successfully to ${options.to}`, result.data?.id);
  } catch (error) {
    console.error("[Email] Send failed:", error);
    throw error;
  }
}
