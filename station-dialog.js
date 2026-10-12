(function (root) {
  "use strict";

  var HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
  var TONES = ["buy", "gain", "loss", "quiet", "info"];

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeColor(c) {
    return typeof c === "string" && HEX_RE.test(c) ? c : "#22e4ff";
  }

  function lineHtml(line) {
    var l = line || {};
    var tone = TONES.indexOf(l.tone) !== -1 ? l.tone : "info";
    return '<div class="dlg-line tone-' + tone + '">'
      + '<span class="dlg-t">' + escapeHtml(l.time) + "</span>"
      + '<span class="dlg-k">' + escapeHtml(l.label) + "</span>"
      + '<span class="dlg-m">' + escapeHtml(l.text).replace(/\n/g, "<br>") + "</span>"
      + "</div>";
  }

  function dialogHtml(bot, lines, opts = {}) {
    var b = bot || {};
    var title = escapeHtml(opts.title || "TRADING CHAT");
    var list = Array.isArray(lines) ? lines : [];
    var body = list.length
      ? list.map(lineHtml).join("")
      : '<div class="dlg-empty">No chat yet today.</div>';
    return '<div class="dlg" data-bot="' + escapeHtml(b.id) + '" style="--c:' + safeColor(b.col) + '">'
      + '<div class="dlg-head">'
      + '<span class="dlg-name">' + escapeHtml(b.name) + "</span>"
      + '<span class="dlg-role">' + escapeHtml(b.role) + "</span>"
      + '<span class="dlg-title">' + title + "</span>"
      + '<button class="dlg-x" aria-label="Close">×</button>'
      + "</div>"
      + '<div class="dlg-body">' + body + "</div>"
      + "</div>";
  }

  var api = { escapeHtml: escapeHtml, safeColor: safeColor, dialogHtml: dialogHtml };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StationDialog = api;
})(typeof self !== "undefined" ? self : this);
