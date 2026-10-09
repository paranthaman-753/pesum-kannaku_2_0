import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { ParserError } from '../utils/errors.js';
import { SYSTEM_INSTRUCTION, buildUserPrompt } from '../utils/promptTemplate.js';

const MAX_ATTEMPTS = 3; // retry up to 3 times per model before falling back

// If the primary model is overloaded (503), we fall through this list automatically.
// Add or remove models to match what your API key supports.
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];

class TimeoutError extends Error {}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError('Gemini request timed out')), ms);
  });
  
  // Prevent unhandled rejection if the original promise fails after the timeout
  promise.catch(() => {});
  
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

// Returns true when the error is a transient overload that warrants a fallback.
function isOverloaded(error) {
  const msg = String(error?.message || '');
  return msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
}

// Returns true when the error is permanent (wrong model name, bad key, etc.).
function isPermanent(error) {
  const msg = String(error?.message || '');
  return msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('API_KEY');
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

  // Build the model chain: primary first, then fallbacks
  const models = [config.geminiModel, ...FALLBACK_MODELS.filter((m) => m !== config.geminiModel)];

  let lastError;

  for (const model of models) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: buildUserPrompt(text, knownCustomers),
            config: buildRequestConfig()
          }),
          config.geminiTimeoutMs
        );
        if (model !== config.geminiModel) {
          console.warn(`Gemini: used fallback model "${model}" because primary was unavailable.`);
        }
        return parseJsonObject(response.text);
      } catch (error) {
        lastError = error;
        console.error(`Gemini [${model}] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`);

        // Permanent errors (wrong model name, bad key) — no point retrying
        if (isPermanent(error)) break;

        // Overload — skip remaining retries for this model and try the next fallback
        if (isOverloaded(error)) break;

        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // backoff
        }
      }
    }
  }

  if (lastError instanceof ParserError) throw lastError;
  if (lastError instanceof TimeoutError) throw new ParserError('AI_TIMEOUT', 'The AI took too long to answer.');
  throw new ParserError('AI_REQUEST_FAILED', 'The AI request failed. Please try again in a moment.');
}
