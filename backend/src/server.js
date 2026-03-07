require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const discoverRoutes = require('./routes/discoverRoutes');
const swipeRoutes = require('./routes/swipeRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'pro-match-backend' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/discover', discoverRoutes);
app.use('/swipes', swipeRoutes);
app.use('/messages', messageRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Pro Match backend running on http://localhost:${port}`);
});
