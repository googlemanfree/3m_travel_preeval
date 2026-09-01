ALTER TABLE `candidate_files`
  MODIFY COLUMN `fileType` ENUM('cv','passeport','diplome','releve_notes','photo','justificatif_domicile','extrait_naissance','casier_judiciaire','justificatif_paiement','document_remis_main_propre','autre') NOT NULL;
