(function (root) {
  'use strict';

  var KIND_LABELS = {
    buy: 'BUY',
    sell: 'SELL',
    order: 'ORDER',
    plan: 'PLAN',
    check: 'CHECK',
    news: 'NEWS',
    brief: 'BRIEF',
    note: 'NOTE',
    watch: 'WATCH',
    think: 'THINKING',
    scan: 'SCAN',
    summary: 'SUMMARY',
    review: 'REVIEW',
    talk: 'TALK',
    decision: 'DECISION'
  };

  var LOSS_RE = /[-\u2212]\d+(\.\d+)?%/;
  var EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B1C}\u{2B1B}\u{FE0F}]/gu;

  function cleanText(s) {
    if (s == null) return '';
    return String(s)
      .replace(/\s*--\s*\d{4}-\d\d-\d\d/g, '')
      .replace(/\b\d{4}-\d\d-\d\d\b/g, '')
      .replace(EMOJI_RE, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function kindLabel(kind) {
    if (!kind) return '';
    return KIND_LABELS[kind] || String(kind).toUpperCase();
  }

  function chatLines(events, opts) {
    if (!Array.isArray(events)) return [];
    if (opts == null) opts = {};
    var skip = Array.isArray(opts.skip) ? opts.skip : ['scan'];
    var limit = typeof opts.limit === 'number' ? opts.limit : 50;
    var lines = [];
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (!Array.isArray(e)) continue;
      var kind = e[1];
      if (skip.indexOf(kind) !== -1) continue;
      var raw = e[2] == null ? '' : String(e[2]);
      var parts = raw.split(' | ');
      var text = parts.map(cleanText).filter(Boolean).join('\n');
      if (!text) continue;
      var last = lines[lines.length - 1];
      if (last && last.kind === kind && last.text === text) continue;
      var time = e[0] ? String(e[0]).slice(0, 5) : '';
      var tone;
      if (kind === 'buy') tone = 'buy';
      else if (kind === 'sell') tone = LOSS_RE.test(parts[0]) ? 'loss' : 'gain';
      else if (kind === 'think' || kind === 'scan') tone = 'quiet';
      else tone = 'info';
      lines.push({ time: time, kind: kind, label: kindLabel(kind), text: text, tone: tone });
    }
    return lines.length > limit ? lines.slice(lines.length - limit) : lines;
  }

  var api = { cleanText: cleanText, kindLabel: kindLabel, chatLines: chatLines };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StationChat = api;
})(typeof self !== "undefined" ? self : this);
