// Tests for station-machines.js: the Web Foundry machines (printing press, conveyor, storage bin,
// mail launch tube, website card) and the ship's rocket engine. fillRect-only pixel art, like station-tech.js.
// Run: node --test tests/test_station_machines.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fakeCtx, rects, styles, outsideOnes, ints, onlyAllowed, lum } from './propkit.mjs';
const require = createRequire(import.meta.url);
const M = require('../station-machines.js');
const NAMES = ['press', 'conveyor', 'bin', 'tube', 'card', 'engine'];
const BOXES = [[10, 20, 64, 48], [0, 0, 24, 48], [100, 50, 160, 24], [7, 9, 12, 9]];
const run = (name, box, opts) => { const c = fakeCtx(); M.draw(c, name, ...box, opts); return c; };
const pic = (name, box, opts) => JSON.stringify(run(name, box, opts).calls);

test('exports', () => {
  assert.deepEqual(M.NAMES, NAMES);
  for (const n of NAMES) assert.equal(typeof M[n], 'function', n);
  for (const k of ['outline', 'dark', 'mid', 'light', 'shine', 'accent', 'paper', 'flame', 'hot']) assert.match(M.PALETTE[k], /^#[0-9a-f]{6}$/, k);
  assert.ok(lum(M.PALETTE.outline) < lum(M.PALETTE.dark) && lum(M.PALETTE.dark) < lum(M.PALETTE.mid) &&
    lum(M.PALETTE.mid) < lum(M.PALETTE.light) && lum(M.PALETTE.light) < lum(M.PALETTE.shine));
  assert.ok(lum(M.PALETTE.paper) > 200, 'paper is near white');
  const c = fakeCtx(); assert.equal(M.draw(c, 'press', 0, 0, 40, 40), true);
  const d = fakeCtx(); assert.equal(M.draw(d, 'blender', 0, 0, 40, 40), false); assert.equal(d.calls.length, 0);
  const e = fakeCtx(); M.press(e, 0, 0, 40, 40); assert.deepEqual(e.calls, c.calls);
});

for (const name of NAMES) test(`${name}: pixel look, in its box, deterministic, outlined`, () => {
  const opts = [{}, { t: 7 }, { t: 33, active: true, moving: true, launching: true, fill: 0.6 }, { fill: 1, color: '#ff00aa', t: 90 }];
  for (const box of BOXES) for (const o of opts) {
    const c = run(name, box, o), rs = rects(c);
    assert.deepEqual(onlyAllowed(c), [], 'only fillRect / fillStyle / globalAlpha / save / restore');
    assert.deepEqual(outsideOnes(rs, ...box), [], `inside ${box} ${JSON.stringify(o)}`);
    assert.ok(ints(rs), 'whole pixels');
    assert.ok(rs.length >= (box[2] >= 40 && box[3] >= 20 ? 10 : 4), `detailed: ${rs.length}`);
    assert.equal(pic(name, box, o), JSON.stringify(c.calls), 'deterministic');
    assert.ok(styles(c).includes(M.PALETTE.outline), 'outline');
    const ga = c.calls.filter(x => x[0] === 'set:globalAlpha').pop(); if (ga) assert.equal(ga[1][0], 1, 'globalAlpha back to 1');
  }
});

test('press: stamps only while active (ram moves, loops every 40 ticks); paper and accent', () => {
  const b = [0, 0, 64, 56];
  assert.equal(pic('press', b, { t: 0 }), pic('press', b, { t: 20 }), 'idle press is still');
  const act = [0, 10, 20, 30].map(t => pic('press', b, { active: true, t }));
  assert.ok(new Set(act).size >= 2, 'active press moves');
  assert.equal(pic('press', b, { active: true, t: 5 }), pic('press', b, { active: true, t: 45 }), 'period 40');
  assert.ok(styles(run('press', b, { color: '#ff00aa' })).includes('#ff00aa'));
  assert.ok(styles(run('press', b, { active: true, t: 20 })).includes(M.PALETTE.paper), 'a sheet/page under the press');
});

test('conveyor: belt rollers/stripes move only while moving, loop every 16 ticks', () => {
  const b = [0, 0, 160, 24];
  assert.equal(pic('conveyor', b, { t: 0 }), pic('conveyor', b, { t: 9 }));
  assert.notEqual(pic('conveyor', b, { moving: true, t: 0 }), pic('conveyor', b, { moving: true, t: 4 }));
  assert.equal(pic('conveyor', b, { moving: true, t: 3 }), pic('conveyor', b, { moving: true, t: 19 }));
  assert.ok(styles(run('conveyor', b, { color: '#ff00aa' })).includes('#ff00aa'), 'accent side lights');
});

test('bin: fill 0..1 shows more stacked cards as it fills (clamped)', () => {
  const b = [0, 0, 48, 40], n = f => rects(run('bin', b, { fill: f })).length;
  assert.ok(n(0) < n(0.5) && n(0.5) < n(1));
  assert.equal(n(1), n(5)); assert.equal(n(0), n(-2));
  assert.ok(styles(run('bin', b, { fill: 1 })).includes(M.PALETTE.paper), 'cards are paper colored');
  assert.ok(!styles(run('bin', b, { fill: 0 })).includes(M.PALETTE.paper), 'empty bin: no cards');
});

test('tube: glows/pulses only while launching (period 30)', () => {
  const b = [0, 0, 24, 64];
  assert.equal(pic('tube', b, { t: 0 }), pic('tube', b, { t: 15 }));
  assert.ok(new Set([0, 5, 10, 15, 20, 25].map(t => pic('tube', b, { launching: true, t }))).size >= 2);
  assert.equal(pic('tube', b, { launching: true, t: 2 }), pic('tube', b, { launching: true, t: 32 }));
  assert.ok(styles(run('tube', b, { color: '#ff00aa' })).includes('#ff00aa'));
});

test('card: a tiny website: paper page, header bar in the color, text lines; never animates', () => {
  const b = [0, 0, 16, 12], c = run('card', b, { color: '#ff00aa' });
  assert.ok(styles(c).includes(M.PALETTE.paper) && styles(c).includes('#ff00aa'));
  assert.equal(pic('card', b, { t: 0 }), pic('card', b, { t: 50 }));
});

test('engine: nozzle at the top, flame below that flickers (period 12) in flame/hot/accent colors', () => {
  const b = [0, 0, 40, 72], c = run('engine', b, { t: 0 }), s = styles(c);
  assert.ok(s.includes(M.PALETTE.flame) && s.includes(M.PALETTE.hot) && s.includes(M.PALETTE.accent));
  assert.ok(new Set([0, 3, 6, 9].map(t => pic('engine', b, { t }))).size >= 2, 'flame flickers');
  assert.equal(pic('engine', b, { t: 4 }), pic('engine', b, { t: 16 }), 'period 12');
  const top = rects(c).filter((r, i) => true);
  const flameRects = []; let cur = null; c.calls.forEach(x => { if (x[0] === 'set:fillStyle') cur = x[1][0]; else if (x[0] === 'fillRect' && (cur === M.PALETTE.flame || cur === M.PALETTE.hot)) flameRects.push(x[1]); });
  assert.ok(flameRects.length >= 3 && flameRects.every(([, y]) => y >= 72 * 0.3), 'flame is in the lower part, below the nozzle');
  assert.ok(c.calls.some(x => x[0] === 'set:globalAlpha' && x[1][0] < 1), 'translucent outer glow');
});
