const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET } = require('../db/secret');

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, display_name, role FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'Sessão inválida.' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }
}

// Hierarquia de papéis: quanto maior o número, mais permissões.
const RANK = { aluno: 0, support: 1, admin: 2, owner: 3 };

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
    if (RANK[req.user.role] < RANK[minRole]) {
      return res.status(403).json({ error: 'Você não tem permissão para fazer isso.' });
    }
    next();
  };
}

function verifySocketToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, display_name, role FROM users WHERE id = ?').get(payload.id);
    return user || null;
  } catch (e) {
    return null;
  }
}

module.exports = { requireAuth, requireRole, verifySocketToken, RANK };
