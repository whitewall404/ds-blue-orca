/* 开心消消乐 · 小虎鲸的游戏屋 */
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var wrap = document.getElementById('match-wrap');
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var W = 0, H = 0, cellW = 0, cellH = 0;

  var TYPES = [
    { img: '../assets/match/d30.png',  color: '#5ea8f0', name: '天空' },
    { img: '../assets/match/d81.png',  color: '#ff9ec4', name: '糖果' },
    { img: '../assets/match/d255.png', color: '#ffcf45', name: '奶茶' },
    { img: '../assets/match/d291.png', color: '#7ed07a', name: '抹茶' },
    { img: '../assets/match/d331.png', color: '#ff7d7d', name: '创可贴' },
    { img: '../assets/match/d37.png',  color: '#b18cff', name: '月夜' }
  ];

  var IMGS = TYPES.map(function (t) {
    var im = new Image();
    im.src = t.img;
    return im;
  });

  var MODES = [
    { id: 1, name: '第一关', sub: '8×8 · 目标 1000 · 25 步', cols: 8, rows: 8, goal: 1000, moves: 25 },
    { id: 2, name: '第二关', sub: '8×8 · 目标 1500 · 25 步', cols: 8, rows: 8, goal: 1500, moves: 25 },
    { id: 3, name: '第三关', sub: '9×9 · 目标 2000 · 30 步', cols: 9, rows: 9, goal: 2000, moves: 30 }
  ];

  var st = {
    running: false,
    mode: MODES[0],
    board: [],
    sel: null,
    score: 0,
    moves: 0,
    busy: false,
    poofs: []   // 消除动画
  };

  var viewModes = document.getElementById('view-modes');
  var viewOver = document.getElementById('over-overlay');
  var hud = document.getElementById('hud');

  function showView(v) {
    viewModes.hidden = v !== 'modes';
    viewOver.hidden = v !== 'over';
    hud.classList.toggle('on', v === 'play');
  }

  /* ---------- 尺寸 ---------- */
  function resize() {
    var r = wrap.getBoundingClientRect();
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutCells();
  }

  function layoutCells() {
    if (!st.mode) return;
    var pad = 16;
    var aw = W - pad * 2;
    var ah = H - pad * 2;
    cellW = Math.min(aw / st.mode.cols, ah / st.mode.rows);
    cellH = cellW;
  }

  window.addEventListener('resize', function () {
    resize();
    render();
  });

  /* ---------- 棋盘 ---------- */
  function randType() {
    return Math.floor(Math.random() * 6);
  }

  function newBoard() {
    var cols = st.mode.cols, rows = st.mode.rows;
    st.board = [];
    for (var r = 0; r < rows; r++) {
      st.board.push([]);
      for (var c = 0; c < cols; c++) {
        var t;
        var guard = 0;
        do {
          t = randType();
          guard++;
        } while (guard < 30 && wouldMatch(r, c, t));
        st.board[r][c] = t;
      }
    }
  }

  function wouldMatch(r, c, t) {
    if (c >= 2 && st.board[r][c - 1] === t && st.board[r][c - 2] === t) return true;
    if (r >= 2 && st.board[r - 1][c] === t && st.board[r - 2][c] === t) return true;
    return false;
  }

  function findMatches() {
    var cols = st.mode.cols, rows = st.mode.rows;
    var hit = {};
    // 横
    for (var r = 0; r < rows; r++) {
      var run = 1;
      for (var c = 1; c <= cols; c++) {
        if (c < cols && st.board[r][c] === st.board[r][c - 1]) run++;
        else {
          if (run >= 3) for (var k = c - run; k < c; k++) hit[r + ',' + k] = true;
          run = 1;
        }
      }
    }
    // 竖
    for (var c2 = 0; c2 < cols; c2++) {
      var run2 = 1;
      for (var r2 = 1; r2 <= rows; r2++) {
        if (r2 < rows && st.board[r2][c2] === st.board[r2 - 1][c2]) run2++;
        else {
          if (run2 >= 3) for (var k2 = r2 - run2; k2 < r2; k2++) hit[k2 + ',' + c2] = true;
          run2 = 1;
        }
      }
    }
    return hit;
  }

  function dropAndFill() {
    var cols = st.mode.cols, rows = st.mode.rows;
    for (var c = 0; c < cols; c++) {
      var write = rows - 1;
      for (var r = rows - 1; r >= 0; r--) {
        if (st.board[r][c] !== -1) {
          st.board[write][c] = st.board[r][c];
          write--;
        }
      }
      for (var r2 = write; r2 >= 0; r2--) {
        st.board[r2][c] = randType();
      }
    }
  }

  /* ---------- 消除流程 ---------- */
  function resolve() {
    var hit = findMatches();
    var keys = Object.keys(hit);
    if (!keys.length) {
      checkEnd();
      return;
    }

    // 计分：每个格子 20 分，连锁倍率
    st.score += keys.length * 20;
    document.getElementById('hud-score').textContent = st.score;

    // 消除动画
    keys.forEach(function (k) {
      var p = k.split(',');
      st.poofs.push({ r: +p[0], c: +p[1], type: st.board[+p[0]][+p[1]], t: 0 });
    });

    keys.forEach(function (k) {
      var p = k.split(',');
      st.board[+p[0]][+p[1]] = -1;
    });

    setTimeout(function () {
      dropAndFill();
      render();
      setTimeout(resolve, 120);
    }, 180);
  }

  function checkEnd() {
    if (st.score >= st.mode.goal) {
      endGame(true);
      return;
    }
    if (st.moves <= 0) {
      endGame(false);
      return;
    }
    // 死局：没有任何一步能连成三连就重排
    if (!hasMove()) {
      newBoard();
      render();
    }
    st.busy = false;
  }

  function hasMove() {
    var cols = st.mode.cols, rows = st.mode.rows;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (c + 1 < cols) {
          swap({ r: r, c: c }, { r: r, c: c + 1 });
          var ok = Object.keys(findMatches()).length > 0;
          swap({ r: r, c: c }, { r: r, c: c + 1 });
          if (ok) return true;
        }
        if (r + 1 < rows) {
          swap({ r: r, c: c }, { r: r + 1, c: c });
          var ok2 = Object.keys(findMatches()).length > 0;
          swap({ r: r, c: c }, { r: r + 1, c: c });
          if (ok2) return true;
        }
      }
    }
    return false;
  }

  /* ---------- 交互 ---------- */
  function cellAt(x, y) {
    var pad = 16;
    var ox = (W - cellW * st.mode.cols) / 2;
    var oy = (H - cellH * st.mode.rows) / 2;
    var c = Math.floor((x - ox) / cellW);
    var r = Math.floor((y - oy) / cellH);
    if (r < 0 || c < 0 || r >= st.mode.rows || c >= st.mode.cols) return null;
    return { r: r, c: c };
  }

  function onClick(x, y) {
    if (!st.running || st.busy) return;
    var cell = cellAt(x, y);
    if (!cell) return;

    if (!st.sel) {
      st.sel = cell;
      render();
      return;
    }
    var a = st.sel;
    if (a.r === cell.r && a.c === cell.c) {
      st.sel = null;
      render();
      return;
    }
    var dist = Math.abs(a.r - cell.r) + Math.abs(a.c - cell.c);
    if (dist !== 1) {
      st.sel = cell;
      render();
      return;
    }

    st.busy = true;
    st.sel = null;
    swap(a, cell);
    render();

    var hit = findMatches();
    if (!Object.keys(hit).length) {
      // 换回去
      setTimeout(function () {
        swap(a, cell);
        render();
        st.busy = false;
      }, 220);
      return;
    }

    st.moves--;
    document.getElementById('hud-moves').textContent = st.moves;
    setTimeout(resolve, 120);
  }

  function swap(a, b) {
    var t = st.board[a.r][a.c];
    st.board[a.r][a.c] = st.board[b.r][b.c];
    st.board[b.r][b.c] = t;
  }

  canvas.addEventListener('pointerdown', function (e) {
    var r = wrap.getBoundingClientRect();
    onClick(e.clientX - r.left, e.clientY - r.top);
  });

  /* ---------- 绘制 ---------- */
  function roundRect(x, y, w, h, rad) {
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    if (!st.mode || !st.board.length) return;

    var cols = st.mode.cols, rows = st.mode.rows;
    var ox = (W - cellW * cols) / 2;
    var oy = (H - cellH * rows) / 2;
    var gap = Math.max(2, cellW * 0.06);

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var t = st.board[r][c];
        if (t < 0) continue;
        var x = ox + c * cellW + gap / 2;
        var y = oy + r * cellH + gap / 2;
        var s = cellW - gap;
        var selected = st.sel && st.sel.r === r && st.sel.c === c;

        // 底色
        ctx.fillStyle = TYPES[t].color;
        roundRect(x, y, s, s, s * 0.22);
        ctx.fill();

        // 图片
        var img = IMGS[t];
        if (img.complete && img.naturalWidth) {
          ctx.save();
          roundRect(x + 2, y + 2, s - 4, s - 4, s * 0.2);
          ctx.clip();
          // cover 裁剪
          var iw = img.naturalWidth, ih = img.naturalHeight;
          var scale = Math.max((s - 4) / iw, (s - 4) / ih);
          var dw = iw * scale, dh = ih * scale;
          ctx.drawImage(img, x + 2 + (s - 4 - dw) / 2, y + 2 + (s - 4 - dh) / 2, dw, dh);
          ctx.restore();
        }

        if (selected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          roundRect(x - 1, y - 1, s + 2, s + 2, s * 0.24);
          ctx.stroke();
        }
      }
    }

    // 消除动画
    st.poofs = st.poofs.filter(function (p) {
      p.t += 0.06;
      var x = ox + p.c * cellW + gap / 2;
      var y = oy + p.r * cellH + gap / 2;
      var s = cellW - gap;
      var k = Math.max(0, 1 - p.t / 0.5);
      ctx.globalAlpha = k;
      ctx.fillStyle = TYPES[p.type].color;
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, (s / 2) * (0.3 + p.t * 1.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return p.t < 0.5;
    });
  }

  function loop() {
    render();
    requestAnimationFrame(loop);
  }

  /* ---------- 开始 / 结束 ---------- */
  function start(mode) {
    st.mode = mode;
    st.running = true;
    st.score = 0;
    st.moves = mode.moves;
    st.sel = null;
    st.busy = false;
    st.poofs = [];
    resize();
    newBoard();
    document.getElementById('hud-score').textContent = '0';
    document.getElementById('hud-moves').textContent = mode.moves;
    document.getElementById('hud-goal').textContent = mode.goal;
    showView('play');
    render();
  }

  var ENDS = {
    1: '../assets/match-end-1.png',
    2: '../assets/match-end-2.png',
    3: '../assets/match-end-3.png'
  };

  function endGame(win) {
    st.running = false;
    document.getElementById('over-title').textContent = win ? '过关了！' : '步数用完了';
    document.getElementById('over-line').textContent = win
      ? '这一关的鱼都被你连起来了。'
      : '再试一次，先找能连成五个的。';
    document.getElementById('over-note').textContent =
      '得分 ' + st.score + ' / ' + st.mode.goal;
    var g = document.getElementById('over-bg');
    g.style.background = '';
    g.style.backgroundImage = 'url("' + (ENDS[st.mode.id] || ENDS[1]) + '")';
    showView('over');
  }

  function toModes() {
    st.running = false;
    showView('modes');
  }

  /* ---------- 按钮 ---------- */
  var modeList = document.getElementById('mode-list');
  MODES.forEach(function (m) {
    var b = document.createElement('button');
    b.className = 'mode-btn';
    b.innerHTML = '<b>' + m.name + '</b><span>' + m.sub + '</span>';
    b.addEventListener('click', function () { start(m); });
    modeList.appendChild(b);
  });
  document.getElementById('btn-again').addEventListener('click', function () { start(st.mode); });
  document.getElementById('btn-to-modes').addEventListener('click', toModes);

  /* ---------- 启动 ---------- */
  resize();
  showView('modes');
  requestAnimationFrame(loop);

  var mm = location.search.match(/[?&]mode=(\d)/);
  if (mm) {
    var i = Math.max(0, Math.min(2, parseInt(mm[1], 10) - 1));
    start(MODES[i]);
  }

  // 截图调试：直接看结算
  var em = location.search.match(/[?&]end=(\d)/);
  if (em) {
    var ei = Math.max(0, Math.min(2, parseInt(em[1], 10) - 1));
    start(MODES[ei]);
    st.score = [1000, 1500, 2000][ei];
    endGame(true);
  }
})();
