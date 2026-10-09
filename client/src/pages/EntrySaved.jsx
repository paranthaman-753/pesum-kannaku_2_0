import Notice from '../components/Notice.jsx';
import TypeLabel from '../components/TypeLabel.jsx';
import { describeEntry, formatRupees } from '../utils/format.js';

export default function EntrySaved({ saved, onNavigate }) {
  const { customer, transaction, balance } = saved;

  return (
    <div>
      <Notice kind="success">
        <p className="notice-title">✓ Entry saved</p>
      </Notice>

      <div className="slip">
        <p className="slip-value">{customer.name}</p>
        {transaction.type === 'credit' && <p>{describeEntry(transaction)}</p>}
        <p className="slip-amount">
          {formatRupees(transaction.amount)} <TypeLabel type={transaction.type} />
        </p>
        <p className="muted">
          {balance.outstanding < 0
            ? `Paid in advance ${formatRupees(Math.abs(balance.outstanding))}`
            : `Outstanding now ${formatRupees(balance.outstanding)}`}
        </p>
      </div>

      <div className="button-row">
        <button type="button" className="btn btn-secondary" onClick={() => onNavigate('customer', { customerId: customer._id })}>
          View Customer
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('new-entry')}>
          New Entry
        </button>
      </div>
    </div>
  );
}
