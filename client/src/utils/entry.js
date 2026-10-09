// An entry is the structured version of the sentence, before it is saved.
export function emptyEntry(customer = '') {
  return { intent: '', customer, item: '', quantity: null, unit: '', amount: null };
}

export const isValidType = (intent) => intent === 'credit' || intent === 'payment';
