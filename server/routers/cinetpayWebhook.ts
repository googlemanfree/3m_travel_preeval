/**
 * Webhook CinetPay — Notification de paiement
 *
 * CinetPay appelle POST /api/cinetpay/webhook avec les données de transaction.
 * Ce handler vérifie le statut via l'API CinetPay et met à jour la base de données.
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendPaymentConfirmationEmail } from "../emailService";

interface CinetPayWebhookBody {
  cpm_trans_id?: string;
  cpm_site_id?: string;
  cpm_trans_status?: string;
  cpm_amount?: string;
  cpm_currency?: string;
  cpm_payid?: string;
  cpm_payment_date?: string;
  cpm_payment_time?: string;
  cpm_error_message?: string;
  cpm_phone_prefixe?: string;
  cel_phone_num?: string;
  cpm_ipn_ack?: string;
  created_at?: string;
  updated_at?: string;
  cpm_result?: string;
  cpm_trans_date?: string;
  cpm_custom?: string;
  cpm_page_action?: string;
  cpm_version?: string;
  cpm_payment_config?: string;
  cpm_language?: string;
  cpm_designation?: string;
  cpm_buyer_id?: string;
  signature?: string;
}

/** Vérifier le statut d'une transaction via l'API CinetPay */
async function verifyCinetPayTransaction(transactionId: string, siteId: string, apiKey: string): Promise<{
  status: "ACCEPTED" | "REFUSED" | "PENDING" | "UNKNOWN";
  paymentMethod: string;
}> {
  try {
    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: transactionId,
      }),
    });

    const data = await response.json() as {
      code: string;
      message: string;
      data?: {
        status: string;
        payment_method?: string;
      };
    };

    if (data.code === "00" && data.data?.status === "ACCEPTED") {
      return {
        status: "ACCEPTED",
        paymentMethod: data.data.payment_method ?? "UNKNOWN",
      };
    } else if (data.data?.status === "REFUSED") {
      return { status: "REFUSED", paymentMethod: "" };
    }
    return { status: "PENDING", paymentMethod: "" };
  } catch {
    return { status: "UNKNOWN", paymentMethod: "" };
  }
}

export function registerCinetPayWebhook(app: Express): void {
  app.post("/api/cinetpay/webhook", async (req: Request, res: Response) => {
    const body = req.body as CinetPayWebhookBody;
    const transactionId = body.cpm_trans_id;

    if (!transactionId) {
      res.status(400).json({ error: "Missing transaction_id" });
      return;
    }

    const siteId = process.env.CINETPAY_SITE_ID ?? "";
    const apiKey = process.env.CINETPAY_API_KEY ?? "";

    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "DB unavailable" });
        return;
      }

      // Trouver le dossier correspondant
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.paymentTransactionId, transactionId))
        .limit(1);

      if (!application) {
        console.warn(`[CinetPay Webhook] Transaction ${transactionId} not found in DB`);
        res.status(200).json({ message: "Transaction not found, ignored" });
        return;
      }

      // Vérifier le statut via l'API CinetPay (double vérification sécurisée)
      let paymentStatus: "SUCCESS" | "FAILED" | "PENDING" = "PENDING";
      let paymentMethod = "";

      if (siteId && apiKey) {
        const verification = await verifyCinetPayTransaction(transactionId, siteId, apiKey);
        if (verification.status === "ACCEPTED") {
          paymentStatus = "SUCCESS";
          paymentMethod = verification.paymentMethod;
        } else if (verification.status === "REFUSED") {
          paymentStatus = "FAILED";
        }
      } else {
        // Fallback : utiliser le statut du webhook directement
        const webhookStatus = body.cpm_trans_status ?? "";
        if (webhookStatus === "ACCEPTED") {
          paymentStatus = "SUCCESS";
          paymentMethod = body.cpm_payment_config ?? "";
        } else if (webhookStatus === "REFUSED") {
          paymentStatus = "FAILED";
        }
      }

      // Mettre à jour le dossier en base
      await db.update(applications)
        .set({
          paymentStatus,
          dossierStatus: paymentStatus === "SUCCESS" ? "paye" : application.dossierStatus,
          paymentMethod: paymentMethod || null,
          paymentDate: paymentStatus === "SUCCESS" ? new Date() : null,
        })
        .where(eq(applications.id, application.id));

      // Envoyer l'email de confirmation si paiement réussi
      if (paymentStatus === "SUCCESS") {
        try {
          await sendPaymentConfirmationEmail(
            application.email,
            application.fullName,
            application.dossierNumber,
            application.paymentAmount ?? 65000,
            application.paymentCurrency ?? "XAF"
          );
        } catch (emailErr) {
          console.warn("[CinetPay Webhook] Email send failed:", emailErr);
        }
      }

      console.log(`[CinetPay Webhook] Transaction ${transactionId} → ${paymentStatus}`);
      res.status(200).json({ message: "OK" });
    } catch (err) {
      console.error("[CinetPay Webhook] Error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });
}
