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
  const manualStopRef = useRef(false); // true only when user taps Stop deliberately
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
      // Always iterate ALL results from index 0.
      // The browser keeps a stable list — final results never change or duplicate.
      // Separating isFinal from interim and concatenating gives the correct full text
      // every time, without any separate accumulator ref that could cause doubling.
      let finalText = '';
      let interimText = '';

      for (let i = 0; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      const fullText = (finalText + (interimText ? ' ' + interimText : '')).trim();
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
