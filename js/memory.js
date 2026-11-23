/* 记忆翻牌 · 小虎鲸的游戏屋 */
(function () {
  'use strict';

  var ALL = [
    'd66', 'd128', 'd167', 'd187', 'd200', 'd209',
    'd212', 'd214', 'd222', 'd240', 'd244', 'd280', 'd295', 'd296',
    'd315', 'd321', 'd322', 'd337', 'd338', 'd342', 'd355', 'd366', 'd372', 'd376'
  ];

  var MODES = [
    { id: 1, name: '第 1 局', pairs: 6, cols: 4, y: 2.0, imgs: ALL.slice(0, 6) },
    { id: 2, name: '第 2 局', pairs: 8, cols: 4, y: 1.5, imgs: ALL.slice(6, 14) },
    { id: 3, name: '第 3 局', pairs: 10, cols: 5, y: 1.0, imgs: ALL.slice(14, 24) }
  ];

  var board = document.getElementById('board');
  var hud = document.getElementById('hud');
  var viewModes = document.getElementById('view-modes');
  var viewOver = document.getElementById('over-overlay');

  var st = {
    running: false,
    mode: MODES[0],
    cards: [],
    moves: 0,
    pairs: 0,
    start: 0,
    timer: null
  };

  function showView(v) {
    viewModes.hidden = v !== 'modes';
    viewOver.hidden = v !== 'over';
    hud.classList.toggle('on', v === 'play');
  }

  /* ---------- 建牌 ---------- */
  function build() {
    var m = st.mode;
    var total = m.pairs * 2;
    var deck = [];
    for (var i = 0; i < m.pairs; i++) {
      deck.push(m.imgs[i], m.imgs[i]);
    }
    // 洗牌
    for (var k = deck.length - 1; k > 0; k--) {
      var j = Math.floor(Math.random() * (k + 1));
      var t = deck[k]; deck[k] = deck[j]; deck[j] = t;
    }

    board.innerHTML = '';
    var rows = Math.ceil(total / m.cols);
    var gap = 10;
    var pad = 36;
    var wrapEl = document.getElementById('mem-wrap');
    var availW = wrapEl.clientWidth - pad;
    var availH = wrapEl.clientHeight - pad;
    var cell = Math.min(
      (availW - gap * (m.cols - 1)) / m.cols,
      (availH - gap * (rows - 1)) / rows
    );
    cell = Math.max(24, Math.floor(cell));
    board.style.gridTemplateColumns = 'repeat(' + m.cols + ', ' + cell + 'px)';
    board.style.gridTemplateRows = 'repeat(' + rows + ', ' + cell + 'px)';
    board.style.justifyContent = 'center';
    board.style.alignContent = 'center';
    st.cards = [];

    deck.forEach(function (name) {
      var el = document.createElement('div');
      el.className = 'card';
      el.style.width = cell + 'px';
      el.style.height = cell + 'px';

      var inner = document.createElement('div');
      inner.className = 'card-inner';

      var back = document.createElement('div');
      back.className = 'card-face card-back';
      back.innerHTML = '<span>?</span>';

      var front = document.createElement('div');
      front.className = 'card-face card-front';
      var img = document.createElement('img');
      img.src = '../assets/memory/' + name + '.png';
      img.alt = '';
      img.draggable = false;
      front.appendChild(img);

      inner.appendChild(back);
      inner.appendChild(front);
      el.appendChild(inner);
      board.appendChild(el);

      var card = { el: el, name: name, faceUp: false, matched: false, timer: null };
      el.addEventListener('click', function () { flip(card); });
      st.cards.push(card);
    });
  }

  /* ---------- 翻牌 ---------- */
  function flip(card) {
    if (!st.running || card.matched || card.faceUp) return;
    card.faceUp = true;
    card.el.classList.add('flipped');
    st.moves++;
    document.getElementById('hud-moves').textContent = st.moves;

    card.timer = setTimeout(function () {
      if (!card.matched) {
        card.faceUp = false;
        card.el.classList.remove('flipped');
      }
    }, st.mode.y * 1000);

    checkPairs();
  }

  function checkPairs() {
    var lit = st.cards.filter(function (c) { return c.faceUp && !c.matched; });
    for (var i = 0; i < lit.length; i++) {
      for (var j = i + 1; j < lit.length; j++) {
        if (lit[i].name === lit[j].name) {
          matchPair(lit[i], lit[j]);
          return;
        }
      }
    }
  }

  function matchPair(a, b) {
    [a, b].forEach(function (c) {
      c.matched = true;
      if (c.timer) { clearTimeout(c.timer); c.timer = null; }
      c.el.classList.add('matched');
    });
    st.pairs++;
    document.getElementById('hud-pairs').textContent = st.pairs;

    if (st.pairs >= st.mode.pairs) win();
  }

  /* ---------- 计时 ---------- */
  function updateTimer() {
    var s = Math.floor((Date.now() - st.start) / 1000);
    var mm = Math.floor(s / 60);
    var ss = s % 60;
    document.getElementById('hud-time').textContent =
      (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
  }

  var WIN = {
    1: {
      bg: '../assets/memory-end-1.png',
      title: '全部配对了！',
      line: '六对都找齐了——这些小虎鲸一只都没走丢。'
    },
    2: {
      bg: '../assets/memory-end-2.png',
      title: '八对，全在！',
      line: '它们挤在一起等你翻完，还差一点就全找回来了。'
    },
    3: {
      bg: '../assets/memory-end-3.png',
      title: '十对全部配对',
      line: '散在海底的小虎鲸，都回家了。'
    }
  };

  function win() {
    st.running = false;
    clearInterval(st.timer);
    var secs = Math.floor((Date.now() - st.start) / 1000);
    var e = WIN[st.mode.id] || WIN[1];
    document.getElementById('over-title').textContent = e.title;
    document.getElementById('over-line').textContent = e.line;
    document.getElementById('over-note').textContent =
      st.mode.name + ' · 用时 ' + fmt(secs) + ' · 翻了 ' + st.moves + ' 次' +
      (st.moves <= st.mode.pairs * 2 ? ' · 几乎没翻错' : '');
    document.getElementById('over-bg').style.backgroundImage = 'url("' + e.bg + '")';
    showView('over');
  }

  function fmt(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ---------- 开始 ---------- */
  function start(mode) {
    st.mode = mode;
    st.running = true;
    st.moves = 0;
    st.pairs = 0;
    st.start = Date.now();
    document.getElementById('hud-moves').textContent = '0';
    document.getElementById('hud-pairs').textContent = '0';
    document.getElementById('hud-total').textContent = mode.pairs;
    document.getElementById('hud-time').textContent = '00:00';
    build();
    showView('play');
    clearInterval(st.timer);
    st.timer = setInterval(updateTimer, 500);
  }

  function toModes() {
    st.running = false;
    clearInterval(st.timer);
    board.innerHTML = '';
    showView('modes');
  }

  /* ---------- 按钮 ---------- */
  var modeList = document.getElementById('mode-list');
  MODES.forEach(function (m) {
    var b = document.createElement('button');
    b.className = 'mode-btn';
    b.innerHTML = '<b>' + m.name + '</b><span>' + (m.pairs * 2) + ' 张 · 记住 ' + m.y + ' 秒</span>';
    b.addEventListener('click', function () { start(m); });
    modeList.appendChild(b);
  });

  document.getElementById('btn-again').addEventListener('click', function () { start(st.mode); });
  document.getElementById('btn-to-modes').addEventListener('click', toModes);

  /* ---------- 启动 ---------- */
  showView('modes');
  requestAnimationFrame(function () {});

  var mm = location.search.match(/[?&]mode=(\d)/);
  if (mm) {
    var i = Math.max(0, Math.min(2, parseInt(mm[1], 10) - 1));
    start(MODES[i]);
  }

  // 截图调试：直接进胜利结算
  if (location.search.indexOf('win=1') >= 0) {
    setTimeout(function () {
      st.cards.forEach(function (c) {
        c.matched = true;
        c.el.classList.add('flipped', 'matched');
      });
      st.pairs = st.mode.pairs;
      st.moves = st.mode.pairs * 2;
      win();
    }, 700);
  }

  // 截图调试：翻开一对 + 一张单着的
  if (location.search.indexOf('peek=1') >= 0) {
    setTimeout(function () {
      if (!st.cards.length) return;
      var first = st.cards[0];
      var mate = null, other = null;
      for (var i = 1; i < st.cards.length; i++) {
        if (st.cards[i].name === first.name) mate = st.cards[i];
        else if (!other && st.cards[i].name !== first.name) other = st.cards[i];
      }
      flip(first);
      if (other) flip(other);
      if (mate) flip(mate);
    }, 800);
  }
})();
