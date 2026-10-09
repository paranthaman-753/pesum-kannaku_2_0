import { useCallback, useEffect, useRef, useState } from 'react';
import { MESSAGES } from '../utils/messages.js';

const SpeechRecognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const ERROR_MESSAGES = {
  'not-allowed': MESSAGES.speechBlocked,
  'service-not-allowed': MESSAGES.speechBlocked,
  'no-speech': MESSAGES.speechNoInput,
  network: MESSAGES.speechNetwork
};

// Wraps the browser speech API.
//   onTranscript(text) - called while the person is speaking (live text)
//   onFinal(text)      - called once when the user manually taps Stop
// status is "ready" | "listening" | "error"
export function useSpeechRecognition({ lang = 'ta-IN', onTranscript, onFinal } = {}) {
  const isSupported = Boolean(SpeechRecognition);
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const latestTextRef = useRef('');
  const hadErrorRef = useRef(false);
  const manualStopRef = useRef(false);

  // --- Duplication-proof transcript tracking ---
  // finalTextRef holds all text that has been confirmed final.
  // lastFinalIndexRef tracks which result indices we have already added,
  // so we never double-count them even if the browser re-fires old results.
  const finalTextRef = useRef('');
  const lastFinalIndexRef = useRef(-1);

  const callbacksRef = useRef({ onTranscript, onFinal });
  useEffect(() => {
    callbacksRef.current = { onTranscript, onFinal };
  });

  // Stop the microphone if the person leaves the page.
  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onend = null;
        recognition.abort();
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition || recognitionRef.current) return;

    // Reset all state for a fresh recording session
    latestTextRef.current = '';
    finalTextRef.current = '';
    lastFinalIndexRef.current = -1;
    hadErrorRef.current = false;
    manualStopRef.current = false;
    setError(null);

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;   // Keep mic open until user taps Stop
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStatus('listening');

    recognition.onresult = (event) => {
      // Step 1: Append only NEWLY finalized segments (those past lastFinalIndexRef).
      // This prevents double-counting when browsers re-fire events for old results.
      for (let i = lastFinalIndexRef.current + 1; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          const word = event.results[i][0].transcript.trim();
          if (word) {
            finalTextRef.current = finalTextRef.current
              ? finalTextRef.current + ' ' + word
              : word;
          }
          lastFinalIndexRef.current = i;
        }
      }

      // Step 2: Get only the LAST result as the interim display.
      // On Android Chrome the interim result contains the full session text,
      // NOT just the new word — so we must not concatenate it with finalTextRef.
      // Instead: if the interim already starts with our finalText, strip that prefix.
      const lastResult = event.results[event.results.length - 1];
      let interimText = '';
      if (lastResult && !lastResult.isFinal) {
        const raw = lastResult[0].transcript.trim();
        // Strip overlap: some browsers include finalized text inside the interim
        if (finalTextRef.current && raw.startsWith(finalTextRef.current)) {
          interimText = raw.slice(finalTextRef.current.length).trim();
        } else {
          interimText = raw;
        }
      }

      const fullText = (finalTextRef.current + (interimText ? ' ' + interimText : '')).trim();
      latestTextRef.current = fullText;
      callbacksRef.current.onTranscript?.(fullText);
    };

    recognition.onerror = (event) => {
      // Ignore no-speech in continuous mode — the user just paused mid-sentence
      if (event.error === 'no-speech') return;
      hadErrorRef.current = true;
      setStatus('error');
      setError(ERROR_MESSAGES[event.error] || MESSAGES.speechFailed);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setStatus((current) => (current === 'error' ? 'error' : 'ready'));
      // Only call onFinal when the user deliberately tapped Stop
      if (manualStopRef.current) {
        const text = latestTextRef.current.trim();
        if (!hadErrorRef.current && text) callbacksRef.current.onFinal?.(text);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setStatus('error');
      setError(MESSAGES.speechFailed);
    }
  }, [lang]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      manualStopRef.current = true; // Signal that this was a deliberate stop
      recognitionRef.current.stop();
    }
  }, []);

  return { isSupported, status, error, start, stop };
}
