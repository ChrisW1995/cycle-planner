-- ==================== Profiles (extends Supabase Auth) ====================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== People ====================
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  height DECIMAL,
  weight DECIMAL,
  body_fat DECIMAL,
  age INTEGER,
  needs_cycle BOOLEAN NOT NULL DEFAULT FALSE,
  cycle_goal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== Drug Templates (seed data) ====================
CREATE TABLE drug_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generic_name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  brand_names TEXT[],
  primary_category TEXT NOT NULL CHECK (primary_category IN ('Injectable', 'Oral', 'PCT')),
  sub_category TEXT CHECK (sub_category IN ('Test', 'Nor-19', 'DHT', 'AI', 'SERM', 'Prolactin', 'Other')),
  ester_type TEXT CHECK (ester_type IN ('Long', 'Short')),
  default_concentration DECIMAL,
  default_unit TEXT NOT NULL DEFAULT 'mg/ml',
  is_system BOOLEAN NOT NULL DEFAULT TRUE
);

-- ==================== Drugs (user inventory) ====================
CREATE TABLE drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES drug_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  concentration DECIMAL NOT NULL,
  primary_category TEXT NOT NULL CHECK (primary_category IN ('Injectable', 'Oral', 'PCT')),
  sub_category TEXT CHECK (sub_category IN ('Test', 'Nor-19', 'DHT', 'AI', 'SERM', 'Prolactin', 'Other')),
  ester_type TEXT CHECK (ester_type IN ('Long', 'Short')),
  image_url TEXT,
  inventory_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== Cycles ====================
CREATE TABLE cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  name TEXT,
  total_weeks INTEGER NOT NULL DEFAULT 12,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Planned', 'Completed')),
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== Cycle Drugs ====================
CREATE TABLE cycle_drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE RESTRICT,
  weekly_dose DECIMAL,
  daily_dose DECIMAL,
  start_week INTEGER NOT NULL DEFAULT 1,
  end_week INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== Cycle Cells ====================
CREATE TABLE cycle_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  cycle_drug_id UUID NOT NULL REFERENCES cycle_drugs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  display_value TEXT,
  ml_amount DECIMAL,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== Indexes ====================
CREATE INDEX idx_cycles_person_id ON cycles(person_id);
CREATE INDEX idx_cycle_drugs_cycle_id ON cycle_drugs(cycle_id);
CREATE INDEX idx_cycle_cells_cycle_id ON cycle_cells(cycle_id);
CREATE INDEX idx_cycle_cells_cycle_drug_id ON cycle_cells(cycle_drug_id);
CREATE INDEX idx_drugs_primary_category ON drugs(primary_category);
CREATE INDEX idx_drugs_template_id ON drugs(template_id);

-- ==================== Updated_at triggers ====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_drugs_updated_at BEFORE UPDATE ON drugs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cycles_updated_at BEFORE UPDATE ON cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==================== RLS Policies ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_cells ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Drug templates: everyone can read
CREATE POLICY "drug_templates_select" ON drug_templates FOR SELECT TO authenticated USING (true);

-- People: all authenticated can read, only admin can write
CREATE POLICY "people_select" ON people FOR SELECT TO authenticated USING (true);
CREATE POLICY "people_insert" ON people FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "people_update" ON people FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "people_delete" ON people FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Drugs: all can read, only admin can write
CREATE POLICY "drugs_select" ON drugs FOR SELECT TO authenticated USING (true);
CREATE POLICY "drugs_insert" ON drugs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "drugs_update" ON drugs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "drugs_delete" ON drugs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Cycles: all can read, only admin can write
CREATE POLICY "cycles_select" ON cycles FOR SELECT TO authenticated USING (true);
CREATE POLICY "cycles_insert" ON cycles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "cycles_update" ON cycles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "cycles_delete" ON cycles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Cycle drugs: all can read, only admin can write
CREATE POLICY "cycle_drugs_select" ON cycle_drugs FOR SELECT TO authenticated USING (true);
CREATE POLICY "cycle_drugs_insert" ON cycle_drugs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "cycle_drugs_update" ON cycle_drugs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "cycle_drugs_delete" ON cycle_drugs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Cycle cells: all can read, only admin can write
CREATE POLICY "cycle_cells_select" ON cycle_cells FOR SELECT TO authenticated USING (true);
CREATE POLICY "cycle_cells_insert" ON cycle_cells FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "cycle_cells_update" ON cycle_cells FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "cycle_cells_delete" ON cycle_cells FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
