/* 打地鼠 · 小虎鲸的游戏屋 */
(function () {
  'use strict';

  var board = document.getElementById('board');
  var hud = document.getElementById('hud');
  var BEST_KEY = 'orca-whack-best';
  var ROUND_SECONDS = 60;

  var POPS = ['pop1', 'pop2', 'pop3', 'pop4', 'pop5', 'pop6'];
  var HITS = ['hit1', 'hit2', 'hit3'];

  var MODES = [
    { id: 1, name: '第 1 局', sub: '慢慢来，来得及', stay: 1.35, gap: 0.95, multi: 1 },
    { id: 2, name: '第 2 局', sub: '两只一起冒', stay: 1.10, gap: 0.70, multi: 2 },
    { id: 3, name: '第 3 局', sub: '三只，手要快', stay: 0.92, gap: 0.50, multi: 3 }
  ];

  var st = {
    running: false,
    mode: MODES[0],
    score: 0,
    combo: 0,
    bestCombo: 0,
    miss: 0,
    time: 0,
    holes: [],
    spawnAcc: 0,
    tick: null,
    raf: null,
    last: 0
  };

  var MAX_MISS = 3;

  var ENDINGS = {
    1: {
      bg: '../assets/whack-end-1.png',
      title: '第 1 局 · 敲完啦',
      line: '虎鲸在冰里翻了个身——手速不错嘛。'
    },
    2: {
      bg: '../assets/whack-end-2.png',
      title: '第 2 局 · 稳住了',
      line: '冰块上的蓝莓一颗没掉，可以可以。'
    },
    3: {
      bg: '../assets/whack-end-3.png',
      title: '第 3 局 · 全部通关',
      line: '三只一起冒也没难住你，虎鲸都躲不及了。'
    },
    miss: {
      bg: '../assets/whack-end-miss.png',
      title: '漏了三只，被溜走了',
      line: '虎鲸吐着舌头咕噜噜：「下次看准一点嘛～」'
    }
  };

  var viewModes = document.getElementById('view-modes');
  var viewOver = document.getElementById('over-overlay');

  function showView(v) {
    viewModes.hidden = v !== 'modes';
    viewOver.hidden = v !== 'over';
    hud.classList.toggle('on', v === 'play');
    if (paw) {
      paw.style.display = v === 'over' ? 'none' : '';
      document.body.classList.toggle('paw-page', v !== 'over');
    }
  }

  /* ---------- 建洞 ---------- */
  function buildHoles() {
    board.innerHTML = '';
    st.holes = [];
    for (var i = 0; i < 9; i++) {
      var el = document.createElement('div');
      el.className = 'hole';
      el.dataset.i = String(i);

      var img = document.createElement('img');
      img.className = 'mole';
      img.alt = '';
      img.draggable = false;
      el.appendChild(img);

      board.appendChild(el);
      st.holes.push({ el: el, img: img, active: false, hit: false, timer: null });
    }
  }

  /* ---------- 冒头 ---------- */
  function spawn() {
    if (!st.running) return;
    var free = [];
    for (var i = 0; i < st.holes.length; i++) {
      if (!st.holes[i].active) free.push(st.holes[i]);
    }
    if (!free.length) return;
    var h = free[Math.floor(Math.random() * free.length)];
    if (h.timer) clearTimeout(h.timer);

    h.active = true;
    h.hit = false;
    h.img.src = '../assets/whack/' + POPS[Math.floor(Math.random() * POPS.length)] + '.png';
    h.el.classList.remove('hit');
    // 强制重排，保证过渡生效
    void h.el.offsetWidth;
    h.el.classList.add('up');

    var stay = st.mode.stay * (0.85 + Math.random() * 0.4);
    h.timer = setTimeout(function () { retreat(h, false); }, stay * 1000);
  }

  function retreat(h, wasHit) {
    if (h.timer) { clearTimeout(h.timer); h.timer = null; }
    h.active = false;
    h.el.classList.remove('up');
    if (!wasHit) {
      // 漏掉：连击清零 + miss +1
      st.combo = 0;
      st.miss++;
      updateHud();
      if (st.miss >= MAX_MISS) {
        endGame('miss');
        return;
      }
    }
    setTimeout(function () { h.el.classList.remove('hit'); }, 60);
  }

  /* ---------- 敲击 ---------- */
  function popScore(holeEl, text) {
    var s = document.createElement('span');
    s.className = 'pop-score';
    s.textContent = text;
    holeEl.appendChild(s);
    setTimeout(function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    }, 720);
  }

  board.addEventListener('pointerdown', function (e) {
    if (!st.running) return;
    var el = e.target.closest('.hole');
    if (!el) return;
    var h = null;
    for (var i = 0; i < st.holes.length; i++) {
      if (st.holes[i].el === el) { h = st.holes[i]; break; }
    }
    if (!h || !h.active || h.hit) return;

    h.hit = true;
    st.combo++;
    if (st.combo > st.bestCombo) st.bestCombo = st.combo;

    var mult = Math.min(5, 1 + Math.floor(st.combo / 5));
    var gain = mult;
    st.score += gain;
    updateHud();
    popScore(el, '+' + gain);

    h.img.src = '../assets/whack/' + HITS[Math.floor(Math.random() * HITS.length)] + '.png';
    h.el.classList.add('hit');

    setTimeout(function () { retreat(h, true); }, 320);
  });

  function updateHud() {
    document.getElementById('hud-score').textContent = st.score;
    document.getElementById('hud-combo').textContent = st.combo;
    var m = document.getElementById('hud-miss');
    m.textContent = st.miss;
    m.classList.toggle('danger', st.miss >= MAX_MISS - 1);
  }

  /* ---------- 主循环 ---------- */
  function loop(ts) {
    if (st.running) {
      var dt = Math.min(0.06, (ts - st.last) / 1000 || 0);
      st.last = ts;
      st.time += dt;

      st.spawnAcc += dt;
      var active = 0;
      for (var i = 0; i < st.holes.length; i++) if (st.holes[i].active) active++;
      if (active < st.mode.multi && st.spawnAcc >= st.mode.gap) {
        st.spawnAcc = 0;
        spawn();
      }

      var remain = Math.max(0, Math.ceil(ROUND_SECONDS - st.time));
      document.getElementById('hud-time').textContent = remain;
      if (st.time >= ROUND_SECONDS) endGame('time');
    }
    requestAnimationFrame(loop);
  }

  /* ---------- 开始 / 结束 ---------- */
  function start() {
    st.running = true;
    st.score = 0;
    st.combo = 0;
    st.bestCombo = 0;
    st.miss = 0;
    st.time = 0;
    st.spawnAcc = 0;
    st.last = performance.now();
    buildHoles();
    updateHud();
    document.getElementById('hud-time').textContent = ROUND_SECONDS;
    showView('play');
  }

  function endGame(reason) {
    st.running = false;
    st.holes.forEach(function (h) {
      if (h.timer) clearTimeout(h.timer);
      h.active = false;
      h.el.classList.remove('up');
    });

    var best = +(localStorage.getItem(BEST_KEY) || 0);
    var isNew = st.score > best;
    if (isNew) {
      try { localStorage.setItem(BEST_KEY, String(st.score)); } catch (e) {}
    }

    var e = ENDINGS[reason === 'miss' ? 'miss' : String(st.mode.id)] || ENDINGS[1];
    document.getElementById('over-bg').style.backgroundImage = 'url("' + e.bg + '")';
    document.getElementById('over-title').textContent = e.title;
    document.getElementById('over-line').textContent = e.line;
    document.getElementById('over-note').textContent =
      '得分 ' + st.score + ' · 最高连击 ' + st.bestCombo +
      (isNew ? ' · 新纪录！' : ' · 最高分 ' + best);
    showView('over');
  }

  function toModes() {
    st.running = false;
    st.holes.forEach(function (h) {
      if (h.timer) clearTimeout(h.timer);
      h.el.classList.remove('up');
    });
    buildHoles();
    document.getElementById('best-score').textContent = localStorage.getItem(BEST_KEY) || 0;
    showView('modes');
  }

  /* ---------- 按钮 ---------- */
  var modeList = document.getElementById('mode-list');
  MODES.forEach(function (m) {
    var b = document.createElement('button');
    b.className = 'mode-btn';
    b.innerHTML = '<b>' + m.name + '</b><span>' + m.sub + ' · 60 秒</span>';
    b.addEventListener('click', function () {
      st.mode = m;
      start();
    });
    modeList.appendChild(b);
  });

  document.getElementById('btn-again').addEventListener('click', start);
  document.getElementById('btn-to-modes').addEventListener('click', toModes);

  /* ---------- 猫爪光标 ---------- */
  var paw = document.getElementById('paw');
  if (paw) {
    paw.style.left = window.innerWidth / 2 + 'px';
    paw.style.top = window.innerHeight / 2 + 'px';
    document.addEventListener('pointermove', function (e) {
      paw.style.left = e.clientX + 'px';
      paw.style.top = e.clientY + 'px';
    }, { passive: true });
    document.addEventListener('pointerdown', function () {
      paw.classList.add('whack');
    });
    document.addEventListener('pointerup', function () {
      paw.classList.remove('whack');
    });
    document.addEventListener('pointercancel', function () {
      paw.classList.remove('whack');
    });
  }

  /* ---------- 启动 ---------- */
  buildHoles();
  toModes();
  showView('modes');
  requestAnimationFrame(loop);

  var em = location.search.match(/[?&]end=(\w+)/);
  if (em) {
    var ek = em[1];
    if (ek === 'miss') {
      st.mode = MODES[0];
      st.score = 30;
      st.bestCombo = 6;
      st.miss = 3;
      endGame('miss');
    } else {
      st.mode = MODES[Math.max(0, Math.min(2, (+ek) - 1))];
      st.score = ek === '1' ? 52 : (ek === '2' ? 88 : 120);
      st.bestCombo = ek === '1' ? 9 : (ek === '2' ? 14 : 21);
      endGame('time');
    }
  }

  if (location.search.indexOf('demo=1') >= 0) {
    st.mode = MODES[0];
    start();
    // 摆一排给截图看
    var demo = [];
    for (var i = 0; i < st.holes.length; i++) {
      if (i % 2 === 0) {
        st.holes[i].active = true;
        st.holes[i].img.src = '../assets/whack/' + POPS[i % POPS.length] + '.png';
        st.holes[i].el.classList.add('up');
      }
    }
    st.score = 42;
    st.combo = 7;
    st.miss = 1;
    updateHud();
  }
})();
