-- Tabella categorie personalizzabili
CREATE TABLE categories (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('spesa', 'entrata', 'investimento')),
  hex        TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Seed: categorie esistenti
INSERT INTO categories (name, type, hex) VALUES
  ('Casa',            'spesa', '#3B82F6'),
  ('Trasporti',       'spesa', '#6366F1'),
  ('Auto',            'spesa', '#8B5CF6'),
  ('Benzina',         'spesa', '#A78BFA'),
  ('Bollette',        'spesa', '#F59E0B'),
  ('Sport',           'spesa', '#10B981'),
  ('Spesa',           'spesa', '#84CC16'),
  ('Cura personale',  'spesa', '#EC4899'),
  ('Vestiti',         'spesa', '#F97316'),
  ('Altro necessità', 'spesa', '#6B7280'),
  ('Cibo fuori',      'spesa', '#EF4444'),
  ('Intrattenimento', 'spesa', '#F43F5E'),
  ('Vacanza',         'spesa', '#14B8A6'),
  ('Vizi',            'spesa', '#78716C'),
  ('Regali',          'spesa', '#D946EF'),
  ('Altro extra',     'spesa', '#9CA3AF'),
  ('Stipendio',       'entrata', '#22C55E'),
  ('Vendite',         'entrata', '#4ADE80'),
  ('Rimborsi',        'entrata', '#86EFAC'),
  ('Altre entrate',   'entrata', '#16A34A'),
  ('Investimenti',    'investimento', '#7C3AED'),
  ('ROI',             'investimento', '#C4B5FD');
