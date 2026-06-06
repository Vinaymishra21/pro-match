const mongoose = require('mongoose');

let isConnected = false;

async function connectDb() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to backend/.env (e.g. a free MongoDB Atlas cluster or mongodb://127.0.0.1:27017/promatch).'
    );
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  isConnected = true;

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  console.log('Connected to MongoDB');
  return mongoose.connection;
}

module.exports = {
  connectDb
};
