import { useCallback, useEffect, useRef, useState } from 'react';
import { recognitionError } from './voice.js';

export function useVoiceInput(onTranscript, { disabled = false, context } = {}) {
  const [isListening, setListening] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const active = useRef(null), receive = useRef(onTranscript);
  receive.current = onTranscript;
  const cancel = useCallback(() => {
    const recognition = active.current; active.current = null;
    if (recognition) { recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = recognition.onnomatch = null; try { recognition.abort(); } catch { /* Already stopped. */ } }
  }, []);
  useEffect(() => {
    const stop = () => { cancel(); setListening(false); setMessage(''); };
    window.addEventListener('mise-auth-change', stop);
    return () => { window.removeEventListener('mise-auth-change', stop); cancel(); };
  }, [cancel]);
  useEffect(() => { cancel(); setListening(false); setMessage(''); }, [disabled, context, cancel]);
  function toggle() {
    if (active.current) {
      try { setMessage('Finishing voice input…'); active.current.stop(); }
      catch { cancel(); setListening(false); setError('Voice input stopped. Review your ingredients and try again if needed.'); }
      return;
    }
    if (disabled) return;
    setError(''); setMessage('');
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setError('Voice input is unavailable in this browser. You can still type your ingredients.'); return; }
    if (window.isSecureContext === false) { setError('Microphone input needs a secure connection. Open this site with HTTPS or use localhost.'); return; }
    try {
      const recognition = new Recognition(), delivered = new Set(); let heard = false, resultMessage = '';
      recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = false; recognition.maxAlternatives = 1;
      active.current = recognition; setListening(true); setMessage('Requesting microphone access…');
      const current = () => active.current === recognition;
      const fail = text => { if (!current()) return; cancel(); setListening(false); setMessage(''); setError(text); };
      recognition.onstart = () => { if (current()) setMessage('Listening. Say ingredient names separated by commas or “and”, then choose Stop listening.'); };
      recognition.onresult = event => {
        if (!current()) return;
        const finals = [];
        for (let i = event.resultIndex || 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal && !delivered.has(i)) { delivered.add(i); if (result[0]?.transcript?.trim()) finals.push(result[0].transcript); }
        }
        if (!finals.length) return;
        heard = true;
        try { resultMessage = receive.current(finals.join(', ')) || 'Voice input added. Review ingredient names before generating a recipe.'; setMessage(resultMessage); }
        catch (e) { fail(e.message); }
      };
      recognition.onerror = event => { if (event.error === 'aborted') { if (current()) { cancel(); setListening(false); setMessage('Voice input stopped. Review your ingredients.'); } } else fail(recognitionError(event.error)); };
      recognition.onnomatch = () => fail('The speech was not clear enough. Try again or type your ingredients.');
      recognition.onend = () => {
        if (!current()) return;
        active.current = null; setListening(false);
        recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = recognition.onnomatch = null;
        setMessage(heard ? resultMessage : 'Voice input ended without ingredients. Try again or enter them by typing.');
      };
      recognition.start();
    } catch (e) { cancel(); setListening(false); setMessage(''); setError(recognitionError(e.name === 'NotAllowedError' ? 'not-allowed' : 'unknown')); }
  }
  return { isListening, message, error, toggle };
}
