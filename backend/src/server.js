require('dotenv').config();
require('express-async-errors');

// Fail fast on missing/insecure security config before anything boots.
const { validateEnv } = require('./config/env');
validateEnv();

const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { connectDb } = require('./utils/db');
const { initIo } = require('./realtime/io');
const { globalLimiter } = require('./middleware/rateLimit');
const { UPLOAD_DIR, PUBLIC_PATH, ensureUploadDir } = require('./utils/storage');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const discoverRoutes = require('./routes/discoverRoutes');
const swipeRoutes = require('./routes/swipeRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const likesRoutes = require('./routes/likesRoutes');
const billingRoutes = require('./routes/billingRoutes');
const boostRoutes = require('./routes/boostRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const legal = require('./controllers/legalController');

const app = express();
const port = process.env.PORT || 4000;

// Behind a reverse proxy / load balancer in production, so req.ip reflects the
// real client (X-Forwarded-For) — required for correct per-IP rate limiting.
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Serve uploaded images statically (local-disk storage provider).
ensureUploadDir();
app.use(PUBLIC_PATH, express.static(UPLOAD_DIR));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'pro-match-backend' });
});

// Public legal pages — these URLs double as the App Store / Play Store
// submission links, so they stay before auth + the rate limiter so reviewers
// (and users) can always reach them.
app.get('/terms', legal.terms);
app.get('/privacy', legal.privacy);

// Broad per-IP backstop across the whole API (health check stays exempt above).
app.use(globalLimiter);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/discover', discoverRoutes);
app.use('/swipes', swipeRoutes);
app.use('/messages', messageRoutes);
app.use('/uploads', uploadRoutes);
app.use('/likes', likesRoutes);
app.use('/billing', billingRoutes);
app.use('/boost', boostRoutes);
app.use('/safety', safetyRoutes);
app.use('/admin', adminRoutes);

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
      console.log(`Wovnn backend running on http://localhost:${port} (REST + Socket.IO)`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
