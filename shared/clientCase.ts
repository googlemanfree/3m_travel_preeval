/**
 * Espace client : libellés lisibles, bilingues, sans promesse. Module pur : même code côté serveur (aperçu du dossier, journal) et côté client.
 */
export type ClientLanguage = "fr" | "en";

export const CLIENT_TEXT = {
  fr: {
    heroTitle: "Où en est mon dossier ?",
    myTurn: "À faire de mon côté",
    teamTurn: "En cours chez 3M Travel Agency",
    lastActivity: "Dernière action de l'équipe",
    nothingForMe: "Rien à faire de votre côté pour le moment.",
    noActivity: "Pas encore d'action enregistrée",
    agendaTitle: "Mon agenda",
    agendaEmpty: "Aucune échéance à venir.",
    agendaDownload: "Ajouter à l'agenda de mon téléphone (.ics)",
    timelineTitle: "Journal de mon dossier",
    timelineEmpty: "Les étapes de votre dossier apparaîtront ici.",
    timelinePrint: "Imprimer le journal de mon dossier",
    accountTitle: "Mon compte",
    languageLabel: "Langue de l'espace",
    notificationsLabel: "Mes notifications",
    emailNotifications: "Recevoir mes notifications par e-mail",
    whatsappNotifications: "Autoriser l'agence à me contacter sur WhatsApp",
    quietHours: "Heures de silence",
    securityLabel: "Sécurité du compte",
    logoutEverywhere: "Me déconnecter de tous les appareils",
    recentLogins: "Connexions récentes",
    save: "Enregistrer",
    saved: "Enregistré",
  },
  en: {
    heroTitle: "Where is my file?",
    myTurn: "What I need to do",
    teamTurn: "In progress at 3M Travel Agency",
    lastActivity: "Last action by the team",
    nothingForMe: "Nothing to do on your side for now.",
    noActivity: "No action recorded yet",
    agendaTitle: "My calendar",
    agendaEmpty: "No upcoming deadline.",
    agendaDownload: "Add to my phone calendar (.ics)",
    timelineTitle: "My file history",
    timelineEmpty: "The steps of your file will appear here.",
    timelinePrint: "Print my file history",
    accountTitle: "My account",
    languageLabel: "Language of this space",
    notificationsLabel: "My notifications",
    emailNotifications: "Receive my notifications by e-mail",
    whatsappNotifications: "Allow the agency to contact me on WhatsApp",
    quietHours: "Quiet hours",
    securityLabel: "Account security",
    logoutEverywhere: "Sign me out of all devices",
    recentLogins: "Recent sign-ins",
    save: "Save",
    saved: "Saved",
  },
} as const;
export type ClientTextKey = keyof (typeof CLIENT_TEXT)["fr"];
export const clientText = (language: ClientLanguage | null | undefined, key: ClientTextKey): string => CLIENT_TEXT[language === "en" ? "en" : "fr"][key];

export const WORKFLOW_CLIENT_LABELS: Record<string, { fr: string; en: string }> = {
  new: { fr: "Votre demande est bien reçue : un conseiller va la prendre en charge.", en: "Your request has been received: an advisor will take it over." },
  qualifying: { fr: "Votre conseiller étudie votre situation et votre projet.", en: "Your advisor is reviewing your situation and project." },
  waiting_customer: { fr: "L'équipe attend un élément de votre part pour avancer.", en: "The team is waiting for something from you to move forward." },
  documents_review: { fr: "Votre conseiller contrôle les pièces que vous avez envoyées.", en: "Your advisor is checking the documents you sent." },
  payment_review: { fr: "Votre conseiller vérifie la preuve de paiement reçue.", en: "Your advisor is checking the proof of payment received." },
  processing: { fr: "Votre dossier est en cours de traitement par l'équipe.", en: "Your file is being processed by the team." },
  submitted: { fr: "Votre dossier a été transmis : l'équipe suit la suite avec l'organisme concerné.", en: "Your file has been submitted: the team follows up with the organisation concerned." },
  completed: { fr: "Cette étape est terminée.", en: "This step is complete." },
};

export const DOSSIER_CLIENT_LABELS: Record<string, { fr: string; en: string }> = {
  nouveau: { fr: "Pré-dossier : votre compte est ouvert, l'ouverture du dossier suit la confirmation de votre paiement.", en: "Pre-file: your account is open; the file opens once your payment is confirmed." },
  evaluation: { fr: "Évaluation de votre profil en cours.", en: "Your profile assessment is in progress." },
  documents: { fr: "Dossier ouvert : collecte et contrôle de vos pièces.", en: "File open: collecting and checking your documents." },
  traitement: { fr: "Dossier en traitement.", en: "File being processed." },
  soumis: { fr: "Dossier transmis.", en: "File submitted." },
  approuve: { fr: "Décision favorable enregistrée.", en: "Favourable decision recorded." },
  refuse: { fr: "Décision défavorable enregistrée : votre conseiller vous explique les suites possibles.", en: "Unfavourable decision recorded: your advisor explains the possible next steps." },
};

export function workflowClientLabel(status: string | null | undefined, language: ClientLanguage): string | null {
  const entry = status ? WORKFLOW_CLIENT_LABELS[status] : undefined;
  return entry ? entry[language] : null;
}

export function dossierClientLabel(status: string | null | undefined, language: ClientLanguage): string {
  const entry = DOSSIER_CLIENT_LABELS[status ?? "nouveau"] ?? DOSSIER_CLIENT_LABELS.nouveau;
  return entry[language];
}

/** « Réponse habituelle » : seulement à partir de 10 échanges mesurés, jamais une promesse. */
export function replyTimeSentence(medianHours: number | null, answered: number, language: ClientLanguage): string {
  if (medianHours === null || answered < 10) return language === "en" ? "Your advisor replies in this space and by e-mail." : "Votre conseiller vous répond dans votre espace et par e-mail.";
  const hours = Math.max(1, Math.round(medianHours));
  const when = hours >= 48 ? (language === "en" ? `${Math.round(hours / 24)} days` : `${Math.round(hours / 24)} jours`) : (language === "en" ? `${hours} h` : `${hours} h`);
  return language === "en" ? `Usual reply time over recent exchanges: about ${when}.` : `Délai habituel de réponse sur les derniers échanges : environ ${when}.`;
}

export type MessageStatus = "sent" | "read" | "answered";
export const MESSAGE_STATUS_LABELS: Record<MessageStatus, { fr: string; en: string }> = {
  sent: { fr: "Envoyé", en: "Sent" },
  read: { fr: "Lu par l'équipe", en: "Read by the team" },
  answered: { fr: "Répondu", en: "Answered" },
};

/** État d'un message du candidat : répondu si l'équipe a écrit après lui, lu si ouvert par l'équipe, sinon envoyé. */
export function candidateMessageStatus(message: { senderRole?: string; isRead?: boolean; createdAt?: Date | string }, all: Array<{ senderRole?: string; createdAt?: Date | string }>): MessageStatus | null {
  if (message.senderRole !== "candidate" || !message.createdAt) return null;
  const at = new Date(message.createdAt).getTime();
  if (all.some((other) => other.senderRole !== "candidate" && other.createdAt && new Date(other.createdAt).getTime() > at)) return "answered";
  return message.isRead ? "read" : "sent";
}

// ───────────── Agenda (.ics) ─────────────
export type AgendaEvent = { uid: string; title: string; description?: string; start: Date | string; durationMin?: number; allDay?: boolean };

const icsEscape = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsStamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const icsDay = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, "");
const fold = (line: string) => (line.length <= 73 ? line : line.match(/.{1,73}/g)!.join("\r\n "));

/** Fichier .ics (RFC 5545) : accepté par les agendas des téléphones. Titres et descriptions sont échappés. */
export function buildIcs(events: AgendaEvent[], now: Date = new Date()): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//3M Travel Agency//Espace client//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const event of events) {
    const start = new Date(event.start);
    if (Number.isNaN(start.getTime())) continue;
    lines.push("BEGIN:VEVENT", `UID:${event.uid.replace(/[^A-Za-z0-9@._-]/g, "")}@3mtravelagency.com`, `DTSTAMP:${icsStamp(now)}`);
    if (event.allDay) {
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      lines.push(`DTSTART;VALUE=DATE:${icsDay(start)}`, `DTEND;VALUE=DATE:${icsDay(end)}`);
    } else {
      lines.push(`DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(new Date(start.getTime() + (event.durationMin ?? 30) * 60 * 1000))}`);
    }
    lines.push(`SUMMARY:${icsEscape(event.title)}`);
    if (event.description) lines.push(`DESCRIPTION:${icsEscape(event.description)}`);
    lines.push("BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(event.title)}`, "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

// ───────────── Aide par pièce ─────────────
export type DocumentHelp = { why: string; good: string[]; refused: string[] };

const HELP: Array<{ match: RegExp; fr: DocumentHelp; en: DocumentHelp }> = [
  {
    match: /photo|portrait|selfie/i,
    fr: { why: "Elle permet d'identifier la personne qui dépose le dossier.", good: ["Visage entier, de face, fond uni, bonne lumière.", "Photo récente, sans lunettes teintées ni couvre-chef (sauf motif religieux)."], refused: ["Visage de profil, flou ou trop sombre.", "Photo d'une autre photo ou capture d'écran.", "Filtre ou retouche."] },
    en: { why: "It identifies the person submitting the file.", good: ["Full face, front view, plain background, good light.", "Recent photo, no tinted glasses or headwear (except for religious reasons)."], refused: ["Side view, blurry or too dark.", "Photo of a photo or screenshot.", "Filters or retouching."] },
  },
  {
    match: /passeport|passport/i,
    fr: { why: "Il prouve votre identité, votre nationalité et la validité de votre document de voyage : l'autorité vérifie qu'il reste valable plusieurs mois après le voyage.", good: ["La page d'identité entière, à plat, lisible, avec la zone de lecture automatique en bas.", "Une photo nette, sans reflet, avec les quatre coins visibles."], refused: ["Photo coupée, floue ou prise en biais.", "Doigt ou reflet qui cache une information.", "Passeport expiré ou qui expire bientôt."] },
    en: { why: "It proves your identity, nationality and the validity of your travel document: authorities check that it stays valid for several months after travel.", good: ["The whole identity page, flat and readable, with the machine-readable zone at the bottom.", "A sharp photo with no glare and all four corners visible."], refused: ["Cropped, blurry or angled photo.", "A finger or glare hiding information.", "Expired passport or one that expires soon."] },
  },
  {
    match: /dipl[oô]me|relev[eé] de notes|bulletin|attestation de r[eé]ussite|certificat de scolarit|degree|transcript/i,
    fr: { why: "Il justifie votre niveau d'études ; certains pays demandent aussi une traduction ou une légalisation.", good: ["Le document complet, recto et verso si besoin, en couleur.", "Les cachets et signatures lisibles."], refused: ["Une seule page d'un document de plusieurs pages.", "Copie illisible ou noir et blanc quand les cachets comptent."] },
    en: { why: "It proves your level of education; some countries also ask for a translation or legalisation.", good: ["The complete document, both sides if needed, in colour.", "Readable stamps and signatures."], refused: ["Only one page of a multi-page document.", "Unreadable copy, or black and white when stamps matter."] },
  },
  {
    match: /\bcv\b|curriculum|r[eé]sum[eé]/i,
    fr: { why: "Il permet de présenter votre parcours aux employeurs ou aux établissements.", good: ["Un CV à jour, avec dates, fonctions et missions.", "Format PDF ou Word."], refused: ["CV sans dates ou avec des périodes qui se chevauchent.", "Photo ou pièce d'identité incluse dans le fichier."] },
    en: { why: "It presents your background to employers or schools.", good: ["An up-to-date CV with dates, roles and duties.", "PDF or Word format."], refused: ["CV without dates or with overlapping periods.", "Photo or ID document embedded in the file."] },
  },
  {
    match: /naissance|birth|[eé]tat civil|mariage|marriage/i,
    fr: { why: "Il établit votre état civil ; l'autorité compare les noms et les dates avec votre passeport.", good: ["Un extrait ou acte récent, avec toutes les mentions.", "Noms et dates identiques à ceux du passeport."], refused: ["Orthographe du nom différente du passeport, sans explication.", "Extrait trop ancien ou sans cachet."] },
    en: { why: "It establishes your civil status; authorities compare names and dates with your passport.", good: ["A recent extract or certificate with all details.", "Names and dates identical to the passport."], refused: ["Name spelled differently from the passport without explanation.", "Too old or unstamped extract."] },
  },
  {
    match: /fonds|ressources|relev[eé] bancaire|banque|finance|funds|bank|garantie/i,
    fr: { why: "Elle montre que vous pouvez financer votre séjour ; l'autorité fixe le montant à justifier.", good: ["Des relevés récents, complets, à votre nom.", "Les pages avec le solde et les mouvements."], refused: ["Relevé d'un tiers sans lettre de prise en charge.", "Captures d'écran partielles."] },
    en: { why: "It shows you can fund your stay; the authority sets the amount to justify.", good: ["Recent, complete statements in your name.", "Pages showing the balance and transactions."], refused: ["A third party's statement without a sponsorship letter.", "Partial screenshots."] },
  },
  {
    match: /assurance|insurance/i,
    fr: { why: "Elle couvre vos frais de santé et de rapatriement pendant le séjour, si le pays l'exige.", good: ["Le certificat complet avec dates de couverture et montants garantis.", "Couverture sur toute la durée du séjour."], refused: ["Simple devis sans paiement.", "Dates qui ne couvrent pas tout le séjour."] },
    en: { why: "It covers health and repatriation costs during your stay, where required.", good: ["The full certificate with coverage dates and amounts.", "Coverage for the entire stay."], refused: ["A mere quote with no payment.", "Dates that do not cover the whole stay."] },
  },
  {
    match: /casier|police|judiciaire|criminal/i,
    fr: { why: "Certains pays exigent un extrait de casier judiciaire récent pour les projets de travail ou d'installation.", good: ["Un extrait récent, avec cachet et signature.", "Traduit si le pays le demande."], refused: ["Extrait trop ancien.", "Copie sans cachet."] },
    en: { why: "Some countries require a recent police record extract for work or settlement projects.", good: ["A recent extract with stamp and signature.", "Translated if the country requires it."], refused: ["An extract that is too old.", "A copy without a stamp."] },
  },
];

const GENERIC: { fr: DocumentHelp; en: DocumentHelp } = {
  fr: { why: "Votre conseiller en a besoin pour vérifier votre dossier et éviter un refus ou un renvoi de l'autorité.", good: ["Document entier, lisible, à plat, bonne lumière.", "Nom et dates visibles."], refused: ["Photo coupée, floue ou sombre.", "Document incomplet ou illisible."] },
  en: { why: "Your advisor needs it to check your file and avoid a refusal or a return from the authority.", good: ["Whole document, readable, flat, good light.", "Name and dates visible."], refused: ["Cropped, blurry or dark photo.", "Incomplete or unreadable document."] },
};

/** Pourquoi on demande cette pièce, à quoi ressemble une bonne photo, ce qui est renvoyé. Texte général : la liste exacte vient du conseiller. */
export function documentHelpFor(label: string, language: ClientLanguage): DocumentHelp {
  const entry = HELP.find((item) => item.match.test(label));
  return (entry ?? GENERIC)[language];
}
