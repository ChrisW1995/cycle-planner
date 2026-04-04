-- Add tabs_per_box for oral drugs (number of tablets per box)
-- inventory_count for oral drugs stores total tablet count
ALTER TABLE drugs ADD COLUMN tabs_per_box INTEGER;
