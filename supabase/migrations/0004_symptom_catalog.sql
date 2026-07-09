-- Baseline symptom catalog. This is reference/configuration data (not demo
-- patient data), so it ships as a migration rather than the demo seed script.

insert into symptom_definitions
  (name, patient_label, clinical_label, category, default_weight, is_core, is_optional, is_safety_flag, sort_order)
values
  ('eye_dryness',        'Eye dryness',        'Ocular dryness',        'core', 1.0, true,  false, false, 10),
  ('mouth_dryness',      'Mouth dryness',      'Xerostomia',            'core', 1.0, true,  false, false, 20),
  ('energy_level',       'Energy level',       'Fatigue',               'core', 2.0, true,  false, false, 30),
  ('joint_pain',         'Aches / joint pain', 'Arthralgia',            'core', 2.0, true,  false, false, 40),
  ('muscle_pain',        'Muscle pain',        'Myalgia',               'core', 1.5, true,  false, false, 50),
  ('thinking_focus',     'Thinking / focus',   'Cognitive fog',         'core', 1.5, true,  false, false, 60),
  ('overall_wellness',   'How was your day?',  'Overall wellness',      'core', 1.5, true,  false, false, 70),

  ('dry_nose',           'Dry nose',           'Nasal dryness',                'optional', 1.0, false, true, false, 100),
  ('dry_skin',           'Dry skin',           'Xerosis',                      'optional', 1.0, false, true, false, 110),
  ('swallowing',         'Difficulty swallowing', 'Dysphagia',                 'optional', 1.5, false, true, false, 120),
  ('swollen_glands',     'Swollen glands',     'Parotid / salivary gland swelling', 'optional', 2.5, false, true, false, 130),
  ('cough',              'Cough',              'Cough',                        'optional', 1.0, false, true, false, 140),
  ('hoarseness',         'Hoarseness',         'Dysphonia',                    'optional', 1.0, false, true, false, 150),
  ('mouth_sores',        'Mouth sores',        'Oral ulceration',              'optional', 1.5, false, true, false, 160),
  ('tingling_numbness',  'Tingling / numbness','Paresthesia',                  'optional', 1.5, false, true, false, 170),
  ('raynauds',           'Raynaud''s symptoms','Raynaud phenomenon',           'optional', 1.5, false, true, false, 180),
  ('rash_skin_changes',  'Rash / skin changes','Cutaneous vasculitis / rash',  'optional', 1.5, false, true, false, 190),
  ('headache',           'Headache',           'Headache',                     'optional', 1.0, false, true, false, 200),

  ('fever',               'Fever',                 'Fever',                       'safety', 0, false, true, true, 300),
  ('shortness_of_breath', 'Shortness of breath',   'Dyspnea',                     'safety', 0, false, true, true, 310),
  ('chest_pain',          'Chest pain',            'Chest pain',                  'safety', 0, false, true, true, 320),
  ('vision_changes',      'Sudden vision changes', 'Acute visual disturbance',    'safety', 0, false, true, true, 330),
  ('neurologic_symptoms', 'New neurologic symptoms','New focal neurologic deficit','safety', 0, false, true, true, 340),
  ('severe_swelling',     'Severe swelling',       'Severe lymphadenopathy / edema','safety', 0, false, true, true, 350);
