-- ==================== Anon RLS Policies ====================
-- Custom JWT (admin/viewer) users connect via Supabase anon key.
-- App-level auth is enforced by Next.js middleware.

-- Drop existing anon policies if any
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE policyname LIKE '%_anon'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Profiles: anon can read
CREATE POLICY "profiles_select_anon" ON profiles FOR SELECT TO anon USING (true);

-- Drug templates: anon can read
CREATE POLICY "drug_templates_select_anon" ON drug_templates FOR SELECT TO anon USING (true);

-- People: anon can CRUD
CREATE POLICY "people_select_anon" ON people FOR SELECT TO anon USING (true);
CREATE POLICY "people_insert_anon" ON people FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "people_update_anon" ON people FOR UPDATE TO anon USING (true);
CREATE POLICY "people_delete_anon" ON people FOR DELETE TO anon USING (true);

-- Drugs: anon can CRUD
CREATE POLICY "drugs_select_anon" ON drugs FOR SELECT TO anon USING (true);
CREATE POLICY "drugs_insert_anon" ON drugs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "drugs_update_anon" ON drugs FOR UPDATE TO anon USING (true);
CREATE POLICY "drugs_delete_anon" ON drugs FOR DELETE TO anon USING (true);

-- Cycles: anon can CRUD
CREATE POLICY "cycles_select_anon" ON cycles FOR SELECT TO anon USING (true);
CREATE POLICY "cycles_insert_anon" ON cycles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "cycles_update_anon" ON cycles FOR UPDATE TO anon USING (true);
CREATE POLICY "cycles_delete_anon" ON cycles FOR DELETE TO anon USING (true);

-- Cycle drugs: anon can CRUD
CREATE POLICY "cycle_drugs_select_anon" ON cycle_drugs FOR SELECT TO anon USING (true);
CREATE POLICY "cycle_drugs_insert_anon" ON cycle_drugs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "cycle_drugs_update_anon" ON cycle_drugs FOR UPDATE TO anon USING (true);
CREATE POLICY "cycle_drugs_delete_anon" ON cycle_drugs FOR DELETE TO anon USING (true);

-- Cycle cells: anon can CRUD
CREATE POLICY "cycle_cells_select_anon" ON cycle_cells FOR SELECT TO anon USING (true);
CREATE POLICY "cycle_cells_insert_anon" ON cycle_cells FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "cycle_cells_update_anon" ON cycle_cells FOR UPDATE TO anon USING (true);
CREATE POLICY "cycle_cells_delete_anon" ON cycle_cells FOR DELETE TO anon USING (true);
