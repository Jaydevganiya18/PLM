
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
require('dotenv').config();

const { sequelize } = require('./db');

const app        = express();
const httpServer = http.createServer(app);

// Socket.io 
const io = new Server(httpServer, {
  cors: {
    origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
    methods:     ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to every request so controllers can emit
app.use((req, _res, next) => { req.io = io; next(); });

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Client emits this right after login
  socket.on('join_role_room', (role) => {
    socket.join(`role_${role}`);
    console.log(`[Socket] ${socket.id} joined room: role_${role}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

module.exports.io = io;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/products',require('./routes/productRoutes'));
app.use('/api/boms',    require('./routes/bomRoutes'));
app.use('/api/ecos',    require('./routes/ecoRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'PLM Backend Running ✅', ts: new Date().toISOString() });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

//  Start 
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] MySQL connected ✅');
    await sequelize.sync({ alter: true });
    console.log('[DB] Tables synced ✅');
    httpServer.listen(PORT, () => {
      console.log(`[Server] Running → http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
})();
// trigger nodemon