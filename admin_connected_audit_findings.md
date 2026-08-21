# Vérification connectée du back-office

Date de contrôle : 21 août 2026.

| Parcours | Résultat | Observation |
|---|---|---|
| Connexion administrateur | Validée | La connexion a ouvert le tableau de bord administrateur sur `https://www.3mtravelagency.com/admin`. |
| Raccourci « Visuels destinations » | Validé | Le raccourci mène à `/admin/destination-media`. La page se charge après son court état de chargement et expose la bibliothèque de médias, la recherche et les actions d’import. |
| Retour au tableau de bord | Validé | Le lien de retour de la page des visuels mène à `/admin/dashboard`. |
| Raccourci « Confirmer hôtels » | Validé | Le raccourci ouvre la section de précontrôle hôtelier et le suivi des visuels officiels. |
| Raccourci « Saisir dossier agence » | Validé | La modale de saisie s’ouvre avec ses champs obligatoires ; aucun dossier n’a été créé lors du contrôle. |
| Poste des assurances | Validé | La route `/admin/insurance-requests` est accessible en session administrateur ; aucune demande réelle n’était présente. |
| Centre de notifications | Validé | Le panneau s’ouvre et restitue un état vide compréhensible lorsqu’aucune notification n’est disponible. |
| Raccourci de remise | Contrôle statique | Les flux de remise documentaires restent couverts par les tests ; aucun e-mail ni document réel n’a été envoyé durant cet audit. |

Les actions à effet externe ou irréversible n’ont pas été déclenchées : réinitialisation massive par e-mail, export de données, import de ville, création de dossier, validation/masquage d’hôtel et téléversement de documents.

La route devinée `/admin/emails` retourne une page 404, mais aucun bouton actif du tableau de bord ne la référence : le suivi des e-mails est un onglet intégré au dashboard. Aucune redirection de production n’a donc été modifiée lors de ce contrôle.
