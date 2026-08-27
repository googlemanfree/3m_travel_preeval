# Demande de pièce spécifique par conseiller

La demande manuelle réutilise le registre existant `document_requirements`, lié à un dossier opérationnel. Aucun registre concurrent n’est créé. Une demande contient un libellé de pièce, un commentaire destiné au candidat, son caractère requis et, si utile, une échéance. Les libellés sont limités et nettoyés côté serveur.

La création, la modification et le retrait passent exclusivement par un contrôle de session administrateur. Chaque action est enregistrée dans `case_activity_logs` avec le type d’action, le dossier, l’auteur et le motif, sans copier de contenu de fichier ou de donnée d’identité superflue.

La checklist candidate associe les demandes actives à une pièce déposée et présente les statuts « à fournir », « reçu — vérification en cours », « validé par l’agence » ou « à remplacer ». Une demande retirée est marquée comme levée et n’est plus présentée comme obligatoire. Les pièces privées restent accessibles seulement via les routes candidates/admin existantes et l’identité de session correspondante.
