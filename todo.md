
## Espace client — dépôt documentaire et alerte d’étape — VALIDÉ
- [x] Flux existant réutilisé : `DocumentUploader` → `/api/candidate/upload`, validation serveur MIME/contenu/taille, stockage privé, synchronisation dossier agence et notification admin.
- [x] Module visible renforcé dans `mon-espace?section=documents` avec dépôt par dossier, checklist pays/visa, clarification, état de vérification humaine et `data-testid="client-document-dropzone"`.
- [x] Alerte inline accessible après changement détecté de procédure/dossier ; aucune mutation, fermeture locale, toast existant conservé.
- [x] Tests ciblés, `pnpm run check` et `vite build` verts ; checkpoint WebDev `1a86ef4c` sauvegardé.
