const { GoogleGenerativeAI } = require('@google/generative-ai');

const USE_MOCK = !process.env.GEMINI_API_KEY;

let genAI;
let model;
if (!USE_MOCK) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });
}

const SYSTEM_PROMPT = `You are an expert academic note-taker. Given a raw transcript, produce structured study notes in the following JSON format. Output ONLY the JSON array, no markdown fences, no extra text.

[
  {
    "heading": "Section Title",
    "subtopics": [
      { "title": "Subtopic Title", "content": "Clear explanation of this subtopic." }
    ],
    "definitions": [
      { "term": "Key Term", "definition": "Precise definition of the term." }
    ]
  }
]

Guidelines:
- Group related content into 2–5 top-level sections.
- Each section must have a heading, at least one subtopic, and zero or more definitions.
- Keep subtopic content concise and informative (2–4 sentences).
- Definitions should be precise and academically worded.
- Preserve technical terminology from the transcript.`;

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
        console.log(`[NoteGenerator] Attempt ${attempt} failed (${err.message.substring(0, 80)}...). Retrying in ${Math.round(delay / 1000)}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Strips markdown fences and extracts JSON from a response string.
 * @param {string} raw - Raw response text
 * @returns {string} - Cleaned JSON string
 */
function cleanJsonResponse(raw) {
  let cleaned = raw.trim();
  // Remove markdown code fences (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return cleaned.trim();
}

/**
 * Generates structured study notes from a transcript using Gemini.
 * Falls back to mock notes when GEMINI_API_KEY is not set.
 *
 * @param {string} transcript - Plain-text transcript
 * @returns {Promise<Array>} - Structured notes array
 */
async function generateNotes(transcript) {
  if (USE_MOCK) {
    console.log('[NoteGenerator] Running in MOCK mode.');
    return [
      {
        heading: '1. Introduction to Neural Networks',
        subtopics: [
          {
            title: '1.1 What is a Neural Network?',
            content:
              'A neural network is a computational model inspired by the structure of the human brain. It consists of interconnected nodes (neurons) arranged in layers, enabling it to learn complex patterns from data.',
          },
          {
            title: '1.2 Network Architecture',
            content:
              'Neural networks are composed of an input layer, one or more hidden layers, and an output layer. Each layer transforms its input data, progressively extracting higher-level features.',
          },
        ],
        definitions: [
          {
            term: 'Neural Network',
            definition:
              'A series of algorithms that endeavours to recognise underlying relationships in a set of data through a process that mimics the way the human brain operates.',
          },
        ],
      },
      {
        heading: '2. Types of Machine Learning',
        subtopics: [
          {
            title: '2.1 Supervised Learning',
            content:
              'Supervised learning trains a model on labelled data, where each input is paired with the correct output. Common applications include image classification, spam detection, and regression tasks.',
          },
          {
            title: '2.2 Unsupervised Learning',
            content:
              'Unsupervised learning finds patterns in unlabelled data without explicit guidance. Key techniques include clustering (e.g., k-means) and dimensionality reduction (e.g., PCA).',
          },
        ],
        definitions: [
          {
            term: 'Supervised Learning',
            definition:
              'A machine learning paradigm where a model is trained on a labelled dataset, learning to map inputs to outputs based on example input-output pairs.',
          },
          {
            term: 'Unsupervised Learning',
            definition:
              'A type of machine learning that discovers inherent structure in data without the use of labelled responses.',
          },
        ],
      },
      {
        heading: '3. Large Language Models (LLMs)',
        subtopics: [
          {
            title: '3.1 Overview',
            content:
              'Large language models are trained on massive text corpora and can generate coherent, contextually relevant text. They power applications such as question answering, summarisation, and code generation.',
          },
        ],
        definitions: [
          {
            term: 'Large Language Model (LLM)',
            definition:
              'A type of deep learning model trained on vast amounts of text data to understand and generate human-like language, typically based on the transformer architecture.',
          },
        ],
      },
    ];
  }

  return withRetry(async () => {
    const chatSession = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I will generate structured study notes in the specified JSON format from any transcript you provide.' }],
        },
      ],
    });

    const result = await chatSession.sendMessage(
      `Generate structured study notes from the following transcript:\n\n${transcript}`
    );

    let raw = cleanJsonResponse(result.response.text());

    // The model might return { "notes": [...] } instead of a bare array
    let parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.notes && Array.isArray(parsed.notes)) return parsed.notes;

    // Fallback: try to find any array value in the object
    const firstArray = Object.values(parsed).find(Array.isArray);
    if (firstArray) return firstArray;

    throw new Error('Unexpected note generation response format from Gemini.');
  });
}

module.exports = generateNotes;
