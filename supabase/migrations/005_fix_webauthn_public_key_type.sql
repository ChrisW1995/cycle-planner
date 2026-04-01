-- Fix: change public_key from BYTEA to TEXT to store base64 strings directly
-- BYTEA causes double-encoding issues with Supabase REST API
ALTER TABLE webauthn_credentials ALTER COLUMN public_key TYPE TEXT USING encode(public_key, 'escape');
