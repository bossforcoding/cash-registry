-- Schema per l'app Finanze personali
-- Eseguire nel SQL Editor di Supabase

CREATE TABLE transactions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  date        DATE        NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  description TEXT        NOT NULL,
  category    TEXT        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('spesa', 'entrata', 'investimento')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_date     ON transactions(date DESC);
CREATE INDEX idx_transactions_type     ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);

-- Row Level Security: accesso pubblico (app personale senza login)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON transactions FOR ALL USING (true) WITH CHECK (true);
