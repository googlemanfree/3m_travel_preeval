/**
 * Brouillons de la vague 7 : Danemark, études supérieures — page de l'Agence danoise du recrutement international et de l'intégration (SIRI) sur
 * nyidanmark.dk, dont chaque question dépliée a été LUE EN ENTIER le 2026-11-23 (qui peut obtenir un titre, conditions, langue, établissement et
 * programme, moyens de subsistance, mineurs, famille, démarche en huit étapes). Chaque fait écrit est dans cette page. Les montants (frais de dossier,
 * seuil mensuel de moyens de subsistance, plafond annuel) ne sont pas écrits : ils sont révisés chaque année (« niveau 2026 » sur la page) et renvoyés au
 * conseiller. Le détail de chacune des huit étapes de la démarche en ligne n'a pas été lu : seul son intitulé figure ici.
 *
 * Les brouillons s'importent en « À confirmer » avec une source « à confirmer » : rien n'est publié par ce fichier. Voir docs/GUIDES_VAGUE_7.md.
 */
import type { DraftPathway } from "./countryCatalogDrafts";

const CONFIRM_AMOUNTS = "Les montants changent chaque année : votre conseiller confirme les valeurs à jour avant tout dépôt.";

export const COUNTRY_CATALOG_DRAFTS_WAVE_7: readonly DraftPathway[] = [
  {
    countryCode: "DK", pathway: "study",
    summary: "Admis à un programme d'enseignement supérieur danois (académie professionnelle, licence professionnelle, licence ou master, y compris certains programmes conjoints Erasmus), vous pouvez obtenir un titre de séjour d'étudiant à temps plein, traité par l'Agence danoise du recrutement international et de l'intégration (SIRI). Le délai normal est de 2 mois, jusqu'à 3 mois si des informations manquent. Depuis le 1er octobre 2026, les règles pour les membres de la famille d'un étudiant ont changé.",
    programs: [
      {
        officialName: "Residence permit for studies in a higher educational programme", nameFr: "Titre de séjour pour études supérieures",
        feesNote: `Des frais de traitement du dossier sont à payer avant le dépôt. ${CONFIRM_AMOUNTS}`,
        processingNote: "Délai normal de 2 mois ; jusqu'à 3 mois si des informations complémentaires sont nécessaires. Les délais de traitement sont mis à jour par SIRI chaque semestre.",
        steps: [
          { actor: "candidate", title: "Être admis à un programme d'enseignement supérieur danois, à temps plein", description: "L'admission à un programme d'enseignement supérieur au Danemark est exigée, et vous devez étudier à temps plein : on ne peut pas obtenir un titre pour des études à temps partiel. Vous pouvez suivre un cursus complet ou une partie de vos études comme étudiant invité ou en échange. Les citoyens de l'UE/EEE et de Suisse n'ont pas besoin de ce titre : ils demandent un document de séjour de l'UE." },
          { actor: "institution", title: "Vérifier l'établissement et le programme", description: "L'établissement doit être publiquement accrédité ou agréé par l'État et soumis à sa supervision ; à défaut, au moins un membre de son conseil doit être nommé par le ministère de l'Enseignement supérieur et de la Science. Le programme doit être approuvé par une autorité de l'État ; sinon, il doit avoir un avis consultatif valide du secrétariat du Conseil d'accréditation ou de l'Institut danois d'évaluation (EVA). Un programme est « supérieur » si l'on y entre après un lycée ou une formation professionnelle." },
          { actor: "candidate", title: "Pouvoir suivre les cours dans leur langue", description: "Vous devez parler et comprendre la langue d'enseignement à un niveau qui permet de participer activement aux cours." },
          { actor: "candidate", title: "Pouvoir subvenir à vos besoins", description: "Vous devez disposer de fonds suffisants pour toute la durée de votre séjour, calculés par mois d'études (sur 12 mois au maximum si vous étudiez plus d'un an). Le montant mensuel exigé est fixé chaque année sur la page officielle. Documents acceptés : un relevé bancaire de moins de 30 jours au dépôt, avec nom complet, solde et devise (si vous en fournissez plusieurs, ils doivent avoir la même date), ou une preuve de bourse ou de prêt étudiant qui vous est accordé et correspond au montant mensuel. Seuls les avoirs liquides sont acceptés : ni actions bloquées, ni obligations, ni portefeuille d'investissement. Un relevé au nom d'une autre personne (vos parents, par exemple) ou une déclaration d'un tiers ne sont pas acceptés.", fee: "Montant mensuel exigé à confirmer par votre conseiller" },
          { actor: "candidate", title: "Si vous avez moins de 18 ans", description: "Vos deux parents doivent signer une déclaration de consentement, avec la preuve de qui détient la garde (par exemple votre acte de naissance et la page d'identité des passeports des parents). L'établissement doit déclarer qu'il vous assurera des conditions de résidence et d'étude convenables. Une procuration donnée à une personne ou à une organisation doit être signée par vous et par vos deux parents ou tuteurs.", documents: ["Déclaration de consentement signée par les deux parents", "Preuve de la garde (acte de naissance, pages d'identité des passeports des parents)", "Déclaration de l'établissement sur les conditions de résidence et d'étude"] },
          { actor: "institution", title: "L'établissement remplit la première partie de la demande", description: "La demande se fait en deux parties : l'établissement remplit la première et écrit votre adresse électronique. SIRI vous prévient par courriel quand vous pouvez remplir votre partie ; utilisez le lien reçu pour créer votre compte avec exactement la même adresse. Avec le formulaire papier, la démarche est aussi lancée en général par l'établissement." },
          { actor: "candidate", title: "Suivre la démarche en huit étapes sur le site de SIRI", description: "Créer un numéro de dossier (case order ID) ; payer les frais ; réunir les documents et déclarations ; remplir le formulaire de demande (en ligne ou papier) ; retrouver la demande ; la déposer ; fournir les données biométriques ; recevoir la réponse. Si vous êtes déjà au Danemark au dépôt, votre séjour doit y être légal.", fee: "Frais de traitement à confirmer par votre conseiller" },
          { actor: "authority", title: "Décision de SIRI", description: "Délai normal de 2 mois, jusqu'à 3 mois si des informations manquent. Un dossier complet ne garantit pas la délivrance du titre." },
          { actor: "candidate", title: "Connaître les règles pour la famille et le stage", description: "Si vous avez déposé avant le 1er octobre 2026 pour un programme supérieur approuvé par l'État, votre conjoint ou partenaire (déposant lui aussi avant cette date) et vos enfants de moins de 18 ans peuvent demander un titre de membre de famille accompagnant. À partir du 1er octobre 2026, le conjoint et les enfants ne peuvent plus l'obtenir pour ces programmes. Pour un programme non approuvé par l'État et une demande déposée à partir du 2 mai 2025, aucun membre de la famille ne peut obtenir de titre. Pour un titre de doctorant (séjour et travail), la famille — conjoint, partenaire ou concubin, et enfants de moins de 18 ans vivant au foyer — peut vivre avec vous. Si un stage fait partie de votre programme, vous pouvez demander un permis de travail pour stage." },
        ],
      },
      {
        officialName: "Residence permit for a preparatory course leading to a higher educational programme", nameFr: "Titre de séjour pour cours préparatoire à un programme supérieur",
        steps: [
          { actor: "candidate", title: "Remplir les conditions du cours préparatoire", description: "Pour un séjour de plus de 3 mois, vous pouvez obtenir un titre si le ministère de l'Enseignement supérieur et de la Science a déterminé que ce cours est une condition d'admission à un programme supérieur précis (par exemple ingénieur), si le cours dure au plus 1 an et si vous êtes admis au programme supérieur auquel il est lié. Vous devez en outre remplir les mêmes conditions que pour des études supérieures." },
          { actor: "authority", title: "Décision de SIRI", description: "Un dossier complet ne garantit pas la délivrance du titre." },
        ],
      },
    ],
    sources: [{ label: "New to Denmark (SIRI) : études supérieures", url: "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study/Higher-Education", authority: "immigration" }],
  },
];
