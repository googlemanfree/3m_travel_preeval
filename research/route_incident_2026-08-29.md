# Incident public — route d’évaluation

Date du contrôle : 2026-08-29.

Source contrôlée : https://www.3mtravelagency.com/evaluation

Constat : la réponse publique affiche le titre « Site under maintenance » et le contenu « This site is under maintenance. ». Aucun contrôle interactif n’est présent. Ce comportement est distinct de la route React locale `/evaluation`, qui est protégée par `AuthGuard` et doit afficher le formulaire aux candidats authentifiés. La correction doit donc traiter le routage/pré-rendu ou l’infrastructure qui intercepte cette URL, puis vérifier que la page publique ne présente plus le placeholder de maintenance.
