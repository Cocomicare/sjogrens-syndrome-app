/**
 * Demo/dev seed script.
 *
 * Creates one clinic, a super admin, a clinic admin, Dr. Ben, four patients
 * with linked patient/family accounts, appointment history, and 100+ days of
 * daily check-ins (including stable periods, elevated periods, missed
 * entries, family observations, and one safety-flag example) — then runs
 * the real signal engine over every day so baselines/signals match what the
 * app would compute live.
 *
 * Usage: npm run seed   (requires .env.local with Supabase project + service role key)
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";
import type { Database, SymptomDefinition } from "../src/lib/types/database";
import { recalculateSignalForPatientDate } from "../src/lib/signal/service";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local first.");
  process.exit(1);
}

const admin: SupabaseClient<Database> = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CLINIC_NAME = "Golden Gate Pediatric Rheumatology";
const DEV_PASSWORD = "DevPassword123!";
const HISTORY_DAYS = 100; // seeds HISTORY_DAYS + 1 (today) days of check-ins

const CORE_KEYS = [
  "eye_dryness",
  "mouth_dryness",
  "energy_level",
  "joint_pain",
  "muscle_pain",
  "thinking_focus",
  "overall_wellness",
] as const;
type CoreKey = (typeof CORE_KEYS)[number];

type FamilyKey =
  | "missed_school"
  | "reduced_activity"
  | "poor_sleep"
  | "appetite_change"
  | "visible_discomfort"
  | "medication_missed"
  | "other_concern";

interface ElevatedWindow {
  startOffset: number; // days ago, further in the past (larger number)
  endOffset: number; // days ago, closer to today (smaller number)
  boost: Partial<Record<CoreKey, number>>;
  familyFlags?: FamilyKey[];
  note?: string;
}

interface OptionalOccurrence {
  symptomName: string;
  offsets: number[];
  score: number;
}

interface SafetyFlagDay {
  symptomName: string;
  offset: number;
}

interface Archetype {
  firstName: string;
  lastName: string;
  dob: string;
  sex: string;
  emailPrefix: string;
  coreBaseline: Record<CoreKey, number>;
  noise: number;
  completionRate: number;
  elevatedWindows: ElevatedWindow[];
  optionalOccurrences: OptionalOccurrence[];
  safetyFlagDays: SafetyFlagDay[];
  appointmentOffsets: number[]; // positive = past, negative = future
}

const ARCHETYPES: Archetype[] = [
  {
    firstName: "Kokomi",
    lastName: "K.",
    dob: "2013-04-12",
    sex: "female",
    emailPrefix: "kokomi.family",
    coreBaseline: { eye_dryness: 4, mouth_dryness: 4, energy_level: 4, joint_pain: 3, muscle_pain: 2, thinking_focus: 3, overall_wellness: 3 },
    noise: 1.2,
    completionRate: 0.9,
    elevatedWindows: [
      {
        startOffset: 13,
        endOffset: 10,
        boost: { energy_level: 4, joint_pain: 4, overall_wellness: 3 },
        familyFlags: ["missed_school", "poor_sleep"],
        note: "Really tired and achy this week, stayed home from school twice.",
      },
    ],
    optionalOccurrences: [{ symptomName: "swollen_glands", offsets: [12, 11], score: 4 }],
    safetyFlagDays: [{ symptomName: "fever", offset: 3 }],
    appointmentOffsets: [42, -35],
  },
  {
    firstName: "Emma",
    lastName: "R.",
    dob: "2011-09-03",
    sex: "female",
    emailPrefix: "emma.family",
    coreBaseline: { eye_dryness: 2, mouth_dryness: 2, energy_level: 2, joint_pain: 1, muscle_pain: 1, thinking_focus: 2, overall_wellness: 4 },
    noise: 0.8,
    completionRate: 0.95,
    elevatedWindows: [
      {
        startOffset: 55,
        endOffset: 53,
        boost: { eye_dryness: 3, mouth_dryness: 2 },
        note: "Complained her eyes felt extra gritty.",
      },
    ],
    optionalOccurrences: [{ symptomName: "headache", offsets: [20, 21], score: 3 }],
    safetyFlagDays: [],
    appointmentOffsets: [81, -21],
  },
  {
    firstName: "Lucas",
    lastName: "M.",
    dob: "2014-01-27",
    sex: "male",
    emailPrefix: "lucas.family",
    coreBaseline: { eye_dryness: 3, mouth_dryness: 3, energy_level: 3, joint_pain: 2, muscle_pain: 2, thinking_focus: 2, overall_wellness: 3 },
    noise: 1.0,
    completionRate: 0.65,
    elevatedWindows: [
      {
        startOffset: 30,
        endOffset: 27,
        boost: { mouth_dryness: 3, joint_pain: 3 },
        familyFlags: ["medication_missed", "reduced_activity"],
        note: "Forgot two doses of medication this week; less active than usual.",
      },
    ],
    optionalOccurrences: [{ symptomName: "swallowing", offsets: [29, 28, 27], score: 4 }],
    safetyFlagDays: [],
    appointmentOffsets: [117, -60],
  },
  {
    firstName: "Sophia",
    lastName: "T.",
    dob: "2012-11-19",
    sex: "female",
    emailPrefix: "sophia.family",
    coreBaseline: { eye_dryness: 2, mouth_dryness: 3, energy_level: 3, joint_pain: 2, muscle_pain: 1, thinking_focus: 2, overall_wellness: 3 },
    noise: 0.9,
    completionRate: 0.92,
    elevatedWindows: [
      {
        startOffset: 68,
        endOffset: 65,
        boost: { energy_level: 3, thinking_focus: 3, muscle_pain: 3 },
        familyFlags: ["poor_sleep", "visible_discomfort"],
        note: "Seemed foggy and sore for a few days, sleeping poorly.",
      },
    ],
    optionalOccurrences: [{ symptomName: "raynauds", offsets: [10, 9, 8], score: 3 }],
    safetyFlagDays: [],
    appointmentOffsets: [58, -14],
  },
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(10, Math.round(n)));
}

async function resetExistingDemoClinic() {
  const { data: existing } = await admin.from("clinics").select("id").eq("name", CLINIC_NAME).maybeSingle();
  if (!existing) return;

  const { data: profiles } = await admin.from("profiles").select("id, auth_user_id").eq("clinic_id", existing.id);
  for (const profile of profiles ?? []) {
    await admin.auth.admin.deleteUser(profile.auth_user_id).catch(() => {});
  }
  await admin.from("clinics").delete().eq("id", existing.id);
  console.log(`Removed existing demo clinic "${CLINIC_NAME}" and its users.`);
}

async function createAuthProfile(params: {
  email: string;
  firstName: string;
  lastName: string;
  role: Database["public"]["Tables"]["profiles"]["Row"]["role"];
  clinicId: string | null;
}) {
  const { data: created, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: DEV_PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: params.firstName, last_name: params.lastName },
  });
  if (error || !created.user) throw new Error(`Could not create auth user for ${params.email}: ${error?.message}`);

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      auth_user_id: created.user.id,
      clinic_id: params.clinicId,
      role: params.role,
      first_name: params.firstName,
      last_name: params.lastName,
      email: params.email,
    })
    .select()
    .single();
  if (profileError || !profile) throw new Error(`Could not create profile for ${params.email}: ${profileError?.message}`);

  return profile;
}

function buildDayPlan(archetype: Archetype, offset: number, rng: () => number, definitionByName: Map<string, SymptomDefinition>) {
  const window = archetype.elevatedWindows.find((w) => offset <= w.startOffset && offset >= w.endOffset);

  const core: Record<string, number> = {};
  for (const key of CORE_KEYS) {
    const base = archetype.coreBaseline[key];
    const boost = window?.boost[key] ?? 0;
    const noiseVal = (rng() - 0.5) * 2 * archetype.noise;
    core[key] = clampScore(base + boost + noiseVal);
  }

  const avgCore = CORE_KEYS.reduce((sum, k) => sum + core[k], 0) / CORE_KEYS.length;
  const overallFeeling = Math.max(0, Math.min(4, 4 - Math.round(avgCore / 2.5)));

  const optional: Record<string, number> = {};
  for (const occ of archetype.optionalOccurrences) {
    if (occ.offsets.includes(offset)) {
      const def = definitionByName.get(occ.symptomName);
      if (def) optional[def.id] = clampScore(occ.score + (rng() - 0.5) * 1.5);
    }
  }

  const safetyPresent: string[] = [];
  for (const flag of archetype.safetyFlagDays) {
    if (flag.offset === offset) {
      const def = definitionByName.get(flag.symptomName);
      if (def) safetyPresent.push(def.id);
    }
  }

  const family: Partial<Record<FamilyKey, boolean>> = {};
  let familyNote: string | undefined;
  if (window?.familyFlags && offset === window.startOffset) {
    for (const flag of window.familyFlags) family[flag] = true;
    familyNote = window.note;
  }

  const coreByDefinitionId: Record<string, number> = {};
  for (const key of CORE_KEYS) {
    const def = definitionByName.get(key);
    if (def) coreByDefinitionId[def.id] = core[key];
  }

  return { coreByDefinitionId, optional, safetyPresent, overallFeeling, family, familyNote };
}

async function seedPatientCheckins(
  archetype: Archetype,
  patientId: string,
  familyProfileId: string,
  definitionByName: Map<string, SymptomDefinition>
) {
  const rng = mulberry32(hashSeed(archetype.emailPrefix));
  const today = new Date();

  for (let offset = HISTORY_DAYS; offset >= 0; offset--) {
    if (rng() > archetype.completionRate) continue; // simulate a missed check-in

    const entryDate = format(subDays(today, offset), "yyyy-MM-dd");
    const plan = buildDayPlan(archetype, offset, rng, definitionByName);

    const { data: checkin, error: checkinError } = await admin
      .from("daily_checkins")
      .insert({
        patient_id: patientId,
        entered_by_profile_id: familyProfileId,
        entry_date: entryDate,
        overall_feeling: plan.overallFeeling,
        completed_at: new Date(entryDate).toISOString(),
      })
      .select()
      .single();
    if (checkinError || !checkin) {
      console.warn(`  ! skipped ${entryDate}: ${checkinError?.message}`);
      continue;
    }

    const entries = [
      ...Object.entries(plan.coreByDefinitionId).map(([symptom_definition_id, score]) => ({
        daily_checkin_id: checkin.id,
        patient_id: patientId,
        symptom_definition_id,
        score,
        is_present: true,
      })),
      ...Object.entries(plan.optional).map(([symptom_definition_id, score]) => ({
        daily_checkin_id: checkin.id,
        patient_id: patientId,
        symptom_definition_id,
        score,
        is_present: true,
      })),
      ...plan.safetyPresent.map((symptom_definition_id) => ({
        daily_checkin_id: checkin.id,
        patient_id: patientId,
        symptom_definition_id,
        score: null,
        is_present: true,
      })),
    ];
    if (entries.length > 0) await admin.from("symptom_entries").insert(entries);

    if (Object.keys(plan.family).length > 0 || plan.familyNote) {
      await admin.from("family_observation_entries").insert({
        daily_checkin_id: checkin.id,
        patient_id: patientId,
        missed_school: !!plan.family.missed_school,
        reduced_activity: !!plan.family.reduced_activity,
        poor_sleep: !!plan.family.poor_sleep,
        appetite_change: !!plan.family.appetite_change,
        visible_discomfort: !!plan.family.visible_discomfort,
        medication_missed: !!plan.family.medication_missed,
        other_concern: !!plan.family.other_concern,
        notes: plan.familyNote ?? null,
      });
    }

    await recalculateSignalForPatientDate(admin, patientId, entryDate);
  }
}

async function main() {
  console.log("Seeding Sjögren's Signal demo data...");

  await resetExistingDemoClinic();

  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .insert({ name: CLINIC_NAME, address: "500 Bayview Ave, Naples, FL", phone: "(239) 555-0142" })
    .select()
    .single();
  if (clinicError || !clinic) throw new Error(`Could not create clinic: ${clinicError?.message}`);
  console.log(`Created clinic: ${clinic.name}`);

  const superAdmin = await createAuthProfile({
    email: "super.admin@example.com",
    firstName: "Ada",
    lastName: "Admin",
    role: "super_admin",
    clinicId: null,
  });
  console.log(`Created super admin: ${superAdmin.email} / ${DEV_PASSWORD}`);

  const clinicAdmin = await createAuthProfile({
    email: "clinic.admin@example.com",
    firstName: "Carol",
    lastName: "Chen",
    role: "clinic_admin",
    clinicId: clinic.id,
  });
  console.log(`Created clinic admin: ${clinicAdmin.email} / ${DEV_PASSWORD}`);

  const drBen = await createAuthProfile({
    email: "dr.ben@example.com",
    firstName: "Ben",
    lastName: "Nguyen",
    role: "doctor",
    clinicId: clinic.id,
  });
  console.log(`Created doctor: ${drBen.email} / ${DEV_PASSWORD}`);

  const { data: definitions } = await admin.from("symptom_definitions").select("*");
  if (!definitions || definitions.length === 0) {
    throw new Error("No symptom_definitions found. Run the migrations (including 0004_symptom_catalog.sql) first.");
  }
  const definitionByName = new Map(definitions.map((d) => [d.name, d]));

  for (const archetype of ARCHETYPES) {
    console.log(`Seeding patient: ${archetype.firstName} ${archetype.lastName}`);

    const familyProfile = await createAuthProfile({
      email: `${archetype.emailPrefix}@example.com`,
      firstName: archetype.firstName,
      lastName: `${archetype.lastName.replace(".", "")} Family`,
      role: "patient_family",
      clinicId: clinic.id,
    });

    const { data: patient, error: patientError } = await admin
      .from("patients")
      .insert({
        clinic_id: clinic.id,
        primary_doctor_id: drBen.id,
        patient_family_profile_id: familyProfile.id,
        first_name: archetype.firstName,
        last_name: archetype.lastName,
        date_of_birth: archetype.dob,
        sex: archetype.sex,
        diagnosis_notes: "Pediatric Sjögren's syndrome (seed data).",
      })
      .select()
      .single();
    if (patientError || !patient) throw new Error(`Could not create patient: ${patientError?.message}`);

    for (const offset of archetype.appointmentOffsets) {
      const appointmentDate = format(subDays(new Date(), offset), "yyyy-MM-dd");
      await admin.from("appointments").insert({
        patient_id: patient.id,
        clinic_id: clinic.id,
        doctor_id: drBen.id,
        appointment_date: appointmentDate,
        appointment_type: offset > 0 ? "Follow-up" : "Scheduled follow-up",
        notes: offset > 0 ? "Routine rheumatology follow-up." : null,
      });
    }

    await seedPatientCheckins(archetype, patient.id, familyProfile.id, definitionByName);
    console.log(`  ✓ ${archetype.firstName} ${archetype.lastName}: ${HISTORY_DAYS + 1} days of history seeded (login: ${familyProfile.email} / ${DEV_PASSWORD})`);
  }

  console.log("\nSeed complete.");
  console.log(`All accounts use the password: ${DEV_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
