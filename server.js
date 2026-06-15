const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'qganalysis';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-please-' + crypto.randomBytes(8).toString('hex');

// Data directory: Railway volume should be mounted at /data
const DATA_DIR = process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data'));
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const RAPPORTS_FILE = path.join(DATA_DIR, 'rapports.json');

// Ensure directories exist
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Default seed data (used only if files don't exist yet)
const DEFAULT_ARTICLES = [
  { id: '1', title: "L'importance de l'analyse stratégique en temps de crise", date: '2026-01', description: "Découvrez comment une veille stratégique adaptée permet de mieux anticiper les situations complexes.", icon: 'fa-newspaper', link: '', image: '', pdf: '', pdfName: '' },
  { id: '2', title: 'Les tendances de la communication de crise en 2026', date: '2025-12', description: "Les nouvelles approches et méthodologies qui transforment la gestion de crise contemporaine.", icon: 'fa-chart-line', link: '', image: '', pdf: '', pdfName: '' },
  { id: '3', title: 'QG Analysis accompagne un grand groupe industriel', date: '2025-11', description: "Retour sur notre accompagnement stratégique lors d'une restructuration majeure.", icon: 'fa-users', link: '', image: '', pdf: '', pdfName: '' }
];

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('readJson error', file, e);
    return fallback;
  }
}

function writeJson(file, data) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

// Initialise files
readJson(ARTICLES_FILE, DEFAULT_ARTICLES);
readJson(RAPPORTS_FILE, []);

// ============ EXPRESS APP ============
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8 // 8h
  }
}));

// ============ MULTER (file upload) ============
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOADS_DIR); },
  filename: function (req, file, cb) {
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 60);
    const stamp = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    cb(null, stamp + '-' + safe);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: function (req, file, cb) {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (allowed.indexOf(file.mimetype) === -1) {
      return cb(new Error('Type de fichier non autorisé'));
    }
    cb(null, true);
  }
});

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Non autorisé' });
}

// ============ AUTH ROUTES ============
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Identifiants invalides' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/admin/me', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// ============ PUBLIC ROUTES ============
app.get('/api/articles', (req, res) => {
  res.json(readJson(ARTICLES_FILE, []));
});
app.get('/api/articles/:id', (req, res) => {
  const articles = readJson(ARTICLES_FILE, []);
  const a = articles.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Introuvable' });
  res.json(a);
});

app.get('/api/rapports', (req, res) => {
  res.json(readJson(RAPPORTS_FILE, []));
});
app.get('/api/rapports/:id', (req, res) => {
  const rapports = readJson(RAPPORTS_FILE, []);
  const r = rapports.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Introuvable' });
  res.json(r);
});

// ============ UPLOAD (admin) ============
app.post('/api/admin/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
  res.json({
    url: '/uploads/' + req.file.filename,
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype
  });
});

app.post('/api/admin/import-content', requireAuth, (req, res) => {
  const articles = Array.isArray(req.body?.articles) ? req.body.articles : null;
  const rapports = Array.isArray(req.body?.rapports) ? req.body.rapports : null;

  if (!articles || !rapports) {
    return res.status(400).json({ error: 'articles and rapports arrays are required' });
  }

  writeJson(ARTICLES_FILE, articles);
  writeJson(RAPPORTS_FILE, rapports);
  res.json({ ok: true, articles: articles.length, rapports: rapports.length });
});

// ============ ADMIN CRUD : ARTICLES ============
app.post('/api/admin/articles', requireAuth, (req, res) => {
  const articles = readJson(ARTICLES_FILE, []);
  const data = req.body || {};
  if (!data.title || !data.date || !data.description) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  const article = {
    id: Date.now().toString(),
    title: String(data.title),
    date: String(data.date),
    description: String(data.description),
    icon: data.icon || 'fa-newspaper',
    link: data.link || '',
    image: data.image || '',
    pdf: data.pdf || '',
    pdfName: data.pdfName || ''
  };
  articles.unshift(article);
  writeJson(ARTICLES_FILE, articles);
  res.json(article);
});

app.put('/api/admin/articles/:id', requireAuth, (req, res) => {
  const articles = readJson(ARTICLES_FILE, []);
  const idx = articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Introuvable' });
  const data = req.body || {};
  articles[idx] = {
    id: articles[idx].id,
    title: data.title != null ? String(data.title) : articles[idx].title,
    date: data.date != null ? String(data.date) : articles[idx].date,
    description: data.description != null ? String(data.description) : articles[idx].description,
    icon: data.icon != null ? data.icon : articles[idx].icon,
    link: data.link != null ? data.link : articles[idx].link,
    image: data.image != null ? data.image : articles[idx].image,
    pdf: data.pdf != null ? data.pdf : articles[idx].pdf,
    pdfName: data.pdfName != null ? data.pdfName : articles[idx].pdfName
  };
  writeJson(ARTICLES_FILE, articles);
  res.json(articles[idx]);
});

app.delete('/api/admin/articles/:id', requireAuth, (req, res) => {
  const articles = readJson(ARTICLES_FILE, []);
  const filtered = articles.filter(a => a.id !== req.params.id);
  writeJson(ARTICLES_FILE, filtered);
  res.json({ ok: true });
});

// ============ ADMIN CRUD : RAPPORTS ============
app.post('/api/admin/rapports', requireAuth, (req, res) => {
  const rapports = readJson(RAPPORTS_FILE, []);
  const data = req.body || {};
  if (!data.title || !data.date || !data.description) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  const rapport = {
    id: Date.now().toString(),
    title: String(data.title),
    date: String(data.date),
    description: String(data.description),
    frequency: data.frequency || 'autre',
    image: data.image || '',
    pdf: data.pdf || '',
    pdfName: data.pdfName || ''
  };
  rapports.unshift(rapport);
  writeJson(RAPPORTS_FILE, rapports);
  res.json(rapport);
});

app.put('/api/admin/rapports/:id', requireAuth, (req, res) => {
  const rapports = readJson(RAPPORTS_FILE, []);
  const idx = rapports.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Introuvable' });
  const data = req.body || {};
  rapports[idx] = {
    id: rapports[idx].id,
    title: data.title != null ? String(data.title) : rapports[idx].title,
    date: data.date != null ? String(data.date) : rapports[idx].date,
    description: data.description != null ? String(data.description) : rapports[idx].description,
    frequency: data.frequency != null ? data.frequency : rapports[idx].frequency,
    image: data.image != null ? data.image : rapports[idx].image,
    pdf: data.pdf != null ? data.pdf : rapports[idx].pdf,
    pdfName: data.pdfName != null ? data.pdfName : rapports[idx].pdfName
  };
  writeJson(RAPPORTS_FILE, rapports);
  res.json(rapports[idx]);
});

app.delete('/api/admin/rapports/:id', requireAuth, (req, res) => {
  const rapports = readJson(RAPPORTS_FILE, []);
  const filtered = rapports.filter(r => r.id !== req.params.id);
  writeJson(RAPPORTS_FILE, filtered);
  res.json({ ok: true });
});

// ============ STATIC FILES ============
// Uploaded files served from the data volume
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));
// Site files
app.use(express.static(__dirname, { extensions: ['html'] }));

// Multer error handler (file too large, etc.)
app.use((err, req, res, next) => {
  if (err) {
    console.error('Error:', err.message);
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
