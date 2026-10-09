export default function Header({ onHome }) {
  return (
    <header className="header">
      <button type="button" className="wordmark" onClick={onHome} aria-label="Home">
        <span className="wordmark-tamil">பேசும் கணக்கு</span>
        <span className="wordmark-latin">Pesum Kanakku</span>
      </button>
    </header>
  );
}
