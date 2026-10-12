// Tests for station-furniture.js: our own pixel-art furniture, drawn with fillRect only.
// Every prop is drawn inside a box (x, y, w, h) in a top-down "3/4" view.
// Run: node --test tests/test_station_furniture.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fakeCtx, rects, styles, outsideOnes, ints, onlyAllowed, lum, greenish } from './propkit.mjs';
const require = createRequire(import.meta.url);
const F = require('../station-furniture.js');
const NAMES = ['desk', 'chair', 'table', 'couch', 'plant', 'crate', 'locker', 'coffee', 'cart'];
const BOXES = [[10, 20, 48, 32], [0, 0, 24, 40], [100, 50, 80, 36], [7, 9, 17, 17]];
const run = (name, box, opts) => { const c = fakeCtx(); F.draw(c, name, ...box, opts); return c; };

test('exports: PALETTE, NAMES, draw and one function per prop', () => {
  assert.deepEqual(F.NAMES, NAMES);
  for (const n of NAMES) assert.equal(typeof F[n], 'function', n);
  assert.equal(typeof F.draw, 'function');
  for (const k of ['outline', 'dark', 'mid', 'light', 'shine', 'accent']) assert.match(F.PALETTE[k], /^#[0-9a-f]{6}$/, k);
  assert.ok(lum(F.PALETTE.outline) < lum(F.PALETTE.dark) && lum(F.PALETTE.dark) < lum(F.PALETTE.mid) &&
    lum(F.PALETTE.mid) < lum(F.PALETTE.light) && lum(F.PALETTE.light) < lum(F.PALETTE.shine), 'palette goes dark -> bright');
  assert.ok(lum(F.PALETTE.mid) < 110, 'dark industrial metal');
});

test('draw returns true for known props, false (and draws nothing) for unknown ones', () => {
  const c = fakeCtx(); assert.equal(F.draw(c, 'desk', 0, 0, 40, 30), true);
  const d = fakeCtx(); assert.equal(F.draw(d, 'spaceship', 0, 0, 40, 30), false); assert.equal(d.calls.length, 0);
  const e = fakeCtx(); F.desk(e, 0, 0, 40, 30); assert.deepEqual(e.calls, c.calls, 'draw(name) == calling the function directly');
});

for (const name of NAMES) test(`${name}: pixel look, stays in its box, detailed, deterministic, outlined`, () => {
  for (const box of BOXES) {
    const c = run(name, box), rs = rects(c);
    assert.deepEqual(onlyAllowed(c), [], 'only fillRect / fillStyle / globalAlpha / save / restore');
    assert.deepEqual(outsideOnes(rs, ...box), [], `every fillRect inside ${box}`);
    assert.ok(ints(rs), 'whole-pixel coordinates (Math.round)');
    assert.ok(rs.length >= (box[2] >= 40 ? 12 : 6), `detailed enough: ${rs.length} rects in ${box}`);
    assert.deepEqual(run(name, box).calls, c.calls, 'same input -> same picture');
    assert.ok(styles(c).includes(F.PALETTE.outline), 'dark outline');
    assert.ok(new Set(styles(c)).size >= 3, 'at least 3 shades');
  }
});

test('desk: monitors with screens in the accent color; monitors option 0..3', () => {
  const s = n => styles(run('desk', [0, 0, 60, 34], { monitors: n, color: '#ff00aa' })).filter(x => x === '#ff00aa').length;
  assert.equal(s(0), 0, 'no monitors -> no screen color');
  assert.ok(s(1) >= 1 && s(2) > s(1) && s(3) > s(2), 'each monitor adds a screen');
  assert.ok(styles(run('desk', [0, 0, 60, 34])).includes(F.PALETTE.accent), 'default: 2 monitors in PALETTE.accent');
});

test('chair: dir n/s/e/w gives four different pictures; default is "s"', () => {
  const pics = ['n', 's', 'e', 'w'].map(d => JSON.stringify(run('chair', [0, 0, 20, 24], { dir: d }).calls));
  assert.equal(new Set(pics).size, 4);
  assert.equal(JSON.stringify(run('chair', [0, 0, 20, 24]).calls), pics[1]);
});

test('accent color option tints the right props', () => {
  for (const n of ['couch', 'crate', 'locker', 'coffee', 'cart', 'table'])
    assert.ok(styles(run(n, [0, 0, 48, 32], { color: '#ff00aa' })).includes('#ff00aa'), n + ' uses opts.color as its accent');
});

test('plant is green; nothing else uses green leaves', () => {
  assert.ok(styles(run('plant', [0, 0, 24, 40])).filter(greenish).length >= 2, 'at least 2 greens');
  for (const n of NAMES.filter(n => n !== 'plant')) assert.equal(styles(run(n, [0, 0, 48, 32])).filter(greenish).length, 0, n);
});

test('furniture does not animate: opts.t changes nothing', () => {
  for (const n of NAMES) assert.deepEqual(run(n, [0, 0, 48, 32], { t: 0 }).calls, run(n, [0, 0, 48, 32], { t: 37 }).calls, n);
});
