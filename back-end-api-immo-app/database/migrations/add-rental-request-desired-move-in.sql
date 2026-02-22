-- Date d'entrée souhaitée par le locataire (fiche candidature)
ALTER TABLE rental_requests
  ADD COLUMN IF NOT EXISTS desired_move_in_at date;
COMMENT ON COLUMN rental_requests.desired_move_in_at IS 'Date d''entrée souhaitée par le locataire.';
