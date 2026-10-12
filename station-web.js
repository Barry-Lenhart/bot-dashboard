(function (root) {
  'use strict';

  const api = {};

  api.PIPELINE = ['candidate', 'ready', 'queued', 'sent', 'replied', 'followed_up'];

  function countsOf(status) {
    return (status && status.counts) || {};
  }

  function reached(counts, stage) {
    const idx = api.PIPELINE.indexOf(stage);
    if (idx < 0) return 0;
    const c = counts || {};
    let sum = 0;
    for (let i = idx; i < api.PIPELINE.length; i++) sum += c[api.PIPELINE[i]] || 0;
    return sum;
  }

  api.reached = reached;

  api.summary = function (status) {
    const c = countsOf(status);
    return {
      building: c.candidate || 0,
      waiting: c.ready || 0,
      sending: c.queued || 0,
      sent: reached(c, 'queued'),
      replied: reached(c, 'replied'),
      won: c.won || 0
    };
  };

  const EVENT_KINDS = [
    ['found', c => reached(c, 'candidate')],
    ['built', c => reached(c, 'ready')],
    ['sent', c => reached(c, 'queued')],
    ['reply', c => reached(c, 'replied')],
    ['followup', c => reached(c, 'followed_up')],
    ['won', c => c.won || 0]
  ];

  api.webEvents = function (prev, cur) {
    if (!prev || !cur) return [];
    const before = countsOf(prev);
    const after = countsOf(cur);
    const events = [];
    for (const [kind, get] of EVENT_KINDS) {
      const diff = get(after) - get(before);
      if (diff > 0) events.push({ kind, n: Math.min(5, diff) });
    }
    return events;
  };

  api.starMap = function (status, w, h) {
    if (!status) return [];
    const c = countsOf(status);
    const total = Math.min(120, reached(c, 'queued'));
    const gold = Math.min(c.won || 0, total);
    const green = Math.max(0, Math.min(total, reached(c, 'replied')) - gold);
    const stars = [];
    for (let i = 0; i < total; i++) {
      const a = i * 2.399963229728653;
      const r = Math.sqrt(((i % 120) + 0.5) / 120);
      const kind = i < gold ? 'gold' : i < gold + green ? 'green' : 'white';
      stars.push({
        i,
        x: Math.cos(a) * r * w / 2 * 0.95,
        y: Math.sin(a) * r * h / 2 * 0.95,
        kind
      });
    }
    return stars;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StationWeb = api;
})(typeof self !== 'undefined' ? self : this);
