-- Migration: ajout des champs profil / KYC sur la table users
-- À exécuter si vous n'utilisez pas TypeORM synchronize: true (ex: production).

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- Optionnel : passer avatar_url en TEXT si actuellement VARCHAR
-- ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;

-- Unicité email (un seul utilisateur par email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (email) WHERE email IS NOT NULL;
