import { MANUAL_METHOD_LABELS, OPERATOR_LABELS, configuredMobileMoney, formatAmount, isBankConfigured, paymentFallbackMessage, type AgencyFacts, type ManualMethodId, type PaymentInstructions } from "../../shared/paymentMethods";

/** E-mails du règlement manuel (virement, dépôt Mobile Money, agence) : aucune coordonnée n'est écrite ici, tout vient des réglages. */

const escapeHtml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const oneLine = (value: string, max = 200): string => value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

export type ManualPaymentEmailInput = {
  reference: string;
  fullName: string;
  amount: number | null;
  currency: string;
  method: ManualMethodId;
  trigger: "chosen" | "online_failed";
  instructions: PaymentInstructions;
  agency: AgencyFacts;
};

const row = (label: string, value: string) => `<tr><td style="padding:5px 10px;color:#64748b;font-size:12px;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:5px 10px;font-weight:bold;color:#0f172a;font-size:14px">${escapeHtml(value)}</td></tr>`;
const table = (rows: string[]) => `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:0 0 14px">${rows.join("")}</table>`;

function methodDetailsHtml(input: ManualPaymentEmailInput): string {
  const { instructions, agency, method } = input;
  const missing = `<p style="margin:0 0 14px;padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:13px">Les coordonnées de ce mode de paiement vous sont communiquées par l’agence : écrivez-nous sur WhatsApp au ${escapeHtml(agency.whatsappDisplay)} en indiquant votre référence. Ne payez sur aucun autre compte ou numéro.</p>`;
  if (method === "bank_transfer") {
    if (!isBankConfigured(instructions)) return missing;
    const bank = instructions.bankTransfer;
    return table([
      row("Banque", bank.bankName),
      row("Titulaire du compte", bank.accountHolder),
      ...(bank.iban ? [row("IBAN", bank.iban)] : []),
      ...(bank.bic ? [row("BIC / SWIFT", bank.bic)] : []),
      ...(bank.accountNumber ? [row("Numéro de compte", bank.accountNumber)] : []),
      ...(bank.note ? [row("À savoir", bank.note)] : []),
    ]);
  }
  if (method === "mobile_money_deposit") {
    const accounts = configuredMobileMoney(instructions);
    if (accounts.length === 0) return missing;
    return table(accounts.flatMap((account) => [row(OPERATOR_LABELS[account.operator], account.number), row("Nom du titulaire (à vérifier avant l’envoi)", account.accountName)]));
  }
  const agencyRows = [row("Adresse", instructions.agency.address || agency.address), row("Horaires", instructions.agency.hours || agency.hours), ...(instructions.agency.note ? [row("À savoir", instructions.agency.note)] : [])];
  return table(agencyRows);
}

export function buildManualPaymentClientEmail(input: ManualPaymentEmailInput): { subject: string; html: string } {
  const reference = oneLine(input.reference, 60);
  const amount = formatAmount(input.amount, input.currency);
  const whatsappHref = `https://wa.me/${input.agency.whatsappNumber}?text=${encodeURIComponent(paymentFallbackMessage({ reference, amount: input.amount, currency: input.currency, method: input.method, name: oneLine(input.fullName, 120) || null }))}`;
  const intro = input.trigger === "online_failed"
    ? "Votre paiement en ligne n’a pas abouti. Aucun règlement n’est enregistré tant que l’agence n’a pas confirmé sa réception. Si votre compte a été débité, écrivez-nous avec votre référence : nous vérifions avec vous."
    : `Vous avez choisi de régler par ${MANUAL_METHOD_LABELS[input.method].toLowerCase()}. Voici comment procéder.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:22px;color:#172554">
<h2 style="margin:0 0 10px;color:#1d4ed8">Régler votre dossier ${escapeHtml(reference)}</h2>
<p style="margin:0 0 14px">Bonjour${input.fullName ? ` ${escapeHtml(oneLine(input.fullName, 120))}` : ""},</p>
<p style="margin:0 0 14px">${escapeHtml(intro)}</p>
${table([row("Référence à indiquer", reference), row("Montant", amount), row("Mode de règlement", MANUAL_METHOD_LABELS[input.method])])}
${methodDetailsHtml(input)}
<h3 style="margin:16px 0 6px;font-size:14px">Pour finaliser</h3>
<ol style="margin:0 0 14px;padding-left:20px;line-height:1.7;font-size:13px">
<li>Effectuez le règlement du montant exact, en indiquant la référence <strong>${escapeHtml(reference)}</strong> dans le motif ou le message.</li>
<li>Envoyez la preuve (capture d’écran ou reçu) sur WhatsApp au ${escapeHtml(input.agency.whatsappDisplay)}, avec la référence.</li>
<li>L’agence confirme la réception, puis la suite de votre démarche est activée. Rien n’est activé avant cette confirmation.</li>
</ol>
<p style="margin:0 0 16px;font-size:12px;color:#475569">Sécurité : ne réglez que sur les coordonnées indiquées par 3M Travel &amp; Services (ce message et le site officiel), et vérifiez le nom du titulaire avant tout envoi. En cas de doute, appelez-nous.</p>
<p style="margin:0 0 6px"><a href="${whatsappHref}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Contacter l’agence sur WhatsApp</a></p>
<p style="margin:14px 0 0;font-size:12px;color:#94a3b8">3M Travel &amp; Services · ${escapeHtml(input.agency.address)} · ${escapeHtml(input.agency.whatsappDisplay)}${input.agency.phoneDisplay ? ` · ${escapeHtml(input.agency.phoneDisplay)}` : ""} · hello@3mtravelagency.com</p>
</div>`;
  return { subject: oneLine(`Régler votre dossier ${reference} — 3M Travel & Services`), html };
}

export function buildManualPaymentAgencyEmail(input: { reference: string; kind: "dossier" | "flight"; fullName: string; email: string; amount: number | null; currency: string; method: ManualMethodId; trigger: "chosen" | "online_failed"; adminUrl: string }): { subject: string; html: string } {
  const reference = oneLine(input.reference, 60);
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:22px;color:#172554">
<h2 style="margin:0 0 10px;color:#b45309">Paiement manuel à suivre</h2>
<p style="margin:0 0 14px;font-size:13px">${input.trigger === "online_failed" ? "Un paiement en ligne n’a pas abouti : le client règle par un autre moyen." : "Le client a choisi un règlement manuel."} Rien n’est validé tant que la réception n’est pas confirmée dans l’administration.</p>
${table([row("Référence", reference), row("Type", input.kind === "flight" ? "Réservation de vol" : "Dossier"), row("Client", `${oneLine(input.fullName, 120)} · ${oneLine(input.email, 200)}`), row("Montant attendu", formatAmount(input.amount, input.currency)), row("Mode", MANUAL_METHOD_LABELS[input.method])])}
<ol style="margin:0 0 14px;padding-left:20px;line-height:1.7;font-size:13px">
<li>Surveiller la réception (relevé bancaire, Mobile Money ou comptoir) et le message WhatsApp du client avec sa preuve.</li>
<li>Vérifier le montant exact et la référence, puis valider le paiement dans l’administration.</li>
<li>${input.kind === "flight" ? "Ne demander l’émission du billet qu’après cette validation." : "La suite du dossier ne s’active qu’après cette validation."}</li>
</ol>
<p style="margin:0"><a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Ouvrir l’administration</a></p>
</div>`;
  return { subject: oneLine(`[3M Travel] Paiement manuel à suivre — ${reference} — ${MANUAL_METHOD_LABELS[input.method]}`), html };
}

/** Alerte envoyée à l'agence à chaque modification des coordonnées de paiement affichées au public (détection de fraude interne ou de session volée). */
export function buildPaymentSettingsChangedEmail(input: { adminEmail: string; changedSections: string[]; at: Date }): { subject: string; html: string } {
  const sections = input.changedSections.length > 0 ? input.changedSections : ["aucune section (enregistrement identique)"];
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:22px;color:#172554">
<h2 style="margin:0 0 10px;color:#b91c1c">Coordonnées de paiement modifiées</h2>
<p style="margin:0 0 12px;font-size:14px">Les coordonnées de paiement affichées sur le site ont été modifiées par <strong>${escapeHtml(oneLine(input.adminEmail, 200))}</strong> le ${escapeHtml(input.at.toISOString())}.</p>
<p style="margin:0 0 12px;font-size:14px">Sections modifiées : ${escapeHtml(sections.join(", "))}.</p>
<p style="margin:0;font-size:13px;color:#475569">Si vous n’êtes pas à l’origine de ce changement, connectez-vous immédiatement à l’administration, rétablissez les coordonnées exactes et changez les mots de passe : des clients pourraient être invités à payer sur un compte frauduleux.</p>
</div>`;
  return { subject: "[3M Travel] ALERTE — coordonnées de paiement modifiées", html };
}
