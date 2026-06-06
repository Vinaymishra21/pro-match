require('dotenv').config();
require('express-async-errors');

const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { connectDb } = require('./utils/db');
const { initIo } = require('./realtime/io');
const { UPLOAD_DIR, PUBLIC_PATH, ensureUploadDir } = require('./utils/storage');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const discoverRoutes = require('./routes/discoverRoutes');
const swipeRoutes = require('./routes/swipeRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const likesRoutes = require('./routes/likesRoutes');
const billingRoutes = require('./routes/billingRoutes');
const safetyRoutes = require('./routes/safetyRoutes');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded images statically (local-disk storage provider).
ensureUploadDir();
app.use(PUBLIC_PATH, express.static(UPLOAD_DIR));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'pro-match-backend' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/discover', discoverRoutes);
app.use('/swipes', swipeRoutes);
app.use('/messages', messageRoutes);
app.use('/uploads', uploadRoutes);
app.use('/likes', likesRoutes);
app.use('/billing', billingRoutes);
app.use('/safety', safetyRoutes);

app.use((err, req, res, next) => {
  // Multer / validation errors are user-facing 400s; everything else is 500.
  if (err && (err.name === 'MulterError' || err.message?.includes('images are allowed'))) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

async function start() {
  try {
    await connectDb();
    const server = http.createServer(app);
    initIo(server);
    server.listen(port, () => {
      console.log(`Pro Match backend running on http://localhost:${port} (REST + Socket.IO)`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
