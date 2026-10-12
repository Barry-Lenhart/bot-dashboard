(function (root) {
  "use strict";

  function hexA(color, alpha) {
    var c = color.replace("#", "");
    if (c.length === 3) {
      c = c.split("").map(function (ch) { return ch + ch; }).join("");
    }
    var r = parseInt(c.slice(0, 2), 16);
    var g = parseInt(c.slice(2, 4), 16);
    var b = parseInt(c.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + String(alpha) + ")";
  }

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6d2b79f5;
      var t = Math.imul(a ^ (a >>> 15), a | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeStars(count, w, h, seed) {
    var r = rng(seed);
    var stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: r() * w,
        y: r() * h,
        r: 0.4 + r() * 1.4,
        a: 0.3 + r() * 0.7,
        tw: r() * 2 * Math.PI,
      });
    }
    return stars;
  }

  function drawSpace(ctx, w, h, t, stars) {
    ctx.fillStyle = "#05030f";
    ctx.fillRect(0, 0, w, h);

    var clouds = [
      { cx: w * 0.25, cy: h * 0.35, r: Math.min(w, h) * 0.35 },
      { cx: w * 0.75, cy: h * 0.65, r: Math.min(w, h) * 0.4 },
      { cx: w * 0.5, cy: h * 0.2, r: Math.min(w, h) * 0.3 },
    ];
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      var dx = Math.sin(t / 600) * 10;
      var dy = Math.sin(t / 600 + 2) * 10;
      var gradient = ctx.createRadialGradient(
        c.cx + dx, c.cy + dy, 0,
        c.cx + dx, c.cy + dy, c.r
      );
      gradient.addColorStop(0, "#ff3df2");
      gradient.addColorStop(0.33, "#9d6bff");
      gradient.addColorStop(0.66, "#3d5bff");
      gradient.addColorStop(1, "rgba(61,91,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    for (var s = 0; s < stars.length; s++) {
      var star = stars[s];
      var alpha = star.a * (0.6 + 0.4 * Math.sin(t / 40 + star.tw));
      ctx.fillStyle = hexA("#ffffff", alpha);
      var size = star.r > 1.2 ? 2 : 1;
      ctx.fillRect(Math.round(star.x), Math.round(star.y), size, size);
    }
  }

  function drawFloor(ctx, x, y, w, h, color, tile) {
    if (tile === undefined) tile = 16;
    var grays = ["#2b2f38", "#2f343e", "#272a33"];
    var cols = Math.ceil(w / tile);
    var rows = Math.ceil(h / tile);

    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var tileX = x + i * tile;
        var tileY = y + j * tile;
        var tileW = Math.min(tile, x + w - tileX);
        var tileH = Math.min(tile, y + h - tileY);
        if (tileW <= 0 || tileH <= 0) continue;

        var baseColor = grays[(i * 7 + j * 13) % 3];
        ctx.fillStyle = baseColor;
        ctx.fillRect(tileX, tileY, tileW, tileH);

        ctx.fillStyle = "#1b1d24";
        ctx.fillRect(tileX, tileY, tileW, 1);
        ctx.fillRect(tileX, tileY, 1, tileH);

        ctx.fillStyle = "#3a404c";
        if (tileW > 1) {
          ctx.fillRect(tileX + tileW - 1, tileY, 1, tileH);
        }
        if (tileH > 1) {
          ctx.fillRect(tileX, tileY + tileH - 1, tileW, 1);
        }

        if ((i + j) % 2 === 0) {
          ctx.fillStyle = "#4a5160";
          var rivets = [
            { rx: tileX + 2, ry: tileY + 2 },
            { rx: tileX + tileW - 4, ry: tileY + 2 },
            { rx: tileX + 2, ry: tileY + tileH - 4 },
            { rx: tileX + tileW - 4, ry: tileY + tileH - 4 },
          ];
          for (var r = 0; r < rivets.length; r++) {
            var riv = rivets[r];
            if (riv.rx >= x && riv.rx + 2 <= x + w + 1e-9 && riv.ry >= y && riv.ry + 2 <= y + h + 1e-9) {
              ctx.fillRect(riv.rx, riv.ry, 2, 2);
            }
          }
        }
      }
    }

    ctx.fillStyle = hexA(color, 0.06);
    ctx.fillRect(x, y, w, h);
  }

  function drawHull(ctx, x, y, w, h, color, thick) {
    if (thick === undefined) thick = 6;
    var inset = thick / 2;
    var r = 10;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.strokeStyle = "#0a0c12";
    ctx.lineWidth = thick + 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "#9aa3b2";
    ctx.lineWidth = thick;
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(x + inset, y + inset, w - 2 * inset, h - 2 * inset, r);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#d7dde6";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  var api = {
    hexA: hexA,
    rng: rng,
    makeStars: makeStars,
    drawSpace: drawSpace,
    drawFloor: drawFloor,
    drawHull: drawHull,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.StationArt = api;
  }
})(typeof self !== "undefined" ? self : this);
