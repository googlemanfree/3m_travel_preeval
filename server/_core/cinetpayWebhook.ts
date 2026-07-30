/**
 * Webhook CinetPay — Traitement des notifications de paiement
 * Route: POST /api/payments/cinetpay-notify
 * 
 * Flux:
 * 1. CinetPay envoie notification de paiement
 * 2. Vérifier la signature avec CINETPAY_SECRET_KEY
 * 3. Valider le montant et la devise
 * 4. Mettre à jour le statut du dossier à "DOSSIER_OUVERT_PAYE"
 * 5. Envoyer email de confirmation au candidat
 * 6. Retourner 200 OK à CinetPay
 */

import crypto from "crypto";
import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendDossierConfirmationEmail } from "../emailService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CinetPayWebhookPayload {
  transaction_id: string;
  amount: number;
  currency: string;
  status: "ACCEPTED" | "REFUSED" | "PENDING" | "CANCELLED";
  customer_id: string;
  customer_email: string;
  customer_name: string;
  description: string;
  metadata?: string;
  payment_method?: string;
  date: string;
  signature?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Vérifier la signature CinetPay
 * CinetPay utilise HMAC-SHA256 pour signer les webhooks
 */
function verifyCinetPaySignature(
  payload: Record<string, any>,
  signature: string,
  secretKey: string
): boolean {
  try {
    // Créer une chaîne de signature en triant les clés
    const keys = Object.keys(payload)
      .filter(k => k !== "signature")
      .sort();

    const signatureString = keys
      .map(k => `${k}=${payload[k]}`)
      .join("&");

    // Calculer le HMAC-SHA256
    const calculatedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(signatureString)
      .digest("hex");

    // Comparer les signatures
    return calculatedSignature === signature;
  } catch (err) {
    console.error("[CinetPay Signature Verification] Error:", err);
    return false;
  }
}

/**
 * Traiter la notification de paiement CinetPay
 */
export async function handleCinetPayWebhook(
  payload: CinetPayWebhookPayload
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database not available",
    };
  }

  try {
    console.log("[CinetPay Webhook] Received:", {
      transaction_id: payload.transaction_id,
      status: payload.status,
      amount: payload.amount,
      customer_email: payload.customer_email,
    });

    // 1. Vérifier que le montant est correct (65000 FCFA)
    const EXPECTED_AMOUNT = 65000;
    const EXPECTED_CURRENCY = "XAF";

    if (payload.amount !== EXPECTED_AMOUNT) {
      console.warn(
        `[CinetPay Webhook] Amount mismatch: expected ${EXPECTED_AMOUNT}, got ${payload.amount}`
      );
      return {
        success: false,
        message: `Amount mismatch: expected ${EXPECTED_AMOUNT}, got ${payload.amount}`,
      };
    }

    if (payload.currency !== EXPECTED_CURRENCY) {
      console.warn(
        `[CinetPay Webhook] Currency mismatch: expected ${EXPECTED_CURRENCY}, got ${payload.currency}`
      );
      return {
        success: false,
        message: `Currency mismatch: expected ${EXPECTED_CURRENCY}, got ${payload.currency}`,
      };
    }

    // 2. Traiter selon le statut du paiement
    if (payload.status === "ACCEPTED") {
      // Paiement réussi
      console.log(
        `[CinetPay Webhook] Payment accepted for ${payload.customer_email}`
      );

      // Trouver le dossier par email
      const apps = await db
        .select()
        .from(applications)
        .where(eq(applications.email, payload.customer_email))
        .limit(1);

      if (apps.length === 0) {
        console.warn(
          `[CinetPay Webhook] No application found for ${payload.customer_email}`
        );
        return {
          success: false,
          message: "Application not found",
        };
      }

      const app = apps[0];

      // Mettre à jour le statut du dossier
      await db
        .update(applications)
        .set({
          paymentStatus: "SUCCESS",
          paymentTransactionId: payload.transaction_id,
          paymentDate: new Date(),
          dossierStatus: "paye",
          updatedAt: new Date(),
        })
        .where(eq(applications.id, app.id));

      // Envoyer email de confirmation
      try {
        await sendDossierConfirmationEmail(
          payload.customer_email,
          payload.customer_name,
          app.dossierNumber,
          app.destination,
          payload.amount
        );
      } catch (emailErr) {
        console.error("[CinetPay Webhook] Email error:", emailErr);
        // Ne pas échouer si l'email ne peut pas être envoyé
      }

      console.log(
        `[CinetPay Webhook] Application updated: ${app.dossierNumber}`
      );

      return {
        success: true,
        message: "Payment confirmed and application updated",
      };
    } else if (payload.status === "REFUSED") {
      // Paiement refusé
      console.log(
        `[CinetPay Webhook] Payment refused for ${payload.customer_email}`
      );

      const apps = await db
        .select()
        .from(applications)
        .where(eq(applications.email, payload.customer_email))
        .limit(1);

      if (apps.length > 0) {
        const app = apps[0];

        // Mettre à jour le statut
        await db
          .update(applications)
          .set({
            paymentStatus: "FAILED",
            paymentTransactionId: payload.transaction_id,
            updatedAt: new Date(),
          })
          .where(eq(applications.id, app.id));

        console.log(
          `[CinetPay Webhook] Application marked as failed: ${app.dossierNumber}`
        );
      }

      return {
        success: true,
        message: "Payment refused - application updated",
      };
    } else if (payload.status === "PENDING") {
      // Paiement en attente
      console.log(
        `[CinetPay Webhook] Payment pending for ${payload.customer_email}`
      );

      return {
        success: true,
        message: "Payment pending - waiting for confirmation",
      };
    } else if (payload.status === "CANCELLED") {
      // Paiement annulé
      console.log(
        `[CinetPay Webhook] Payment cancelled for ${payload.customer_email}`
      );

      const apps = await db
        .select()
        .from(applications)
        .where(eq(applications.email, payload.customer_email))
        .limit(1);

      if (apps.length > 0) {
        const app = apps[0];

        // Mettre à jour le statut
        await db
          .update(applications)
          .set({
            paymentStatus: "CANCELLED",
            paymentTransactionId: payload.transaction_id,
            updatedAt: new Date(),
          })
          .where(eq(applications.id, app.id));

        console.log(
          `[CinetPay Webhook] Application marked as cancelled: ${app.dossierNumber}`
        );
      }

      return {
        success: true,
        message: "Payment cancelled - application updated",
      };
    }

    return {
      success: false,
      message: `Unknown payment status: ${payload.status}`,
    };
  } catch (err) {
    console.error("[CinetPay Webhook] Error:", err);
    return {
      success: false,
      message: "Internal server error",
    };
  }
}

/**
 * Middleware Express pour traiter le webhook CinetPay
 * Usage: app.post("/api/payments/cinetpay-notify", cinetPayWebhookHandler);
 */
export async function cinetPayWebhookHandler(
  req: any,
  res: any
): Promise<void> {
  try {
    const payload = req.body;
    const signature = payload.signature;

    // Vérifier que la signature est présente
    if (!signature) {
      console.warn("[CinetPay Webhook] Missing signature");
      res.status(400).json({ error: "Missing signature" });
      return;
    }

    // Vérifier la signature
    const secretKey = process.env.CINETPAY_SECRET_KEY;
    if (!secretKey) {
      console.error("[CinetPay Webhook] CINETPAY_SECRET_KEY not configured");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const isValid = verifyCinetPaySignature(payload, signature, secretKey);
    if (!isValid) {
      console.warn("[CinetPay Webhook] Invalid signature");
      res.status(403).json({ error: "Invalid signature" });
      return;
    }

    // Traiter le webhook
    const result = await handleCinetPayWebhook(payload);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (err) {
    console.error("[CinetPay Webhook] Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
