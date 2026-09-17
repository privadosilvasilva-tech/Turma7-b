require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const cookie = require('cookie');

const { db } = require('./db');
const { verifySocketToken } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const activitiesRoutes = require('./routes/activities');
const chatRoutes = require('./routes/chat');
const logsRoutes = require('./routes/logs');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('troque_por')) {
  console.error('ERRO: defina um JWT_SECRET forte no arquivo .env antes de iniciar o servidor.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/logs', logsRoutes);

app.get('/api/settings', (req, res) => {
  res.json({ nome_da_turma: process.env.NOME_DA_TURMA || 'Central da Turma' });
});

// Qualquer rota não encontrada na API cai no app (SPA); outras servem o index.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Socket.io: chat em tempo real ---
io.use((socket, next) => {
  try {
    const raw = socket.handshake.headers.cookie || '';
    const parsed = cookie.parse(raw);
    const user = verifySocketToken(parsed.token);
    if (!user) return next(new Error('unauthorized'));
    socket.user = user;
    next();
  } catch (e) {
    next(new Error('unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.join('turma');

  socket.on('chat:send', (content) => {
    const text = String(content || '').trim().slice(0, 2000);
    if (!text) return;
    const info = db.prepare('INSERT INTO messages (user_id, content) VALUES (?, ?)').run(socket.user.id, text);
    const message = {
      id: info.lastInsertRowid,
      content: text,
      created_at: new Date().toISOString(),
      deleted: 0,
      user_id: socket.user.id,
      display_name: socket.user.display_name,
      role: socket.user.role,
    };
    io.to('turma').emit('chat:new', message);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Central da turma rodando em http://localhost:${PORT}`);
});
