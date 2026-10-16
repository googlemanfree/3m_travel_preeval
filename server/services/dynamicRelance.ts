/**
 * Relances dynamiques admin → candidat :
 * modèles par étape / visa, option IA pour polir le message,
 * dépôt espace client + e-mail brandé 3M.
 */

import {
  fillAdminTemplate,
  templateForStage,
  type AdminRelanceStage,
} from "../../shared/adminOpsToolkit";
import { invokeLLM } from "../_core/llm";

export type DynamicRelanceContext = {
  stage: AdminRelanceStage | string;
  name: string;
  reference: string;
  email: string;
  phone?: string | null;
  visaType?: string | null;
  projectType?: string | null;
  destination?: string | null;
  useAi?: boolean;
};

export type ComposedRelance = {
  stage: string;
  label: string;
  subject: string;
  body: string;
  /** Corps formaté pour l’espace client (entête professionnelle). */
  clientSpaceContent: string;
  aiEnhanced: boolean;
};

function buildClientSpaceContent(input: {
  label: string;
  reference: string;
  destination?: string | null;
  visaType?: string | null;
  body: string;
}): string {
  const meta = [
    input.reference ? `Référence : ${input.reference}` : null,
    input.destination ? `Destination : ${input.destination}` : null,
    input.visaType ? `Procédure : ${input.visaType}` : null,
  ].filter(Boolean).join(" · ");
  return [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "3M TRAVEL AGENCY",
    `Relance — ${input.label}`,
    meta || null,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    input.body.trim(),
  ].filter((line) => line !== null).join("\n");
}

async function polishRelanceWithAi(input: {
  subject: string;
  body: string;
  name: string;
  reference: string;
  stage: string;
  visaType?: string | null;
  destination?: string | null;
}): Promise<{ subject: string; body: string } | null> {
  try {
    const result = await invokeLLM({
      maxTokens: 700,
      messages: [
        {
          role: "system",
          content:
            "Tu es rédacteur pour 3M TRAVEL AGENCY (mobilité internationale, Yaoundé). "
            + "Tu reformules une relance admin → candidat en français professionnel, clair et respectueux. "
            + "Conserve les faits (référence, destination, visa, action demandée). "
            + "N’invente aucun engagement (visa, emploi, délai). "
            + "Garde Bonjour + Cordialement / équipe 3M Travel Agency. "
            + "Réponds uniquement en JSON {\"subject\":\"...\",\"body\":\"...\"}.",
        },
        {
          role: "user",
          content: JSON.stringify({
            stage: input.stage,
            name: input.name,
            reference: input.reference,
            destination: input.destination || null,
            visaType: input.visaType || null,
            draftSubject: input.subject,
            draftBody: input.body,
          }),
        },
      ],
      outputSchema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["subject", "body"],
        additionalProperties: false,
      },
    });
    const raw = result.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : Array.isArray(raw)
      ? raw.map((part) => (typeof part === "object" && part && "text" in part ? String((part as { text?: string }).text || "") : "")).join("")
      : "";
    const parsed = JSON.parse(text) as { subject?: string; body?: string };
    const subject = String(parsed.subject || "").trim();
    const body = String(parsed.body || "").trim();
    if (subject.length < 5 || body.length < 40) return null;
    return { subject: subject.slice(0, 255), body: body.slice(0, 12_000) };
  } catch (error) {
    console.warn("[dynamicRelance] polish IA indisponible — modèle statique conservé", error);
    return null;
  }
}

/** Compose un message de relance adapté à l’étape (et optionnellement poli par IA). */
export async function composeDynamicRelance(input: DynamicRelanceContext): Promise<ComposedRelance> {
  const template = templateForStage(input.stage, input.projectType ?? input.visaType);
  const filled = fillAdminTemplate(template, {
    name: input.name,
    reference: input.reference,
    destination: input.destination,
    visaType: input.visaType || input.projectType,
  });
  let subject = filled.subject;
  let body = filled.body;
  let aiEnhanced = false;
  if (input.useAi !== false) {
    const polished = await polishRelanceWithAi({
      subject,
      body,
      name: input.name,
      reference: input.reference,
      stage: String(input.stage),
      visaType: input.visaType || input.projectType,
      destination: input.destination,
    });
    if (polished) {
      subject = polished.subject;
      body = polished.body;
      aiEnhanced = true;
    }
  }
  return {
    stage: String(input.stage),
    label: template.label,
    subject,
    body,
    clientSpaceContent: buildClientSpaceContent({
      label: template.label,
      reference: input.reference,
      destination: input.destination,
      visaType: input.visaType || input.projectType,
      body,
    }),
    aiEnhanced,
  };
}

export function buildWhatsAppUrlFromBody(phone: string | null | undefined, body: string): string | null {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  const e164 = digits.startsWith("237") || digits.length > 9 ? digits : `237${digits}`;
  return `https://wa.me/${e164}?text=${encodeURIComponent(body)}`;
}
