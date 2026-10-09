// Tamil text can be typed or recognised with different Unicode compositions of the same word.
// NFC makes them identical so "முருகன்" always compares equal to "முருகன்".
const tidy = (text) => String(text || '').normalize('NFC').trim().replace(/\s+/g, ' ');

// Used to compare customer names ("murugan", "Murugan " and "MURUGAN" are the same person).
export function makeNameKey(name) {
  return tidy(name).toLowerCase();
}

export function cleanName(name) {
  return tidy(name);
}

// Number of single-letter changes needed to turn a into b (used to forgive small speech mistakes).
export function editDistance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
    }
  }
  return rows[a.length][b.length];
}
