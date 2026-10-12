(function (root) {
  const api = {};
  api.MODES = ['idle', 'walk', 'sit', 'type', 'talk'];
  api.DEFAULT_SIZE = 28;
  api.SKIN = '#f1c7a1';
  api.VISOR = '#9fe8ff';
  api.OUTLINE = '#0a0d14';

  function darken(color) {
    var r = parseInt(color.slice(1, 3), 16);
    var g = parseInt(color.slice(3, 5), 16);
    var b = parseInt(color.slice(5, 7), 16);
    r = Math.max(0, Math.floor(r * 0.65));
    g = Math.max(0, Math.floor(g * 0.65));
    b = Math.max(0, Math.floor(b * 0.65));
    return '#' + (r < 16 ? '0' : '') + r.toString(16) + (g < 16 ? '0' : '') + g.toString(16) + (b < 16 ? '0' : '') + b.toString(16);
  }

  api.drawCrew = function (ctx, x, y, opts) {
    if (!opts) opts = {};
    var s = (opts.size !== undefined) ? opts.size : api.DEFAULT_SIZE;
    var mode = opts.mode || 'idle';
    var dirs = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
    var dir = opts.dir || 'south';
    if (dirs.indexOf(dir) < 0) dir = 'south';
    var t = (opts.t !== undefined) ? opts.t : 0;
    var color = opts.color || '#22e4ff';

    if (api.MODES.indexOf(mode) < 0) mode = 'idle';

    var hw = Math.ceil(s / 2);
    var u = s / 28;

    // Collapse directions to 3 views
    var view = 'front'; // south/south-east/south-west -> front (shows visor)
    if (dir === 'north' || dir === 'north-east' || dir === 'north-west') {
      view = 'back';
    } else if (dir === 'east' || dir === 'south-east' || dir === 'north-east' || dir === 'west' || dir === 'south-west' || dir === 'north-west') {
      if (dir.indexOf('west') >= 0 || dir.indexOf('north-west') >= 0 || dir.indexOf('south-west') >= 0) {
        view = 'left';
      } else {
        view = 'right';
      }
    }
    // Simplify: south family -> front, north family -> back, rest -> side based on east/west
    // Re-map properly:
    if (dir === 'south' || dir === 'south-east' || dir === 'south-west') {
      view = 'front';
    } else if (dir === 'north' || dir === 'north-east' || dir === 'north-west') {
      view = 'back';
    } else if (dir === 'east' || dir === 'south-east' || dir === 'north-east') {
      view = 'right';
    } else if (dir === 'west' || dir === 'south-west' || dir === 'north-west') {
      view = 'left';
    }

    // But the requirement: south-east looks exactly like east, north-west exactly like west
    // Let's just map directly:
    var mappedDir = 'south';
    if (dir === 'east' || dir === 'south-east' || dir === 'north-east') mappedDir = 'east';
    else if (dir === 'west' || dir === 'south-west' || dir === 'north-west') mappedDir = 'west';
    else if (dir === 'north' || dir === 'north-east' || dir === 'north-west') mappedDir = 'north';
    else mappedDir = 'south';
    // Actually let's use a simpler mapping for view:
    var isFront = (dir === 'south');
    var isBack = (dir === 'north');
    var isRight = (dir === 'east' || dir === 'south-east' || dir === 'north-east');
    var isLeft = (dir === 'west' || dir === 'south-west' || dir === 'north-west');

    // For drawing, we'll construct rect arrays and mirror for left

    function r(rx, ry, rw, rh, col) {
      return [rx, ry, rw, rh, col];
    }

    var rects = [];

    // Helper to add rects with scale and round
    function addRects(list) {
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var rx = Math.round(x + item[0] * u);
        var ry = Math.round(y - s + item[1] * u);
        var rw = Math.round(item[2] * u);
        var rh = Math.round(item[3] * u);
        // Ensure non-negative
        if (rw < 0) rw = 0;
        if (rh < 0) rh = 0;
        rects.push([rx, ry, rw, rh, item[4]]);
      }
    }

    // Re-start: collect figure rects
    rects = [];

    // Figure rects (relative coordinates, size 28 base)
    // We'll define based on mode and mappedDir

    // For simplicity, let's define base rect specs for each mode/view
    var specs = [];

    if (mode === 'sit' || mode === 'type') {
      // Seated figure - shorter, legs bent
      var topOffset = 7; // ~25% lower at size 28
      // Helmet (10px)
      specs.push(r(-6, 0 + topOffset, 12, 4, '#d8dee9'));
      specs.push(r(-7, 4 + topOffset, 14, 4, '#d8dee9'));
      specs.push(r(-6, 8 + topOffset, 12, 2, '#d8dee9'));
      // Helmet shine
      specs.push(r(-3, 1 + topOffset, 4, 2, '#ffffff'));
      // Helmet outline
      specs.push(r(-7, 0 + topOffset, 1, 10, api.OUTLINE));
      specs.push(r(7, 0 + topOffset, 1, 10, api.OUTLINE));
      specs.push(r(-7, 9 + topOffset, 14, 1, api.OUTLINE));

      // Visor (only front)
      if (isFront) {
        specs.push(r(-4, 5 + topOffset, 8, 2, api.VISOR));
        specs.push(r(-4, 4 + topOffset, 8, 1, '#3fa9c9'));
        // Face peek
        specs.push(r(-2, 6 + topOffset, 4, 1, api.SKIN));
      }
      // Back (north): no visor, add small backpack
      if (isBack) {
        specs.push(r(-4, 7 + topOffset, 6, 3, '#3e4a5d'));
      }
      if (!isFront && !isBack) {
        specs.push(r(5, 5 + topOffset, 2, 3, api.VISOR));
        specs.push(r(5, 6 + topOffset, 2, 2, '#3fa9c9'));
      }

      // Torso (7px)
      specs.push(r(-5, 9 + topOffset, 10, 7, color));
      // Chest light
      specs.push(r(-1, 11 + topOffset, 2, 3, '#ffffff'));
      // Torso outline
      specs.push(r(-5, 9 + topOffset, 1, 7, api.OUTLINE));
      specs.push(r(4, 9 + topOffset, 1, 7, api.OUTLINE));

      // Arms
      if (mode === 'type') {
        // Arms forward for typing
        specs.push(r(-3, 11 + topOffset, 4, 4, color));
        specs.push(r(3, 11 + topOffset, 4, 4, color));
        // Gloves / hands
        var handY = (Math.floor(t / 4) % 2 === 1) ? 11 + topOffset - 1 : 11 + topOffset;
        specs.push(r(-5, handY, 3, 2, '#3e4a5d'));
        specs.push(r(5, handY + 1, 3, 2, '#3e4a5d'));
      } else {
        specs.push(r(-9, 12 + topOffset, 3, 6, color));
        specs.push(r(6, 12 + topOffset, 3, 6, color));
        specs.push(r(-9, 17 + topOffset, 3, 2, '#3e4a5d'));
        specs.push(r(6, 17 + topOffset, 3, 2, '#3e4a5d'));
      }

      // Legs bent
      specs.push(r(-4, 16 + topOffset, 6, 5, color));
      specs.push(r(1, 16 + topOffset, 6, 5, color));
      // Boots at ground
      specs.push(r(-4, 19 + topOffset, 3, 2, '#3e4a5d'));
      specs.push(r(5, 19 + topOffset, 3, 2, '#3e4a5d'));

    } else if (mode === 'walk') {
      var frame = Math.floor(t / 6) % 4;
      var bob = (frame === 1 || frame === 3) ? 1 : 0;

      // Helmet (11px)
      specs.push(r(-6, 0 + bob, 12, 4, '#d8dee9'));
      specs.push(r(-7, 4 + bob, 14, 4, '#d8dee9'));
      specs.push(r(-6, 8 + bob, 12, 3, '#d8dee9'));
      specs.push(r(-3, 1 + bob, 4, 2, '#ffffff'));
      specs.push(r(-7, 0 + bob, 1, 10, api.OUTLINE));
      specs.push(r(7, 0 + bob, 1, 10, api.OUTLINE));
      specs.push(r(-7, 10 + bob, 14, 1, api.OUTLINE));

      if (isFront) {
        specs.push(r(-4, 11 + bob, 8, 2, api.VISOR));
        specs.push(r(-4, 10 + bob, 8, 1, '#3fa9c9'));
        specs.push(r(-2, 11 + bob, 4, 1, api.SKIN));
      }
      if (isBack) {
        specs.push(r(-4, 9 + bob, 6, 3, '#3e4a5d'));
      }
      if (!isFront && !isBack) {
        specs.push(r(5, 9 + bob, 2, 3, api.VISOR));
        specs.push(r(5, 10 + bob, 2, 2, '#3fa9c9'));
      }

      // Torso (8px)
      specs.push(r(-5, 11 + bob, 10, 8, color));
      specs.push(r(-1, 13 + bob, 2, 3, '#ffffff'));
      specs.push(r(-5, 11 + bob, 1, 8, api.OUTLINE));
      specs.push(r(4, 11 + bob, 1, 8, api.OUTLINE));

      // Arms (swing)
      if (frame === 1) {
        specs.push(r(-11, 13 + bob, 3, 6, color));
        specs.push(r(8, 13 + bob, 3, 6, color));
      } else if (frame === 3) {
        specs.push(r(-7, 13 + bob, 3, 6, color));
        specs.push(r(4, 13 + bob, 3, 6, color));
      } else {
        specs.push(r(-9, 13 + bob, 3, 6, color));
        specs.push(r(6, 13 + bob, 3, 6, color));
      }
      // Glove positions should match arm positions. Adjust based on frame
      if (frame === 1) {
        specs.push(r(-12, 7 + bob, 3, 2, '#3e4a5d'));
        specs.push(r(9, 7 + bob, 3, 2, '#3e4a5d'));
      } else if (frame === 3) {
        specs.push(r(-7, 7 + bob, 3, 2, '#3e4a5d'));
        specs.push(r(4, 7 + bob, 3, 2, '#3e4a5d'));
      } else {
        specs.push(r(-9, 7 + bob, 3, 2, '#3e4a5d'));
        specs.push(r(6, 7 + bob, 3, 2, '#3e4a5d'));
      }

      // Legs (swing) at 19-26, boots at 26-28
      if (frame === 1) {
        specs.push(r(-4, 21 + bob, 3, 5, color));
        specs.push(r(1, 19 + bob, 3, 7, color));
        specs.push(r(-4, 26 + bob, 3, 2, '#3e4a5d'));
        specs.push(r(1, 26 + bob, 3, 2, '#3e4a5d'));
      } else if (frame === 3) {
        specs.push(r(-4, 19 + bob, 3, 7, color));
        specs.push(r(1, 21 + bob, 3, 5, color));
        specs.push(r(-4, 26 + bob, 3, 2, '#3e4a5d'));
        specs.push(r(1, 26 + bob, 3, 2, '#3e4a5d'));
      } else {
        specs.push(r(-4, 19 + bob, 3, 7, color));
        specs.push(r(1, 19 + bob, 3, 7, color));
        specs.push(r(-4, 26 + bob, 3, 2, '#3e4a5d'));
        specs.push(r(1, 26 + bob, 3, 2, '#3e4a5d'));
      }
    } else if (mode === 'talk') {
      // Standing with arm raised
      specs.push(r(-6, 0, 12, 4, '#d8dee9'));
      specs.push(r(-7, 4, 14, 4, '#d8dee9'));
      specs.push(r(-6, 8, 12, 3, '#d8dee9'));
      specs.push(r(-3, 1, 4, 2, '#ffffff'));
      specs.push(r(-7, 0, 1, 11, api.OUTLINE));
      specs.push(r(7, 0, 1, 11, api.OUTLINE));
      specs.push(r(-7, 10, 14, 1, api.OUTLINE));

      if (isFront) {
        specs.push(r(-4, 11, 8, 2, api.VISOR));
        specs.push(r(-4, 10, 8, 1, '#3fa9c9'));
        specs.push(r(-2, 11, 4, 1, api.SKIN));
      }
      if (isBack) {
        specs.push(r(-4, 9, 6, 3, '#3e4a5d'));
      }
      if (!isFront && !isBack) {
        specs.push(r(5, 9, 2, 3, api.VISOR));
        specs.push(r(5, 10, 2, 2, '#3fa9c9'));
      }

      specs.push(r(-5, 11, 10, 8, color));
      specs.push(r(-1, 13, 2, 3, '#ffffff'));
      specs.push(r(-5, 11, 1, 8, api.OUTLINE));
      specs.push(r(4, 11, 1, 8, api.OUTLINE));

      // Arm raised
      if (Math.floor(t / 10) % 2 === 1) {
        specs.push(r(-11, 9, 3, 7, color));
        specs.push(r(6, 13, 3, 6, color));
        specs.push(r(-11, 5, 3, 2, '#3e4a5d'));
        specs.push(r(6, 7, 3, 2, '#3e4a5d'));
      } else {
        specs.push(r(-9, 13, 3, 6, color));
        specs.push(r(6, 13, 3, 6, color));
        specs.push(r(-9, 7, 3, 2, '#3e4a5d'));
        specs.push(r(6, 7, 3, 2, '#3e4a5d'));
      }

      // Legs
      specs.push(r(-4, 19, 3, 7, color));
      specs.push(r(1, 19, 3, 7, color));
      specs.push(r(-4, 26, 3, 2, '#3e4a5d'));
      specs.push(r(1, 26, 3, 2, '#3e4a5d'));

      // Speech pixel
      if (Math.floor(t / 10) % 2 === 1) {
        specs.push(r(8, 10, 2, 2, '#ffffff'));
      } else {
        specs.push(r(8, 14, 2, 2, '#ffffff'));
      }
    } else {
      // idle
      specs.push(r(-6, 0, 12, 4, '#d8dee9'));
      specs.push(r(-7, 4, 14, 4, '#d8dee9'));
      specs.push(r(-6, 8, 12, 3, '#d8dee9'));
      specs.push(r(-3, 1, 4, 2, '#ffffff'));
      specs.push(r(-7, 0, 1, 11, api.OUTLINE));
      specs.push(r(7, 0, 1, 11, api.OUTLINE));
      specs.push(r(-7, 10, 14, 1, api.OUTLINE));

      if (isFront) {
        specs.push(r(-4, 11, 8, 2, api.VISOR));
        specs.push(r(-4, 10, 8, 1, '#3fa9c9'));
        specs.push(r(-2, 11, 4, 1, api.SKIN));
      }
      if (isBack) {
        specs.push(r(-4, 9, 6, 3, '#3e4a5d'));
      }
      // Side view: show visor on facing side (always right before mirror)
      if (!isFront && !isBack) {
        specs.push(r(5, 9, 2, 3, api.VISOR));
        specs.push(r(5, 10, 2, 2, '#3fa9c9'));
      }

      specs.push(r(-5, 11, 10, 8, color));
      specs.push(r(-1, 13, 2, 3, '#ffffff'));
      specs.push(r(-5, 11, 1, 8, api.OUTLINE));
      specs.push(r(4, 11, 1, 8, api.OUTLINE));

      specs.push(r(-9, 13, 3, 6, color));
      specs.push(r(6, 13, 3, 6, color));
      specs.push(r(-9, 7, 3, 2, '#3e4a5d'));
      specs.push(r(6, 7, 3, 2, '#3e4a5d'));

      specs.push(r(-4, 19, 3, 7, color));
      specs.push(r(1, 19, 3, 7, color));
      specs.push(r(-4, 26, 3, 2, '#3e4a5d'));
      specs.push(r(1, 26, 3, 2, '#3e4a5d'));
    }

    // Mirror for left view
    if (isLeft) {
      var mirrored = [];
      for (var i = 0; i < specs.length; i++) {
        var item = specs[i];
        var rx = item[0];
        var rw = item[2];
        mirrored.push(r(-rx - rw, item[1], rw, item[3], item[4]));
      }
      specs = mirrored;
    }

    // Draw shadow
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#1a1d2e';
    var su = s / 28;
    var shW = Math.round(8 * su);
    ctx.fillRect(Math.round(x - 4 * su), Math.round(y), shW, 2);
    ctx.fillRect(Math.round(x - 5 * su), Math.round(y + 1), Math.round(10 * su), 1);
    ctx.restore();

    // Draw figure rects
    for (var i = 0; i < specs.length; i++) {
      var item = specs[i];
      var rx = Math.round(x + item[0] * u);
      var ry = Math.round(y - s + item[1] * u);
      var rw = Math.round(item[2] * u);
      var rh = Math.round(item[3] * u);
      if (rw < 0) rw = 0;
      if (rh < 0) rh = 0;
      ctx.fillStyle = item[4];
      ctx.fillRect(rx, ry, rw, rh);
    }

    // Final globalAlpha = 1
    ctx.globalAlpha = 1;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.StationCrew = api;
  }
})(typeof self !== 'undefined' ? self : this);
