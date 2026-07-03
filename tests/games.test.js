import { test } from 'node:test';
import assert from 'node:assert/strict';
import { envelopeData, checkEnvelope } from '../games/envelope.js';
import { featureData, checkFeature } from '../games/feature.js';
import { methodData, checkMethod } from '../games/method.js';

test('envelope: monoisotopic is index 0 and charge from spacing', () => {
  const d = envelopeData();
  assert.equal(d.monoIndex, 0);
  assert.equal(checkEnvelope(0, d.charge, d).correct, true);
  assert.equal(checkEnvelope(1, d.charge, d).correct, false);   // wrong peak
  assert.equal(checkEnvelope(0, d.charge+1, d).correct, false); // wrong charge
});

test('feature: target correct, trap penalised', () => {
  const d = featureData();
  assert.equal(checkFeature(d.targetId, d).correct, true);
  assert.equal(checkFeature(d.trapId, d).penalty, true);
  assert.equal(checkFeature(d.trapId, d).correct, false);
});

test('method: correct choice matches answer', () => {
  const d = methodData(0);
  assert.ok(d.choices.includes(d.answer));
  assert.equal(checkMethod(d.answer, d).correct, true);
  assert.equal(checkMethod(d.choices.find(c=>c!==d.answer), d).correct, false);
});
