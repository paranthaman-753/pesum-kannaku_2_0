import { useState } from 'react';

// The edit screen. Every extracted field can be changed here.
export default function EntryForm({ entry, customers, onSave, onCancel }) {
  const [intent, setIntent] = useState(entry.intent || '');
  const [customer, setCustomer] = useState(entry.customer || '');
  const [item, setItem] = useState(entry.item || '');
  const [quantity, setQuantity] = useState(entry.quantity ?? '');
  const [unit, setUnit] = useState(entry.unit || '');
  const [amount, setAmount] = useState(entry.amount ?? '');
  const [errors, setErrors] = useState({});

  const isCredit = intent === 'credit';

  function handleSubmit(event) {
    event.preventDefault();
    const found = {};

    if (intent !== 'credit' && intent !== 'payment') found.intent = 'Choose Credit or Payment.';
    if (!customer.trim()) found.customer = 'Customer is required.';
    if (!(Number(amount) > 0)) found.amount = 'Amount must be greater than 0.';
    if (isCredit && String(quantity).trim() !== '' && !(Number(quantity) > 0)) {
      found.quantity = 'Quantity must be a positive number.';
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSave({
      intent,
      customer: customer.trim(),
      item: isCredit ? item.trim() : '',
      quantity: isCredit && String(quantity).trim() !== '' ? Number(quantity) : null,
      unit: isCredit ? unit.trim() : '',
      amount: Number(amount)
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <span className="field-label" id="type-label">Type</span>
        <div className="segmented" role="group" aria-labelledby="type-label">
          <button type="button" aria-pressed={intent === 'credit'} onClick={() => setIntent('credit')}>
            Credit (கடன்)
          </button>
          <button type="button" aria-pressed={intent === 'payment'} onClick={() => setIntent('payment')}>
            Payment (வரவு)
          </button>
        </div>
        {errors.intent && <p className="field-error">{errors.intent}</p>}
      </div>

      <div className="field">
        <label htmlFor="customer">Customer</label>
        <input
          id="customer"
          className="input"
          type="text"
          list="customer-options"
          value={customer}
          onChange={(event) => setCustomer(event.target.value)}
          placeholder="முருகன்"
        />
        <datalist id="customer-options">
          {customers.map((c) => (
            <option key={c._id} value={c.name} />
          ))}
        </datalist>
        {errors.customer && <p className="field-error">{errors.customer}</p>}
      </div>

      {isCredit && (
        <>
          <div className="field">
            <label htmlFor="item">Item</label>
            <input id="item" className="input" type="text" value={item} onChange={(e) => setItem(e.target.value)} placeholder="அரிசி" />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                className="input"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="2"
              />
              {errors.quantity && <p className="field-error">{errors.quantity}</p>}
            </div>
            <div className="field">
              <label htmlFor="unit">Unit</label>
              <input id="unit" className="input" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg" />
            </div>
          </div>
        </>
      )}

      <div className="field">
        <label htmlFor="amount">Amount (₹)</label>
        <input
          id="amount"
          className="input"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="120"
        />
        {errors.amount && <p className="field-error">{errors.amount}</p>}
      </div>

      <div className="button-row">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save</button>
      </div>
    </form>
  );
}
