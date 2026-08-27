# Parcours de compte pré-évalué et pièces justificatives

## Règle de rapprochement

La case « évaluation déjà reçue » est une **déclaration**. Elle ne suffit pas à confirmer un résultat, modifier une décision ou ouvrir une procédure. Lors de l’inscription, le serveur effectue un rapprochement uniquement sur l’adresse e-mail normalisée et seulement avec une pré-évaluation déjà revue par un conseiller puis effectivement transmise au candidat. Dans ce cas précis, le compte reçoit l’état interne `validated`, est orienté vers l’espace candidat après confirmation de l’adresse et affiche « Évaluation validée ».

En l’absence de correspondance, l’état reste `pending_validation`. Le candidat conserve son accès après activation e-mail, mais le statut n’est pas présenté comme validé. Cette distinction évite qu’une simple case cochée ne devienne une décision automatisée.

## Pièces justificatives

Le dépôt client est consolidé côté serveur. Après la validation du fichier et son stockage privé, l’API crée immédiatement le registre `candidateFiles`, ce qui rend la pièce disponible dans la file administrative même si un second appel navigateur échoue. Le dossier agence lié reçoit aussi sa copie opérationnelle lorsqu’il existe.

L’interface demande désormais au candidat de choisir le type de pièce, notamment le CV, avant chaque envoi. Toute réponse positive indique que le document est enregistré et disponible à l’équipe ; elle ne signifie ni validation documentaire ni finalisation de procédure.

## Confidentialité

Le rapprochement par e-mail n’expose ni brouillon interne, ni document, ni score. Une réponse d’évaluation dans l’espace candidat reste conditionnée à sa diffusion humaine effective (`finalResponseSentAt`).
