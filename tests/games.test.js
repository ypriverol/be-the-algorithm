import { test } from 'node:test';
import assert from 'node:assert/strict';
import { envelopeData, checkEnvelope } from '../games/envelope.js';
import { featureData, checkFeature } from '../games/feature.js';
import { methodData, checkMethod, schematic } from '../games/method.js';
import { detectiveData, checkDetective } from '../games/detective.js';
import { mbrData, evaluateMbr } from '../games/mbr.js';

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

test('detective: trust the measured hit, artifact penalised', () => {
  const d = detectiveData();
  assert.equal(checkDetective(d.trustworthyName, d).correct, true);
  assert.equal(checkDetective(d.artifactName, d).penalty, true);
});

test('mbr: correct pairing, decoy must stay unmatched', () => {
  const d = mbrData();
  const good = {}; d.run2.forEach(r => { good[r.id] = r.match; }); // includes decoy -> null
  assert.equal(evaluateMbr(good, d).correct, true);
  const bad = { ...good, [d.decoyId]: d.run1[1].id };
  assert.equal(evaluateMbr(bad, d).penalty, true);
  assert.equal(evaluateMbr(bad, d).correct, false);
});

test('mbr: the trap is REJECTED BY RT, not by m/z', () => {
  const d = mbrData();
  const decoy = d.run2.find(r => r.id === d.decoyId);
  const p2 = d.run1.find(r => r.id === 'P2');
  const r2 = d.run2.find(r => r.id === 'r2'); // the true match for P2
  // 1) Every run2 dot exposes a retention time the player can reason about.
  d.run2.forEach(r => assert.equal(typeof r.rt, 'number'));
  d.run1.forEach(r => assert.equal(typeof r.rt, 'number'));
  // 2) The decoy shares P2's EXACT m/z → m/z alone cannot reject it.
  assert.equal(decoy.mz, p2.mz);
  // 3) The true match's RT drift is small (~+1 min); the decoy's is far larger → RT rejects it.
  const trueDrift = r2.rt - p2.rt;          // ~0.9
  const decoyDrift = decoy.rt - p2.rt;      // ~3.5
  assert.ok(Math.abs(trueDrift) <= 1.5, 'true match RT drift should be ~1 min');
  assert.ok(decoyDrift - trueDrift > 1.5, 'decoy RT should be clearly inconsistent with the drift');
});

test('method: each schematic renders and carries its distinguishing cue', () => {
  for (const m of ['TMT','LFQ','SILAC','DIA']) {
    const svg = schematic(m);
    assert.match(svg, /^<svg /);
    assert.match(svg, /<\/svg>$/);
  }
  assert.match(schematic('TMT'), /reporter ions/);
  assert.match(schematic('LFQ'), /MS1 precursor/);
  assert.match(schematic('SILAC'), /pair in MS1/);
  assert.match(schematic('DIA'), /wide windows/);
});
