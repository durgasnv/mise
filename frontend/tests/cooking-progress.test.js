import test from 'node:test';
import assert from 'node:assert/strict';
import { timerSeconds, stepDuration } from '../src/lib/cookingProgress.js';
test('restores running timers from deadlines rather than paused render counts', () => {
  assert.equal(timerSeconds({ remainingSeconds: 90, deadline: 100000 }, 40000), 60);
  assert.equal(timerSeconds({ remainingSeconds: 90, deadline: 100000 }, 100001), 0);
  assert.equal(timerSeconds({ remainingSeconds: 90, deadline: null }, 100001), 90);
});
test('parses decimal/ranged minutes and seconds without changing recipe text', () => {
  assert.equal(stepDuration('Sear for 1.5 minutes at 200°C.'), 90);
  assert.equal(stepDuration('Cook for 2–3 mins.'), 180);
  assert.equal(stepDuration('Toast 45 seconds.'), 45);
  assert.equal(stepDuration('Verify internal temperature 74°C.'), null);
});
