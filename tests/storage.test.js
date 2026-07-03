// tests/storage.test.js
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// minimal localStorage shim
beforeEach(() => {
  const m = new Map();
  globalThis.localStorage = {
    getItem:(k)=> (m.has(k)?m.get(k):null), setItem:(k,v)=>m.set(k,String(v)),
    removeItem:(k)=>m.delete(k), clear:()=>m.clear(),
  };
});

const load = async () => await import('../storage.js?' + Math.random());

test('name round-trips', async () => {
  const s = await load(); s.setName('Ada'); assert.equal(s.getName(), 'Ada');
});
test('best keeps the max', async () => {
  const s = await load(); s.setBest(100); s.setBest(80); assert.equal(s.getBest(), 100);
});
test('submitScore stores best and reports local mode', async () => {
  const s = await load(); const r = s.submitScore({name:'Ada',score:300,tier:'Gold',perTopic:{}});
  assert.equal(r.mode, 'local'); assert.equal(s.getBest(), 300);
});
