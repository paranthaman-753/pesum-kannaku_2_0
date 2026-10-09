export default function Home({ onNavigate }) {
  return (
    <div>
      <section className="welcome">
        <p className="muted">Welcome</p>
        <h1 className="welcome-title">உங்கள் கணக்கை பதிவு செய்யுங்கள்</h1>
        <button type="button" className="btn btn-primary btn-large" onClick={() => onNavigate('new-entry')}>
          + New Entry
        </button>
      </section>

      <section className="section">
        <h2 className="section-title">Customers</h2>
        <p className="muted">See who owes what, and their past entries.</p>
        <button type="button" className="btn btn-secondary" onClick={() => onNavigate('customers')}>
          View Customers
        </button>
      </section>
    </div>
  );
}
