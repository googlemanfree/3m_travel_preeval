import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { applyDeliveryEvent } from "./pipeline";
import { getProductionDeps } from "./runtime";

/**
 * Réception des événements de livraison du fournisseur d'e-mail (délivré, rebond, échec). La signature HMAC-SHA256 du corps brut est
 * vérifiée AVANT tout traitement ; un événement dupliqué ou déjà appliqué est ignoré. Sans événement signé, le suivi reste
 * « acceptée par le serveur d'envoi » : « délivrée » n'est jamais déduit d'un simple envoi.
 * Prérequis côté fournisseur : renvoyer l'identifiant du message (le SMTP actuel n'en expose pas) et signer ses appels.
 */
export const WebhookEventSchema = z.object({ eventId: z.string().min(3).max(120), messageId: z.string().min(3).max(191), type: z.enum(["delivered", "bounced", "failed"]) }).strict();

export function signBody(secret: string, rawBody: Buffer | string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifySignature(secret: string, rawBody: Buffer, header: string | undefined | null): boolean {
  if (!secret || secret.length < 16 || !header) return false;
  const provided = header.trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(provided)) return false;
  const expected = signBody(secret, rawBody);
  return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
}

export type WebhookOutcome = { status: 200 | 400 | 401 | 503; body: { ok: boolean; applied?: boolean; error?: string } };

export async function processEmailWebhook(input: { rawBody: Buffer; signature: string | undefined; secret: string | undefined; apply: (event: { providerMessageId: string; type: "delivered" | "bounced" | "failed"; eventId: string }) => Promise<boolean> }): Promise<WebhookOutcome> {
  if (!input.secret) return { status: 503, body: { ok: false, error: "Webhook non configuré" } };
  if (!verifySignature(input.secret, input.rawBody, input.signature)) return { status: 401, body: { ok: false, error: "Signature invalide" } };
  let parsed: z.infer<typeof WebhookEventSchema>;
  try { parsed = WebhookEventSchema.parse(JSON.parse(input.rawBody.toString("utf8"))); } catch { return { status: 400, body: { ok: false, error: "Événement invalide" } }; }
  const applied = await input.apply({ providerMessageId: parsed.messageId, type: parsed.type, eventId: parsed.eventId });
  return { status: 200, body: { ok: true, applied } };
}

const seen = new Set<string>();

/** Route Express : à déclarer AVANT express.json() (le corps brut est nécessaire à la signature). */
export async function handleBilanEmailWebhook(req: Request, res: Response): Promise<void> {
  try {
    const deps = await getProductionDeps();
    const outcome = deps
      ? await processEmailWebhook({ rawBody: Buffer.isBuffer(req.body) ? req.body : Buffer.from(""), signature: req.header("x-signature") ?? req.header("x-webhook-signature") ?? undefined, secret: process.env.BILAN_AUTO_WEBHOOK_SECRET, apply: (event) => applyDeliveryEvent(deps, event, seen) })
      : ({ status: 503, body: { ok: false, error: "Bilan automatisé inactif" } } as WebhookOutcome);
    res.status(outcome.status).json(outcome.body);
  } catch {
    res.status(500).json({ ok: false, error: "Erreur de traitement" });
  }
}
