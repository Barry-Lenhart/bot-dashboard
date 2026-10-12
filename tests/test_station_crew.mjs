// Tests for station-crew.js: our own pixel-art crew member (a little astronaut) drawn with fillRect only.
// drawCrew(ctx, x, y, opts): (x, y) is the point between the feet; the figure is opts.size px tall.
// Run: node --test tests/test_station_crew.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fakeCtx, rects, styles, outsideOnes, ints, onlyAllowed } from './propkit.mjs';
const require = createRequire(import.meta.url);
const C = require('../station-crew.js');
const run = opts => { const c = fakeCtx(); C.drawCrew(c, 100, 200, opts); return c; };
const box = s => [100 - Math.ceil(s / 2), 200 - s, 2 * Math.ceil(s / 2), s + 2];   // figure box (+2px for the shadow)
const MODES = ['idle', 'walk', 'sit', 'type', 'talk'], DIRS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];

test('exports', () => {
  assert.equal(typeof C.drawCrew, 'function');
  assert.deepEqual(C.MODES, MODES);
  assert.equal(C.DEFAULT_SIZE, 28);
  assert.match(C.SKIN, /^#[0-9a-f]{6}$/); assert.match(C.VISOR, /^#[0-9a-f]{6}$/); assert.match(C.OUTLINE, /^#[0-9a-f]{6}$/);
});

test('every mode, direction and size: fillRect only, whole pixels, inside the figure box, deterministic', () => {
  for (const size of [28, 20, 40]) for (const mode of MODES) for (const dir of DIRS) for (const t of [0, 5, 17, 33]) {
    const o = { mode, dir, t, size, color: '#3dffa2' }, c = run(o), rs = rects(c);
    assert.deepEqual(onlyAllowed(c), [], 'only fillRect / fillStyle / globalAlpha / save / restore');
    assert.ok(ints(rs), `whole pixels ${mode} ${dir}`);
    assert.deepEqual(outsideOnes(rs, ...box(size)), [], `${mode} ${dir} ${size} t=${t} inside ${box(size)}`);
    assert.ok(rs.length >= 15, `detailed: ${rs.length}`);
    assert.deepEqual(run(o).calls, c.calls);
  }
});

test('defaults: size 28, mode idle, dir south, t 0, color #22e4ff', () => {
  assert.deepEqual(run({}).calls, run({ size: 28, mode: 'idle', dir: 'south', t: 0, color: '#22e4ff' }).calls);
  assert.deepEqual(run().calls, run({}).calls);
});

test('suit uses the bot color; dark outline; soft shadow under the feet', () => {
  const c = run({ color: '#ff00aa' });
  assert.ok(styles(c).filter(s => s === '#ff00aa').length >= 2, 'suit in the bot color');
  assert.ok(styles(c).includes(C.OUTLINE));
  assert.ok(c.calls.some(x => x[0] === 'set:globalAlpha' && x[1][0] > 0 && x[1][0] < 1), 'translucent shadow');
  const last = c.calls.filter(x => x[0] === 'set:globalAlpha').pop(); assert.equal(last[1][0], 1, 'alpha restored to 1');
});

test('facing: south shows the visor, north shows the back (no visor)', () => {
  assert.ok(styles(run({ dir: 'south' })).includes(C.VISOR));
  assert.ok(!styles(run({ dir: 'north' })).includes(C.VISOR));
  assert.ok(styles(run({ dir: 'east' })).includes(C.VISOR), 'side view shows the visor too');
});

test('west is east mirrored around x', () => {
  for (const mode of ['idle', 'walk', 'talk']) {
    const e = rects(run({ dir: 'east', mode, t: 6 })).map(([x, y, w, h]) => [200 - x - w, y, w, h]);
    const w = rects(run({ dir: 'west', mode, t: 6 }));
    const key = r => r.join(','); assert.deepEqual(new Set(w.map(key)), new Set(e.map(key)), mode);
  }
});

test('diagonals: south-east looks like east, north-west like west (side views)', () => {
  assert.deepEqual(run({ dir: 'south-east' }).calls, run({ dir: 'east' }).calls);
  assert.deepEqual(run({ dir: 'north-west' }).calls, run({ dir: 'west' }).calls);
  assert.deepEqual(run({ dir: 'bogus' }).calls, run({ dir: 'south' }).calls, 'unknown dir = south');
});

test('walk animates (legs swing, 4-step loop of 6 ticks each); idle is still', () => {
  const walk = t => JSON.stringify(run({ mode: 'walk', t }).calls);
  assert.equal(walk(0), walk(5)); assert.notEqual(walk(0), walk(6));
  assert.equal(walk(0), walk(24), 'loops every 24 ticks');
  assert.equal(new Set([0, 6, 12, 18].map(walk)).size >= 2, true);
  assert.equal(JSON.stringify(run({ mode: 'idle', t: 0 }).calls), JSON.stringify(run({ mode: 'idle', t: 11 }).calls));
});

test('sit is shorter than standing; type moves its arms; talk animates', () => {
  const top = o => Math.min(...rects(run(o)).filter(r => r[3] < 20).map(r => r[1]));
  assert.ok(top({ mode: 'sit' }) > top({ mode: 'idle' }), 'seated figure is lower');
  assert.notDeepEqual(run({ mode: 'type', t: 0 }).calls, run({ mode: 'type', t: 4 }).calls);
  assert.notDeepEqual(run({ mode: 'talk', t: 0 }).calls, run({ mode: 'talk', t: 10 }).calls);
  assert.deepEqual(run({ mode: 'mystery' }).calls, run({ mode: 'idle' }).calls, 'unknown mode = idle');
});
