const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'db.json');

function ensureDbFile() {
  if (!fs.existsSync(DB_PATH)) {
    const initialDb = {
      users: [],
      swipes: [],
      matches: [],
      messages: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDbFile();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(nextDb) {
  fs.writeFileSync(DB_PATH, JSON.stringify(nextDb, null, 2), 'utf-8');
}

module.exports = {
  readDb,
  writeDb
};
