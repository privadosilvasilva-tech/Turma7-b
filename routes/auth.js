const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// No máximo 8 tentativas de login por IP a cada 10 minutos.
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  message: { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function logAction(userId, action, targetId) {
  db.prepare('INSERT INTO logs (user_id, action, target_id) VALUES (?, ?, ?)').run(userId, action, targetId || null);
}

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Informe usuário e senha.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return res.status(423).json({ error: 'Conta temporariamente bloqueada por muitas tentativas erradas. Tente mais tarde.' });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    const attempts = user.failed_attempts + 1;
    let lockedUntil = null;
    if (attempts >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }
    db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?').run(attempts, lockedUntil, user.id);
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  logAction(user.id, 'LOGIN');

  res.json({
    user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role },
  });
});

router.post('/logout', requireAuth, (req, res) => {
  logAction(req.user.id, 'LOGOUT');
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
