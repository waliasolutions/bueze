-- Let's create test users properly by updating some existing leads to have different mock owners
-- We'll create some mock UUIDs that represent different users and update existing leads

-- Update some of Peter's existing leads to have different owners for testing
-- This simulates leads created by other users that Peter can purchase

UPDATE leads 
SET 
  owner_id = '11111111-1111-1111-1111-111111111111'::uuid,
  title = 'Elektroinstallation für neue Küche',
  description = 'Wir renovieren unsere Küche und benötigen einen Elektriker für neue Steckdosen, Beleuchtung und den Anschluss der Geräte. Arbeiten sollten professionell und nach aktuellen Standards ausgeführt werden.',
  category = 'elektriker'::handwerker_category,
  budget_min = 2500,
  budget_max = 4000,
  canton = 'ZH'::canton,
  zip = '8003',
  city = 'Zürich',
  address = 'Seefeldstrasse 22',
  urgency = 'this_week'::urgency_level
WHERE title = 'Küche komplett renovieren';

UPDATE leads 
SET 
  owner_id = '22222222-2222-2222-2222-222222222222'::uuid,
  title = 'Parkett verlegen im Wohnzimmer',
  description = 'Unser Wohnzimmer (ca. 25m²) soll mit hochwertigem Parkett ausgelegt werden. Alter Teppichboden muss entfernt werden. Suchen erfahrenen Bodenleger.',
  category = 'bodenleger'::handwerker_category,
  budget_min = 3500,
  budget_max = 6000,
  canton = 'BE'::canton,
  zip = '3011',
  city = 'Bern',
  address = 'Bundesgasse 15',
  urgency = 'this_month'::urgency_level
WHERE title = 'Badezimmer sanieren';

-- Also create mock profile entries for these users (without violating foreign key constraints)
-- These will be used for display purposes when leads are purchased
INSERT INTO profiles (
  id,
  email,
  full_name,
  first_name,
  last_name,
  role,
  canton,
  zip,
  city,
  phone
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
  'Zürich',
  '+41 44 123 45 67'
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
  'Bern',
  '+41 31 987 65 43'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone;