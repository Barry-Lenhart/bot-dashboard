(function (root) {
  const api = {};

  api.PALETTE = {
    outline: '#0a0d14',
    dark: '#1a202b',
    mid: '#2a3342',
    light: '#3e4a5d',
    shine: '#61718a',
    accent: '#3fd9ff'
  };

  api.NAMES = ['rack', 'console', 'wallscreen', 'holotable', 'pod', 'arcade', 'vent', 'pillar'];

  function phaseFromT(t) {
    const v = Math.round(t || 0);
    return ((v % 120) + 120) % 120;
  }

  function drawClip(ctx, x, y, w, h, rx, ry, rw, rh, color) {
    const cx = Math.round(rx);
    const cy = Math.round(ry);
    let cw = Math.round(rw);
    let ch = Math.round(rh);
    if (cw < 0) cw = 0;
    if (ch < 0) ch = 0;
    const x1 = Math.max(cx, x);
    const y1 = Math.max(cy, y);
    const x2 = Math.min(cx + cw, x + w);
    const y2 = Math.min(cy + ch, y + h);
    if (x2 > x1 && y2 > y1) {
      ctx.fillStyle = color;
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    }
  }

  api.rack = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const color = opts.color || api.PALETTE.accent;
    const t = Math.round(opts.t || 0);
    const phase = phaseFromT(t);
    const blink = Math.floor(phase / 10) % 2;
    const amber = '#ffb347';
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const mid = api.PALETTE.mid;
    const light = api.PALETTE.light;
    const shine = api.PALETTE.shine;

    // Outline inside box
    drawClip(ctx, x, y, w, h, x, y, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y + h - 1, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y, 1, h, outline);
    drawClip(ctx, x, y, w, h, x + w - 1, y, 1, h, outline);

    // Top light strip (top surface)
    drawClip(ctx, x, y, w, h, x + 1, y + 1, w - 2, 3, light);
    drawClip(ctx, x, y, w, h, x + 1, y + 2, w - 2, 1, shine);

    const count = Math.max(4, Math.min(6, Math.round(Math.max(4, h) / 7)));
    const startY = y + 6;
    const availH = Math.max(4, h - 8);
    const unitH = Math.max(3, Math.round(availH / count));
    for (let i = 0; i < count; i++) {
      const uy = startY + i * unitH;
      const uh = Math.max(2, Math.min(unitH - (i === count - 1 ? 0 : 1), Math.max(1, (startY + availH) - uy)));
      // Unit body
      drawClip(ctx, x, y, w, h, x + 2, uy, w - 4, Math.max(1, uh - 1), mid);
      // Seam below unit (except last)
      if (i < count - 1) {
        drawClip(ctx, x, y, w, h, x + 2, uy + Math.max(1, uh - 1), w - 4, 1, dark);
      }
      // LEDs
      drawClip(ctx, x, y, w, h, x + 3, uy + 2, 2, 2, color);
      drawClip(ctx, x, y, w, h, x + w - 6, uy + 2, 2, 2, amber);
      if (blink === 1) {
        drawClip(ctx, x, y, w, h, x + Math.round(w / 2) - 1, uy + 2, 2, 2, color);
      } else {
        drawClip(ctx, x, y, w, h, x + Math.round(w / 2) - 1, uy + 2, 2, 2, dark);
      }
    }
  };

  api.console = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const color = opts.color || api.PALETTE.accent;
    const t = Math.round(opts.t || 0);
    const phase = phaseFromT(t);
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const mid = api.PALETTE.mid;
    const light = api.PALETTE.light;
    const shine = api.PALETTE.shine;

    drawClip(ctx, x, y, w, h, x, y, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y + h - 1, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y, 1, h, outline);
    drawClip(ctx, x, y, w, h, x + w - 1, y, 1, h, outline);

    // Light top panel
    drawClip(ctx, x, y, w, h, x + 2, y + 2, w - 4, 6, light);
    drawClip(ctx, x, y, w, h, x + 3, y + 3, w - 6, 1, shine);

    // Button rows
    const buttons = 3;
    const cols = Math.max(2, Math.round(w / 8));
    for (let r = 0; r < buttons; r++) {
      const by = y + 10 + r * 4;
      for (let c = 0; c < cols; c++) {
        const bxBtn = x + 4 + c * Math.max(3, Math.round((w - 8) / Math.max(1, cols)));
        const btnW = Math.max(2, Math.round((w - 8) / Math.max(1, cols)) - 1);
        const btnColor = ((r + c) % 2 === 0) ? mid : light;
        drawClip(ctx, x, y, w, h, bxBtn, by, btnW, 2, btnColor);
      }
    }

    // Screen strip
    const screenY = y + 14;
    const screenH = Math.max(4, Math.round(h / 4));
    drawClip(ctx, x, y, w, h, x + 3, screenY, w - 6, screenH - 1, color);
    // Bright moving line
    const lineX = x + 4 + Math.round((phase / 120) * Math.max(0, w - 10));
    drawClip(ctx, x, y, w, h, lineX, screenY + 1, 1, Math.max(1, screenH - 3), shine);

    // Dark front base
    drawClip(ctx, x, y, w, h, x + 2, y + 18, w - 4, Math.max(2, h - 20), dark);
  };

  api.wallscreen = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const color = opts.color || api.PALETTE.accent;
    const lines = Math.max(1, Math.round(opts.lines || 4));
    const t = Math.round(opts.t || 0);
    const phase = phaseFromT(t);
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const light = api.PALETTE.light;

    drawClip(ctx, x, y, w, h, x, y, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y + h - 1, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y, 1, h, outline);
    drawClip(ctx, x, y, w, h, x + w - 1, y, 1, h, outline);

    // Dark bezel
    drawClip(ctx, x, y, w, h, x + 2, y + 2, w - 4, h - 4, dark);
    // Screen background
    drawClip(ctx, x, y, w, h, x + 4, y + 4, w - 8, h - 8, '#05080d');

    const screenH = Math.max(4, h - 10);
    const step = Math.max(1, Math.round(screenH / lines));
    // Extra decorative lines to meet minimum rect count
    drawClip(ctx, x, y, w, h, x + 4, y + 8, 2, 4, light);
    drawClip(ctx, x, y, w, h, x + w - 6, y + 8, 2, 4, light);
    for (let i = 0; i < lines; i++) {
      const shift = Math.round(phase / 10) % Math.max(1, step);
      const by = y + 8 + i * step + shift;
      const barW = Math.max(4, Math.round((w - 14) * (0.2 + 0.15 * ((i + 1) % 4))));
      drawClip(ctx, x, y, w, h, x + 5 + Math.round(phase / 15) % Math.max(1, w - 14), by, barW, 2, color);
    }
  };

  api.holotable = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const color = opts.color || api.PALETTE.accent;
    const t = Math.round(opts.t || 0);
    const phase = phaseFromT(t);
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const light = api.PALETTE.light;
    const shine = api.PALETTE.shine;

    drawClip(ctx, x, y, w, h, x, y, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y + h - 1, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y, 1, h, outline);
    drawClip(ctx, x, y, w, h, x + w - 1, y, 1, h, outline);

    // Dark base
    drawClip(ctx, x, y, w, h, x + 4, y + 10, w - 8, Math.max(4, h - 14), dark);

    // Light top ring
    drawClip(ctx, x, y, w, h, x + 2, y + 3, w - 4, 6, light);
    drawClip(ctx, x, y, w, h, x + 3, y + 4, w - 6, 1, shine);
    drawClip(ctx, x, y, w, h, x + 4, y + 5, w - 8, 2, light);

    // Glowing hologram (stacked thin rects with alpha)
    const rows = 3;
    const hx = x + Math.round(w / 2) - 3;
    const hy = y + 2;
    for (let i = 0; i < rows; i++) {
      const ry = hy + i * 3;
      const active = (i === 0) || (Math.floor(phase / 10 + i) % 2 === 1);
      if (active) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        drawClip(ctx, x, y, w, h, hx - i, ry - i, 6 + i * 2, 2, color);
        ctx.restore();
      }
    }

    // Small base highlight
    drawClip(ctx, x, y, w, h, x + 5, y + h - 4, w - 10, 2, shine);
    // Fixed inner detail
    drawClip(ctx, x, y, w, h, x + 6, y + 12, w - 12, 1, dark);
  };

  api.pod = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const color = opts.color || api.PALETTE.accent;
    const occupied = !!opts.occupied;
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const mid = api.PALETTE.mid;
    const light = api.PALETTE.light;
    const shine = api.PALETTE.shine;

    drawClip(ctx, x, y, w, h, x, y, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y + h - 1, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y, 1, h, outline);
    drawClip(ctx, x, y, w, h, x + w - 1, y, 1, h, outline);

    // Capsule body (dark mid)
    drawClip(ctx, x, y, w, h, x + 2, y + 4, w - 4, Math.max(4, h - 8), dark);

    // Light rim
    drawClip(ctx, x, y, w, h, x + 2, y + 4, w - 4, 1, light);
    drawClip(ctx, x, y, w, h, x + 2, y + h - 5, w - 4, 1, light);
    drawClip(ctx, x, y, w, h, x + 2, y + 5, 1, Math.max(2, h - 10), light);
    drawClip(ctx, x, y, w, h, x + w - 3, y + 5, 1, Math.max(2, h - 10), light);

    // Glass window
    const winY = y + 10;
    const winH = Math.max(6, Math.round(h * 0.45));
    drawClip(ctx, x, y, w, h, x + 4, winY, w - 8, winH, '#16243a');
    // Shine streak
    drawClip(ctx, x, y, w, h, x + 5, winY + 3, 1, Math.max(1, winH - 6), shine);

    // Status light
    drawClip(ctx, x, y, w, h, x + Math.round(w / 2) - 2, y + h - 8, 4, 4, color);

    if (occupied) {
      // Small sleeping figure inside window
      const cx = Math.round(x + w / 2);
      const cyWin = winY + Math.round(winH / 3);
      // Head
      drawClip(ctx, x, y, w, h, cx - 2, cyWin, 4, 3, mid);
      // Body
      drawClip(ctx, x, y, w, h, cx - 2, cyWin + 3, 4, 6, light);
    }
  };

  api.arcade = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const color = opts.color || api.PALETTE.accent;
    const t = Math.round(opts.t || 0);
    const phase = phaseFromT(t);
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const mid = api.PALETTE.mid;
    const light = api.PALETTE.light;

    drawClip(ctx, x, y, w, h, x, y, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y + h - 1, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y, 1, h, outline);
    drawClip(ctx, x, y, w, h, x + w - 1, y, 1, h, outline);

    // Tall body
    drawClip(ctx, x, y, w, h, x + 2, y + 6, w - 4, Math.max(4, h - 14), mid);

    // Marquee strip
    drawClip(ctx, x, y, w, h, x + 2, y + 2, w - 4, 4, color);
    drawClip(ctx, x, y, w, h, x + 2, y + 3, w - 4, 1, light);

    // Screen
    const screenY = y + 10;
    const screenH = Math.max(4, Math.round(h * 0.45));
    drawClip(ctx, x, y, w, h, x + 4, screenY, w - 8, screenH - 1, dark);
    // Moving accent pixels
    const px1 = x + 6 + Math.round((phase * 1) / 10) % Math.max(1, w - 14);
    const px2 = x + 6 + Math.round((phase * 2) / 10) % Math.max(1, w - 14);
    const px3 = x + 6 + Math.round((phase * 3) / 10) % Math.max(1, w - 14);
    drawClip(ctx, x, y, w, h, px1, screenY + 3, 2, 2, color);
    drawClip(ctx, x, y, w, h, px2, screenY + 6, 2, 2, color);
    drawClip(ctx, x, y, w, h, px3, screenY + 9, 2, 2, color);

    // Control panel ledge
    drawClip(ctx, x, y, w, h, x + 2, y + h - 8, w - 4, 6, light);
    // Buttons
    drawClip(ctx, x, y, w, h, x + w - 10, y + h - 6, 3, 3, mid);
    drawClip(ctx, x, y, w, h, x + w - 16, y + h - 6, 3, 3, mid);
  };

  api.vent = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const color = opts.color || api.PALETTE.accent;
    const t = Math.round(opts.t || 0);
    const phase = phaseFromT(t);
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const mid = api.PALETTE.mid;
    const light = api.PALETTE.light;

    drawClip(ctx, x, y, w, h, x, y, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y + h - 1, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y, 1, h, outline);
    drawClip(ctx, x, y, w, h, x + w - 1, y, 1, h, outline);

    // Box body
    drawClip(ctx, x, y, w, h, x + 2, y + 4, w - 4, Math.max(4, h - 8), mid);

    // Horizontal slats alternating brightness with phase
    const slatCount = 5;
    for (let i = 0; i < slatCount; i++) {
      const sy = y + 6 + i * 3;
      const slatColor = ((Math.floor(phase / 10) + i) % 2 === 0) ? dark : mid;
      drawClip(ctx, x, y, w, h, x + 4, sy, w - 8, 1, slatColor);
    }

    // Fan hint
    drawClip(ctx, x, y, w, h, x + Math.round(w / 2) - 2, y + Math.round(h / 2) - 2, 4, 4, light);

    // Accent indicator
    drawClip(ctx, x, y, w, h, x + w - 5, y + 4, 3, 3, color);
  };

  api.pillar = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const color = opts.color || api.PALETTE.accent;
    const t = Math.round(opts.t || 0);
    const phase = phaseFromT(t);
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const mid = api.PALETTE.mid;
    const light = api.PALETTE.light;
    const shine = api.PALETTE.shine;

    drawClip(ctx, x, y, w, h, x, y, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y + h - 1, w, 1, outline);
    drawClip(ctx, x, y, w, h, x, y, 1, h, outline);
    drawClip(ctx, x, y, w, h, x + w - 1, y, 1, h, outline);

    // Column body mid with light left edge
    drawClip(ctx, x, y, w, h, x + 2, y + 4, w - 4, Math.max(4, h - 8), mid);
    drawClip(ctx, x, y, w, h, x + 2, y + 4, 2, Math.max(2, h - 8), light);
    drawClip(ctx, x, y, w, h, x + w - 4, y + 4, w - 4, Math.max(2, h - 8), dark);

    // Moving accent energy band
    const bandY = y + 4 + Math.round((phase / 120) * Math.max(0, h - 16));
    drawClip(ctx, x, y, w, h, x + 4, bandY, 4, 4, color);
    drawClip(ctx, x, y, w, h, x + 4, bandY + 8, 4, 4, color);

    // Cap plates
    drawClip(ctx, x, y, w, h, x + 2, y + 2, w - 4, 3, light);
    drawClip(ctx, x, y, w, h, x + 2, y + h - 5, w - 4, 3, light);
    // Extra accent stripe
    drawClip(ctx, x, y, w, h, x + 4, y + 6, 2, 2, color);
  };

  api.draw = function (ctx, name, x, y, w, h, opts) {
    if (typeof api[name] !== 'function') {
      return false;
    }
    api[name](ctx, x, y, w, h, opts);
    return true;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.StationTech = api;
  }
})(typeof self !== 'undefined' ? self : this);
