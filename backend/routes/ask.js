const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { notesStore } = require('./notes');

const router = express.Router();

const USE_MOCK = !process.env.GEMINI_API_KEY;

let model;
if (!USE_MOCK) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 2048,
    },
  });
}

/**
 * Retries an async function with exponential backoff.
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<*>}
 */
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable =
        err.message?.includes('503') ||
        err.message?.includes('429') ||
        err.message?.includes('Service Unavailable') ||
        err.message?.includes('Too Many Requests') ||
        err.message?.includes('high demand');

      if (isRetryable && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(`[Ask] Attempt ${attempt} failed (${err.message.substring(0, 80)}...). Retrying in ${Math.round(delay / 1000)}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

/**
 * POST /api/ask
 * Body: { fileId: string, question: string }
 * Returns: { answer: string }
 */
router.post('/ask', async (req, res, next) => {
  try {
    const { fileId, question } = req.body;

    if (!fileId || !question) {
      return res.status(400).json({ error: 'fileId and question are required.' });
    }

    const stored = notesStore[fileId];
    if (!stored) {
      return res.status(404).json({ error: 'Notes not found for this fileId. Please generate notes first.' });
    }

    if (USE_MOCK) {
      // Return a mock answer in dev/no-key mode
      const mockAnswer = `[Mock Mode] Based on the notes, here is a simulated answer to "${question}": The content covers topics including the main subject discussed in your uploaded media. Set GEMINI_API_KEY in backend/.env to enable real AI answers.`;
      return res.status(200).json({ answer: mockAnswer });
    }

    // Build a context string from the notes
    const notesContext = stored.notes
      .map((block) => {
        const subtopics = block.subtopics?.map((s) => `  - ${s.title}: ${s.content}`).join('\n') || '';
        const defs = block.definitions?.map((d) => `  - ${d.term}: ${d.definition}`).join('\n') || '';
        return `## ${block.heading}\n${subtopics}\n${defs}`;
      })
      .join('\n\n');

    const answer = await withRetry(async () => {
      const chatSession = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: `You are a helpful study assistant. The user has generated study notes from their media. Answer their question based ONLY on the following notes:\n\n${notesContext}` }],
          },
          {
            role: 'model',
            parts: [{ text: 'Understood. I will answer questions based only on the study notes provided.' }],
          },
        ],
      });

      const result = await chatSession.sendMessage(question);
      return result.response.text().trim();
    });

    console.log(`[Ask] Q: "${question}" | A: ${answer.substring(0, 80)}...`);
    return res.status(200).json({ answer });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
