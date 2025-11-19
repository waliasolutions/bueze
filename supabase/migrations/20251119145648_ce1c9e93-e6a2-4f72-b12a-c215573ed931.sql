-- Update existing subcategory leads to use major categories
-- This provides immediate compatibility with the new simplified category system

-- Update bathroom/sanitaer subcategories to major category
UPDATE leads
SET category = 'sanitaer'
WHERE category IN ('badezimmer', 'badewanne_dusche', 'klempnerarbeiten', 'sanitaer_sonstige');