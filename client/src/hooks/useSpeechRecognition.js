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
  // finalTranscriptRef accumulates all finalized speech segments.
  // This prevents duplication: in continuous mode, each onresult event only
  // carries NEW results (from event.resultIndex), so we must keep a running total.
  const finalTranscriptRef = useRef('');
  const latestTextRef = useRef('');
  const hadErrorRef = useRef(false);
  const manualStopRef = useRef(false); // true only when user presses Stop themselves
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

    finalTranscriptRef.current = '';
    latestTextRef.current = '';
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
      // Only process results that are NEW since the last event (event.resultIndex onwards).
      // Without this, each event re-processes all previous results and causes double text.
      let newFinal = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += transcript;
        } else {
          interim += transcript;
        }
      }

      // Append newly finalized text to the running total
      if (newFinal) {
        finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + newFinal.trim();
      }

      // Show finalized + current interim as one combined string
      const fullText = finalTranscriptRef.current
        + (interim ? (finalTranscriptRef.current ? ' ' : '') + interim : '');

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
