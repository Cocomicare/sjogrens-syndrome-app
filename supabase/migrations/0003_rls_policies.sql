-- Row Level Security policies.
-- General model:
--   * super_admin        -> full access everywhere
--   * clinic_admin       -> full access within own clinic
--   * doctor             -> read clinical data for own clinic's patients,
--                           write appointments/notes/reports
--   * patient_family     -> read/write only their own linked patient's data
--
-- Privileged writes that cross these boundaries (invite redemption, signal
-- calculation, account provisioning) are performed server-side with the
-- Supabase service role key, which bypasses RLS entirely.

alter table clinics enable row level security;
alter table profiles enable row level security;
alter table patients enable row level security;
alter table patient_invites enable row level security;
alter table appointments enable row level security;
alter table symptom_definitions enable row level security;
alter table patient_symptom_settings enable row level security;
alter table daily_checkins enable row level security;
alter table symptom_entries enable row level security;
alter table family_observation_entries enable row level security;
alter table symptom_baselines enable row level security;
alter table symptom_signals enable row level security;
alter table medications enable row level security;
alter table medication_entries enable row level security;
alter table reports enable row level security;
alter table audit_logs enable row level security;
alter table subscriptions enable row level security;

-- ---------------------------------------------------------------------------
-- clinics
-- ---------------------------------------------------------------------------

create policy clinics_select on clinics for select
  using (app_is_super_admin() or id = app_current_clinic_id());

create policy clinics_write_super_admin on clinics for all
  using (app_is_super_admin())
  with check (app_is_super_admin());

create policy clinics_update_own_admin on clinics for update
  using (app_is_clinic_admin() and id = app_current_clinic_id())
  with check (app_is_clinic_admin() and id = app_current_clinic_id());

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy profiles_select_self on profiles for select
  using (
    auth_user_id = auth.uid()
    or app_is_super_admin()
    or (app_is_clinic_admin() and clinic_id = app_current_clinic_id())
    or (app_is_doctor() and clinic_id = app_current_clinic_id())
  );

create policy profiles_update_self on profiles for update
  using (auth_user_id = auth.uid() or app_is_super_admin())
  with check (auth_user_id = auth.uid() or app_is_super_admin());

create policy profiles_write_admin on profiles for insert
  with check (app_is_super_admin() or app_is_clinic_admin());

create policy profiles_delete_admin on profiles for delete
  using (app_is_super_admin());

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------

create policy patients_select on patients for select
  using (
    app_is_super_admin()
    or ((app_is_clinic_admin() or app_is_doctor()) and clinic_id = app_current_clinic_id())
    or (app_is_patient_family() and patient_family_profile_id = app_current_profile_id())
  );

create policy patients_write_staff on patients for insert
  with check (
    app_is_super_admin()
    or (app_is_clinic_admin() and clinic_id = app_current_clinic_id())
  );

create policy patients_update_staff on patients for update
  using (
    app_is_super_admin()
    or ((app_is_clinic_admin() or app_is_doctor()) and clinic_id = app_current_clinic_id())
  )
  with check (
    app_is_super_admin()
    or ((app_is_clinic_admin() or app_is_doctor()) and clinic_id = app_current_clinic_id())
  );

create policy patients_delete_staff on patients for delete
  using (app_is_super_admin() or (app_is_clinic_admin() and clinic_id = app_current_clinic_id()));

-- ---------------------------------------------------------------------------
-- patient_invites (staff only; redemption happens server-side)
-- ---------------------------------------------------------------------------

create policy patient_invites_staff on patient_invites for all
  using (
    app_is_super_admin()
    or ((app_is_clinic_admin() or app_is_doctor()) and clinic_id = app_current_clinic_id())
  )
  with check (
    app_is_super_admin()
    or ((app_is_clinic_admin() or app_is_doctor()) and clinic_id = app_current_clinic_id())
  );

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------

create policy appointments_select on appointments for select
  using (app_can_access_patient(patient_id));

create policy appointments_write_staff on appointments for insert
  with check (
    app_is_super_admin()
    or ((app_is_clinic_admin() or app_is_doctor()) and clinic_id = app_current_clinic_id())
  );

create policy appointments_update_staff on appointments for update
  using (
    app_is_super_admin()
    or ((app_is_clinic_admin() or app_is_doctor()) and clinic_id = app_current_clinic_id())
  )
  with check (
    app_is_super_admin()
    or ((app_is_clinic_admin() or app_is_doctor()) and clinic_id = app_current_clinic_id())
  );

create policy appointments_delete_staff on appointments for delete
  using (app_is_super_admin() or (app_is_clinic_admin() and clinic_id = app_current_clinic_id()));

-- ---------------------------------------------------------------------------
-- symptom_definitions (global catalog: everyone reads, only super admin writes)
-- ---------------------------------------------------------------------------

create policy symptom_definitions_select on symptom_definitions for select
  using (auth.uid() is not null);

create policy symptom_definitions_write on symptom_definitions for all
  using (app_is_super_admin())
  with check (app_is_super_admin());

-- ---------------------------------------------------------------------------
-- patient_symptom_settings
-- ---------------------------------------------------------------------------

create policy patient_symptom_settings_select on patient_symptom_settings for select
  using (app_can_access_patient(patient_id));

create policy patient_symptom_settings_write_staff on patient_symptom_settings for all
  using (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = patient_symptom_settings.patient_id
        and (app_is_clinic_admin() or app_is_doctor())
        and p.clinic_id = app_current_clinic_id()
    )
  )
  with check (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = patient_symptom_settings.patient_id
        and (app_is_clinic_admin() or app_is_doctor())
        and p.clinic_id = app_current_clinic_id()
    )
  );

-- ---------------------------------------------------------------------------
-- daily_checkins
-- ---------------------------------------------------------------------------

create policy daily_checkins_select on daily_checkins for select
  using (app_can_access_patient(patient_id));

create policy daily_checkins_write_family on daily_checkins for insert
  with check (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = daily_checkins.patient_id
        and app_is_patient_family()
        and p.patient_family_profile_id = app_current_profile_id()
    )
  );

create policy daily_checkins_update_family on daily_checkins for update
  using (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = daily_checkins.patient_id
        and app_is_patient_family()
        and p.patient_family_profile_id = app_current_profile_id()
    )
  )
  with check (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = daily_checkins.patient_id
        and app_is_patient_family()
        and p.patient_family_profile_id = app_current_profile_id()
    )
  );

-- ---------------------------------------------------------------------------
-- symptom_entries
-- ---------------------------------------------------------------------------

create policy symptom_entries_select on symptom_entries for select
  using (app_can_access_patient(patient_id));

create policy symptom_entries_write_family on symptom_entries for insert
  with check (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = symptom_entries.patient_id
        and app_is_patient_family()
        and p.patient_family_profile_id = app_current_profile_id()
    )
  );

create policy symptom_entries_update_family on symptom_entries for update
  using (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = symptom_entries.patient_id
        and app_is_patient_family()
        and p.patient_family_profile_id = app_current_profile_id()
    )
  )
  with check (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = symptom_entries.patient_id
        and app_is_patient_family()
        and p.patient_family_profile_id = app_current_profile_id()
    )
  );

-- ---------------------------------------------------------------------------
-- family_observation_entries
-- ---------------------------------------------------------------------------

create policy family_observation_entries_select on family_observation_entries for select
  using (app_can_access_patient(patient_id));

create policy family_observation_entries_write_family on family_observation_entries for insert
  with check (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = family_observation_entries.patient_id
        and app_is_patient_family()
        and p.patient_family_profile_id = app_current_profile_id()
    )
  );

create policy family_observation_entries_update_family on family_observation_entries for update
  using (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = family_observation_entries.patient_id
        and app_is_patient_family()
        and p.patient_family_profile_id = app_current_profile_id()
    )
  )
  with check (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = family_observation_entries.patient_id
        and app_is_patient_family()
        and p.patient_family_profile_id = app_current_profile_id()
    )
  );

-- ---------------------------------------------------------------------------
-- symptom_baselines / symptom_signals (system-calculated, read-only to users)
-- ---------------------------------------------------------------------------

create policy symptom_baselines_select on symptom_baselines for select
  using (app_can_access_patient(patient_id));

create policy symptom_signals_select on symptom_signals for select
  using (app_can_access_patient(patient_id));

-- ---------------------------------------------------------------------------
-- medications / medication_entries
-- ---------------------------------------------------------------------------

create policy medications_select on medications for select
  using (app_can_access_patient(patient_id));

create policy medications_write_staff on medications for all
  using (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = medications.patient_id
        and (app_is_clinic_admin() or app_is_doctor())
        and p.clinic_id = app_current_clinic_id()
    )
  )
  with check (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = medications.patient_id
        and (app_is_clinic_admin() or app_is_doctor())
        and p.clinic_id = app_current_clinic_id()
    )
  );

create policy medication_entries_select on medication_entries for select
  using (app_can_access_patient(patient_id));

create policy medication_entries_write_family on medication_entries for insert
  with check (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = medication_entries.patient_id
        and app_is_patient_family()
        and p.patient_family_profile_id = app_current_profile_id()
    )
  );

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------

create policy reports_select on reports for select
  using (app_can_access_patient(patient_id));

create policy reports_write_staff on reports for insert
  with check (
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = reports.patient_id
        and (app_is_clinic_admin() or app_is_doctor())
        and p.clinic_id = app_current_clinic_id()
    )
  );

-- ---------------------------------------------------------------------------
-- audit_logs (append-only; readable by clinic/super admins)
-- ---------------------------------------------------------------------------

create policy audit_logs_insert on audit_logs for insert
  with check (auth.uid() is not null);

create policy audit_logs_select on audit_logs for select
  using (
    app_is_super_admin()
    or (app_is_clinic_admin() and clinic_id = app_current_clinic_id())
  );

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------

create policy subscriptions_select on subscriptions for select
  using (
    app_is_super_admin()
    or (app_is_clinic_admin() and clinic_id = app_current_clinic_id())
  );

create policy subscriptions_write_super_admin on subscriptions for all
  using (app_is_super_admin())
  with check (app_is_super_admin());
