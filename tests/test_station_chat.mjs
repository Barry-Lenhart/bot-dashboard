// Tests for station-chat.js: turns a bot's station events into chat lines for the dialog box.
// Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../station-chat.js');

test('exports', () => {
  for (const f of ['cleanText', 'kindLabel', 'chatLines']) assert.equal(typeof C[f], 'function', f);
});

test('cleanText strips emoji, dates and extra spaces', () => {
  assert.equal(C.cleanText('🔔  BOUGHT 30 ENRG   at $19.10 '), 'BOUGHT 30 ENRG at $19.10');
  assert.equal(C.cleanText('Evening wrap-up -- 2026-10-09'), 'Evening wrap-up');
  assert.equal(C.cleanText('on 2026-10-09 we sold'), 'on we sold');
  assert.equal(C.cleanText('☀️ Good morning'), 'Good morning');
  assert.equal(C.cleanText(null), '');
  assert.equal(C.cleanText(undefined), '');
});

test('kindLabel', () => {
  assert.equal(C.kindLabel('buy'), 'BUY');
  assert.equal(C.kindLabel('think'), 'THINKING');
  assert.equal(C.kindLabel('decision'), 'DECISION');
  assert.equal(C.kindLabel('watch'), 'WATCH');
  assert.equal(C.kindLabel('mystery'), 'MYSTERY');
  assert.equal(C.kindLabel(''), '');
  assert.equal(C.kindLabel(undefined), '');
});

test('chatLines basic shape', () => {
  const out = C.chatLines([['09:35:12', 'watch', "👀 Today's watchlist: ENRG +62%"]]);
  assert.deepEqual(out, [{ time: '09:35', kind: 'watch', label: 'WATCH', text: "Today's watchlist: ENRG +62%", tone: 'info' }]);
});

test('chatLines splits " | " parts onto separate lines and drops empty parts', () => {
  const out = C.chatLines([['11:25:00', 'buy', '🔔 BOUGHT 30 ENRG at $19.10 |  | AI expects +0.31%']]);
  assert.equal(out[0].text, 'BOUGHT 30 ENRG at $19.10\nAI expects +0.31%');
  assert.equal(out[0].tone, 'buy');
});

test('chatLines tones', () => {
  const ev = [
    ['10:00:00', 'sell', 'SOLD ENRG -1.2% | reason'],
    ['10:01:00', 'sell', 'SOLD QETA −0.4%'],
    ['10:02:00', 'sell', 'SOLD SKK +2.5% | target -3% hit'],
    ['10:03:00', 'think', 'hmm'],
    ['10:04:00', 'news', 'headline'],
    ['10:05:00', 'buy', 'BOUGHT X'],
  ];
  assert.deepEqual(C.chatLines(ev, { skip: [] }).map(l => l.tone), ['loss', 'loss', 'gain', 'quiet', 'info', 'buy']);
});

test('chatLines skips scan by default, opts.skip overrides', () => {
  const ev = [['09:00:00', 'scan', 'scanning 40 coins'], ['09:01:00', 'think', 'ok']];
  assert.deepEqual(C.chatLines(ev).map(l => l.kind), ['think']);
  assert.deepEqual(C.chatLines(ev, { skip: [] }).map(l => [l.kind, l.tone]), [['scan', 'quiet'], ['think', 'quiet']]);
  assert.deepEqual(C.chatLines(ev, { skip: ['think'] }).map(l => l.kind), ['scan']);
});

test('chatLines drops empty text and collapses consecutive duplicates', () => {
  const ev = [['09:00:00', 'think', '🔔'], ['09:01:00', 'think', 'same'], ['09:02:00', 'think', 'same'],
              ['09:03:00', 'note', 'same'], ['09:04:00', 'think', 'same']];
  assert.deepEqual(C.chatLines(ev).map(l => [l.time, l.kind]), [['09:01', 'think'], ['09:03', 'note'], ['09:04', 'think']]);
});

test('chatLines keeps the most recent `limit` lines, oldest first (default 50)', () => {
  const ev = Array.from({ length: 80 }, (_, i) => [`10:${String(i % 60).padStart(2, '0')}:00`, 'think', 'msg ' + i]);
  const d = C.chatLines(ev);
  assert.equal(d.length, 50); assert.equal(d[0].text, 'msg 30'); assert.equal(d[49].text, 'msg 79');
  const l = C.chatLines(ev, { limit: 3 });
  assert.deepEqual(l.map(x => x.text), ['msg 77', 'msg 78', 'msg 79']);
});

test('chatLines tolerates bad input', () => {
  assert.deepEqual(C.chatLines(null), []);
  assert.deepEqual(C.chatLines('nope'), []);
  assert.deepEqual(C.chatLines([null, ['09:00:00'], ['09:00:00', 'think', 'ok']]).map(l => l.text), ['ok']);
});

test('time keeps HH:MM, missing time becomes empty string', () => {
  assert.equal(C.chatLines([['7:05', 'think', 'a']])[0].time, '7:05');
  assert.equal(C.chatLines([[null, 'think', 'a']])[0].time, '');
});
