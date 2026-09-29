// Desktop behaviour: file icons, Notepad windows, taskbar and start menu.
// Works on its own (flat version); js/scene.js wraps it in the 3D computer.
(function () {
  var root = document.documentElement;
  var screen = document.getElementById('screen');
  var desktop = document.getElementById('desktop');
  var tasks = screen.querySelector('.tasks');
  var startBtn = screen.querySelector('.start');
  var startMenu = document.getElementById('start-menu');
  var clock = screen.querySelector('.clock');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var smallQuery = window.matchMedia('(max-width: 760px), (max-height: 520px)');

  var Desktop = window.Desktop = {
    mode: root.classList.contains('mode-3d') ? '3d' : '2d',
    powered: false,
    sceneReady: false,
    open: openWindow,
    powerOn: powerOn,
    fallbackTo2D: fallbackTo2D
  };

  var zTop = 10;
  var taskButtons = {};

  // ---- power / boot ----
  function powerOn() {
    if (Desktop.powered) return;
    Desktop.powered = true;
    if (reducedMotion) return showDesktop();
    screen.classList.add('is-booting');
    setTimeout(showDesktop, 2300);
  }

  function showDesktop() {
    screen.classList.remove('is-booting');
    screen.classList.add('is-on');
    var fromHash = location.hash && document.getElementById(location.hash.slice(1));
    if (fromHash && fromHash.classList.contains('window')) openWindow(fromHash.id);
    else if (!smallQuery.matches) openWindow('win-intro');
  }

  function fallbackTo2D() {
    if (Desktop.mode === '2d') return;
    Desktop.mode = '2d';
    root.classList.remove('mode-3d');
    root.classList.add('mode-2d');
    screen.classList.remove('in-3d');
    screen.removeAttribute('style');
    document.body.appendChild(screen);
    powerOn();
  }

  // ---- windows ----
  function openWindow(id) {
    var win = document.getElementById(id);
    if (!win) return;
    closeStart();
    win.classList.add('is-open');
    win.classList.remove('is-min');
    focusWindow(win);
    if (!taskButtons[id]) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'task';
      btn.textContent = win.querySelector('.title').textContent.split(' — ')[0];
      btn.addEventListener('click', function () {
        if (win.classList.contains('is-min') || !win.classList.contains('is-active')) {
          win.classList.remove('is-min');
          focusWindow(win);
        } else {
          minimize(win);
        }
      });
      tasks.appendChild(btn);
      taskButtons[id] = btn;
    }
    syncTasks();
    var body = win.querySelector('.paper, .photo-body');
    if (body) body.focus({ preventScroll: true });
  }

  function closeWindow(win) {
    win.classList.remove('is-open', 'is-min', 'is-active');
    if (taskButtons[win.id]) {
      taskButtons[win.id].remove();
      delete taskButtons[win.id];
    }
    var next = topWindow();
    if (next) focusWindow(next);
    syncTasks();
  }

  function minimize(win) {
    win.classList.add('is-min');
    win.classList.remove('is-active');
    var next = topWindow();
    if (next) focusWindow(next);
    syncTasks();
  }

  function focusWindow(win) {
    desktop.querySelectorAll('.window.is-active').forEach(function (w) { w.classList.remove('is-active'); });
    win.classList.add('is-active');
    win.style.zIndex = ++zTop;
    syncTasks();
  }

  function topWindow() {
    var best = null;
    desktop.querySelectorAll('.window.is-open:not(.is-min)').forEach(function (w) {
      if (!best || (+w.style.zIndex || 0) > (+best.style.zIndex || 0)) best = w;
    });
    return best;
  }

  function syncTasks() {
    Object.keys(taskButtons).forEach(function (id) {
      var win = document.getElementById(id);
      taskButtons[id].classList.toggle('is-active', win.classList.contains('is-active'));
    });
  }

  // Links that open a window (icons, start menu, links inside files).
  screen.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-window]');
    if (opener) {
      e.preventDefault();
      screen.querySelectorAll('.icon.is-selected').forEach(function (i) { i.classList.remove('is-selected'); });
      if (opener.classList.contains('icon')) opener.classList.add('is-selected');
      openWindow(opener.dataset.window);
      return;
    }
    var close = e.target.closest('.ctl-close');
    if (close) {
      e.preventDefault();
      closeWindow(close.closest('.window'));
      return;
    }
    var min = e.target.closest('.ctl-min');
    if (min) {
      minimize(min.closest('.window'));
      return;
    }
    if (!e.target.closest('.start-menu, .start')) closeStart();
    if (e.target === desktop || e.target.classList.contains('icons')) {
      screen.querySelectorAll('.icon.is-selected').forEach(function (i) { i.classList.remove('is-selected'); });
    }
  });

  desktop.addEventListener('pointerdown', function (e) {
    var win = e.target.closest('.window');
    if (win) focusWindow(win);
  });

  screen.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!startMenu.hidden) return closeStart();
    var win = e.target.closest('.window') || topWindow();
    if (win) closeWindow(win);
  });

  // ---- dragging by the title bar ----
  // In 3D the screen is scaled, so pointer pixels are converted to screen pixels.
  desktop.addEventListener('pointerdown', function (e) {
    var bar = e.target.closest('.titlebar');
    if (!bar || e.target.closest('.controls') || e.button !== 0 || smallQuery.matches) return;
    var win = bar.closest('.window');
    var rect = screen.getBoundingClientRect();
    var scale = rect.width / screen.offsetWidth || 1;
    var startX = e.clientX, startY = e.clientY;
    var x0 = win.offsetLeft, y0 = win.offsetTop;
    var maxX = desktop.clientWidth - 80, maxY = desktop.clientHeight - 36;
    bar.setPointerCapture(e.pointerId);
    function move(ev) {
      var x = Math.min(Math.max(x0 + (ev.clientX - startX) / scale, 80 - win.offsetWidth), maxX);
      var y = Math.min(Math.max(y0 + (ev.clientY - startY) / scale, 0), maxY);
      win.style.left = x + 'px';
      win.style.top = y + 'px';
    }
    function up() {
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', up);
      bar.removeEventListener('pointercancel', up);
    }
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
    bar.addEventListener('pointercancel', up);
  });

  // ---- start menu ----
  function closeStart() {
    startMenu.hidden = true;
    startBtn.setAttribute('aria-expanded', 'false');
  }
  startBtn.addEventListener('click', function () {
    var open = startMenu.hidden;
    startMenu.hidden = !open;
    startBtn.setAttribute('aria-expanded', String(open));
    if (open) startMenu.querySelector('a').focus({ preventScroll: true });
  });

  // ---- clock ----
  function tick() {
    var now = new Date();
    clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    clock.dateTime = now.toISOString();
  }
  tick();
  setInterval(tick, 15000);

  // Crossing the phone breakpoint means a different version of the site.
  smallQuery.addEventListener('change', function (e) {
    if (e.matches && Desktop.mode === '3d') location.reload();
  });

  // ---- start ----
  if (Desktop.mode === '2d') {
    powerOn();
  } else {
    // If the 3D scene can't load (offline CDN, old browser), show the flat desktop.
    setTimeout(function () {
      if (!Desktop.sceneReady) fallbackTo2D();
    }, 8000);
  }
})();
