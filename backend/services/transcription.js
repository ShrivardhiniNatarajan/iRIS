const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');

const USE_MOCK = !process.env.GEMINI_API_KEY;

let genAI;
let fileManager;
let model;
if (!USE_MOCK) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// Map common extensions to MIME types
const MIME_MAP = {
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  webm: 'video/webm',
  flac: 'audio/flac',
  aac: 'audio/aac',
  mpeg: 'video/mpeg',
  mov: 'video/quicktime',
};

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
        console.log(`[Transcription] Attempt ${attempt} failed (${err.message.substring(0, 80)}...). Retrying in ${Math.round(delay / 1000)}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Transcribes an audio/video file using Google Gemini.
 * Falls back to a mock transcript when GEMINI_API_KEY is not set.
 *
 * @param {string} filePath - Absolute path to the media file
 * @returns {Promise<string>} - Plain-text transcript
 */
async function transcribe(filePath) {
  if (USE_MOCK) {
    console.log('[Transcription] Running in MOCK mode (no GEMINI_API_KEY set).');
    // Return a realistic mock transcript for UI testing
    return `Welcome to today's lecture on artificial intelligence and machine learning.
We will cover three main topics: the fundamentals of neural networks,
the difference between supervised and unsupervised learning,
and a brief overview of large language models.

A neural network is a series of algorithms that endeavours to recognize underlying
relationships in a set of data through a process that mimics the way the human brain operates.
Neural networks consist of layers: an input layer, one or more hidden layers, and an output layer.

Supervised learning is a type of machine learning where the model is trained on labelled data.
Examples include image classification and spam detection.

Unsupervised learning, on the other hand, works with unlabelled data.
The model tries to find patterns on its own. Clustering and dimensionality reduction are common techniques.

Large language models, or LLMs, are trained on massive datasets of text and can generate
human-like text, answer questions, and summarize documents.
Examples include GPT-4, Claude, and Gemini.`;
  }

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeType = MIME_MAP[ext] || 'application/octet-stream';
  const fileName = path.basename(filePath);

  console.log(`[Transcription] Uploading ${fileName} (${mimeType}) to Gemini...`);

  // Upload the file to Gemini File API
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: fileName,
  });

  console.log(`[Transcription] File uploaded: ${uploadResult.file.uri}`);

  // Ask Gemini to transcribe the media (with retry for transient errors)
  const transcript = await withRetry(async () => {
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      {
        text: 'Please transcribe this audio/video file into plain text. Output ONLY the transcript, no commentary, no timestamps, no formatting — just the spoken words as plain text.',
      },
    ]);

    return result.response.text().trim();
  });

  console.log(`[Transcription] Done — ${transcript.length} characters`);
  return transcript;
}

module.exports = transcribe;
