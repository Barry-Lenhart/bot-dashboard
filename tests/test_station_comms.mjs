// Tests for station-comms.js: the Comms Array satellite dish (fillRect-only pixel art, like station-tech.js).
// Run: node --test tests/test_station_comms.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fakeCtx, rects, styles, outsideOnes, ints, onlyAllowed } from './propkit.mjs';
const require = createRequire(import.meta.url);
const Cm = require('../station-comms.js');
const run = (box, o) => { const c = fakeCtx(); Cm.draw(c, 'dish', ...box, o); return c; };
const pic = (box, o) => JSON.stringify(run(box, o).calls);

test('exports', () => {
  assert.deepEqual(Cm.NAMES, ['dish']);
  assert.equal(typeof Cm.dish, 'function');
  for (const k of ['outline', 'dark', 'mid', 'light', 'shine', 'accent', 'beam', 'reply']) assert.match(Cm.PALETTE[k], /^#[0-9a-f]{6}$/, k);
  const c = fakeCtx(); assert.equal(Cm.draw(c, 'dish', 0, 0, 48, 48), true);
  const d = fakeCtx(); assert.equal(Cm.draw(d, 'radio', 0, 0, 48, 48), false); assert.equal(d.calls.length, 0);
});

test('dish: pixel look, in its box, deterministic, outlined, detailed', () => {
  for (const box of [[10, 20, 48, 56], [0, 0, 32, 32], [5, 5, 80, 64], [3, 4, 14, 14]])
    for (const o of [{}, { t: 9 }, { beaming: true, t: 21 }, { receiving: true, t: 44 }, { beaming: true, receiving: true, color: '#ff00aa', t: 3 }]) {
      const c = run(box, o), rs = rects(c);
      assert.deepEqual(onlyAllowed(c), []);
      assert.deepEqual(outsideOnes(rs, ...box), [], `inside ${box} ${JSON.stringify(o)}`);
      assert.ok(ints(rs));
      assert.ok(rs.length >= (box[2] >= 32 ? 14 : 5), 'detailed: ' + rs.length);
      assert.equal(pic(box, o), JSON.stringify(c.calls));
      assert.ok(styles(c).includes(Cm.PALETTE.outline));
      const ga = c.calls.filter(x => x[0] === 'set:globalAlpha').pop(); if (ga) assert.equal(ga[1][0], 1);
    }
});

test('dish: idle is still apart from a slow blink; beaming glows in the beam color; receiving flashes the reply color', () => {
  const b = [0, 0, 48, 56];
  assert.equal(pic(b, { t: 0 }), pic(b, { t: 120 }), 'idle loops every 120');
  assert.ok(!styles(run(b, { t: 5 })).includes(Cm.PALETTE.beam), 'idle: no beam color');
  assert.ok(!styles(run(b, { t: 5 })).includes(Cm.PALETTE.reply), 'idle: no reply color');
  assert.ok(styles(run(b, { beaming: true, t: 5 })).includes(Cm.PALETTE.beam));
  assert.ok(new Set([0, 5, 10, 15].map(t => pic(b, { beaming: true, t }))).size >= 2, 'beaming pulses');
  assert.equal(pic(b, { beaming: true, t: 2 }), pic(b, { beaming: true, t: 22 }), 'beaming period 20');
  assert.ok(new Set([0, 4, 8, 12].map(t => styles(run(b, { receiving: true, t })).includes(Cm.PALETTE.reply))).size === 2, 'reply color flashes on and off');
  assert.ok(styles(run(b, { color: '#ff00aa', t: 0 })).includes('#ff00aa'), 'opts.color for the status light');
});
