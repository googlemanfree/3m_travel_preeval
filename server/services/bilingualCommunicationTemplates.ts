export type CommunicationTemplateLanguage = "fr" | "en";

export const SHARED_BILINGUAL_TEMPLATES: Array<{
  name: string;
  scope: "candidate_message" | "evaluation_message" | "general";
  language: CommunicationTemplateLanguage;
  contentHtml: string;
}> = [
  {
    name: "FR — Accusé de réception candidat",
    scope: "candidate_message",
    language: "fr",
    contentHtml: "<p>Bonjour,</p><p>Nous confirmons la bonne réception de votre message et des informations communiquées. Votre conseiller examine votre dossier et vous indiquera la prochaine étape dès que possible.</p><p>Vous pouvez suivre l’avancement de votre demande depuis votre espace client sécurisé.</p>",
  },
  {
    name: "EN — Candidate acknowledgement",
    scope: "candidate_message",
    language: "en",
    contentHtml: "<p>Hello,</p><p>We confirm that we have received your message and the information provided. Your advisor is reviewing your file and will share the next step as soon as possible.</p><p>You may follow the progress of your request from your secure client area.</p>",
  },
  {
    name: "FR — Relance pièces justificatives",
    scope: "candidate_message",
    language: "fr",
    contentHtml: "<p>Bonjour,</p><p>Pour poursuivre le traitement de votre dossier, certaines pièces justificatives restent attendues. Merci de les déposer depuis votre espace client ou de répondre à ce message si vous avez besoin d’une précision.</p><p>Dès réception, notre équipe pourra poursuivre la vérification de votre dossier.</p>",
  },
  {
    name: "EN — Supporting documents follow-up",
    scope: "candidate_message",
    language: "en",
    contentHtml: "<p>Hello,</p><p>Some supporting documents are still required before we can continue processing your file. Please upload them through your client area or reply to this message if you need clarification.</p><p>Once received, our team can continue reviewing your file.</p>",
  },
  {
    name: "FR — Bilan disponible",
    scope: "evaluation_message",
    language: "fr",
    contentHtml: "<p>Bonjour,</p><p>Votre bilan d’évaluation est finalisé. Il présente les principaux éléments retenus, les priorités à préparer et les prochaines étapes recommandées pour votre projet.</p><p>Nous vous invitons à le consulter attentivement dans votre espace client sécurisé.</p>",
  },
  {
    name: "EN — Evaluation report available",
    scope: "evaluation_message",
    language: "en",
    contentHtml: "<p>Hello,</p><p>Your evaluation report is ready. It outlines the main findings, the priorities to prepare and the recommended next steps for your project.</p><p>Please review it carefully in your secure client area.</p>",
  },
];
