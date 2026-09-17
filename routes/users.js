const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireAuth, requireRole, RANK } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('support'));

function logAction(userId, action, targetId) {
  db.prepare('INSERT INTO logs (user_id, action, target_id) VALUES (?, ?, ?)').run(userId, action, targetId || null);
}

// Suporte só pode listar/visualizar; criar e editar contas é para admin+.
router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, username, display_name, role, created_at FROM users ORDER BY id').all();
  res.json({ users });
});

router.post('/', requireRole('admin'), (req, res) => {
  const { username, password, display_name, role } = req.body || {};
  if (!username || !password || !display_name || !role) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  if (!['owner', 'admin', 'support', 'aluno'].includes(role)) {
    return res.status(400).json({ error: 'Papel inválido.' });
  }
  // Um administrador auxiliar não pode criar outro administrador ou o proprietário.
  if (req.user.role === 'admin' && (role === 'admin' || role === 'owner')) {
    return res.status(403).json({ error: 'Apenas o proprietário pode criar administradores ou outro proprietário.' });
  }
  if (role === 'owner') {
    return res.status(403).json({ error: 'Só pode existir um proprietário. Use a área de configurações para transferir o cargo.' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim().toLowerCase());
  if (exists) return res.status(409).json({ error: 'Esse nome de usuário já existe.' });

  const hash = bcrypt.hashSync(password, 12);
  const info = db.prepare(
    'INSERT INTO users (username, password_hash, display_name, role, created_by) VALUES (?, ?, ?, ?, ?)'
  ).run(username.trim().toLowerCase(), hash, display_name, role, req.user.id);

  logAction(req.user.id, 'CRIOU_USUARIO', String(info.lastInsertRowid));
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', requireRole('admin'), (req, res) => {
  const targetId = Number(req.params.id);
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!target) return res.status(404).json({ error: 'Usuário não encontrado.' });

  if (target.role === 'owner' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Só o proprietário pode editar a própria conta.' });
  }
  const { display_name, password, role } = req.body || {};

  if (role && role !== target.role) {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Apenas o proprietário pode alterar papéis.' });
    }
    if (role === 'owner') {
      return res.status(403).json({ error: 'Transferência de propriedade não é permitida por aqui.' });
    }
  }

  const newDisplayName = display_name || target.display_name;
  const newRole = (role && req.user.role === 'owner') ? role : target.role;
  const newHash = password ? bcrypt.hashSync(password, 12) : target.password_hash;

  db.prepare('UPDATE users SET display_name = ?, role = ?, password_hash = ? WHERE id = ?')
    .run(newDisplayName, newRole, newHash, targetId);

  logAction(req.user.id, 'EDITOU_USUARIO', String(targetId));
  res.json({ ok: true });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const targetId = Number(req.params.id);
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!target) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (target.role === 'owner') {
    return res.status(403).json({ error: 'O proprietário não pode ser excluído.' });
  }
  if (target.role === 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Apenas o proprietário pode excluir administradores.' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  logAction(req.user.id, 'EXCLUIU_USUARIO', String(targetId));
  res.json({ ok: true });
});

module.exports = router;
