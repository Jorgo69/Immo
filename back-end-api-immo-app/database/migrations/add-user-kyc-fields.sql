-- KYC (Profil Premium) : id_card_url, phone_verified sur users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS id_card_url TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.id_card_url IS 'URL de la pièce d''identité (KYC)';
COMMENT ON COLUMN users.phone_verified IS 'Téléphone vérifié (OTP ou canal validé)';
