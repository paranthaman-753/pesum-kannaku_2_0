import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import EntryForm from '../components/EntryForm.jsx';
import Notice from '../components/Notice.jsx';
import TypeLabel from '../components/TypeLabel.jsx';
import { getCustomers, saveTransaction } from '../services/api.js';
import { MESSAGES, noticeFromError } from '../utils/messages.js';
import { capitalize, formatQuantity, formatRupees } from '../utils/format.js';
import { isValidType } from '../utils/entry.js';

// What still has to be filled in before the entry can be saved.
function firstProblem(data) {
  if (!data.customer) return MESSAGES.missingCustomer;
  if (!isValidType(data.intent)) return MESSAGES.missingType;
  if (!(Number(data.amount) > 0)) return MESSAGES.missingAmount;
  return null;
}

function Row({ label, children }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function ConfirmEntry({ entry, onSaved, onNavigate }) {
  const [data, setData] = useState(entry.data);
  const [isEditing, setIsEditing] = useState(Boolean(entry.startEditing));
  const [customers, setCustomers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    getCustomers()
      .then((result) => setCustomers(result.customers))
      .catch(() => setCustomers([]));
  }, []);

  const problem = firstProblem(data);
  const isNewCustomer =
    data.customer &&
    customers.length > 0 &&
    !customers.some((c) => c.name.toLowerCase() === data.customer.toLowerCase());

  async function handleConfirm() {
    if (problem || isSaving) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await saveTransaction({
        customerName: data.customer,
        type: data.intent,
        item: data.item || null,
        quantity: data.quantity,
        unit: data.unit || null,
        amount: data.amount,
        originalText: entry.originalText
      });
      onSaved({
        customer: result.customer,
        transaction: result.transaction,
        balance: result.balance
      });
    } catch (error) {
      setIsSaving(false);
      setSaveError(noticeFromError(error));
    }
  }

  if (isEditing) {
    return (
      <div>
        <PageHeader title="Edit entry" />
        <EntryForm
          entry={data}
          customers={customers}
          onCancel={() => setIsEditing(false)}
          onSave={(updated) => {
            setData(updated);
            setIsEditing(false);
          }}
        />
      </div>
    );
  }

  const isCredit = data.intent === 'credit';
  const isPayment = data.intent === 'payment';

  return (
    <div>
      <PageHeader title="Please confirm" backLabel="Back" onBack={() => onNavigate('new-entry')} />

      <Notice kind="error" message={saveError || problem} />

      <dl className="slip">
        <Row label="Customer">
          <span className="slip-value">{data.customer || '—'}</span>
          {isNewCustomer && <span className="slip-note">New customer — will be added to your list</span>}
        </Row>

        {isCredit && (
          <>
            <Row label="Item"><span className="slip-value">{capitalize(data.item) || '—'}</span></Row>
            <Row label="Quantity">
              <span className="slip-value">{formatQuantity(data.quantity, data.unit) || '—'}</span>
            </Row>
          </>
        )}

        <Row label={isPayment ? 'Payment' : 'Amount'}>
          <span className="slip-amount">{Number(data.amount) > 0 ? formatRupees(data.amount) : '—'}</span>
        </Row>

        <Row label="Type"><TypeLabel type={data.intent} /></Row>
      </dl>

      {entry.originalText && (
        <p className="original-text">
          <span className="muted">You said:</span> {entry.originalText}
        </p>
      )}

      <div className="button-row">
        <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit</button>
        <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={Boolean(problem) || isSaving}>
          {isSaving ? 'Saving...' : 'Confirm & Save'}
        </button>
      </div>
    </div>
  );
}
