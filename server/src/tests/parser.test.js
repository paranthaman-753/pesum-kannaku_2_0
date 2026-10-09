// These tests check OUR code (cleaning, validation, missing-field detection) using
// pretend AI answers. They do NOT call Gemini and do NOT prove real-world Tamil accuracy.
// To check the real model against the same sentences, run: npm run eval:ai
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseTransactionText,
  normalizeAiResult,
  matchSavedCustomer,
  toPositiveNumber
} from '../services/parserService.js';
import { parseJsonObject } from '../services/geminiService.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sentences = JSON.parse(fs.readFileSync(path.join(here, 'testSentences.json'), 'utf8'));
const byId = (id) => sentences.find((s) => s.id === id);

// A fake AI that returns a fixed answer.
const fakeAi = (answer) => async () => answer;

test('sample file has at least 20 sentences covering every required case', () => {
  assert.ok(sentences.length >= 20);
  const categories = new Set(sentences.map((s) => s.category));
  for (const needed of ['tamil_credit', 'tanglish_credit', 'payment', 'missing_amount', 'unknown_customer', 'number_words', 'numeric_amount']) {
    assert.ok(categories.has(needed), `missing category: ${needed}`);
  }
});

test('every sample sentence passes through the parser pipeline unchanged', async () => {
  for (const sample of sentences) {
    const result = await parseTransactionText(sample.input, { aiParse: fakeAi(sample.expected) });
    assert.deepEqual(result.data, sample.expected, `data mismatch for sentence ${sample.id}`);
    assert.deepEqual(result.missingFields, sample.expectedMissing, `missing fields mismatch for sentence ${sample.id}`);
    assert.equal(result.success, sample.expectedMissing.length === 0);
  }
});

test('Tamil credit sentence is accepted', async () => {
  const sample = byId(1);
  const result = await parseTransactionText(sample.input, { aiParse: fakeAi(sample.expected) });
  assert.equal(result.success, true);
  assert.equal(result.data.intent, 'credit');
  assert.equal(result.data.customer, 'முருகன்');
  assert.equal(result.data.item, 'அரிசி');
  assert.equal(result.data.quantity, 2);
  assert.equal(result.data.amount, 120);
});

test('Tanglish credit sentence is accepted', async () => {
  const sample = byId(3);
  const result = await parseTransactionText(sample.input, { aiParse: fakeAi(sample.expected) });
  assert.equal(result.success, true);
  assert.equal(result.data.unit, 'L');
});

test('payment drops item details even if the AI returns them', async () => {
  const result = await parseTransactionText('Murugan 200 ரூபாய் கொடுத்துட்டாரு', {
    aiParse: fakeAi({ intent: 'payment', customer: 'Murugan', item: 'rice', quantity: 2, unit: 'kg', amount: 200 })
  });
  assert.equal(result.success, true);
  assert.deepEqual(result.data, { intent: 'payment', customer: 'Murugan', item: null, quantity: null, unit: null, amount: 200 });
});

test('missing amount is reported and nothing is invented', async () => {
  const result = await parseTransactionText('x', {
    aiParse: fakeAi({ intent: 'credit', customer: 'Murugan', item: 'dal', quantity: 5, unit: 'kg', amount: null })
  });
  assert.equal(result.success, false);
  assert.deepEqual(result.missingFields, ['amount']);
  assert.equal(result.data.amount, null);
});

test('unknown customer is reported', async () => {
  const result = await parseTransactionText('x', {
    aiParse: fakeAi({ intent: 'payment', customer: null, amount: 300 })
  });
  assert.equal(result.success, false);
  assert.deepEqual(result.missingFields, ['customer']);
});

test('unknown intent is reported', async () => {
  const result = await parseTransactionText('x', { aiParse: fakeAi({ intent: 'refund', customer: 'Ravi', amount: 50 }) });
  assert.equal(result.success, false);
  assert.ok(result.missingFields.includes('intent'));
});

test('number words: numbers returned as text are converted, bad values become null', () => {
  assert.equal(toPositiveNumber(2), 2);
  assert.equal(toPositiveNumber('2'), 2);
  assert.equal(toPositiveNumber('1.5'), 1.5);
  assert.equal(toPositiveNumber('₹1,200'), 1200);
  assert.equal(toPositiveNumber('Rs. 85.50'), 85.5);
  assert.equal(toPositiveNumber('இரண்டு'), null);
  assert.equal(toPositiveNumber('two'), null);
  assert.equal(toPositiveNumber(0), null);
  assert.equal(toPositiveNumber(-5), null);
  assert.equal(toPositiveNumber(NaN), null);
  assert.equal(toPositiveNumber(null), null);
});

test('numeric amount given as text is normalized', () => {
  const data = normalizeAiResult({ intent: 'credit', customer: 'Kumar', amount: '400' });
  assert.equal(data.amount, 400);
});

test('units and text are cleaned; the string "null" becomes null', () => {
  const data = normalizeAiResult({ intent: 'credit', customer: ' Ravi ', item: 'Oil', quantity: 1, unit: 'litre', amount: 180 });
  assert.equal(data.customer, 'Ravi');
  assert.equal(data.item, 'oil');
  assert.equal(data.unit, 'L');
  assert.equal(normalizeAiResult({ intent: 'credit', customer: 'null', amount: 5 }).customer, null);
});

test('customer name snaps to the saved spelling', () => {
  const data = normalizeAiResult({ intent: 'credit', customer: 'murugan', amount: 10 }, ['Murugan', 'Ravi']);
  assert.equal(data.customer, 'Murugan');
});

test('Tamil names and items are kept exactly as spoken (no translation)', () => {
  const data = normalizeAiResult({ intent: 'credit', customer: 'முருகன்', item: 'துவரம் பருப்பு', quantity: 1, unit: 'கிலோ', amount: 160 });
  assert.equal(data.customer, 'முருகன்');
  assert.equal(data.item, 'துவரம் பருப்பு');
});

test('Tamil text is normalized so the same word always compares equal', () => {
  const decomposed = 'ரவி'.normalize('NFD');
  const data = normalizeAiResult({ intent: 'credit', customer: decomposed, amount: 5 }, ['ரவி']);
  assert.equal(data.customer, 'ரவி');
});

test('a saved customer in another script is not forced to match', () => {
  assert.equal(matchSavedCustomer('முருகன்', ['Murugan']), 'முருகன்');
});

test('one-letter speech slips snap to the saved customer, but only when unambiguous', () => {
  assert.equal(matchSavedCustomer('முருகண்', ['முருகன்', 'ரவி']), 'முருகன்');
  assert.equal(matchSavedCustomer('குமரன்', ['குமார்', 'குமரன்']), 'குமரன்'); // exact wins
  assert.equal(matchSavedCustomer('ரவி', ['ரவீ']), 'ரவி'); // too short to guess
  assert.equal(matchSavedCustomer('Kumara', ['Kumar', 'Kumari']), 'Kumara'); // two close matches: do not guess
});

test('extra fields from the AI are dropped', () => {
  const data = normalizeAiResult({ intent: 'credit', customer: 'Ravi', amount: 10, balance: 999 });
  assert.deepEqual(Object.keys(data).sort(), ['amount', 'customer', 'intent', 'item', 'quantity', 'unit']);
});

test('parseJsonObject accepts fenced JSON and rejects junk', () => {
  assert.deepEqual(parseJsonObject('```json\n{"a":1}\n```'), { a: 1 });
  assert.throws(() => parseJsonObject('not json'), { code: 'AI_BAD_RESPONSE' });
  assert.throws(() => parseJsonObject('[1,2]'), { code: 'AI_BAD_RESPONSE' });
});

test('AI errors are passed up so the controller can show a friendly message', async () => {
  const failingAi = async () => { throw Object.assign(new Error('boom'), { code: 'AI_REQUEST_FAILED' }); };
  await assert.rejects(parseTransactionText('x', { aiParse: failingAi }), { code: 'AI_REQUEST_FAILED' });
});
