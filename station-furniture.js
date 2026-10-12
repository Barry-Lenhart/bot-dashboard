(function (root) {
  const api = {};
  api.PALETTE = { outline: '#0a0d14', dark: '#1a202b', mid: '#2a3342', light: '#3e4a5d', shine: '#61718a', accent: '#3fd9ff' };
  api.NAMES = ['desk','chair','table','couch','plant','crate','locker','coffee','cart'];

  function px(ctx, box, color, rx, ry, rw, rh) {
    const x = box[0], y = box[1], w = box[2], h = box[3];
    const r = Math.round(rx);
    const rr = Math.round(ry);
    const rw2 = Math.round(rw);
    const rh2 = Math.round(rh);
    if (rw2 <= 0 || rh2 <= 0) return;
    const left = Math.max(x, r);
    const top = Math.max(y, rr);
    const right = Math.min(x + w, r + rw2);
    const bottom = Math.min(y + h, rr + rh2);
    if (left >= right || top >= bottom) return;
    ctx.fillStyle = color;
    ctx.fillRect(left, top, right - left, bottom - top);
  }

  function makeBox(x, y, w, h) { return [x, y, w, h]; }

  api.desk = function(ctx, x, y, w, h, opts = {}) {
    const box = makeBox(x, y, w, h);
    const c = opts.color || api.PALETTE.accent;
    const monitors = opts.monitors !== undefined ? Math.max(0, Math.min(3, opts.monitors)) : 2;
    ctx.save();
    // outline around whole desk
    px(ctx, box, api.PALETTE.outline, x - 1, y - 1, w + 2, h + 2);
    // desktop top surface (upper ~45%)
    const topH = Math.max(6, Math.round(h * 0.45));
    px(ctx, box, api.PALETTE.light, x, y, w, topH);
    // shine line on back edge of desktop
    px(ctx, box, api.PALETTE.shine, x, y, w, 1);
    // front face below desktop (dark)
    const faceY = y + topH;
    const faceH = h - topH;
    if (faceH > 0) {
      px(ctx, box, api.PALETTE.dark, x, faceY, w, faceH);
    }
    // drawer panel (mid) centered horizontally in front face
    const drawerW = Math.max(8, Math.round(w * 0.5));
    const drawerH = Math.max(4, Math.round(faceH * 0.35));
    const drawerX = x + Math.round((w - drawerW) / 2);
    const drawerY = faceY + Math.round(faceH * 0.15);
    px(ctx, box, api.PALETTE.mid, drawerX, drawerY, drawerW, drawerH);
    // two short legs
    const legW = Math.max(2, Math.round(w * 0.08));
    const legH = Math.max(4, Math.round(faceH * 0.35));
    const legY = faceY + faceH - legH;
    px(ctx, box, api.PALETTE.outline, x + Math.round(w * 0.15), legY, legW, legH);
    px(ctx, box, api.PALETTE.outline, x + Math.round(w * 0.75) - legW, legY, legW, legH);
    // monitors on back edge, spaced evenly
    if (monitors > 0 && w >= 14) {
      const monitorW = Math.max(4, Math.round(w / (monitors + 2)));
      const monitorH = Math.max(5, Math.round(topH * 0.7));
      const startX = x + Math.round(w / (monitors + 1) - monitorW / 2);
      for (let i = 1; i <= monitors; i++) {
        const mx = startX + Math.round(i * w / (monitors + 1) - monitorW / 2);
        // outline frame
        px(ctx, box, api.PALETTE.outline, mx, y, monitorW, monitorH);
        // screen rect in accent
        px(ctx, box, c, mx + 1, y + 1, monitorW - 2, monitorH - 2);
        // darker scanline
        px(ctx, box, '#0f1522', mx + 2, y + Math.round(monitorH * 0.4), monitorW - 4, 1);
        // small stand
        px(ctx, box, api.PALETTE.dark, mx + 1, y + monitorH - 2, monitorW - 2, 2);
        // light keyboard strip in front
        const kbY = y + monitorH + 1;
        if (kbY < y + h) {
          px(ctx, box, api.PALETTE.light, mx, kbY, monitorW, 2);
        }
      }
    }
    ctx.restore();
  };

  api.chair = function(ctx, x, y, w, h, opts = {}) {
    const box = makeBox(x, y, w, h);
    const dir = (opts.dir || 's');
    ctx.save();
    // outline border
    px(ctx, box, api.PALETTE.outline, x - 1, y - 1, w + 2, h + 2);
    if (dir === 's') {
      // seat seen from front with backrest behind at top
      const seatH = Math.max(6, Math.round(h * 0.55));
      px(ctx, box, api.PALETTE.mid, x + 2, y + Math.round(h * 0.45), w - 4, seatH);
      // light top edge of seat
      px(ctx, box, api.PALETTE.light, x + 2, y + Math.round(h * 0.45), w - 4, 2);
      // backrest behind at top (dark)
      const brH = Math.max(5, Math.round(h * 0.35));
      px(ctx, box, api.PALETTE.dark, x + 1, y + 2, w - 2, brH);
      // backrest light highlight
      px(ctx, box, api.PALETTE.shine, x + 2, y + 3, w - 4, 1);
      // base / wheels outline dots
      px(ctx, box, api.PALETTE.outline, x + 3, y + h - 6, 4, 4);
      px(ctx, box, api.PALETTE.outline, x + w - 7, y + h - 6, 4, 4);
      // extra decorative details for large chairs
      const seatY = y + Math.round(h * 0.45);
      px(ctx, box, api.PALETTE.dark, x + Math.round(w / 2) - 2, seatY + seatH - 5, 4, 4);
      px(ctx, box, api.PALETTE.light, x + 5, y + 8, 3, 3);
      // decorative arm stripes
      px(ctx, box, api.PALETTE.shine, x + w - 8, y + 12, 3, 2);
      px(ctx, box, api.PALETTE.dark, x + w - 4, y + 14, 2, 3);
      // decorative seat stripe
      px(ctx, box, api.PALETTE.accent || api.PALETTE.accent, x + Math.round(w / 2) - 2, seatY + 3, 4, 1);
    } else if (dir === 'n') {
      // backrest in front covering seat
      const brH = Math.max(8, Math.round(h * 0.6));
      px(ctx, box, api.PALETTE.dark, x + 2, y + 2, w - 4, brH);
      // seat behind at bottom (mid)
      const seatY = y + brH + 2;
      const seatH = h - brH - 2;
      if (seatH > 0) px(ctx, box, api.PALETTE.mid, x + 3, seatY, w - 6, seatH);
      // wheels
      px(ctx, box, api.PALETTE.outline, x + 3, y + h - 5, 4, 3);
      px(ctx, box, api.PALETTE.outline, x + w - 7, y + h - 5, 4, 3);
      // decorative stripe
      px(ctx, box, api.PALETTE.shine, x + w - 6, y + 6, 3, 1);
    } else if (dir === 'e') {
      // side profile, backrest on left
      const seatW = Math.max(8, Math.round(w * 0.6));
      px(ctx, box, api.PALETTE.mid, x + Math.round(w * 0.35), y + 4, seatW, h - 8);
      px(ctx, box, api.PALETTE.light, x + Math.round(w * 0.35), y + 4, seatW, 2);
      // backrest on left
      px(ctx, box, api.PALETTE.dark, x + 2, y + 3, Math.round(w * 0.35), h - 6);
      // wheels at bottom right
      px(ctx, box, api.PALETTE.outline, x + w - 7, y + h - 6, 5, 4);
      px(ctx, box, api.PALETTE.outline, x + w - 5, y + h - 3, 3, 2);
      // decorative stripe
      px(ctx, box, api.PALETTE.shine, x + 6, y + 6, 3, 1);
    } else if (dir === 'w') {
      // side profile, backrest on right
      const seatW = Math.max(8, Math.round(w * 0.6));
      px(ctx, box, api.PALETTE.mid, x + 2, y + 4, seatW, h - 8);
      px(ctx, box, api.PALETTE.light, x + 2, y + 4, seatW, 2);
      // backrest on right
      const brW = Math.max(6, Math.round(w * 0.35));
      px(ctx, box, api.PALETTE.dark, x + w - brW - 2, y + 3, brW, h - 6);
      // wheels at bottom left
      px(ctx, box, api.PALETTE.outline, x + 3, y + h - 6, 5, 4);
      px(ctx, box, api.PALETTE.outline, x + 5, y + h - 3, 3, 2);
      // decorative stripe
      px(ctx, box, api.PALETTE.shine, x + w - 8, y + 6, 3, 1);
    }
    ctx.restore();
  };

  api.table = function(ctx, x, y, w, h, opts = {}) {
    const box = makeBox(x, y, w, h);
    const c = opts.color || api.PALETTE.accent;
    ctx.save();
    px(ctx, box, api.PALETTE.outline, x - 1, y - 1, w + 2, h + 2);
    // big light top with shine edge
    const topH = Math.max(10, Math.round(h * 0.55));
    px(ctx, box, api.PALETTE.light, x, y, w, topH);
    px(ctx, box, api.PALETTE.shine, x, y, w, 1);
    // dark front edge strip
    const stripH = Math.max(3, Math.round(h * 0.12));
    px(ctx, box, api.PALETTE.dark, x, y + topH, w, stripH);
    // accent strip along middle (holo-inlay) across top
    const stripY = y + Math.round(topH / 2) - 1;
    px(ctx, box, c, x + 4, stripY, w - 8, 2);
    // legs
    const legW = Math.max(3, Math.round(w * 0.08));
    const legH = Math.max(4, Math.round(h - topH - stripH) * 0.7);
    const legY = y + topH + stripH + Math.round((h - topH - stripH - legH) / 2);
    px(ctx, box, api.PALETTE.outline, x + 4, legY, legW, legH);
    px(ctx, box, api.PALETTE.outline, x + w - legW - 4, legY, legW, legH);
    if (w > 50) {
      // extra middle legs for long table
      px(ctx, box, api.PALETTE.outline, x + Math.round(w / 2) - Math.round(legW / 2), legY, legW, legH);
    }
    // decorative corner details on table top
    px(ctx, box, api.PALETTE.dark, x + w - 4, y + 2, 2, 2);
    px(ctx, box, api.PALETTE.dark, x + 2, y + 2, 2, 2);
    px(ctx, box, api.PALETTE.shine, x + Math.round(w / 2) - 2, y + 3, 4, 1);
    // decorative center mark on front strip
    px(ctx, box, api.PALETTE.dark, x + Math.round(w / 2) - 1, y + topH + Math.round(stripH / 2) - 1, 2, 2);
    // decorative side dots
    px(ctx, box, api.PALETTE.dark, x + 3, y + Math.round(topH / 2) - 1, 2, 2);
    px(ctx, box, api.PALETTE.dark, x + w - 5, y + Math.round(topH / 2) - 1, 2, 2);
    ctx.restore();
  };

  api.couch = function(ctx, x, y, w, h, opts = {}) {
    const box = makeBox(x, y, w, h);
    const c = opts.color || api.PALETTE.accent;
    ctx.save();
    px(ctx, box, api.PALETTE.outline, x - 1, y - 1, w + 2, h + 2);
    // backrest along top (dark)
    const brH = Math.max(8, Math.round(h * 0.35));
    px(ctx, box, api.PALETTE.dark, x + 2, y + 2, w - 4, brH);
    // accent stripe along backrest
    px(ctx, box, c, x + 2, y + Math.round(brH / 2) - 1, w - 4, 2);
    // seat cushions (2-3) in mid with light top edge
    const seatY = y + brH + 2;
    const seatH = h - brH - 4;
    const cushionCount = w >= 40 ? 3 : 2;
    const cushionW = Math.max(6, Math.round((w - 4) / cushionCount));
    for (let i = 0; i < cushionCount; i++) {
      const cx = x + 2 + i * cushionW;
      const cw = Math.min(cushionW, w - 2 - (x + 2 + i * cushionW) + x);
      const actualCw = Math.round(cw);
      px(ctx, box, api.PALETTE.mid, cx, seatY, actualCw - 1, seatH);
      // light top edge of cushion
      px(ctx, box, api.PALETTE.light, cx, seatY, actualCw - 1, 2);
    }
    // armrests at both ends (dark)
    const armW = Math.max(4, Math.round(w * 0.12));
    const armH = Math.max(6, Math.round(seatH * 0.7));
    px(ctx, box, api.PALETTE.dark, x + 2, seatY, armW, armH);
    px(ctx, box, api.PALETTE.dark, x + w - armW - 2, seatY, armW, armH);
    // small accent stripe on armrests
    px(ctx, box, c, x + 4, seatY + Math.round(armH / 2) - 1, 3, 2);
    px(ctx, box, api.PALETTE.shine, x + w - armW - 2 + 1, seatY + 2, 2, 2);
    ctx.restore();
  };

  api.plant = function(ctx, x, y, w, h, opts = {}) {
    const box = makeBox(x, y, w, h);
    ctx.save();
    px(ctx, box, api.PALETTE.outline, x - 1, y - 1, w + 2, h + 2);
    // metal pot (bottom ~35%)
    const potH = Math.max(8, Math.round(h * 0.35));
    const potY = y + h - potH;
    px(ctx, box, api.PALETTE.mid, x + 3, potY, w - 6, potH);
    // pot dark bottom line
    px(ctx, box, api.PALETTE.dark, x + 3, potY + potH - 2, w - 6, 2);
    // pot shine top edge
    px(ctx, box, api.PALETTE.shine, x + 3, potY, w - 6, 1);
    // leaves above pot in 2+ greens
    const leafColors = ['#2f8f4e', '#56c26a'];
    const leafCount = Math.max(6, Math.round(w / 3));
    for (let i = 0; i < leafCount; i++) {
      const lx = x + 4 + Math.round(i * (w - 8) / Math.max(1, leafCount - 1));
      const lyBase = potY - 10 - (i % 3) * 2;
      const size = Math.max(3, Math.round(4 + (i % 2) * 2));
      const color = leafColors[i % leafColors.length];
      px(ctx, box, color, lx, lyBase, size, size);
      // darker green depth rect
      if (i % 2 === 0) {
        px(ctx, box, '#1f6b3a', lx + 1, lyBase + 1, Math.max(1, size - 2), Math.max(1, size - 2));
      }
    }
    // a couple darker green rects for depth near center
    px(ctx, box, '#1f6b3a', x + Math.round(w / 2) - 3, potY - 8, 6, 4);
    ctx.restore();
  };

  api.crate = function(ctx, x, y, w, h, opts = {}) {
    const box = makeBox(x, y, w, h);
    const c = opts.color || api.PALETTE.accent;
    ctx.save();
    px(ctx, box, api.PALETTE.outline, x - 1, y - 1, w + 2, h + 2);
    // light lid (top ~30%)
    const lidH = Math.max(6, Math.round(h * 0.3));
    px(ctx, box, api.PALETTE.light, x, y, w, lidH);
    px(ctx, box, api.PALETTE.shine, x, y, w, 1);
    // mid front below lid
    const bodyH = h - lidH;
    px(ctx, box, api.PALETTE.mid, x, y + lidH, w, bodyH);
    // vertical slats (dark 1px lines)
    const slatCount = 4;
    for (let i = 1; i <= slatCount; i++) {
      const sx = x + Math.round(i * w / (slatCount + 1));
      px(ctx, box, api.PALETTE.dark, sx, y + lidH, 1, bodyH);
    }
    // corner brackets in shine
    px(ctx, box, api.PALETTE.shine, x + 2, y + lidH + 2, 3, 3);
    px(ctx, box, api.PALETTE.shine, x + w - 5, y + lidH + 2, 3, 3);
    px(ctx, box, api.PALETTE.shine, x + 2, y + h - 5, 3, 3);
    px(ctx, box, api.PALETTE.shine, x + w - 5, y + h - 5, 3, 3);
    // accent hazard/label stripe across front
    px(ctx, box, c, x + 3, y + lidH + Math.round(bodyH / 2) - 1, w - 6, 2);
    // bottom dark strip
    px(ctx, box, api.PALETTE.dark, x, y + h - 2, w, 2);
    ctx.restore();
  };

  api.locker = function(ctx, x, y, w, h, opts = {}) {
    const box = makeBox(x, y, w, h);
    const c = opts.color || api.PALETTE.accent;
    ctx.save();
    px(ctx, box, api.PALETTE.outline, x - 1, y - 1, w + 2, h + 2);
    // thin light top
    const topH = Math.max(4, Math.round(h * 0.1));
    px(ctx, box, api.PALETTE.light, x, y, w, topH);
    // front split into 2-3 doors (dark seams)
    const frontY = y + topH;
    const frontH = h - topH;
    const doorCount = w >= 40 ? 3 : 2;
    const doorW = Math.max(8, Math.round(w / doorCount));
    for (let i = 0; i < doorCount; i++) {
      const dx = x + i * doorW;
      const dw = Math.round(doorW);
      px(ctx, box, api.PALETTE.dark, dx, frontY, dw, frontH);
      // dark vertical seam line
      if (i > 0) {
        px(ctx, box, api.PALETTE.outline, dx, frontY, 1, frontH);
      }
      // small vents (repeating 1px dark lines)
      for (let v = 1; v <= 2; v++) {
        const vx = dx + Math.round(dw / 3) + v * 2;
        px(ctx, box, api.PALETTE.outline, vx, frontY + 4, 1, 3);
      }
      // handles in shine
      const hx = dx + Math.round(dw / 2);
      const hy = frontY + Math.round(frontH / 2);
      px(ctx, box, api.PALETTE.shine, hx - 2, hy - 1, 4, 2);
      // accent indicator light on each door
      px(ctx, box, c, hx - 1, hy + 4, 2, 2);
    }
    // bottom outline line
    px(ctx, box, api.PALETTE.outline, x, y + h - 1, w, 1);
    ctx.restore();
  };

  api.coffee = function(ctx, x, y, w, h, opts = {}) {
    const box = makeBox(x, y, w, h);
    const c = opts.color || api.PALETTE.accent;
    ctx.save();
    px(ctx, box, api.PALETTE.outline, x - 1, y - 1, w + 2, h + 2);
    // body mid
    const bodyY = y + Math.round(h * 0.15);
    const bodyH = Math.round(h * 0.6);
    px(ctx, box, api.PALETTE.mid, x + 2, bodyY, w - 4, bodyH);
    // top light
    const topH = Math.round(h * 0.15);
    px(ctx, box, api.PALETTE.light, x + 2, y, w - 4, topH);
    px(ctx, box, api.PALETTE.shine, x + 2, y, w - 4, 1);
    // dark nozzle area
    const nozzleW = Math.round(w * 0.35);
    px(ctx, box, api.PALETTE.dark, x + Math.round(w / 2) - Math.round(nozzleW / 2), bodyY + Math.round(bodyH * 0.3), nozzleW, Math.round(bodyH * 0.35));
    // small cup (light) in front
    const cupW = Math.round(w * 0.2);
    const cupH = Math.round(h * 0.2);
    px(ctx, box, api.PALETTE.light, x + Math.round(w / 2) - Math.round(cupW / 2), y + h - cupH - 2, cupW, cupH);
    // dark cup rim
    px(ctx, box, api.PALETTE.dark, x + Math.round(w / 2) - Math.round(cupW / 2), y + h - 2, cupW, 1);
    // accent display panel
    px(ctx, box, c, x + 4, bodyY + 4, Math.round(w * 0.3), 4);
    // bottom dark strip
    px(ctx, box, api.PALETTE.dark, x + 2, y + h - 4, w - 4, 2);
    // steam pixels optional (static)
    px(ctx, box, api.PALETTE.light, x + Math.round(w * 0.65), y + 2, 2, 2);
    px(ctx, box, api.PALETTE.light, x + Math.round(w * 0.7), y, 2, 3);
    // extra decorative detail on body
    px(ctx, box, api.PALETTE.shine, x + 4, bodyY + Math.round(bodyH / 2) - 1, 3, 2);
    ctx.restore();
  };

  api.cart = function(ctx, x, y, w, h, opts = {}) {
    const box = makeBox(x, y, w, h);
    const c = opts.color || api.PALETTE.accent;
    ctx.save();
    px(ctx, box, api.PALETTE.outline, x - 1, y - 1, w + 2, h + 2);
    // light tray top with items
    const trayH = Math.round(h * 0.45);
    px(ctx, box, api.PALETTE.light, x, y, w, trayH);
    px(ctx, box, api.PALETTE.shine, x, y, w, 1);
    // small boxes in mid/light on tray
    px(ctx, box, api.PALETTE.mid, x + 6, y + 6, 6, 6);
    px(ctx, box, api.PALETTE.light, x + w - 14, y + 10, 6, 8);
    px(ctx, box, api.PALETTE.dark, x + 6, y + 6, 1, 6);
    // dark lower shelf
    const shelfY = y + trayH + 2;
    const shelfH = h - trayH - 2 - 8;
    if (shelfH > 0)     px(ctx, box, api.PALETTE.dark, x + 2, shelfY, w - 4, shelfH);
    // extra shelf line
    px(ctx, box, api.PALETTE.shine, x + 4, shelfY + 3, w - 8, 1);
    // accent stripe on side
    px(ctx, box, c, x + 2, shelfY + Math.round(shelfH / 2) - 1, 4, 2);
    // 2 wheels at bottom
    const wheelW = Math.round(w * 0.12);
    const wheelH = Math.round(8);
    const wheelY = y + h - wheelH - 2;
    px(ctx, box, api.PALETTE.outline, x + 4, wheelY, wheelW, wheelH);
    px(ctx, box, api.PALETTE.outline, x + w - wheelW - 4, wheelY, wheelW, wheelH);
    // decorative handle on tray
    px(ctx, box, api.PALETTE.dark, x + Math.round(w / 2) - 3, y + 4, 6, 3);
    ctx.restore();
  };

  api.draw = function(ctx, name, x, y, w, h, opts) {
    if (api.NAMES.indexOf(name) === -1) return false;
    api[name](ctx, x, y, w, h, opts);
    return true;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StationFurniture = api;
})(typeof self !== 'undefined' ? self : this);
