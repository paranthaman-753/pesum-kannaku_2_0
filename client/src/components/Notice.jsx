// kind: "error" | "success" | "info". message: { title, hint }
export default function Notice({ kind = 'error', message, children }) {
  if (!message && !children) return null;
  return (
    <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {message && <p className="notice-title">{message.title}</p>}
      {message?.hint && <p className="notice-hint">{message.hint}</p>}
      {children}
    </div>
  );
}
