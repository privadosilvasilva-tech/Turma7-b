const express = require('express');
const { db } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT l.id, l.action, l.target_id, l.created_at, u.display_name, u.role
    FROM logs l LEFT JOIN users u ON u.id = l.user_id
    ORDER BY l.id DESC LIMIT 200
  `).all();
  res.json({ logs: rows });
});

module.exports = router;
