// The microphone button, a status line, and the sentence box (voice text or typed text).
export default function SpeechInput({
  mode,
  statusLabel,
  isListening,
  micDisabled,
  onMicClick,
  text,
  onTextChange
}) {
  return (
    <div>
      {mode === 'speak' && (
        <div className="mic-area">
          <button
            type="button"
            className={`mic-button${isListening ? ' is-listening' : ''}`}
            onClick={onMicClick}
            disabled={micDisabled}
            aria-label={isListening ? 'Stop listening' : 'Start speaking'}
          >
            🎙
          </button>
          <p className="mic-hint">{isListening ? 'Tap to stop' : 'Tap and speak in Tamil or Tanglish'}</p>
        </div>
      )}

      <p className="status-line" aria-live="polite">
        <span className="status-label">Status</span> {statusLabel}
      </p>

      <div className="field">
        <label htmlFor="sentence">{mode === 'speak' ? 'What we heard' : 'Type the transaction'}</label>
        <textarea
          id="sentence"
          className="textarea"
          rows={3}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="முருகன் கிட்ட ரெண்டு கிலோ அரிசி 120 ரூபாய்க்கு கடனா கொடுத்தேன்"
        />
      </div>
    </div>
  );
}
