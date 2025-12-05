
-- Create Stefan Warm's handwerker profile with approved status
INSERT INTO handwerker_profiles (
  user_id, 
  first_name, 
  last_name, 
  email, 
  categories, 
  service_areas, 
  verification_status, 
  is_verified,
  bio,
  business_canton,
  business_city,
  business_zip
) VALUES (
  'e9fce343-ce09-4347-8c81-dd403e9d27cf',
  'Stefan',
  'Warm',
  'heizung@test.ch',
  ARRAY['heizung_klima']::handwerker_category[],
  ARRAY['ZH', '8000']::text[],
  'approved',
  true,
  'Spezialist für Heizungstechnik und Klimaanlagen',
  'ZH',
  'Zürich',
  '8000'
);

-- Update his subscription to simulate exhausted quota (5/5 proposals)
UPDATE handwerker_subscriptions 
SET proposals_used_this_period = 5 
WHERE user_id = 'e9fce343-ce09-4347-8c81-dd403e9d27cf';
