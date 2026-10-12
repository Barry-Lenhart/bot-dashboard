// Shared helpers for the prop/crew drawing tests: a fake canvas context that records every call.
export function fakeCtx() {
  const calls = [];
  const target = { calls };
  return new Proxy(target, {
    get(t, k) { if (k in t) return t[k]; return (...a) => { calls.push([k, a]); }; },
    set(t, k, v) { t[k] = v; calls.push(['set:' + String(k), [v]]); return true; },
  });
}
export const rects = c => c.calls.filter(x => x[0] === 'fillRect').map(x => x[1]);
export const styles = c => c.calls.filter(x => x[0] === 'set:fillStyle').map(x => x[1][0]);
export const inside = (rs, x, y, w, h) => rs.every(([a, b, c, d]) => c >= 0 && d >= 0 && a >= x && b >= y && a + c <= x + w && b + d <= y + h);
export const outsideOnes = (rs, x, y, w, h) => rs.filter(([a, b, c, d]) => !(c >= 0 && d >= 0 && a >= x && b >= y && a + c <= x + w && b + d <= y + h));
export const ints = rs => rs.every(r => r.every(Number.isInteger));
export const ALLOWED = new Set(['fillRect', 'set:fillStyle', 'set:globalAlpha', 'save', 'restore']);
export const onlyAllowed = c => c.calls.filter(x => !ALLOWED.has(x[0])).map(x => x[0]);
export const lum = s => { const n = parseInt(s.slice(1), 16); return ((n >> 16) + (n >> 8 & 255) + (n & 255)) / 3; };
export const greenish = s => { const n = parseInt(s.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255; return g > r + 20 && g > b; };
