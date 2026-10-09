export default function PageHeader({ title, backLabel, onBack }) {
  return (
    <div className="page-header">
      {onBack && (
        <button type="button" className="back-link" onClick={onBack}>
          ← {backLabel}
        </button>
      )}
      <h1 className="page-title">{title}</h1>
    </div>
  );
}
