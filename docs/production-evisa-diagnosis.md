# Diagnostic production e-Visa — 2026-08-16

Source vérifiée : https://www.3mtravelagency.com/evisas/request?countryCode=eg&countryName=Egypt

La page publiée finit par afficher le formulaire e-Visa après un écran de chargement temporaire. L’étape 1 « Téléchargement » est accessible et le sélecteur de fichier accepte PDF/JPG/PNG jusqu’à 5 MB. Le bandeau d’erreur vu par le client survient donc après l’action de sélection ou pendant l’appel d’analyse, et non pendant le rendu initial du formulaire. Le flux de production doit être reproduit sur cette URL avec un fichier réel et l’appel réseau `passportAnalysis.analyzePassport` doit être observé séparément.
