import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Notice from '../components/Notice.jsx';
import { getCustomer } from '../services/api.js';
import { noticeFromError } from '../utils/messages.js';
import { describeBalance, describeEntry, formatDate, formatRupees } from '../utils/format.js';

export default function CustomerDetail({ customerId, onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    getCustomer(customerId)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(noticeFromError(err)); });
    return () => { cancelled = true; };
  }, [customerId]);

  if (error) {
    return (
      <div>
        <PageHeader title="Customer" backLabel="Customers" onBack={() => onNavigate('customers')} />
        <Notice kind="error" message={error} />
      </div>
    );
  }
  if (!data) return <p className="muted center">Loading...</p>;

  const { customer, transactions } = data;
  const balance = describeBalance(customer.outstanding);

  return (
    <div>
      <PageHeader title={customer.name} backLabel="Customers" onBack={() => onNavigate('customers')} />

      <section className="balance">
        <p className="muted">{balance.label}</p>
        <p className={`balance-amount amount-${balance.tone}`}>{formatRupees(balance.amount)}</p>
      </section>

      <button
        type="button"
        className="btn btn-primary"
        onClick={() => onNavigate('new-entry', { customerId: customer._id })}
      >
        + New Entry
      </button>

      <h2 className="section-title section-spaced">Transaction History</h2>

      {transactions.length === 0 ? (
        <p className="muted">No entries yet.</p>
      ) : (
        <ul className="ledger">
          {transactions.map((tx) => (
            <li key={tx._id} className="ledger-row">
              <div>
                <p className="ledger-item">{describeEntry(tx)}</p>
                <p className="muted small">{formatDate(tx.createdAt)}</p>
              </div>
              <div className="ledger-amount">
                <p className="amount">{formatRupees(tx.amount)}</p>
                <p className={`small type-${tx.type}`}>{tx.type === 'credit' ? 'Credit' : 'Payment'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
