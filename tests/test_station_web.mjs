// Tests for station-web.js: pure logic for Scout (the website bot) on the station.
// Input is the site-finder status (counts of leads per stage, no names); output is what to animate.
// Run: node --test tests/test_station_web.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const W = require('../station-web.js');
const st = c => ({ counts: c });

test('exports', () => {
  assert.deepEqual(W.PIPELINE, ['candidate', 'ready', 'queued', 'sent', 'replied', 'followed_up']);
  for (const f of ['reached', 'summary', 'webEvents', 'starMap']) assert.equal(typeof W[f], 'function', f);
});

test('reached: leads at this stage or any later pipeline stage (skipped/failed never count)', () => {
  const c = { candidate: 4, ready: 3, queued: 1, sent: 10, replied: 2, followed_up: 1, skipped: 7, failed: 2 };
  assert.equal(W.reached(c, 'candidate'), 21);
  assert.equal(W.reached(c, 'ready'), 17);
  assert.equal(W.reached(c, 'queued'), 14);
  assert.equal(W.reached(c, 'replied'), 3);
  assert.equal(W.reached(c, 'followed_up'), 1);
  assert.equal(W.reached({}, 'ready'), 0);
  assert.equal(W.reached(null, 'ready'), 0);
  assert.equal(W.reached({ ready: 2 }, 'bogus'), 0);
});

test('summary: the numbers the station shows', () => {
  const s = W.summary(st({ candidate: 4, ready: 3, queued: 1, sent: 10, replied: 2, followed_up: 1, won: 1 }));
  assert.deepEqual(s, { building: 4, waiting: 3, sending: 1, sent: 14, replied: 3, won: 1 });
  assert.deepEqual(W.summary(null), { building: 0, waiting: 0, sending: 0, sent: 0, replied: 0, won: 0 });
  assert.deepEqual(W.summary({}), { building: 0, waiting: 0, sending: 0, sent: 0, replied: 0, won: 0 });
});

test('webEvents: what happened between two status snapshots, in pipeline order', () => {
  const a = st({ candidate: 2, ready: 3, sent: 5 });
  const b = st({ candidate: 3, ready: 3, queued: 1, sent: 5, replied: 1 });
  // found: reached(candidate) 10 -> 13 (+3); built: reached(ready) 8 -> 10 (+2); sent: reached(queued) 5 -> 7 (+2); reply: 0 -> 1
  assert.deepEqual(W.webEvents(a, b), [{ kind: 'found', n: 3 }, { kind: 'built', n: 2 }, { kind: 'sent', n: 2 }, { kind: 'reply', n: 1 }]);
});

test('webEvents: first load, no change, and leads leaving the pipeline produce nothing', () => {
  assert.deepEqual(W.webEvents(null, st({ ready: 5 })), []);
  assert.deepEqual(W.webEvents(st({ ready: 5 }), st({ ready: 5 })), []);
  assert.deepEqual(W.webEvents(st({ ready: 5 }), st({ ready: 3, skipped: 2 })), []);
  assert.deepEqual(W.webEvents(st({ ready: 1 }), null), []);
});

test('webEvents: followup and won kinds; each n capped at 5', () => {
  assert.deepEqual(W.webEvents(st({ replied: 1 }), st({ followed_up: 1 })), [{ kind: 'followup', n: 1 }]);
  assert.deepEqual(W.webEvents(st({ sent: 2 }), st({ sent: 2, won: 1 })), [{ kind: 'won', n: 1 }]);
  assert.deepEqual(W.webEvents(st({}), st({ candidate: 40 })), [{ kind: 'found', n: 5 }]);
});

test('starMap: one star per lead that was sent, colored by how far it got, positions fixed by index', () => {
  const m = W.starMap(st({ sent: 6, replied: 2, followed_up: 1, won: 1 }), 100, 60);
  // sent+ = 6 + 2 + 1 = 9 stars; gold = won (1), green = reached(replied) - won (3 - 1 = 2), white = the rest (6)
  assert.equal(m.length, 9);
  assert.deepEqual(m.map(s => s.kind), ['gold', 'green', 'green', 'white', 'white', 'white', 'white', 'white', 'white']);
  m.forEach((s, i) => { assert.equal(s.i, i); assert.ok((s.x / 50) ** 2 + (s.y / 30) ** 2 <= 1 + 1e-9, 'inside the ellipse'); });
  const more = W.starMap(st({ sent: 20 }), 100, 60);
  assert.deepEqual(more.slice(0, 9).map(s => [s.x, s.y]), m.map(s => [s.x, s.y]), 'adding stars never moves old ones');
  assert.equal(new Set(more.map(s => s.x.toFixed(3) + ',' + s.y.toFixed(3))).size, 20, 'no two stars on the same spot');
});

test('starMap: empty, capped at 120, and kinds never exceed the total', () => {
  assert.deepEqual(W.starMap(null, 100, 60), []);
  assert.equal(W.starMap(st({ sent: 500 }), 100, 60).length, 120);
  const m = W.starMap(st({ replied: 2, won: 5 }), 100, 60);
  assert.equal(m.length, 2); assert.deepEqual(m.map(s => s.kind), ['gold', 'gold']);
});
