/**
 * Route Express pour le webhook CinetPay
 * À intégrer dans server/_core/index.ts
 */

import { Router } from "express";
import { cinetPayWebhookHandler } from "./cinetpayWebhook";

const router = Router();

/**
 * POST /api/payments/cinetpay-notify
 * Webhook CinetPay pour les notifications de paiement
 */
router.post("/payments/cinetpay-notify", cinetPayWebhookHandler);

export default router;
