-- ==================== Drug Templates Seed Data ====================
-- All known compounds for quick drug creation

-- ========== Injectable - Test 類 ==========
INSERT INTO drug_templates (generic_name, short_name, brand_names, primary_category, sub_category, ester_type, default_concentration, default_unit) VALUES
('Testosterone Enanthate', 'TestE', ARRAY['Delatestryl'], 'Injectable', 'Test', 'Long', 300, 'mg/ml'),
('Testosterone Cypionate', 'TestC', ARRAY['Depo-Testosterone'], 'Injectable', 'Test', 'Long', 250, 'mg/ml'),
('Testosterone Propionate', 'TestP', ARRAY['Testoviron'], 'Injectable', 'Test', 'Short', 100, 'mg/ml'),
('Sustanon 250', 'Sust', ARRAY['Sustanon'], 'Injectable', 'Test', 'Long', 250, 'mg/ml'),
('Testosterone Undecanoate', 'TestU', ARRAY['Nebido', 'Aveed'], 'Injectable', 'Test', 'Long', 250, 'mg/ml');

-- ========== Injectable - Nor-19 類 ==========
INSERT INTO drug_templates (generic_name, short_name, brand_names, primary_category, sub_category, ester_type, default_concentration, default_unit) VALUES
('Nandrolone Decanoate', 'Deca', ARRAY['Deca-Durabolin'], 'Injectable', 'Nor-19', 'Long', 300, 'mg/ml'),
('Nandrolone Phenylpropionate', 'NPP', ARRAY['Durabolin'], 'Injectable', 'Nor-19', 'Short', 100, 'mg/ml'),
('Trenbolone Enanthate', 'TrenE', NULL, 'Injectable', 'Nor-19', 'Long', 200, 'mg/ml'),
('Trenbolone Acetate', 'TrenA', ARRAY['Finajet'], 'Injectable', 'Nor-19', 'Short', 100, 'mg/ml');

-- ========== Injectable - DHT 類 ==========
INSERT INTO drug_templates (generic_name, short_name, brand_names, primary_category, sub_category, ester_type, default_concentration, default_unit) VALUES
('Drostanolone Enanthate', 'MastE', ARRAY['Masteron Enanthate'], 'Injectable', 'DHT', 'Long', 200, 'mg/ml'),
('Drostanolone Propionate', 'MastP', ARRAY['Masteron', 'Drostanolone'], 'Injectable', 'DHT', 'Short', 100, 'mg/ml'),
('Methenolone Enanthate', 'PrimoE', ARRAY['Primobolan Depot'], 'Injectable', 'DHT', 'Long', 100, 'mg/ml'),
('Boldenone Undecylenate', 'EQ', ARRAY['Equipoise', 'Boldone'], 'Injectable', 'DHT', 'Long', 300, 'mg/ml'),
('Stanozolol Injectable', 'Winstrol (inj)', ARRAY['Winstrol Depot'], 'Injectable', 'DHT', 'Short', 50, 'mg/ml');

-- ========== Oral ==========
INSERT INTO drug_templates (generic_name, short_name, brand_names, primary_category, sub_category, ester_type, default_concentration, default_unit) VALUES
('Methandienone', 'Dbol', ARRAY['Dianabol'], 'Oral', 'Test', NULL, 10, 'mg/tab'),
('Chlorodehydromethyltestosterone', 'Tbol', ARRAY['Turinabol'], 'Oral', 'Test', NULL, 10, 'mg/tab'),
('Oxandrolone', 'Anavar', ARRAY['Anavar', 'Oxandrin'], 'Oral', 'DHT', NULL, 10, 'mg/tab'),
('Stanozolol', 'Winstrol', ARRAY['Winstrol', 'Winny'], 'Oral', 'DHT', NULL, 10, 'mg/tab'),
('Oxymetholone', 'Anadrol', ARRAY['Anadrol', 'A50'], 'Oral', 'DHT', NULL, 50, 'mg/tab'),
('Methasterone', 'Superdrol', NULL, 'Oral', 'DHT', NULL, 10, 'mg/tab'),
('Fluoxymesterone', 'Halotestin', ARRAY['Halotestin', 'Halo'], 'Oral', 'Test', NULL, 10, 'mg/tab'),
('Mesterolone', 'Proviron', ARRAY['Proviron'], 'Oral', 'DHT', NULL, 25, 'mg/tab'),
('Methyl-1-Testosterone', 'M1T', NULL, 'Oral', 'DHT', NULL, 10, 'mg/tab');

-- ========== PCT - SERM ==========
INSERT INTO drug_templates (generic_name, short_name, brand_names, primary_category, sub_category, ester_type, default_concentration, default_unit) VALUES
('Tamoxifen Citrate', 'Nolvadex', ARRAY['Nolvadex'], 'PCT', 'SERM', NULL, 20, 'mg/tab'),
('Clomiphene Citrate', 'Clomid', ARRAY['Clomid'], 'PCT', 'SERM', NULL, 50, 'mg/tab'),
('Toremifene Citrate', 'Fareston', ARRAY['Fareston'], 'PCT', 'SERM', NULL, 60, 'mg/tab');

-- ========== PCT - AI ==========
INSERT INTO drug_templates (generic_name, short_name, brand_names, primary_category, sub_category, ester_type, default_concentration, default_unit) VALUES
('Anastrozole', 'Anastrozole', ARRAY['Arimidex'], 'PCT', 'AI', NULL, 1, 'mg/tab'),
('Letrozole', 'Letrozole', ARRAY['Femara'], 'PCT', 'AI', NULL, 2.5, 'mg/tab'),
('Exemestane', 'Exemestane', ARRAY['Aromasin'], 'PCT', 'AI', NULL, 25, 'mg/tab');

-- ========== PCT - Prolactin Control ==========
INSERT INTO drug_templates (generic_name, short_name, brand_names, primary_category, sub_category, ester_type, default_concentration, default_unit) VALUES
('Cabergoline', 'Dostinex', ARRAY['Dostinex'], 'PCT', 'Prolactin', NULL, 0.5, 'mg/tab'),
('Pramipexole', 'Mirapex', ARRAY['Mirapex'], 'PCT', 'Prolactin', NULL, 0.25, 'mg/tab');

-- ========== PCT - Other ==========
INSERT INTO drug_templates (generic_name, short_name, brand_names, primary_category, sub_category, ester_type, default_concentration, default_unit) VALUES
('Human Chorionic Gonadotropin', 'HCG', NULL, 'PCT', 'Other', NULL, 5000, 'IU/vial');

-- ========== Oral - Other (非合成代謝類口服藥) ==========
INSERT INTO drug_templates (generic_name, short_name, brand_names, primary_category, sub_category, ester_type, default_concentration, default_unit) VALUES
('Clenbuterol', 'Clen', ARRAY['Spiropent'], 'Oral', 'Other', NULL, 40, 'mcg/tab'),
('Liothyronine', 'T3', ARRAY['Cytomel'], 'Oral', 'Other', NULL, 25, 'mcg/tab'),
('Levothyroxine', 'T4', ARRAY['Synthroid'], 'Oral', 'Other', NULL, 50, 'mcg/tab');
