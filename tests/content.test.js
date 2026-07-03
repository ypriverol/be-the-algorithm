// tests/content.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, trainingCards, mcqPool, validateContent } from '../content.js';

const IDS = ['scan-levels','feature','acquisition','methods','mbr','normalization','rollup','missing'];

test('all 8 topics present with review text', () => {
  for (const id of IDS) { assert.ok(TOPICS[id], `missing ${id}`); assert.ok(TOPICS[id].review); }
});
test('>=8 training cards, valid topics', () => {
  assert.ok(trainingCards.length >= 8);
  for (const c of trainingCards) assert.ok(IDS.includes(c.topic), `bad topic ${c.topic}`);
});
test('>=18 MCQ, each internally valid', () => {
  assert.ok(mcqPool.length >= 18);
});
test('validateContent returns no errors', () => {
  assert.deepEqual(validateContent(), []);
});
