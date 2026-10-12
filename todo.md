
## PR80 — bouton reset password dans l’e-mail
- [x] PR80 sortie du draft; validation locale du commit `9f5a68c7` : régression ciblée 2/2, typecheck et build verts.
- [x] PR80 squash-mergée sur `main` au commit `d9589c82`.
- [x] WebDev synchronisé et redémarré sur `d9589c82`.
- [x] Vérification du rendu admin : bouton à couleur solide, texte « Réinitialiser mon mot de passe », lien texte de secours et URL `/admin/reset-password?token=…`; smoke template 4/4 contrôles verts. Aucun token réel utilisé et aucun e-mail envoyé.
- [x] Fournisseur d’envoi vérifié : service SMTP configuré avec expéditeur par défaut `hello@3mtravelagency.com`; aucun secret affiché.
- [ ] Redemander un e-mail réel de réinitialisation après identification explicite du compte administrateur cible.
