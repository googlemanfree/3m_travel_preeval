-- Add the payment receipt document type without removing existing candidate files.
ALTER TABLE `candidate_files`
  MODIFY COLUMN `fileType` enum('cv','passeport','diplome','releve_notes','photo','justificatif_domicile','extrait_naissance','casier_judiciaire','justificatif_paiement','autre') NOT NULL;
