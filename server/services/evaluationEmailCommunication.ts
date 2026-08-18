import { createHmac, timingSafeEqual } from "crypto";

const CANONICAL_SITE_ORIGIN = "https://www.3mtravelagency.com";

export function escapeHtmlText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function trackingSecret(): string {
  return process.env.JWT_SECRET || "3mtravel-evaluation-open-tracking";
}

export function createEvaluationEmailTrackingToken(emailId: number): string {
  const id = String(emailId);
  const signature = createHmac("sha256", trackingSecret()).update(id).digest("hex");
  return `${id}.${signature}`;
}

export function verifyEvaluationEmailTrackingToken(token: string): number | null {
  const [rawId, suppliedSignature] = token.split(".");
  if (!rawId || !suppliedSignature || !/^\d+$/.test(rawId) || !/^[a-f0-9]{64}$/i.test(suppliedSignature)) return null;
  const expectedSignature = createHmac("sha256", trackingSecret()).update(rawId).digest("hex");
  const supplied = Buffer.from(suppliedSignature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  const emailId = Number(rawId);
  return Number.isSafeInteger(emailId) && emailId > 0 ? emailId : null;
}

export function buildAdvisorSignatureHtml(advisorName?: string | null): string {
  const name = (advisorName || "L’équipe 3M Travel & Services").trim();
  return `<p style="margin-top:26px;line-height:1.55">Bien cordialement,<br/><strong>${escapeHtmlText(name)}</strong><br/>3M Travel &amp; Services</p>`;
}

export function appendEvaluationOpenTrackingPixel(html: string, emailId: number): string {
  const token = createEvaluationEmailTrackingToken(emailId);
  const pixelUrl = `${CANONICAL_SITE_ORIGIN}/api/evaluation-email/open/${encodeURIComponent(token)}.gif`;
  return `${html}<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;border:0;opacity:0" />`;
}
