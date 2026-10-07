-- Aggiunge il campo note alle spese fisse
ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
