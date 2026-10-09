import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import SpeechInput from '../components/SpeechInput.jsx';
import Notice from '../components/Notice.jsx';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';
import { getCustomers, parseText } from '../services/api.js';
import { MESSAGES, noticeFromError } from '../utils/messages.js';
import { emptyEntry } from '../utils/entry.js';

export default function NewEntry({ initialCustomerId = '', draftText, onDraftChange, onParsed, onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [mode, setMode] = useState('speak');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [canEnterManually, setCanEnterManually] = useState(false);

  const speech = useSpeechRecognition({
    lang: 'ta-IN',
    onTranscript: (text) => onDraftChange(text),
    onFinal: (text) => submit(text)
  });

  useEffect(() => {
    getCustomers()
      .then((result) => setCustomers(result.customers))
      .catch(() => setCustomers([]));
  }, []);

  const selectedCustomer = customers.find((c) => c._id === customerId) || null;

  async function submit(sentence) {
    const text = sentence.trim();
    if (!text) {
      setNotice({ title: 'Please speak or type the transaction first.' });
      return;
    }

    setIsProcessing(true);
    setNotice(null);
    setCanEnterManually(false);

    try {
      const result = await parseText(text, customers.map((c) => c.name));
      let data = result.data;
      let missingFields = result.missingFields || [];

      // A customer chosen from the list always wins over the AI's guess.
      if (selectedCustomer) {
        data = { ...data, customer: selectedCustomer.name };
        missingFields = missingFields.filter((field) => field !== 'customer');
      }

      onParsed({ data, missingFields, originalText: text, startEditing: false });
    } catch (error) {
      setIsProcessing(false);
      setCanEnterManually(true);
      if (error.code === 'AI_NOT_CONFIGURED') setNotice(MESSAGES.aiNotConfigured);
      else if (error.code === 'AI_TIMEOUT') setNotice(MESSAGES.aiTimeout);
      else if (error.status === 502) setNotice(MESSAGES.parseFailed);
      else setNotice(noticeFromError(error));
    }
  }

  function enterManually() {
    onParsed({
      data: emptyEntry(selectedCustomer ? selectedCustomer.name : ''),
      missingFields: [],
      originalText: draftText.trim(),
      startEditing: true
    });
  }

  function handleMicClick() {
    setNotice(null);
    if (speech.status === 'listening') speech.stop();
    else speech.start();
  }

  const isListening = speech.status === 'listening';
  const speechNotice = mode === 'speak' ? (speech.isSupported ? speech.error : MESSAGES.speechUnsupported) : null;
  const shownNotice = notice || speechNotice;

  let statusLabel = 'Ready';
  if (isProcessing) statusLabel = 'Processing...';
  else if (isListening) statusLabel = 'Listening...';
  else if (shownNotice) statusLabel = 'Error';

  return (
    <div>
      <PageHeader title="New Entry" backLabel="Home" onBack={() => onNavigate('home')} />

      <div className="field">
        <label htmlFor="customer-select">Customer</label>
        <select
          id="customer-select"
          className="input"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
        >
          <option value="">Select customer (or say the name)</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <span className="field-label" id="mode-label">How do you want to enter?</span>
        <div className="segmented" role="group" aria-labelledby="mode-label">
          <button type="button" aria-pressed={mode === 'speak'} onClick={() => setMode('speak')}>🎙 Speak</button>
          <button type="button" aria-pressed={mode === 'type'} onClick={() => setMode('type')}>⌨ Type</button>
        </div>
      </div>

      <SpeechInput
        mode={mode}
        statusLabel={statusLabel}
        isListening={isListening}
        micDisabled={!speech.isSupported || isProcessing}
        onMicClick={handleMicClick}
        text={draftText}
        onTextChange={onDraftChange}
      />

      <Notice kind="error" message={shownNotice} />

      <button
        type="button"
        className="btn btn-primary"
        onClick={() => submit(draftText)}
        disabled={isProcessing || isListening || !draftText.trim()}
      >
        {isProcessing ? 'Processing...' : 'Continue'}
      </button>

      {canEnterManually && (
        <button type="button" className="btn btn-secondary btn-spaced" onClick={enterManually}>
          Enter details manually
        </button>
      )}
    </div>
  );
}
