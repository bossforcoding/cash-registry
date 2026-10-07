-- Tabella key-value per settings globali app
-- Eseguire nel SQL Editor di Supabase

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- Abilita RLS ma permetti lettura/scrittura a tutti (anon key)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON settings
  FOR ALL USING (true) WITH CHECK (true);
