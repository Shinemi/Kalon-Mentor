-- À exécuter une fois dans le SQL Editor Supabase avant de déployer le back.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_reset_token_hash TEXT,
    ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS users_password_reset_token_hash_idx
    ON users (password_reset_token_hash)
    WHERE password_reset_token_hash IS NOT NULL;
