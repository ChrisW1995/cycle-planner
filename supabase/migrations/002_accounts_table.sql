-- Accounts table for Admin/Viewer (separate from Supabase Auth)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update profiles role constraint to include 'developer'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('developer'));

-- RLS for accounts: only authenticated Supabase users (developers) can manage via API
-- Admin/Viewer access is handled through JWT in API routes, not RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Allow developers (via Supabase Auth) to manage accounts
CREATE POLICY "accounts_select" ON accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "accounts_insert" ON accounts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'developer'));
CREATE POLICY "accounts_update" ON accounts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'developer'));
CREATE POLICY "accounts_delete" ON accounts FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'developer'));

-- Also allow anon access for login API (read-only for password verification)
CREATE POLICY "accounts_anon_select" ON accounts FOR SELECT TO anon USING (true);
