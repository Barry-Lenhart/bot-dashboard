(function (root) {
  const api = {};

  api.PALETTE = {
    outline: '#0a0d14',
    dark: '#1a202b',
    mid: '#2a3342',
    light: '#3e4a5d',
    shine: '#61718a',
    accent: '#3fd9ff',
    paper: '#eef3f8',
    flame: '#ffb347',
    hot: '#fff3c4'
  };

  api.NAMES = ['press', 'conveyor', 'bin', 'tube', 'card', 'engine'];

  function px(ctx, c, X0, Y0, W0, H0, rx, ry, rw, rh) {
    let a = Math.max(X0, Math.round(rx));
    let b = Math.max(Y0, Math.round(ry));
    const e = Math.min(X0 + W0, Math.round(rx + rw));
    const f = Math.min(Y0 + H0, Math.round(ry + rh));
    if (e <= a || f <= b) return;
    ctx.fillStyle = c;
    ctx.fillRect(a, b, e - a, f - b);
  }

  api.press = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const color = opts.color || api.PALETTE.accent;
    const active = !!opts.active;
    const t = Math.round(opts.t || 0);
    const ph = ((t % 40) + 40) % 40;
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const mid = api.PALETTE.mid;
    const light = api.PALETTE.light;
    const paper = api.PALETTE.paper;

    // Outline
    px(ctx, outline, x, y, w, h, x, y, w, 1);
    px(ctx, outline, x, y, w, h, x, y + h - 1, w, 1);
    px(ctx, outline, x, y, w, h, x, y, 1, h);
    px(ctx, outline, x, y, w, h, x + w - 1, y, 1, h);

    // Heavy base
    const baseY = Math.round(y + h * 0.65);
    const baseH = Math.max(2, Math.round(h * 0.35));
    px(ctx, dark, x, y, w, h, x + 1, baseY, w - 2, baseH);

    // Columns
    const colW = Math.max(3, Math.round(w * 0.12));
    const colH = Math.max(4, Math.round(h * 0.55));
    const leftColX = x + 2;
    const rightColX = x + w - colW - 2;
    px(ctx, dark, x, y, w, h, leftColX, y + 4, colW, colH);
    px(ctx, light, x, y, w, h, leftColX, y + 4, 2, colH);
    px(ctx, dark, x, y, w, h, rightColX, y + 4, colW, colH);
    px(ctx, light, x, y, w, h, rightColX, y + 4, 2, colH);

    // Crossbeam
    const beamY = y + 4;
    const beamH = Math.max(2, Math.round(h * 0.08));
    px(ctx, light, x, y, w, h, leftColX + 1, beamY, (rightColX - leftColX + 1) + colW - 1, beamH);
    px(ctx, mid, x, y, w, h, leftColX + 2, beamY + 1, (rightColX - leftColX) + colW - 2, Math.max(1, beamH - 2));

    // Ram / stamp plate
    const ramW = Math.max(5, Math.round(w * 0.35));
    const ramX = Math.round(x + (w - ramW) / 2);
    const ramH = Math.max(4, Math.round(h * 0.18));
    let ramOffset = 0;
    if (active) {
      const depth = Math.max(3, Math.round(h * 0.25));
      ramOffset = Math.round(depth * (1 - Math.abs(ph - 20) / 20));
    }
    const ramY = y + 6 + ramOffset;
    px(ctx, mid, x, y, w, h, ramX, ramY, ramW, ramH);
    px(ctx, light, x, y, w, h, ramX, ramY + ramH - 1, ramW, 1);
    px(ctx, dark, x, y, w, h, ramX + 2, ramY + 2, Math.max(1, ramW - 4), Math.max(1, ramH - 4));

    // Paper sheet under ram when active
    if (active) {
      const paperW = Math.max(5, Math.round(w * 0.45));
      const paperX = Math.round(x + (w - paperW) / 2);
      const paperY = Math.round(y + h * 0.65) - 4;
      const paperH = Math.max(3, Math.round(h * 0.18));
      px(ctx, paper, x, y, w, h, paperX, paperY, paperW, paperH);
      const headerH = Math.max(1, Math.round(paperH * 0.25));
      px(ctx, color, x, y, w, h, paperX + 1, paperY + 1, paperW - 2, headerH);
      // Grey text lines on page
      px(ctx, '#9aa7b8', x, y, w, h, paperX + 2, paperY + headerH + 2, paperW - 4, 1);
      px(ctx, '#9aa7b8', x, y, w, h, paperX + 2, paperY + headerH + 4, Math.max(2, Math.round(paperW * 0.35)), 1);
    }

    // Indicator lights
    const lightSize = Math.max(2, Math.round(Math.min(w, h) * 0.06));
    px(ctx, color, x, y, w, h, x + 4, y + h - 7, lightSize, lightSize);
    px(ctx, color, x, y, w, h, x + w - lightSize - 4, y + h - 7, lightSize, lightSize);
    px(ctx, color, x, y, w, h, Math.round(x + w / 2) - Math.round(lightSize / 2), y + 8, lightSize, lightSize);

    // Mid front panel between columns
    const panelY = Math.round(y + h * 0.55);
    const panelH = Math.max(3, Math.round(h * 0.18));
    px(ctx, mid, x, y, w, h, leftColX + colW + 2, panelY, Math.max(2, rightColX - (leftColX + colW + 2)), panelH);
    px(ctx, color, x, y, w, h, leftColX + colW + 3, panelY + 1, 2, panelH - 2);

    // Extra decorative lines
    px(ctx, light, x, y, w, h, x + 2, y + h - 3, w - 4, 1);
    px(ctx, dark, x, y, w, h, x + 3, panelY + panelH - 1, w - 6, 1);
  };

  api.conveyor = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const color = opts.color || api.PALETTE.accent;
    const moving = !!opts.moving;
    const t = Math.round(opts.t || 0);
    const ph = ((t % 16) + 16) % 16;
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const mid = api.PALETTE.mid;
    const light = api.PALETTE.light;

    // Outline
    px(ctx, outline, x, y, w, h, x, y, w, 1);
    px(ctx, outline, x, y, w, h, x, y, 1, 1, h);
    px(ctx, outline, x, y, w, h, x + w - 1, y, 1, h);
    px(ctx, outline, x, y, w, h, x, y + h - 1, w, 1);

    // Belt body (dark) middle
    const beltY = Math.round(y + h * 0.35);
    const beltH = Math.max(3, Math.round(h * 0.3));
    px(ctx, dark, x, y, w, h, x + 1, beltY, w - 2, beltH);

    // Stripes / rollers
    const stripeW = Math.max(2, Math.round(w * 0.06));
    const spacing = 8;
    let shift = 0;
    if (moving) shift = Math.floor(ph / 2);
    const count = Math.max(3, Math.ceil((w + shift + spacing) / spacing) + 2);
    for (let i = -2; i < count; i++) {
      const sx = Math.round(x + 2 + (i * spacing) - shift);
      px(ctx, light, x, y, w, h, sx, beltY + 1, stripeW, Math.max(1, beltH - 2));
    }

    // Top rail (light)
    px(ctx, light, x, y, w, h, x + 1, y + 2, w - 2, 3);
    // Dark front rail
    px(ctx, dark, x, y, w, h, x + 1, y + h - 5, w - 2, 3);

    // Small legs
    const legW = Math.max(2, Math.round(w * 0.08));
    const legH = Math.max(2, Math.round(h * 0.2));
    px(ctx, dark, x, y, w, h, x + 2, y + h - 5, legW, legH);
    px(ctx, dark, x, y, w, h, x + w - legW - 2, y + h - 5, legW, legH);
    px(ctx, dark, x, y, w, h, Math.round(x + w / 2) - Math.round(legW / 2), y + h - 5, legW, legH);

    // Accent side lights
    const ls = Math.max(2, Math.round(Math.min(w, h) * 0.08));
    px(ctx, color, x, y, w, h, x + 3, y + 8, ls, ls);
    px(ctx, color, x, y, w, h, x + w - ls - 3, y + 8, ls, ls);
    px(ctx, color, x, y, w, h, Math.round(x + w / 2) - Math.round(ls / 2), y + 8, ls, ls);

    // Extra decorative details
    px(ctx, mid, x, y, w, h, x + 1, y + 4, w - 2, 1);
    px(ctx, light, x, y, w, h, x + 3, y + 6, 2, Math.max(2, beltH - 4));
    px(ctx, light, x, y, w, h, x + w - 5, y + 6, 2, Math.max(2, beltH - 4));
  };

  api.bin = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const fill = Math.max(0, Math.min(1, typeof opts.fill === 'number' ? opts.fill : 0));
    const color = opts.color || api.PALETTE.accent;
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const mid = api.PALETTE.mid;
    const light = api.PALETTE.light;
    const paper = api.PALETTE.paper;

    // Outline
    px(ctx, outline, x, y, w, h, x, y, w, 1);
    px(ctx, outline, x, y, w, h, x, y + h - 1, w, 1);
    px(ctx, outline, x, y, w, h, x, y, 1, h);
    px(ctx, outline, x, y, w, h, x + w - 1, y, 1, h);

    // Light rim
    const rimThick = Math.max(2, Math.round(Math.min(w, h) * 0.08));
    px(ctx, light, x, y, w, h, x + 1, y + 1, w - 2, rimThick);
    px(ctx, light, x, y, w, h, x + 1, y + rimThick + 1, 2, Math.max(2, h - rimThick - 3));
    px(ctx, light, x, y, w, h, x + w - 3, y + rimThick + 1, 2, Math.max(2, h - rimThick - 3));

    // Dark interior
    const interiorY = y + rimThick + 2;
    const interiorH = Math.max(2, h - rimThick - 4);
    px(ctx, dark, x, y, w, h, x + 3, interiorY, w - 6, interiorH);

    // Mid front face
    const frontY = Math.round(y + h * 0.7);
    const frontH = Math.max(3, Math.round(h * 0.25));
    px(ctx, mid, x, y, w, h, x + 1, frontY, w - 2, frontH);
    // Accent label stripe
    px(ctx, color, x, y, w, h, x + 3, frontY + 1, 3, Math.max(1, frontH - 2));

    // Cards inside
    const maxCards = Math.max(4, Math.round(Math.min(w, h) / 8));
    const cardCount = Math.round(Math.max(0, maxCards) * fill);
    for (let i = 0; i < cardCount; i++) {
      const cardW = Math.max(3, Math.round(w * 0.35));
      const cardH = Math.max(2, Math.round(h * 0.12));
      const cardX = Math.round(x + (w - cardW) / 2) - i;
      const cardY = Math.round(y + rimThick + 4 + i * (cardH + 1));
      px(ctx, paper, x, y, w, h, cardX, cardY, cardW, cardH);
      const headerH = Math.max(1, Math.round(cardH * 0.25));
      px(ctx, color, x, y, w, h, cardX + 1, cardY + 1, cardW - 2, headerH);
      px(ctx, '#9aa7b8', x, y, w, h, cardX + 2, cardY + headerH + 2, Math.max(1, cardW - 4), 1);
    }

    // Extra decorative details
    px(ctx, mid, x, y, w, h, x + 3, interiorY + interiorH - 1, w - 6, 1);
    px(ctx, dark, x, y, w, h, x + 2, interiorY + 3, 2, 2);
    px(ctx, dark, x, y, w, h, x + w - 4, interiorY + 3, 2, 2);
    px(ctx, light, x, y, w, h, Math.round(x + w / 2) - 1, y + 2, 2, 2);
  };

  api.tube = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const launching = !!opts.launching;
    const t = Math.round(opts.t || 0);
    const ph = ((t % 30) + 30) % 30;
    const color = opts.color || api.PALETTE.accent;
    const outline = api.PALETTE.outline;
    const dark = api.PALETTE.dark;
    const mid = api.PALETTE.mid;
    const light = api.PALETTE.light;

    // Outline
    px(ctx, outline, x, y, w, h, x, y, w, 1);
    px(ctx, outline, x, y, w, h, x, y + h - 1, w, 1);
    px(ctx, outline, x, y, w, h, x, y, 1, h);
    px(ctx, outline, x, y, w, h, x + w - 1, y, 1, h);

    // Heavy base at bottom
    const baseH = Math.max(4, Math.round(h * 0.2));
    const baseY = y + h - baseH;
    px(ctx, dark, x, y, w, h, x + 2, baseY + 1, w - 4, baseH - 2);
    // Base light rim
    px(ctx, light, x, y, w, h, x + 2, baseY, w - 4, 2);

    // Status light on base
    const statusSize = Math.max(2, Math.round(Math.min(w, h) * 0.08));
    const statusX = Math.round(x + w / 2) - Math.round(statusSize / 2);
    const statusY = baseY + Math.round(baseH / 2) - Math.round(statusSize / 2);
    if (launching && Math.floor(ph / 5) % 2 === 0) {
      px(ctx, color, x, y, w, h, statusX, statusY, statusSize, statusSize);
    } else if (!launching) {
      px(ctx, color, x, y, w, h, statusX, statusY, statusSize, statusSize);
    } else {
      px(ctx, dark, x, y, w, h, statusX, statusY, statusSize, statusSize);
    }

    // Cap at top
    const capH = Math.max(3, Math.round(h * 0.1));
    const capY = y + 2;
    px(ctx, light, x, y, w, h, x + 3, capY, w - 6, capH);
    px(ctx, mid, x, y, w, h, x + 4, capY + 1, w - 8, Math.max(1, capH - 2));

    // Glass tube
    const tubeTop = capY + capH + 1;
    const tubeBottom = baseY - 1;
    const tubeCenterX = Math.round(x + w / 2);
    const tubeW = Math.max(4, Math.round(w * 0.4));
    const tubeX = tubeCenterX - Math.round(tubeW / 2);
    const tubeH = Math.max(2, tubeBottom - tubeTop);
    px(ctx, '#16243a', x, y, w, h, tubeX, tubeTop, tubeW, tubeH);
    // Shine streak inside tube
    px(ctx, light, x, y, w, h, tubeX + 1, tubeTop + 2, 1, Math.max(1, tubeH - 4));

    // Metal rings
    const ringH = Math.max(2, Math.round(h * 0.06));
    px(ctx, light, x, y, w, h, tubeX - 1, capY + capH, tubeW + 2, ringH);
    px(ctx, mid, x, y, w, h, tubeX - 1, tubeTop + Math.round(tubeH * 0.35), tubeW + 2, ringH);
    px(ctx, light, x, y, w, h, tubeX - 1, tubeTop + Math.round(tubeH * 0.7), tubeW + 2, ringH);

    // Glow rings inside tube when launching
    if (launching) {
      const glowCount = 3;
      for (let i = 0; i < glowCount; i++) {
        const gy = tubeTop + 2 + ((ph * 3 + i * 10) % Math.max(1, tubeH - 2));
        px(ctx, color, x, y, w, h, tubeX + 2, gy, Math.max(1, tubeW - 4), 2);
      }
    }

    // Extra decorative details
    px(ctx, light, x, y, w, h, tubeX - 1, tubeBottom - ringH, tubeW + 2, ringH);
    px(ctx, mid, x, y, w, h, tubeX, tubeTop + 1, tubeW, 1);
    px(ctx, dark, x, y, w, h, tubeX + tubeW - 2, tubeTop + 2, 1, Math.max(1, tubeH - 4));
    px(ctx, light, x, y, w, h, tubeX + 1, tubeTop + tubeH - 2, tubeW - 2, 1);
  };

  api.card = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    const color = opts.color || api.PALETTE.accent;
    const outline = api.PALETTE.outline;
    const paper = api.PALETTE.paper;
    const light = api.PALETTE.light;

    // Outline border
    px(ctx, outline, x, y, w, h, x, y, w, 1);
    px(ctx, outline, x, y, w, h, x, y + h - 1, w, 1);
    px(ctx, outline, x, y, w, h, x, y, 1, h);
    px(ctx, outline, x, y, w, h, x + w - 1, y, 1, h);

    // Paper page
    const innerX = x + 1;
    const innerY = y + 1;
    const innerW = Math.max(1, w - 2);
    const innerH = Math.max(1, h - 2);
    px(ctx, paper, x, y, w, h, innerX, innerY, innerW, innerH);

    // Header bar
    const headerH = Math.max(1, Math.round(h * 0.25));
    px(ctx, color, x, y, w, h, innerX + 1, innerY + 1, innerW - 2, headerH);

    // Grey text lines
    const lineY = innerY + headerH + 2;
    const lineH = Math.max(1, Math.round(h * 0.08));
    px(ctx, '#9aa7b8', x, y, w, h, innerX + 1, lineY, innerW - 2, lineH);
    if (h > 6) {
      px(ctx, '#9aa7b8', x, y, w, h, innerX + 1, lineY + lineH + 1, Math.max(2, Math.round(innerW * 0.6)), lineH);
    }
    if (h > 8) {
      px(ctx, '#9aa7b8', x, y, w, h, innerX + 1, lineY + (lineH + 1) * 2, Math.max(2, Math.round(innerW * 0.45)), lineH);
    }

    // Small image block
    if (w >= 6 && h >= 6) {
      const imgW = Math.max(2, Math.round(w * 0.35));
      const imgH = Math.max(2, Math.round(h * 0.2));
      const imgY = innerY + headerH + lineH + 3;
      px(ctx, light, x, y, w, h, x + w - imgW - 2, imgY, imgW, imgH);
    }

    // Extra decorative details
    px(ctx, outline, x, y, w, h, innerX + 1, innerY + innerH - 1, innerW - 2, 1);
  };

  api.engine = function (ctx, x, y, w, h, opts) {
    // rocket engine seen from behind: a bell-shaped nozzle on top, a tapering flame below that flickers (period 12)
    opts = opts || {};
    const P = api.PALETTE, c = opts.color || P.accent, ph = ((Math.round(opts.t || 0) % 12) + 12) % 12;
    const R = (col, rx, ry, rw, rh) => px(ctx, col, x, y, w, h, rx, ry, rw, rh);
    const cx = x + w / 2, nh = Math.max(3, Math.floor(h * 0.28));
    for (let i = 0; i < nh; i++) {                       // nozzle bell, widening downward
      const rw = Math.max(4, Math.round(w * (0.5 + 0.5 * i / Math.max(1, nh - 1))));
      R(P.outline, cx - rw / 2, y + i, rw, 1);
      R(i < nh / 3 ? P.light : P.mid, cx - rw / 2 + 1, y + i, rw - 2, 1);
      R(P.shine, cx - rw / 2 + 1, y + i, 1, 1); R(P.dark, cx + rw / 2 - 2, y + i, 1, 1);
    }
    R(P.light, x + 1, y + nh - 2, w - 2, 1);              // lit rim
    R(P.dark, cx - w * 0.36, y + nh - 1, w * 0.72, 1);     // dark throat
    R(c, cx - w * 0.28, y + nh - 1, w * 0.56, 1);          // glow ring inside
    const fy = y + Math.ceil(h * 0.3), room = y + h - fy;
    const wave = Math.abs(6 - ph) / 6, L = Math.max(3, Math.round(room * (0.78 + 0.22 * wave)));
    const cone = (col, wid, len, step) => { for (let i = 0; i < len; i += step) {
      const rw = Math.max(1, Math.round(w * wid * Math.pow(1 - i / len, 0.75))); R(col, cx - rw / 2, fy + i, rw, step); } };
    ctx.globalAlpha = 0.45; cone(c, 0.8, L, 2); ctx.globalAlpha = 1;   // outer plasma glow
    cone(P.flame, 0.56, Math.round(L * 0.8), 2);                       // flame body
    cone(P.hot, 0.28, Math.round(L * 0.5), 2);                         // white-hot core
    ctx.globalAlpha = 1;
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
    root.StationMachines = api;
  }
})(typeof self !== 'undefined' ? self : this);
