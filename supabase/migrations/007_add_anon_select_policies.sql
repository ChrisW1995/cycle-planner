-- Allow anon role to read data
-- Admin/viewer users use custom JWT (not Supabase Auth), so they connect as anon role
CREATE POLICY "drugs_select_anon" ON drugs FOR SELECT TO anon USING (true);
CREATE POLICY "drug_templates_select_anon" ON drug_templates FOR SELECT TO anon USING (true);
CREATE POLICY "people_select_anon" ON people FOR SELECT TO anon USING (true);
CREATE POLICY "cycles_select_anon" ON cycles FOR SELECT TO anon USING (true);
CREATE POLICY "cycle_drugs_select_anon" ON cycle_drugs FOR SELECT TO anon USING (true);
CREATE POLICY "cycle_cells_select_anon" ON cycle_cells FOR SELECT TO anon USING (true);
