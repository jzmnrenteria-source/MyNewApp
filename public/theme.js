// Theme toggle: "light", "dark" or "system" (follows the device setting).
// The initial theme is applied by an inline snippet in <head> to avoid a flash;
// this file wires up the toggle buttons.
(function () {
  var KEY = 'fitquest-theme';
  var root = document.documentElement;

  function read() {
    try { return localStorage.getItem(KEY) || 'system'; } catch (e) { return 'system'; }
  }

  function apply(choice) {
    if (choice === 'light' || choice === 'dark') root.setAttribute('data-theme', choice);
    else root.removeAttribute('data-theme');
    document.querySelectorAll('[data-theme-choice]').forEach(function (btn) {
      var on = btn.getAttribute('data-theme-choice') === choice;
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
  }

  function choose(choice) {
    try {
      if (choice === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, choice);
    } catch (e) { /* storage blocked: theme still applies for this visit */ }
    apply(choice);
  }

  document.querySelectorAll('.theme-toggle').forEach(function (group) {
    var buttons = Array.prototype.slice.call(group.querySelectorAll('[data-theme-choice]'));
    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () { choose(btn.getAttribute('data-theme-choice')); });
      // Arrow keys move between options, as in a radio group
      btn.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
          : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        var next = buttons[(i + step + buttons.length) % buttons.length];
        choose(next.getAttribute('data-theme-choice'));
        next.focus();
      });
    });
  });

  apply(read());
})();
