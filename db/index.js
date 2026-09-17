const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'turma.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Gera o próximo ID público (ex: ATV-001, TRB-002) por tipo de publicação.
function nextPublicId(prefix) {
  const row = db.prepare(
    `SELECT public_id FROM activities WHERE public_id LIKE ? ORDER BY id DESC LIMIT 1`
  ).get(prefix + '-%');
  let n = 1;
  if (row) {
    const parts = row.public_id.split('-');
    n = parseInt(parts[1], 10) + 1;
  }
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

module.exports = { db, nextPublicId };
