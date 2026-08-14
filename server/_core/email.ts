import { getDb } from "../db";
import { emailDeliveryLogs } from "../../drizzle/schema";
import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || process.env.RESEND_FROM_EMAIL || "hello@3mtravelagency.com";

console.log("[Email Config (SMTP-Only)] Host:", smtpHost || "missing", "User:", smtpUser || "missing");

const transporter = smtpHost && smtpUser && smtpPass ? nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
}) : null;

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!transporter) {
    const err = new Error("SMTP transporter is not initialized. Please configure SMTP secrets.");
    console.error("[Email Error]", err.message);
    try {
      const db = await getDb();
      if (db) {
        await db.insert(emailDeliveryLogs).values({
          recipientEmail: options.to,
          subject: options.subject,
          status: "failed",
          errorDetails: err.message,
        });
      }
    } catch {}
    throw err;
  }

  try {
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    console.log(`[Email] Sent successfully via SMTP to ${options.to}`, info.messageId);
    try {
      const db = await getDb();
      if (db) {
        await db.insert(emailDeliveryLogs).values({
          recipientEmail: options.to,
          subject: options.subject,
          status: "sent",
          providerMessageId: info.messageId || null,
        });
      }
    } catch (logErr) {
      console.error("Failed to log email success:", logErr);
    }
  } catch (smtpError: any) {
    const errorMsg = smtpError?.message || String(smtpError);
    console.error("[Email] SMTP send FAILED:", errorMsg);
    try {
      const db = await getDb();
      if (db) {
        await db.insert(emailDeliveryLogs).values({
          recipientEmail: options.to,
          subject: options.subject,
          status: "failed",
          errorDetails: errorMsg,
        });
      }
    } catch {}
    throw new Error(`SMTP error: ${errorMsg}`);
  }
}
