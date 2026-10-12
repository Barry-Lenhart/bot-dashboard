// Tests for station-sprites.js: picks which crew animation frame (art/crew/<name>.png) a bot shows.
// Run: node --test tests/test_station_sprites.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../station-sprites.js');

test('exports', () => {
  for (const f of ['dirFromVector', 'dir4', 'frameName']) assert.equal(typeof S[f], 'function', f);
  assert.deepEqual(S.DIRS, ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east']);
  assert.ok(Array.isArray(S.ALL_FRAMES));
});

test('dirFromVector: 8 directions, screen y points down', () => {
  assert.equal(S.dirFromVector(1, 0), 'east');
  assert.equal(S.dirFromVector(1, 1), 'south-east');
  assert.equal(S.dirFromVector(0, 1), 'south');
  assert.equal(S.dirFromVector(-1, 1), 'south-west');
  assert.equal(S.dirFromVector(-1, 0), 'west');
  assert.equal(S.dirFromVector(-1, -1), 'north-west');
  assert.equal(S.dirFromVector(0, -1), 'north');
  assert.equal(S.dirFromVector(1, -1), 'north-east');
  assert.equal(S.dirFromVector(5, 0.4), 'east', 'small angles snap to the nearest direction');
  assert.equal(S.dirFromVector(0.2, 3), 'south');
});

test('dirFromVector keeps the previous direction when not moving', () => {
  assert.equal(S.dirFromVector(0, 0), 'south');
  assert.equal(S.dirFromVector(0, 0, 'west'), 'west');
  assert.equal(S.dirFromVector(1e-9, -1e-9, 'north-east'), 'north-east');
});

test('dir4 collapses diagonals to north/south', () => {
  assert.deepEqual(S.DIRS.map(S.dir4), ['east', 'south', 'south', 'south', 'west', 'north', 'north', 'north']);
  assert.equal(S.dir4(undefined), 'south');
});

test('frameName: walk cycles 8 frames, 5 ticks each', () => {
  assert.equal(S.frameName({ mode: 'walk', dir: 'south-east', t: 0 }), 'walk_south-east_0');
  assert.equal(S.frameName({ mode: 'walk', dir: 'south-east', t: 4 }), 'walk_south-east_0');
  assert.equal(S.frameName({ mode: 'walk', dir: 'south-east', t: 5 }), 'walk_south-east_1');
  assert.equal(S.frameName({ mode: 'walk', dir: 'north', t: 39 }), 'walk_north_7');
  assert.equal(S.frameName({ mode: 'walk', dir: 'north', t: 40 }), 'walk_north_0');
});

test('frameName: idle faces its direction and blinks now and then', () => {
  assert.equal(S.frameName({ mode: 'idle', dir: 'west', t: 50 }), 'rot_west');
  assert.equal(S.frameName({ mode: 'idle', dir: 'south', t: 50 }), 'rot_south');
  assert.equal(S.frameName({ mode: 'idle', dir: 'south', t: 180 }), 'blink_south');
  assert.equal(S.frameName({ mode: 'idle', dir: 'south', t: 365 }), 'blink_south');
  assert.equal(S.frameName({ mode: 'idle', dir: 'south', t: 366 }), 'rot_south');
  assert.equal(S.frameName({ mode: 'idle', dir: 'east', t: 180 }), 'rot_east', 'only blinks facing south');
  assert.equal(S.frameName({ mode: 'mystery', dir: 'north-west', t: 50 }), 'rot_north-west', 'unknown mode = idle');
});

test('frameName: sit, type, gesture, talk', () => {
  assert.equal(S.frameName({ mode: 'sit', dir: 'north-east', t: 3 }), 'sit_north');
  assert.equal(S.frameName({ mode: 'sit', dir: 'east', t: 3 }), 'sit_east');
  assert.equal(S.frameName({ mode: 'type', dir: 'east', t: 0 }), 'type_north_0');
  assert.equal(S.frameName({ mode: 'type', dir: 'east', t: 23 }), 'type_north_3');
  assert.equal(S.frameName({ mode: 'type', dir: 'east', t: 24 }), 'type_north_0');
  assert.equal(S.frameName({ mode: 'gesture', dir: 'south-west', t: 71 }), 'gesture_south_8');
  assert.equal(S.frameName({ mode: 'gesture', dir: 'south-west', t: 72 }), 'gesture_south_0');
  assert.equal(S.frameName({ mode: 'talk', dir: 'east', t: 9 }), 'talk_east_0');
  assert.equal(S.frameName({ mode: 'talk', dir: 'east', t: 10 }), 'talk_east_1');
  assert.equal(S.frameName({ mode: 'talk', dir: 'south-west', t: 20 }), 'talk_south_0');
  assert.equal(S.frameName({ mode: 'talk', dir: 'north-west', t: 16 }), 'gesture_north_2', 'no talk-north frames: gesture instead');
});

test('frameName defaults: missing dir is south, missing t is 0', () => {
  assert.equal(S.frameName({ mode: 'walk' }), 'walk_south_0');
  assert.equal(S.frameName({}), 'rot_south');
  assert.equal(S.frameName(), 'rot_south');
});
