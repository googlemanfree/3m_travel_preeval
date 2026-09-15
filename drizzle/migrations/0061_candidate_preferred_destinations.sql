-- Ajoute jusqu'a 3 pays precis de preference, declares a l'inscription.
-- Nullable : safe a appliquer une seule fois, aucune donnee existante modifiee.
ALTER TABLE `candidates`
  ADD COLUMN `preferredDestinations` text NULL;
