-- Add new oral drug templates
INSERT INTO drug_templates (generic_name, short_name, brand_names, primary_category, sub_category, ester_type, default_concentration, default_unit) VALUES
('Mesterolone', 'Proviron', ARRAY['Proviron'], 'Oral', 'DHT', NULL, 25, 'mg/tab'),
('Methyl-1-Testosterone', 'M1T', NULL, 'Oral', 'DHT', NULL, 10, 'mg/tab');

-- Reclassify Clen, T3, T4 from PCT-Other to Oral-Other
UPDATE drug_templates SET primary_category = 'Oral', sub_category = 'Other' WHERE short_name IN ('Clen', 'T3', 'T4');
