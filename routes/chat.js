const express = require('express');
const { db } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Carrega mensagens mais antigas que "before" (paginação / carregamento progressivo).
router.get('/', (req, res) => {
  const before = req.query.before ? req.query.before : new Date().toISOString();
  const limit = 30;
  const rows = db.prepare(`
    SELECT m.id, m.content, m.created_at, m.deleted, u.id as user_id, u.display_name, u.role
    FROM messages m JOIN users u ON u.id = m.user_id
    WHERE m.created_at < ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `).all(before, limit);
  res.json({ messages: rows.reverse() });
});

// Moderação: administradores e o proprietário podem apagar mensagens.
router.delete('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  db.prepare('UPDATE messages SET deleted = 1, content = ? WHERE id = ?').run('[mensagem removida]', id);
  db.prepare('INSERT INTO logs (user_id, action, target_id) VALUES (?, ?, ?)')
    .run(req.user.id, 'APAGOU_MENSAGEM', String(id));
  res.json({ ok: true });
});

module.exports = router;
