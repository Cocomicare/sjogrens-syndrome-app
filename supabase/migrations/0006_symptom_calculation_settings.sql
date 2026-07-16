-- ---------------------------------------------------------------------------
-- Per-symptom composite-score calculation method: a catalog-level default,
-- with an optional per-patient override (null = inherit the catalog default).
-- ---------------------------------------------------------------------------

create type calculation_method as enum ('average', 'stddev');

alter table symptom_definitions
  add column default_calculation_method calculation_method not null default 'average';

alter table patient_symptom_settings
  add column calculation_method calculation_method;
