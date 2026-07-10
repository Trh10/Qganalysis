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

const ARTICLE_REVISION_CONSTITUTION_CONTENT = [
  {
    type: 'lead',
    text: "Le 9 juin 2026, l'Assemblée nationale vote la loi référendaire qui ouvre la voie à la révision de la Constitution de 2006. Vingt ans après avoir boycotté ce même texte, l'UDPS d'Étienne Tshisekedi en devient le fossoyeur. Entre le précédent africain dévastateur, les articles 219 et 220 qui verrouillent la loi fondamentale, et un peuple qui survit avec moins de 2 dollars par jour, la RDC fait face à un choix existentiel : appliquer sa Constitution ou la brûler sans feu qui s'arrête aux articles choisis."
  },
  { type: 'heading', text: "I. L'ironie d'une histoire en boucle" },
  {
    type: 'paragraph',
    text: "Le 9 juin 2026, l'Assemblée nationale adopte à la majorité présidentielle la loi organique portant organisation du référendum. Le symbole est vertigineux : vingt ans après avoir boycotté le référendum constitutionnel de 2006, l'UDPS, le parti d'Étienne Tshisekedi, porte aujourd'hui l'initiative de réviser ce même texte. Le fils démantèle le cadre que le père avait refusé de légitimer. L'histoire congolaise n'est jamais avare d'ironies tragiques."
  },
  {
    type: 'paragraph',
    text: "Dès le 6 mai 2026, Félix Tshisekedi posait les dés : « Si le peuple souhaite que j'aie un troisième mandat, j'accepterai. » Sept mots qui ont fait trembler les institutions comme le souffle précède l'orage. Derrière cette franchise, un échafaudage juridique, historique et moral vacille."
  },
  { type: 'heading', text: 'II. Ceux qui disent oui : la Constitution est "dépassée"' },
  {
    type: 'paragraph',
    text: "Le camp présidentiel assume. Augustin Kabuya, secrétaire général de l'UDPS, ne tourne pas autour du pot : « Nous sommes rattrapés par notre histoire. L'UDPS avait promis qu'une fois au pouvoir, elle toucherait à cette Constitution. » Cette Constitution, dit-il, a été « rédigée par des étrangers », « par les belligérants » à l'issue des conflits. Elle ne correspond plus au pays. André Mbata, premier vice-président de l'Assemblée nationale, renchérit : « Si le peuple décidait de la changer, que ferions-nous ? » Le souverain primaire, le peuple, sera consulté. C'est la promesse."
  },
  {
    type: 'paragraph',
    text: "Tshisekedi dénonce l'article 217 qui autorise « l'abandon partiel de souveraineté » pour promouvoir l'unité africaine. Il parle de « vente de la souveraineté ». Le président évoque aussi le « démarrage raté » de son mandat, ce retard dans la nomination du Premier ministre qui avait paralysé l'appareil d'État. Preuve des failles constitutionnelles, dit-il."
  },
  {
    type: 'paragraph',
    text: "Et puis il y a l'argument qui claque : « Mobutu, Laurent-Désiré Kabila et Joseph Kabila ont tous modifié la Constitution », martèle Kabuya. « Au nom de quel principe allez-vous interdire à notre régime d'y toucher ? » Didier Budimbu, ministre des Sports, affiche une franchise brutale : « Nous allons tout droit vers un troisième mandat, nous n'aurons pas honte. »"
  },
  {
    type: 'paragraph',
    text: "Il y a aussi la guerre. Le conflit dans les Kivus, cet état de siège qui dure depuis mai 2021, est invoqué pour justifier un éventuel report des élections de 2028. Tshisekedi compare la situation à celle de l'Ukraine de Zelensky. L'UDPS a lancé la Coalition C4 le 26 mai 2026 pour contrer le C64 de l'opposition. La bataille des coalitions est ouverte."
  },
  { type: 'heading', text: 'III. Ceux qui disent non : un mur juridique et un précédent mortel' },
  {
    type: 'paragraph',
    text: "Mais la promesse de référendum n'est pas le problème. Le problème est ce qu'on met sous le référendum. On ne réécrit pas une Constitution entière pour un article 217 que personne n'a jamais invoqué et qui existe dans plusieurs Constitutions africaines sans poser problème."
  },
  {
    type: 'paragraph',
    text: "Pire : est-ce la Constitution qui dysfonctionne, ou ses exécuteurs ? Entre 2021 et 2025, 458 moyens de contrôle parlementaire ont été déposés. Seuls 22 ont été examinés : 4,8%. La Cour des comptes n'existe pas. La décentralisation n'a jamais été effectuée. On ne soigne pas une jambe cassée en coupant la tête du patient."
  },
  {
    type: 'paragraph',
    text: "Le mouvement Lucha, lui, a une réponse cinglante à l'argument de la guerre : « Si on ne peut pas organiser les élections sans le Nord et Sud-Kivu, comment pouvez-vous organiser un référendum constitutionnel sans ces provinces ? » La contradiction est piquante. On ne peut pas, simultanément, arguer que la guerre empêche le scrutin et que le même scrutin peut valablement réviser la loi fondamentale."
  },
  {
    type: 'paragraph',
    text: "Car il y a un mur. L'article 220 sanctuarise la forme républicaine, le suffrage universel, le nombre et la durée des mandats adoptés par référendum à 84%. Et surtout, l'article 219 interdit toute révision pendant l'état de guerre. Or, l'état de siège dure depuis mai 2021. On ne peut pas légiférer sur ce que la loi fondamentale interdit expressément de toucher, dans une période qu'elle interdit d'utiliser à cette fin."
  },
  {
    type: 'paragraph',
    text: "Denis Mukwege, Prix Nobel de la paix, l'a dit sans fard : « Touche pas à ma Constitution ! » (17 mai 2026)."
  },
  { type: 'heading', text: "IV. Le verdict de l'histoire : quatorze fois la même tragédie" },
  {
    type: 'paragraph',
    text: "Mais le mur juridique n'arrête pas ceux qui ont décidé d'avancer. C'est là que le sang de l'Afrique se glace."
  },
  {
    type: 'paragraph',
    text: "Le Africa Center for Strategic Studies tire la sonnette d'alarme : « Les révisions constitutionnelles forcées et les coups d'État en Afrique sont deux faces de la même pièce. » L'Institute for Security Studies complète : « La quête de l'extension du pouvoir progresse de la plume à l'épée. »"
  },
  {
    type: 'paragraph',
    text: "Les chiffres sont têtus. Sur 14 cas africains de révisions constitutionnelles imposées, 64% ont abouti à un pouvoir présidentiel prolongé ou illimité. 43% ont déclenché une instabilité politique majeure : crise violente ou coup d'État. Rwanda 2015 : Kagame en route pour quarante ans cumulés. Burundi 2015 : 1 200 morts, 400 000 réfugiés. Guinée 2020 : coup d'État en 2021. Gabon 2023 : coup d'État. Ouganda : Museveni, trente-huit ans et plus. La boîte de Pandore, une fois ouverte, ne se referme jamais proprement."
  },
  {
    type: 'paragraph',
    text: "Le Sénégal 2024 a montré une autre voie : une Cour constitutionnelle indépendante, une armée neutre, une société civile mobilisée, trois alternances pacifiques ont repoussé une tentative similaire. La RDC n'a pas ces atouts. L'obstination ne suffit pas quand les institutions sont déjà fragilisées."
  },
  {
    type: 'paragraph',
    text: "Le « Glissement 2.0 » est plus structuré que la tentative de Kabila en 2015-2018 : la majorité est réelle, la coalition bâtie, la loi organique votée. Mais la trajectoire est connue. 70% de probabilité cumulée des scénarios négatifs. Les précédents africains ne mentent pas. Ils préviennent."
  },
  { type: 'heading', text: "V. Le prix du feu : le Congo réel, celui qu'on oublie" },
  {
    type: 'paragraph',
    text: "Et puis il y a le prix. Entre 15 et 25 milliards de dollars sur deux à trois ans, estime-t-on. La RDC produit 76% du cobalt mondial. Ses ressources du sous-sol sont estimées à 24 000 milliards de dollars. Les accords stratégiques qui se nouent USA-RDC en décembre 2025, Orion-Glencore à 9 milliards, le Corridor Lobito à 2 milliards d'euros reposent sur l'hypothèse de stabilité. Quel investisseur signe un contrat avec un pays qui s'apprête à jeter ses institutions par la fenêtre ?"
  },
  {
    type: 'paragraph',
    text: "Le Cardinal Fridolin Ambongo pose la question qui fait mal : « Comment peut-on dépenser autant d'énergie et d'argent pour changer la Constitution alors que la jeunesse est abandonnée ? » Il n'a pas tort. 72,3% de la population vit avec moins de 2,15 dollars par jour. 77% des Congolais estiment pourtant que la démocratie est le meilleur système. Seuls 9,5% ont « très grande confiance » dans le gouvernement. Le peuple n'est pas dupé. Il est simplement silencieux, éloigné des arènes où se décident ses destins."
  },
  {
    type: 'paragraph',
    text: "La fracture traverse même l'Église. La CENCO qualifie l'initiative de « hasardeuse » et mobilise 25 000 observateurs. Les Églises de Réveil soutiennent ouvertement le pouvoir. Le pays se divise sur des lignes politiques et spirituelles."
  },
  {
    type: 'paragraph',
    text: "Le cadre juridique continental est pourtant clair. La Charte africaine de la démocratie, ratifiée par la RDC en 2008, qualifie toute révision antidémocratique de « changement anticonstitutionnel de gouvernement ». La Cour africaine des droits de l'homme, dans son arrêt sur le Bénin en 2020, a invalidé une révision pour défaut de consensus national. L'Afrique elle-même, par ses propres traités, dit non."
  },
  {
    type: 'paragraph',
    text: "Le camp présidentiel dit : le peuple décidera. L'opposition répond : le peuple a déjà décidé, en 2006, à 84%. Les deux camps invoquent le même souverain. Mais l'un veut le consulter à nouveau ; l'autre estime qu'il a déjà parlé."
  },
  { type: 'heading', text: 'VI. Au nom de quel feu ?' },
  {
    type: 'paragraph',
    text: "Entre les deux, le Congo. Le vrai. Celui des 72,3% qui survivent avec moins de 2 dollars par jour. Celui qui ne comprend pas pourquoi on dépense des milliards pour réécrire une loi qu'on n'a jamais appliquée, pendant que l'Est brûle."
  },
  {
    type: 'paragraph',
    text: "Voilà le cœur du problème. Ce n'est pas la Constitution qui est dépassée. C'est la classe politique qui n'a pas su faire fonctionner le cadre qu'elle avait hérité. Et au lieu de l'appliquer enfin, elle préfère le déchirer."
  },
  {
    type: 'paragraph',
    text: "Car ceux qui brûlent les Constitutions finissent toujours par découvrir que le feu ne s'arrête jamais aux articles qu'ils voulaient détruire. Il consume tout."
  },
  { type: 'signature', text: 'Guylain Tshibamba' }
];

// Default seed data (used only if files don't exist yet)
const DEFAULT_ARTICLES = [
  {
    id: 'revision-constitution-rdc-2026',
    title: 'Quand le fils déchire ce que le père avait refusé de légitimer',
    date: '2026-06',
    description: "La boîte de Pandore constitutionnelle s'entrouvre en RDC, entre référendum, articles 219 et 220, crise de confiance et précédent africain.",
    author: 'Guylain Tshibamba',
    icon: 'fa-newspaper',
    link: '',
    image: 'article-revision-constitution-rdc-cover.png',
    pdf: '',
    pdfName: '',
    content: ARTICLE_REVISION_CONSTITUTION_CONTENT
  },
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

function ensureArticles(file, articlesToEnsure) {
  const articles = readJson(file, DEFAULT_ARTICLES);
  let changed = false;

  articlesToEnsure.slice().reverse().forEach((article) => {
    if (!articles.some(a => a.id === article.id)) {
      articles.unshift(article);
      changed = true;
    }
  });

  if (changed) writeJson(file, articles);
  return articles;
}

// Initialise files
ensureArticles(ARTICLES_FILE, [DEFAULT_ARTICLES[0]]);
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
function buildUploadFilename(originalname, mimetype) {
  const original = originalname || 'file';
  let ext = path.extname(original).toLowerCase();
  if (!ext) {
    if (mimetype === 'application/pdf') ext = '.pdf';
    else if (mimetype === 'image/jpeg') ext = '.jpg';
    else if (mimetype && mimetype.startsWith('image/')) ext = '.' + mimetype.split('/')[1];
  }
  const base = path.basename(original, path.extname(original))
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 50);
  const stamp = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
  return stamp + '-' + base + ext;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOADS_DIR); },
  filename: function (req, file, cb) {
    cb(null, buildUploadFilename(file.originalname, file.mimetype));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
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
    author: data.author || '',
    icon: data.icon || 'fa-newspaper',
    link: data.link || '',
    image: data.image || '',
    pdf: data.pdf || '',
    pdfName: data.pdfName || '',
    content: Array.isArray(data.content) ? data.content : []
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
    author: data.author != null ? String(data.author) : articles[idx].author,
    icon: data.icon != null ? data.icon : articles[idx].icon,
    link: data.link != null ? data.link : articles[idx].link,
    image: data.image != null ? data.image : articles[idx].image,
    pdf: data.pdf != null ? data.pdf : articles[idx].pdf,
    pdfName: data.pdfName != null ? data.pdfName : articles[idx].pdfName,
    content: Array.isArray(data.content) ? data.content : (articles[idx].content || [])
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
const UPLOAD_MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

function isPdfFile(filePath) {
  if (path.extname(filePath).toLowerCase() === '.pdf') return true;
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf.toString() === '%PDF';
  } catch (e) {
    return false;
  }
}

app.get('/uploads/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Fichier introuvable' });

  const ext = path.extname(filename).toLowerCase();
  let contentType = UPLOAD_MIME_TYPES[ext];
  if (!contentType && isPdfFile(filePath)) contentType = 'application/pdf';
  if (!contentType) contentType = 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  if (contentType === 'application/pdf') {
    res.setHeader('Content-Disposition', 'inline');
  }
  res.sendFile(filePath);
});
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
