ALTER TABLE evaluations
  ADD COLUMN projectType varchar(50) NULL,
  ADD COLUMN projectDetailsJson text NULL;
