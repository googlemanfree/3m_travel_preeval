/**
 * Limite opérationnelle : un compte client peut suivre jusqu’à 5 procédures / dossiers
 * (chaque demande nécessite une activation et un numéro distinct).
 */
export const MAX_CLIENT_DOSSIERS = 5;

export const MAX_CLIENT_DOSSIERS_MESSAGE =
  `Vous avez déjà ${MAX_CLIENT_DOSSIERS} dossiers ouverts. Clôturez ou finalisez une procédure avant d’en ouvrir une nouvelle, ou contactez l’agence.`;
