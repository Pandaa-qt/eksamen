-- database.sql
-- Køyr denne for å lage tabellane:
--   sqlite3 data/bryllup.db < database.sql

CREATE TABLE IF NOT EXISTS kategorier (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    namn TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS produkter (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    namn         TEXT    NOT NULL,
    skildring    TEXT    NOT NULL,
    pris         REAL    NOT NULL,
    bilde_url    TEXT,
    kategori_id  INTEGER REFERENCES kategorier(id),
    synleg       INTEGER DEFAULT 1   -- 1 = synleg for kundar, 0 = skjult
);

-- Testdata
INSERT INTO kategorier (namn) VALUES ('Musikere'), ('Blomster'), ('Bordkort'), ('Foto');

INSERT INTO produkter (namn, skildring, pris, bilde_url, kategori_id) VALUES
  ('Musikere',  'Elegant kvartett med 15 års erfaring. Klassisk musikk og jazz.', 8500, 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800', 1),
  ('DJ Lars Eriksen',      'Profesjonell DJ. Inkluderer lydutstyr og lyssetting.',            6200, 'https://images.unsplash.com/photo-1571266028243-d220c6a6cf94?w=800', 1),
  ('Rosenbukett Deluxe',   'Handlaga bukett med roser, pioner og eukalyptus.',                3200, 'https://images.unsplash.com/photo-1487530811015-780ce0af7dc1?w=800', 2),
  ('Bordpynt ','Elegant borddekor med stearinlys og gulldetaljar. Per bord.',     850, 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', 3),
  ('Kalligraferte Bordkort','Handskrivne bordkort i vakker kalligrafi. Pris per 10 stk.',      490, 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800', 3),
  ('Fotograf Anna Dahl',   'Heile bryllupsdagen (10 t), 500+ bilete, og trykt fotobok.',    18500, 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800', 4);
