-- ---------------------------------------------------------------------------
-- Rescale symptom weights into percentage-style numbers (0-100) for clearer
-- doctor-facing display. The composite-score math is a normalized weighted
-- average (weightedDeviationSum / weightSum), so uniformly scaling every
-- weight by the same factor does not change any computed score — this is a
-- presentation-only rescale, not a change to the underlying calculation.
-- ---------------------------------------------------------------------------

alter table symptom_definitions alter column default_weight type numeric(5,2);
alter table patient_symptom_settings alter column custom_weight type numeric(5,2);

update symptom_definitions set default_weight = default_weight * 10;
update patient_symptom_settings set custom_weight = custom_weight * 10 where custom_weight is not null;
