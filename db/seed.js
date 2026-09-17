require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('./index');

const username = process.env.OWNER_USERNAME;
const password = process.env.OWNER_PASSWORD;

if (!username || !password) {
  console.error('Defina OWNER_USERNAME e OWNER_PASSWORD no arquivo .env antes de rodar o seed.');
  process.exit(1);
}

const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('owner');
if (existing) {
  console.log('Já existe um proprietário cadastrado. Nenhuma ação foi feita.');
  console.log('Para trocar a senha do proprietário, use o próprio painel administrativo depois de logar.');
  process.exit(0);
}

const hash = bcrypt.hashSync(password, 12);
db.prepare(
  `INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, 'owner')`
).run(username, hash, username);

console.log(`Conta do proprietário "${username}" criada com sucesso.`);
console.log('Agora você pode remover OWNER_USERNAME e OWNER_PASSWORD do arquivo .env por segurança.');
