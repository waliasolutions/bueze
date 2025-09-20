-- Fix lead ownership by distributing existing leads among homeowner profiles

-- Update leads to be owned by different homeowners
UPDATE leads 
SET owner_id = (
  SELECT id FROM profiles 
  WHERE role = 'homeowner' 
  ORDER BY created_at 
  LIMIT 1 OFFSET 0
)
WHERE title = 'Badezimmer sanieren';

UPDATE leads 
SET owner_id = (
  SELECT id FROM profiles 
  WHERE role = 'homeowner' 
  ORDER BY created_at 
  LIMIT 1 OFFSET 1
)
WHERE title = 'Heizung modernisieren';

UPDATE leads 
SET owner_id = (
  SELECT id FROM profiles 
  WHERE role = 'homeowner' 
  ORDER BY created_at 
  LIMIT 1 OFFSET 2
)
WHERE title = 'Dach reparieren nach Sturm';

UPDATE leads 
SET owner_id = (
  SELECT id FROM profiles 
  WHERE role = 'homeowner' 
  ORDER BY created_at 
  LIMIT 1 OFFSET 3
)
WHERE title = 'Küche komplett renovieren';