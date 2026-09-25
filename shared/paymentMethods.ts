/**
 * Moyens de paiement de 3M Travel & Services.
 *
 * Règle centrale : AUCUNE coordonnée bancaire ni numéro Mobile Money n'est écrit dans le code. Ils sont saisis par
 * l'administrateur (réglages de l'agence) et affichés sur le site dès qu'ils sont renseignés ; tant qu'ils ne le sont
 * pas, le site dit que l'agence les communique sur demande. Les moyens en ligne (carte, Mobile Money via CinetPay)
 * ne sont proposés comme disponibles que lorsque la passerelle est réellement configurée. Si un paiement échoue ou n'est
 * pas disponible, le client n'est jamais bloqué : il règle par virement, dépôt Mobile Money ou en agence, après avoir
 * contacté l'agence ; rien n'est validé tant que l'agence n'a pas confirmé la réception.
 */

export type ManualMethodId = "bank_transfer" | "mobile_money_deposit" | "cash_agency";
export type OnlineMethodId = "card" | "mobile_money_online";
export type PaymentMethodId = OnlineMethodId | ManualMethodId;

export const MANUAL_METHOD_IDS: readonly ManualMethodId[] = ["bank_transfer", "mobile_money_deposit", "cash_agency"];

/** Valeur enregistrée dans `paymentMethod` du dossier (varchar 50) pour un règlement manuel. */
export const MANUAL_METHOD_CODES: Record<ManualMethodId, string> = { bank_transfer: "VIREMENT_BANCAIRE", mobile_money_deposit: "DEPOT_MOBILE_MONEY", cash_agency: "ESPECES_AGENCE" };

export const MANUAL_METHOD_LABELS: Record<ManualMethodId, string> = {
  bank_transfer: "Virement bancaire",
  mobile_money_deposit: "Dépôt Mobile Money sur le numéro de l’agence",
  cash_agency: "Paiement en agence (espèces ou dépôt)",
};

export type MobileMoneyOperator = "mtn" | "orange" | "autre";
export const OPERATOR_LABELS: Record<MobileMoneyOperator, string> = { mtn: "MTN Mobile Money", orange: "Orange Money", autre: "Autre opérateur" };

export type MobileMoneyAccount = { operator: MobileMoneyOperator; number: string; accountName: string };

export type PaymentInstructions = {
  bankTransfer: { bankName: string; accountHolder: string; iban: string; bic: string; accountNumber: string; note: string };
  mobileMoney: MobileMoneyAccount[];
  agency: { address: string; hours: string; note: string };
  generalNote: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export const EMPTY_PAYMENT_INSTRUCTIONS: PaymentInstructions = {
  bankTransfer: { bankName: "", accountHolder: "", iban: "", bic: "", accountNumber: "", note: "" },
  mobileMoney: [],
  agency: { address: "", hours: "", note: "" },
  generalNote: "",
  updatedAt: null,
  updatedBy: null,
};

const MAX_MOBILE_MONEY_ACCOUNTS = 4;

// Caractères de contrôle et invisibles retirés par leur code (aucun caractère invisible n'est écrit dans le source).
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  let out = "";
  for (const char of value) {
    const code = char.charCodeAt(0);
    const invisible = code < 32 || (code >= 127 && code <= 159) || code === 173 || (code >= 8203 && code <= 8207) || (code >= 8232 && code <= 8238) || code === 65279;
    if (!invisible || char === "\n") out += char;
  }
  return out.replace(/[ \t]+/g, " ").trim().slice(0, max);
}
const oneLine = (value: unknown, max: number): string => clean(value, max).replace(/\s*\n\s*/g, " ");

export type PaymentInstructionsIssue = { field: string; message: string };

/**
 * Assainit une saisie d'administrateur et signale les champs manifestement invalides (IBAN, numéros). Ne renvoie jamais
 * de valeur fabriquée : un champ invalide est refusé, pas corrigé.
 */
export function sanitizePaymentInstructions(input: unknown): { value: PaymentInstructions; issues: PaymentInstructionsIssue[] } {
  const source = (input && typeof input === "object" ? input : {}) as Record<string, any>;
  const bank = (source.bankTransfer && typeof source.bankTransfer === "object" ? source.bankTransfer : {}) as Record<string, unknown>;
  const agency = (source.agency && typeof source.agency === "object" ? source.agency : {}) as Record<string, unknown>;
  const issues: PaymentInstructionsIssue[] = [];

  const iban = oneLine(bank.iban, 40).toUpperCase();
  if (iban && !/^[A-Z]{2}[0-9]{2}[A-Z0-9 ]{8,30}$/.test(iban)) issues.push({ field: "bankTransfer.iban", message: "IBAN invalide : deux lettres, deux chiffres puis 8 à 30 caractères." });
  const bic = oneLine(bank.bic, 15).toUpperCase();
  if (bic && !/^[A-Z0-9]{8,11}$/.test(bic)) issues.push({ field: "bankTransfer.bic", message: "BIC/SWIFT invalide : 8 à 11 caractères alphanumériques." });
  const accountNumber = oneLine(bank.accountNumber, 40);
  if (accountNumber && !/^[A-Za-z0-9 .\-/]{4,40}$/.test(accountNumber)) issues.push({ field: "bankTransfer.accountNumber", message: "Numéro de compte invalide." });

  const rawAccounts = Array.isArray(source.mobileMoney) ? source.mobileMoney.slice(0, MAX_MOBILE_MONEY_ACCOUNTS) : [];
  const mobileMoney: MobileMoneyAccount[] = [];
  rawAccounts.forEach((raw: Record<string, unknown>, index: number) => {
    const number = oneLine(raw?.number, 30);
    const accountName = oneLine(raw?.accountName, 120);
    if (!number && !accountName) return;
    const digits = number.replace(/\D/g, "");
    if (!/^[0-9+ ()\-.]{6,30}$/.test(number) || digits.length < 8 || digits.length > 15) issues.push({ field: `mobileMoney.${index}.number`, message: "Numéro Mobile Money invalide (8 à 15 chiffres)." });
    if (!accountName) issues.push({ field: `mobileMoney.${index}.accountName`, message: "Indiquez le nom du titulaire du compte : le client doit pouvoir le vérifier avant d’envoyer de l’argent." });
    const operator: MobileMoneyOperator = raw?.operator === "mtn" || raw?.operator === "orange" ? raw.operator : "autre";
    mobileMoney.push({ operator, number, accountName });
  });

  const bankTransfer = { bankName: oneLine(bank.bankName, 120), accountHolder: oneLine(bank.accountHolder, 120), iban, bic, accountNumber, note: clean(bank.note, 500) };
  const anyBank = bankTransfer.bankName || bankTransfer.accountHolder || iban || accountNumber;
  if (anyBank && (!bankTransfer.bankName || !bankTransfer.accountHolder || (!iban && !accountNumber))) {
    issues.push({ field: "bankTransfer", message: "Virement : renseignez la banque, le titulaire et l’IBAN ou le numéro de compte (ou videz toute la section)." });
  }

  return {
    value: {
      bankTransfer,
      mobileMoney,
      agency: { address: oneLine(agency.address, 200), hours: oneLine(agency.hours, 160), note: clean(agency.note, 500) },
      generalNote: clean(source.generalNote, 600),
      updatedAt: null,
      updatedBy: null,
    },
    issues,
  };
}

/** Relit une valeur enregistrée : tolère un JSON absent, ancien ou corrompu (aucune exception). */
export function parsePaymentInstructions(json: string | null | undefined): PaymentInstructions {
  if (!json) return EMPTY_PAYMENT_INSTRUCTIONS;
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const { value } = sanitizePaymentInstructions(parsed);
    return { ...value, updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null, updatedBy: typeof parsed.updatedBy === "string" ? parsed.updatedBy : null };
  } catch {
    return EMPTY_PAYMENT_INSTRUCTIONS;
  }
}

export const isBankConfigured = (instructions: PaymentInstructions): boolean =>
  Boolean(instructions.bankTransfer.bankName && instructions.bankTransfer.accountHolder && (instructions.bankTransfer.iban || instructions.bankTransfer.accountNumber));
export const configuredMobileMoney = (instructions: PaymentInstructions): MobileMoneyAccount[] => instructions.mobileMoney.filter((account) => account.number && account.accountName);

/** Vue publique : sans le nom de l'administrateur qui a modifié les réglages. */
export const toPublicInstructions = (instructions: PaymentInstructions): PaymentInstructions => ({ ...instructions, updatedBy: null });

export type AgencyFacts = { address: string; hours: string; whatsappNumber: string; whatsappDisplay: string; phoneDisplay?: string };

export type MethodStatus = "available" | "soon" | "on_request";
export type MethodView = { id: PaymentMethodId; title: string; description: string; kind: "online" | "manual"; status: MethodStatus; statusLabel: string };

/** Tous les moyens de paiement et leur état réel : jamais « disponible » pour un moyen qui n'est pas configuré. */
export function describePaymentMethods(instructions: PaymentInstructions, onlineEnabled: boolean): MethodView[] {
  const online = (id: OnlineMethodId, title: string, description: string): MethodView => ({ id, title, description, kind: "online", status: onlineEnabled ? "available" : "soon", statusLabel: onlineEnabled ? "Disponible" : "Bientôt disponible" });
  const manual = (id: ManualMethodId, description: string, configured: boolean): MethodView => ({ id, title: MANUAL_METHOD_LABELS[id], description, kind: "manual", status: configured ? "available" : "on_request", statusLabel: configured ? "Disponible" : "Coordonnées sur demande" });
  return [
    online("card", "Carte bancaire (Visa, Mastercard)", "Paiement sécurisé en ligne avec confirmation immédiate."),
    online("mobile_money_online", "Mobile Money en ligne (MTN, Orange)", "Validation sur votre téléphone, confirmation immédiate."),
    manual("bank_transfer", "Virement depuis votre banque : indiquez votre référence dans le motif.", isBankConfigured(instructions)),
    manual("mobile_money_deposit", "Envoi d’argent sur le numéro Mobile Money de l’agence : le titulaire du compte est indiqué pour vérification.", configuredMobileMoney(instructions).length > 0),
    manual("cash_agency", "Règlement au comptoir de l’agence, avec reçu officiel.", true),
  ];
}

export function formatAmount(amount: number | null | undefined, currency = "XAF"): string {
  return typeof amount === "number" && Number.isFinite(amount) ? `${new Intl.NumberFormat("fr-FR").format(amount)} ${currency}` : "montant à confirmer";
}

/** Message WhatsApp prérempli quand un paiement n'a pas abouti : le client contacte l'agence avec sa référence. */
export function paymentFallbackMessage(input: { reference: string; amount?: number | null; currency?: string; method?: ManualMethodId | null; name?: string | null }): string {
  const method = input.method ? MANUAL_METHOD_LABELS[input.method].toLowerCase() : "virement, dépôt Mobile Money ou paiement en agence";
  return [
    "Bonjour 3M Travel & Services,",
    "mon paiement en ligne n’a pas abouti.",
    `Référence : ${input.reference || "à préciser"}`,
    `Montant : ${formatAmount(input.amount, input.currency)}`,
    ...(input.name ? [`Nom : ${input.name}`] : []),
    `Je souhaite régler par ${method}. Merci de m’indiquer la marche à suivre.`,
  ].join("\n");
}
