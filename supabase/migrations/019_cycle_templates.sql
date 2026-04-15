-- Cycle templates: reusable cycle configurations
CREATE TABLE cycle_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  total_weeks INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template drug entries (mirrors cycle_drugs structure)
CREATE TABLE cycle_template_drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES cycle_templates(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  weekly_dose DECIMAL,
  daily_dose DECIMAL,
  injection_ml DECIMAL,
  total_injections INTEGER,
  schedule_mode TEXT,
  start_week INTEGER NOT NULL DEFAULT 1,
  end_week INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (matching existing pattern: anon has full CRUD, auth enforced at app level)
ALTER TABLE cycle_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_template_drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_cycle_templates_all" ON cycle_templates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_cycle_template_drugs_all" ON cycle_template_drugs FOR ALL TO anon USING (true) WITH CHECK (true);

-- Index for fast lookup
CREATE INDEX idx_cycle_template_drugs_template ON cycle_template_drugs(template_id);
