-- Allow patients to submit more than one check-in per day (e.g. morning and evening entries).
alter table daily_checkins drop constraint daily_checkins_patient_id_entry_date_key;

-- Keep date-range lookups fast now that the unique constraint's implicit index is gone.
create index if not exists daily_checkins_patient_id_entry_date_idx
  on daily_checkins (patient_id, entry_date);
