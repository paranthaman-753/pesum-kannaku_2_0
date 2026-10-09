import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Notice from '../components/Notice.jsx';
import { addCustomer, getCustomers } from '../services/api.js';
import { noticeFromError } from '../utils/messages.js';
import { describeBalance, formatRupees } from '../utils/format.js';

export default function CustomerList({ onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState(null);

  async function loadCustomers() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getCustomers();
      setCustomers(result.customers);
    } catch (error) {
      setLoadError(noticeFromError(error));
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleAdd(event) {
    event.preventDefault();
    if (!newName.trim()) {
      setAddError({ title: 'Please enter a name.' });
      return;
    }
    try {
      await addCustomer(newName.trim());
      setNewName('');
      setAddError(null);
      setIsAdding(false);
      loadCustomers();
    } catch (error) {
      setAddError(noticeFromError(error));
    }
  }

  return (
    <div>
      <PageHeader title="Customers" backLabel="Home" onBack={() => onNavigate('home')} />

      {isAdding ? (
        <form className="add-customer" onSubmit={handleAdd}>
          <div className="field">
            <label htmlFor="new-customer">Customer name</label>
            <input
              id="new-customer"
              className="input"
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="முருகன்"
              autoFocus
            />
          </div>
          <Notice kind="error" message={addError} />
          <div className="button-row">
            <button type="button" className="btn btn-secondary" onClick={() => { setIsAdding(false); setAddError(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-secondary btn-spaced" onClick={() => setIsAdding(true)}>
          + Add customer
        </button>
      )}

      <Notice kind="error" message={loadError} />
      {isLoading && <p className="muted center">Loading...</p>}

      {!isLoading && !loadError && customers.length === 0 && (
        <p className="muted center">No customers yet. Add one, or make a new entry.</p>
      )}

      {customers.map((customer) => {
        const balance = describeBalance(customer.outstanding);
        return (
          <button
            key={customer._id}
            type="button"
            className="card customer-card"
            onClick={() => onNavigate('customer', { customerId: customer._id })}
          >
            <span className="customer-name">{customer.name}</span>
            <span className="customer-balance">
              <span className="muted small">{balance.label}</span>
              <span className={`amount amount-${balance.tone}`}>{formatRupees(balance.amount)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
