# Vérification publique — footer global

Date : 24 août 2026.

L’URL `https://www.3mtravelagency.com/?release=870aec46&footer-final=1` a chargé une version antérieure du bundle public : elle conserve les anciens blocs « Nous Sommes Officiellement Enregistrés », les informations Douala et les sections détaillées de contact qui précèdent le footer. Cette réponse ne reflète pas le module d’assistance compact ni le footer global présents dans le build local validé.

La cause est une diffusion différée ou un cache d’assets du domaine public. Avant de conclure le contrôle, une nouvelle révision de diffusion doit forcer le chargement du bundle contenant le footer global et la section d’assistance compacte. Aucune route, composant fonctionnel ou donnée n’est supprimé dans cette action de diffusion.
