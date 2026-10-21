import { useCallback, useEffect, useRef, useState } from 'react';

export function useStepSpeech(step, index) {
  const [isSpeaking, setSpeaking] = useState(false), [error, setError] = useState('');
  const active = useRef(null);
  const cancel = useCallback(() => {
    const utterance = active.current; active.current = null;
    if (utterance) { utterance.onstart = utterance.onend = utterance.onerror = null; try { window.speechSynthesis?.cancel(); } catch { /* Already stopped. */ } }
  }, []);
  const stop = useCallback(() => { cancel(); setSpeaking(false); }, [cancel]);
  useEffect(() => { stop(); setError(''); return cancel; }, [step, index, stop, cancel]);
  function toggle() {
    if (active.current) { stop(); return; }
    setError('');
    const synthesis = window.speechSynthesis, Utterance = window.SpeechSynthesisUtterance;
    if (!synthesis?.speak || typeof Utterance !== 'function') { setError('Spoken instructions are unavailable in this browser. You can read the step below.'); return; }
    if (typeof step !== 'string' || !step.trim()) { setError('There is no step to read.'); return; }
    try {
      synthesis.cancel();
      const utterance = new Utterance(`Step ${index + 1}. ${step}`);
      utterance.lang = 'en-US'; utterance.rate = 0.95; utterance.pitch = 1;
      const voices = synthesis.getVoices?.() || [];
      const english = voices.filter(voice => /^en(?:-|$)/i.test(voice.lang));
      const voice = english.find(voice => voice.default) || english.find(voice => voice.lang.toLowerCase() === 'en-us') || english[0];
      if (voice) utterance.voice = voice;
      active.current = utterance; // Retain the object until completion/cancellation.
      const finish = message => {
        if (active.current !== utterance) return;
        active.current = null; utterance.onstart = utterance.onend = utterance.onerror = null;
        setSpeaking(false); if (message) setError(message);
      };
      utterance.onend = () => finish();
      utterance.onerror = event => finish(['canceled','interrupted'].includes(event.error) ? '' : event.error === 'not-allowed'
        ? 'Your browser blocked spoken audio. Allow audio for this site, then choose Read Step again.'
        : 'This step could not be played. Check your audio output and try Read Step again.');
      setSpeaking(true);
      if (synthesis.paused) synthesis.resume();
      synthesis.speak(utterance);
    } catch { cancel(); setSpeaking(false); setError('This step could not be played. Check your audio output and try Read Step again.'); }
  }
  return { isSpeaking, error, toggle };
}
