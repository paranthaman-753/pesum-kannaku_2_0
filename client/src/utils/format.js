export function formatRupees(value) {
  const number = Number(value) || 0;
  return `₹${number.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// "10 Oct" (the year is added only when it is not the current year)
export function formatDate(isoString) {
  const date = new Date(isoString);
  const options = { day: 'numeric', month: 'short' };
  if (date.getFullYear() !== new Date().getFullYear()) options.year = 'numeric';
  return date.toLocaleDateString('en-IN', options);
}

export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "2 kg", "1.5 kg", "" when there is no quantity
export function formatQuantity(quantity, unit) {
  if (!quantity) return '';
  return unit ? `${quantity} ${unit}` : String(quantity);
}

// "Rice — 2 kg", "Rice", or "Credit" when nothing else is known
export function describeEntry({ type, intent, item, quantity, unit }) {
  const entryType = type || intent;
  if (entryType === 'payment') return 'Payment';
  const parts = [capitalize(item), formatQuantity(quantity, unit)].filter(Boolean);
  return parts.length ? parts.join(' — ') : 'Credit';
}

// A negative balance means the customer has paid more than they owe.
export function describeBalance(outstanding) {
  const value = Number(outstanding) || 0;
  if (value < 0) return { label: 'Paid in advance', amount: Math.abs(value), tone: 'good' };
  if (value === 0) return { label: 'Outstanding', amount: 0, tone: 'good' };
  return { label: 'Outstanding', amount: value, tone: 'owed' };
}
