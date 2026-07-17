-- ---------------------------------------------------------------------------
-- Stop asking patients about safety-flag symptoms (fever, chest pain, etc.)
-- in new check-ins. Deactivating via active_status (the same mechanism the
-- admin symptom catalog already exposes) rather than deleting the rows,
-- since symptom_entries/symptom_signals reference them and deleting would
-- cascade-erase historical data. Existing historical entries and the
-- "Safety flag" categorization they produced are unaffected.
-- ---------------------------------------------------------------------------

update symptom_definitions
set active_status = false
where is_safety_flag = true;
