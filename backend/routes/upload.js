const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    // Store as <uuid><ext> so we can retrieve it by fileId later
    cb(null, `${fileId}${ext}`);
  },
});

const allowedMimeTypes = [
  'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-wav',
  'audio/ogg', 'audio/webm', 'audio/flac',
  'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
  'video/mpeg',
];

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/upload
 * Accepts a multipart/form-data file upload.
 * Returns: { fileId: string, originalName: string, size: number }
 */
router.post('/upload', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Extract the UUID from the stored filename (strip extension)
    const fileId = path.basename(req.file.filename, path.extname(req.file.filename));

    console.log(`[Upload] Received: ${req.file.originalname} → fileId: ${fileId}`);

    return res.status(200).json({
      fileId,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
