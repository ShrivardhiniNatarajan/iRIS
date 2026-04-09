const express = require('express');
const path = require('path');
const fs = require('fs');
const transcribe = require('../services/transcription');
const generateNotes = require('../services/noteGenerator');

const router = express.Router();

// In-memory store for generated notes (keyed by fileId)
// In production you'd use a database or Redis
const notesStore = {};

/**
 * POST /api/generate-notes
 * Body: { fileId: string }
 * Returns: { fileId, notes: [ { heading, subtopics, definitions } ] }
 */
router.post('/generate-notes', async (req, res, next) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required.' });
    }

    // Find the uploaded file on disk
    const uploadsDir = path.join(__dirname, '../uploads');
    const files = fs.readdirSync(uploadsDir);
    const match = files.find((f) => f.startsWith(fileId));

    if (!match) {
      return res.status(404).json({ error: `No file found for fileId: ${fileId}` });
    }

    const filePath = path.join(uploadsDir, match);

    console.log(`[Notes] Transcribing: ${match}`);
    const transcript = await transcribe(filePath);

    console.log(`[Notes] Transcript length: ${transcript.length} chars. Generating notes...`);
    const notes = await generateNotes(transcript);

    // Cache notes for Q&A and PDF download
    notesStore[fileId] = { notes, transcript, generatedAt: new Date().toISOString() };

    return res.status(200).json({ fileId, notes });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.notesStore = notesStore;
