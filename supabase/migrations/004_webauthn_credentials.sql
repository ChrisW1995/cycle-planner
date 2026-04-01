-- WebAuthn credential storage for passkey authentication
CREATE TABLE webauthn_credentials (
  id TEXT PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT,
  backed_up BOOLEAN NOT NULL DEFAULT FALSE,
  transports TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webauthn_account_id ON webauthn_credentials(account_id);

-- RLS
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webauthn_select" ON webauthn_credentials FOR SELECT TO authenticated USING (true);
CREATE POLICY "webauthn_insert" ON webauthn_credentials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "webauthn_update" ON webauthn_credentials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "webauthn_delete" ON webauthn_credentials FOR DELETE TO authenticated USING (true);
