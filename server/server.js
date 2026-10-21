import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const { Pool } = pg;

const PORT = Number(process.env.PORT || 4000);

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required to start the API');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());

const COOKIE_NAME = 'op_session';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === '1',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function startSession(res, userId) {
  const token = jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
}

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Non connecté' });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ error: 'Session expirée' });
  }
}

function validateCredentials(username, password) {
  if (!/^[A-Za-z0-9_-]{3,20}$/.test(username)) {
    return 'Pseudo : 3 à 20 caractères (lettres, chiffres, _ ou -).';
  }
  if (password.length < 6) return 'Mot de passe : 6 caractères minimum.';
  return null;
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');

  const problem = validateCredentials(username, password);
  if (problem) return res.status(400).json({ error: problem });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );
    startSession(res, rows[0].id);
    res.json({ user: rows[0], save: null });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ce pseudo est déjà pris.' });
    console.error('register failed', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  if (!username || !password) return res.status(400).json({ error: 'Pseudo et mot de passe requis.' });

  try {
    const { rows } = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE lower(username) = lower($1)',
      [username]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Pseudo ou mot de passe incorrect.' });
    }
    startSession(res, user.id);
    const save = await pool.query('SELECT state FROM saves WHERE user_id = $1', [user.id]);
    res.json({
      user: { id: user.id, username: user.username },
      save: save.rows[0]?.state ?? null,
    });
  } catch (err) {
    console.error('login failed', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, username FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) return res.status(401).json({ error: 'Session invalide' });
    const save = await pool.query('SELECT state, updated_at FROM saves WHERE user_id = $1', [req.userId]);
    res.json({
      user: rows[0],
      save: save.rows[0]?.state ?? null,
      savedAt: save.rows[0]?.updated_at ?? null,
    });
  } catch (err) {
    console.error('me failed', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.get('/api/save', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT state, updated_at FROM saves WHERE user_id = $1', [req.userId]);
    res.json({ save: rows[0]?.state ?? null, savedAt: rows[0]?.updated_at ?? null });
  } catch (err) {
    console.error('save read failed', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.put('/api/save', requireAuth, async (req, res) => {
  const state = req.body?.state;
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return res.status(400).json({ error: 'Sauvegarde invalide.' });
  }
  try {
    const { rows } = await pool.query(
      `WITH account AS (
         SELECT id FROM users WHERE id = $1 FOR KEY SHARE
       )
       INSERT INTO saves (user_id, state, updated_at)
       SELECT id, $2, now() FROM account
       ON CONFLICT (user_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()
       RETURNING updated_at`,
      [req.userId, state]
    );
    if (!rows[0]) {
      res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
      return res.status(401).json({ error: 'Session invalide' });
    }
    res.json({ ok: true, savedAt: rows[0].updated_at });
  } catch (err) {
    // The token is still valid but the account is gone: answer 401 so the client
    // goes back to the login screen instead of retrying into a foreign-key error.
    if (err.code === '23503') {
      res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
      return res.status(401).json({ error: 'Session invalide' });
    }
    console.error('save write failed', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Route inconnue' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Grand Line API listening on 0.0.0.0:${PORT}`);
});
