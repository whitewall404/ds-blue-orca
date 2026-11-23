/* 拼图 · 小虎鲸的游戏屋（拖放版） */
(function () {
  'use strict';

  var LEVELS = window.PUZZLE_LEVELS || [];
  var finished = new Set();
  try {
    finished = new Set(JSON.parse(localStorage.getItem('orca-puzzle-v2') || '[]'));
  } catch (e) {}

  var $ = function (id) { return document.getElementById(id); };
  var levelGrid = $('level-grid');
  var board = $('board');
  var tray = $('tray');
  var hud = $('hud');
  var hudLevel = $('hud-level');
  var hudPlaced = $('hud-placed');
  var hudTime = $('hud-time');
  var viewLevels = $('view-levels');
  var viewPlay = $('view-play');
  var viewWin = $('view-win');

  var cur = null;
  var timerId = null;
  var drag = null;

  /* ---------- 关卡列表 ---------- */
  function renderLevels() {
    levelGrid.innerHTML = '';
    LEVELS.forEach(function (lv, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-btn';
      var badge = document.createElement('span');
      badge.className = 'lv-badge';
      badge.textContent = '第 ' + lv.n + ' 关 · ' + lv.grid + '×' + lv.grid;

      if (finished.has(lv.n)) {
        btn.classList.add('done');
        btn.style.backgroundImage = 'url("../library-puzzle/' + lv.img + '")';
      } else {
        btn.classList.add('locked');
      }
      btn.appendChild(badge);
      btn.addEventListener('click', function () { startLevel(i); });
      levelGrid.appendChild(btn);
    });
  }

  function show(view) {
    viewLevels.hidden = view !== 'levels';
    viewPlay.hidden = view !== 'play';
    viewWin.hidden = view !== 'win';
    hud.classList.toggle('on', view === 'play');
  }

  /* ---------- 开始一关 ---------- */
  function startLevel(idx) {
    if (timerId) { clearInterval(timerId); timerId = null; }
    var lv = LEVELS[idx];
    if (!lv) return;

    var img = new Image();
    img.onerror = function () {
      alert('这张素材找不到了：' + lv.img + '\n可能被删掉了，换一关吧。');
    };
    img.onload = function () {
      cur = {
        idx: idx,
        level: lv,
        grid: lv.grid,
        ratio: img.naturalWidth / img.naturalHeight,
        placed: 0,
        start: Date.now()
      };
      hudLevel.textContent = lv.n;
      build(lv, cur.ratio);
      updatePlaced();
      show('play');
      hudTime.textContent = '00:00';
      timerId = setInterval(function () {
        hudTime.textContent = fmt(Math.floor((Date.now() - cur.start) / 1000));
      }, 1000);

      if (location.search.indexOf('solved=1') >= 0) {
        var kids = board.children;
        var ts = Array.prototype.slice.call(tray.children);
        ts.sort(function (a, b) { return +a.dataset.pos - +b.dataset.pos; });
        for (var s = 0; s < kids.length && s < ts.length; s++) {
          kids[s].appendChild(ts[s]);
        }
        updatePlaced();
        checkWin();
      }
    };
    img.src = '../library-puzzle/' + lv.img;
  }

  /* ---------- 布局 ---------- */
  function layout(grid, ratio) {
    var winW = window.innerWidth;
    var winH = window.innerHeight;
    var sideBySide = winW >= 920;
    var totalW = Math.min(winW - 56, 1000);

    var boardW, boardH;
    if (sideBySide) {
      boardW = Math.min(totalW * 0.55, 560);
      boardH = boardW / ratio;
      var maxH = winH - 300;
      if (boardH > maxH) { boardH = maxH; boardW = boardH * ratio; }
      tray.style.width = Math.max(220, totalW - boardW - 18) + 'px';
    } else {
      boardW = Math.min(winW - 56, 520);
      boardH = boardW / ratio;
      var maxH2 = winH * 0.52;
      if (boardH > maxH2) { boardH = maxH2; boardW = boardH * ratio; }
      tray.style.width = boardW + 'px';
    }

    board.style.width = Math.round(boardW) + 'px';
    board.style.height = Math.round(boardH) + 'px';
    board.style.gridTemplateColumns = 'repeat(' + grid + ', 1fr)';
    board.style.gridTemplateRows = 'repeat(' + grid + ', 1fr)';

    var cellSize = boardW / grid;
    tray.style.setProperty('--mini', Math.round(cellSize * 0.62) + 'px');
  }

  /* ---------- 建盘 ---------- */
  function makeTile(pos, img, n) {
    var t = document.createElement('div');
    t.className = 'tile';
    t.dataset.pos = String(pos);
    t.style.backgroundImage = 'url("../library-puzzle/' + img + '")';
    t.style.backgroundSize = (n * 100) + '% ' + (n * 100) + '%';
    var col = pos % n;
    var row = Math.floor(pos / n);
    t.style.backgroundPosition = (col / (n - 1)) * 100 + '% ' + (row / (n - 1)) * 100 + '%';
    return t;
  }

  function build(lv, ratio) {
    var n = lv.grid;
    var total = n * n;
    board.innerHTML = '';
    tray.innerHTML = '';
    layout(n, ratio);

    for (var i = 0; i < total; i++) {
      var cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.pos = String(i);
      board.appendChild(cell);
    }

    var order = [];
    for (var k = 0; k < total; k++) order.push(k);
    for (var m = order.length - 1; m > 0; m--) {
      var j = Math.floor(Math.random() * (m + 1));
      var tmp = order[m]; order[m] = order[j]; order[j] = tmp;
    }
    var same = true;
    for (var q = 0; q < total; q++) if (order[q] !== q) { same = false; break; }
    if (same) order.reverse();

    for (var t = 0; t < total; t++) {
      tray.appendChild(makeTile(order[t], lv.img, n));
    }
  }

  /* ---------- 拖放 ---------- */
  function resetDragStyle(t) {
    t.classList.remove('dragging');
    t.style.position = '';
    t.style.left = '';
    t.style.top = '';
    t.style.width = '';
    t.style.height = '';
    t.style.zIndex = '';
  }

  function toTray(t) {
    resetDragStyle(t);
    t.classList.remove('placed');
    tray.appendChild(t);
  }

  function findCell(x, y) {
    for (var i = 0; i < board.children.length; i++) {
      var r = board.children[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return board.children[i];
      }
    }
    return null;
  }

  function updatePlaced() {
    var n = 0;
    for (var i = 0; i < board.children.length; i++) {
      if (board.children[i].firstElementChild) n++;
    }
    if (cur) {
      cur.placed = n;
      hudPlaced.textContent = n + '/' + board.children.length;
    }
  }

  function checkWin() {
    for (var i = 0; i < board.children.length; i++) {
      var c = board.children[i];
      var t = c.firstElementChild;
      if (!t || +t.dataset.pos !== i) return false;
    }
    if (timerId) { clearInterval(timerId); timerId = null; }
    finished.add(cur.level.n);
    try { localStorage.setItem('orca-puzzle-v2', JSON.stringify(Array.from(finished))); } catch (err) {}
    el('win-stat').textContent =
      '用时 ' + fmt(Math.floor((Date.now() - cur.start) / 1000));
    $('win-img').src = '../library-puzzle/' + cur.level.img;
    $('btn-next').style.display = (cur.idx + 1 < LEVELS.length) ? '' : 'none';
    if (cur.idx + 1 >= LEVELS.length) {
      $('win-stat').textContent += ' · 全部通关！';
    }
    show('win');
    return true;
  }

  function el(id) { return document.getElementById(id); }

  document.addEventListener('pointerdown', function (e) {
    if (!cur || viewPlay.hidden || drag) return;
    var t = e.target.closest('.tile');
    if (!t) return;
    e.preventDefault();

    var rect = t.getBoundingClientRect();
    var cellSize = board.clientWidth / cur.grid;
    drag = {
      el: t,
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top
    };

    t.classList.add('dragging');
    t.style.width = Math.round(cellSize) + 'px';
    t.style.height = Math.round(cellSize) + 'px';
    t.style.left = (e.clientX - drag.dx) + 'px';
    t.style.top = (e.clientY - drag.dy) + 'px';
    document.body.appendChild(t);
    updatePlaced();
  }, { passive: false });

  document.addEventListener('pointermove', function (e) {
    if (!drag) return;
    drag.el.style.left = (e.clientX - drag.dx) + 'px';
    drag.el.style.top = (e.clientY - drag.dy) + 'px';
  }, { passive: false });

  function drop(e) {
    if (!drag) return;
    var t = drag.el;
    var cell = findCell(e.clientX, e.clientY);
    if (cell) {
      if (cell.firstElementChild) {
        toTray(cell.firstElementChild);
      }
      cell.appendChild(t);
      resetDragStyle(t);
      t.classList.add('placed');
    } else {
      toTray(t);
    }
    drag = null;
    updatePlaced();
    checkWin();
  }

  document.addEventListener('pointerup', function (e) {
    drop(e);
  });

  document.addEventListener('pointercancel', function () {
    if (drag) { toTray(drag.el); drag = null; updatePlaced(); }
  });

  /* ---------- 工具 ---------- */
  function fmt(sec) {
    var mm = Math.floor(sec / 60);
    var ss = sec % 60;
    return (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
  }

  /* ---------- 按钮 ---------- */
  $('btn-shuffle').addEventListener('click', function () {
    if (cur) startLevel(cur.idx);
  });
  $('btn-levels').addEventListener('click', function () {
    if (timerId) { clearInterval(timerId); timerId = null; }
    renderLevels();
    show('levels');
  });
  $('btn-again').addEventListener('click', function () {
    if (cur) startLevel(cur.idx);
  });
  $('btn-next').addEventListener('click', function () {
    if (cur && cur.idx + 1 < LEVELS.length) startLevel(cur.idx + 1);
  });

  window.addEventListener('resize', function () {
    if (cur && !viewPlay.hidden) layout(cur.grid, cur.ratio);
  });

  /* ---------- 启动 ---------- */
  renderLevels();
  show('levels');

  var h = location.hash.match(/^#(\d+)$/);
  if (h) {
    var idx = parseInt(h[1], 10) - 1;
    if (idx >= 0 && idx < LEVELS.length) startLevel(idx);
  }
})();

