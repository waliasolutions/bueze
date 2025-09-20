-- Create additional test data with different users for realistic testing
-- First, let's create some profiles for different users
INSERT INTO profiles (
  id,
  email,
  full_name,
  first_name,
  last_name,
  role,
  canton,
  zip,
  city
) VALUES 
(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'max.mueller@example.com',
  'Max Müller',
  'Max',
  'Müller',
  'homeowner'::user_role,
  'ZH'::canton,
  '8003',
  'Zürich'
),
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'maria.mueller@example.com',
  'Maria Müller',
  'Maria',
  'Müller',
  'homeowner'::user_role,
  'BE'::canton,
  '3011',
  'Bern'
),
(
  '33333333-3333-3333-3333-333333333333'::uuid,
  'hans.weber@example.com',
  'Hans Weber',
  'Hans',
  'Weber',
  'homeowner'::user_role,
  'AG'::canton,
  '5000',
  'Aarau'
)
ON CONFLICT (id) DO NOTHING;

-- Now create leads owned by these different users so Peter can purchase them
INSERT INTO leads (
  id,
  owner_id,
  title,
  description,
  category,
  budget_min,
  budget_max,
  budget_type,
  urgency,
  canton,
  zip,
  city,
  address,
  status,
  max_purchases,
  created_at
) VALUES 
(
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Elektroinstallation für neue Küche',
  'Wir renovieren unsere Küche und benötigen einen Elektriker für neue Steckdosen, Beleuchtung und den Anschluss der Geräte. Arbeiten sollten professionell und nach aktuellen Standards ausgeführt werden.',
  'elektriker'::handwerker_category,
  2500,
  4000,
  'estimate'::budget_type,
  'this_week'::urgency_level,
  'ZH'::canton,
  '8003',
  'Zürich',
  'Seefeldstrasse 22',
  'active'::lead_status,
  3,
  now() - interval '3 hours'
),
(
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Parkett verlegen im Wohnzimmer',
  'Unser Wohnzimmer (ca. 25m²) soll mit hochwertigem Parkett ausgelegt werden. Alter Teppichboden muss entfernt werden. Suchen erfahrenen Bodenleger.',
  'bodenleger'::handwerker_category,
  3500,
  6000,
  'estimate'::budget_type,
  'this_month'::urgency_level,
  'BE'::canton,
  '3011',
  'Bern',
  'Bundesgasse 15',
  'active'::lead_status,
  4,
  now() - interval '1 day'
),
(
  gen_random_uuid(),
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Gartenzaun erneuern',
  'Alter Holzzaun um unser Grundstück muss erneuert werden. Länge ca. 50 Meter. Bevorzugen modernen Aluzaun oder hochwertigen Holzzaun.',
  'zaun_torbau'::handwerker_category,
  8000,
  12000,
  'estimate'::budget_type,
  'planning'::urgency_level,
  'AG'::canton,
  '5000',
  'Aarau',
  'Gartenweg 8',
  'active'::lead_status,
  3,
  now() - interval '5 hours'
),
(
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Sanitär-Notfall: Wasserrohrbruch',
  'Akuter Wasserrohrbruch im Keller! Wasser läuft und muss sofort repariert werden. Brauchen dringend einen Sanitär-Profi der heute noch kommen kann.',
  'sanitaer'::handwerker_category,
  500,
  2000,
  'estimate'::budget_type,
  'today'::urgency_level,
  'ZH'::canton,
  '8003',
  'Zürich',
  'Seefeldstrasse 22',
  'active'::lead_status,
  2,
  now() - interval '30 minutes'
);