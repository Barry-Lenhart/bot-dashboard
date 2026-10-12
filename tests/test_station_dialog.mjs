// Tests for station-dialog.js: builds the HTML of the "trading chat" dialog box for one bot.
// Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../station-dialog.js');

const bot = { id: 'ch', name: 'CHAD', role: 'chatbot · paper · the control', col: '#3dffa2' };
const lines = [
  { time: '09:35', kind: 'watch', label: 'WATCH', text: 'ENRG +62%', tone: 'info' },
  { time: '11:25', kind: 'buy', label: 'BUY', text: 'BOUGHT 30 ENRG\nAI expects +0.31%', tone: 'buy' },
];

test('exports', () => {
  for (const f of ['escapeHtml', 'safeColor', 'dialogHtml']) assert.equal(typeof D[f], 'function', f);
});

test('escapeHtml', () => {
  assert.equal(D.escapeHtml(`<a href="x">Tom's & co</a>`), '&lt;a href=&quot;x&quot;&gt;Tom&#39;s &amp; co&lt;/a&gt;');
  assert.equal(D.escapeHtml(null), '');
  assert.equal(D.escapeHtml(42), '42');
});

test('safeColor allows only hex colors', () => {
  assert.equal(D.safeColor('#3dffa2'), '#3dffa2');
  assert.equal(D.safeColor('#FFF'), '#FFF');
  assert.equal(D.safeColor('#11223344'), '#11223344');
  assert.equal(D.safeColor('red;background:url(x)'), '#22e4ff');
  assert.equal(D.safeColor(undefined), '#22e4ff');
  assert.equal(D.safeColor('#12345'), '#22e4ff');
});

test('dialogHtml structure', () => {
  const h = D.dialogHtml(bot, lines);
  assert.ok(h.startsWith('<div class="dlg" data-bot="ch" style="--c:#3dffa2">'), h.slice(0, 80));
  assert.ok(h.endsWith('</div>'));
  assert.ok(h.includes('<span class="dlg-name">CHAD</span>'));
  assert.ok(h.includes('<span class="dlg-role">chatbot · paper · the control</span>'));
  assert.ok(h.includes('<span class="dlg-title">TRADING CHAT</span>'));
  assert.ok(h.includes('<button class="dlg-x" aria-label="Close">×</button>'));
  assert.ok(h.includes('<div class="dlg-body">'));
  assert.equal((h.match(/class="dlg-line /g) || []).length, 2);
  assert.ok(h.includes('<div class="dlg-line tone-info"><span class="dlg-t">09:35</span><span class="dlg-k">WATCH</span><span class="dlg-m">ENRG +62%</span></div>'));
  assert.ok(h.includes('<span class="dlg-m">BOUGHT 30 ENRG<br>AI expects +0.31%</span>'));
  assert.ok(h.indexOf('09:35') < h.indexOf('11:25'), 'lines keep their order');
});

test('dialogHtml custom title and empty state', () => {
  const h = D.dialogHtml(bot, [], { title: 'PRACTICE CHAT' });
  assert.ok(h.includes('<span class="dlg-title">PRACTICE CHAT</span>'));
  assert.ok(h.includes('<div class="dlg-empty">No chat yet today.</div>'));
  assert.ok(!h.includes('dlg-line'));
  assert.ok(D.dialogHtml(bot, null).includes('dlg-empty'));
});

test('dialogHtml escapes everything from the data', () => {
  const evil = { id: 'x"><script>', name: '<b>N</b>', role: '<i>', col: 'red"><script>' };
  const h = D.dialogHtml(evil, [{ time: '<t>', kind: 'k', label: '<l>', text: '<img src=x onerror=1>\nok', tone: 'info"><x' }]);
  assert.ok(!h.includes('<script>') && !h.includes('<img') && !h.includes('<b>') && !h.includes('<i>'));
  assert.ok(h.includes('style="--c:#22e4ff"'));
  assert.ok(h.includes('&lt;img src=x onerror=1&gt;<br>ok'));
  assert.ok(!/tone-info"><x/.test(h), 'tone must be sanitised');
  assert.ok(h.includes('dlg-line tone-info'), 'unknown/bad tone falls back to info');
});

test('only known tones are used', () => {
  for (const t of ['buy', 'gain', 'loss', 'quiet', 'info'])
    assert.ok(D.dialogHtml(bot, [{ time: '', kind: '', label: '', text: 'a', tone: t }]).includes('dlg-line tone-' + t));
  assert.ok(D.dialogHtml(bot, [{ time: '', kind: '', label: '', text: 'a', tone: 'weird' }]).includes('dlg-line tone-info'));
});
