// Creates (or updates) an admin user for the dashboard.
//   node src/seedAdmin.js <email> <password> [name]
// Defaults to admin@promatch.app / admin123 if no args given (dev convenience).
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDb } = require('./utils/db');
const { User } = require('./models');

async function main() {
  const email = (process.argv[2] || 'admin@promatch.app').trim().toLowerCase();
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'Admin';

  await connectDb();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.findOneAndUpdate(
    { email },
    { email, name, passwordHash, isAdmin: true, profession: user_profession() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('✅ Admin ready');
  console.log('   email:   ', email);
  console.log('   password:', password);
  console.log('   id:      ', user.id);
  process.exit(0);
}

// Admins still need a profession to satisfy app constraints if they ever log
// into the mobile app; harmless placeholder.
function user_profession() {
  return 'Software Engineer';
}

main().catch((e) => {
  console.error('Admin seed failed:', e.message);
  process.exit(1);
});
