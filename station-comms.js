(function (root) {
  const api = {};

  api.PALETTE = {
    outline: '#0a0d14',
    dark: '#1a202b',
    mid: '#2a3342',
    light: '#3e4a5d',
    shine: '#61718a',
    accent: '#3fd9ff',
    beam: '#ffb347',
    reply: '#3dffa2'
  };

  api.NAMES = ['dish'];

  function px(ctx, x, y, w, h, rx, ry, rw, rh, color) {
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

  api.dish = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const t = Math.round(opts.t || 0);
    const color = opts.color || api.PALETTE.accent;
    const beaming = !!opts.beaming;
    const receiving = !!opts.receiving;
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const mid = api.PALETTE.mid;
    const light = api.PALETTE.light;
    const shine = api.PALETTE.shine;
    const beam = api.PALETTE.beam;
    const reply = api.PALETTE.reply;

    const cx = Math.round(x + w / 2);
    const baseTop = y + Math.round(h * 0.7);
    const baseH = Math.max(4, h - (baseTop - y));

    // Outline (1 px inside box)
    px(ctx, x, y, w, h, x, y, w, 1, outline);
    px(ctx, x, y, w, h, x, y + h - 1, w, 1, outline);
    px(ctx, x, y, w, h, x, y, 1, h, outline);
    px(ctx, x, y, w, h, x + w - 1, y, 1, h, outline);

    // Heavy base / pedestal (~30% of h)
    px(ctx, x, y, w, h, x + 2, baseTop, w - 4, Math.max(2, baseH - 1), dark);
    px(ctx, x, y, w, h, x + 2, baseTop, w - 4, 2, light);

    // Rivets on base
    const rivetCount = Math.max(2, Math.round(w / 8));
    for (let i = 0; i < rivetCount; i++) {
      const rx = x + 4 + i * Math.round((w - 8) / Math.max(1, rivetCount - 1 || 1));
      px(ctx, x, y, w, h, rx, baseTop + 4, 2, 2, mid);
    }

    // Mast
    const mastTop = y + Math.round(h * 0.35);
    const mastW = 2;
    px(ctx, x, y, w, h, cx - Math.round(mastW / 2), baseTop - Math.round(h * 0.15), mastW, Math.round(h * 0.15) + 1, mid);

    // Dish bowl
    const dishTop = mastTop - Math.round(h * 0.22);
    const dishBottom = baseTop - Math.round(h * 0.08);
    const dishCy = Math.round((dishTop + dishBottom) / 2);
    const dishRy = Math.max(4, Math.round((dishBottom - dishTop) / 2));
    const dishRx = Math.max(8, Math.round(w * 0.38));
    const steps = Math.max(6, Math.round((dishBottom - dishTop) / 3));

    const blink = Math.floor(((Math.abs(t % 120) + 120) % 120) / 60);
    const rimColor = (receiving && Math.floor(t / 4) % 2 === 0) ? reply : light;

    for (let i = 0; i <= steps; i++) {
      const ry = dishTop + Math.round(i * (dishBottom - dishTop) / Math.max(1, steps));
      const norm = Math.abs(ry - dishCy) / Math.max(1, dishRy);
      const rw = Math.max(4, Math.round(dishRx * Math.sqrt(Math.max(0, 1 - norm * norm))));
      const rxPos = cx - Math.round(rw / 2);

      // Light rim row
      px(ctx, x, y, w, h, rxPos, ry, rw, 1, rimColor);

      // Mid/dark inner row (slightly narrower)
      const rwMid = Math.max(4, Math.round(rw - 4));
      if (rwMid > 0) {
        const innerColor = (ry > dishCy) ? dark : mid;
        px(ctx, x, y, w, h, rxPos + Math.round((rw - rwMid) / 2), ry, rwMid, 1, innerColor);
      }
    }

    // Feed horn struts
    const emitterY = dishCy - Math.round(dishRy * 0.25);
    px(ctx, x, y, w, h, cx - 2, dishCy, 1, emitterY - dishCy, mid);
    px(ctx, x, y, w, h, cx + 1, dishCy, 1, emitterY - dishCy, mid);

    // Small emitter tip
    const emitterColor = beaming ? beam : dark;
    px(ctx, x, y, w, h, cx - 1, emitterY, 2, 2, emitterColor);

    // Glow rings when beaming
    if (beaming) {
      const ph = ((t % 20) + 20) % 20;
      const ringCount = (ph % 3) + 1;
      for (let r = 0; r < ringCount; r++) {
        const sz = 4 + r * 2;
        const half = sz / 2;
        const rX = cx - Math.round(half);
        const rY = emitterY - Math.round(half);
        // Top bar
        px(ctx, x, y, w, h, rX, rY, sz, 1, beam);
        // Bottom bar
        px(ctx, x, y, w, h, rX, rY + sz - 1, sz, 1, beam);
        // Left bar
        px(ctx, x, y, w, h, rX, rY + 1, 1, sz - 2, beam);
        // Right bar
        px(ctx, x, y, w, h, rX + sz - 1, rY + 1, 1, sz - 2, beam);
      }
    }

    // Status light (blinks with tick)
    const lightState = Math.floor(((t % 120) + 120) % 120 / 60);
    const statusColor = (lightState === 0) ? color : dark;
    px(ctx, x, y, w, h, x + 4, baseTop + 4, 3, 3, statusColor);
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
    root.StationComms = api;
  }
})(typeof self !== 'undefined' ? self : this);
