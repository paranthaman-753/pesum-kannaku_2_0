// Optional: runs the sample sentences through the REAL Gemini parser and prints how many
// match the expected answers. Needs GEMINI_API_KEY and GEMINI_MODEL in .env and internet.
//   npm run eval:ai
// This is a quick sanity check on a small sample, not a measure of real-world accuracy.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTransactionText } from '../src/services/parserService.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sentences = JSON.parse(fs.readFileSync(path.join(here, '../src/tests/testSentences.json'), 'utf8'));
const FIELDS = ['intent', 'customer', 'item', 'quantity', 'unit', 'amount'];

const same = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();

let fullMatches = 0;
const fieldHits = Object.fromEntries(FIELDS.map((f) => [f, 0]));

for (const sample of sentences) {
  try {
    const { data } = await parseTransactionText(sample.input);
    const wrong = FIELDS.filter((f) => !same(data[f], sample.expected[f]));
    FIELDS.forEach((f) => { if (!wrong.includes(f)) fieldHits[f] += 1; });
    if (wrong.length === 0) fullMatches += 1;
    console.log(`${wrong.length === 0 ? 'OK  ' : 'DIFF'} #${sample.id} ${sample.input}`);
    for (const f of wrong) console.log(`       ${f}: expected ${sample.expected[f]}, got ${data[f]}`);
  } catch (error) {
    console.log(`FAIL #${sample.id} ${sample.input} (${error.code || error.message})`);
    if (error.code === 'AI_NOT_CONFIGURED') process.exit(1);
  }
}

console.log(`\nAll fields matched: ${fullMatches}/${sentences.length}`);
for (const f of FIELDS) console.log(`  ${f}: ${fieldHits[f]}/${sentences.length}`);
