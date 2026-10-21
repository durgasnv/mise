import { canonicalName } from '../../../shared/pantry.js';

export function spokenIngredients(transcript) {
  if (typeof transcript !== 'string' || transcript.length > 6000) throw new Error('That dictation is too long. Add ingredients in smaller groups.');
  // Match whole words only: "and" must never cut coriander or another food name.
  const protectedNames = [];
  const text = transcript.trim().replace(/^(?:i have|i['’]ve got|i have got)\b[\s,:]*/i, '')
    .replace(/\b(?:mac and cheese|half and half|sweet and sour|fish and chips)\b/gi, name => { protectedNames.push(name); return `VOICEPHRASE${protectedNames.length - 1}`; });
  return text.split(/[,;\n]+|\band\b|\bcomma\b/i).map(part => part
    .replace(/VOICEPHRASE(\d+)/g, (match, index) => protectedNames[Number(index)] || match)
    .replace(/^\s*some\s+/i, '').trim().replace(/[.!?]+$/, '').trim()).filter(Boolean);
}
export function appendVoiceIngredients(existing, incoming) {
  const items = [...existing], seen = new Set(items.filter(item => item.trim()).map(canonicalName));
  let added = 0;
  for (const item of incoming) {
    if (item.length > 120) throw new Error('One spoken ingredient is too long. Separate ingredient names with commas.');
    const key = canonicalName(item);
    if (seen.has(key)) continue;
    if (seen.size >= 40) throw new Error('You can enter up to 40 ingredients. Review the list before adding more.');
    seen.add(key); const empty = items.findIndex(value => !value.trim());
    if (empty < 0) items.push(item); else items[empty] = item;
    added++;
  }
  return { items, added };
}
export function recognitionError(code) {
  return ({
    'not-allowed': 'Microphone access was blocked. Allow the microphone for this site in your browser settings, then try Use voice again.',
    'service-not-allowed': 'Your browser blocked its speech service. Check browser permissions or enter ingredients by typing.',
    'audio-capture': 'No working microphone was found. Connect or select a microphone, then try again.',
    'network': 'The speech service could not connect. Check your connection, then try again or type your ingredients.',
    'no-speech': 'No speech was detected. Try again and speak your ingredient names clearly.',
    'language-not-supported': 'English dictation is unavailable in this browser. Enter ingredients by typing.',
  })[code] || 'Voice input could not start. Check microphone permissions and try again, or type your ingredients.';
}
