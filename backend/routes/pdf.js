const express = require('express');
const { notesStore } = require('./notes');
const generatePdf = require('../services/pdfGenerator');

const router = express.Router();

/**
 * GET /api/download-pdf/:fileId
 * Streams a PDF of the generated notes to the client.
 */
router.get('/download-pdf/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const stored = notesStore[fileId];

    if (!stored) {
      return res.status(404).json({ error: 'Notes not found for this fileId. Please generate notes first.' });
    }

    console.log(`[PDF] Generating PDF for fileId: ${fileId}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="iRIS-notes-${fileId.slice(0, 8)}.pdf"`);

    // generatePdf pipes the PDF stream directly into the response
    await generatePdf(stored.notes, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
