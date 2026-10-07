-- Aggiunge il campo descrizione alle categorie
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Aggiorna le descrizioni dalle categorie esistenti
UPDATE categories SET description = 'manutenzione, mobili, necessità'                                        WHERE name = 'Casa';
UPDATE categories SET description = 'treno, bus, pedaggi, parcheggi'                                         WHERE name = 'Trasporti';
UPDATE categories SET description = 'assicurazione, bollo, tagliando, revisione, gomme'                      WHERE name = 'Auto';
UPDATE categories SET description = 'carburante'                                                              WHERE name = 'Benzina';
UPDATE categories SET description = 'acqua, energia, gas, internet, telefono, banca, università'             WHERE name = 'Bollette';
UPDATE categories SET description = 'calcetti, palestra, piscina'                                            WHERE name = 'Sport';
UPDATE categories SET description = 'spesa per cibo'                                                         WHERE name = 'Spesa';
UPDATE categories SET description = 'parrucchiere, dentista, spese mediche'                                  WHERE name = 'Cura personale';
UPDATE categories SET description = 'abbigliamento, scarpe, accessori'                                       WHERE name = 'Vestiti';
UPDATE categories SET description = 'abbonamenti, cellulare, dispositivi tecnologici'                        WHERE name = 'Altro necessità';
UPDATE categories SET description = 'bar e ristoranti, fast food, aperitivi'                                 WHERE name = 'Cibo fuori';
UPDATE categories SET description = 'cinema, discoteca, eventi'                                              WHERE name = 'Intrattenimento';
UPDATE categories SET description = 'qualsiasi spesa legata alla vacanza, viaggi, hotel, ristoranti'         WHERE name = 'Vacanza';
UPDATE categories SET description = 'tabacco, gioco d''azzardo'                                              WHERE name = 'Vizi';
UPDATE categories SET description = 'regali a familiari e amici'                                             WHERE name = 'Regali';
UPDATE categories SET description = 'altro, eventuali multe'                                                 WHERE name = 'Altro extra';
UPDATE categories SET description = 'buste, mance, regali ricevuti'                                         WHERE name = 'Altre entrate';
UPDATE categories SET description = 'finanziari, crypto, beni mobili'                                       WHERE name = 'Investimenti';
UPDATE categories SET description = 'Return of Investment'                                                   WHERE name = 'ROI';
