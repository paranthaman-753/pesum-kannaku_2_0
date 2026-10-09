export default function TypeLabel({ type }) {
  if (type === 'payment') return <span className="type-label type-payment">Payment</span>;
  if (type === 'credit') return <span className="type-label type-credit">Credit</span>;
  return <span className="type-label">—</span>;
}
