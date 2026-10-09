import { useState } from 'react';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import NewEntry from './pages/NewEntry.jsx';
import ConfirmEntry from './pages/ConfirmEntry.jsx';
import EntrySaved from './pages/EntrySaved.jsx';
import CustomerList from './pages/CustomerList.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';

// A tiny page switcher (no router library needed for this MVP).
export default function App() {
  const [page, setPage] = useState('home');
  const [params, setParams] = useState({});
  const [draftText, setDraftText] = useState('');
  const [entry, setEntry] = useState(null);
  const [saved, setSaved] = useState(null);

  function navigate(nextPage, nextParams = {}) {
    if (nextPage === 'new-entry' && page !== 'confirm') setDraftText('');
    setParams(nextParams);
    setPage(nextPage);
    window.scrollTo(0, 0);
  }

  function handleParsed(parsedEntry) {
    setEntry(parsedEntry);
    setParams({});
    setPage('confirm');
    window.scrollTo(0, 0);
  }

  function handleSaved(result) {
    setSaved(result);
    setDraftText('');
    setPage('saved');
    window.scrollTo(0, 0);
  }

  return (
    <div className="app">
      <Header onHome={() => navigate('home')} />
      <main className="page">
        {page === 'home' && <Home onNavigate={navigate} />}
        {page === 'new-entry' && (
          <NewEntry
            initialCustomerId={params.customerId}
            draftText={draftText}
            onDraftChange={setDraftText}
            onParsed={handleParsed}
            onNavigate={navigate}
          />
        )}
        {page === 'confirm' && entry && <ConfirmEntry entry={entry} onSaved={handleSaved} onNavigate={navigate} />}
        {page === 'saved' && saved && <EntrySaved saved={saved} onNavigate={navigate} />}
        {page === 'customers' && <CustomerList onNavigate={navigate} />}
        {page === 'customer' && <CustomerDetail customerId={params.customerId} onNavigate={navigate} />}
      </main>
    </div>
  );
}
