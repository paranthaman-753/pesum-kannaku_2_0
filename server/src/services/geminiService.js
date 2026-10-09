import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { ParserError } from '../utils/errors.js';
import { SYSTEM_INSTRUCTION, buildUserPrompt } from '../utils/promptTemplate.js';

const MAX_ATTEMPTS = 5; // retry multiple times if Gemini is overloaded

class TimeoutError extends Error {}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError('Gemini request timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Turns the model's text into an object. Tolerates ```json fences.
export function parseJsonObject(rawText) {
  const cleaned = String(rawText || '')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ParserError('AI_BAD_RESPONSE', 'The AI did not return valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ParserError('AI_BAD_RESPONSE', 'The AI did not return a JSON object.');
  }
  return parsed;
}

function buildRequestConfig() {
  const requestConfig = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0,
    responseMimeType: 'application/json'
  };
  if (config.geminiThinkingBudget !== null && Number.isFinite(config.geminiThinkingBudget)) {
    requestConfig.thinkingConfig = { thinkingBudget: config.geminiThinkingBudget };
  }
  return requestConfig;
}

// The only file that talks to Gemini. To switch AI providers later, replace this file.
export async function callGemini(text, knownCustomers = []) {
  if (!config.geminiApiKey || !config.geminiModel) {
    throw new ParserError(
      'AI_NOT_CONFIGURED',
      'GEMINI_API_KEY or GEMINI_MODEL is missing in the .env file.'
    );
  }

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: config.geminiModel,
          contents: buildUserPrompt(text, knownCustomers),
          config: buildRequestConfig()
        }),
        config.geminiTimeoutMs
      );
      return parseJsonObject(response.text);
    } catch (error) {
      lastError = error;
      console.error(`Gemini attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1500 * attempt)); // exponential backoff
      }
    }
  }

  if (lastError instanceof ParserError) throw lastError;
  if (lastError instanceof TimeoutError) throw new ParserError('AI_TIMEOUT', 'The AI took too long to answer.');
  throw new ParserError('AI_REQUEST_FAILED', 'The AI request failed.');
}
