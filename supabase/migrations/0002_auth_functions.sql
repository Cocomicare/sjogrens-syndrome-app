-- Helper functions used by RLS policies.
-- SECURITY DEFINER + fixed search_path so they can read `profiles` without
-- being subject to (and recursing into) the RLS policies defined on it.

create or replace function app_current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from profiles where auth_user_id = auth.uid();
$$;

create or replace function app_current_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where auth_user_id = auth.uid();
$$;

create or replace function app_current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from profiles where auth_user_id = auth.uid();
$$;

create or replace function app_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(app_current_role() = 'super_admin', false);
$$;

create or replace function app_is_clinic_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(app_current_role() = 'clinic_admin', false);
$$;

create or replace function app_is_doctor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(app_current_role() = 'doctor', false);
$$;

create or replace function app_is_patient_family()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(app_current_role() = 'patient_family', false);
$$;

-- True if the current user (doctor/clinic_admin/super_admin) may view
-- clinical data for the given patient.
create or replace function app_can_access_patient(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    app_is_super_admin()
    or exists (
      select 1 from patients p
      where p.id = target_patient_id
        and (
          (app_is_clinic_admin() and p.clinic_id = app_current_clinic_id())
          or (app_is_doctor() and p.clinic_id = app_current_clinic_id())
          or (app_is_patient_family() and p.patient_family_profile_id = app_current_profile_id())
        )
    );
$$;
