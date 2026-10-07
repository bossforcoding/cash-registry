-- Tabella spese/entrate fisse ricorrenti
CREATE TABLE fixed_expenses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT    NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  category    TEXT    NOT NULL,
  type        TEXT    NOT NULL CHECK (type IN ('spesa', 'entrata', 'investimento')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON fixed_expenses FOR ALL USING (true) WITH CHECK (true);

-- Esempio di spese fisse (dati fittizi, modificali dalla pagina "Spese fisse")
INSERT INTO fixed_expenses (description, amount, category, type) VALUES
  ('Stipendio',              2000.00, 'Stipendio',       'entrata'),
  ('Affitto',                 750.00, 'Casa',            'spesa'),
  ('Assicurazione casa',       25.00, 'Bollette',        'spesa'),
  ('Assicurazione auto',       90.00, 'Auto',            'spesa'),
  ('Internet',                 30.00, 'Bollette',        'spesa'),
  ('Abbonamento trasporti',    40.00, 'Trasporti',       'spesa'),
  ('Abbonamento musica',       10.00, 'Altro necessità', 'spesa'),
  ('Palestra',                 35.00, 'Sport',           'spesa'),
  ('Piano di accumulo ETF',   200.00, 'Investimenti',    'investimento');
