-- Add optional brand column to drugs table
ALTER TABLE drugs ADD COLUMN brand TEXT;
CREATE INDEX idx_drugs_brand ON drugs(brand);
