// Tests for station-art.js: pixel-art drawing helpers (space backdrop, metal floors, room hulls).
// Drawing is checked with a fake canvas context that records every call.
// Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const A = require('../station-art.js');

function fakeCtx() {
  const calls = [];
  const grad = () => ({ stops: [], addColorStop(o, c) { this.stops.push([o, c]); } });
  const target = { calls, canvas: { width: 960, height: 800 } };
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'createRadialGradient' || k === 'createLinearGradient')
        return (...a) => { calls.push([k, a]); return grad(); };
      if (k === 'measureText') return s => ({ width: String(s).length * 6 });
      return (...a) => { calls.push([k, a]); };
    },
    set(t, k, v) { t[k] = v; calls.push(['set:' + String(k), [v]]); return true; },
  });
}
const named = (ctx, n) => ctx.calls.filter(c => c[0] === n).map(c => c[1]);

test('exports', () => {
  for (const f of ['hexA', 'rng', 'makeStars', 'drawSpace', 'drawFloor', 'drawHull']) assert.equal(typeof A[f], 'function', f);
});

test('hexA', () => {
  assert.equal(A.hexA('#ff3df2', 0.5), 'rgba(255,61,242,0.5)');
  assert.equal(A.hexA('#fff', 1), 'rgba(255,255,255,1)');
  assert.equal(A.hexA('#000000', 0), 'rgba(0,0,0,0)');
});

test('rng is a deterministic 0..1 generator', () => {
  const a = A.rng(42), b = A.rng(42), c = A.rng(7);
  const sa = [a(), a(), a()], sb = [b(), b(), b()], sc = [c(), c(), c()];
  assert.deepEqual(sa, sb); assert.notDeepEqual(sa, sc);
  const r = A.rng(1); for (let i = 0; i < 1000; i++) { const v = r(); assert.ok(v >= 0 && v < 1); }
});

test('makeStars: count, bounds, deterministic', () => {
  const s = A.makeStars(300, 960, 800, 5);
  assert.equal(s.length, 300);
  for (const st of s) {
    assert.ok(st.x >= 0 && st.x < 960 && st.y >= 0 && st.y < 800);
    assert.ok(st.r >= 0.4 && st.r <= 1.8); assert.ok(st.a >= 0.3 && st.a <= 1); assert.ok(st.tw >= 0 && st.tw < 2 * Math.PI);
  }
  assert.deepEqual(A.makeStars(20, 100, 100, 9), A.makeStars(20, 100, 100, 9));
  assert.notDeepEqual(A.makeStars(20, 100, 100, 9), A.makeStars(20, 100, 100, 10));
});

test('drawSpace: background first, nebula gradients, every star drawn', () => {
  const ctx = fakeCtx(), stars = A.makeStars(50, 960, 800, 3);
  A.drawSpace(ctx, 960, 800, 0, stars);
  const first = ctx.calls.find(c => c[0] === 'fillRect');
  assert.deepEqual(first[1], [0, 0, 960, 800], 'the whole canvas is painted first');
  assert.ok(named(ctx, 'createRadialGradient').length >= 3, 'at least 3 nebula clouds');
  const starRects = named(ctx, 'fillRect').slice(1).filter(a => a[2] <= 4 && a[3] <= 4);
  assert.ok(starRects.length >= 50, 'each star is drawn as a small square (pixel look)');
  assert.ok(!named(ctx, 'arc').length, 'no round stars: pixel look uses fillRect');
});

test('drawSpace animates: star brightness changes over time', () => {
  const stars = A.makeStars(30, 960, 800, 3), styles = t => { const c = fakeCtx(); A.drawSpace(c, 960, 800, t, stars);
    return c.calls.filter(x => x[0] === 'set:fillStyle').map(x => x[1][0]).join('|'); };
  assert.notEqual(styles(0), styles(100));
  assert.equal(styles(100), styles(100), 'same frame number draws the same picture');
});

test('drawFloor: tiles stay inside the room and pattern is fixed', () => {
  const run = () => { const c = fakeCtx(); A.drawFloor(c, 32, 48, 160, 96, '#22e4ff', 16); return c; };
  const c = run(), rects = named(c, 'fillRect');
  assert.ok(rects.length >= 60, 'every one of the 10x6 tiles is drawn');
  for (const [x, y, w, h] of rects) assert.ok(x >= 32 && y >= 48 && x + w <= 192 + 1e-9 && y + h <= 144 + 1e-9, `outside: ${[x, y, w, h]}`);
  assert.deepEqual(run().calls, c.calls, 'no randomness between frames');
  const tint = c.calls.filter(x => x[0] === 'set:fillStyle' && /^rgba\(34,228,255,/.test(x[1][0]));
  assert.ok(tint.length >= 1, 'room color tint uses hexA(color, ...)');
});

test('drawFloor default tile size is 16', () => {
  const a = fakeCtx(), b = fakeCtx();
  A.drawFloor(a, 0, 0, 64, 64, '#ffffff'); A.drawFloor(b, 0, 0, 64, 64, '#ffffff', 16);
  assert.deepEqual(a.calls, b.calls);
});

test('drawHull: outlines the room with several strokes and a color glow', () => {
  const c = fakeCtx(); A.drawHull(c, 10, 20, 200, 100, '#ff3df2');
  assert.ok(named(c, 'stroke').length >= 3, 'outer dark, metal and inner highlight strokes');
  assert.ok(named(c, 'roundRect').length >= 3, 'rounded corners');
  assert.ok(c.calls.some(x => x[0] === 'set:shadowColor' && x[1][0] === '#ff3df2'), 'glow in the room color');
  assert.ok(c.calls.some(x => x[0] === 'set:lineWidth' && x[1][0] >= 4), 'thick wall (default 6)');
  const last = c.calls.filter(x => x[0] === 'set:shadowBlur').pop();
  assert.equal(last && last[1][0], 0, 'glow switched off afterwards');
});
