(function (root) {
  const api = {};

  api.LIGHTS = ['#ffb347', '#3fd9ff'];

  function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  api.shade = function (hex, amt) {
    const rgb = hexToRgb(hex);
    
    function shadeChannel(c, amt) {
      if (amt >= 0) {
        return Math.round(c + (255 - c) * amt);
      } else {
        return Math.round(c * (1 + amt));
      }
    }
    
    const r = Math.max(0, Math.min(255, shadeChannel(rgb.r, amt)));
    const g = Math.max(0, Math.min(255, shadeChannel(rgb.g, amt)));
    const b = Math.max(0, Math.min(255, shadeChannel(rgb.b, amt)));
    return rgbToHex(r, g, b).toLowerCase();
  };

  function mulberry32(seed) {
    return function () {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t * 0xBB2FCF2D);
      t ^= t + Math.imul(t ^ (t >>> 13), t * 0x1BCE7E43);
      return (t >>> 0) / 4294967296;
    };
  }

  api.rng = function (seed) {
    return mulberry32(seed);
  };

  function drawPanel(ctx, x, y, w, h, faceColors, rng) {
    ctx.fillStyle = faceColors[rng() * faceColors.length | 0];
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  }

  api.drawNorthWall = function (ctx, x, y, w, h, opts = {}) {
    const seed = opts.seed || 0;
    const rng = api.rng(seed);
    const lightsCount = opts.lights === 0 ? 0 : (opts.lights > 0 ? opts.lights : Math.max(1, Math.floor(w / 30)));

    ctx.fillStyle = '#23252c';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#15161b';
    ctx.fillRect(x, y, w, 3);

    ctx.fillStyle = '#4a4d57';
    ctx.fillRect(x, y + 3, w, 1);

    for (let k = 1; x + k * 24 < x + w; k++) {
      ctx.fillStyle = '#121318';
      ctx.fillRect(x + k * 24, y + 3, 1, h - 6);
    }

    const faceColors = ['#2a2c34', '#262830', '#2e3039'];
    
    // Track total lights drawn across all columns
    let lightsDrawn = 0;
    
    for (let i = 0; x + i * 24 < x + w; i++) {
      const colWidth = i === (w / 24 | 0) ? w % 24 || 24 : 24;
      if (colWidth <= 0) continue;

      const panelX = x + i * 24;
      const panelW = colWidth;

      drawPanel(ctx, panelX, y + 6, panelW, h - 9, faceColors, rng);

      // Draw lights for this column until we reach the total lights count
      for (let l = 0; l < lightsCount && lightsDrawn < lightsCount; l++) {
        const px = x + 2 + rng() * (w - 4);
        const py = y + 6 + rng() * (h - 18);
        ctx.fillStyle = api.LIGHTS[rng() * api.LIGHTS.length | 0];
        ctx.fillRect(px, py, 2, 2);
        lightsDrawn++;
      }
    }

    ctx.fillStyle = '#3a3d46';
    ctx.fillRect(x, y + h - 5, w, 2);

    ctx.fillStyle = '#0c0d10';
    ctx.fillRect(x, y + h - 3, w, 3);
  };

  api.drawSideWall = function (ctx, x, y, w, h, side) {
      const isVertical = side === 'w' || side === 'e';
      const thickness = isVertical ? w : h;
      const length = isVertical ? h : w;
      const darkWidth = Math.max(1, Math.floor(thickness * 0.25));
      const litWidth = Math.max(1, Math.floor(thickness * 0.25));
      const crownStart = darkWidth;
      const crownEnd = thickness - litWidth;

      if (side === 'w') {
        for (let i = 0; i < darkWidth; i++) {
          ctx.fillStyle = '#0d0e12';
          ctx.fillRect(x + w - i - 1, y, 1, h);
        }
        for (let i = crownStart; i < crownEnd; i++) {
          ctx.fillStyle = '#3b3e48';
          ctx.fillRect(x + i, y, 1, h);
        }
        for (let i = 0; i < litWidth; i++) {
          ctx.fillStyle = '#6b6f7c';
          ctx.fillRect(x + i, y, 1, h);
        }
      } else if (side === 'e') {
        for (let i = 0; i < darkWidth; i++) {
          ctx.fillStyle = '#0d0e12';
          ctx.fillRect(x + i, y, 1, h);
        }
        for (let i = crownStart; i < crownEnd; i++) {
          ctx.fillStyle = '#3b3e48';
          ctx.fillRect(x + i, y, 1, h);
        }
        for (let i = 0; i < litWidth; i++) {
          ctx.fillStyle = '#6b6f7c';
          ctx.fillRect(x + w - i - 1, y, 1, h);
        }
      } else {
        // SE side - BUG FIX: seam at top (room side), crown in middle, lit edge at bottom
        // Top (room side) - dark seam
        for (let i = 0; i < darkWidth; i++) {
          ctx.fillStyle = '#0d0e12';
          ctx.fillRect(x, y + i, w, 1);
        }
        // Middle - crown
        for (let i = crownStart; i < crownEnd; i++) {
          ctx.fillStyle = '#3b3e48';
          ctx.fillRect(x, y + i, w, 1);
        }
        // Bottom (outside) - lit edge
        for (let i = 0; i < litWidth; i++) {
          ctx.fillStyle = '#6b6f7c';
          ctx.fillRect(x, y + h - i - 1, w, 1);
        }
      }
    };

  api.drawLightPool = function (ctx, cx, cy, r, color, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const rgb = hexToRgb(color);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')');
    gradient.addColorStop(1, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.StationWalls = api;
  }
})(typeof self !== "undefined" ? self : this);
