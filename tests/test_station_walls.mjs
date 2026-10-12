// Tests for station-walls.js: StarNet-style room walls for a top-down 3/4 view.
//   north wall = a tall dark wall FACE seen from the front (panels, seams, small status lights)
//   east/west/south = the wall seen from above as a thick dark band with a lit "crown" edge
//   light pools  = soft radial light on the floor
// Checked with a fake canvas context that records every call.
// Run: node --test tests/test_station_walls.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const W = require('../station-walls.js');

function fakeCtx() {
  const calls = [];
  const grad = () => ({ stops: [], addColorStop(o, c) { this.stops.push([o, c]); } });
  const target = { calls };
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return (...a) => { calls.push([k, a]); return grad(); };
      return (...a) => { calls.push([k, a]); };
    },
    set(t, k, v) { t[k] = v; calls.push(['set:' + String(k), [v]]); return true; },
  });
}
const rects = c => c.calls.filter(x => x[0] === 'fillRect').map(x => x[1]);
const styles = c => c.calls.filter(x => x[0] === 'set:fillStyle').map(x => x[1][0]);
const inside = (rs, x, y, w, h) => rs.every(([a, b, c, d]) => a >= x - 1e-9 && b >= y - 1e-9 && a + c <= x + w + 1e-9 && b + d <= y + h + 1e-9);

test('exports', () => {
  for (const f of ['drawNorthWall', 'drawSideWall', 'drawLightPool', 'shade']) assert.equal(typeof W[f], 'function', f);
  assert.equal(W.LIGHTS.length, 2);
});

test('shade lightens and darkens #rrggbb, clamped, always #rrggbb lowercase', () => {
  assert.equal(W.shade('#808080', 0), '#808080');
  assert.equal(W.shade('#808080', -0.5), '#404040');
  assert.equal(W.shade('#808080', 0.5), '#c0c0c0');
  assert.equal(W.shade('#ffffff', 0.5), '#ffffff');
  assert.equal(W.shade('#000000', -0.5), '#000000');
  assert.equal(W.shade('#3A2B1C', 0), '#3a2b1c');
});

test('drawNorthWall: stays inside its box, is deterministic, and depends on the seed', () => {
  const run = seed => { const c = fakeCtx(); W.drawNorthWall(c, 40, 100, 200, 28, { seed }); return c; };
  const a = run(3);
  assert.ok(rects(a).length >= 20, 'detailed: panels, seams, ledge, lights');
  assert.ok(inside(rects(a), 40, 100, 200, 28), 'every fillRect inside the wall box');
  assert.deepEqual(run(3).calls, a.calls, 'same seed -> same picture');
  assert.notDeepEqual(run(4).calls, a.calls, 'different seed -> different light layout');
});

test('drawNorthWall: dark metal, vertical panel seams about every 24px, and status lights', () => {
  const c = fakeCtx(); W.drawNorthWall(c, 0, 0, 240, 28, { seed: 1 });
  const first = rects(c)[0]; assert.deepEqual(first, [0, 0, 240, 28], 'base face fills the whole box first');
  const base = styles(c)[0]; const n = parseInt(base.slice(1), 16);
  assert.ok(((n >> 16) + (n >> 8 & 255) + (n & 255)) / 3 < 80, 'base face is dark: ' + base);
  const seams = rects(c).filter(([, , w, h]) => w === 1 && h >= 20);
  assert.ok(seams.length >= 8 && seams.length <= 12, 'vertical seams ~ every 24px: ' + seams.length);
  const lit = styles(c).filter(s => W.LIGHTS.includes(s));
  assert.ok(lit.length >= 3, 'some amber/teal status lights');
});

test('drawNorthWall: options.lights = 0 draws no status lights; default seed 0 works', () => {
  const c = fakeCtx(); W.drawNorthWall(c, 0, 0, 240, 28, { lights: 0 });
  assert.equal(styles(c).filter(s => W.LIGHTS.includes(s)).length, 0);
  const d = fakeCtx(); W.drawNorthWall(d, 0, 0, 100, 20); assert.ok(rects(d).length > 0);
});

test('drawSideWall: a band with dark seam, crown and lit edge, inside its box', () => {
  for (const side of ['w', 'e', 's']) {
    const c = fakeCtx(); W.drawSideWall(c, 10, 20, 8, 120, side);
    const rs = rects(c);
    assert.ok(rs.length >= 3, side + ': at least seam + crown + lit edge');
    assert.ok(inside(rs, 10, 20, 8, 120), side + ': inside the box');
    assert.equal(new Set(styles(c)).size >= 3, true, side + ': three different tones');
  }
});

test('drawSideWall: the lit edge is on the OUTSIDE of the room', () => {
  const litOf = (side, x, y, w, h) => { const c = fakeCtx(); W.drawSideWall(c, x, y, w, h, side);
    const ss = styles(c), rs = rects(c); const bright = ss.reduce((m, s) => lum(s) > lum(m) ? s : m, ss[0]);
    const i = c.calls.filter(z => z[0] === 'set:fillStyle' || z[0] === 'fillRect'); let cur = null, out = [];
    i.forEach(z => { if (z[0] === 'set:fillStyle') cur = z[1][0]; else if (cur === bright) out.push(z[1]); }); return out; };
  const lum = s => { const n = parseInt(s.slice(1), 16); return (n >> 16) + (n >> 8 & 255) + (n & 255); };
  assert.ok(litOf('w', 0, 0, 8, 100).every(([x]) => x < 4), 'west wall: lit edge on its left (outer) side');
  assert.ok(litOf('e', 0, 0, 8, 100).every(([x, , w]) => x + w > 4), 'east wall: lit edge on its right side');
  assert.ok(litOf('s', 0, 0, 100, 8).every(([, y, , h]) => y + h > 4), 'south wall: lit edge at the bottom');
});

test('drawLightPool: radial gradient centred on the point, fading to transparent', () => {
  const c = fakeCtx(); W.drawLightPool(c, 100, 50, 80, '#ffb347', 0.25);
  const g = c.calls.find(x => x[0] === 'createRadialGradient');
  assert.deepEqual(g[1], [100, 50, 0, 100, 50, 80]);
  assert.deepEqual(rects(c)[0], [20, -30, 160, 160], 'fills only the circle\'s bounding box');
  assert.ok(c.calls.some(x => x[0] === 'set:globalCompositeOperation' && x[1][0] === 'lighter'), 'adds light');
  const last = c.calls.filter(x => x[0] === 'set:globalCompositeOperation').pop();
  assert.equal(last[1][0], 'source-over', 'restores normal drawing');
});
