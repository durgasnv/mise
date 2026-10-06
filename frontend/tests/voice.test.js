import test from 'node:test';
import assert from 'node:assert/strict';
import { spokenIngredients, appendVoiceIngredients, recognitionError } from '../src/lib/voice.js';
test('dictation separates whole words while preserving coriander and compound names', () => {
  assert.deepEqual(spokenIngredients('I have coriander and mushrooms, some mac and cheese.'), ['coriander','mushrooms','mac and cheese']);
  assert.deepEqual(spokenIngredients('half and half comma sweet and sour sauce'), ['half and half','sweet and sour sauce']);
});
test('voice appends without overwriting typed ingredients, dropping extras or shrinking empty slots', () => {
  assert.deepEqual(appendVoiceIngredients(['potato','',''],['potatoes','coriander','rice','garlic']), { items:['potato','coriander','rice','garlic'],added:3 });
  assert.deepEqual(appendVoiceIngredients(['','',''],['rice']).items,['rice','','']);
  const input=['rice'];assert.throws(()=>appendVoiceIngredients(input,['x'.repeat(121)]));assert.deepEqual(input,['rice']);
  assert.throws(()=>appendVoiceIngredients(Array.from({length:40},(_,i)=>`food ${i}`),['extra']),/40/);
});
test('permission, microphone and network failures have distinct recovery messages', () => {
  assert.match(recognitionError('not-allowed'),/Allow the microphone/);
  assert.match(recognitionError('audio-capture'),/No working microphone/);
  assert.match(recognitionError('network'),/connection/);
});
