import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The single .env file lives in the project root (pesum-kanakku/.env).
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../../.env') });

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pesum_kanakku',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || '',
  geminiTimeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 30000,
  // Optional. Set to 0 to switch off "thinking" on Flash models for faster replies. Empty = do not send.
  geminiThinkingBudget: process.env.GEMINI_THINKING_BUDGET === undefined || process.env.GEMINI_THINKING_BUDGET === '' ? null : Number(process.env.GEMINI_THINKING_BUDGET)
};
