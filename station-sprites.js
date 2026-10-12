// Picks which crew animation frame (art/crew/<name>.png) a bot shows.
(function (root) {
  'use strict';

  var DIRS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];

  function dirFromVector(dx, dy, prev) {
    if (prev === undefined) prev = 'south';
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return prev;
    return DIRS[((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];
  }

  function dir4(dir) {
    if (dir === 'east') return 'east';
    if (dir === 'west') return 'west';
    if (dir === 'north' || dir === 'north-east' || dir === 'north-west') return 'north';
    if (dir === 'south' || dir === 'south-east' || dir === 'south-west') return 'south';
    return 'south';
  }

  function frameName(state) {
    if (state === undefined || state === null) state = {};
    var mode = state.mode;
    var dir = state.dir === undefined ? 'south' : state.dir;
    var t = state.t === undefined ? 0 : state.t;
    var d4 = dir4(dir);

    if (mode === 'walk') {
      return 'walk_' + dir + '_' + (Math.floor(t / 5) % 8);
    }
    if (mode === 'sit') {
      return 'sit_' + d4;
    }
    if (mode === 'type') {
      return 'type_north_' + (Math.floor(t / 6) % 4);
    }
    if (mode === 'gesture') {
      return 'gesture_' + d4 + '_' + (Math.floor(t / 8) % 9);
    }
    if (mode === 'talk') {
      if (d4 === 'north') return 'gesture_north_' + (Math.floor(t / 8) % 9);
      return 'talk_' + d4 + '_' + (Math.floor(t / 10) % 2);
    }
    // idle and any other mode
    if (dir === 'south' && state.t !== undefined && t % 180 < 6) return 'blink_south';
    return 'rot_' + dir;
  }

  var ALL_FRAMES = [];
  for (var i = 0; i < DIRS.length; i++) {
    var dir = DIRS[i];
    for (var f = 0; f < 8; f++) ALL_FRAMES.push('walk_' + dir + '_' + f);
    ALL_FRAMES.push('rot_' + dir);
  }
  var FACE4 = ['east', 'south', 'west', 'north'];
  for (var g = 0; g < FACE4.length; g++) {
    var face = FACE4[g];
    ALL_FRAMES.push('sit_' + face);
    for (var n = 0; n < 9; n++) ALL_FRAMES.push('gesture_' + face + '_' + n);
  }
  var FACE3 = ['east', 'south', 'west'];
  for (var k = 0; k < FACE3.length; k++) {
    for (var m = 0; m < 2; m++) ALL_FRAMES.push('talk_' + FACE3[k] + '_' + m);
  }
  for (var p = 0; p < 4; p++) ALL_FRAMES.push('type_north_' + p);
  ALL_FRAMES.push('blink_south');

  var api = { DIRS: DIRS, dirFromVector: dirFromVector, dir4: dir4, frameName: frameName, ALL_FRAMES: ALL_FRAMES };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StationSprites = api;
})(typeof self !== 'undefined' ? self : this);
