-- ---------------------------------------------------------------------------
-- Rescale symptom_entries.score from its old 0-10 raw representative-score
-- range down to the 1-5 scale that the check-in UI, charts, and reports
-- already display everywhere (1 = Severe ... 5 = None). The check-in UI only
-- ever writes one of 5 discrete values, so this makes storage match reality
-- instead of maintaining a separate internal 0-10 representation.
--
-- Mapping matches the existing severityBand() thresholds exactly:
--   0        -> none        -> 5
--   1-3      -> mild        -> 4
--   4-6      -> moderate    -> 3
--   7-8      -> significant -> 2
--   9-10     -> severe      -> 1
-- ---------------------------------------------------------------------------

alter table symptom_entries drop constraint symptom_entries_score_check;

update symptom_entries
set score = case
  when score = 0 then 5
  when score between 1 and 3 then 4
  when score between 4 and 6 then 3
  when score between 7 and 8 then 2
  when score between 9 and 10 then 1
end
where score is not null;

alter table symptom_entries add constraint symptom_entries_score_check check (score between 1 and 5);
