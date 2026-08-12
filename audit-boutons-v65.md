# Audit des interactions v65

## Dysfonctionnements confirmés

- `client/src/pages/PrimaryEvaluationForm.tsx` : la soumission attend deux secondes, écrit dans la console et affiche un numéro aléatoire ; aucune mutation n’est appelée.
- `client/src/pages/MySpace.tsx` : le bouton d’ajout de document ouvre bien le modal, mais le callback final est un TODO sans upload ni persistance.
- `client/src/components/DocumentsStatus.tsx` : le réupload d’un document rejeté construit un `FormData` mais ne l’envoie jamais ; le succès affiché est fictif et l’import tRPC manque.
- `client/src/pages/ClientDashboard.tsx` : upload simulé, boutons Voir/Télécharger sans action, déconnexion qui redirige seulement, bouton mot de passe sans handler.
- `client/src/pages/SubmitDocuments.tsx` : la soumission en ligne transmet des `URL.createObjectURL` temporaires au lieu de fichiers stockés ; le retour utilise `/candidate/dashboard`, route absente.
- `client/src/pages/AdminDocumentVerification.tsx` : la liste admin est codée en tableau vide et le `refetch` est un no-op ; les actions de vérification ne peuvent donc jamais être atteintes.
- `client/src/pages/SignUp.tsx` : les deux liens légaux utilisent `href="#"`.

## Parcours vérifiés comme fonctionnels ou intentionnellement désactivés

- Les CTA principaux de `ProceduresAdvanced` sont enveloppés par de vraies ancres ; le bouton « Bientôt » est désactivé et explicitement étiqueté.
- `DocumentUploadPage` utilise déjà le flux réel `/api/candidate/upload` puis `candidate.saveDocument` et sert de référence pour les corrections.
- Le build TypeScript initial passe sans erreur bloquante.

## Règles de correction

Préserver la structure visuelle et les libellés. Réutiliser les routes d’upload et mutations existantes. Ne jamais afficher de succès avant confirmation serveur. Conserver les contrôles de session et de propriété côté serveur.

## Vérification visuelle après corrections
- Desktop 1280px : `/`, `/procedures`, `/evaluation` et `/suivi-client` se rendent sans écran blanc ni débordement visible ; les CTA principaux sont visibles.
- Mobile 375px : `/` et `/procedures` restent utilisables avec navigation repliée ; `/submit-documents` affiche correctement l’accès réservé ; `/document-upload` affiche le bouton de connexion dans la carte sans débordement.
- Point observé : le tableau des filtres de `/procedures` est dense sur mobile mais reste dans la largeur de la carte ; aucune correction de design n’a été appliquée conformément à la demande.
- Build de production validé avec `NODE_OPTIONS=--max-old-space-size=1536` ; les avertissements restants concernent le découpage de gros bundles jsPDF/HTML2PDF, pas une erreur de compilation.
