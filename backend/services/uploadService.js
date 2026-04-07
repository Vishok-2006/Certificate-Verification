const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { env } = require('../config/env');
const { createHttpError } = require('../utils/httpError');

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const allowedMimeTypes = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
};

const sanitizeFilename = (filename) => {
  const baseName = path.basename(filename, path.extname(filename));
  return baseName.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').slice(0, 60) || 'certificate';
};

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const safeName = sanitizeFilename(file.originalname);
    const extension = allowedMimeTypes[file.mimetype] || path.extname(file.originalname) || '.bin';
    cb(null, `${Date.now()}-${safeName}${extension}`);
  },
});

const certificateUpload = multer({
  storage,
  limits: { fileSize: env.maxUploadSizeBytes },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes[file.mimetype]) {
      return cb(createHttpError(400, 'Only PDF, PNG, and JPEG files are supported'));
    }

    cb(null, true);
  },
});

const toPublicFilePath = (file) => (file ? path.posix.join('uploads', file.filename) : null);

const toAbsoluteUploadPath = (filePath) => {
  if (!filePath) {
    return null;
  }

  return path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
};

const safeRemoveFile = (filePath) => {
  const absolutePath = toAbsoluteUploadPath(filePath);
  if (absolutePath && fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

module.exports = {
  certificateUpload,
  safeRemoveFile,
  toAbsoluteUploadPath,
  toPublicFilePath,
  uploadsDir,
};
