// Tests for station-tech.js: our own pixel-art machines (racks, consoles, screens...), fillRect only.
// Run: node --test tests/test_station_tech.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fakeCtx, rects, styles, outsideOnes, ints, onlyAllowed, lum } from './propkit.mjs';
const require = createRequire(import.meta.url);
const T = require('../station-tech.js');
const NAMES = ['rack', 'console', 'wallscreen', 'holotable', 'pod', 'arcade', 'vent', 'pillar'];
const ANIMATED = ['rack', 'console', 'wallscreen', 'holotable', 'arcade', 'vent', 'pillar'];
const BOXES = [[10, 20, 48, 32], [0, 0, 24, 48], [100, 50, 96, 40], [7, 9, 17, 17]];
const run = (name, box, opts) => { const c = fakeCtx(); T.draw(c, name, ...box, opts); return c; };

test('exports: PALETTE, NAMES, draw and one function per machine', () => {
  assert.deepEqual(T.NAMES, NAMES);
  for (const n of NAMES) assert.equal(typeof T[n], 'function', n);
  for (const k of ['outline', 'dark', 'mid', 'light', 'shine', 'accent']) assert.match(T.PALETTE[k], /^#[0-9a-f]{6}$/, k);
  assert.ok(lum(T.PALETTE.outline) < lum(T.PALETTE.dark) && lum(T.PALETTE.dark) < lum(T.PALETTE.mid) &&
    lum(T.PALETTE.mid) < lum(T.PALETTE.light) && lum(T.PALETTE.light) < lum(T.PALETTE.shine));
});

test('draw returns true/false and matches the direct call', () => {
  const c = fakeCtx(); assert.equal(T.draw(c, 'rack', 0, 0, 30, 40), true);
  const d = fakeCtx(); assert.equal(T.draw(d, 'toaster', 0, 0, 30, 40), false); assert.equal(d.calls.length, 0);
  const e = fakeCtx(); T.rack(e, 0, 0, 30, 40); assert.deepEqual(e.calls, c.calls);
});

for (const name of NAMES) test(`${name}: pixel look, in its box, detailed, deterministic, outlined, glows in accent`, () => {
  for (const box of BOXES) for (const t of [0, 13, 100]) {
    const c = run(name, box, { t }), rs = rects(c);
    assert.deepEqual(onlyAllowed(c), [], 'only fillRect / fillStyle / globalAlpha / save / restore');
    assert.deepEqual(outsideOnes(rs, ...box), [], `every fillRect inside ${box} at t=${t}`);
    assert.ok(ints(rs), 'whole-pixel coordinates');
    assert.ok(rs.length >= (box[2] >= 40 ? 12 : 6), `detailed: ${rs.length} in ${box}`);
    assert.deepEqual(run(name, box, { t }).calls, c.calls, 'same t -> same picture');
    assert.ok(styles(c).includes(T.PALETTE.outline), 'dark outline');
  }
  assert.ok(styles(run(name, [0, 0, 48, 40], { color: '#ff00aa' })).includes('#ff00aa'), 'opts.color is the glow/screen color');
  assert.ok(styles(run(name, [0, 0, 48, 40])).includes(T.PALETTE.accent), 'default glow = PALETTE.accent');
});

test('animated machines change over time (lights blink, screens scroll); pod does not', () => {
  for (const n of ANIMATED) {
    const pics = new Set([0, 10, 20, 30, 40, 50, 60].map(t => JSON.stringify(run(n, [0, 0, 48, 40], { t }).calls)));
    assert.ok(pics.size >= 2, n + ' animates');
  }
  assert.deepEqual(run('pod', [0, 0, 24, 48], { t: 0 }).calls, run('pod', [0, 0, 24, 48], { t: 50 }).calls);
});

test('animation loops: t and t + 120 look the same', () => {
  for (const n of ANIMATED) assert.deepEqual(run(n, [0, 0, 48, 40], { t: 7 }).calls, run(n, [0, 0, 48, 40], { t: 127 }).calls, n);
});

test('wallscreen: opts.lines draws that many text-like bars', () => {
  const bars = n => rects(run('wallscreen', [0, 0, 64, 32], { lines: n, color: '#ff00aa', t: 0 })).length;
  assert.ok(bars(5) > bars(2), 'more lines -> more rects');
});

test('pod: opts.occupied shows a figure (a different picture)', () => {
  assert.notDeepEqual(run('pod', [0, 0, 24, 48], { occupied: true }).calls, run('pod', [0, 0, 24, 48]).calls);
});
