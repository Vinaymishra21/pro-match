// Storage provider abstraction. Today it's local disk; swap the body of
// saveBuffer()/publicUrl() for Cloudinary or S3 later without touching callers.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const PUBLIC_PATH = '/uploads';

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Builds an absolute, client-usable URL for a stored file.
// Android emulator can't reach "localhost", so we honour PUBLIC_BASE_URL when set
// (e.g. http://10.0.2.2:4000) and otherwise fall back to the request's own host.
function publicUrl(req, filename) {
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}${PUBLIC_PATH}/${filename}`;
}

function extFromMime(mime) {
  const map = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  return map[mime] || '.jpg';
}

async function saveBuffer(buffer, mime) {
  ensureUploadDir();
  const filename = `${crypto.randomBytes(16).toString('hex')}${extFromMime(mime)}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return filename;
}

module.exports = { UPLOAD_DIR, PUBLIC_PATH, ensureUploadDir, publicUrl, saveBuffer };
