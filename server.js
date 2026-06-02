// server.js – Bryllupsplanleggjaren
// Start med: node server.js

const express   = require('express');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const initSqlJs = require('sql.js');

const app  = express();
const PORT = 3000;

// ── DATABASE ────────────────────────────────────────────────
// sql.js er SQLite som køyrer i Node.js utan installasjon.
// Databasefila ligg i /app/data/bryllup.db (Docker-volum).

const DB_STI = path.join(__dirname, 'data', 'bryllup.db');
let db;

async function startDB() {
    const SQL = await initSqlJs();
    fs.mkdirSync(path.dirname(DB_STI), { recursive: true });

    if (fs.existsSync(DB_STI)) {
        db = new SQL.Database(fs.readFileSync(DB_STI));
    } else {
        db = new SQL.Database();
        const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
        db.run(sql);
        lagre();
        console.log('Ny database laga med testdata');
    }
}

function lagre() {
    fs.writeFileSync(DB_STI, Buffer.from(db.export()));
}

// Hjelpe-funksjonar
const hentAlle = (sql, p = []) => {
    const s = db.prepare(sql); s.bind(p);
    const r = []; while (s.step()) r.push(s.getAsObject()); s.free();
    return r;
};
const hentEin = (sql, p = []) => hentAlle(sql, p)[0] || null;
const køyr    = (sql, p = []) => { db.run(sql, p); lagre(); };

// ── MELLOMVARE ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/admin', express.static('admin'));

// ── BILETEUPPLASTING ────────────────────────────────────────
const upload = multer({
    storage: multer.diskStorage({
        destination: (_, __, cb) => {
            fs.mkdirSync('public/uploads', { recursive: true });
            cb(null, 'public/uploads');
        },
        filename: (_, f, cb) => cb(null, Date.now() + '-' + f.originalname)
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ── API: PRODUKT (offentleg) ────────────────────────────────
app.get('/api/produkt', (_, res) => {
    res.json(hentAlle(`
        SELECT p.*, k.namn AS kategori_namn FROM produkter p
        LEFT JOIN kategorier k ON p.kategori_id = k.id
        WHERE p.synleg = 1 ORDER BY k.namn, p.namn
    `));
});

app.get('/api/produkt/:id', (req, res) => {
    const p = hentEin(`
        SELECT p.*, k.namn AS kategori_namn FROM produkter p
        LEFT JOIN kategorier k ON p.kategori_id = k.id WHERE p.id = ?
    `, [req.params.id]);
    p ? res.json(p) : res.status(404).json({ feil: 'Ikkje funne' });
});

// ── API: ADMIN (Nginx har allereie sjekka IP-en) ────────────
app.get('/api/admin/produkt', (_, res) => {
    res.json(hentAlle(`
        SELECT p.*, k.namn AS kategori_namn FROM produkter p
        LEFT JOIN kategorier k ON p.kategori_id = k.id ORDER BY p.id DESC
    `));
});

app.post('/api/produkt', upload.single('bilde'), (req, res) => {
    const { namn, skildring, pris, kategori_id, synleg } = req.body;
    if (!namn || !skildring || !pris)
        return res.status(400).json({ feil: 'Namn, skildring og pris er påkravd' });

    const bilde = req.file ? `/uploads/${req.file.filename}` : (req.body.bilde_url || null);
    køyr('INSERT INTO produkter (namn, skildring, pris, bilde_url, kategori_id, synleg) VALUES (?,?,?,?,?,?)',
        [namn, skildring, parseFloat(pris), bilde, kategori_id || null, synleg === '1' ? 1 : 0]);
    res.status(201).json({ melding: 'Oppretta' });
});

app.put('/api/produkt/:id', upload.single('bilde'), (req, res) => {
    const gamalt = hentEin('SELECT * FROM produkter WHERE id = ?', [req.params.id]);
    if (!gamalt) return res.status(404).json({ feil: 'Ikkje funne' });

    const { namn, skildring, pris, kategori_id, synleg, bilde_url } = req.body;
    const bilde = req.file ? `/uploads/${req.file.filename}` : (bilde_url || gamalt.bilde_url);

    køyr('UPDATE produkter SET namn=?,skildring=?,pris=?,bilde_url=?,kategori_id=?,synleg=? WHERE id=?',
        [namn||gamalt.namn, skildring||gamalt.skildring, pris ? parseFloat(pris) : gamalt.pris,
         bilde, kategori_id||gamalt.kategori_id, synleg !== undefined ? (synleg==='1'?1:0) : gamalt.synleg,
         req.params.id]);
    res.json({ melding: 'Oppdatert' });
});

app.delete('/api/produkt/:id', (req, res) => {
    if (!hentEin('SELECT id FROM produkter WHERE id=?', [req.params.id]))
        return res.status(404).json({ feil: 'Ikkje funne' });
    køyr('DELETE FROM produkter WHERE id=?', [req.params.id]);
    res.json({ melding: 'Sletta' });
});

// ── API: KATEGORIAR ─────────────────────────────────────────
app.get('/api/kategoriar', (_, res) =>
    res.json(hentAlle('SELECT * FROM kategorier ORDER BY namn')));

app.post('/api/kategoriar', (req, res) => {
    if (!req.body.namn) return res.status(400).json({ feil: 'Namn påkravd' });
    køyr('INSERT INTO kategorier (namn) VALUES (?)', [req.body.namn]);
    res.status(201).json({ melding: 'Laga' });
});

// ── START ────────────────────────────────────────────────────
startDB().then(() => {
    app.listen(PORT, () => console.log(`Køyrer på port ${PORT}`));
});
